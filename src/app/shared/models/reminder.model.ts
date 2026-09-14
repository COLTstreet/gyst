import { Timestamp } from 'firebase/firestore';

export type ReminderStatus = 'pending' | 'sent' | 'dismissed';

export interface ReminderRecurrence {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
}

export interface Reminder {
  id: string;
  userId: string;
  message: string;
  triggerAt: Timestamp;
  status: ReminderStatus;
  recurrence?: ReminderRecurrence;
  createdAt: Timestamp;
}
