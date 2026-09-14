import { Component, inject, input } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { AssistantService } from '../../../core/services/assistant.service';
import type { PendingConfirmation } from '../../../shared/models';

@Component({
  imports: [ButtonModule],
  selector: 'app-confirmation-prompt',
  styleUrl: './confirmation-prompt.css',
  templateUrl: './confirmation-prompt.html',
})
export class ConfirmationPrompt {
  readonly confirmation = input.required<PendingConfirmation>();

  private readonly assistantService = inject(AssistantService);

  protected confirm(confirmed: boolean): void {
    void this.assistantService.confirmPendingTool(confirmed);
  }
}
