"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/cf";
import { newId } from "@/lib/ids";
import { getCurrentUser } from "@/lib/session";
import { currentMonth } from "@/lib/time";
import type { Submission, TaskTemplate } from "@/lib/types";

async function loadReviewable(submissionId: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "org_member" || !user.org_id) return null;
  const db = getDb();
  const sub = await db.prepare("SELECT * FROM submissions WHERE id = ?").bind(submissionId).first<Submission>();
  if (!sub) return null;
  const task = await db.prepare("SELECT * FROM task_templates WHERE id = ?").bind(sub.task_template_id).first<TaskTemplate>();
  if (!task || task.org_id !== user.org_id) return null;
  return { user, sub, task, db };
}

export async function approveSubmission(formData: FormData) {
  const id = String(formData.get("submission_id") ?? "");
  const ctx = await loadReviewable(id);
  if (!ctx) redirect("/org/submissions");
  const { user, sub, task, db } = ctx;

  const requested = Number(formData.get("hours") ?? task.est_hours);
  const hours = Math.max(0, Math.min(requested, task.max_hours));
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const month = currentMonth();

  await db
    .prepare("UPDATE submissions SET status = 'approved', reviewed_at = ?, reviewer_id = ?, reviewer_notes = ?, hours_credited = ? WHERE id = ?")
    .bind(Date.now(), user.id, notes, hours, id)
    .run();

  await db
    .prepare(
      "INSERT INTO hours_ledger (id, user_id, month, total_hours, certified_org_id) VALUES (?,?,?,?,?) " +
        "ON CONFLICT(user_id, month, certified_org_id) DO UPDATE SET total_hours = total_hours + excluded.total_hours"
    )
    .bind(newId("ledger"), sub.user_id, month, hours, task.org_id)
    .run();

  revalidatePath("/org/submissions");
  redirect("/org/submissions");
}

export async function requestChanges(formData: FormData) {
  const id = String(formData.get("submission_id") ?? "");
  const ctx = await loadReviewable(id);
  if (!ctx) redirect("/org/submissions");
  const reason = String(formData.get("reason") ?? "").trim() || "Please review the task requirements and resubmit.";
  await ctx.db
    .prepare("UPDATE submissions SET status = 'needs_changes', reviewed_at = ?, reviewer_id = ?, reviewer_notes = ? WHERE id = ?")
    .bind(Date.now(), ctx.user.id, reason, id)
    .run();
  revalidatePath("/org/submissions");
  redirect("/org/submissions");
}

export async function rejectSubmission(formData: FormData) {
  const id = String(formData.get("submission_id") ?? "");
  const ctx = await loadReviewable(id);
  if (!ctx) redirect("/org/submissions");
  const reason = String(formData.get("reason") ?? "").trim() || "This submission doesn't meet the task requirements.";
  await ctx.db
    .prepare("UPDATE submissions SET status = 'rejected', reviewed_at = ?, reviewer_id = ?, reviewer_notes = ? WHERE id = ?")
    .bind(Date.now(), ctx.user.id, reason, id)
    .run();
  revalidatePath("/org/submissions");
  redirect("/org/submissions");
}
