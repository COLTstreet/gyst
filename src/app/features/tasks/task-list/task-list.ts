import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { SelectButtonModule } from 'primeng/selectbutton';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../../core/services/task.service';
import { TASK_PRIORITY_SEVERITY } from '../../../shared/task-priority-severity';
import type { Task, TaskPriority } from '../../../shared/models';

type TaskFilter = 'all' | 'today' | 'overdue';

const PRIORITY_ORDER: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };

/** Open before completed; due-date tasks (soonest first) before no-due-date; ties broken by priority. */
function compareTasks(a: Task, b: Task): number {
  if (a.status !== b.status) {
    return a.status === 'completed' ? 1 : -1;
  }

  const aDue = a.dueDate?.toMillis();
  const bDue = b.dueDate?.toMillis();
  if (aDue !== undefined && bDue !== undefined && aDue !== bDue) {
    return aDue - bDue;
  }
  if (aDue !== undefined && bDue === undefined) return -1;
  if (aDue === undefined && bDue !== undefined) return 1;

  return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
}

@Component({
  imports: [DatePipe, RouterLink, CheckboxModule, ButtonModule, CardModule, TagModule, SelectButtonModule, FormsModule],
  selector: 'app-task-list',
  styleUrl: './task-list.css',
  templateUrl: './task-list.html',
})
export class TaskList {
  private readonly taskService = inject(TaskService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly prioritySeverity = TASK_PRIORITY_SEVERITY;

  protected readonly filterOptions: { label: string; value: TaskFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Today', value: 'today' },
    { label: 'Overdue', value: 'overdue' },
  ];

  protected readonly filter = signal<TaskFilter>('all');

  protected readonly filteredTasks = computed(() => {
    const tasks = this.taskService.tasks();
    const filter = this.filter();
    const today = new Date();

    let result = tasks;
    if (filter === 'today') {
      result = tasks.filter((t) => t.dueDate && sameDay(t.dueDate.toDate(), today));
    } else if (filter === 'overdue') {
      result = tasks.filter((t) => t.status === 'open' && t.dueDate && t.dueDate.toDate() < today);
    }

    return [...result].sort(compareTasks);
  });

  constructor() {
    const due = this.route.snapshot.queryParamMap.get('due');
    if (due === 'today') this.filter.set('today');
  }

  protected async toggleComplete(task: Task): Promise<void> {
    await this.taskService.updateTask(task.id, {
      status: task.status === 'completed' ? 'open' : 'completed',
    });
  }

  protected openNewTask(): void {
    this.router.navigateByUrl('/tasks/new');
  }
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
