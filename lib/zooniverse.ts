/**
 * Zooniverse-verified citizen-science task helpers.
 *
 * MVP path: volunteer uploads the Zooniverse Volunteer Certificate, reviewer
 * confirms it, approval credits hours to hours_ledger AND writes a row to
 * the PUBLIC cluster table zooniverse_public_activity (no PII, exported free
 * at /api/data/zooniverse-activity.{csv,json}).
 *
 * Direct API (server-side OAuth + Panoptes API) is OUT OF SCOPE for v1 —
 * fenced off behind ZOONIVERSE_DIRECT_API_ENABLED. See docs/prd-zooniverse-verification.md §11.
 */
import { getDb } from "./cf";
import type { ExternalProjectCatalog, ZooniversePublicActivity } from "./types";

/** Stable id of the reviewer org that owns Zooniverse task templates. */
export const ORG_CITIZEN_SCIENCE = "org_citizen_science";

/** Generic Zooniverse landing page — volunteers pick a project there. */
export const ZOONIVERSE_HOMEPAGE_URL = "https://www.zooniverse.org/projects";

export const ZOONIVERSE_REPORT_DISCLAIMER =
  "This record documents activity reported by Zooniverse and reviewed by colift. " +
  "It does not represent certification, sponsorship, or approval by Zooniverse, Adler Planetarium, NASA, " +
  "a project research team, or any government agency. Acceptance of this record is determined by the receiving " +
  "organization or program.";

export const ZOONIVERSE_TASK_DETAIL_DISCLAIMER =
  "colift is not Zooniverse and does not represent Zooniverse, NASA, Adler Planetarium, or any research project team. " +
  "You will complete this work on Zooniverse using your own account. Return here with the certificate Zooniverse " +
  "generates and a colift reviewer will verify it.";

export const ZOONIVERSE_ATTESTATION =
  "I confirm that I completed the activity described in this submission. " +
  "The attached evidence is accurate to the best of my knowledge. I understand that colift may reject or revise this " +
  "record if evidence is incomplete, duplicated, inconsistent, or outside the approved task rules.";

/** Cryptographic SHA-256 of an uploaded file. */
export async function sha256Hex(data: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Look up a catalog row for an external-certificate task template. */
export async function getCatalogEntry(taskTemplateId: string): Promise<ExternalProjectCatalog | null> {
  return (
    (await getDb()
      .prepare("SELECT * FROM external_project_catalog WHERE task_template_id = ?")
      .bind(taskTemplateId)
      .first<ExternalProjectCatalog>()) ?? null
  );
}

/**
 * Returns true if any other submission has already uploaded a certificate
 * with this SHA-256. Used to block re-using a single certificate across
 * submissions or users.
 */
export async function isDuplicateCertificate(sha256: string, excludeSubmissionId?: string): Promise<boolean> {
  const db = getDb();
  let sql =
    "SELECT id FROM submission_files WHERE kind = 'zooniverse_certificate' AND json_extract(metadata_json, '$.sha256') = ?";
  const binds: string[] = [sha256];
  if (excludeSubmissionId) {
    sql += " AND submission_id != ?";
    binds.push(excludeSubmissionId);
  }
  const row = await db.prepare(sql + " LIMIT 1").bind(...binds).first<{ id: string }>();
  return row != null;
}

/**
 * Compute remaining monthly minutes a user can credit for a given external task,
 * given the template's monthly_minutes_cap. Sums credited_minutes across already-
 * approved certificate reviews for this user + template + reporting month.
 */
export async function remainingMonthlyMinutes(
  userId: string,
  taskTemplateId: string,
  reportingMonth: string,
  cap: number
): Promise<number> {
  const db = getDb();
  const row = await db
    .prepare(
      `SELECT COALESCE(SUM(cr.credited_minutes), 0) AS m
         FROM certificate_reviews cr
         JOIN submissions s ON s.id = cr.submission_id
        WHERE s.user_id = ? AND s.task_template_id = ?
          AND s.status = 'approved' AND cr.decision = 'approved'
          AND substr(strftime('%Y-%m', s.reviewed_at / 1000, 'unixepoch'), 1, 7) = ?`
    )
    .bind(userId, taskTemplateId, reportingMonth)
    .first<{ m: number }>();
  const used = row?.m ?? 0;
  return Math.max(0, cap - used);
}

/**
 * Insert a row into the PUBLIC cluster. NO PII fields — only what's safe to
 * publish in the free CSV/JSON dataset. Caller has already approved the
 * submission and clamped credited_minutes to the cap.
 */
export async function writePublicActivityRow(row: ZooniversePublicActivity): Promise<void> {
  await getDb()
    .prepare(
      `INSERT INTO zooniverse_public_activity
         (public_session_ref, external_project_id, external_project_slug, task_type_label,
          reporting_month, credited_minutes, evidence_tier, approved_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(public_session_ref) DO UPDATE SET
         credited_minutes = excluded.credited_minutes,
         reporting_month  = excluded.reporting_month,
         approved_at      = excluded.approved_at`
    )
    .bind(
      row.public_session_ref,
      row.external_project_id,
      row.external_project_slug,
      row.task_type_label,
      row.reporting_month,
      row.credited_minutes,
      row.evidence_tier,
      row.approved_at
    )
    .run();
}

/** Convert a Date or timestamp to "YYYY-MM". */
export function reportingMonth(ts: number | Date): string {
  const d = ts instanceof Date ? ts : new Date(ts);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Validate an uploaded certificate's mime type. */
export const ALLOWED_CERT_MIMES = new Set(["application/pdf", "image/png", "image/jpeg"]);
export const ALLOWED_SCREENSHOT_MIMES = new Set(["image/png", "image/jpeg"]);
export const MAX_CERT_BYTES = 15 * 1024 * 1024; // 15 MB

/**
 * Lenient check that a string looks like a Zooniverse user profile URL.
 * Accepts http/https, optional www, with a username path component. Reviewer
 * still confirms the URL actually leads to the right account.
 */
export function looksLikeZooniverseProfileUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    if (host !== "zooniverse.org") return false;
    return /^\/users\/[^/]+\/?$/.test(u.pathname);
  } catch {
    return false;
  }
}
