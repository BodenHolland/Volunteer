"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/cf";
import { newId } from "@/lib/ids";
import { getCurrentUser } from "@/lib/session";
import { currentMonth } from "@/lib/time";
import { writeAudit } from "@/lib/audit";
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

  // Change 4 — hard line #1: credited hours are the volunteer's MEASURED ACTIVE
  // engagement (idle-aware), capped at the calibrated cap. The reviewer may only
  // reduce for quality, never credit above measured time. The estimate is never
  // the source.
  const measuredSeconds = (sub as unknown as { measured_active_seconds: number }).measured_active_seconds ?? 0;
  const measured = measuredSeconds / 3600;
  const ceiling = Math.min(measured, task.max_hours);
  const requested = Number(formData.get("hours") ?? ceiling);
  const hours = Math.max(0, Math.min(requested, ceiling));
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const month = currentMonth();

  // Approved work is published as a free public deliverable (Change 1-3).
  const nowTs = Date.now();
  await db
    .prepare("UPDATE submissions SET status = 'approved', reviewed_at = ?, reviewer_id = ?, reviewer_notes = ?, hours_credited = ?, published_at = ? WHERE id = ?")
    .bind(nowTs, user.id, notes, hours, nowTs, id)
    .run();

  await db
    .prepare(
      "INSERT INTO hours_ledger (id, user_id, month, total_hours, certified_org_id) VALUES (?,?,?,?,?) " +
        "ON CONFLICT(user_id, month, certified_org_id) DO UPDATE SET total_hours = total_hours + excluded.total_hours"
    )
    .bind(newId("ledger"), sub.user_id, month, hours, task.org_id)
    .run();

  // Immutable audit: prove credited never exceeds measured, with the basis.
  await writeAudit({
    actorUserId: user.id,
    action: "submission_approved",
    entityType: "submission",
    entityId: id,
    detail: {
      recipient_id: sub.user_id,
      org_id: task.org_id,
      month,
      measured_hours: Math.round(measured * 100) / 100,
      cap_hours: task.max_hours,
      hours_credited: hours,
    },
  });

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
