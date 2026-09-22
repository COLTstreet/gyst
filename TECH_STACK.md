# Tech Stack Reference

A reusable stack for personal/small web apps, based on how GYST is built.

## Frontend

| Piece | Choice | Notes |
|---|---|---|
| Framework | **Angular 22**, standalone components | No NgModules anywhere |
| UI components | **PrimeNG 22.1.1** | Use `@primeuix/themes` for theme presets — `@primeng/themes` is deprecated, a lot of docs/tutorials still reference the old package name |
| Theming | `definePreset(Aura, {...})` | Custom brand colors via generated 11-step tint/shade ramps, not just single hex overrides |
| CSS utilities | **Tailwind CSS v4** | CSS-first config (no `tailwind.config.js`), PostCSS via `.postcssrc.json`. **Disable preflight** — it conflicts with PrimeNG's own base styles. This means you must manually reset `<ul>`, `<a>`, `<dd>`, plain `<button>`, etc. yourself — preflight normally does this for free |
| State | **Angular signals**, no NgRx | Services hold signals as the store, populated via Firestore `onSnapshot` listeners |
| Firebase client | **Plain `firebase` JS SDK** (modular), *not* `@angular/fire` | `@angular/fire` didn't support Angular 22 at the time of building this — worth rechecking for your new app, it may have caught up |
| Fonts | Google Fonts via `<link>` in `index.html` + CSS `font-family` | Also set in the PrimeNG preset's `semantic.typography.fontFamily` so components pick it up too |
| PWA | `ng add @angular/pwa` | Service worker (`ngsw-worker.js`) + manifest. Pair with `SwUpdate` (`@angular/service-worker`) to auto-reload on new deploys — otherwise updates silently sit undetected |
| Error handling | Custom `ErrorHandler` + PrimeNG `MessageService`/`Toast` | One global handler catches everything, including unhandled promise rejections from fire-and-forget async calls in template bindings — this was the single highest-leverage thing for turning silent failures into visible ones |

## Backend (Firebase)

| Piece | Choice | Notes |
|---|---|---|
| Database | **Firestore** | Security rules do the access control — client talks to Firestore directly, no custom REST API layer for CRUD |
| Auth | **Firebase Authentication**, Google provider | Must click "Get started" in the console explicitly — creating the project doesn't auto-initialize Auth |
| Functions | **Cloud Functions v2**, Node 22, TypeScript | `onCall` for client-invoked logic (auth handled automatically), `onSchedule` for cron-style jobs. **Requires the Blaze (pay-as-you-go) plan** — Spark won't deploy functions at all |
| Hosting | **Firebase Hosting** | SPA rewrite (`"source": "**", "destination": "/index.html"`) |
| Push | **Firebase Cloud Messaging** | Needs a *separate* service worker (`firebase-messaging-sw.js`) registered at its own scope, distinct from the PWA's `ngsw-worker.js` — registering both at the root scope makes them fight each other |

## Structure / conventions worth carrying over

- **Flat repo root** for the Angular app, `functions/` as a sibling subfolder with its own `package.json`/`tsconfig.json` — not nested inside `src/`
- **`environment.ts` / `environment.prod.ts`** for Firebase client config (this is a public client identifier, not a secret — safe to commit)
- Firestore rules gotchas worth knowing upfront:
  - Rules that check `resource.data.userId` **fail on documents that don't exist yet** — `resource` is `null`, and dereferencing `.data` on it errors out and denies. Any pattern that does a `getDoc()` to check existence before creating needs `resource == null || isOwner(...)`.
  - Don't accidentally write `allow write: if false` when you meant to protect *one field* — use `request.resource.data.diff(resource.data).affectedKeys()` for field-level protection instead.
- **Composite indexes must match your actual client queries exactly** (field order and combination) — a query that filters by one field and orders by another needs its own index; it won't reuse a "similar" one.
