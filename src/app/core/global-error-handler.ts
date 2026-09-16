import { ErrorHandler, Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { describeError } from './describe-error';

/**
 * Catches uncaught errors app-wide — including rejected promises from
 * fire-and-forget async calls in template event bindings (e.g.
 * `(click)="toggleComplete(task)"`), which is how most of this app's write
 * failures were previously silent. Relies on provideBrowserGlobalErrorListeners()
 * in app.config.ts to route window 'error'/'unhandledrejection' events here too.
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly messageService = inject(MessageService);

  handleError(error: unknown): void {
    console.error(error);
    this.messageService.add({
      severity: 'error',
      summary: 'Something went wrong',
      detail: describeError(error),
      life: 6000,
    });
  }
}
