import { Injectable, effect, signal } from '@angular/core';
import {
  addDoc,
  arrayUnion,
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
import type { List, ListItem } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class ListService {
  readonly lists = signal<List[]>([]);

  private unsubscribe: Unsubscribe | null = null;

  constructor(private readonly authService: AuthService) {
    effect(() => {
      const user = this.authService.user();
      this.unsubscribe?.();
      this.unsubscribe = null;

      if (!user) {
        this.lists.set([]);
        return;
      }

      const listsQuery = query(
        collection(db, 'lists'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'asc'),
      );
      this.unsubscribe = onSnapshot(listsQuery, (snapshot) => {
        this.lists.set(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as List));
      });
    });
  }

  async createList(name: string): Promise<void> {
    const user = this.authService.user();
    if (!user) throw new Error('Not signed in');

    await addDoc(collection(db, 'lists'), {
      userId: user.uid,
      name,
      items: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  async addItem(listId: string, text: string): Promise<void> {
    const list = this.lists().find((l) => l.id === listId);
    const item: ListItem = {
      id: crypto.randomUUID(),
      text,
      checked: false,
      order: list?.items.length ?? 0,
    };
    await updateDoc(doc(db, 'lists', listId), {
      items: arrayUnion(item),
      updatedAt: serverTimestamp(),
    });
  }

  async updateItem(listId: string, itemId: string, changes: Partial<Omit<ListItem, 'id'>>): Promise<void> {
    const list = this.lists().find((l) => l.id === listId);
    if (!list) return;

    const items = list.items.map((item) => (item.id === itemId ? { ...item, ...changes } : item));
    await updateDoc(doc(db, 'lists', listId), { items, updatedAt: serverTimestamp() });
  }

  async removeItem(listId: string, itemId: string): Promise<void> {
    const list = this.lists().find((l) => l.id === listId);
    if (!list) return;

    const items = list.items.filter((item) => item.id !== itemId);
    await updateDoc(doc(db, 'lists', listId), { items, updatedAt: serverTimestamp() });
  }

  async deleteList(listId: string): Promise<void> {
    await deleteDoc(doc(db, 'lists', listId));
  }
}
