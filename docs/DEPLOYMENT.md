# Production deployment

Tended ships to Cloudflare Workers via `@opennextjs/cloudflare`. Production is
**not** demo mode: there is no sample-data seeding, no `/admin/reset`, no
onboarding skips, and PII encryption is required.

## 1. Secrets (`wrangler secret put …`)

Secrets are **not** committed — set each one against the deployed Worker:

| Secret | Required? | What it does |
|---|---|---|
| `PII_ENCRYPTION_KEY` | **Required** | AES-256-GCM key for PII at rest. Without it, storing PII **throws** (fail-closed). Generate: `openssl rand -base64 32` |
| `OPENROUTER_API_KEY` | Optional | Enables AI submission + BenefitsCal review. Without it, both fall back to **manual review** (safe, never auto-approves). |
| `RESEND_API_KEY` | Optional | Sends org **team-invite** emails via Resend. Without it, invites still work (the row is created and matched at signup) but the email is only logged. |
| `EMAIL_FROM` | with Resend | Verified sender, e.g. `Tended <noreply@tended.org>`. |

```bash
nvm use
npx wrangler secret put PII_ENCRYPTION_KEY      # paste: openssl rand -base64 32
npx wrangler secret put OPENROUTER_API_KEY       # optional
npx wrangler secret put RESEND_API_KEY           # optional
npx wrangler secret put EMAIL_FROM               # optional
```

> Auth emails (signup verification, password reset) are sent by **Firebase**
> client-side — no transactional provider needed for those.

## 2. Public vars (`wrangler.jsonc → "vars"`)

Already set and committed: `OPENROUTER_MODEL`, `OPENROUTER_SITE_URL`,
`OPENROUTER_APP_NAME`, `FIREBASE_PROJECT_ID`, `APP_ORIGIN`. Update
`OPENROUTER_SITE_URL` + `APP_ORIGIN` if you move to a custom domain.

The public Firebase web config (`NEXT_PUBLIC_FIREBASE_*`) is inlined at build
time from `.env` — safe to commit (these are public client values).

## 3. `DEMO_MODE`

**Leave it unset in production.** It is `true` only in local `.dev.vars`. When
unset, `isDemoMode()` is false and the app:

- never auto-seeds sample data (`/login` skips `ensureSeeded`);
- returns **404** from `/api/admin/reset` and `/admin/reset`;
- **requires** `PII_ENCRYPTION_KEY` (encrypt throws otherwise);
- hides the onboarding BenefitsCal "Skip" and the OTP hint;
- serves an indexable `robots.txt` (`Allow: /`).

## 4. First-run data

A fresh production DB is **empty by design** — no fake orgs/users. Create real
data through the app:

- Apply migrations: `pnpm db:migrate:remote`.
- Create the first admin/org accounts through signup + a one-off SQL role grant
  (there is no seed in production).

## 5. Pre-deploy checklist

- [ ] `PII_ENCRYPTION_KEY` secret set (required).
- [ ] `DEMO_MODE` **not** set in `wrangler.jsonc` or as a secret.
- [ ] `APP_ORIGIN` / `OPENROUTER_SITE_URL` point at the real domain.
- [ ] Firebase web config in `.env`, `FIREBASE_PROJECT_ID` var set.
- [ ] (Optional) `OPENROUTER_API_KEY` for AI review; otherwise manual review.
- [ ] (Optional) `RESEND_API_KEY` + `EMAIL_FROM` for team-invite email.
- [ ] Migrations applied to remote D1.
- [ ] `pnpm build` clean; `pnpm exec tsc --noEmit` clean.

## Still manual (by design, not blockers)

- **BenefitsCal verification**: with `OPENROUTER_API_KEY` it runs AI OCR review;
  without it, screenshots route to manual review (no auto-verify). A reviewer UI
  for those is not yet built — verification can also be done by SQL until then.
- **Org team invites** deliver email only when Resend is configured; the invite
  itself works regardless.
