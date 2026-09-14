import { Component, input } from '@angular/core';
import type { Message } from '../../../shared/models';

@Component({
  imports: [],
  selector: 'app-chat-message',
  styleUrl: './chat-message.css',
  templateUrl: './chat-message.html',
})
export class ChatMessage {
  readonly message = input.required<Message>();
}
