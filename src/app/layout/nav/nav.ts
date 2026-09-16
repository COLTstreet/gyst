import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  imports: [RouterLink, RouterLinkActive],
  selector: 'app-nav',
  styleUrl: './nav.css',
  templateUrl: './nav.html',
})
export class Nav {
  protected readonly items: NavItem[] = [
    { path: '/today', label: 'Today', icon: 'pi pi-sun' },
    { path: '/tasks', label: 'Tasks', icon: 'pi pi-check-square' },
    { path: '/lists', label: 'Lists', icon: 'pi pi-shopping-bag' },
    { path: '/reminders', label: 'Reminders', icon: 'pi pi-bell' },
    { path: '/carole', label: 'Carole', icon: 'pi pi-heart' },
  ];
}
