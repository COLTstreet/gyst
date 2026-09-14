import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../../core/services/task.service';
import type { Task } from '../../../shared/models';

type TaskFilter = 'all' | 'today' | 'overdue';

@Component({
  imports: [DatePipe, RouterLink, CheckboxModule, ButtonModule, FormsModule],
  selector: 'app-task-list',
  styleUrl: './task-list.css',
  templateUrl: './task-list.html',
})
export class TaskList {
  private readonly taskService = inject(TaskService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly filter = signal<TaskFilter>('all');

  protected readonly filteredTasks = computed(() => {
    const tasks = this.taskService.tasks();
    const filter = this.filter();
    const today = new Date();

    if (filter === 'today') {
      return tasks.filter((t) => t.dueDate && sameDay(t.dueDate.toDate(), today));
    }
    if (filter === 'overdue') {
      return tasks.filter((t) => t.status === 'open' && t.dueDate && t.dueDate.toDate() < today);
    }
    return tasks;
  });

  constructor() {
    const due = this.route.snapshot.queryParamMap.get('due');
    if (due === 'today') this.filter.set('today');
  }

  protected setFilter(filter: TaskFilter): void {
    this.filter.set(filter);
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
