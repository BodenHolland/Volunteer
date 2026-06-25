"use server";

import { redirect } from "next/navigation";
import { getDb, getEnv } from "@/lib/cf";
import { putFile } from "@/lib/r2";
import { newId } from "@/lib/ids";
import { getCurrentUser } from "@/lib/session";
import { writeAudit } from "@/lib/audit";
import {
  sha256Hex,
  isDuplicateCertificate,
  ALLOWED_CERT_MIMES,
  MAX_CERT_BYTES,
  REPORTED_HOURS_MIN,
  REPORTED_HOURS_MAX,
  looksLikeZooniverseProfileUrl,
  aiVerifyZooniverseCertificate,
  classifyVerdict,
  writePublicActivityRow,
  type ZooniverseAiVerdict,
} from "@/lib/zooniverse";
import type { Submission, TaskTemplate } from "@/lib/types";

function back(id: string, error: string | string[]): never {
  const params = Array.isArray(error)
    ? error.map((e) => `error=${encodeURIComponent(e)}`).join("&")
    : `error=${encodeURIComponent(error)}`;
  redirect(`/app/external/${id}/submit?${params}`);
}

function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

export async function submitCertificate(formData: FormData) {
  const id = String(formData.get("submission_id") ?? "");
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  const db = getDb();
  const sub = await db.prepare("SELECT * FROM submissions WHERE id = ?").bind(id).first<Submission>();
  if (!sub || sub.user_id !== me.id) redirect("/unauthorized");
  if (sub.status !== "committed" && sub.status !== "in_progress" && sub.status !== "needs_changes") {
    redirect(`/app/external/${id}`);
  }
  const task = await db
    .prepare("SELECT * FROM task_templates WHERE id = ?")
    .bind(sub.task_template_id)
    .first<TaskTemplate>();
  if (!task) redirect(`/app/external/${id}`);

  const file = formData.get("certificate");
  if (!(file instanceof File) || file.size === 0) back(id, "Pick a certificate file to upload.");
  if (file.size > MAX_CERT_BYTES) back(id, "Certificate must be smaller than 15 MB.");
  if (!ALLOWED_CERT_MIMES.has(file.type)) back(id, "Certificate must be a PDF, PNG, or JPG.");

  const description = String(formData.get("description") ?? "").trim();
  if (description.length < 25 || description.length > 500) {
    back(id, "Description must be between 25 and 500 characters.");
  }
  const projectName = String(formData.get("project_name") ?? "").trim();
  if (!projectName || projectName.length > 120) {
    back(id, "Tell us which Zooniverse project you worked on.");
  }
  const projectSlug = String(formData.get("project_slug") ?? "").trim().slice(0, 200);
  const profileUrl = String(formData.get("profile_url") ?? "").trim();
  if (!looksLikeZooniverseProfileUrl(profileUrl)) {
    back(id, "Profile URL must look like https://www.zooniverse.org/users/your-username.");
  }
  const reportedHours = Number(formData.get("reported_hours") ?? 0);
  if (
    !Number.isFinite(reportedHours) ||
    reportedHours < REPORTED_HOURS_MIN ||
    reportedHours > REPORTED_HOURS_MAX
  ) {
    back(id, `Hours must be between ${REPORTED_HOURS_MIN} and ${REPORTED_HOURS_MAX}.`);
  }
  const attestation = String(formData.get("attestation") ?? "");
  if (!attestation) back(id, "You must accept the attestation to submit.");

  const reportingMonth = String(formData.get("reporting_month") ?? "");
  if (!/^\d{4}-\d{2}$/.test(reportingMonth)) back(id, "Pick a reporting month.");

  const certBuf = await file.arrayBuffer();
  const certSha256 = await sha256Hex(certBuf);
  const duplicate = await isDuplicateCertificate(certSha256, id);

  // Run AI cross-check BEFORE any DB writes or R2 uploads. If the AI reports
  // specific, fixable mismatches, throw the user back to the form with those
  // issues, nothing gets persisted. Otherwise we either auto-approve
  // (verdict.auto_approve) or send to manual review (verdict ambiguous or
  // service unavailable).
  const env = getEnv() as unknown as {
    OPENROUTER_API_KEY?: string;
    OPENROUTER_MODEL?: string;
    OPENROUTER_SITE_URL?: string;
    OPENROUTER_APP_NAME?: string;
  };
  const userFullName = me.full_name ?? me.legal_name ?? me.email;
  const aiVerdict: ZooniverseAiVerdict = await aiVerifyZooniverseCertificate({
    userFullName,
    profileUrl,
    reportedHours,
    cert: { mime: file.type, base64: arrayBufferToBase64(certBuf) },
    apiKey: env.OPENROUTER_API_KEY,
    model: env.OPENROUTER_MODEL,
    siteUrl: env.OPENROUTER_SITE_URL,
    appName: env.OPENROUTER_APP_NAME,
  });

  const outcome = classifyVerdict(aiVerdict, { reportedHours, userFullName });

  // Actionable AI failure → throw back to the form. Duplicate certs are also
  // actionable but already flagged separately below.
  if (outcome.kind === "actionable" && !duplicate) {
    back(id, outcome.issues);
  }

  const certExt = file.type === "application/pdf" ? "pdf" : file.type === "image/png" ? "png" : "jpg";
  const certKey = `verification/zooniverse/${me.id}/${id}/certificate.${certExt}`;
  await putFile(certKey, certBuf, file.type);

  await db
    .prepare(
      "INSERT INTO submission_files (id, submission_id, kind, r2_key, metadata_json) VALUES (?,?,?,?,?)"
    )
    .bind(
      newId("cert"),
      id,
      "zooniverse_certificate",
      certKey,
      JSON.stringify({
        mime: file.type,
        size_bytes: file.size,
        sha256: certSha256,
        reporting_month: reportingMonth,
        project_name: projectName,
        project_slug: projectSlug,
        profile_url: profileUrl,
        reported_hours: reportedHours,
        ai_verdict: aiVerdict,
      })
    )
    .run();

  if (duplicate) {
    await db
      .prepare(
        "INSERT INTO submission_flags (id, submission_id, kind, severity, evidence_json, created_at) VALUES (?,?,?,?,?,?)"
      )
      .bind(
        newId("flag"),
        id,
        "duplicate_certificate",
        "flag",
        JSON.stringify({ sha256: certSha256 }),
        Date.now()
      )
      .run();
  }

  const now = Date.now();
  const canAutoApprove = outcome.kind === "clear" && !duplicate;

  if (canAutoApprove) {
    const creditedHours = Math.round(reportedHours * 100) / 100;
    const creditedMinutes = Math.round(reportedHours * 60);

    // Record the auto-approval in certificate_reviews so the audit story is
    // identical to the human-reviewed path. The "reviewer" is the user
    // themselves; the AI did the cross-check.
    await db
      .prepare(
        `INSERT INTO certificate_reviews
           (submission_id, reviewer_id, cert_name_matches_user, date_range_present, hours_present,
            project_scope_match, signature_present, profile_url_matches, screenshot_supports_certificate,
            duplicate_file_match, decision, reviewer_note, credited_minutes, reviewed_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
         ON CONFLICT(submission_id) DO UPDATE SET decision = excluded.decision, reviewed_at = excluded.reviewed_at`
      )
      .bind(
        id,
        me.id,
        aiVerdict.name_match ? "yes" : "unclear",
        "unclear",
        aiVerdict.hours_match ? "yes" : "unclear",
        "unclear",
        "unclear",
        aiVerdict.profile_consistent ? "yes" : "unclear",
        "unclear",
        0,
        "approved",
        `Auto-approved by AI cross-check: ${aiVerdict.reasoning}`,
        creditedMinutes,
        now
      )
      .run();

    await db
      .prepare(
        "UPDATE submissions SET status = 'approved', submitted_at = ?, reviewed_at = ?, reviewer_id = ?, hours_credited = ?, user_notes = ?, published_at = ?, ai_verdict_json = ? WHERE id = ?"
      )
      .bind(
        now,
        now,
        me.id,
        creditedHours,
        description,
        now,
        JSON.stringify(aiVerdict),
        id
      )
      .run();

    await db
      .prepare(
        "INSERT INTO hours_ledger (id, user_id, month, total_hours, certified_org_id) VALUES (?,?,?,?,?) " +
          "ON CONFLICT(user_id, month, certified_org_id) DO UPDATE SET total_hours = total_hours + excluded.total_hours"
      )
      .bind(newId("ledger"), me.id, reportingMonth, creditedHours, task.org_id)
      .run();

    if (sub.public_session_ref) {
      await writePublicActivityRow({
        public_session_ref: sub.public_session_ref,
        external_project_id: "",
        external_project_slug: projectSlug,
        task_type_label: projectName,
        reporting_month: reportingMonth,
        credited_minutes: creditedMinutes,
        evidence_tier: "provider_certificate_confirmed",
        approved_at: now,
      });
    }

    await writeAudit({
      actorUserId: me.id,
      action: "external_certificate_auto_approved",
      entityType: "submission",
      entityId: id,
      detail: {
        provider: "zooniverse",
        project_name: projectName,
        project_slug: projectSlug,
        reporting_month: reportingMonth,
        reported_hours: reportedHours,
        credited_hours: creditedHours,
        ai_reasoning: aiVerdict.reasoning,
      },
    });
  } else {
    // Informational outcome (or duplicate). Pass a friendly note via the hub
    // page so the volunteer understands why it didn't auto-approve.
    await db
      .prepare(
        "UPDATE submissions SET status = 'pending_review', submitted_at = ?, user_notes = ?, ai_verdict_json = ? WHERE id = ?"
      )
      .bind(now, description, JSON.stringify(aiVerdict), id)
      .run();
  }

  const noticeParam =
    canAutoApprove
      ? ""
      : duplicate
        ? "?notice=duplicate"
        : outcome.kind === "informational"
          ? `?notice=${encodeURIComponent(outcome.note)}`
          : "";
  redirect(`/app/external/${id}${noticeParam}`);
}
