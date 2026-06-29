-- colift: DB performance + retention hardening (closes C7, H7, H8, H9, M2, M4, M10, M12, L2)
--
-- Purely additive: new indexes (all IF NOT EXISTS) and a handful of nullable
-- columns + one-time backfills. No table rebuilds, no data loss, safe to apply
-- on a live DB. D1 migrations are NOT auto-run — apply this with
-- `wrangler d1 migrations apply tended-db` (and `--local` for dev) BEFORE
-- merging the code that references the new columns/indexes.
--
-- New columns are referenced from code via dynamic/string SQL so the TypeScript
-- compiles against the current schema; the queries only succeed once this runs.

PRAGMA defer_foreign_keys = ON;

-- ============================================================================
-- C7: indexed image-dedup. lib/process.ts no longer scans the whole
-- submission_files table for prior duplicates — it looks up rows whose
-- json_extract(metadata_json,'$.sha256') matches one of the current
-- submission's hashes. This expression index makes that lookup an index seek.
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_submission_files_sha256
  ON submission_files (json_extract(metadata_json, '$.sha256'));

-- submission_id lookups (load a submission's files) — used everywhere the
-- pipeline / detail pages fetch files for one submission.
CREATE INDEX IF NOT EXISTS idx_submission_files_submission
  ON submission_files (submission_id);

-- ============================================================================
-- H8: indexes backing the hot aggregate / list queries.
-- ============================================================================
-- Org dashboard hours-sponsored SUM (queries.ts getOrgDashboard) and the CF 888
-- generator read hours_ledger by (certified_org_id, month).
CREATE INDEX IF NOT EXISTS idx_hours_ledger_org_month
  ON hours_ledger (certified_org_id, month);

-- Admin audit-log viewer (observability.ts getRecentAudit) filters by action
-- and always orders by created_at DESC.
CREATE INDEX IF NOT EXISTS idx_audit_log_action_created
  ON audit_log (action, created_at);

-- Recipient submission list (queries.ts listSubmissionsForUser) selects by
-- user_id ordered by committed_at DESC.
CREATE INDEX IF NOT EXISTS idx_submissions_user_committed
  ON submissions (user_id, committed_at);

-- CF 888 month lookup / dashboard (cf888_forms by user + month).
CREATE INDEX IF NOT EXISTS idx_cf888_forms_user_month
  ON cf888_forms (user_id, month);

-- ============================================================================
-- gov-audit public-cluster freshness: add published_at so the public export
-- can filter to finalized work and order deterministically, mirroring the
-- published_at pattern already used by submissions (0004) and ems_rate_reports
-- (0015). NULL = not yet published.
-- ============================================================================
ALTER TABLE gov_audit_page_evaluations ADD COLUMN published_at INTEGER;
ALTER TABLE gov_audit_site_evaluations ADD COLUMN published_at INTEGER;

CREATE INDEX IF NOT EXISTS idx_gov_audit_page_eval_published
  ON gov_audit_page_evaluations (published_at);
CREATE INDEX IF NOT EXISTS idx_gov_audit_site_eval_published
  ON gov_audit_site_evaluations (published_at);

-- One-time backfill: a finalized session's public-cluster rows are published as
-- of the session's finalized_at. Joined through the opaque public_session_ref
-- (the only cross-cluster key). Only rows still NULL are touched so re-running
-- (or a partial prior apply) is a no-op.
UPDATE gov_audit_page_evaluations
   SET published_at = (
     SELECT s.finalized_at FROM gov_audit_sessions s
      WHERE s.public_session_ref = gov_audit_page_evaluations.public_session_ref
        AND s.status = 'finalized'
        AND s.finalized_at IS NOT NULL
   )
 WHERE published_at IS NULL
   AND public_session_ref IN (
     SELECT public_session_ref FROM gov_audit_sessions
      WHERE status = 'finalized' AND finalized_at IS NOT NULL
   );

UPDATE gov_audit_site_evaluations
   SET published_at = (
     SELECT s.finalized_at FROM gov_audit_sessions s
      WHERE s.public_session_ref = gov_audit_site_evaluations.public_session_ref
        AND s.status = 'finalized'
        AND s.finalized_at IS NOT NULL
   )
 WHERE published_at IS NULL
   AND public_session_ref IN (
     SELECT public_session_ref FROM gov_audit_sessions
      WHERE status = 'finalized' AND finalized_at IS NOT NULL
   );

-- ============================================================================
-- external-certificate verification: reviewer records the cumulative minutes
-- the volunteer reported on the provider certificate, so credited_minutes can
-- be cross-checked against the source-of-truth number. Used by the
-- external-cert PR. NULL on existing rows.
-- ============================================================================
ALTER TABLE certificate_reviews ADD COLUMN reported_cumulative_minutes INTEGER;

-- ============================================================================
-- Backfill a monthly minutes cap for external_certificate task templates that
-- DECISION (owner): NO hard monthly cap on external-certificate tasks. The gate
-- is MANUAL REVIEW (EXTERNAL_CERT_AUTO_APPROVE off by default) + delta-vs-
-- cumulative crediting + re-export/dup detection, so a cert cannot credit
-- unbounded or repeated hours. monthly_minutes_cap stays NULL (the submit path
-- treats NULL as "no cap"). If auto-approve is ever enabled, add a review
-- THRESHOLD here rather than reinstating a hard cap.
-- ============================================================================
-- (no cap backfill — left NULL by decision)
