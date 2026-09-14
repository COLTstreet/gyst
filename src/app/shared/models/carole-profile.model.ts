import { Timestamp } from 'firebase/firestore';

export type CaroleSectionType = 'checklist' | 'notes' | 'keyValue';

export interface CaroleChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface CaroleKeyValueItem {
  id: string;
  key: string;
  value: string;
}

export interface CaroleNoteItem {
  id: string;
  text: string;
}

export type CaroleSectionItem = CaroleChecklistItem | CaroleKeyValueItem | CaroleNoteItem;

export interface CaroleSection {
  id: string;
  title: string;
  order: number;
  type: CaroleSectionType;
  items: CaroleSectionItem[];
}

export interface CaroleProfile {
  /** Document id is the userId — single doc per user. */
  sections: CaroleSection[];
  updatedAt: Timestamp;
}
