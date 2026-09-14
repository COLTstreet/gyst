import { onSchedule } from 'firebase-functions/v2/scheduler';
import { Timestamp } from 'firebase-admin/firestore';
import { db, messaging } from '../shared/firestore';

interface ReminderRecurrence {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
}

function nextTrigger(current: Date, recurrence: ReminderRecurrence): Date {
  const next = new Date(current);
  switch (recurrence.frequency) {
    case 'daily':
      next.setDate(next.getDate() + recurrence.interval);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7 * recurrence.interval);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + recurrence.interval);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + recurrence.interval);
      break;
  }
  return next;
}

async function notifyUser(userId: string, title: string, body: string): Promise<void> {
  const userSnap = await db.collection('users').doc(userId).get();
  const tokens: string[] = userSnap.data()?.['fcmTokens'] ?? [];
  if (!tokens.length) return;

  await messaging.sendEachForMulticast({ tokens, notification: { title, body } }).catch((error) => {
    console.error(`Failed to notify user ${userId}`, error);
  });
}

export const checkReminders = onSchedule('every 5 minutes', async () => {
  const now = Timestamp.now();

  const dueRemindersSnap = await db
    .collection('reminders')
    .where('status', '==', 'pending')
    .where('triggerAt', '<=', now)
    .get();

  await Promise.all(
    dueRemindersSnap.docs.map(async (reminderDoc) => {
      const reminder = reminderDoc.data();
      await notifyUser(reminder['userId'], 'GYST reminder', reminder['message']);

      const recurrence = reminder['recurrence'] as ReminderRecurrence | null;
      if (recurrence) {
        await reminderDoc.ref.update({ triggerAt: Timestamp.fromDate(nextTrigger(now.toDate(), recurrence)) });
      } else {
        await reminderDoc.ref.update({ status: 'sent' });
      }
    }),
  );

  // Tasks have no "notified" flag, so this only fires for tasks whose due date
  // falls inside the current 5-minute window — a day-level due date without a
  // time will notify at local midnight UTC, which is an acceptable scaffold
  // default the user can revisit.
  const fiveMinutesAgo = Timestamp.fromMillis(now.toMillis() - 5 * 60 * 1000);
  const dueTasksSnap = await db
    .collection('tasks')
    .where('status', '==', 'open')
    .where('dueDate', '>', fiveMinutesAgo)
    .where('dueDate', '<=', now)
    .get();

  await Promise.all(
    dueTasksSnap.docs.map((taskDoc) => notifyUser(taskDoc.data()['userId'], 'Task due', taskDoc.data()['title'])),
  );
});
