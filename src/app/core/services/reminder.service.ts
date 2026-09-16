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
  Timestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase';
import { AuthService } from './auth.service';
import type { Reminder, ReminderRecurrence } from '../../shared/models';

export interface CreateReminderInput {
  message: string;
  triggerAt: Date;
  recurrence?: ReminderRecurrence;
}

export interface UpdateReminderInput {
  message: string;
  triggerAt: Date;
  recurrence?: ReminderRecurrence;
}

@Injectable({ providedIn: 'root' })
export class ReminderService {
  readonly reminders = signal<Reminder[]>([]);

  private unsubscribe: Unsubscribe | null = null;

  constructor(private readonly authService: AuthService) {
    effect(() => {
      const user = this.authService.user();
      this.unsubscribe?.();
      this.unsubscribe = null;

      if (!user) {
        this.reminders.set([]);
        return;
      }

      const remindersQuery = query(
        collection(db, 'reminders'),
        where('userId', '==', user.uid),
        orderBy('triggerAt', 'asc'),
      );
      this.unsubscribe = onSnapshot(remindersQuery, (snapshot) => {
        this.reminders.set(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Reminder));
      });
    });
  }

  async createReminder(input: CreateReminderInput): Promise<void> {
    const user = this.authService.user();
    if (!user) throw new Error('Not signed in');

    await addDoc(collection(db, 'reminders'), {
      userId: user.uid,
      message: input.message,
      triggerAt: Timestamp.fromDate(input.triggerAt),
      status: 'pending',
      recurrence: input.recurrence ?? null,
      createdAt: serverTimestamp(),
    });
  }

  async updateReminder(reminderId: string, input: UpdateReminderInput): Promise<void> {
    await updateDoc(doc(db, 'reminders', reminderId), {
      message: input.message,
      triggerAt: Timestamp.fromDate(input.triggerAt),
      recurrence: input.recurrence ?? null,
    });
  }

  async dismissReminder(reminderId: string): Promise<void> {
    await updateDoc(doc(db, 'reminders', reminderId), { status: 'dismissed' });
  }

  async cancelReminder(reminderId: string): Promise<void> {
    await deleteDoc(doc(db, 'reminders', reminderId));
  }
}
