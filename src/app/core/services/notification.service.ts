import { Injectable, signal } from '@angular/core';
import { getToken, getMessaging, isSupported, onMessage } from 'firebase/messaging';
import { arrayUnion, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly permission = signal<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied',
  );

  constructor(private readonly authService: AuthService) {}

  /** Call from a user gesture (e.g. a Settings screen button), not on load — browsers require it. */
  async requestPermissionAndRegister(): Promise<void> {
    const user = this.authService.user();
    if (!user) throw new Error('Not signed in');
    if (!(await isSupported())) return;

    const permission = await Notification.requestPermission();
    this.permission.set(permission);
    if (permission !== 'granted') return;

    const messaging = getMessaging();
    const token = await getToken(messaging, { vapidKey: environment.vapidKey });
    if (token) {
      await updateDoc(doc(db, 'users', user.uid), { fcmTokens: arrayUnion(token) });
    }

    onMessage(messaging, (payload) => {
      // Foreground messages: the service worker handles background push display.
      console.log('FCM message received in foreground', payload);
    });
  }
}
