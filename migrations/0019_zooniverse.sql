-- colift: Zooniverse-verified citizen-science tasks (PRD docs/prd-zooniverse-verification.md)
--
-- Plugs a new evidence_mode='external_certificate' path into the existing
-- task_templates → submissions → submission_files → hours_ledger pipeline.
-- Approval also writes a row to the PUBLIC cluster table zooniverse_public_activity,
-- which holds no PII and is exported free at /api/data/zooniverse-activity.{csv,json}.
--
-- Public/private split: zooniverse_public_activity is keyed by an opaque
-- public_session_ref, mirrors the pattern from 0016_food_audit_public_cluster.
-- It has no FK to users/submissions — erasure orphans the row, the work product stays.

PRAGMA defer_foreign_keys = ON;

-- ============ task_templates: external provider columns ============

ALTER TABLE task_templates ADD COLUMN external_provider TEXT;
ALTER TABLE task_templates ADD COLUMN evidence_mode TEXT NOT NULL DEFAULT 'in_app';
ALTER TABLE task_templates ADD COLUMN monthly_minutes_cap INTEGER;

-- ============ submissions: public_session_ref for external work ============
-- Only populated for evidence_mode='external_certificate' submissions, at commit
-- time. The single cross-boundary key into zooniverse_public_activity.

ALTER TABLE submissions ADD COLUMN public_session_ref TEXT;
CREATE UNIQUE INDEX idx_submissions_public_session_ref
  ON submissions(public_session_ref) WHERE public_session_ref IS NOT NULL;

-- ============ external_project_catalog ============
-- Per-task catalog metadata that doesn't belong on task_templates itself.
-- The 4-part beneficiary gate is on task_templates (migration 0003); admins
-- attest there. This table holds only provider-shaped fields.

CREATE TABLE external_project_catalog (
  task_template_id        TEXT PRIMARY KEY REFERENCES task_templates(id),
  provider                TEXT NOT NULL CHECK (provider IN ('zooniverse')),
  external_project_id     TEXT NOT NULL,
  external_project_slug   TEXT NOT NULL,
  project_url             TEXT NOT NULL,
  allowed_workflow_ids    TEXT NOT NULL DEFAULT '[]',
  public_benefit_summary  TEXT NOT NULL,
  task_type_label         TEXT NOT NULL,
  active                  INTEGER NOT NULL DEFAULT 1,
  created_at              INTEGER NOT NULL
);
CREATE INDEX idx_external_project_catalog_active
  ON external_project_catalog(provider, active);

-- ============ certificate_reviews ============
-- Structured reviewer checklist. One row per reviewed external-certificate submission.

CREATE TABLE certificate_reviews (
  submission_id           TEXT PRIMARY KEY REFERENCES submissions(id),
  reviewer_id             TEXT NOT NULL REFERENCES users(id),
  cert_name_matches_user  TEXT NOT NULL CHECK (cert_name_matches_user IN ('yes','no','unclear')),
  date_range_present      TEXT NOT NULL CHECK (date_range_present     IN ('yes','no','unclear')),
  hours_present           TEXT NOT NULL CHECK (hours_present          IN ('yes','no','unclear')),
  project_scope_match     TEXT NOT NULL CHECK (project_scope_match    IN ('yes','no','unclear')),
  signature_present       TEXT NOT NULL CHECK (signature_present      IN ('yes','no','unclear')),
  duplicate_file_match    INTEGER NOT NULL,
  decision                TEXT NOT NULL CHECK (decision IN ('approved','rejected','needs_information')),
  reviewer_note           TEXT,
  credited_minutes        INTEGER,
  reviewed_at             INTEGER NOT NULL
);

-- ============ zooniverse_public_activity (PUBLIC cluster) ============
-- One row per approved external-certificate submission. NO PII. NO FK to users
-- or submissions. The opaque public_session_ref is the only link, and erasing
-- a submissions row just orphans this row under a ref that resolves to nobody.

CREATE TABLE zooniverse_public_activity (
  public_session_ref      TEXT PRIMARY KEY,
  external_project_id     TEXT NOT NULL,
  external_project_slug   TEXT NOT NULL,
  task_type_label         TEXT NOT NULL,
  reporting_month         TEXT NOT NULL,
  credited_minutes        INTEGER NOT NULL,
  evidence_tier           TEXT NOT NULL
    CHECK (evidence_tier IN ('provider_certificate_confirmed')),
  approved_at             INTEGER NOT NULL
);
CREATE INDEX idx_zooniverse_public_month
  ON zooniverse_public_activity(reporting_month);
CREATE INDEX idx_zooniverse_public_project
  ON zooniverse_public_activity(external_project_id);

-- ============ submission_flags.kind: extend CHECK ============
-- SQLite can't ALTER a CHECK constraint. Rebuild the table with the extended
-- set: original four flag kinds + three new external-certificate flag kinds.

CREATE TABLE submission_flags_new (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL REFERENCES submissions(id),
  kind TEXT NOT NULL
    CHECK (kind IN (
      'duplicate_image',
      'likely_ai_content',
      'geotag_mismatch',
      'velocity_anomaly',
      'duplicate_certificate',
      'cert_user_name_mismatch',
      'monthly_cap_exceeded'
    )),
  severity TEXT NOT NULL CHECK (severity IN ('warn','flag','block')),
  evidence_json TEXT,
  created_at INTEGER NOT NULL
);
INSERT INTO submission_flags_new (id, submission_id, kind, severity, evidence_json, created_at)
  SELECT id, submission_id, kind, severity, evidence_json, created_at FROM submission_flags;
DROP TABLE submission_flags;
ALTER TABLE submission_flags_new RENAME TO submission_flags;
CREATE INDEX idx_submission_flags_submission ON submission_flags(submission_id);
