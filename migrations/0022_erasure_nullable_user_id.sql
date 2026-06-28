-- colift: Account erasure — make submissions.user_id and audits.user_id NULLABLE
-- (closes H6, completes PR #4 fix/erasure-sever-link)
--
-- DATA PRINCIPLE (CLAUDE.md): the public work product survives erasure; only the
-- link back to a person is cut. Erasure ORPHANS public-cluster rows (it never
-- deletes them) and NULLs every private→public cross-boundary key.
--
-- PR #4 already NULLs the nullable refs it could (submissions.public_session_ref,
-- audits.public_session_ref, submissions.user_notes) and deletes the private
-- certification source-of-truth (hours_ledger, cf888_forms). What it could NOT do
-- without a schema change is sever the OWNING link itself: submissions.user_id and
-- audits.user_id were declared `NOT NULL REFERENCES users(id)` (migrations 0001 and
-- 0006). That residual link means a deleted user is still pointed-to by their own
-- submission/audit rows. SQLite cannot ALTER a column's NOT NULL constraint in
-- place, so we rebuild both tables with the create-new / copy / drop / rename
-- pattern (same approach as 0016 and 0019), preserving ALL columns, defaults,
-- CHECK constraints, FKs, and indexes EXACTLY — only `user_id` changes from
-- `NOT NULL REFERENCES users(id)` to `REFERENCES users(id)` (nullable).
--
-- After this migration, deleteAccount (app/app/settings/actions.ts) NULLs
-- submissions.user_id and audits.user_id, completing the orphan-not-delete.
--
-- ⚠️ HIGH-RISK TABLE REBUILD. Take a D1 backup / snapshot before applying. Apply
-- as its OWN deployment step, separate from 0021.

-- Both rebuilt tables are FK-referenced by other tables, and they themselves carry
-- FKs to users/task_templates/stores; intermediate states transiently violate FKs.
-- Defer FK enforcement to the end of the (implicit) migration transaction.
PRAGMA defer_foreign_keys = ON;

-- ============ submissions: user_id NOT NULL -> NULLABLE ============
-- Columns reproduced in their effective order: 0001 CREATE columns, then the
-- ALTER-added columns (0003 measured_active_seconds, idle_seconds; 0004
-- published_at; 0019 public_session_ref).

CREATE TABLE submissions_new (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  task_template_id TEXT NOT NULL REFERENCES task_templates(id),
  status TEXT NOT NULL
    CHECK (status IN ('committed','in_progress','submitted',
      'ai_reviewing','pending_review','approved','rejected',
      'needs_changes')),
  committed_at INTEGER NOT NULL,
  first_started_at INTEGER,
  submitted_at INTEGER,
  reviewed_at INTEGER,
  time_log_json TEXT NOT NULL DEFAULT '[]',
  checklist_progress_json TEXT NOT NULL DEFAULT '{}',
  user_notes TEXT,
  ai_verdict_json TEXT,
  reviewer_id TEXT REFERENCES users(id),
  reviewer_notes TEXT,
  hours_credited REAL,
  measured_active_seconds INTEGER NOT NULL DEFAULT 0,
  idle_seconds INTEGER NOT NULL DEFAULT 0,
  published_at INTEGER,
  public_session_ref TEXT
);

INSERT INTO submissions_new
  (id, user_id, task_template_id, status, committed_at, first_started_at,
   submitted_at, reviewed_at, time_log_json, checklist_progress_json, user_notes,
   ai_verdict_json, reviewer_id, reviewer_notes, hours_credited,
   measured_active_seconds, idle_seconds, published_at, public_session_ref)
SELECT
   id, user_id, task_template_id, status, committed_at, first_started_at,
   submitted_at, reviewed_at, time_log_json, checklist_progress_json, user_notes,
   ai_verdict_json, reviewer_id, reviewer_notes, hours_credited,
   measured_active_seconds, idle_seconds, published_at, public_session_ref
FROM submissions;

DROP TABLE submissions;
ALTER TABLE submissions_new RENAME TO submissions;

-- Recreate indexes (0001 + 0019).
CREATE INDEX idx_submissions_user ON submissions(user_id);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_submissions_task ON submissions(task_template_id);
CREATE UNIQUE INDEX idx_submissions_public_session_ref
  ON submissions(public_session_ref) WHERE public_session_ref IS NOT NULL;

-- ============ audits: user_id NOT NULL -> NULLABLE ============
-- Columns reproduced in their effective order: 0006 CREATE columns, then the
-- ALTER-added columns (0010 store_*_snapshot; 0011 commute_mode; 0012
-- commute_user_minutes; 0016 public_session_ref).

CREATE TABLE audits_new (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL REFERENCES submissions(id),
  user_id TEXT REFERENCES users(id),
  store_id TEXT REFERENCES stores(id),
  basket_template_id TEXT NOT NULL,
  basket_template_version TEXT NOT NULL,
  store_type_observed TEXT,
  ebt_observation TEXT,
  started_at INTEGER NOT NULL,
  submitted_at INTEGER,
  session_time_seconds INTEGER NOT NULL DEFAULT 0,
  validation_status TEXT NOT NULL DEFAULT 'draft'
    CHECK (validation_status IN ('draft','submitted','validating','verified','flagged','rejected')),
  validation_flag_count INTEGER NOT NULL DEFAULT 0,
  credited_hours REAL,
  trust_tier_at_submission INTEGER NOT NULL DEFAULT 0,
  store_name_snapshot TEXT,
  store_address_snapshot TEXT,
  store_geocode_lat_snapshot REAL,
  store_geocode_lng_snapshot REAL,
  commute_mode TEXT,
  commute_user_minutes INTEGER,
  public_session_ref TEXT
);

INSERT INTO audits_new
  (id, submission_id, user_id, store_id, basket_template_id, basket_template_version,
   store_type_observed, ebt_observation, started_at, submitted_at, session_time_seconds,
   validation_status, validation_flag_count, credited_hours, trust_tier_at_submission,
   store_name_snapshot, store_address_snapshot, store_geocode_lat_snapshot,
   store_geocode_lng_snapshot, commute_mode, commute_user_minutes, public_session_ref)
SELECT
   id, submission_id, user_id, store_id, basket_template_id, basket_template_version,
   store_type_observed, ebt_observation, started_at, submitted_at, session_time_seconds,
   validation_status, validation_flag_count, credited_hours, trust_tier_at_submission,
   store_name_snapshot, store_address_snapshot, store_geocode_lat_snapshot,
   store_geocode_lng_snapshot, commute_mode, commute_user_minutes, public_session_ref
FROM audits;

DROP TABLE audits;
ALTER TABLE audits_new RENAME TO audits;

-- Recreate indexes (0006 + 0016).
CREATE INDEX idx_audits_user_store ON audits(user_id, store_id, submitted_at);
CREATE INDEX idx_audits_submission ON audits(submission_id);
CREATE UNIQUE INDEX idx_audits_public_session_ref ON audits(public_session_ref);
