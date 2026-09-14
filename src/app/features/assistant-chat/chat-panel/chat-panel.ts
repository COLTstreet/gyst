import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { AssistantService } from '../../../core/services/assistant.service';
import { ChatMessage } from '../chat-message/chat-message';
import { ConfirmationPrompt } from '../confirmation-prompt/confirmation-prompt';

@Component({
  imports: [FormsModule, ButtonModule, InputTextModule, ChatMessage, ConfirmationPrompt],
  selector: 'app-chat-panel',
  styleUrl: './chat-panel.css',
  templateUrl: './chat-panel.html',
})
export class ChatPanel {
  protected readonly assistantService = inject(AssistantService);

  protected readonly open = signal(false);
  protected readonly draft = signal('');

  protected toggle(): void {
    this.open.update((value) => !value);
  }

  protected async send(): Promise<void> {
    const text = this.draft().trim();
    if (!text || this.assistantService.sending()) return;
    this.draft.set('');
    await this.assistantService.sendMessage(text);
  }
}
