"use server";

import { redirect } from "next/navigation";
import { getDb } from "@/lib/cf";
import { encryptField } from "@/lib/crypto";
import { deleteFiles } from "@/lib/r2";
import { getCurrentUser } from "@/lib/session";
import { destroyAllUserSessions } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import type { Intent } from "@/lib/types";
import type { NotifyPrefs } from "./notify-prefs";

const VALID_INTENTS: Intent[] = ["snap_cert", "casual_volunteer", "other"];

async function requireRecipientUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "recipient") redirect("/unauthorized");
  return user;
}

export async function updateAccount(formData: FormData) {
  const user = await requireRecipientUser();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").replace(/\D/g, "").slice(0, 10);
  const city = String(formData.get("city") ?? "").trim();
  const state = String(formData.get("state") ?? "").trim().toUpperCase().slice(0, 2);
  await getDb()
    .prepare("UPDATE users SET email = ?, phone = ?, city = ?, state = ? WHERE id = ?")
    .bind(
      email || user.email,
      await encryptField(phone || null),
      city || user.city,
      state || user.state,
      user.id
    )
    .run();
  redirect("/app/settings?saved=account");
}

export async function updateIntent(formData: FormData) {
  const user = await requireRecipientUser();
  const raw = String(formData.get("intent") ?? "");
  const intent = (VALID_INTENTS as string[]).includes(raw) ? (raw as Intent) : user.intent;
  await getDb().prepare("UPDATE users SET intent = ? WHERE id = ?").bind(intent, user.id).run();
  redirect("/app/settings?saved=intent");
}

export async function updateNotifyPrefs(formData: FormData) {
  const user = await requireRecipientUser();
  const prefs: NotifyPrefs = {
    submission_updates: formData.get("submission_updates") != null,
    cf888_ready: formData.get("cf888_ready") != null,
  };
  await getDb()
    .prepare("UPDATE users SET notify_prefs_json = ? WHERE id = ?")
    .bind(JSON.stringify(prefs), user.id)
    .run();
  redirect("/app/settings?saved=notifications");
}

export async function deleteAccount(formData: FormData) {
  const user = await requireRecipientUser();
  // Confirm guard: the form sends confirm="DELETE".
  if (String(formData.get("confirm") ?? "").trim().toUpperCase() !== "DELETE") {
    redirect("/app/settings?error=confirm");
  }

  const now = Date.now();
  const db = getDb();

  // Collect the private-cluster PII DOCUMENTS in R2 to destroy (CF 888 PDFs, the
  // BenefitsCal screenshot, Zooniverse certificates). Orphaning their DB rows is
  // NOT enough — the files themselves carry legal name / case number / address /
  // DOB. Read the keys BEFORE the batch (which deletes cf888_forms rows and
  // reassigns submissions.user_id); the objects are deleted after the DB commit.
  const r2Keys: Array<string | null | undefined> = [];
  const cf888Files = await db
    .prepare("SELECT r2_key FROM cf888_forms WHERE user_id = ?")
    .bind(user.id)
    .all<{ r2_key: string }>();
  for (const r of cf888Files.results ?? []) r2Keys.push(r.r2_key);
  const certFiles = await db
    .prepare(
      "SELECT sf.r2_key AS r2_key FROM submission_files sf JOIN submissions s ON s.id = sf.submission_id WHERE s.user_id = ? AND sf.kind = 'zooniverse_certificate'"
    )
    .bind(user.id)
    .all<{ r2_key: string }>();
  for (const r of certFiles.results ?? []) r2Keys.push(r.r2_key);
  const benefits = await db
    .prepare("SELECT benefitscal_screenshot_r2_key AS k FROM users WHERE id = ?")
    .bind(user.id)
    .first<{ k: string | null }>();
  if (benefits?.k) r2Keys.push(benefits.k);

  // Erasure runs as one atomic batch. The work product (public-cluster rows keyed
  // only by public_session_ref) is intentionally ORPHANED, never deleted — it is a
  // public good and must survive erasure; we only cut the link back to a person.
  //
  // H6 (complete): every private->public re-identification link is severed WITHOUT
  // a destructive table rebuild. The abandoned nullable-user_id rebuild failed
  // D1's commit-time FK check; instead the person's private rows are reassigned to
  // the anonymous DELETED_USER sentinel (migration 0022_erasure_deleted_user_
  // sentinel). Their NOT NULL user_id columns stay valid but point at a PII-free
  // row, so no row can be traced back to a person.
  //
  // ORDER MATTERS: every per-row scrub/rotate below keys on the ORIGINAL user_id,
  // so each must run BEFORE that table's user_id is reassigned to the sentinel.
  await db.batch([
    // Soft-delete + scrub ALL PII on the user row, incl. email / firebase_uid /
    // full_name, so the "deleted" row can never re-identify a person nor be
    // resurrected on re-login. email is UNIQUE NOT NULL → rewrite to a per-id
    // placeholder rather than NULL.
    db
      .prepare(
        `UPDATE users
           SET deleted_at = ?,
               legal_name = NULL,
               case_number = NULL,
               address_json = NULL,
               dob = NULL,
               phone = NULL,
               full_name = NULL,
               firebase_uid = NULL,
               benefitscal_screenshot_r2_key = NULL,
               email = 'deleted+' || id || '@colift.invalid'
         WHERE id = ?`
      )
      .bind(now, user.id),
    // Scrub submission notes (carries the embedded public_session_ref + free text).
    db.prepare("UPDATE submissions SET user_notes = NULL WHERE user_id = ?").bind(user.id),
    // NULL the nullable cross-boundary refs (submissions 0019, audits 0016).
    db
      .prepare("UPDATE submissions SET public_session_ref = NULL WHERE user_id = ?")
      .bind(user.id),
    db.prepare("UPDATE audits SET public_session_ref = NULL WHERE user_id = ?").bind(user.id),
    // gov_audit_sessions.public_session_ref is NOT NULL UNIQUE (migration 0013) and
    // cannot be nulled. Rotate it to a throwaway value: the public gov rows keep
    // the OLD ref and become orphaned (link severed), while the private session
    // satisfies its NOT NULL/UNIQUE constraint. Runs before the user_id reassign.
    db
      .prepare(
        "UPDATE gov_audit_sessions SET public_session_ref = 'del_' || lower(hex(randomblob(16))) WHERE user_id = ?"
      )
      .bind(user.id),
    // Sever the person link: reassign the NOT NULL user_id rows to the sentinel.
    db.prepare("UPDATE submissions SET user_id = 'user_deleted' WHERE user_id = ?").bind(user.id),
    db.prepare("UPDATE audits SET user_id = 'user_deleted' WHERE user_id = ?").bind(user.id),
    db
      .prepare("UPDATE gov_audit_sessions SET user_id = 'user_deleted' WHERE user_id = ?")
      .bind(user.id),
    // Certification source-of-truth (private cluster) is destroyed outright.
    db.prepare("DELETE FROM hours_ledger WHERE user_id = ?").bind(user.id),
    db.prepare("DELETE FROM cf888_forms WHERE user_id = ?").bind(user.id),
    // feedback.user_id is nullable (migration 0001); orphan the feedback body.
    db.prepare("UPDATE feedback SET user_id = NULL WHERE user_id = ?").bind(user.id),
    // Scrub the auth/audit trail: login/signup rows carry email + IP in
    // detail_json and actor_user_id correlates them all. Reassign the actor to the
    // sentinel and drop the PII payload (keeps each row's action + timestamp for
    // security metrics without re-identifying the person).
    db
      .prepare(
        "UPDATE audit_log SET actor_user_id = 'user_deleted', detail_json = NULL WHERE actor_user_id = ?"
      )
      .bind(user.id),
  ]);

  // Destroy the PII documents in R2 — outside the DB batch (network side-effect):
  // a transient R2 error must not roll back the committed DB erasure.
  try {
    await deleteFiles(r2Keys);
  } catch {
    /* DB erasure already committed; object cleanup can be retried out-of-band */
  }

  // The deletion record itself must not re-introduce the person's id (the batch
  // just scrubbed it everywhere) — log it against the sentinel.
  await writeAudit({
    actorUserId: "user_deleted",
    action: "account_deleted",
    entityType: "user",
    entityId: "user_deleted",
    detail: {
      soft_delete: true,
      pii_scrubbed: true,
      link_severed: true,
      // Full severance via sentinel reassignment (no residual link).
      method: "sentinel_reassign",
    },
  });

  // Revoke all sessions (logs the user out everywhere).
  await destroyAllUserSessions(user.id);

  redirect("/login");
}
