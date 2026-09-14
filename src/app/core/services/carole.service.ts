import { Injectable, effect, signal } from '@angular/core';
import { doc, onSnapshot, serverTimestamp, setDoc, updateDoc, type Unsubscribe } from 'firebase/firestore';
import { db } from '../firebase';
import { AuthService } from './auth.service';
import type { CaroleProfile, CaroleSection, CaroleSectionItem, CaroleSectionType } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class CaroleService {
  readonly profile = signal<CaroleProfile | null>(null);

  private unsubscribe: Unsubscribe | null = null;

  constructor(private readonly authService: AuthService) {
    effect(() => {
      const user = this.authService.user();
      this.unsubscribe?.();
      this.unsubscribe = null;

      if (!user) {
        this.profile.set(null);
        return;
      }

      this.unsubscribe = onSnapshot(doc(db, 'caroleProfile', user.uid), (snapshot) => {
        this.profile.set(snapshot.exists() ? (snapshot.data() as CaroleProfile) : { sections: [], updatedAt: null as never });
      });
    });
  }

  async addSection(title: string, type: CaroleSectionType): Promise<void> {
    const user = this.authService.user();
    if (!user) throw new Error('Not signed in');

    const sections = this.profile()?.sections ?? [];
    const section: CaroleSection = {
      id: crypto.randomUUID(),
      title,
      order: sections.length,
      type,
      items: [],
    };

    await setDoc(
      doc(db, 'caroleProfile', user.uid),
      { sections: [...sections, section], updatedAt: serverTimestamp() },
      { merge: true },
    );
  }

  async addSectionItem(sectionId: string, item: CaroleSectionItem): Promise<void> {
    const user = this.authService.user();
    if (!user) throw new Error('Not signed in');

    const sections = (this.profile()?.sections ?? []).map((section) =>
      section.id === sectionId ? { ...section, items: [...section.items, item] } : section,
    );

    await updateDoc(doc(db, 'caroleProfile', user.uid), { sections, updatedAt: serverTimestamp() });
  }

  async updateSectionItem(sectionId: string, itemId: string, changes: Partial<CaroleSectionItem>): Promise<void> {
    const user = this.authService.user();
    if (!user) throw new Error('Not signed in');

    const sections = (this.profile()?.sections ?? []).map((section) => {
      if (section.id !== sectionId) return section;
      return {
        ...section,
        items: section.items.map((item) => (item.id === itemId ? { ...item, ...changes } : item)),
      };
    });

    await updateDoc(doc(db, 'caroleProfile', user.uid), { sections, updatedAt: serverTimestamp() });
  }
}
