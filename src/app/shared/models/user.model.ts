import { Timestamp } from 'firebase/firestore';

export interface User {
  displayName: string;
  email: string;
  photoURL?: string;
  fcmTokens: string[];
  createdAt: Timestamp;
}
