import { Timestamp } from 'firebase/firestore';

export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'open' | 'completed';

export interface Task {
  id: string;
  userId: string;
  title: string;
  notes?: string;
  dueDate?: Timestamp;
  priority: TaskPriority;
  status: TaskStatus;
  tags?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
