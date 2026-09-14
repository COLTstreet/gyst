import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { CaroleService } from '../../core/services/carole.service';
import type {
  CaroleChecklistItem,
  CaroleKeyValueItem,
  CaroleNoteItem,
  CaroleSection,
  CaroleSectionType,
} from '../../shared/models';

@Component({
  imports: [FormsModule, ButtonModule, CheckboxModule, DialogModule, InputTextModule, SelectModule],
  selector: 'app-carole',
  styleUrl: './carole.css',
  templateUrl: './carole.html',
})
export class Carole {
  protected readonly caroleService = inject(CaroleService);

  protected readonly showAddSectionDialog = signal(false);
  protected readonly newSectionTitle = signal('');
  protected readonly newSectionType = signal<CaroleSectionType>('notes');
  protected readonly newItemDraft = signal<Record<string, string>>({});

  protected readonly sectionTypeOptions: { label: string; value: CaroleSectionType }[] = [
    { label: 'Checklist', value: 'checklist' },
    { label: 'Notes', value: 'notes' },
    { label: 'Key / Value', value: 'keyValue' },
  ];

  protected asChecklist(items: CaroleSection['items']): CaroleChecklistItem[] {
    return items as CaroleChecklistItem[];
  }

  protected asKeyValue(items: CaroleSection['items']): CaroleKeyValueItem[] {
    return items as CaroleKeyValueItem[];
  }

  protected asNotes(items: CaroleSection['items']): CaroleNoteItem[] {
    return items as CaroleNoteItem[];
  }

  protected openAddSectionDialog(): void {
    this.newSectionTitle.set('');
    this.newSectionType.set('notes');
    this.showAddSectionDialog.set(true);
  }

  protected async createSection(): Promise<void> {
    const title = this.newSectionTitle().trim();
    if (!title) return;
    await this.caroleService.addSection(title, this.newSectionType());
    this.showAddSectionDialog.set(false);
  }

  protected draftFor(sectionId: string): string {
    return this.newItemDraft()[sectionId] ?? '';
  }

  protected setDraft(sectionId: string, value: string): void {
    this.newItemDraft.update((drafts) => ({ ...drafts, [sectionId]: value }));
  }

  protected async addItem(section: CaroleSection): Promise<void> {
    const text = this.draftFor(section.id).trim();
    if (!text) return;

    if (section.type === 'checklist') {
      await this.caroleService.addSectionItem(section.id, { id: crypto.randomUUID(), text, checked: false });
    } else if (section.type === 'notes') {
      await this.caroleService.addSectionItem(section.id, { id: crypto.randomUUID(), text });
    } else {
      const [key, ...rest] = text.split(':');
      await this.caroleService.addSectionItem(section.id, {
        id: crypto.randomUUID(),
        key: key.trim(),
        value: rest.join(':').trim(),
      });
    }
    this.setDraft(section.id, '');
  }

  protected async toggleChecklistItem(sectionId: string, itemId: string, checked: boolean): Promise<void> {
    await this.caroleService.updateSectionItem(sectionId, itemId, { checked });
  }
}
