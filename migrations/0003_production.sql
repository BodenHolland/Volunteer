-- Production phase-2 schema (shared so parallel workstreams don't collide).

-- Immutable audit log for sensitive actions (certification, approvals, auth, admin).
CREATE TABLE audit_log (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  detail_json TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_actor ON audit_log(actor_user_id);

-- Hours integrity: measured active engagement vs idle (the credit basis).
ALTER TABLE submissions ADD COLUMN measured_active_seconds INTEGER NOT NULL DEFAULT 0;
ALTER TABLE submissions ADD COLUMN idle_seconds INTEGER NOT NULL DEFAULT 0;

-- 4-part beneficiary gate: a template cannot go active until all four pass.
ALTER TABLE task_templates ADD COLUMN gate_external_beneficiary INTEGER NOT NULL DEFAULT 0;
ALTER TABLE task_templates ADD COLUMN gate_genuine_need INTEGER NOT NULL DEFAULT 0;
ALTER TABLE task_templates ADD COLUMN gate_free_deliverable INTEGER NOT NULL DEFAULT 0;
ALTER TABLE task_templates ADD COLUMN gate_would_do_anyway INTEGER NOT NULL DEFAULT 0;
ALTER TABLE task_templates ADD COLUMN gate_reviewed_by TEXT;
ALTER TABLE task_templates ADD COLUMN gate_reviewed_at INTEGER;

-- Account lifecycle + notification preferences.
ALTER TABLE users ADD COLUMN notify_prefs_json TEXT;
ALTER TABLE users ADD COLUMN deleted_at INTEGER;

-- Org team invitations.
CREATE TABLE org_invites (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES orgs(id),
  email TEXT NOT NULL,
  org_role TEXT NOT NULL CHECK (org_role IN ('reviewer','org_admin')),
  invited_by TEXT REFERENCES users(id),
  created_at INTEGER NOT NULL,
  accepted_at INTEGER
);
CREATE INDEX idx_org_invites_org ON org_invites(org_id);

-- Per-county certification pre-clearance gating.
CREATE TABLE counties (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  state TEXT NOT NULL,
  cert_enabled INTEGER NOT NULL DEFAULT 0,
  cleared_at INTEGER,
  clearance_note TEXT
);

-- Notification outbox (durable record of what we tried to send).
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  channel TEXT NOT NULL CHECK (channel IN ('email','sms')),
  kind TEXT NOT NULL,
  payload_json TEXT,
  created_at INTEGER NOT NULL,
  sent_at INTEGER,
  status TEXT NOT NULL DEFAULT 'queued'
);
CREATE INDEX idx_notifications_user ON notifications(user_id);
