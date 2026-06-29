-- H6 completion (account erasure): anonymous DELETED_USER sentinel.
--
-- The abandoned 0022 made submissions.user_id / audits.user_id nullable via a
-- table rebuild so erasure could NULL the owner. D1 enforces foreign keys at
-- migration COMMIT, and that rebuild failed an FK constraint and was
-- auto-rolled-back. This achieves the SAME erasure outcome WITHOUT a rebuild:
-- a deleted person's private rows are reassigned to this anonymous sentinel
-- (user_id stays NOT NULL, but points at a row with no PII), severing the
-- private->public re-identification link.
--
-- Additive + idempotent (INSERT OR IGNORE). The sentinel carries no Firebase
-- identity (firebase_uid NULL) so it can never be logged into, and an .invalid
-- email so it can never collide with or be mistaken for a real account.
INSERT OR IGNORE INTO users (id, email, role, intent, created_at)
VALUES ('user_deleted', 'deleted-account@colift.invalid', 'recipient', 'n/a', 0);
