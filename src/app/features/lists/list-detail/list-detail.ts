import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { CardModule } from 'primeng/card';
import { FormsModule } from '@angular/forms';
import { ListService } from '../../../core/services/list.service';

@Component({
  imports: [CheckboxModule, ButtonModule, InputTextModule, InputGroupModule, InputGroupAddonModule, CardModule, FormsModule],
  selector: 'app-list-detail',
  styleUrl: './list-detail.css',
  templateUrl: './list-detail.html',
})
export class ListDetail {
  private readonly listService = inject(ListService);
  private readonly route = inject(ActivatedRoute);

  private readonly listId = this.route.snapshot.paramMap.get('id')!;

  protected readonly list = computed(() => this.listService.lists().find((l) => l.id === this.listId));
  protected readonly newItemText = signal('');

  /** Checked items sink to the bottom; order is otherwise preserved within each group. */
  protected readonly sortedItems = computed(() => {
    const items = this.list()?.items ?? [];
    return [...items].sort((a, b) => Number(a.checked) - Number(b.checked) || a.order - b.order);
  });

  protected async addItem(): Promise<void> {
    const text = this.newItemText().trim();
    if (!text) return;
    await this.listService.addItem(this.listId, text);
    this.newItemText.set('');
  }

  protected async toggleChecked(itemId: string, checked: boolean): Promise<void> {
    await this.listService.updateItem(this.listId, itemId, { checked });
  }

  protected async removeItem(itemId: string): Promise<void> {
    await this.listService.removeItem(this.listId, itemId);
  }
}
