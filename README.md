# Tended

Real civic work for your neighborhood — with a path to certify CalFresh hours.

Tended is a civic-tech web app where people do real, useful civic tasks (counting
street trees, translating flyers, mapping sidewalk hazards, documenting
neighborhoods) for sponsoring nonprofits. For users who receive CalFresh, approved
hours can be certified via California's **Form CF 888** and uploaded to BenefitsCal.

This repo is an **unlisted, password-gated pilot demo** on Cloudflare. No real auth,
no real recipients, no real state submissions. See [CLAUDE.md](CLAUDE.md) for the
architecture, schema, identity model, and demo script.

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

- **Site password (local):** `tended-pilot` (set in `.dev.vars`).
- The database **auto-seeds** on first entry, or reseed anytime at **`/admin/reset`**
  (admin persona) or `curl -X POST localhost:3000/api/admin/reset`.
- **OpenRouter key is optional.** Without it, AI validation returns a graceful
  "needs a human look" fallback and the demo still works end-to-end. With a key,
  submissions get a real vision-model verdict. Default model
  `google/gemini-2.0-flash-exp:free`.

## Environment variables

| Var | Where | Notes |
|---|---|---|
| `SITE_PASSWORD` | `.dev.vars` / `wrangler secret` | Password gate at `/enter` |
| `OPENROUTER_API_KEY` | `.dev.vars` / `wrangler secret` | Optional; enables real AI verdicts |
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

## Deploy (Cloudflare Workers / .pages.dev)

```bash
# 1. set production secrets
wrangler secret put SITE_PASSWORD
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

## Known Gaps

Nothing here blocks the demo script. These are intentional scope cuts (see
[CLAUDE.md](CLAUDE.md) "What's mocked vs real"):

- **No real auth.** Cookie-only password gate + a soft "identity" cookie. The
  `/start` persona picker swaps identities for the demo.
- **Phone OTP is simulated** — any 6-digit code is accepted (hint: `123456`). No Twilio.
- **BenefitsCal screenshot OCR is skipped** — the upload is stored and marked verified.
- **AI verdicts require an OpenRouter key.** Without one, every submission routes to
  "needs a human look" (manual review). Documented and graceful.
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
