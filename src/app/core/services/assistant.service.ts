import { Injectable, effect, signal } from '@angular/core';
import { httpsCallable } from 'firebase/functions';
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, functions } from '../firebase';
import { AuthService } from './auth.service';
import type { Conversation, Message } from '../../shared/models';

interface ChatRequest {
  conversationId: string | null;
  message: string;
}

interface ChatResponse {
  conversationId: string;
}

interface ConfirmToolRequest {
  conversationId: string;
  confirmed: boolean;
}

/**
 * Chat is a persistent overlay, not a routed feature, so this service owns
 * "the current conversation" for the whole app rather than being scoped to
 * a single route's lifetime.
 */
@Injectable({ providedIn: 'root' })
export class AssistantService {
  readonly conversationId = signal<string | null>(null);
  readonly conversation = signal<Conversation | null>(null);
  readonly messages = signal<Message[]>([]);
  readonly sending = signal(false);

  private conversationUnsubscribe: Unsubscribe | null = null;
  private messagesUnsubscribe: Unsubscribe | null = null;

  private readonly chatFn = httpsCallable<ChatRequest, ChatResponse>(functions, 'chat');
  private readonly confirmToolFn = httpsCallable<ConfirmToolRequest, void>(functions, 'confirmTool');

  constructor(private readonly authService: AuthService) {
    effect(() => {
      const id = this.conversationId();
      this.conversationUnsubscribe?.();
      this.messagesUnsubscribe?.();
      this.conversationUnsubscribe = null;
      this.messagesUnsubscribe = null;

      if (!id) {
        this.conversation.set(null);
        this.messages.set([]);
        return;
      }

      this.conversationUnsubscribe = onSnapshot(doc(db, 'conversations', id), (snapshot) => {
        this.conversation.set(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Conversation) : null);
      });

      const messagesQuery = query(collection(db, 'conversations', id, 'messages'), orderBy('createdAt', 'asc'));
      this.messagesUnsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        this.messages.set(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Message));
      });
    });

    effect(() => {
      // A fresh sign-in starts a fresh conversation.
      if (!this.authService.user()) {
        this.conversationId.set(null);
      }
    });
  }

  async sendMessage(text: string): Promise<void> {
    this.sending.set(true);
    try {
      const result = await this.chatFn({ conversationId: this.conversationId(), message: text });
      this.conversationId.set(result.data.conversationId);
    } finally {
      this.sending.set(false);
    }
  }

  async confirmPendingTool(confirmed: boolean): Promise<void> {
    const id = this.conversationId();
    if (!id) return;

    this.sending.set(true);
    try {
      await this.confirmToolFn({ conversationId: id, confirmed });
    } finally {
      this.sending.set(false);
    }
  }

  startNewConversation(): void {
    this.conversationId.set(null);
  }
}
