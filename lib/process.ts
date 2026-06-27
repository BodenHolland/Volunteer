/**
 * Runs AI validation + fraud checks for a submission and routes its status.
 * Safe to call more than once: it no-ops unless the submission is still
 * 'ai_reviewing'. Invoked from the submit action (via waitUntil) and lazily
 * from the status poll endpoint as a fallback.
 */
import { getDb, getEnv, getFiles } from "./cf";
import { validateSubmission, type AiVerdict } from "./ai";
import {
  detectDuplicateImages,
  detectAiContent,
  detectGeotagMismatch,
  detectVelocityAnomaly,
  routeStatus,
  CITY_CENTROIDS,
  type FraudFlag,
  type LatLng,
} from "./fraud";
import { newId } from "./ids";
import { toBase64 } from "./encoding";
import {
  parseJson,
  type EmsRateData,
  type Submission,
  type TaskTemplate,
  type User,
  type SubmissionFile,
} from "./types";

const MAX_IMAGES = 4;

export async function processSubmissionAi(submissionId: string): Promise<void> {
  const db = getDb();
  const sub = await db.prepare("SELECT * FROM submissions WHERE id = ?").bind(submissionId).first<Submission>();
  if (!sub || sub.status !== "ai_reviewing") return;

  // Single-flight lease. This runs from BOTH the submit action (via waitUntil)
  // AND the status-poll fallback, so two invocations can race. We can't add a
  // distinct "processing" status (submissions.status has a CHECK constraint), so
  // we claim atomically on the ai_verdict_json column instead: set a lease
  // sentinel only while status is still ai_reviewing AND no verdict/lease is
  // present. Only the run whose UPDATE actually changes a row proceeds; the
  // loser bails before the expensive AI/fraud work, avoiding double-processing
  // and duplicate flag rows. The terminal UPDATE overwrites the sentinel with
  // the real verdict.
  const LEASE_SENTINEL = '{"_lease":true}';
  const claim = await db
    .prepare(
      "UPDATE submissions SET ai_verdict_json = ? WHERE id = ? AND status = 'ai_reviewing' AND ai_verdict_json IS NULL"
    )
    .bind(LEASE_SENTINEL, submissionId)
    .run();
  if (claim.meta.changes !== 1) return;

  // Release the lease (sentinel → NULL) so the poll fallback can retry if this
  // run can't complete. Called on the missing-row early return and on any throw.
  const releaseLease = () =>
    db
      .prepare("UPDATE submissions SET ai_verdict_json = NULL WHERE id = ? AND ai_verdict_json = ?")
      .bind(submissionId, LEASE_SENTINEL)
      .run();

  try {
  const task = await db.prepare("SELECT * FROM task_templates WHERE id = ?").bind(sub.task_template_id).first<TaskTemplate>();
  const user = await db.prepare("SELECT * FROM users WHERE id = ?").bind(sub.user_id).first<User>();
  if (!task || !user) {
    await releaseLease();
    return;
  }

  const files = (await db.prepare("SELECT * FROM submission_files WHERE submission_id = ?").bind(submissionId).all<SubmissionFile>()).results ?? [];

  // Load image bytes from R2 → base64 (best-effort, capped).
  const images: { mime: string; base64: string }[] = [];
  const r2 = getFiles();
  for (const f of files.slice(0, MAX_IMAGES)) {
    if (f.kind !== "photo") continue;
    try {
      const obj = await r2.get(f.r2_key);
      if (!obj) continue;
      const buf = await obj.arrayBuffer();
      const meta = parseJson<{ mime?: string }>(f.metadata_json, {});
      images.push({ mime: meta.mime || "image/jpeg", base64: toBase64(buf) });
    } catch {
      /* skip */
    }
  }

  const submissionText =
    `Task: ${task.title}\nCategory: ${task.category}\n\n` +
    `Participant's submission:\n${formatNotesForAi(task.category, sub.user_notes)}\n\n` +
    `Attached files: ${files.length}`;

  const env = getEnv();
  const verdict: AiVerdict = await validateSubmission({
    rubric: task.validation_rubric_md,
    submissionText,
    images,
    apiKey: env.OPENROUTER_API_KEY,
    model: env.OPENROUTER_MODEL,
    siteUrl: env.OPENROUTER_SITE_URL,
    appName: env.OPENROUTER_APP_NAME,
  });

  // ---- Fraud signals ----
  const flags: FraudFlag[] = [];

  // a. duplicates vs prior files in OTHER submissions. Instead of scanning the
  // whole submission_files table, fetch only rows whose sha256 matches one of
  // this submission's file hashes — served by the expression index on
  // json_extract(metadata_json,'$.sha256') (migration 0017). Bounded by this
  // submission's file count, not by table size.
  const current = files.map((f) => ({ fileId: f.id, hash: parseJson<{ sha256?: string }>(f.metadata_json, {}).sha256 ?? "" })).filter((x) => x.hash);
  const currentHashes = [...new Set(current.map((c) => c.hash))];
  let prior: { submissionId: string; fileId: string; hash: string }[] = [];
  if (currentHashes.length > 0) {
    const placeholders = currentHashes.map(() => "?").join(",");
    const priorRows =
      (
        await db
          .prepare(
            `SELECT id, submission_id, metadata_json FROM submission_files
             WHERE json_extract(metadata_json, '$.sha256') IN (${placeholders})
               AND submission_id != ?`
          )
          .bind(...currentHashes, submissionId)
          .all<SubmissionFile>()
      ).results ?? [];
    prior = priorRows
      .map((f) => ({ submissionId: f.submission_id, fileId: f.id, hash: parseJson<{ sha256?: string }>(f.metadata_json, {}).sha256 ?? "" }))
      .filter((x) => x.hash);
  }
  flags.push(...detectDuplicateImages(current, prior));

  // b. AI content
  flags.push(...detectAiContent(verdict));

  // c. geotag
  const geos: LatLng[] = files
    .map((f) => parseJson<{ geo?: LatLng }>(f.metadata_json, {}).geo)
    .filter((g): g is LatLng => !!g && typeof g.lat === "number");
  flags.push(...detectGeotagMismatch(task.location_kind, geos, CITY_CENTROIDS[user.city ?? "Sacramento"]));

  // d. velocity
  flags.push(...detectVelocityAnomaly(sub.submitted_at ?? Date.now(), sub.first_started_at, task.est_hours));

  // Persist the flags and the routed terminal status atomically. The terminal
  // UPDATE overwrites the lease sentinel with the real verdict and flips status
  // off ai_reviewing (gated on status='ai_reviewing' so it stays idempotent).
  const now = Date.now();
  const nextStatus = routeStatus(verdict, flags);
  const batch: D1PreparedStatement[] = flags.map((fl) =>
    db
      .prepare("INSERT INTO submission_flags (id, submission_id, kind, severity, evidence_json, created_at) VALUES (?,?,?,?,?,?)")
      .bind(newId("flag"), submissionId, fl.kind, fl.severity, JSON.stringify(fl.evidence ?? {}), now)
  );
  batch.push(
    db
      .prepare("UPDATE submissions SET status = ?, ai_verdict_json = ? WHERE id = ? AND status = 'ai_reviewing'")
      .bind(nextStatus, JSON.stringify(verdict), submissionId)
  );
  await db.batch(batch);
  } catch (err) {
    // Release the lease so the poll fallback can retry, then rethrow so the
    // caller's logging still sees the failure.
    await releaseLease().catch(() => {});
    throw err;
  }
}

function formatNotesForAi(category: string, notes: string | null): string {
  if (!notes) return "(no written content)";
  if (category !== "ems-rate-research") return notes;
  const data = parseJson<EmsRateData | null>(notes, null);
  if (!data || !data.assignment) return notes;
  const row = (label: string, f: { amount: string; source_url: string; not_found: boolean }) =>
    f.not_found
      ? `- ${label}: COULDN'T FIND`
      : f.amount
        ? `- ${label}: $${f.amount}  (source: ${f.source_url || "MISSING URL"})`
        : `- ${label}: (blank)`;
  const where = `${data.assignment.city}, ${data.assignment.state}`;
  const assignmentLine = data.assignment.provider_name
    ? `Assigned provider: ${data.assignment.provider_name} (${where})`
    : `Service area: ${where}. Volunteer was asked to identify the EMS agency that bills ambulance transports in this area and verify its published rates. Judge the rates and source URL against whichever agency the volunteer's source documents.`;
  return [
    assignmentLine,
    "",
    "Rates reported:",
    row("BLS base", data.bls),
    row("ALS base", data.als),
    row("Per-mile", data.mileage),
    row("TNT fee", data.tnt),
    data.tnt_description ? `TNT description: ${data.tnt_description}` : "",
    data.effective_date ? `Effective date: ${data.effective_date}` : "",
    data.zip_codes ? `Coverage: ${data.zip_codes}` : "",
    data.notes ? `Notes: ${data.notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

