# colift-cron

Standalone Cloudflare **Cron Worker** that drives the main app's scheduled
maintenance (H9). The `colift` Worker is built by `@opennextjs/cloudflare`, whose
generated `.open-next/worker.js` exports **`fetch` only** (no `scheduled()`), so
cron triggers can't run jobs there. This Worker owns the cron schedule and, on
each tick, makes an authenticated `POST` to `${APP_ORIGIN}/api/cron`, which:

1. drains the Open Prices retry queue, and
2. runs the retention / expiry sweep (`lib/sweep.ts`).

It has **no `fetch` handler** on purpose — the cron trigger is the only
entrypoint, so the jobs can't be triggered unauthenticated.

## One-time setup

```bash
# 1. Generate a strong shared secret
openssl rand -hex 32          # copy the output

# 2. Set the SAME secret on BOTH workers
wrangler secret put CRON_SECRET                                 # main colift worker (repo root)
wrangler secret put CRON_SECRET --config workers/cron/wrangler.jsonc

# 3. Deploy this worker (the main colift worker deploys via Workers Builds on merge to main)
wrangler deploy --config workers/cron/wrangler.jsonc
```

`APP_ORIGIN` is set in `wrangler.jsonc` (`https://colift.org`). The `colift`
route fails closed (HTTP 503) until `CRON_SECRET` is set, and rejects (401) any
request whose bearer token doesn't match — so a missing/!mismatched secret means
the jobs simply don't run, never that they run unauthenticated.

## Schedule

`0 8 * * *` — 08:00 UTC daily. Adjust the `triggers.crons` array in
`wrangler.jsonc` and redeploy.

## Manual run

```bash
curl -X POST "https://colift.org/api/cron" -H "authorization: Bearer $CRON_SECRET"
```

## Verify

```bash
wrangler deployments list --name colift-cron
wrangler tail colift-cron            # watch the next scheduled tick
```
