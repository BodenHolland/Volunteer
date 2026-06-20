# TENDED — Operations Runbook

Operational reference for running TENDED in production: backups, disaster
recovery, secrets & key rotation, deploy & rollback, incident response, and an
on-call checklist. Concrete for **this** stack: Next.js 15 on Cloudflare Workers
via `@opennextjs/cloudflare`, D1 (SQLite), R2 (files).

> **Verified against wrangler 3.114.17.** All `wrangler` subcommands below were
> confirmed to exist with `--help` in this repo. If you upgrade wrangler (4.x is
> available), re-verify `d1 export`, `d1 execute`, and `rollback` syntax — flags
> have changed between major versions.

## 0. Facts you need

| Thing | Value |
|---|---|
| Cloudflare account | `65fb048fa9b4fb99f6473038c393d6a0` |
| Worker name | `tended` |
| Live Worker URL | https://tended.xkbtrjm2bm.workers.dev |
| D1 database | `tended-db` — id `3a4387f9-9220-40b4-998c-a682565b825c` |
| R2 bucket | `tended-files` |
| Bindings (wrangler.jsonc) | `DB` → D1, `FILES` → R2, `ASSETS` → static assets |
| Migrations | `migrations/0001_init.sql` … `0004_phase3.sql` |
| Node | 22.x — `export PATH="$HOME/.nvm/versions/node/v22.22.3/bin:$PATH"` |

Prereq for any command here: `wrangler login` (or `CLOUDFLARE_API_TOKEN` set) for
the account above, and Node 22 on PATH.

---

## 1. Backups

### D1 (the source of truth)

D1 holds everything re-derivable work depends on: `users` (incl. encrypted PII),
`orgs`, `task_templates`, `submissions`, `submission_files`, `submission_flags`,
`hours_ledger`, `cf888_forms`, `feedback`, `sessions`, `auth_tokens`, `audit_log`,
`org_invites`, `counties`, `notifications`. **This is the data you cannot lose.**

Two layers of protection:

1. **Logical dumps (portable, off-platform).** Run the backup script:

   ```bash
   pnpm run backup
   # = bash scripts/backup-d1.sh
   # = npx wrangler d1 export tended-db --remote --output=backups/tended-d1-<UTC>.sql
   ```

   - Output: `backups/tended-d1-<UTCtimestamp>.sql` (full schema + data, replayable).
   - `backups/` is **gitignored** — dumps contain PII; never commit them.
   - Verify the newest dump: `pnpm run backup:verify` (exits non-zero on failure;
     checks it exists, is non-empty, and contains `CREATE TABLE users` /
     `task_templates` / `submissions`).

2. **D1 Time Travel (point-in-time, on-platform).** D1 keeps a 30-day bookmark
   history. To inspect / restore:

   ```bash
   npx wrangler d1 time-travel info tended-db --remote
   npx wrangler d1 time-travel restore tended-db --timestamp=<ISO8601>   # or --bookmark=<id>
   ```

   Time Travel is the fastest path for "undo the last N hours". The SQL dumps are
   the off-platform copy that survives account loss.

**Cadence:** run `pnpm run backup` **daily** (cron/scheduled) **and before every
`pnpm run deploy` and every migration**. **Retention:** keep ≥30 daily dumps;
prune older. For long-term retention copy dumps to encrypted cold storage.

### R2 (`tended-files`) — no simple export

R2 has **no one-command export** like D1. It holds:

| Prefix | Contents | Re-derivable? |
|---|---|---|
| `verification/{user_id}/benefitscal.png` | BenefitsCal eligibility screenshots | **No — user upload** |
| (submission photos) | Photos attached to submissions | **No — user upload** |
| `cf888/{user_id}/{month}.pdf` | Generated CF 888 PDFs | Yes — regenerated from `hours_ledger` + PII via `lib/cf888.ts` |

So: **CF 888 PDFs are re-derivable** from D1; **user uploads (BenefitsCal
screenshots + submission photos) are NOT** and are the only truly irreplaceable
R2 data. Inventory / spot-check objects:

```bash
npx wrangler r2 object get tended-files/<key> --file=<local>   # fetch one object
# Bulk copy/sync for backup is best done with an S3-compatible client (rclone/aws-cli)
# pointed at the R2 S3 endpoint for account 65fb048fa9b4fb99f6473038c393d6a0,
# using an R2 API token. wrangler has no recursive "export bucket" command.
```

For a real R2 backup, configure rclone/`aws s3 sync` against the R2 S3 endpoint
and snapshot the `verification/` and submission-photo prefixes on the same daily
cadence. Alternatively enable R2 bucket-level object versioning.

---

## 2. Restore / Disaster Recovery

**RPO (max data loss):** ≤ 24h with daily dumps; effectively minutes if you use
Time Travel (30-day window). **RTO (time to recover):** ~30–60 min for a full
D1 + Worker rebuild from a dump.

### Restore D1 from a dump (preferred for full rebuild / new DB)

```bash
# A) Restore INTO the existing database (DESTRUCTIVE — replays the dump on top).
#    Take a fresh backup first, then:
npx wrangler d1 execute tended-db --remote --file=backups/tended-d1-<UTC>.sql

# B) Recreate the database from scratch (e.g. account/DB lost):
npx wrangler d1 create tended-db
#   -> paste the NEW database_id into wrangler.jsonc (d1_databases[0].database_id)
npx wrangler d1 execute tended-db --remote --file=backups/tended-d1-<UTC>.sql
```

The dump contains `CREATE TABLE` + `INSERT` for every table including
`d1_migrations`, so a clean DB ends up with the full schema and migration history.
After a from-scratch recreate, confirm migrations are consistent:
`pnpm db:migrate:remote` should report nothing left to apply.

### Recreate bindings / infra

If the whole project is gone:

```bash
npx wrangler d1 create tended-db                 # -> update wrangler.jsonc with new id
npx wrangler r2 bucket create tended-files
# restore R2 objects from your rclone/S3 snapshot (see §1)
# re-add secrets (see §3): SITE_PASSWORD, OPENROUTER_API_KEY, PII_ENCRYPTION_KEY
npx wrangler d1 execute tended-db --remote --file=backups/tended-d1-<UTC>.sql
pnpm run deploy
```

The bindings (`DB`, `FILES`, `ASSETS`, `WORKER_SELF_REFERENCE`) and `vars` live in
`wrangler.jsonc` and are applied automatically by `pnpm run deploy` — you only need
to update the D1 `database_id` if it changed.

### Verify after restore

- `curl -I https://tended.xkbtrjm2bm.workers.dev` returns 200/redirect.
- Sign in works; `/admin/system` health page loads (see §5).
- A row with encrypted PII (`enc:v1:…`) decrypts correctly → confirms
  `PII_ENCRYPTION_KEY` matches the data (see §3).

---

## 3. Secrets & key rotation

Production secrets (Worker secrets, set via `wrangler secret put`):

| Secret | Purpose | Loss impact |
|---|---|---|
| `SITE_PASSWORD` | Legacy password gate — **unused** (real auth replaced it). | None. Safe to rotate or remove. |
| `OPENROUTER_API_KEY` | Optional — enables real AI submission verdicts. | App degrades gracefully to "manual review" (no key = no AI). |
| `PII_ENCRYPTION_KEY` | **AES-256-GCM key for field-level PII encryption.** 32-byte base64. | **CRITICAL — losing it makes all `enc:v1:…` PII permanently unrecoverable.** |

List / set / delete:

```bash
npx wrangler secret list
npx wrangler secret put PII_ENCRYPTION_KEY      # prompts for value (32-byte base64)
npx wrangler secret delete SITE_PASSWORD
```

### PII_ENCRYPTION_KEY — handle with extreme care

- **Format:** base64 of 32 random bytes, e.g. `openssl rand -base64 32`.
- **How it's used (`lib/crypto.ts`):** PII fields (legal name, case number, DOB,
  address, phone) are stored as `enc:v1:<ivBase64>:<ciphertextBase64>`. With **no**
  key set, encryption is a passthrough (plaintext) — that's the demo mode. Decrypt
  is tolerant: plaintext/seed rows read as-is, so mixed plaintext + encrypted rows
  both work, which makes a first-time key rollout safe.
- **Losing the key = unrecoverable PII.** Any row already written as `enc:v1:…`
  cannot be decrypted without the exact key. There is no recovery. **Store the key
  in a secrets manager / password vault, separate from the D1 backups.** A D1 dump
  alone does NOT contain the key — restoring data without the matching key leaves
  encrypted PII unreadable.

### Rotating `PII_ENCRYPTION_KEY` (re-encryption required)

Rotation is **not** just `wrangler secret put` — old ciphertext was encrypted with
the old key. There is currently **no in-app re-encryption job**, so plan a
maintenance window:

1. **Back up D1 first** (`pnpm run backup`) and keep the OLD key.
2. Write a one-off migration/script that, for every row with `enc:v1:…` PII:
   decrypt with the OLD key → re-encrypt with the NEW key. (Mirror the
   encrypt/decrypt logic in `lib/crypto.ts`; the format is `enc:v1:<iv>:<ct>`,
   AES-GCM, 12-byte IV.)
3. Run it against remote D1, then `wrangler secret put PII_ENCRYPTION_KEY` (new).
4. Verify decryption on sample rows, then retire the OLD key from the vault only
   after confirming all rows re-encrypted.

Because decrypt is tolerant of plaintext, a **first** key introduction (none →
key) needs no re-encryption — new writes encrypt, old plaintext still reads. Only
key→key rotation requires the re-encrypt pass above.

### Rotating the others

- `OPENROUTER_API_KEY`: issue a new key in OpenRouter, `wrangler secret put`, then
  revoke the old. Zero downtime (app tolerates a missing/invalid key).
- `SITE_PASSWORD`: legacy/unused — rotate or `secret delete` at will.

---

## 4. Deploy & rollback

### Deploy

```bash
# pre-flight
pnpm run backup && pnpm run backup:verify   # snapshot D1 first
pnpm db:migrate:remote                       # apply any new migrations to remote D1

# build + ship
pnpm run deploy
# = opennextjs-cloudflare build && opennextjs-cloudflare deploy
```

Always commit/tag the git SHA you deploy so you can redeploy it.

### Rollback

Two options:

1. **Fast — roll back to the previous Worker version (no rebuild):**

   ```bash
   npx wrangler rollback --name tended            # rollback to the prior version
   npx wrangler rollback <version-id> --name tended -m "reason"   # to a specific version
   ```

   `wrangler rollback` accepts an optional `version-id`, `--name`, `-m/--message`,
   and `-y` to skip the prompt. Use `wrangler deployments list` to find a
   version-id. NOTE: a version rollback does **not** revert D1 schema/data — if the
   bad deploy ran a migration, restore D1 separately (§2).

2. **Clean — redeploy a previous git SHA:**

   ```bash
   git checkout <good-sha>
   pnpm run deploy
   git checkout -   # return to main
   ```

   Use this when code AND config (`wrangler.jsonc`, env) need to revert together.

**Migrations are forward-only here** — there are no down-migrations. To undo a
schema change, restore D1 from the pre-deploy dump (§2) or use Time Travel.

---

## 5. Incident response basics

### Where to look

- **Live logs (tail):** `npx wrangler tail tended --format=pretty` — streams Worker
  requests/exceptions in real time. Add `--status error` to filter.
- **Audit log (in-app, durable):** the `audit_log` D1 table records sensitive
  actions (certification, approvals, auth, admin). Surfaced at **`/admin/audit`**
  (read via `lib/observability.ts`). Query directly:
  ```bash
  npx wrangler d1 execute tended-db --remote \
    --command="SELECT created_at, actor_user_id, action, entity_type, entity_id FROM audit_log ORDER BY created_at DESC LIMIT 50"
  ```
- **System health page:** **`/admin/system`** (admin role) — operational status of
  DB, integrations, etc.
- **Cloudflare dashboard:** Workers → `tended` → Logs/Metrics for error rates and
  request volume; D1 → `tended-db` for size/Time-Travel; R2 → `tended-files`.

### Common levers

- **Disable a county's certification** (stop CF 888 issuance for a county, e.g.
  legal hold): the `counties` table gates the CF 888 path via `cert_enabled`
  (`lib/county.ts`). Flip it off:
  ```bash
  npx wrangler d1 execute tended-db --remote \
    --command="UPDATE counties SET cert_enabled=0, clearance_note='disabled <date>: <reason> ' WHERE id='<county_id>'"
  ```
  (SF is seeded as the only cleared county for the pilot.)
- **Reseed / reset data** (wipes + reseeds ALL tables — destructive, demo/staging
  only): `/admin/reset` (admin UI button) or
  `curl -X POST https://tended.xkbtrjm2bm.workers.dev/api/admin/reset`. **Never run
  against real user data** — take a backup first.
- **AI verdicts misbehaving:** the app already degrades to manual review on any
  OpenRouter failure (429/non-2xx/parse). If needed, `wrangler secret delete
  OPENROUTER_API_KEY` forces all submissions to manual review.
- **Bad deploy:** roll back (§4). **Bad data/migration:** restore D1 (§2).
- **Read direct DB state:**
  `npx wrangler d1 execute tended-db --remote --command="SELECT COUNT(*) FROM submissions"`.

### Triage order

1. Confirm scope: `wrangler tail` + `/admin/system` + CF dashboard metrics.
2. Stop the bleeding: rollback (code) or disable the affected lever (county/AI).
3. Protect data: take a backup before any corrective DB write.
4. Fix forward or restore.
5. Note actions in the audit trail / postmortem.

---

## 6. On-call checklist

**Daily**
- [ ] `pnpm run backup && pnpm run backup:verify` ran and passed (cron or manual).
- [ ] Error rate normal in CF dashboard (Workers → tended → Metrics).
- [ ] D1 size sane (CF dashboard → D1 → tended-db).

**Before every deploy**
- [ ] `pnpm run backup && pnpm run backup:verify` (fresh D1 snapshot).
- [ ] Migrations reviewed; `pnpm db:migrate:remote` applied.
- [ ] Current good git SHA noted (for rollback).
- [ ] `pnpm run deploy`; then smoke-test `/`, login, `/admin/system`.

**Weekly**
- [ ] Confirm ≥30 days of D1 dumps retained; prune older.
- [ ] Confirm R2 user-upload snapshot (rclone/S3 sync) is current.
- [ ] Confirm `PII_ENCRYPTION_KEY` is in the vault and matches prod (sample row
      decrypts).

**Incident**
- [ ] `wrangler tail tended` to scope.
- [ ] Backup D1 before any corrective write.
- [ ] Rollback (code) or restore (data) as appropriate (§§2,4).
- [ ] Disable affected county / AI key if needed (§5).
- [ ] Record actions; check `/admin/audit`.

**Quarterly (DR drill)**
- [ ] Restore the latest dump into a throwaway D1 and verify table counts +
      that encrypted PII decrypts with the prod key.
- [ ] Re-verify `wrangler d1 export`, `d1 execute`, and `rollback` syntax against
      the installed wrangler version.
