import { Injectable, effect, inject, signal } from '@angular/core';
import { getToken, getMessaging, isSupported, onMessage, type Messaging } from 'firebase/messaging';
import { arrayUnion, doc, updateDoc } from 'firebase/firestore';
import { MessageService } from 'primeng/api';
import { db } from '../firebase';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

/**
 * Registered at its own scope, separate from Angular's PWA service worker
 * (ngsw-worker.js, scoped to '/') — two service workers can coexist as long
 * as they don't share a scope, so FCM's background handling doesn't fight
 * the PWA's offline/caching worker for control of the page.
 */
const PUSH_SCOPE = '/firebase-cloud-messaging-push-scope';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly permission = signal<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied',
  );

  private readonly messageService = inject(MessageService);

  private messaging: Messaging | null = null;
  private listeningForMessages = false;

  constructor(private readonly authService: AuthService) {
    // Browsers never re-prompt once permission is granted, but the FCM
    // delivery token can still rotate (e.g. site data cleared, token
    // expiry) — refresh it silently on every load rather than only when
    // the user clicks the Settings button, so notifications don't quietly
    // stop working with no way to re-trigger registration.
    effect(() => {
      const user = this.authService.user();
      if (user && this.permission() === 'granted') {
        // Unlike requestPermissionAndRegister(), this is a passive background
        // refresh the user didn't trigger — fail quietly (console only), not
        // via the global error toast, until FCM is fully configured.
        this.registerToken(user.uid).catch((err) => console.warn('FCM token refresh failed', err));
      }
    });
  }

  /** Call from a user gesture (e.g. a Settings screen button) for the *first* grant — browsers require it. */
  async requestPermissionAndRegister(): Promise<void> {
    const user = this.authService.user();
    if (!user) throw new Error('Not signed in');
    if (!(await isSupported())) return;

    const permission = await Notification.requestPermission();
    this.permission.set(permission);
    if (permission !== 'granted') return;

    await this.registerToken(user.uid);
  }

  private async registerToken(userId: string): Promise<void> {
    if (!(await isSupported())) return;

    const swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: PUSH_SCOPE,
    });

    this.messaging ??= getMessaging();
    const token = await getToken(this.messaging, {
      vapidKey: environment.vapidKey,
      serviceWorkerRegistration: swRegistration,
    });
    if (token) {
      await updateDoc(doc(db, 'users', userId), { fcmTokens: arrayUnion(token) });
    }

    if (!this.listeningForMessages) {
      this.listeningForMessages = true;
      onMessage(this.messaging, (payload) => {
        // Background messages are handled by firebase-messaging-sw.js instead —
        // this only fires while the app is actively open/focused.
        this.messageService.add({
          severity: 'info',
          summary: payload.notification?.title ?? 'GYST',
          detail: payload.notification?.body,
          life: 8000,
        });
      });
    }
  }
}
