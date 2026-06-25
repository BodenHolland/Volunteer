# COLIFT — project guide (read this first)

COLIFT is a civic-tech web app where people do real, useful civic tasks —
counting street trees, translating flyers, mapping sidewalk hazards,
documenting neighborhoods — for sponsoring nonprofits. For users who receive
CalFresh, approved hours can be certified via California's **Form CF 888** and
uploaded by the user to BenefitsCal.

**Design principle:** the platform is centered on *civic work*. CalFresh
certification is one supported path, not the framing. This broadens the
audience, reduces stigma, and sets up expansion.

**Data principle (architectural, not aspirational):** every dataset generated
by volunteer work ships with a free public download. This is what makes the
work qualify as community service — the output has to be a public good, not
a colift-internal asset. Concretely, when you design a new feature that
captures user behavior:

- Split the schema into a **private cluster** (PII, auth, certification
  source-of-truth) and a **public cluster** (the work product) with a single
  opaque per-session reference as the only cross-boundary key.
- The public cluster must physically exclude PII columns so the export is
  safe by construction, not by a filter step that can be forgotten.
- Every such feature owns a free public CSV+JSON export endpoint built only
  from its public cluster.
- Erasure deletes the private row and orphans (does not delete) the public
  rows — the work product stays, the link to a person is gone.

If a feature can't ship its dataset publicly, it doesn't ship.

This is an **unlisted pilot demo** on Cloudflare. No real auth, no real
recipients, no real state submissions.

---

## Legal framework (read [docs/legal-framework.md](docs/legal-framework.md))

colift is a **501(c)(3) virtual volunteer-coordinating nonprofit**, **100% grant-
and donation-funded** — it **never sells** volunteer output; deliverables are
given away free to the public, libraries, and government. Two hard lines bind the
product:

1. **Never credit hours above the volunteer's actual measured time.** The CF 888
   attests to a *specific person's* real hours (false attestation = exposure under
   7 U.S.C. §2024, 18 U.S.C. §1001, Cal. Welf. & Inst. Code §10980).
2. **Never ship a task that is self-serving busywork.** Every task must pass a
   4-part gate: external beneficiary · genuine need · free public deliverable ·
   would-do-anyway.

Authority: counting unpaid volunteer hours toward the ABAWD requirement rests on
**7 CFR §273.24(a)(2)(iii) + CDSS ACL 25-34** (NOT §273.7), verified via CF 888.
Do not cite 29 CFR §553.101 (public-agency volunteers only) for volunteer status.

---

## Stack

- **Next.js 15** (App Router, TypeScript, server actions) — `15.5.19`
- **Cloudflare** via `@opennextjs/cloudflare` (Workers runtime), **D1** (SQLite),
  **R2** (files)
- **Tailwind v4** (CSS-first `@theme` tokens) + hand-built shadcn-style components
  (Radix primitives), **Inter**
- **OpenRouter** via `fetch` (OpenAI-compatible `/chat/completions`), default
  model `google/gemini-2.0-flash-exp:free`
- `pdf-lib`, `exifr`, `lucide-react`, `zod`, `nanoid`
- Playwright (devDependency) for screenshots

> Node: use **22.x** (`.nvmrc` pins `22.22.3`). The machine's default `node` is
> v12 (Homebrew) — too old. `nvm use` before any command. pnpm is the package
> manager.

### Provisioned Cloudflare resources (account `65fb048fa9b4fb99f6473038c393d6a0`)
- D1 `colift-db` — id `3a4387f9-9220-40b4-998c-a682565b825c`
- R2 `colift-files`

---

## Roles & identity model

`users.role ∈ ('recipient','org_member','admin')`
- `org_member` also has `org_role ∈ ('reviewer','org_admin')`
  - **reviewer**: review queue + approve/reject
  - **org_admin**: also create/edit task templates, manage org profile/team
- `recipient` has `intent ∈ ('snap_cert','casual_volunteer','other','n/a')`

**Identity principle:** the state already verified everyone enrolled in
CalFresh. The platform's job is account continuity + accurate Section 1 PII
capture, **not KYC**. The CF 888 case number is the bridge to identity.

Production verification tiers (the demo bypasses all of them):
1. signup: email + phone OTP
2. before first task: Section 1 PII capture
3. before first CF 888 download: BenefitsCal screenshot + OCR
4. always-on: device fingerprint, location consistency, velocity, AI dup/quality

**Never used:** ID.me, facial recognition, selfie+ID, SSN, credit checks.

---

## Authentication (production — `lib/auth.ts`, migration `0002_auth.sql`)

Real **email + password** accounts. No demo gate, no identity-swap.

- Passwords hashed with **PBKDF2-SHA256** (100k iters, per-user salt).
- **Revocable server-side sessions** (`sessions` table). The cookie
  (`colift_session`, HttpOnly/SameSite=Lax/Secure-in-prod) holds an opaque token;
  the DB stores only its SHA-256 hash. Password change revokes all sessions.
- **Email verification** + **password reset** via one-time `auth_tokens` (hashed).
  The flows are real; **delivery is stubbed** (`lib/notify.ts`) until a provider is
  wired — links/codes are logged. Phone OTP at onboarding is likewise simulated
  until SMS is wired.
- Account **lockout** after 8 failed logins (15 min).
- `middleware.ts` redirects unauthenticated `/app|/org|/admin` to `/login`; role is
  enforced in layouts/pages via `require*` (`lib/session.ts`).

**Sample accounts** (seeded in `DEMO_MODE`, all share password `colift-sample-2026`):
`marisol.reyes@example.com` (recipient, snap_cert), `trevor.nakamura@example.com`
(recipient, casual), `priya.venkatesan@example.com` (SFCDC org_admin),
`daniel.okafor@example.com` (FUF reviewer), `alex.mercado@example.com` (admin).

---

## D1 schema

Source of truth: `migrations/0001_init.sql` + `migrations/0002_auth.sql`. Tables:
`orgs, users, task_templates, submissions, submission_files, submission_flags,
hours_ledger, cf888_forms, feedback`. Read it before touching data code.

Key state machine on `submissions.status`:
`committed → in_progress → submitted → ai_reviewing →
(pending_review | rejected | needs_changes) → approved`

Hours flow (Change 4): credited hours are the volunteer's **measured active time**
capped at the calibrated cap — `credited = min(measured_logged, max_hours)`, gated
on quality review. The reviewer may only **reduce** for quality, never credit above
measured time; rejected/low-effort work earns **zero**. The task estimate
(`est_hours`) is a ceiling/flag only, never the credited number. On **approve** the
credited hours are written to `hours_ledger` (per user, per month, per certifying
org); the CF 888 reads the ledger. Enforced in `app/org/org-actions.ts`.

---

## Onboarding (recipient — `/start` wizard)

1. **Basics** — name, email, role.
2. **Location + intent** (recipient only) — City (SF, CA only; others greyed
   "Coming soon"); intent picker (snap_cert / casual_volunteer / other).
3. **CalFresh setup** (snap_cert only):
   - 3a. Section 1 PII — legal name, case #, **mobile number** (collected for
     contact, no verification), address, DOB. "This appears on your CF 888 exactly
     as entered." (Phone is not on the CF 888; it's contact info only.)
   - 3b. BenefitsCal screenshot → R2 `verification/{user_id}/benefitscal.png`;
     OCR skipped; sets `benefitscal_verified_at`.
4. **Welcome → /app**

**Org member** branch (`/start` step 2-org): pick a seeded org + org_role → `/org`,
or "My org isn't listed" → stub form creates `is_fictional=1` org, sets `org_admin`.

---

## Commit → Project → Submit flow

- **Commit** (`/app/tasks/[id]`): insert `submissions` row `status='committed'`,
  redirect to `/app/projects/[id]`.
- **Project hub** (`/app/projects/[id]`): checklist (persists to
  `checklist_progress_json`), time log (Start/Stop pushes to `time_log_json`;
  first Start sets `first_started_at`, `status='in_progress'`), notes (autosave on
  blur), "Submit when ready" (enabled when all required checklist items are
  checked AND ≥1 time-log session exists).
- **Submit** (`/app/projects/[id]/submit`): category-specific fields; on submit
  `status='submitted'` → AI worker → `ai_reviewing` →
  `pending_review|rejected|needs_changes`. Confirmation shows pulsing
  "AI reviewing…" pill that polls `/api/submissions/[id]/status`.

---

## AI validation + fraud flags (`lib/ai.ts`, `lib/fraud.ts`)

On submit (server action):
1. Build rubric + submission text + base64 images.
2. POST OpenRouter `/chat/completions`, `response_format: json_object`,
   `max_tokens: 1024`. System prompt forces strict JSON:
   `{ verdict:'approve'|'flag'|'reject', confidence, reasoning, issues[],
   estimated_actual_hours, suspected_ai_content }`.
3. Store in `submissions.ai_verdict_json`.
4. Fraud checks → `submission_flags`:
   - `duplicate_image` (SHA-256 match vs prior files) — flag
   - `likely_ai_content` (verdict.suspected_ai_content) — flag
   - `geotag_mismatch` (in_person + EXIF >2mi from address city) — warn
   - `velocity_anomaly` (elapsed < 30% of est_hours) — warn
5. Routing: block→`needs_changes`; approve+conf>0.85+no flags→`pending_review`;
   flag/any warn→`pending_review` (flags visible); reject→`rejected`.

**AI failure handling:** on 429 / non-2xx / parse fail → verdict
`{verdict:'flag', confidence:0, reasoning:"AI validator unavailable; manual
review required", ...}` → `pending_review`. Demo works with no API key.

**Performance:** AI must never block the UI. Submit navigates immediately to the
"AI reviewing…" screen and polls. `/enter` fires a tiny pre-warm call.

---

## CF 888 generator (`lib/cf888.ts`)

- Template PDF at `public/forms/CF888_template.pdf` (fetched from CDSS during
  setup; placeholder generated if unreachable — see Known Gaps in README).
- Server action `(user_id, month)` reads `hours_ledger` + user PII + org Section 2
  data. `pdf-lib` fills AcroForm fields by name; unknown fields overlaid at fixed
  coords.
- Saves R2 `cf888/{user_id}/{month}.pdf`, writes `cf888_forms` row, returns a
  download URL (served via `/api/cf888/[id]`).
- Button enabled once ≥1 hour is certified for the month.

---

## What's mocked vs real

| Real | Mocked / stubbed |
|---|---|
| **Real email+password auth, sessions, RBAC, lockout** | SMS/email delivery (flows real, sends stubbed) |
| **Hours = measured active time, capped; immutable audit** | Phone OTP (simulated until SMS wired) |
| **4-part task gate + admin approval** | BenefitsCal OCR (skipped) |
| **PII field encryption (AES-GCM, key-gated)** | Device fingerprinting (Tier-4 partial) |
| **Per-county cert pre-clearance gating** | Durable queues (AI runs via waitUntil + poll) |
| **Free public deliverable gallery (CC0)** | Real Twilio / managed email |
| **Security headers, rate limiting, audit log, 40 unit tests + CI** | i18n (EN only so far) |
| R2 file storage · OpenRouter AI · pdf-lib CF 888 | |
| OpenRouter AI validation | BenefitsCal OCR (skipped; marked verified) |
| pdf-lib CF 888 fill | State submission (user uploads form themselves) |
| EXIF extraction (exifr) | Email/SMS/push notifications |
| SHA-256 duplicate detection | Device fingerprinting / velocity Tier-4 |

---

## Demo script (the thing we optimize for)

Land `/` → sign in `/start` (recipient) → PII wizard (no OTP) → `/app`
dashboard (progress ring "12 of 80 hours") → `/app/tasks` catalog → tree census
detail → "Commit" → project hub (Start/Stop sessions, checklist) → submit 3
photos → "AI reviewing…" verdict → **Switch identity** to FUF reviewer →
`/org` queue → review screen → **Approve** → switch back → hours moved
pending→certified → **Download this month's CF 888** (looks like the CA form with
their data).

---

## Build order (riskiest first)

1. CLAUDE.md ✓
2. CF 888 generator + quality gate
3. AI validation + fraud flags standalone
4. Schema + migrations + seed
5. Password gate + soft session + role/intent routing
6. Onboarding wizard
7. Recipient: discover → commit → project hub → submit
8. AI + fraud flags into submission flow
9. Org: dashboard → queue → review
10. Org admin: create/edit task → org profile
11. Settings, profile, signout, public org profiles, task preview, contact,
    about, error pages
12. CF 888 into recipient dashboard
13. Landing, /how-it-works, /for-organizations, /org/signup
14. Polish + screenshots

---

## Running it

```bash
nvm use                       # Node 22
pnpm install
pnpm db:migrate:local         # apply migrations to local D1
pnpm dev                      # http://localhost:3000  (loads .dev.vars)
```

Seed runs idempotently on first request and via **`/admin/reset`** (a POST that
wipes + reseeds all tables; also reachable from the `/admin` page button).

Site password (local): `colift-pilot` (see `.dev.vars`).

See `README.md` for D1/R2 setup, deploy, and **Known Gaps**.
