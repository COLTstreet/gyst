import { Timestamp } from 'firebase/firestore';

export interface ListItem {
  id: string;
  text: string;
  checked: boolean;
  order: number;
}

export interface List {
  id: string;
  userId: string;
  name: string;
  items: ListItem[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
