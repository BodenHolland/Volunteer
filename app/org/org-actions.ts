"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/cf";
import { getCurrentUser } from "@/lib/session";
import { currentMonth } from "@/lib/time";
import { creditHoursStmt, computeCreditedHours } from "@/lib/ledger";
import { writeAudit } from "@/lib/audit";
import { parseJson, type Submission, type TaskTemplate } from "@/lib/types";

async function loadReviewable(submissionId: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "org_member" || !user.org_id) return null;
  const db = getDb();
  const sub = await db.prepare("SELECT * FROM submissions WHERE id = ?").bind(submissionId).first<Submission>();
  if (!sub) return null;
  // Hard line #1 (no self-certification): a reviewer must never approve/credit
  // their own work — these hours feed the CF 888 legal attestation. Reject
  // self-review outright (the task actions also block an org_member from owning a
  // submission, but defend here too).
  if (sub.user_id === user.id) return null;
  const task = await db.prepare("SELECT * FROM task_templates WHERE id = ?").bind(sub.task_template_id).first<TaskTemplate>();
  if (!task || task.org_id !== user.org_id) return null;
  return { user, sub, task, db };
}

export async function approveSubmission(formData: FormData) {
  const id = String(formData.get("submission_id") ?? "");
  const ctx = await loadReviewable(id);
  if (!ctx) redirect("/org/submissions");
  const { user, sub, task, db } = ctx;

  // Fast-path idempotency (C5): an already-approved submission must never be
  // re-credited. The authoritative guard is the compare-and-set claim below;
  // this early return just avoids the wasted work on an obvious replay.
  if (sub.status === "approved") {
    revalidatePath("/org/submissions");
    redirect("/org/submissions");
  }

  // Change 4, hard line #1: credited hours are the volunteer's MEASURED ACTIVE
  // engagement (idle-aware), capped at the calibrated cap. The reviewer may only
  // reduce for quality, never credit above measured time. The estimate is never
  // the source. The clamp math lives in lib/ledger.ts (computeCreditedHours) so
  // it can be unit-tested in isolation.
  const rawHours = formData.get("hours");
  const { credited: hours, measuredHours: measured } = computeCreditedHours({
    measuredSeconds: sub.measured_active_seconds ?? 0,
    requestedHours: rawHours == null ? undefined : Number(rawHours),
    maxHours: task.max_hours,
  });
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const month = currentMonth();

  // Single-flight claim (C5): the irreversible status='approved' flip is
  // compare-and-set (WHERE status != 'approved'). D1 serializes writes, so of
  // any number of concurrent / replayed approves exactly ONE flips the row
  // (changes === 1); every other run matches zero rows and bails BEFORE the
  // ledger credit. This is the gate that makes the credit single-flight: a
  // second approve can never reach creditHoursStmt for the same submission.
  const nowTs = Date.now();
  const claim = await db
    .prepare("UPDATE submissions SET status = 'approved', reviewed_at = ?, reviewer_id = ?, reviewer_notes = ?, hours_credited = ?, published_at = ? WHERE id = ? AND status != 'approved'")
    .bind(nowTs, user.id, notes, hours, nowTs, id)
    .run();
  if (claim.meta.changes !== 1) {
    // Lost the race (already approved) — do NOT credit again.
    revalidatePath("/org/submissions");
    redirect("/org/submissions");
  }

  // The credit + EMS public-cluster publish ride in one db.batch() (D1 implicit
  // transaction) so they commit together. Only the claim winner reaches here.
  const batch: D1PreparedStatement[] = [
    creditHoursStmt(db, { userId: sub.user_id, hours, month, certifiedOrgId: task.org_id }),
  ];

  // Publish the public-cluster row for EMS rate research. ems_rate_reports
  // is keyed by public_session_ref (carried in user_notes); setting
  // published_at is what the public CSV/JSON export filters on.
  if (task.category === "ems-rate-research") {
    const ref = parseJson<{ public_session_ref?: string }>(sub.user_notes ?? "", {}).public_session_ref;
    if (ref) {
      batch.push(
        db
          .prepare("UPDATE ems_rate_reports SET published_at = ? WHERE public_session_ref = ?")
          .bind(nowTs, ref)
      );
    }
  }

  await db.batch(batch);

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
