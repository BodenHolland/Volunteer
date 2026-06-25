"use server";

import { redirect } from "next/navigation";
import { getDb } from "@/lib/cf";
import { putFile } from "@/lib/r2";
import { newId } from "@/lib/ids";
import { getCurrentUser } from "@/lib/session";
import {
  sha256Hex,
  isDuplicateCertificate,
  ALLOWED_CERT_MIMES,
  ALLOWED_SCREENSHOT_MIMES,
  MAX_CERT_BYTES,
  looksLikeZooniverseProfileUrl,
} from "@/lib/zooniverse";
import type { Submission } from "@/lib/types";

function back(id: string, error: string): never {
  redirect(`/app/external/${id}/submit?error=${encodeURIComponent(error)}`);
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

  const certFile = formData.get("certificate");
  if (!(certFile instanceof File) || certFile.size === 0) back(id, "Pick a certificate file to upload.");
  if (certFile.size > MAX_CERT_BYTES) back(id, "Certificate must be smaller than 15 MB.");
  if (!ALLOWED_CERT_MIMES.has(certFile.type)) back(id, "Certificate must be a PDF, PNG, or JPG.");

  const screenshotFile = formData.get("profile_screenshot");
  if (!(screenshotFile instanceof File) || screenshotFile.size === 0) {
    back(id, "Add a screenshot of your Zooniverse profile dashboard.");
  }
  if (screenshotFile.size > MAX_CERT_BYTES) back(id, "Screenshot must be smaller than 15 MB.");
  if (!ALLOWED_SCREENSHOT_MIMES.has(screenshotFile.type)) {
    back(id, "Screenshot must be a PNG or JPG image.");
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
  const attestation = String(formData.get("attestation") ?? "");
  if (!attestation) back(id, "You must accept the attestation to submit.");

  const reportingMonth = String(formData.get("reporting_month") ?? "");
  if (!/^\d{4}-\d{2}$/.test(reportingMonth)) back(id, "Pick a reporting month.");

  const certBuf = await certFile.arrayBuffer();
  const certSha256 = await sha256Hex(certBuf);
  const duplicate = await isDuplicateCertificate(certSha256, id);

  const certExt = certFile.type === "application/pdf" ? "pdf" : certFile.type === "image/png" ? "png" : "jpg";
  const certKey = `verification/zooniverse/${me.id}/${id}/certificate.${certExt}`;
  await putFile(certKey, certBuf, certFile.type);

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
        mime: certFile.type,
        size_bytes: certFile.size,
        sha256: certSha256,
        reporting_month: reportingMonth,
        project_name: projectName,
        project_slug: projectSlug,
        profile_url: profileUrl,
      })
    )
    .run();

  // Profile-dashboard screenshot — second evidence piece. Stored alongside the
  // cert in R2 with its own hash so reviewers can cross-check the username and
  // cumulative stats against the certificate.
  const shotBuf = await screenshotFile.arrayBuffer();
  const shotSha256 = await sha256Hex(shotBuf);
  const shotExt = screenshotFile.type === "image/png" ? "png" : "jpg";
  const shotKey = `verification/zooniverse/${me.id}/${id}/profile.${shotExt}`;
  await putFile(shotKey, shotBuf, screenshotFile.type);
  await db
    .prepare(
      "INSERT INTO submission_files (id, submission_id, kind, r2_key, metadata_json) VALUES (?,?,?,?,?)"
    )
    .bind(
      newId("shot"),
      id,
      "zooniverse_profile_screenshot",
      shotKey,
      JSON.stringify({
        mime: screenshotFile.type,
        size_bytes: screenshotFile.size,
        sha256: shotSha256,
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
  await db
    .prepare(
      "UPDATE submissions SET status = 'pending_review', submitted_at = ?, user_notes = ? WHERE id = ?"
    )
    .bind(now, description, id)
    .run();

  redirect(`/app/external/${id}`);
}
