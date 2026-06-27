-- TENDED hardening: indexes for hot paths surfaced by the code audit.
-- All IF NOT EXISTS so re-running the migration is safe.

-- Duplicate-image fraud check: replaces a full-table scan of submission_files
-- with an index lookup on the sha256 stored inside metadata_json. The query in
-- lib/process.ts now filters by json_extract(metadata_json,'$.sha256') IN (…),
-- which this expression index serves directly.
CREATE INDEX IF NOT EXISTS idx_submission_files_sha
  ON submission_files(json_extract(metadata_json, '$.sha256'));

-- Per-submission file lookups (load files for a submission).
CREATE INDEX IF NOT EXISTS idx_submission_files_submission
  ON submission_files(submission_id);

-- CF 888 + dashboard read the ledger by (org, month) and (user, month).
CREATE INDEX IF NOT EXISTS idx_hours_ledger_org_month
  ON hours_ledger(certified_org_id, month);

-- Trust recompute + audit history scan by user and status.
CREATE INDEX IF NOT EXISTS idx_audits_user_status
  ON audits(user_id, validation_status);

-- Audit-log queries ordered/filtered by time.
CREATE INDEX IF NOT EXISTS idx_audit_log_created
  ON audit_log(created_at);

-- Recipient dashboard lists committed work newest-first.
CREATE INDEX IF NOT EXISTS idx_submissions_user_committed
  ON submissions(user_id, committed_at);

-- CF 888 generation looks up prior forms by (user, month).
CREATE INDEX IF NOT EXISTS idx_cf888_user_month
  ON cf888_forms(user_id, month);
