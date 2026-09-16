import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: '',
    loadComponent: () => import('./layout/shell/shell').then((m) => m.Shell),
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'today' },
      {
        path: 'today',
        loadComponent: () => import('./features/today/today').then((m) => m.Today),
      },
      {
        path: 'tasks',
        loadComponent: () => import('./features/tasks/task-list/task-list').then((m) => m.TaskList),
      },
      {
        path: 'tasks/new',
        loadComponent: () => import('./features/tasks/task-form/task-form').then((m) => m.TaskForm),
      },
      {
        path: 'tasks/:id',
        loadComponent: () => import('./features/tasks/task-detail/task-detail').then((m) => m.TaskDetail),
      },
      {
        path: 'lists',
        loadComponent: () => import('./features/lists/list-overview/list-overview').then((m) => m.ListOverview),
      },
      {
        path: 'lists/:id',
        loadComponent: () => import('./features/lists/list-detail/list-detail').then((m) => m.ListDetail),
      },
      {
        path: 'reminders',
        loadComponent: () =>
          import('./features/reminders/reminder-list/reminder-list').then((m) => m.ReminderList),
      },
      {
        path: 'carole',
        loadComponent: () => import('./features/carole/carole').then((m) => m.Carole),
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings').then((m) => m.Settings),
      },
    ],
  },
  { path: '**', redirectTo: 'today' },
];
