"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getDb, getEnv } from "@/lib/cf";
import { putFile } from "@/lib/r2";
import { newId } from "@/lib/ids";
import { getCurrentUser } from "@/lib/session";
import { creditHoursStmt } from "@/lib/ledger";
import { writeAudit } from "@/lib/audit";
import {
  sha256Hex,
  isDuplicateCertificate,
  findExistingMonthSubmission,
  ALLOWED_CERT_MIMES,
  MAX_CERT_BYTES,
  REPORTED_HOURS_MIN,
  REPORTED_HOURS_MAX,
  looksLikeZooniverseProfileUrl,
  aiVerifyZooniverseCertificate,
  classifyVerdict,
  writePublicActivityRow,
  remainingMonthlyMinutes,
  priorCreditedCumulativeMinutes,
  creditableDeltaMinutes,
  externalCertAutoApproveEnabled,
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
  // Recipients only (defense-in-depth: a directly-POSTed action must not let an
  // org_member become a cert owner and later self-credit).
  if (me.role !== "recipient") redirect("/unauthorized");
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
  // C3: this certificate-upload + auto-approve path is ONLY valid for
  // external-certificate tasks. An in-app task routed here would auto-credit the
  // ledger off an unverified file upload, bypassing its measured-time review.
  if (task.evidence_mode !== "external_certificate") redirect(`/app/external/${id}`);

  const file = formData.get("certificate");
  if (!(file instanceof File) || file.size === 0) back(id, "Pick a certificate file to upload.");
  if (file.size > MAX_CERT_BYTES) back(id, "Certificate must be smaller than 15 MB.");
  if (!ALLOWED_CERT_MIMES.has(file.type)) {
    back(id, "Certificate must be a PNG or JPG image. (PDFs can't auto-verify — export or screenshot the certificate as an image and try again.)");
  }

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

  // Zooniverse certificates are cumulative across the platform, so one
  // submission per (project, reporting month) per volunteer is the rule.
  // Different month or different project = fine. Rejected prior submissions
  // don't block resubmission.
  const existing = await findExistingMonthSubmission(
    me.id,
    task.id,
    reportingMonth,
    projectName,
    id
  );
  if (existing) {
    const verb = existing.status === "approved" ? "already credited" : "already in review";
    back(
      id,
      `You ${verb} hours for "${projectName}" for ${reportingMonth}. Pick a different project or month, or wait for the existing review to clear.`
    );
  }

  const certBuf = await file.arrayBuffer();
  const certSha256 = await sha256Hex(certBuf);

  // C1: a Zooniverse certificate reports CUMULATIVE time across the platform.
  // The volunteer-typed figure is that running total, NOT this month's new work.
  // Carry it through as cumulative minutes so the credit path can diff it
  // against what we've already credited (creditableDeltaMinutes below).
  const reportedCumulativeMinutes = Math.round(reportedHours * 60);

  // L6: the dedup key is the cert SHA (exact same file) OR — to defeat a
  // re-EXPORT of the same certificate (a fresh image render with the same
  // cumulative figure, hence a different SHA) — a prior approved review for
  // this (user, task) whose recorded cumulative is >= this one, i.e. it would
  // credit no new minutes. The (user, task, month, project) collision is
  // already handled by findExistingMonthSubmission above.
  const shaDuplicate = await isDuplicateCertificate(certSha256, id);
  const priorCumulative = await priorCreditedCumulativeMinutes(me.id, task.id);
  const staleReexport = reportedCumulativeMinutes <= priorCumulative && priorCumulative > 0;
  const duplicate = shaDuplicate || staleReexport;

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
        // C1: cumulative minutes the cert reports; the reviewer/auto path diffs
        // this against prior credited cumulative to credit only the delta.
        reported_cumulative_minutes: reportedCumulativeMinutes,
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
        JSON.stringify({
          sha256: certSha256,
          sha_duplicate: shaDuplicate,
          // L6: a re-export with no new cumulative time was caught here.
          stale_reexport: staleReexport,
          reported_cumulative_minutes: reportedCumulativeMinutes,
          prior_credited_cumulative_minutes: priorCumulative,
        }),
        Date.now()
      )
      .run();
  }

  const now = Date.now();

  // C1: credit only the NEW work the cert evidences — the delta between its
  // cumulative figure and what we've already credited for this task. Never the
  // raw self-reported total. >= 0 clamp means a flat/lower cumulative credits 0.
  const deltaMinutes = creditableDeltaMinutes(reportedCumulativeMinutes, priorCumulative);

  // C2: the auto-approve path is OFF by default (env-gated) and, when on, must
  // honor the same monthly cap the reviewer path enforces.
  const cap = task.monthly_minutes_cap; // null = no artificial cap
  const remaining =
    cap != null ? await remainingMonthlyMinutes(me.id, task.id, reportingMonth, cap) : null;

  const canAutoApprove =
    externalCertAutoApproveEnabled() && outcome.kind === "clear" && !duplicate;

  if (canAutoApprove) {
    // C1 + C2: credited = min(delta-vs-cumulative, remaining-monthly-cap).
    // Never the raw reported total.
    const creditedMinutes = remaining != null ? Math.min(deltaMinutes, remaining) : deltaMinutes;
    const creditedHours = Math.round((creditedMinutes / 60) * 100) / 100;

    // Single-flight claim (C5): the irreversible status='approved' flip is
    // compare-and-set (WHERE status != 'approved'). Two concurrent submits of
    // the same certificate (the AI calls above open a race window) would both
    // reach here; D1 serializes writes so exactly ONE flips the row, and only
    // that winner credits the ledger. A loser matches zero rows and skips the
    // credit batch entirely.
    const claim = await db
      .prepare(
        "UPDATE submissions SET status = 'approved', submitted_at = ?, reviewed_at = ?, reviewer_id = ?, hours_credited = ?, user_notes = ?, published_at = ?, ai_verdict_json = ? WHERE id = ? AND status != 'approved'"
      )
      .bind(now, now, me.id, creditedHours, description, now, JSON.stringify(aiVerdict), id)
      .run();

    if (claim.meta.changes === 1) {
      // M9: the auto-approval record + the ledger credit commit together in one
      // db.batch() (D1 implicit transaction) so the approved submission can never
      // be left uncredited (or vice versa). The status flip already landed as the
      // single-flight gate; these two ride together behind it.
      await db.batch([
        // Record the auto-approval in certificate_reviews so the audit story is
        // identical to the human-reviewed path. The "reviewer" is the user
        // themselves; the AI did the cross-check.
        //
        // reported_cumulative_minutes (migration 0021) records the cert's
        // cumulative figure so the NEXT submission's delta (C1) diffs against
        // it. Referenced via dynamic SQL — works once 0021 is applied.
        db
          .prepare(
            `INSERT INTO certificate_reviews
               (submission_id, reviewer_id, cert_name_matches_user, date_range_present, hours_present,
                project_scope_match, signature_present, profile_url_matches, screenshot_supports_certificate,
                duplicate_file_match, decision, reviewer_note, credited_minutes, reported_cumulative_minutes, reviewed_at)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
             ON CONFLICT(submission_id) DO UPDATE SET decision = excluded.decision, credited_minutes = excluded.credited_minutes, reported_cumulative_minutes = excluded.reported_cumulative_minutes, reviewed_at = excluded.reviewed_at`
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
            reportedCumulativeMinutes,
            now
          ),
        creditHoursStmt(db, {
          userId: me.id,
          hours: creditedHours,
          month: reportingMonth,
          certifiedOrgId: task.org_id,
        }),
      ]);
    }

    if (claim.meta.changes === 1 && sub.public_session_ref) {
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

    if (claim.meta.changes === 1) {
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
          // Full credit derivation for the audit story (C1/C2): self-reported
          // cumulative, the prior baseline it was diffed against, the delta, the
          // cap that bounded it, and what was actually credited.
          reported_hours: reportedHours,
          reported_cumulative_minutes: reportedCumulativeMinutes,
          prior_credited_cumulative_minutes: priorCumulative,
          delta_minutes: deltaMinutes,
          cap_minutes: cap ?? null,
          remaining_minutes: remaining,
          credited_minutes: creditedMinutes,
          credited_hours: creditedHours,
          ai_reasoning: aiVerdict.reasoning,
        },
      });
    }
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

/**
 * Volunteer-initiated cancellation. Marks the submission as rejected so it
 * leaves the reviewer queue, with a reviewer_notes prefix the hub page uses
 * to render a "Cancelled" pill instead of "Rejected".
 *
 * Only allowed while the submission is still cancellable (anything before a
 * reviewer/AI decision lands). Approved or already-rejected submissions
 * cannot be cancelled.
 */
export async function cancelSubmission(formData: FormData) {
  const id = String(formData.get("submission_id") ?? "");
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  const db = getDb();
  const sub = await db.prepare("SELECT * FROM submissions WHERE id = ?").bind(id).first<Submission>();
  if (!sub || sub.user_id !== me.id) redirect("/unauthorized");
  // C3: this hub route only governs external-certificate tasks. Refuse to act on
  // a submission whose task isn't external_certificate so an in-app submission
  // can't be force-rejected through the external endpoint.
  const task = await db
    .prepare("SELECT * FROM task_templates WHERE id = ?")
    .bind(sub.task_template_id)
    .first<TaskTemplate>();
  if (!task || task.evidence_mode !== "external_certificate") redirect(`/app/external/${id}`);

  const cancellable = new Set([
    "committed",
    "in_progress",
    "submitted",
    "ai_reviewing",
    "pending_review",
    "needs_changes",
  ]);
  if (!cancellable.has(sub.status)) redirect(`/app/external/${id}`);

  const now = Date.now();
  await db
    .prepare(
      "UPDATE submissions SET status = 'rejected', reviewed_at = ?, reviewer_notes = ? WHERE id = ?"
    )
    .bind(now, "Cancelled by volunteer", id)
    .run();

  revalidatePath(`/app/external/${id}`);
  redirect(`/app/external/${id}`);
}
