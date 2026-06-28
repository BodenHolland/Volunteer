import { test } from "node:test";
import assert from "node:assert";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

// node:sqlite is a stable Node 22 built-in, but @types/node@20 (pinned in this
// repo) predates its type declarations, so it has no module typing. Load it via
// createRequire and type only the minimal surface we use. Runtime is real.
interface StatementSync {
  run(...params: unknown[]): { changes: number; lastInsertRowid: number | bigint };
  get(...params: unknown[]): unknown;
  all(...params: unknown[]): unknown[];
}
interface DatabaseSyncInstance {
  exec(sql: string): void;
  prepare(sql: string): StatementSync;
  close(): void;
}
interface DatabaseSyncCtor {
  new (path: string): DatabaseSyncInstance;
}
const { DatabaseSync } = createRequire(import.meta.url)("node:sqlite") as {
  DatabaseSync: DatabaseSyncCtor;
};

// H6 — account erasure completion: severing the private→public link FULLY.
//
// This is a behavioral test, not a string-match test. It applies the real
// migration chain (through 0022_erasure_nullable_user_id) to an in-memory
// SQLite database, seeds a deleting user with public work-product rows
// (submissions + audits) that carry the cross-boundary key and an owning
// user_id, then runs the SAME erasure statements that deleteAccount issues
// (app/app/settings/actions.ts), and asserts that NO value links the deleted
// user back to their orphaned public rows.

const migrationsDir = fileURLToPath(new URL("../migrations", import.meta.url));

function applyAllMigrations(db: DatabaseSyncInstance) {
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const f of files) {
    db.exec(readFileSync(`${migrationsDir}/${f}`, "utf8"));
  }
  return files;
}

// Mirror of the erasure write set in deleteAccount() that touches the public
// work-product cluster. Kept in the same statement order as the server action.
function eraseUser(db: DatabaseSyncInstance, userId: string, now: number) {
  db.prepare(
    `UPDATE users SET deleted_at = ?, legal_name = NULL, case_number = NULL,
       address_json = NULL, dob = NULL, phone = NULL WHERE id = ?`
  ).run(now, userId);
  db.prepare("UPDATE submissions SET user_notes = NULL WHERE user_id = ?").run(userId);
  db.prepare("UPDATE submissions SET public_session_ref = NULL WHERE user_id = ?").run(userId);
  db.prepare("UPDATE audits SET public_session_ref = NULL WHERE user_id = ?").run(userId);
  db.prepare("UPDATE submissions SET user_id = NULL WHERE user_id = ?").run(userId);
  db.prepare("UPDATE audits SET user_id = NULL WHERE user_id = ?").run(userId);
  db.prepare("DELETE FROM hours_ledger WHERE user_id = ?").run(userId);
  db.prepare("DELETE FROM cf888_forms WHERE user_id = ?").run(userId);
  db.prepare("UPDATE feedback SET user_id = NULL WHERE user_id = ?").run(userId);
}

test("0022: migrations apply and submissions.user_id + audits.user_id are nullable", () => {
  const db = new DatabaseSync(":memory:");
  applyAllMigrations(db);
  for (const t of ["submissions", "audits"]) {
    const uid = (db.prepare(`PRAGMA table_info(${t})`).all() as Array<{ name: string; notnull: number }>)
      .find((c) => c.name === "user_id");
    assert.ok(uid, `${t}.user_id column exists`);
    assert.equal(uid!.notnull, 0, `${t}.user_id must be NULLABLE after 0022`);
  }
  db.close();
});

test("erasure orphans public work-product: no value links a deleted user to their rows", () => {
  const db = new DatabaseSync(":memory:");
  applyAllMigrations(db);

  const now = 1_700_000_000_000;
  const userId = "user_erase_me";
  const ref1 = "ref_submission_001";
  const ref2 = "ref_audit_001";

  // Minimal required rows. user_notes embeds the public_session_ref (the EMS /
  // external-task shape) AND the user id — both must be gone after erasure.
  db.prepare(
    `INSERT INTO users (id, role, email, created_at, legal_name, case_number, dob, phone)
       VALUES (?, 'recipient', 'erase@example.com', ?, 'Jane Doe', 'CASE-123', '1990-01-01', 'enc:555')`
  ).run(userId, now);
  db.prepare(
    `INSERT INTO orgs (id, slug, name, created_at) VALUES ('org_1', 'org-1', 'Org One', ?)`
  ).run(now);
  db.prepare(
    `INSERT INTO task_templates (id, org_id, category, title, short_description,
       instructions_md, checklist_json, deliverable_spec_json, validation_rubric_md,
       est_hours, max_hours, location_kind, status, created_at)
       VALUES ('tmpl_1', 'org_1', 'food_audit', 't', 's', 'i', '[]', '{}', 'r',
               1, 8, 'online', 'active', ?)`
  ).run(now);
  db.prepare(
    `INSERT INTO submissions (id, user_id, task_template_id, status, committed_at,
       user_notes, public_session_ref)
       VALUES ('sub_1', ?, 'tmpl_1', 'approved', ?, ?, ?)`
  ).run(userId, now, JSON.stringify({ public_session_ref: ref1, note: "from user " + userId }), ref1);
  db.prepare(
    `INSERT INTO audits (id, submission_id, user_id, basket_template_id,
       basket_template_version, started_at, public_session_ref)
       VALUES ('aud_1', 'sub_1', ?, 'basket_1', 'v1', ?, ?)`
  ).run(userId, now, ref2);
  db.prepare(
    `INSERT INTO hours_ledger (id, user_id, month, total_hours, certified_org_id)
       VALUES ('hl_1', ?, '2026-06', 2.0, 'org_1')`
  ).run(userId);
  db.prepare(
    `INSERT INTO cf888_forms (id, user_id, month, r2_key, generated_at)
       VALUES ('cf_1', ?, '2026-06', 'k', ?)`
  ).run(userId, now);
  db.prepare(
    `INSERT INTO feedback (id, user_id, body, created_at) VALUES ('fb_1', ?, 'hi', ?)`
  ).run(userId, now);

  // Sanity: the link exists pre-erasure.
  assert.equal(
    (db.prepare("SELECT COUNT(*) c FROM submissions WHERE user_id = ?").get(userId) as { c: number }).c,
    1
  );
  assert.equal(
    (db.prepare("SELECT COUNT(*) c FROM audits WHERE user_id = ?").get(userId) as { c: number }).c,
    1
  );

  eraseUser(db, userId, now);

  // 1. The public work-product ROWS still exist (orphan, not delete).
  assert.equal(
    (db.prepare("SELECT COUNT(*) c FROM submissions").get() as { c: number }).c,
    1,
    "submissions row must survive erasure"
  );
  assert.equal(
    (db.prepare("SELECT COUNT(*) c FROM audits").get() as { c: number }).c,
    1,
    "audits row must survive erasure"
  );

  // 2. The certification source-of-truth (private cluster) is destroyed.
  assert.equal(
    (db.prepare("SELECT COUNT(*) c FROM hours_ledger WHERE user_id = ?").get(userId) as { c: number }).c,
    0
  );
  assert.equal(
    (db.prepare("SELECT COUNT(*) c FROM cf888_forms WHERE user_id = ?").get(userId) as { c: number }).c,
    0
  );

  // 3. The CORE assertion: scan every value in the surviving public rows and the
  //    user row; NOTHING may still reference the deleted user id or their
  //    cross-boundary refs.
  const sub = db.prepare("SELECT * FROM submissions WHERE id = 'sub_1'").get() as Record<string, unknown>;
  const aud = db.prepare("SELECT * FROM audits WHERE id = 'aud_1'").get() as Record<string, unknown>;

  assert.equal(sub.user_id, null, "submissions.user_id owning link must be NULL");
  assert.equal(sub.public_session_ref, null, "submissions.public_session_ref must be NULL");
  assert.equal(sub.user_notes, null, "submissions.user_notes (embeds ref + id) must be NULL");
  assert.equal(aud.user_id, null, "audits.user_id owning link must be NULL");
  assert.equal(aud.public_session_ref, null, "audits.public_session_ref must be NULL");

  // Exhaustive: no surviving public-row value contains the user id or a ref.
  const needles = [userId, ref1, ref2];
  for (const [label, row] of [["submissions", sub], ["audits", aud]] as const) {
    for (const [col, val] of Object.entries(row)) {
      if (val == null) continue;
      const s = String(val);
      for (const needle of needles) {
        assert.ok(
          !s.includes(needle),
          `${label}.${col} still links deleted user: found "${needle}" in ${JSON.stringify(val)}`
        );
      }
    }
  }

  // 4. No row anywhere in submissions/audits still carries the user id.
  assert.equal(
    (db.prepare("SELECT COUNT(*) c FROM submissions WHERE user_id = ?").get(userId) as { c: number }).c,
    0
  );
  assert.equal(
    (db.prepare("SELECT COUNT(*) c FROM audits WHERE user_id = ?").get(userId) as { c: number }).c,
    0
  );

  db.close();
});
