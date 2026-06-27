# Tended

Real civic work for your neighborhood — with a path to certify CalFresh hours.

Tended is a civic-tech web app where people do real, useful civic tasks (counting
street trees, translating flyers, mapping sidewalk hazards, documenting
neighborhoods) for sponsoring nonprofits. For users who receive CalFresh, approved
hours can be certified via California's **Form CF 888** and uploaded to BenefitsCal.

This repo is an **unlisted pilot demo** on Cloudflare with **real email+password
auth** (PBKDF2, sessions, RBAC), measured-hours integrity, field-level PII
encryption, a 4-part task gate, per-county certification gating, security
hardening, EN/ES i18n, and 40 unit tests + CI. No real recipients or state
submissions. See [CLAUDE.md](CLAUDE.md) for architecture, schema, and the demo
script.

---

## Stack

Next.js 15 (App Router, server actions) · TypeScript · Tailwind v4 + hand-built
shadcn-style components · Cloudflare Workers via `@opennextjs/cloudflare` · D1 ·
R2 · OpenRouter (vision LLM) · `pdf-lib` · `exifr` · Playwright (screenshots).

## Prerequisites

- **Node 22.x.** The repo pins it in `.nvmrc`. The machine's default `node` may be
  much older (e.g. Homebrew v12) — that will not work. Run `nvm use` (or
  `nvm install 22`) in every shell first.
- **pnpm** (`corepack enable` or `npm i -g pnpm`).
- For deploy: a Cloudflare account with `wrangler login` done.

## Local setup

```bash
nvm use                       # Node 22
pnpm install
cp .dev.vars.example .dev.vars   # then fill in OPENROUTER_API_KEY (optional)
pnpm db:migrate:local         # apply migrations to local D1
pnpm dev                      # http://localhost:3000
```

- **Demo login:** sign in at `/login` with any seeded account, all sharing
  password `tended-sample-2026` —
  `marisol.reyes@example.com` (recipient), `daniel.okafor@example.com` (reviewer),
  `priya.venkatesan@example.com` (org admin), `alex.mercado@example.com` (admin).
- The database **auto-seeds** on first visit to `/login`, or reseed at
  **`/admin/reset`** (admin only; empty-DB bootstrap allowed).
- **Auth paths:** there are two. The documented **email+password** flow
  (`lib/auth.ts`) is the default. There is also a live **Firebase client-auth**
  path (`lib/firebase-client.ts` / `lib/firebase-verify.ts`), env-switched on by
  setting `NEXT_PUBLIC_FIREBASE_API_KEY`. Both converge on the same opaque
  server-side session (`sessions` table, `tended_session` cookie); the rest of
  the app is auth-path-agnostic. Which becomes canonical is still pending.
- **OpenRouter key is optional.** Without it, AI validation returns a graceful
  "needs a human look" fallback and the demo still works end-to-end. With a key,
  submissions get a real vision-model verdict. Default model
  `google/gemini-2.0-flash-exp:free`.

## Environment variables

| Var | Where | Notes |
|---|---|---|
| `OPENROUTER_API_KEY` | `.dev.vars` / `wrangler secret` | Optional; enables real AI verdicts |
| `PII_ENCRYPTION_KEY` | `.dev.vars` / `wrangler secret` | Required in prod; PII storage throws without it |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `.dev.vars` / build env | Optional; switches on the Firebase client-auth path |
| `OPENROUTER_MODEL` | `wrangler.jsonc` vars | Defaults to gemini flash free |
| `OPENROUTER_SITE_URL` | `wrangler.jsonc` vars | Sent as `HTTP-Referer` |
| `OPENROUTER_APP_NAME` | `wrangler.jsonc` vars | Sent as `X-Title` ("Tended Demo") |
| `NEXTJS_ENV` | `.dev.vars` | `development` locally |

Bindings (in `wrangler.jsonc`): **`DB`** → D1 `tended-db`, **`FILES`** → R2 `tended-files`.

## Cloudflare resources (already provisioned)

- Account `65fb048fa9b4fb99f6473038c393d6a0`
- D1 `tended-db` — id `3a4387f9-9220-40b4-998c-a682565b825c`
- R2 `tended-files`

To recreate from scratch:

```bash
wrangler d1 create tended-db          # paste the id into wrangler.jsonc
wrangler r2 bucket create tended-files
```

## Scheduled jobs / cron

Two maintenance jobs are meant to run on a schedule:

- **Open Prices retry-queue drain** — `retryOpenPricesQueue()` in
  `lib/audit-pipeline.ts` (re-sends pending/failed upstream contributions).
- **Cap calibration** — `app/api/admin/calibrate-caps` (recomputes per-task
  `max_hours` from the observed median of approved sessions).

The cron schedules are declared in `wrangler.jsonc` under `triggers.crons`
(`0 8 * * *` daily for the drain, `30 3 * * MON` weekly for calibration, both
UTC).

**Important — these crons do not fire anything yet.** The current
`@opennextjs/cloudflare` adapter (v1.19.x) generates `.open-next/worker.js` with
a **`fetch`-only** default export and provides no supported hook to add a
`scheduled()` handler. The build regenerates that file, so hand-editing it is
not durable. (Cloudflare documents custom server entrypoints for cron only for
frameworks like TanStack Start, not for the OpenNext/Next.js adapter.)
Additionally, both jobs call `getDb()`/`getEnv()` (`lib/cf.ts`), which depend on
OpenNext's request context — they are not safe to call from a bare worker
`scheduled()` invocation.

**To wire them (one of two ways):**

1. **Cron-invoked authenticated internal route (recommended for OpenNext).** Add
   a route, e.g. `app/api/cron/route.ts`, that authenticates a shared
   `CRON_SECRET` (Bearer header), then `await`s `retryOpenPricesQueue()` and/or
   the calibration logic — dispatching on a `?job=` query param so a single
   route serves both crons. Because OpenNext has no `scheduled()` hook, the
   Cloudflare cron itself can't reach this route directly; pair the cron with a
   thin standalone cron Worker (its own `wrangler.jsonc` + `scheduled()` handler)
   whose `scheduled()` does a `fetch(APP_ORIGIN + "/api/cron?job=...", { headers:
   { Authorization: "Bearer " + env.CRON_SECRET }})`. Set `CRON_SECRET` via
   `wrangler secret put` on both Workers. This keeps the existing functions
   running inside a real Next.js request context.
2. **Standalone maintenance Worker.** Move the drain/calibration logic behind a
   D1/R2-bound Worker with a native `scheduled()` handler. This avoids the
   OpenNext request-context limitation but duplicates DB access code.

Until one of these lands, the `triggers.crons` config is a documented no-op:
deploys succeed, Cloudflare registers the schedules, but no handler responds.
Run both jobs manually in the meantime — `POST /api/admin/calibrate-caps`
(admin) for calibration, and call `retryOpenPricesQueue()` from an admin action
for the drain.

## Deploy (Cloudflare Workers / .pages.dev)

```bash
# 1. set production secrets
wrangler secret put PII_ENCRYPTION_KEY     # required — PII storage throws without it
wrangler secret put OPENROUTER_API_KEY     # optional

# 2. run migrations against the remote DB
pnpm db:migrate:remote

# 3. build + deploy
pnpm run deploy
```

`pnpm run deploy` runs `opennextjs-cloudflare build && opennextjs-cloudflare deploy`.
Share the resulting `*.workers.dev` URL; the password gate keeps it unlisted. Reseed
the live demo at `/admin/reset`.

## Scripts

```bash
pnpm exec tsx scripts/test-ai-fraud.ts      # unit checks for AI fallback + fraud signals
pnpm exec tsx scripts/gen-cf888-sample.ts   # render a sample CF 888 to /tmp
node scripts/shots.mjs                       # capture all docs/screenshots (dev server must be up)
node scripts/e2e-submit.mjs                  # drive commit → submit → AI verdict in a browser
node scripts/smoke.mjs /app /app/tasks       # quick render check for given paths
```

Screenshots (desktop 1440×900 + mobile 390×844 of every major page, plus
`cf888-comparison.png`) live in [`docs/screenshots/`](docs/screenshots).

## Operations & backups

Production runbook: **[docs/ops-runbook.md](docs/ops-runbook.md)** — backups,
disaster recovery, secret/key rotation, deploy & rollback, incident response, and
an on-call checklist.

```bash
pnpm run backup          # export remote D1 -> backups/tended-d1-<UTC>.sql
pnpm run backup:verify   # sanity-check the latest dump (exits non-zero on failure)
```

- Run `pnpm run backup` **daily** and **before every deploy/migration**. Dumps land
  in `backups/` (gitignored — they contain PII; never commit them). Keep ≥30 days.
- `scripts/backup-d1.sh` wraps `wrangler d1 export tended-db --remote`;
  `scripts/verify-backup.sh` checks the newest dump exists, is non-empty, and
  contains the core table DDL.
- Restore, R2 notes, and `PII_ENCRYPTION_KEY` rotation (losing it = unrecoverable
  encrypted PII) are documented in the runbook.

## Known Gaps

Nothing here blocks the demo script. These are intentional scope cuts (see
[CLAUDE.md](CLAUDE.md) "What's mocked vs real"):

**Production-built (was prototype):** real email+password auth + sessions + RBAC +
lockout; hours = idle-aware measured active time, capped, with an immutable audit
trail; 4-part task gate + admin approval; PII field encryption (AES-GCM); per-county
certification pre-clearance; public CC0 deliverable gallery; BenefitsCal Tier-3
vision verification; security headers + auth rate limiting + audit log; admin
observability (audit viewer + legal-invariant monitors); backups/DR + ops runbook;
EN/ES i18n on the public + auth surface; 40 unit tests + GitHub Actions CI.

**Remaining gaps (gated on credentials/decisions or Phase 5+):**
- **SMS/email + BenefitsCal vision are gated on credentials.** The flows are real;
  with no `OPENROUTER_API_KEY` / SMS+email provider keys they degrade gracefully
  (AI → "needs a human look"; verification → manual review; OTP accepts any 6-digit;
  email links are logged not sent). Set the keys to activate.
- **PII encryption is key-gated** — no-op passthrough without `PII_ENCRYPTION_KEY`
  (so the demo runs); set a 32-byte base64 key to encrypt at rest.
- **AI runs via `waitUntil` + lazy poll**, not a durable queue (Phase 5).
- **i18n covers the public + auth surface** (EN/ES); the in-app recipient/org
  screens are English so far.
- Not code (need you/counsel): Form 1023, COI policy, CDSS/county written
  pre-clearance, pen test.
- **CF 888 is faithfully *recreated* with pdf-lib**, not filled into the official
  CDSS PDF — that file is an encrypted XFA form pdf-lib cannot parse. The recreation
  matches the real form's layout (see `docs/screenshots/cf888-comparison.png`). The
  blank template is cached at `public/forms/CF888_template.pdf` for reference.
- **CF 888 certifying org:** a recipient's monthly form aggregates all certified
  hours and uses the org with the most hours that month for Section 2.
- **Demo reviewer org:** the demo's live task is the tree census (sponsored by
  Friends of the Urban Forest, shown for illustration), so the reviewer who closes
  the loop is FUF's reviewer (Daniel Okafor). The spec narration says "SFCDC
  reviewer"; an org can only review its own tasks, so the demo uses the task's org.
  Both orgs/personas are in the identity switcher.
- **`/org/team`** is display-only. **Settings → delete account / notifications** are
  placeholders. No email/SMS/push. English only.
- The provisioning MCP token lacked R2 write, so the R2 bucket was created via
  `wrangler` (same account) — already done.
