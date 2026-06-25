# colift production audit — 2026-06-22

Scope: production at `https://colift.xkbtrjm2bm.workers.dev`, desktop and mobile recipient flows, plus a focused code/security review. Screenshots in `screenshots/` were captured during this run.

## Evidence captured

1. `01-home.png` — public home
2. `02-login.png` — desktop sign-in
3. `03-dashboard.png` — signed-in recipient dashboard
4. `04-settings.png` — signed-in settings
5. `05-tasks.png` — signed-in task catalog
6. `06-how-it-works.png` — signed-in public information page
7. `07-login-mobile.png` — mobile sign-in
8. `08-dashboard-mobile.png` — mobile recipient dashboard
9. `09-how-it-works-mobile.png` — mobile information page

## Findings

### P0 — Mobile dashboard is horizontally broken

**Evidence:** `08-dashboard-mobile.png`; the “Browse tasks” button begins beyond the 390px viewport. A live measurement found a 390px viewport has a 607px document width.

**Impact:** people have to horizontally scroll, and the primary action can be partially or entirely unavailable on mobile.

**Fix:** make the dashboard heading/action row stack at the mobile breakpoint, constrain all dashboard sections to `max-w-full/min-w-0`, and add a browser regression test asserting `scrollWidth === innerWidth` at 390px.

### P0 — Private file gateway has no authentication or authorization

**Evidence:** `app/api/files/route.ts:5-22` accepts any R2 key from the query string and returns the object without verifying a session or ownership.

**Impact:** uploaded BenefitsCal screenshots and generated CF 888 PDFs use predictable namespaces (`verification/…`, `cf888/…`). Any caller who obtains or guesses a valid key can retrieve a private file. “Private” cache headers do not protect access.

**Fix:** require a session; look up the file against its owner/submission/form record; allow only the recipient owner or an appropriately authorized reviewer. Do not serve arbitrary R2 keys from a query parameter.

### P1 — Submission status endpoint is an IDOR

**Evidence:** `app/api/submissions/[id]/status/route.ts:9-29` checks that someone is signed in but never checks `sub.user_id === user.id` or an assigned reviewer relationship.

**Impact:** any signed-in account with a submission ID can read that submission’s status, AI verdict, and fraud flags. The poll endpoint can also trigger AI processing for another user’s work.

**Fix:** authorize ownership before polling; explicitly allow only the assigned organization/reviewer when needed; move the AI fallback to a trusted worker path rather than letting any authenticated user activate it.

### P1 — The rate limit is not enforceable at Cloudflare scale

**Evidence:** `lib/ratelimit.ts:8-12` documents that limits are per-isolate and ephemeral.

**Impact:** auth and expensive processing limits can be bypassed by requests landing on different isolates. It is acceptable for an unlisted demo, but not for any live pilot handling identity information.

**Fix:** use a Durable Object/KV-backed atomic limiter and apply it to the Firebase session exchange, file uploads, AI submission processing, password/reset flows, and PDF generation.

### P1 — Task catalog reads as an unfinished empty state

**Evidence:** `05-tasks.png` shows “1 opportunity” with most of the viewport empty, passive filter controls, and a side card headed “Your civic work / Browse.”

**Impact:** a volunteer arriving to find work sees a sparse, prototype-like catalog rather than a credible civic-work marketplace. The side-card hierarchy is unclear and does not help make a decision.

**Fix:** add a designed zero/low-inventory state, meaningful filter states, and enough representative pilot tasks to demonstrate categories and outcomes. Replace the side card with a direct, useful progress/prospectus panel.

### P2 — Public and authenticated navigation still compete

**Evidence:** `06-how-it-works.png` is captured while signed in; it retains the public information architecture while adding a dashboard/account affordance. The result is two competing navigation models in one narrow header.

**Impact:** it reintroduces the “old UI / new UI” feeling the product already surfaced. Users cannot tell whether they are in their workspace or a separate marketing site.

**Fix:** use one signed-in shell across public explanatory pages: workspace navigation first, with “Learn” as a secondary menu. Keep the public marketing header only for signed-out visitors.

### P2 — Login is technically clean but visually under-composed on desktop

**Evidence:** `02-login.png` has a small card floating in a large empty field.

**Impact:** the first serious trust moment feels like a default form rather than an intentional service entry point.

**Fix:** strengthen the desktop composition with a bounded support/trust panel or a more purposeful two-column layout while keeping the focused mobile form shown in `07-login-mobile.png`.

### P2 — Legacy green and warm-gray styles survive in the shared prose layer

**Evidence:** `app/globals.css:166-174` uses green link colors and a separate warm-gray prose palette outside the navy/teal/gold tokens.

**Impact:** long-form pages can drift back toward the prior visual language, which is exactly where the product feels least unified.

**Fix:** replace these literals with semantic design tokens and audit all shared components for legacy aliases or literal colors.

### P3 — Production dependency hygiene needs attention

**Evidence:** `pnpm audit --prod` reports 13 advisories, including four high findings, through development tooling (`wrangler → miniflare → undici/ws`).

**Impact:** these paths do not appear to execute in the deployed Worker, but they are still a maintenance and local-development risk.

**Fix:** update Wrangler/OpenNext and regenerate the lockfile; rerun the audit and keep a clean dependency baseline.

## What passed in this run

- Sign-in to dashboard and dashboard to Settings remained authenticated.
- The latest primary button palette is navy and the skip link is keyboard-only.
- Production returns HSTS, CSP, frame protection, content-type protection, referrer policy, and restrictive permissions policy headers.
- Tracked `.env.production` contains only documented Firebase public client configuration, not a private server credential.

## Suggested fix order

1. Lock down `/api/files` and `/api/submissions/[id]/status`.
2. Fix mobile dashboard overflow and add a 390px regression test.
3. Replace the in-memory limiter before widening the pilot.
4. Rework the task-catalog low-inventory state and unify signed-in navigation.
5. Sweep legacy color literals and tighten the desktop sign-in composition.
