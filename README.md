# GYST — Get Your Shit Together

Personal, single-user task/list/reminder/journal PWA with an optional Claude-powered
assistant layer. See [GYST_PROJECT_BRIEF.md](./GYST_PROJECT_BRIEF.md) for the full design.

## Stack

Angular 22 (standalone components) + PrimeNG 22 + Tailwind CSS v4, on Firebase
(Firestore, Auth, Functions, Hosting, FCM), with Claude API called server-side
from Cloud Functions.

## First-time setup

1. **Create a Firebase project** at [console.firebase.google.com](https://console.firebase.google.com),
   enabling Firestore, Authentication (Google sign-in provider), Hosting, Cloud
   Messaging, and Cloud Functions (Blaze plan — required for outbound network
   calls to the Claude API and Calendar API).
2. Replace `REPLACE_WITH_YOUR_FIREBASE_PROJECT_ID` in [.firebaserc](./.firebaserc).
3. Copy the Firebase Web SDK config (Project settings → General → Your apps)
   into `src/environments/environment.ts` and `environment.prod.ts`.
4. Generate a Web Push certificate (Project settings → Cloud Messaging) and put
   its key pair value into the `vapidKey` field in both environment files.
5. Set the Cloud Functions secrets (do **not** put these in environment.ts —
   they're server-only):
   ```
   firebase functions:secrets:set ANTHROPIC_API_KEY
   firebase functions:secrets:set GOOGLE_OAUTH_CLIENT_ID
   firebase functions:secrets:set GOOGLE_OAUTH_CLIENT_SECRET
   ```
   and reference them in `functions/src/assistant/chat.ts` / `calendar/createEvent.ts`
   via `defineSecret` (not yet wired up — currently reads `process.env` directly,
   which works with the Firebase CLI's local `.env` file for emulator use only).
6. `npm install` at the repo root, then `npm install` inside `functions/`.
7. `firebase login`, then `firebase use --add` to link the CLI to your project.

## Local development

- `npm start` — Angular dev server at `localhost:4200` (talks to Firebase
  emulators when `environment.useEmulators` is `true`).
- `firebase emulators:start` — Firestore/Auth/Functions/Hosting emulators.
- `npm --prefix functions run build:watch` — recompile functions on save.

## Known gaps (see brief's "Open / Not Yet Designed")

- FCM requires a `public/firebase-messaging-sw.js` service worker for
  **background** push, which needs to coexist with Angular's own
  `ngsw-worker.js` (PWA offline support) — this needs a deliberate merge
  strategy and isn't wired up yet. Foreground messages work via
  `NotificationService` as scaffolded.
- Google Calendar OAuth consent flow (the "Connect Google Calendar" button
  that obtains a refresh token) isn't built — `createCalendarEvent` assumes
  `users/{uid}.googleRefreshToken` is already populated.
- Settings screen, onboarding flow, offline/empty/error states, data
  export, and CI/deployment setup are all still open per the brief.
