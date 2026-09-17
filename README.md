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
   calls to the Claude API).
2. Replace `REPLACE_WITH_YOUR_FIREBASE_PROJECT_ID` in [.firebaserc](./.firebaserc).
3. Copy the Firebase Web SDK config (Project settings → General → Your apps)
   into `src/environments/environment.ts` and `environment.prod.ts`.
4. Generate a Web Push certificate (Project settings → Cloud Messaging) and put
   its key pair value into the `vapidKey` field in both environment files —
   also update the hardcoded Firebase config at the top of
   `public/firebase-messaging-sw.js` to match (service workers can't import
   the TS environment files, so it's duplicated there).
5. Set the Cloud Functions secret for the assistant (do **not** put this in
   environment.ts — it's server-only):
   ```
   firebase functions:secrets:set ANTHROPIC_API_KEY
   ```
6. `npm install` at the repo root, then `npm install` inside `functions/`.
7. `firebase login`, then `firebase use --add` to link the CLI to your project.
8. Deploy: `firebase deploy` (or `--only hosting` / `--only functions` /
   `--only firestore` individually).

## Local development

- `npm start` — Angular dev server at `localhost:4200` (talks directly to the
  real Firebase project; `environment.useEmulators` is currently `false`).
- `npm --prefix functions run build:watch` — recompile functions on save.

## Known gaps (see brief's "Open / Not Yet Designed")

- Onboarding flow (sign-in → notification permission prompt)
- Offline/empty/error states beyond the global error toast
- Data export/backup
- Automated tests (still just the default scaffold spec)
- CI / staging vs. production deployment setup — every deploy so far has been manual
