import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { Nav } from '../nav/nav';
import { AuthService } from '../../core/services/auth.service';

@Component({
  imports: [RouterOutlet, RouterLink, Nav, ButtonModule, ToastModule],
  selector: 'app-shell',
  styleUrl: './shell.css',
  templateUrl: './shell.html',
})
export class Shell {
  protected readonly authService = inject(AuthService);
}
