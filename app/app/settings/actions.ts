"use server";

import { redirect } from "next/navigation";
import { getDb } from "@/lib/cf";
import { encryptField } from "@/lib/crypto";
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

  // Erasure runs as one atomic batch: soft-delete + PII scrub on the user, plus
  // severing the private↔public re-identification link as far as the CURRENT
  // schema allows (no-migration subset). The work product (public-cluster rows
  // keyed only by public_session_ref) is intentionally ORPHANED, never deleted —
  // it is a public good and must survive erasure; we only cut the link back to a
  // person.
  //
  // Cross-boundary key (public_session_ref) lives in several private-side spots:
  //   - submissions.user_notes  — a JSON blob that, for EMS / external tasks,
  //     embeds public_session_ref (see app/app/projects/[id]/submit-actions.ts)
  //     and may also hold free-text notes; NULL the whole column.
  //   - submissions.public_session_ref  — nullable (migration 0019); NULL it.
  //   - audits.public_session_ref       — nullable (migration 0016); NULL it.
  //   - gov_audit_sessions.public_session_ref — declared NOT NULL (migration
  //     0013), so it CANNOT be nulled without a table rebuild. That, plus the
  //     NOT NULL user_id columns on submissions/audits/gov_audit_sessions
  //     themselves, are deferred to the nullable-column rebuild migration (0022,
  //     follow-up PR). Until then this residual link remains.
  await db.batch([
    // Soft delete + scrub PII columns on the user row.
    db
      .prepare(
        `UPDATE users
           SET deleted_at = ?,
               legal_name = NULL,
               case_number = NULL,
               address_json = NULL,
               dob = NULL,
               phone = NULL
         WHERE id = ?`
      )
      .bind(now, user.id),
    // Scrub submission notes (carries the embedded public_session_ref + free text).
    db.prepare("UPDATE submissions SET user_notes = NULL WHERE user_id = ?").bind(user.id),
    // NULL the nullable cross-boundary refs (schema-permitted today).
    db
      .prepare("UPDATE submissions SET public_session_ref = NULL WHERE user_id = ?")
      .bind(user.id),
    db.prepare("UPDATE audits SET public_session_ref = NULL WHERE user_id = ?").bind(user.id),
    // Certification source-of-truth (private cluster) is destroyed outright.
    db.prepare("DELETE FROM hours_ledger WHERE user_id = ?").bind(user.id),
    db.prepare("DELETE FROM cf888_forms WHERE user_id = ?").bind(user.id),
    // feedback.user_id is nullable (migration 0001); orphan the feedback body.
    db.prepare("UPDATE feedback SET user_id = NULL WHERE user_id = ?").bind(user.id),
  ]);

  await writeAudit({
    actorUserId: user.id,
    action: "account_deleted",
    entityType: "user",
    entityId: user.id,
    detail: {
      soft_delete: true,
      pii_scrubbed: true,
      link_severed: true,
      // gov_audit_sessions.public_session_ref + NOT NULL user_id columns remain
      // until the 0022 rebuild migration (follow-up).
      residual_link_pending_migration: "0022",
    },
  });

  // Revoke all sessions (logs the user out everywhere).
  await destroyAllUserSessions(user.id);

  redirect("/login");
}
