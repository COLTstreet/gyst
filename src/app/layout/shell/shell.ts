import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Nav } from '../nav/nav';
import { ChatPanel } from '../../features/assistant-chat/chat-panel/chat-panel';

@Component({
  imports: [RouterOutlet, Nav, ChatPanel],
  selector: 'app-shell',
  styleUrl: './shell.css',
  templateUrl: './shell.html',
})
export class Shell {}
