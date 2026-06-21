-- Slice 3: Open Prices contribution tracking + retry queue.
CREATE TABLE open_prices_contributions (
  id TEXT PRIMARY KEY,
  audit_id TEXT NOT NULL REFERENCES audits(id),
  audit_item_capture_id TEXT NOT NULL REFERENCES audit_item_captures(id),
  basket_item_id TEXT NOT NULL,
  product_code TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','sent','failed','skipped')),
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  open_prices_id TEXT,
  posted_at INTEGER,
  next_retry_at INTEGER,
  created_at INTEGER NOT NULL,
  UNIQUE (audit_item_capture_id)
);
CREATE INDEX idx_op_contrib_audit ON open_prices_contributions(audit_id);
CREATE INDEX idx_op_contrib_retry ON open_prices_contributions(status, next_retry_at);
