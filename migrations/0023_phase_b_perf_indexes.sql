-- Phase B performance indexes (post-ship review). Purely additive — all
-- IF NOT EXISTS, no data change, safe to apply on a live DB. Apply to remote
-- BEFORE merging dependent code (these only speed existing queries, so the code
-- is correct without them, but apply first per the migrate-before-merge rule).

-- D4: recomputeTrust() counts a user's audits by validation_status on every
-- pipeline run; the only prior audits(user_id,...) index leads with store_id, so
-- the status counts scanned the user's whole history. This serves them by seek.
CREATE INDEX IF NOT EXISTS idx_audits_user_status
  ON audits (user_id, validation_status, submitted_at);

-- D1: the org review queue + dashboard filter submissions by the org's tasks and
-- sort by submitted_at; nothing indexed that sort path before.
CREATE INDEX IF NOT EXISTS idx_submissions_task_submitted
  ON submissions (task_template_id, submitted_at);

-- D5: the gov-audit public export LEFT JOINs auto_checks on
-- (public_session_ref, url); only public_session_ref was indexed, leaving the
-- url equality as a per-session string scan.
CREATE INDEX IF NOT EXISTS idx_gov_audit_auto_checks_ref_url
  ON gov_audit_auto_checks (public_session_ref, url);

-- D6: the admin audit-log default view orders by created_at with no action
-- filter; the 0021 (action, created_at) index can't satisfy a pure created_at
-- sort, so it filesorted the whole (append-only, year-retained) table.
CREATE INDEX IF NOT EXISTS idx_audit_log_created
  ON audit_log (created_at);
