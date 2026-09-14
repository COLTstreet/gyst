import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { TaskService } from '../../../core/services/task.service';
import type { TaskPriority } from '../../../shared/models';

@Component({
  imports: [FormsModule, InputTextModule, TextareaModule, DatePickerModule, SelectModule, ButtonModule],
  selector: 'app-task-form',
  styleUrl: './task-form.css',
  templateUrl: './task-form.html',
})
export class TaskForm {
  private readonly taskService = inject(TaskService);
  private readonly router = inject(Router);

  protected readonly title = signal('');
  protected readonly notes = signal('');
  protected readonly dueDate = signal<Date | null>(null);
  protected readonly priority = signal<TaskPriority>('medium');

  protected readonly priorityOptions: { label: string; value: TaskPriority }[] = [
    { label: 'Low', value: 'low' },
    { label: 'Medium', value: 'medium' },
    { label: 'High', value: 'high' },
  ];

  protected async save(): Promise<void> {
    const title = this.title().trim();
    if (!title) return;

    await this.taskService.createTask({
      title,
      notes: this.notes().trim() || undefined,
      dueDate: this.dueDate() ?? undefined,
      priority: this.priority(),
    });
    await this.router.navigateByUrl('/tasks');
  }

  protected cancel(): void {
    this.router.navigateByUrl('/tasks');
  }
}
