"use server";

import { redirect } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/lib/cf";
import { newId } from "@/lib/ids";
import { putFile } from "@/lib/r2";
import { getCurrentUser } from "@/lib/session";
import { processSubmissionAi } from "@/lib/process";
import { MIN_ENGAGEMENT_SECONDS } from "@/lib/engagement";
import { parseJson, type Submission } from "@/lib/types";

async function sha256Hex(buf: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function submitWork(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/start");
  const id = String(formData.get("submission_id") ?? "");
  const db = getDb();
  const sub = await db.prepare("SELECT * FROM submissions WHERE id = ?").bind(id).first<Submission>();
  if (!sub || sub.user_id !== user.id) redirect("/app/projects");
  if (!["committed", "in_progress", "needs_changes"].includes(sub.status)) {
    redirect(`/app/submissions/${id}`);
  }

  // Look up the task category once — it gates several category-specific paths
  // below (engagement floor, written-content storage, EMS form handling).
  const taskRow = await db
    .prepare("SELECT category FROM task_templates WHERE id = ?")
    .bind(sub.task_template_id)
    .first<{ category: string }>();
  const isEms = taskRow?.category === "ems-rate-research";

  // Hours integrity: minimum-engagement floor — can't submit before genuine
  // work. Skipped for ems-rate-research: that work happens almost entirely on
  // external pages and the structured form itself is the proof-of-effort.
  if (!isEms) {
    const measured = (sub as unknown as { measured_active_seconds: number }).measured_active_seconds ?? 0;
    if (measured < MIN_ENGAGEMENT_SECONDS) {
      redirect(`/app/projects/${id}?error=engagement`);
    }
  }

  // ---- Written content (category-specific text) ----
  // EMS overwrites user_notes with its own JSON below, so don't clobber it here.
  if (!isEms) {
    const text = String(formData.get("content") ?? "").trim();
    if (text) {
      await db.prepare("UPDATE submissions SET user_notes = ? WHERE id = ?").bind(text, id).run();
    }
  }

  // ---- EMS rate data (ems-rate-research category) ----
  if (isEms) {
    const readField = (prefix: "bls" | "als" | "mileage" | "tnt") => ({
      amount: String(formData.get(`ems_${prefix}_amount`) ?? "").trim(),
      source_url: String(formData.get(`ems_${prefix}_source_url`) ?? "").trim(),
      not_found: formData.get(`ems_${prefix}_not_found`) === "1",
    });
    // Preserve the public_session_ref from the existing draft. It was minted
    // at commit time; submit just records the rate data, it doesn't re-key
    // the public-cluster row.
    const existing = parseJson<{ public_session_ref?: string }>(sub.user_notes ?? "", {});
    const publicSessionRef = existing.public_session_ref ?? crypto.randomUUID();
    const emsData = {
      assignment: {
        provider_name: String(formData.get("ems_assignment_provider_name") ?? "").trim(),
        city: String(formData.get("ems_assignment_city") ?? "").trim(),
        state: String(formData.get("ems_assignment_state") ?? "").trim(),
      },
      public_session_ref: publicSessionRef,
      bls: readField("bls"),
      als: readField("als"),
      mileage: readField("mileage"),
      tnt: readField("tnt"),
      tnt_description: String(formData.get("ems_tnt_description") ?? "").trim(),
      effective_date: String(formData.get("ems_effective_date") ?? "").trim(),
      zip_codes: String(formData.get("ems_zip_codes") ?? "").trim(),
      notes: String(formData.get("ems_notes") ?? "").trim(),
    };
    const rateRows = [emsData.bls, emsData.als, emsData.mileage, emsData.tnt];
    // Every rate must be either filled in (has an amount) or explicitly marked
    // not-found, AND at least one must be filled. "All four marked not-found"
    // is a degenerate case we reject — it means the volunteer skipped without
    // doing the work; a real "couldn't find anything" submission still finds
    // at least one rate or is rare enough to handle case-by-case in review.
    const everyAddressed = rateRows.every((r) => r.not_found || r.amount !== "");
    const anyFilled = rateRows.some((r) => !r.not_found && r.amount !== "");
    if (!everyAddressed || !anyFilled) {
      redirect(`/app/projects/${id}/submit?error=incomplete`);
    }
    await db
      .prepare("UPDATE submissions SET user_notes = ? WHERE id = ?")
      .bind(JSON.stringify(emsData), id)
      .run();

    // PUBLIC CLUSTER WRITE — physically separate row, no user_id / submission_id
    // columns. The only cross-boundary key is public_session_ref. Created here
    // (not at approve time) so the public dataset reflects the volunteer's
    // submitted state; published_at gates whether the export endpoint surfaces
    // it. ON CONFLICT updates in case the volunteer is resubmitting after a
    // needs_changes review.
    await db
      .prepare(
        `INSERT INTO ems_rate_reports (
          id, public_session_ref, provider_name, city, state,
          bls_amount, bls_source_url, bls_not_found,
          als_amount, als_source_url, als_not_found,
          mileage_amount, mileage_source_url, mileage_not_found,
          tnt_amount, tnt_source_url, tnt_not_found, tnt_description,
          effective_date, zip_codes, notes,
          created_at
        ) VALUES (?,?,?,?,?, ?,?,?, ?,?,?, ?,?,?, ?,?,?,?, ?,?,?, ?)
        ON CONFLICT(public_session_ref) DO UPDATE SET
          bls_amount = excluded.bls_amount,
          bls_source_url = excluded.bls_source_url,
          bls_not_found = excluded.bls_not_found,
          als_amount = excluded.als_amount,
          als_source_url = excluded.als_source_url,
          als_not_found = excluded.als_not_found,
          mileage_amount = excluded.mileage_amount,
          mileage_source_url = excluded.mileage_source_url,
          mileage_not_found = excluded.mileage_not_found,
          tnt_amount = excluded.tnt_amount,
          tnt_source_url = excluded.tnt_source_url,
          tnt_not_found = excluded.tnt_not_found,
          tnt_description = excluded.tnt_description,
          effective_date = excluded.effective_date,
          zip_codes = excluded.zip_codes,
          notes = excluded.notes`
      )
      .bind(
        newId("emsrep"), publicSessionRef,
        emsData.assignment.provider_name, emsData.assignment.city, emsData.assignment.state,
        emsData.bls.amount || null, emsData.bls.source_url || null, emsData.bls.not_found ? 1 : 0,
        emsData.als.amount || null, emsData.als.source_url || null, emsData.als.not_found ? 1 : 0,
        emsData.mileage.amount || null, emsData.mileage.source_url || null, emsData.mileage.not_found ? 1 : 0,
        emsData.tnt.amount || null, emsData.tnt.source_url || null, emsData.tnt.not_found ? 1 : 0, emsData.tnt_description || null,
        emsData.effective_date || null, emsData.zip_codes || null, emsData.notes || null,
        Date.now()
      )
      .run();
  }

  // ---- File uploads ----
  const photos = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  const metaRaw = parseJson<{ lat?: number; lng?: number; captured_at?: number }[]>(
    String(formData.get("photo_meta") ?? "[]"),
    []
  );
  let idx = 0;
  for (const file of photos) {
    const buf = await file.arrayBuffer();
    const hash = await sha256Hex(buf);
    const key = `submissions/${id}/${newId("f")}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    await putFile(key, buf, file.type || "image/jpeg");
    const m = metaRaw[idx] ?? {};
    const metadata = {
      mime: file.type || "image/jpeg",
      sha256: hash,
      geo: m.lat != null && m.lng != null ? { lat: m.lat, lng: m.lng } : undefined,
      captured_at: m.captured_at ?? null,
    };
    await db
      .prepare("INSERT INTO submission_files (id, submission_id, kind, r2_key, metadata_json) VALUES (?,?,?,?,?)")
      .bind(newId("file"), id, "photo", key, JSON.stringify(metadata))
      .run();
    idx++;
  }

  // ---- Move to AI review ----
  await db
    .prepare("UPDATE submissions SET status = 'ai_reviewing', submitted_at = ?, reviewer_notes = NULL WHERE id = ?")
    .bind(Date.now(), id)
    .run();

  // Kick off AI in the background; the status poll is a fallback if this is dropped.
  try {
    getCloudflareContext().ctx.waitUntil(processSubmissionAi(id));
  } catch {
    void processSubmissionAi(id);
  }

  redirect(`/app/submissions/${id}`);
}
