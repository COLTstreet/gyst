import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { ListService } from '../../../core/services/list.service';

@Component({
  imports: [RouterLink, ButtonModule, DialogModule, InputTextModule, FormsModule],
  selector: 'app-list-overview',
  styleUrl: './list-overview.css',
  templateUrl: './list-overview.html',
})
export class ListOverview {
  protected readonly listService = inject(ListService);

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
}
