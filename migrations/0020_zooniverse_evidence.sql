-- colift: tighten Zooniverse certificate verification with two more evidence pieces.
--
-- Volunteers now provide three pieces that a reviewer can cross-check:
--   1. Zooniverse profile URL (so reviewer can open it and verify the account)
--   2. Profile dashboard screenshot (cumulative stats / identity in Zooniverse UI)
--   3. Volunteer Certificate (already required)
--
-- The reviewer answers two new structured questions confirming the three pieces
-- point at the same person and same body of work.

PRAGMA defer_foreign_keys = ON;

-- ============ certificate_reviews: two new triple-field columns ============
-- SQLite doesn't support ADD COLUMN with CHECK constraints inline cleanly, so
-- we add the columns then rely on app-level validation. Existing rows get
-- 'unclear' so they don't fail the NOT NULL constraint at first read.

ALTER TABLE certificate_reviews
  ADD COLUMN profile_url_matches TEXT NOT NULL DEFAULT 'unclear';

ALTER TABLE certificate_reviews
  ADD COLUMN screenshot_supports_certificate TEXT NOT NULL DEFAULT 'unclear';
