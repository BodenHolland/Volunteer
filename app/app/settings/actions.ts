"use server";

import { redirect } from "next/navigation";
import { getDb } from "@/lib/cf";
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
  const phone = String(formData.get("phone") ?? "").trim();
  await getDb()
    .prepare("UPDATE users SET email = ?, phone = ? WHERE id = ?")
    .bind(email || user.email, phone || null, user.id)
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
  // Soft delete + scrub PII columns.
  await getDb()
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
    .bind(now, user.id)
    .run();

  await writeAudit({
    actorUserId: user.id,
    action: "account_deleted",
    entityType: "user",
    entityId: user.id,
    detail: { soft_delete: true, pii_scrubbed: true },
  });

  // Revoke all sessions (logs the user out everywhere).
  await destroyAllUserSessions(user.id);

  redirect("/login");
}
