import Anthropic from '@anthropic-ai/sdk';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { FieldValue, type DocumentReference } from 'firebase-admin/firestore';
import { db } from '../shared/firestore';
import { requireUserId } from '../shared/auth';
import { buildSystemPrompt, buildCurrentContext } from './promptBuilder';
import { buildToolDefinitions } from './toolDefinitions';
import { executeTool } from './toolExecutor';
import { isDestructiveTool, describeDestructiveAction } from './destructiveTools';

const MODEL = 'claude-haiku-4-5-20251001';
const MAX_TOOL_ROUNDTRIPS = 6;

// Constructed lazily (not at module load) so importing this file — e.g. from
// index.ts alongside unrelated functions like checkReminders — doesn't throw
// just because ANTHROPIC_API_KEY isn't set in this environment.
let anthropic: Anthropic | undefined;
function getAnthropicClient(): Anthropic {
  anthropic ??= new Anthropic({ apiKey: process.env['ANTHROPIC_API_KEY'] });
  return anthropic;
}

type AnthropicMessage = Anthropic.MessageParam;

interface ChatRequestData {
  conversationId: string | null;
  message: string;
}

interface ConfirmToolRequestData {
  conversationId: string;
  confirmed: boolean;
}

/** Internal bookkeeping fields on the conversation doc — not part of the client-facing Conversation model. */
interface PendingToolState {
  pendingToolUseId: string;
  /** The Anthropic-format message history up to and including the assistant turn that requested this tool. */
  pendingMessages: AnthropicMessage[];
}

export const chat = onCall<ChatRequestData>(async (request) => {
  const userId = requireUserId(request);
  const { message } = request.data;

  const convRef = await getOrCreateConversation(userId, request.data.conversationId);
  const convSnap = await convRef.get();
  if (convSnap.data()?.['pendingConfirmation']) {
    throw new HttpsError('failed-precondition', 'Resolve the pending confirmation before sending another message.');
  }

  await convRef.collection('messages').add({
    role: 'user',
    content: message,
    createdAt: FieldValue.serverTimestamp(),
  });

  const history = await loadAnthropicHistory(convRef);
  await runTurn(convRef, userId, history);

  return { conversationId: convRef.id };
});

export const confirmTool = onCall<ConfirmToolRequestData>(async (request) => {
  const userId = requireUserId(request);
  const { conversationId, confirmed } = request.data;

  const convRef = db.collection('conversations').doc(conversationId);
  const convSnap = await convRef.get();
  if (!convSnap.exists || convSnap.data()?.['userId'] !== userId) {
    throw new HttpsError('not-found', 'Conversation not found.');
  }

  const pending = convSnap.data()?.['pendingConfirmation'];
  const pendingState = convSnap.data()?.['_pendingToolState'] as PendingToolState | undefined;
  if (!pending || !pendingState) {
    throw new HttpsError('failed-precondition', 'No pending confirmation on this conversation.');
  }

  const toolResultContent = confirmed
    ? JSON.stringify(await executeTool(userId, pending.toolName, pending.input))
    : JSON.stringify({ cancelled: true, reason: 'User declined this action.' });

  const messages: AnthropicMessage[] = [
    ...pendingState.pendingMessages,
    {
      role: 'user',
      content: [{ type: 'tool_result', tool_use_id: pendingState.pendingToolUseId, content: toolResultContent }],
    },
  ];

  await convRef.update({ pendingConfirmation: null, _pendingToolState: FieldValue.delete() });
  await runTurn(convRef, userId, messages);

  return;
});

async function getOrCreateConversation(userId: string, conversationId: string | null): Promise<DocumentReference> {
  if (conversationId) {
    const ref = db.collection('conversations').doc(conversationId);
    const snap = await ref.get();
    if (!snap.exists || snap.data()?.['userId'] !== userId) {
      throw new HttpsError('not-found', 'Conversation not found.');
    }
    return ref;
  }

  const ref = db.collection('conversations').doc();
  await ref.set({
    userId,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    pendingConfirmation: null,
  });
  return ref;
}

async function loadAnthropicHistory(convRef: DocumentReference): Promise<AnthropicMessage[]> {
  const snap = await convRef.collection('messages').orderBy('createdAt', 'asc').get();
  return snap.docs.map((d) => ({ role: d.data()['role'], content: d.data()['content'] }) as AnthropicMessage);
}

/**
 * Runs (or resumes) one logical turn: calls Claude, executes auto tools and
 * loops, and either persists a final assistant message or halts on a
 * destructive tool by setting pendingConfirmation.
 */
async function runTurn(convRef: DocumentReference, userId: string, startingMessages: AnthropicMessage[]): Promise<void> {
  const now = new Date();
  const system = [
    { type: 'text' as const, text: buildSystemPrompt(now) },
    { type: 'text' as const, text: await buildCurrentContext(userId) },
  ];
  const tools = buildToolDefinitions();

  let messages = [...startingMessages];
  const toolCalls: Array<{ name: string; input: Record<string, unknown>; result?: unknown }> = [];

  for (let i = 0; i < MAX_TOOL_ROUNDTRIPS; i++) {
    const response = await getAnthropicClient().messages.create({
      model: MODEL,
      max_tokens: 1024,
      system,
      tools,
      messages,
    });

    const toolUseBlock = response.content.find((block) => block.type === 'tool_use');
    const textBlock = response.content.find((block) => block.type === 'text');

    if (!toolUseBlock) {
      await saveAssistantMessage(convRef, textBlock?.type === 'text' ? textBlock.text : '', toolCalls);
      return;
    }

    const input = toolUseBlock.input as Record<string, unknown>;

    if (isDestructiveTool(toolUseBlock.name)) {
      const description = describeDestructiveAction(toolUseBlock.name, input);
      toolCalls.push({ name: toolUseBlock.name, input });

      await saveAssistantMessage(convRef, textBlock?.type === 'text' ? textBlock.text : description, toolCalls);
      await convRef.update({
        pendingConfirmation: { toolName: toolUseBlock.name, input, description },
        _pendingToolState: {
          pendingToolUseId: toolUseBlock.id,
          pendingMessages: [...messages, { role: 'assistant', content: response.content }],
        } satisfies PendingToolState,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return;
    }

    const result = await executeTool(userId, toolUseBlock.name, input);
    toolCalls.push({ name: toolUseBlock.name, input, result });

    messages = [
      ...messages,
      { role: 'assistant', content: response.content },
      {
        role: 'user',
        content: [{ type: 'tool_result', tool_use_id: toolUseBlock.id, content: JSON.stringify(result) }],
      },
    ];
  }

  await saveAssistantMessage(convRef, "I've made those changes.", toolCalls);
}

async function saveAssistantMessage(
  convRef: DocumentReference,
  content: string,
  toolCalls: Array<{ name: string; input: Record<string, unknown>; result?: unknown }>,
): Promise<void> {
  await convRef.collection('messages').add({
    role: 'assistant',
    content,
    toolCalls: toolCalls.length ? toolCalls : null,
    createdAt: FieldValue.serverTimestamp(),
  });
  await convRef.update({ updatedAt: FieldValue.serverTimestamp() });
}
