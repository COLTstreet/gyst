import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { ReminderService } from '../../../core/services/reminder.service';
import type { Reminder, ReminderRecurrence } from '../../../shared/models';

@Component({
  imports: [
    DatePipe,
    FormsModule,
    ButtonModule,
    CardModule,
    DividerModule,
    DialogModule,
    InputTextModule,
    DatePickerModule,
    SelectModule,
    InputNumberModule,
    CheckboxModule,
  ],
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

  protected readonly frequencyOptions: { label: string; value: ReminderRecurrence['frequency'] }[] = [
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'Yearly', value: 'yearly' },
  ];

  protected readonly showDialog = signal(false);
  protected readonly editingId = signal<string | null>(null);
  protected readonly formMessage = signal('');
  protected readonly formTriggerAt = signal<Date | null>(null);
  protected readonly formRecurs = signal(false);
  protected readonly formFrequency = signal<ReminderRecurrence['frequency']>('daily');
  protected readonly formInterval = signal(1);

  protected readonly canSave = computed(() => !!this.formMessage().trim() && !!this.formTriggerAt());

  protected openCreateDialog(): void {
    this.editingId.set(null);
    this.formMessage.set('');
    this.formTriggerAt.set(null);
    this.formRecurs.set(false);
    this.formFrequency.set('daily');
    this.formInterval.set(1);
    this.showDialog.set(true);
  }

  protected openEditDialog(reminder: Reminder): void {
    this.editingId.set(reminder.id);
    this.formMessage.set(reminder.message);
    this.formTriggerAt.set(reminder.triggerAt.toDate());
    this.formRecurs.set(!!reminder.recurrence);
    this.formFrequency.set(reminder.recurrence?.frequency ?? 'daily');
    this.formInterval.set(reminder.recurrence?.interval ?? 1);
    this.showDialog.set(true);
  }

  protected async save(): Promise<void> {
    const message = this.formMessage().trim();
    const triggerAt = this.formTriggerAt();
    if (!message || !triggerAt) return;

    const recurrence = this.formRecurs()
      ? { frequency: this.formFrequency(), interval: this.formInterval() || 1 }
      : undefined;

    const id = this.editingId();
    if (id) {
      await this.reminderService.updateReminder(id, { message, triggerAt, recurrence });
    } else {
      await this.reminderService.createReminder({ message, triggerAt, recurrence });
    }
    this.showDialog.set(false);
  }

  protected async deleteFromDialog(): Promise<void> {
    const id = this.editingId();
    if (!id) return;
    await this.reminderService.cancelReminder(id);
    this.showDialog.set(false);
  }

  protected async cancelReminder(reminderId: string): Promise<void> {
    await this.reminderService.cancelReminder(reminderId);
  }
}
