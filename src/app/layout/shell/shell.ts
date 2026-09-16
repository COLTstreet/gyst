import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { Nav } from '../nav/nav';
import { ChatPanel } from '../../features/assistant-chat/chat-panel/chat-panel';
import { AuthService } from '../../core/services/auth.service';

@Component({
  imports: [RouterOutlet, RouterLink, Nav, ChatPanel, ButtonModule, ToastModule],
  selector: 'app-shell',
  styleUrl: './shell.css',
  templateUrl: './shell.html',
})
export class Shell {
  protected readonly authService = inject(AuthService);
}
