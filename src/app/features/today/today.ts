import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { DailyNoteService } from '../../core/services/daily-note.service';
import { TaskService } from '../../core/services/task.service';
import { ReminderService } from '../../core/services/reminder.service';

@Component({
  imports: [ButtonModule, InputTextModule, FormsModule, DatePipe],
  selector: 'app-today',
  styleUrl: './today.css',
  templateUrl: './today.html',
})
export class Today {
  private readonly router = inject(Router);
  protected readonly dailyNoteService = inject(DailyNoteService);
  private readonly taskService = inject(TaskService);
  private readonly reminderService = inject(ReminderService);

  protected readonly draft = signal('');

  protected readonly viewedDate = this.dailyNoteService.viewedDate;
  protected readonly entries = computed(() => this.dailyNoteService.currentNote()?.entries ?? []);

  protected readonly isToday = computed(() => sameDay(this.viewedDate(), new Date()));

  protected readonly tasksDueTodayCount = computed(() => {
    const today = new Date();
    return this.taskService
      .tasks()
      .filter((t) => t.status === 'open' && t.dueDate && sameDay(t.dueDate.toDate(), today)).length;
  });

  protected readonly pendingRemindersCount = computed(
    () => this.reminderService.reminders().filter((r) => r.status === 'pending').length,
  );

  protected async addEntry(): Promise<void> {
    const text = this.draft().trim();
    if (!text) return;
    await this.dailyNoteService.addEntry(text);
    this.draft.set('');
  }

  protected goToPreviousDay(): void {
    this.shiftDay(-1);
  }

  protected goToNextDay(): void {
    this.shiftDay(1);
  }

  protected openTasksDueToday(): void {
    this.router.navigate(['/tasks'], { queryParams: { due: 'today' } });
  }

  protected openReminders(): void {
    this.router.navigateByUrl('/reminders');
  }

  private shiftDay(offset: number): void {
    const next = new Date(this.viewedDate());
    next.setDate(next.getDate() + offset);
    this.dailyNoteService.setViewedDate(next);
  }
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
