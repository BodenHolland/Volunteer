-- TENDED: gov-audit working draft state.
--
-- In-progress rubric answers live HERE, in the private cluster, as a JSON blob
-- — never in the public tables. Drafts can hold partial data and unmoderated
-- free text, so they must not be reachable by the public export. On finalize
-- the server materializes the public-cluster rows (site_evaluations,
-- page_evaluations, auto_checks) from this blob, which makes the public cluster
-- append-only-on-finalize. Mirrors the submissions.checklist_progress_json /
-- time_log_json pattern already used in this codebase.

ALTER TABLE gov_audit_sessions ADD COLUMN draft_json TEXT NOT NULL DEFAULT '{}';
