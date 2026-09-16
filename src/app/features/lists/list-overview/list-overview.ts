import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { FormsModule } from '@angular/forms';
import { ListService } from '../../../core/services/list.service';
import type { List } from '../../../shared/models';

@Component({
  imports: [RouterLink, ButtonModule, DialogModule, InputTextModule, CardModule, ConfirmDialogModule, FormsModule],
  providers: [ConfirmationService],
  selector: 'app-list-overview',
  styleUrl: './list-overview.css',
  templateUrl: './list-overview.html',
})
export class ListOverview {
  protected readonly listService = inject(ListService);
  private readonly confirmationService = inject(ConfirmationService);

  protected readonly showCreateDialog = signal(false);
  protected readonly newListName = signal('');

  protected openCreateDialog(): void {
    this.newListName.set('');
    this.showCreateDialog.set(true);
  }

  protected async createList(): Promise<void> {
    const name = this.newListName().trim();
    if (!name) return;
    await this.listService.createList(name);
    this.showCreateDialog.set(false);
  }

  protected confirmDeleteList(event: Event, list: List): void {
    event.preventDefault();
    event.stopPropagation();
    this.confirmationService.confirm({
      message: `Delete "${list.name}" and all its items? This cannot be undone.`,
      header: 'Delete list',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        await this.listService.deleteList(list.id);
      },
    });
  }
}
