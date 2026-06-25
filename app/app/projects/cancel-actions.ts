"use server";

import { redirect } from "next/navigation";
import { getDb } from "@/lib/cf";
import { getCurrentUser } from "@/lib/session";
import type { Submission } from "@/lib/types";

/**
 * Cancel an un-submitted task, "I claimed this by accident, take it off my
 * dashboard." Deletes the submission and any files/flags attached to it. Only
 * allowed while the work is still in the recipient's court (committed /
 * in_progress / needs_changes); once submitted it lives under completed work.
 *
 * This lives at /app/projects/ (not inside the [id] dynamic segment) so the
 * client cancel button, defined in components/ outside the app/ tree, can
 * import it via a stable path the Workers bundler resolves cleanly.
 */
export async function cancelWork(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/start");
  const id = String(formData.get("submission_id") ?? "");
  const db = getDb();
  const sub = await db
    .prepare("SELECT * FROM submissions WHERE id = ?")
    .bind(id)
    .first<Submission>();
  if (!sub || sub.user_id !== user.id) redirect("/app");
  if (!["committed", "in_progress", "needs_changes"].includes(sub.status)) {
    redirect(`/app/submissions/${id}`);
  }
  await db.prepare("DELETE FROM submission_flags WHERE submission_id = ?").bind(id).run();
  await db.prepare("DELETE FROM submission_files WHERE submission_id = ?").bind(id).run();
  await db.prepare("DELETE FROM submissions WHERE id = ?").bind(id).run();
  redirect("/app");
}
