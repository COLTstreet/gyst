import { Injectable, effect, signal } from '@angular/core';
import {
  arrayUnion,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase';
import { AuthService } from './auth.service';
import type { DailyNote, NoteEntry } from '../../shared/models';

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

@Injectable({ providedIn: 'root' })
export class DailyNoteService {
  /** The currently viewed day's note (see setViewedDate). Today's screen defaults to today. */
  readonly currentNote = signal<DailyNote | null>(null);
  readonly viewedDate = signal<Date>(new Date());

  private unsubscribe: Unsubscribe | null = null;

  constructor(private readonly authService: AuthService) {
    effect(() => {
      const user = this.authService.user();
      const date = this.viewedDate();
      this.unsubscribe?.();
      this.unsubscribe = null;

      if (!user) {
        this.currentNote.set(null);
        return;
      }

      const docId = `${user.uid}_${dateKey(date)}`;
      this.unsubscribe = onSnapshot(doc(db, 'dailyNotes', docId), (snapshot) => {
        this.currentNote.set(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as DailyNote) : null);
      });
    });
  }

  setViewedDate(date: Date): void {
    this.viewedDate.set(date);
  }

  async addEntry(text: string, createdVia: NoteEntry['createdVia'] = 'manual'): Promise<void> {
    const user = this.authService.user();
    if (!user) throw new Error('Not signed in');

    const date = this.viewedDate();
    const docId = `${user.uid}_${dateKey(date)}`;
    const ref = doc(db, 'dailyNotes', docId);
    // Firestore doesn't support serverTimestamp() sentinels inside arrays, so
    // entry timestamps are client-generated (fine at this granularity).
    const entry: NoteEntry = {
      id: crypto.randomUUID(),
      text,
      timestamp: Timestamp.now(),
      createdVia,
    };

    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, { entries: arrayUnion(entry), updatedAt: serverTimestamp() });
    } else {
      await setDoc(ref, {
        userId: user.uid,
        date: dateKey(date),
        entries: [entry],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  }

  async removeEntry(entryId: string): Promise<void> {
    const note = this.currentNote();
    if (!note) return;

    const entries = note.entries.filter((entry) => entry.id !== entryId);
    await updateDoc(doc(db, 'dailyNotes', note.id), { entries, updatedAt: serverTimestamp() });
  }
}
