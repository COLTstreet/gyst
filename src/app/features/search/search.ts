import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { CardModule } from 'primeng/card';
import { TaskService } from '../../core/services/task.service';
import { ListService } from '../../core/services/list.service';
import { DailyNoteService } from '../../core/services/daily-note.service';
import type { DailyNote, List, ListItem, NoteEntry, Task } from '../../shared/models';

const MAX_RESULTS_PER_GROUP = 15;

/** Parses a YYYY-MM-DD dailyNotes date key back into a local-midnight Date. */
function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

@Component({
  imports: [DatePipe, FormsModule, InputTextModule, IconFieldModule, InputIconModule, CardModule],
  selector: 'app-search',
  styleUrl: './search.css',
  templateUrl: './search.html',
})
export class Search implements OnInit {
  private readonly taskService = inject(TaskService);
  private readonly listService = inject(ListService);
  private readonly dailyNoteService = inject(DailyNoteService);
  private readonly router = inject(Router);

  protected readonly term = signal('');
  protected readonly allNotes = signal<DailyNote[]>([]);
  protected readonly notesLoaded = signal(false);

  private readonly normalizedTerm = computed(() => this.term().trim().toLowerCase());

  protected readonly taskResults = computed<Task[]>(() => {
    const term = this.normalizedTerm();
    if (!term) return [];
    return this.taskService
      .tasks()
      .filter((t) => t.title.toLowerCase().includes(term) || (t.notes ?? '').toLowerCase().includes(term))
      .slice(0, MAX_RESULTS_PER_GROUP);
  });

  protected readonly listResults = computed<{ list: List; item: ListItem }[]>(() => {
    const term = this.normalizedTerm();
    if (!term) return [];

    const results: { list: List; item: ListItem }[] = [];
    for (const list of this.listService.lists()) {
      for (const item of list.items) {
        if (item.text.toLowerCase().includes(term)) results.push({ list, item });
      }
    }
    return results.slice(0, MAX_RESULTS_PER_GROUP);
  });

  protected readonly noteResults = computed<{ note: DailyNote; entry: NoteEntry }[]>(() => {
    const term = this.normalizedTerm();
    if (!term) return [];

    const results: { note: DailyNote; entry: NoteEntry }[] = [];
    for (const note of this.allNotes()) {
      for (const entry of note.entries) {
        if (entry.text.toLowerCase().includes(term)) results.push({ note, entry });
      }
    }
    return results.slice(0, MAX_RESULTS_PER_GROUP);
  });

  protected readonly hasAnyResults = computed(
    () => this.taskResults().length > 0 || this.listResults().length > 0 || this.noteResults().length > 0,
  );

  async ngOnInit(): Promise<void> {
    try {
      this.allNotes.set(await this.dailyNoteService.getAllNotes());
    } catch (err) {
      // A brand-new composite index can take several minutes to finish
      // building server-side; surfacing that as a user-facing error would
      // just be confusing noise for something transient and unactionable.
      console.warn('Failed to load notes for search', err);
    }
    this.notesLoaded.set(true);
  }

  protected openTask(task: Task): void {
    this.router.navigate(['/tasks', task.id]);
  }

  protected openList(list: List): void {
    this.router.navigate(['/lists', list.id]);
  }

  protected openNote(note: DailyNote): void {
    this.dailyNoteService.setViewedDate(parseDateKey(note.date));
    this.router.navigateByUrl('/today');
  }
}
