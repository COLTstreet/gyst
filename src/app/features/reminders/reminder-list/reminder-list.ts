import { Component, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ReminderService } from '../../../core/services/reminder.service';

@Component({
  imports: [DatePipe, ButtonModule],
  selector: 'app-reminder-list',
  styleUrl: './reminder-list.css',
  templateUrl: './reminder-list.html',
})
export class ReminderList {
  private readonly reminderService = inject(ReminderService);

  protected readonly upcoming = computed(() =>
    this.reminderService
      .reminders()
      .filter((r) => r.status === 'pending')
      .sort((a, b) => a.triggerAt.toMillis() - b.triggerAt.toMillis()),
  );

  protected readonly past = computed(() =>
    this.reminderService
      .reminders()
      .filter((r) => r.status !== 'pending')
      .sort((a, b) => b.triggerAt.toMillis() - a.triggerAt.toMillis()),
  );

  protected async cancelReminder(reminderId: string): Promise<void> {
    await this.reminderService.cancelReminder(reminderId);
  }
}
