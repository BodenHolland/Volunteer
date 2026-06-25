"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/cf";
import { newId } from "@/lib/ids";
import { getCurrentUser } from "@/lib/session";
import { writeAudit } from "@/lib/audit";
import { remainingMonthlyMinutes, writePublicActivityRow } from "@/lib/zooniverse";
import type { Submission, TaskTemplate } from "@/lib/types";

async function loadExternal(submissionId: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "org_member" || !user.org_id) return null;
  const db = getDb();
  const sub = await db.prepare("SELECT * FROM submissions WHERE id = ?").bind(submissionId).first<Submission>();
  if (!sub) return null;
  const task = await db.prepare("SELECT * FROM task_templates WHERE id = ?").bind(sub.task_template_id).first<TaskTemplate>();
  if (!task || task.org_id !== user.org_id) return null;
  if (task.evidence_mode !== "external_certificate") return null;
  return { user, sub, task, db };
}

const TRIPLE = new Set(["yes", "no", "unclear"]);
function triple(formData: FormData, key: string): "yes" | "no" | "unclear" {
  const v = String(formData.get(key) ?? "");
  if (!TRIPLE.has(v)) return "unclear";
  return v as "yes" | "no" | "unclear";
}

export async function approveExternalSubmission(formData: FormData) {
  const id = String(formData.get("submission_id") ?? "");
  const ctx = await loadExternal(id);
  if (!ctx) redirect("/org/submissions");
  const { user, sub, task, db } = ctx;

  // Pull the reporting_month + volunteer-reported project from the cert file
  // metadata; reviewer may have corrected the project info in the form.
  const fileRow = await db
    .prepare(
      "SELECT metadata_json FROM submission_files WHERE submission_id = ? AND kind = 'zooniverse_certificate' ORDER BY id DESC LIMIT 1"
    )
    .bind(id)
    .first<{ metadata_json: string }>();
  let fileMeta: { reporting_month?: string; project_name?: string; project_slug?: string } = {};
  try {
    fileMeta = JSON.parse(fileRow?.metadata_json ?? "{}");
  } catch {
    fileMeta = {};
  }
  let reportingMonth = fileMeta.reporting_month ?? "";
  if (!/^\d{4}-\d{2}$/.test(reportingMonth)) {
    const d = new Date(sub.submitted_at ?? Date.now());
    reportingMonth = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  }

  const projectName =
    String(formData.get("project_name") ?? "").trim() || fileMeta.project_name || "Zooniverse project";
  const projectSlug = String(formData.get("project_slug") ?? "").trim() || fileMeta.project_slug || "";

  const requestedMinutes = Math.max(0, Number(formData.get("credited_minutes") ?? 0));
  const cap = task.monthly_minutes_cap; // null = no cap
  let clamped = requestedMinutes;
  if (cap != null) {
    const remaining = await remainingMonthlyMinutes(sub.user_id, task.id, reportingMonth, cap);
    clamped = Math.min(requestedMinutes, remaining);
    if (clamped < requestedMinutes) {
      await db
        .prepare(
          "INSERT INTO submission_flags (id, submission_id, kind, severity, evidence_json, created_at) VALUES (?,?,?,?,?,?)"
        )
        .bind(
          newId("flag"),
          id,
          "monthly_cap_exceeded",
          "warn",
          JSON.stringify({ requested: requestedMinutes, granted: clamped, cap_minutes: cap }),
          Date.now()
        )
        .run();
    }
  }

  const nameMatch = triple(formData, "cert_name_matches_user");
  if (nameMatch === "no") {
    await db
      .prepare(
        "INSERT INTO submission_flags (id, submission_id, kind, severity, evidence_json, created_at) VALUES (?,?,?,?,?,?)"
      )
      .bind(newId("flag"), id, "cert_user_name_mismatch", "warn", null, Date.now())
      .run();
  }

  const now = Date.now();
  const note = String(formData.get("reviewer_note") ?? "").trim() || null;
  const creditedHours = Math.round((clamped / 60) * 100) / 100;

  await db
    .prepare(
      `INSERT INTO certificate_reviews
         (submission_id, reviewer_id, cert_name_matches_user, date_range_present, hours_present,
          project_scope_match, signature_present, profile_url_matches, screenshot_supports_certificate,
          duplicate_file_match, decision, reviewer_note, credited_minutes, reviewed_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
       ON CONFLICT(submission_id) DO UPDATE SET
         reviewer_id = excluded.reviewer_id,
         cert_name_matches_user = excluded.cert_name_matches_user,
         date_range_present = excluded.date_range_present,
         hours_present = excluded.hours_present,
         project_scope_match = excluded.project_scope_match,
         signature_present = excluded.signature_present,
         profile_url_matches = excluded.profile_url_matches,
         screenshot_supports_certificate = excluded.screenshot_supports_certificate,
         duplicate_file_match = excluded.duplicate_file_match,
         decision = excluded.decision,
         reviewer_note = excluded.reviewer_note,
         credited_minutes = excluded.credited_minutes,
         reviewed_at = excluded.reviewed_at`
    )
    .bind(
      id,
      user.id,
      nameMatch,
      triple(formData, "date_range_present"),
      triple(formData, "hours_present"),
      triple(formData, "project_scope_match"),
      triple(formData, "signature_present"),
      triple(formData, "profile_url_matches"),
      triple(formData, "screenshot_supports_certificate"),
      0,
      "approved",
      note,
      clamped,
      now
    )
    .run();

  await db
    .prepare(
      "UPDATE submissions SET status = 'approved', reviewed_at = ?, reviewer_id = ?, reviewer_notes = ?, hours_credited = ?, published_at = ? WHERE id = ?"
    )
    .bind(now, user.id, note, creditedHours, now, id)
    .run();

  await db
    .prepare(
      "INSERT INTO hours_ledger (id, user_id, month, total_hours, certified_org_id) VALUES (?,?,?,?,?) " +
        "ON CONFLICT(user_id, month, certified_org_id) DO UPDATE SET total_hours = total_hours + excluded.total_hours"
    )
    .bind(newId("ledger"), sub.user_id, reportingMonth, creditedHours, task.org_id)
    .run();

  // PUBLIC cluster, keyed by submissions.public_session_ref. NO user_id ever
  // enters this row by construction. Skip silently if the submission predates
  // the public_session_ref column (defensive, should never happen).
  if (sub.public_session_ref) {
    await writePublicActivityRow({
      public_session_ref: sub.public_session_ref,
      external_project_id: "",
      external_project_slug: projectSlug,
      task_type_label: projectName,
      reporting_month: reportingMonth,
      credited_minutes: clamped,
      evidence_tier: "provider_certificate_confirmed",
      approved_at: now,
    });
  }

  await writeAudit({
    actorUserId: user.id,
    action: "external_certificate_approved",
    entityType: "submission",
    entityId: id,
    detail: {
      recipient_id: sub.user_id,
      provider: "zooniverse",
      project_name: projectName,
      project_slug: projectSlug,
      reporting_month: reportingMonth,
      cap_minutes: cap ?? null,
      requested_minutes: requestedMinutes,
      credited_minutes: clamped,
      credited_hours: creditedHours,
    },
  });

  revalidatePath("/org/submissions");
  redirect("/org/submissions");
}

export async function requestExternalChanges(formData: FormData) {
  const id = String(formData.get("submission_id") ?? "");
  const ctx = await loadExternal(id);
  if (!ctx) redirect("/org/submissions");
  const reason = String(formData.get("reason") ?? "").trim() || "Please review the certificate requirements and resubmit.";
  const now = Date.now();
  await ctx.db
    .prepare(
      `INSERT INTO certificate_reviews
         (submission_id, reviewer_id, cert_name_matches_user, date_range_present, hours_present,
          project_scope_match, signature_present, profile_url_matches, screenshot_supports_certificate,
          duplicate_file_match, decision, reviewer_note, credited_minutes, reviewed_at)
       VALUES (?,?,?,?,?,?,?,?,?,?, 'needs_information', ?, NULL, ?)
       ON CONFLICT(submission_id) DO UPDATE SET decision = excluded.decision, reviewer_note = excluded.reviewer_note, reviewed_at = excluded.reviewed_at`
    )
    .bind(id, ctx.user.id, "unclear", "unclear", "unclear", "unclear", "unclear", "unclear", "unclear", 0, reason, now)
    .run();
  await ctx.db
    .prepare("UPDATE submissions SET status = 'needs_changes', reviewed_at = ?, reviewer_id = ?, reviewer_notes = ? WHERE id = ?")
    .bind(now, ctx.user.id, reason, id)
    .run();
  revalidatePath("/org/submissions");
  redirect("/org/submissions");
}

export async function rejectExternalSubmission(formData: FormData) {
  const id = String(formData.get("submission_id") ?? "");
  const ctx = await loadExternal(id);
  if (!ctx) redirect("/org/submissions");
  const reason = String(formData.get("reason") ?? "").trim() || "This certificate doesn't meet the task requirements.";
  const now = Date.now();
  await ctx.db
    .prepare(
      `INSERT INTO certificate_reviews
         (submission_id, reviewer_id, cert_name_matches_user, date_range_present, hours_present,
          project_scope_match, signature_present, profile_url_matches, screenshot_supports_certificate,
          duplicate_file_match, decision, reviewer_note, credited_minutes, reviewed_at)
       VALUES (?,?,?,?,?,?,?,?,?,?, 'rejected', ?, NULL, ?)
       ON CONFLICT(submission_id) DO UPDATE SET decision = excluded.decision, reviewer_note = excluded.reviewer_note, reviewed_at = excluded.reviewed_at`
    )
    .bind(id, ctx.user.id, "unclear", "unclear", "unclear", "unclear", "unclear", "unclear", "unclear", 0, reason, now)
    .run();
  await ctx.db
    .prepare("UPDATE submissions SET status = 'rejected', reviewed_at = ?, reviewer_id = ?, reviewer_notes = ? WHERE id = ?")
    .bind(now, ctx.user.id, reason, id)
    .run();
  revalidatePath("/org/submissions");
  redirect("/org/submissions");
}
