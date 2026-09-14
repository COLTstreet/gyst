import { Timestamp } from 'firebase/firestore';

export interface PendingConfirmation {
  toolName: string;
  input: Record<string, unknown>;
  description: string;
}

export interface Conversation {
  id: string;
  userId: string;
  title?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  pendingConfirmation: PendingConfirmation | null;
}

export type MessageRole = 'user' | 'assistant';

export interface ToolCall {
  name: string;
  input: Record<string, unknown>;
  result?: unknown;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  toolCalls?: ToolCall[];
  createdAt: Timestamp;
}
