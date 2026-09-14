import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { FirebaseError } from 'firebase/app';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  imports: [ButtonModule, MessageModule],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly error = signal<string | null>(null);
  protected readonly signingIn = signal(false);

  protected async signIn(): Promise<void> {
    this.error.set(null);
    this.signingIn.set(true);
    try {
      await this.authService.signInWithGoogle();
      await this.router.navigateByUrl('/today');
    } catch (err) {
      this.error.set(describeAuthError(err));
    } finally {
      this.signingIn.set(false);
    }
  }
}

function describeAuthError(err: unknown): string {
  if (err instanceof FirebaseError) {
    switch (err.code) {
      case 'auth/popup-closed-by-user':
        return 'Sign-in was cancelled.';
      case 'auth/popup-blocked':
        return 'Your browser blocked the sign-in popup — allow popups for this site and try again.';
      case 'auth/operation-not-allowed':
        return 'Google sign-in isn’t enabled for this project yet (Firebase Console → Authentication → Sign-in method).';
      case 'auth/configuration-not-found':
        return 'Authentication hasn’t been set up for this Firebase project yet.';
      default:
        return `Sign-in failed: ${err.code}`;
    }
  }
  return 'Sign-in failed. Please try again.';
}
