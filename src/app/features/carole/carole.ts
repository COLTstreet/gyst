import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { CaroleService } from '../../core/services/carole.service';
import type {
  CaroleChecklistItem,
  CaroleKeyValueItem,
  CaroleNoteItem,
  CaroleSection,
  CaroleSectionItem,
  CaroleSectionType,
} from '../../shared/models';

@Component({
  imports: [
    FormsModule,
    ButtonModule,
    CheckboxModule,
    DialogModule,
    InputTextModule,
    InputGroupModule,
    InputGroupAddonModule,
    CardModule,
    SelectModule,
  ],
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

  protected readonly showEditDialog = signal(false);
  protected readonly editingSectionId = signal<string | null>(null);
  protected readonly editingItemId = signal<string | null>(null);
  protected readonly editingType = signal<CaroleSectionType>('notes');
  protected readonly editText = signal('');
  protected readonly editKey = signal('');
  protected readonly editValue = signal('');
  protected readonly editUrl = signal('');

  protected readonly canSaveEdit = computed(() =>
    this.editingType() === 'keyValue' ? !!this.editKey().trim() : !!this.editText().trim(),
  );

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

  protected openEditItem(section: CaroleSection, item: CaroleSectionItem): void {
    this.editingSectionId.set(section.id);
    this.editingItemId.set(item.id);
    this.editingType.set(section.type);

    this.editUrl.set('');
    if (section.type === 'keyValue') {
      const kv = item as CaroleKeyValueItem;
      this.editKey.set(kv.key);
      this.editValue.set(kv.value);
    } else {
      this.editText.set((item as CaroleNoteItem | CaroleChecklistItem).text);
      if (section.type === 'checklist') {
        this.editUrl.set((item as CaroleChecklistItem).url ?? '');
      }
    }

    this.showEditDialog.set(true);
  }

  protected async saveEditItem(): Promise<void> {
    const sectionId = this.editingSectionId();
    const itemId = this.editingItemId();
    if (!sectionId || !itemId) return;

    let changes: Partial<CaroleSectionItem>;
    if (this.editingType() === 'keyValue') {
      changes = { key: this.editKey().trim(), value: this.editValue().trim() };
    } else if (this.editingType() === 'checklist') {
      changes = { text: this.editText().trim(), url: normalizeUrl(this.editUrl()) };
    } else {
      changes = { text: this.editText().trim() };
    }

    await this.caroleService.updateSectionItem(sectionId, itemId, changes);
    this.showEditDialog.set(false);
  }

  protected async deleteEditItem(): Promise<void> {
    const sectionId = this.editingSectionId();
    const itemId = this.editingItemId();
    if (!sectionId || !itemId) return;

    await this.caroleService.removeSectionItem(sectionId, itemId);
    this.showEditDialog.set(false);
  }

  protected async removeItem(sectionId: string, itemId: string): Promise<void> {
    await this.caroleService.removeSectionItem(sectionId, itemId);
  }
}

/** Blank clears the link; a bare domain/path (no protocol) is assumed https. */
function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}
