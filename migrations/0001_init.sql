-- TENDED schema (D1 / SQLite)

CREATE TABLE orgs (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  ein TEXT,
  contact_email TEXT,
  logo_url TEXT,
  about_md TEXT,
  address_json TEXT,
  signing_authority_name TEXT,
  signing_authority_title TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('pending','active','paused')),
  is_fictional INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL
    CHECK (role IN ('recipient','org_member','admin')),
  org_role TEXT CHECK (org_role IN ('reviewer','org_admin')),
  full_name TEXT,
  city TEXT,
  state TEXT,
  intent TEXT
    CHECK (intent IN ('snap_cert','casual_volunteer','other','n/a'))
    DEFAULT 'n/a',
  legal_name TEXT,
  case_number TEXT,
  address_json TEXT,
  dob TEXT,
  phone TEXT,
  phone_verified_at INTEGER,
  benefitscal_screenshot_r2_key TEXT,
  benefitscal_verified_at INTEGER,
  org_id TEXT REFERENCES orgs(id),
  created_at INTEGER NOT NULL
);

CREATE TABLE task_templates (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES orgs(id),
  created_by_user_id TEXT REFERENCES users(id),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  short_description TEXT NOT NULL,
  instructions_md TEXT NOT NULL,
  checklist_json TEXT NOT NULL,
  deliverable_spec_json TEXT NOT NULL,
  validation_rubric_md TEXT NOT NULL,
  est_hours REAL NOT NULL,
  max_hours REAL NOT NULL,
  location_kind TEXT NOT NULL
    CHECK (location_kind IN ('online','in_person','hybrid')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('draft','active','paused','archived')),
  created_at INTEGER NOT NULL
);

CREATE TABLE submissions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
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
  hours_credited REAL
);

CREATE TABLE submission_files (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL REFERENCES submissions(id),
  kind TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  metadata_json TEXT
);

CREATE TABLE submission_flags (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL REFERENCES submissions(id),
  kind TEXT NOT NULL
    CHECK (kind IN ('duplicate_image','likely_ai_content',
      'geotag_mismatch','velocity_anomaly')),
  severity TEXT NOT NULL CHECK (severity IN ('warn','flag','block')),
  evidence_json TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE hours_ledger (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  month TEXT NOT NULL,
  total_hours REAL NOT NULL,
  certified_org_id TEXT REFERENCES orgs(id),
  UNIQUE (user_id, month, certified_org_id)
);

CREATE TABLE cf888_forms (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  month TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  generated_at INTEGER NOT NULL
);

CREATE TABLE feedback (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  email TEXT,
  body TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_submissions_user ON submissions(user_id);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_submissions_task ON submissions(task_template_id);
CREATE INDEX idx_users_intent ON users(intent);
CREATE INDEX idx_users_org ON users(org_id);
CREATE INDEX idx_task_templates_org ON task_templates(org_id);
CREATE INDEX idx_submission_flags_submission ON submission_flags(submission_id);
