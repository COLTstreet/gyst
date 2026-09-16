// Handles FCM push events while the app isn't open/focused. Registered by
// NotificationService at a distinct scope (/firebase-cloud-messaging-push-scope)
// so it doesn't fight Angular's own PWA service worker (ngsw-worker.js) for
// control of the root scope — the two coexist as separate registrations.
//
// Firebase config here is duplicated from src/environments/environment.ts
// rather than imported, since service workers are plain static files outside
// the Angular build pipeline. These values are non-secret client identifiers
// (same as everywhere else in this app), safe to hardcode.
importScripts('https://www.gstatic.com/firebasejs/12.19.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.19.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyCEVphSqmtoiUIqB04-cjB_00PDqxSGyOc',
  authDomain: 'gyst-b807f.firebaseapp.com',
  projectId: 'gyst-b807f',
  storageBucket: 'gyst-b807f.firebasestorage.app',
  messagingSenderId: '746091551368',
  appId: '1:746091551368:web:6b6fe495f93658d2e95d3d',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? 'GYST';
  const body = payload.notification?.body ?? '';
  self.registration.showNotification(title, {
    body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
  });
});
