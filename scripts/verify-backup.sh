#!/usr/bin/env bash
#
# verify-backup.sh — Sanity-check the most recent D1 backup.
#
# Confirms the latest backups/tended-d1-*.sql file:
#   1. exists and is non-empty, and
#   2. contains the expected core table DDL (users, task_templates, submissions).
#
# Exits non-zero on any failure so it can gate a deploy / be wired into CI.
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
BACKUP_DIR="${REPO_ROOT}/backups"

if [[ ! -d "${BACKUP_DIR}" ]]; then
  echo "FAIL: no backups/ directory at ${BACKUP_DIR}. Run scripts/backup-d1.sh first." >&2
  exit 1
fi

# Newest backup file by name (timestamps sort lexicographically).
LATEST="$(ls -1 "${BACKUP_DIR}"/tended-d1-*.sql 2>/dev/null | sort | tail -n 1 || true)"

if [[ -z "${LATEST}" ]]; then
  echo "FAIL: no tended-d1-*.sql backup found in ${BACKUP_DIR}." >&2
  exit 1
fi

echo "Verifying latest backup: ${LATEST}"

if [[ ! -s "${LATEST}" ]]; then
  echo "FAIL: backup file is empty: ${LATEST}" >&2
  exit 1
fi

SIZE="$(ls -lh "${LATEST}" | awk '{print $5}')"
echo "  size: ${SIZE}"

# Expected core tables. grep -q is case-sensitive; wrangler emits `CREATE TABLE`.
EXPECTED_TABLES=("users" "task_templates" "submissions")
MISSING=0
for table in "${EXPECTED_TABLES[@]}"; do
  if grep -Eq "CREATE TABLE[[:space:]]+(IF NOT EXISTS[[:space:]]+)?[\"\`]?${table}[\"\`]?" "${LATEST}"; then
    echo "  ok: CREATE TABLE ${table}"
  else
    echo "  MISSING: CREATE TABLE ${table}" >&2
    MISSING=1
  fi
done

if [[ "${MISSING}" -ne 0 ]]; then
  echo "FAIL: backup is missing expected table DDL — do NOT trust it." >&2
  exit 1
fi

echo "PASS: backup looks valid (${LATEST})"
