import { db } from '../shared/firestore';

/**
 * Static system prompt + tool definitions live here and in toolDefinitions.ts
 * as their own functions (not inlined into chat.ts) so a `cache_control:
 * { type: "ephemeral" }` block can be added to this content later — caching
 * needs a stable, byte-identical prefix, which falls apart if this text is
 * assembled inline alongside per-turn data.
 */
export function buildSystemPrompt(now: Date): string {
  return `You are the assistant inside GYST (Get Your Shit Together), a personal single-user \
task/list/reminder/journal app. You act on the user's behalf using the tools provided.

Current date/time: ${now.toISOString()} (resolve relative phrases like "tomorrow at 2pm" against this).

Guidelines:
- Prefer calling a tool over asking a clarifying question when the request is unambiguous.
- Destructive tools (delete_task, cancel_reminder) require the user to confirm before they run —
  after you call one, wait for the result rather than assuming it happened.
- Daily notes are not included in your context below; call get_daily_notes if you need them.
- Keep replies short and conversational — this is a chat panel, not a document.`;
}

export interface CurrentContext {
  tasks: Array<{ id: string; title: string; status: string; dueDate?: string; priority: string }>;
  lists: Array<{ id: string; name: string; itemCount: number }>;
  reminders: Array<{ id: string; message: string; status: string; triggerAt: string }>;
  /**
   * Section metadata only (id/title/type), not item contents — enough for
   * the model to target add_to_carole_section / mark_gift_purchased by id
   * without the full page bloating every prompt.
   */
  caroleSections: Array<{ id: string; title: string; type: string }>;
}

/** Semi-dynamic snapshot — changes turn to turn, but far less than the message history. */
export async function buildCurrentContext(userId: string): Promise<string> {
  const [tasksSnap, listsSnap, remindersSnap, caroleSnap] = await Promise.all([
    db.collection('tasks').where('userId', '==', userId).where('status', '==', 'open').get(),
    db.collection('lists').where('userId', '==', userId).get(),
    db.collection('reminders').where('userId', '==', userId).where('status', '==', 'pending').get(),
    db.collection('caroleProfile').doc(userId).get(),
  ]);

  const context: CurrentContext = {
    tasks: tasksSnap.docs.map((d) => ({
      id: d.id,
      title: d.data()['title'],
      status: d.data()['status'],
      dueDate: d.data()['dueDate']?.toDate?.().toISOString(),
      priority: d.data()['priority'],
    })),
    lists: listsSnap.docs.map((d) => ({
      id: d.id,
      name: d.data()['name'],
      itemCount: (d.data()['items'] ?? []).length,
    })),
    reminders: remindersSnap.docs.map((d) => ({
      id: d.id,
      message: d.data()['message'],
      status: d.data()['status'],
      triggerAt: d.data()['triggerAt']?.toDate?.().toISOString(),
    })),
    caroleSections: ((caroleSnap.data()?.['sections'] ?? []) as Array<{ id: string; title: string; type: string }>).map(
      (s) => ({ id: s.id, title: s.title, type: s.type }),
    ),
  };

  return `Current context (open tasks, all lists, pending reminders, Carole page sections):\n${JSON.stringify(context, null, 2)}`;
}
