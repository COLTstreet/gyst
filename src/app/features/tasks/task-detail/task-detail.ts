import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DatePipe } from '@angular/common';
import { TaskService } from '../../../core/services/task.service';

@Component({
  imports: [ButtonModule, ConfirmDialogModule, DatePipe],
  providers: [ConfirmationService],
  selector: 'app-task-detail',
  styleUrl: './task-detail.css',
  templateUrl: './task-detail.html',
})
export class TaskDetail {
  private readonly taskService = inject(TaskService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly confirmationService = inject(ConfirmationService);

  private readonly taskId = this.route.snapshot.paramMap.get('id')!;

  protected readonly task = computed(() => this.taskService.tasks().find((t) => t.id === this.taskId));

  protected async toggleComplete(): Promise<void> {
    const task = this.task();
    if (!task) return;
    await this.taskService.updateTask(task.id, {
      status: task.status === 'completed' ? 'open' : 'completed',
    });
  }

  protected confirmDelete(): void {
    this.confirmationService.confirm({
      message: 'Delete this task? This cannot be undone.',
      header: 'Delete task',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        await this.taskService.deleteTask(this.taskId);
        await this.router.navigateByUrl('/tasks');
      },
    });
  }
}
