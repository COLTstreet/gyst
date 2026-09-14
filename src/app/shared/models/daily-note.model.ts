import { Timestamp } from 'firebase/firestore';

export interface NoteEntry {
  id: string;
  text: string;
  timestamp: Timestamp;
  createdVia: 'manual' | 'assistant';
}

export interface DailyNote {
  /** Document id: `{userId}_{YYYY-MM-DD}` */
  id: string;
  userId: string;
  date: string;
  entries: NoteEntry[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
