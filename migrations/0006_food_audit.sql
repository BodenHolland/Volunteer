-- TENDED: Food Access Price Audit (Slice 1)
-- One submissions row per audit (threads existing review queue + hours_ledger + CF888).
-- Audit-specific structure lives in these new tables, joined via submission_id.

CREATE TABLE basket_templates (
  id TEXT PRIMARY KEY,
  version TEXT NOT NULL,
  display_name TEXT NOT NULL,
  items_json TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE stores (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  geocode_lat REAL,
  geocode_lng REAL,
  google_place_id TEXT,
  created_by_user_id TEXT REFERENCES users(id),
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_stores_geocode ON stores(geocode_lat, geocode_lng);

CREATE TABLE audits (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL REFERENCES submissions(id),
  user_id TEXT NOT NULL REFERENCES users(id),
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
  trust_tier_at_submission INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_audits_user_store ON audits(user_id, store_id, submitted_at);
CREATE INDEX idx_audits_submission ON audits(submission_id);

CREATE TABLE audit_item_captures (
  id TEXT PRIMARY KEY,
  audit_id TEXT NOT NULL REFERENCES audits(id),
  basket_item_id TEXT NOT NULL,
  stock_status TEXT NOT NULL
    CHECK (stock_status IN ('in-stock','out-of-stock','not-sold-at-this-store')),
  price_usd REAL,
  size_value REAL,
  size_unit TEXT,
  produce_pricing_mode TEXT,
  photo_id TEXT,
  captured_at INTEGER NOT NULL,
  UNIQUE (audit_id, basket_item_id)
);

CREATE TABLE audit_photos (
  id TEXT PRIMARY KEY,
  audit_id TEXT NOT NULL REFERENCES audits(id),
  audit_item_capture_id TEXT REFERENCES audit_item_captures(id),
  r2_key TEXT NOT NULL,
  thumb_r2_key TEXT,
  sha256 TEXT,
  exif_timestamp INTEGER,
  exif_geocode_lat REAL,
  exif_geocode_lng REAL,
  uploaded_at INTEGER NOT NULL,
  vision_validation_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (vision_validation_status IN ('pending','running','passed','failed','skipped')),
  vision_result_json TEXT,
  ocr_price_value REAL
);

CREATE TABLE audit_validation_flags (
  id TEXT PRIMARY KEY,
  audit_id TEXT NOT NULL REFERENCES audits(id),
  flag_type TEXT NOT NULL,
  flag_severity TEXT NOT NULL CHECK (flag_severity IN ('block','review')),
  flag_reason TEXT NOT NULL,
  flag_metadata_json TEXT,
  created_at INTEGER NOT NULL,
  resolution_status TEXT NOT NULL DEFAULT 'open'
    CHECK (resolution_status IN ('open','resolved-accept','resolved-reject','resolved-accept-with-correction')),
  resolved_by_admin_id TEXT REFERENCES users(id),
  resolved_at INTEGER,
  admin_note TEXT
);
CREATE INDEX idx_audit_flags_audit ON audit_validation_flags(audit_id);

CREATE TABLE volunteer_trust (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  tier INTEGER NOT NULL DEFAULT 0,
  audits_completed INTEGER NOT NULL DEFAULT 0,
  audits_flagged INTEGER NOT NULL DEFAULT 0,
  audits_rejected INTEGER NOT NULL DEFAULT 0,
  failed_audits_30_day_window INTEGER NOT NULL DEFAULT 0,
  last_recalculated_at INTEGER NOT NULL
);
