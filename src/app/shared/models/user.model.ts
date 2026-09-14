import { Timestamp } from 'firebase/firestore';

export interface User {
  displayName: string;
  email: string;
  photoURL?: string;
  googleCalendarConnected: boolean;
  /** Admin SDK access only — never exposed to the client, see firestore.rules. */
  googleRefreshToken?: string;
  fcmTokens: string[];
  createdAt: Timestamp;
}
