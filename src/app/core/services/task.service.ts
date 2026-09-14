import { Injectable, effect, signal } from '@angular/core';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase';
import { AuthService } from './auth.service';
import type { Task, TaskPriority } from '../../shared/models';

export interface CreateTaskInput {
  title: string;
  notes?: string;
  dueDate?: Date;
  priority?: TaskPriority;
  tags?: string[];
}

export type UpdateTaskInput = Partial<
  Pick<Task, 'title' | 'notes' | 'dueDate' | 'priority' | 'status' | 'tags'>
>;

@Injectable({ providedIn: 'root' })
export class TaskService {
  readonly tasks = signal<Task[]>([]);

  private unsubscribe: Unsubscribe | null = null;

  constructor(private readonly authService: AuthService) {
    effect(() => {
      const user = this.authService.user();
      this.unsubscribe?.();
      this.unsubscribe = null;

      if (!user) {
        this.tasks.set([]);
        return;
      }

      const tasksQuery = query(
        collection(db, 'tasks'),
        where('userId', '==', user.uid),
        orderBy('dueDate', 'asc'),
      );
      this.unsubscribe = onSnapshot(tasksQuery, (snapshot) => {
        this.tasks.set(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Task));
      });
    });
  }

  async createTask(input: CreateTaskInput): Promise<void> {
    const user = this.authService.user();
    if (!user) throw new Error('Not signed in');

    await addDoc(collection(db, 'tasks'), {
      userId: user.uid,
      title: input.title,
      notes: input.notes ?? null,
      dueDate: input.dueDate ?? null,
      priority: input.priority ?? 'medium',
      status: 'open',
      tags: input.tags ?? [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  async updateTask(taskId: string, changes: UpdateTaskInput): Promise<void> {
    await updateDoc(doc(db, 'tasks', taskId), { ...changes, updatedAt: serverTimestamp() });
  }

  async completeTask(taskId: string): Promise<void> {
    await this.updateTask(taskId, { status: 'completed' });
  }

  async deleteTask(taskId: string): Promise<void> {
    await deleteDoc(doc(db, 'tasks', taskId));
  }
}
