# GYST — Project Brief
*(Get Your Shit Together — personal assistant PWA)*

This document summarizes all design decisions made for this project, for use as a reference when scaffolding the actual codebase.

## Overview
A personal, single-user PWA replacing a physical daily pocketbook, with task/list/reminder management and an AI assistant layer. Works on phone and desktop from one codebase.

## Stack
- **Frontend:** Angular (standalone components, not NgModule-based) + PrimeNG (standalone component style) + Tailwind CSS for layout utilities
  - Disable Tailwind's `preflight` (PrimeNG provides its own base styles) to avoid conflicts
  - Ensure PrimeNG theme CSS loads before Tailwind's generated CSS in `angular.json`
- **Backend:** Firebase — Firestore, Cloud Functions, Firebase Auth, Firebase Hosting, Firebase Cloud Messaging (FCM)
- **AI:** Claude API, called server-side from Cloud Functions (never client-side, to protect the API key). Uses tool calling.
- **PWA:** `ng add @angular/pwa` for service worker + manifest

## Core Principle
Every AI action has a manual UI equivalent. The AI is an optional convenience layer, never a dependency — the app is fully functional manually with $0 marginal cost. AI usage only costs money when the chat/assistant is actually invoked.

## Capabilities
1. Task management (Firestore)
2. Named, multiple editable lists (e.g. groceries) — array-of-items per list document
3. Standalone reminders (message + trigger time, not attached to tasks/events), with optional recurrence
4. ~~Google Calendar event creation~~ — descoped; not worth the OAuth/consent-screen overhead versus just using the native Calendar app
5. Daily notes / journal feature — replaces the physical pocketbook. One Firestore doc per day, array of freeform timestamped entries, no tags/structure
6. AI assistant chat with tool-calling actions
7. Push notifications via FCM for reminders/due tasks, sent by a scheduled Cloud Function running **every 5 minutes**
8. Installable PWA (phone + desktop)
9. **Carole page** — a dedicated, extensible section for notes on his wife's favorite things (sizes, gift ideas, date ideas, notes, and user-defined custom sections e.g. "Restaurant Orders"). AI can read/update it. Not a general reusable "person profile" feature — specific to this one page.

## Firestore Data Model

```
users/{userId}
  - displayName, email, photoURL
  - fcmTokens: [string]
  - createdAt

tasks/{taskId}
  - userId, title, notes?, dueDate?, priority ('low'|'medium'|'high'), status ('open'|'completed'), tags?, createdAt, updatedAt

lists/{listId}
  - userId, name, items: [{ id, text, checked, order }], createdAt, updatedAt

reminders/{reminderId}
  - userId, message, triggerAt, status ('pending'|'sent'|'dismissed'), recurrence?: { frequency, interval }, createdAt

dailyNotes/{userId_YYYY-MM-DD}
  - userId, date, entries: [{ id, text, timestamp, createdVia: 'manual'|'assistant' }], createdAt, updatedAt

conversations/{conversationId}
  - userId, title?, createdAt, updatedAt, pendingConfirmation: { toolName, input, description } | null
  conversations/{conversationId}/messages/{messageId}
    - role ('user'|'assistant'), content, toolCalls?: [{ name, input, result }], createdAt

caroleProfile/{userId}          // single doc
  - sections: [
      { id, title, order, type: 'checklist'|'notes'|'keyValue', items: [...] }  // shape depends on type
    ]
  - updatedAt
```

**Security rules:** every collection scoped by `request.auth.uid == resource.data.userId`.

**Indexes needed:**
- `tasks`: composite on `userId + status + dueDate`
- `reminders`: composite on `status + triggerAt`

## AI Tool-Calling Design

Context (current tasks/lists/reminders) is injected directly into the prompt — so tools are **action-only**, no read/list tools needed (except `get_daily_notes(date)`, since notes aren't in standard context injection to avoid prompt bloat).

**Auto-executing tools:** `create_task`, `update_task` (also handles marking complete via `status` field), `create_list`, `add_list_item`, `update_list_item`, `create_reminder`, `add_gift_idea`, `mark_gift_purchased`, `add_date_idea`, `add_carole_note`, `add_to_carole_section` (generic), `add_daily_note`, `get_daily_notes`

**Destructive tools requiring confirmation:** `delete_task`, `cancel_reminder`
- Cloud Function intercepts these before execution, sets `pendingConfirmation` on the conversation doc, returns "awaiting confirmation" to client
- Chat **blocks** — no other messages processed — until the user confirms or cancels (enforced server-side, not just UI-disabled)
- On confirm: execute and clear `pendingConfirmation`. On cancel: discard and clear.

Reference the current date/time explicitly in the system prompt so relative phrases ("tomorrow at 2pm") resolve correctly.

**Prompt structure (caching-ready, not yet implemented):** keep three separate blocks when assembling the Claude request — (1) static system prompt + tool definitions, (2) semi-dynamic current-context snapshot, (3) turn-specific user message/history — as separate functions (`buildSystemPrompt()`, `buildToolDefinitions()`, `buildCurrentContext()`) so `cache_control: { type: "ephemeral" }` can be added to block 1 later with no refactor.

## Cloud Function Structure

```
functions/src/
├── index.ts
├── assistant/
│   ├── chat.ts                   // main callable: onCall, handles a chat turn
│   ├── promptBuilder.ts
│   ├── toolDefinitions.ts
│   ├── toolExecutor.ts
│   └── destructiveTools.ts        // DESTRUCTIVE_TOOLS set + confirmation logic
├── scheduled/
│   └── checkReminders.ts          // onSchedule "every 5 minutes"
└── shared/
    ├── auth.ts
    └── firestore.ts
```

Use Firebase **Callable Functions** (`onCall`) for the chat endpoint — automatic auth verification, typed request/response.

Error handling: wrap Claude API calls and Firestore writes separately (no partial writes on failure); tool execution failures are caught and surfaced to Claude as a tool result (not a raw crash) so it can respond naturally.

## Angular App Structure

```
src/app/
├── app.config.ts, app.routes.ts, app.component.ts
├── core/
│   ├── services/ (auth, task, list, reminder, assistant, notification — each with signals as reactive state, backed by Firestore onSnapshot listeners)
│   └── guards/auth.guard.ts
├── features/
│   ├── auth/login/
│   ├── today/                     // LANDING SCREEN — daily notes + quick-entry + "at a glance" (tappable, pre-filtered links to Tasks/Reminders)
│   ├── tasks/ (task-list, task-detail, task-form)
│   ├── lists/ (list-overview, list-detail)
│   ├── reminders/reminder-list/
│   ├── carole/                    // Carole page, generic section renderer switching on section `type`
│   └── assistant-chat/ (chat-panel — persistent overlay/FAB, not a route; chat-message; confirmation-prompt)
├── shared/models/, shared/components/
└── layout/shell/, layout/nav/     // bottom nav: Today, Tasks, Lists, Reminders, Carole (5 icons)
```

- No state management library (no NgRx) — services with signals are the store
- Chat panel is a persistent overlay accessible from every screen via a FAB, not its own route
- All feature routes lazy-loaded via `loadComponent`
- **No NgModules anywhere** — standalone components throughout

## UX Decisions
- **Today is the landing screen** (route `''` redirects to `/today`), replacing what would otherwise be a task-list-first home screen
- Today: quick-note input (hero element, zero friction), today's notes list, "at a glance" tappable summary cards (tasks due today → pre-filtered `/tasks?due=today`; reminders pending → `/reminders`), day navigation (← Yesterday / Tomorrow →)
- Daily notes: plain freeform text, no tags/structure, append-only
- Bottom nav (not side nav): 5 icons — Today, Tasks, Lists, Reminders, Carole
- Carole gets a dedicated nav icon (checked often) rather than being under Settings
- Tasks: flat list, inline checkbox to complete, filter chips (All/Today/Overdue), completed items stay visible (struck through)
- Lists: overview of named list cards with item counts → detail view with checkable items, swipe-to-delete item
- Reminders: grouped Upcoming/Past, chronological
- Carole page: sections rendered generically based on `type` (checklist/notes/keyValue), "+ Add Section" flow lets user name a new section and pick its type — fully extensible, no hardcoded fields
- Overall aesthetic: simple and efficient, minimal chrome, no unnecessary animation — reuse PrimeNG defaults rather than custom styling

## Cost Notes
- Claude API: pay-as-you-go, roughly $1–15/month at personal single-user scale depending on usage; Haiku recommended for simple tool-calling actions, Sonnet for conversational Q&A
- Firebase: single-user usage will very likely stay within the free Spark plan indefinitely (50K reads/20K writes per day free tier)
- Manual (non-AI) actions cost $0 marginal — this is a deliberate design principle, not just a cost note

## Branding
- **App name: GYST** (Get Your Shit Together)
- Logo direction: bold wordmark tile (not an icon/metaphor) — the name carries the personality on its own

## Open / Not Yet Designed
- ~~Onboarding flow~~ — descoped; not worth it for a single-user personal app, Settings already surfaces the notification toggle
- Offline indicator (empty states and a global error toast exist; no explicit "you're offline" UI cue)
- Data export/backup approach
- Testing approach
- Deployment/CI setup (staging vs. production Firebase project)
