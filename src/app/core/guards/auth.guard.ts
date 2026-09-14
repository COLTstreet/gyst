import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { auth } from '../firebase';

/**
 * Waits for the initial Firebase auth state before deciding, so a page
 * refresh doesn't briefly redirect an already-signed-in user to /login.
 */
export const authGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.resolved()) {
    await new Promise<void>((resolve) => {
      const unsubscribe = auth.onAuthStateChanged(() => {
        unsubscribe();
        resolve();
      });
    });
  }

  if (authService.user()) {
    return true;
  }

  return router.parseUrl('/login');
};
