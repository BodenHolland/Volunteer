-- Link a Firebase Auth identity to our D1 user (Firebase owns the credential;
-- D1 keeps roles, PII, audit, hours). Email stays the human key; firebase_uid is
-- the stable link.
ALTER TABLE users ADD COLUMN firebase_uid TEXT;
CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);
