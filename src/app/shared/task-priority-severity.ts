import type { TaskPriority } from './models';

export const TASK_PRIORITY_SEVERITY: Record<TaskPriority, 'success' | 'warn' | 'danger'> = {
  low: 'success',
  medium: 'warn',
  high: 'danger',
};
