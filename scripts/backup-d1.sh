#!/usr/bin/env bash
#
# backup-d1.sh — Export the remote TENDED D1 database to a timestamped SQL dump.
#
# WHAT IT DOES
#   Runs `wrangler d1 export tended-db --remote` and writes a full schema+data
#   .sql file to backups/tended-d1-<UTCtimestamp>.sql. This is a logical dump
#   (CREATE TABLE + INSERT statements) that can be replayed with
#   `wrangler d1 execute tended-db --remote --file=<dump>` (see docs/ops-runbook.md).
#
# CADENCE
#   - Run DAILY (cron / scheduled job), and
#   - ALWAYS before each `pnpm run deploy` and before applying any migration.
#   D1 also has Time Travel (30-day point-in-time restore) as a second line of
#   defense, but these explicit dumps are the portable, off-platform copy.
#
# RETENTION
#   Keep >= 30 daily backups. Prune older ones (manual or cron). Backups land in
#   backups/ which is gitignored — never commit DB dumps (they contain PII).
#   For long-term/off-site retention, copy the dump to encrypted cold storage.
#
# REQUIREMENTS
#   wrangler (3.114.x verified) authenticated to account 65fb048fa9b4fb99f6473038c393d6a0.
#   Node 22: export PATH="$HOME/.nvm/versions/node/v22.22.3/bin:$PATH"
#
set -euo pipefail

# Resolve repo root (this script lives in <repo>/scripts/).
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${REPO_ROOT}"

DB_NAME="tended-db"
BACKUP_DIR="${REPO_ROOT}/backups"
# Explicit UTC timestamp, e.g. 20260619T231500Z — passed literally, no surprises.
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUTPUT="${BACKUP_DIR}/tended-d1-${TIMESTAMP}.sql"

mkdir -p "${BACKUP_DIR}"

echo "Exporting D1 '${DB_NAME}' (remote) -> ${OUTPUT}"

# wrangler 3.114 syntax: `wrangler d1 export <name> --remote --output=<file>`.
# --remote targets the live D1 (not the local dev copy). Full schema + data.
npx wrangler d1 export "${DB_NAME}" --remote --output="${OUTPUT}"

if [[ ! -s "${OUTPUT}" ]]; then
  echo "ERROR: export produced no output at ${OUTPUT}" >&2
  exit 1
fi

# Report path + human-readable size.
SIZE="$(ls -lh "${OUTPUT}" | awk '{print $5}')"
echo "Backup complete:"
echo "  file: ${OUTPUT}"
echo "  size: ${SIZE}"
echo
echo "Verify it with: bash scripts/verify-backup.sh"
