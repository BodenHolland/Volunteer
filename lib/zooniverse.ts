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
 * Has this volunteer already submitted (approved OR pending) for this task +
 * reporting month + project name? Zooniverse certificates are cumulative
 * across the platform, so one submission per month per project is the rule.
 * Different month or different project name → not a conflict. Rejected
 * submissions don't block resubmission for the same month.
 */
export async function findExistingMonthSubmission(
  userId: string,
  taskTemplateId: string,
  reportingMonth: string,
  projectName: string,
  excludeSubmissionId?: string
): Promise<{ submission_id: string; status: string } | null> {
  const db = getDb();
  const normalized = projectName.trim().toLowerCase();
  let sql =
    `SELECT s.id AS submission_id, s.status FROM submissions s
       JOIN submission_files f ON f.submission_id = s.id AND f.kind = 'zooniverse_certificate'
      WHERE s.user_id = ?
        AND s.task_template_id = ?
        AND s.status IN ('approved','pending_review','ai_reviewing','submitted')
        AND json_extract(f.metadata_json, '$.reporting_month') = ?
        AND LOWER(TRIM(json_extract(f.metadata_json, '$.project_name'))) = ?`;
  const binds: string[] = [userId, taskTemplateId, reportingMonth, normalized];
  if (excludeSubmissionId) {
    sql += " AND s.id != ?";
    binds.push(excludeSubmissionId);
  }
  return (
    (await db.prepare(sql + " LIMIT 1").bind(...binds).first<{ submission_id: string; status: string }>()) ?? null
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

/** Validate an uploaded certificate's mime type.
 *  PDFs are not accepted: vision models can't read PDF content reliably, so a
 *  PDF cert can't auto-verify. Volunteers must upload a PNG or JPG (screenshot
 *  of the cert or export-as-image works fine). */
export const ALLOWED_CERT_MIMES = new Set(["image/png", "image/jpeg"]);
export const MAX_CERT_BYTES = 15 * 1024 * 1024; // 15 MB

/** Reported-hours bounds (manual self-report at submit time). */
export const REPORTED_HOURS_MIN = 0.1;
export const REPORTED_HOURS_MAX = 9.99;
export const REPORTED_HOURS_STEP = 0.1;

/**
 * AI auto-verification verdict for a Zooniverse certificate submission.
 * The verifier extracts the cert name + hours via vision, compares against
 * what the volunteer claimed, and reports whether the cross-check passes.
 */
export interface ZooniverseAiVerdict {
  /** True only when name + hours + profile look consistent enough to auto-approve. */
  auto_approve: boolean;
  /** Name extracted from the certificate, if readable. */
  extracted_cert_name: string | null;
  /** Total hours extracted from the certificate, if readable. */
  extracted_cert_hours: number | null;
  /** Did the extracted name look like the user's name? */
  name_match: boolean;
  /** Did the extracted hours match the user-reported hours (within 0.1h)? */
  hours_match: boolean;
  /** Did the volunteer-provided profile URL look consistent with the cert? */
  profile_consistent: boolean;
  reasoning: string;
  /** False when the AI call itself failed (network, auth, model error, parse failure).
   *  True when we got any structured response from the model — even if it extracted
   *  nothing. Drives the actionable-vs-informational classification. */
  ai_succeeded: boolean;
}

const ZOON_AI_FALLBACK: ZooniverseAiVerdict = {
  auto_approve: false,
  extracted_cert_name: null,
  extracted_cert_hours: null,
  name_match: false,
  hours_match: false,
  profile_consistent: false,
  reasoning: "AI auto-verification unavailable; manual review required.",
  ai_succeeded: false,
};

/**
 * How a verdict should affect the volunteer's flow.
 * - `clear`: auto-approve and ship straight to the ledger
 * - `actionable`: AI ran and found specific things the volunteer can fix (e.g.
 *   wrong cert, name mismatch, hours typo). Throw back to the form with the
 *   list so they can correct + resubmit without leaving the page.
 * - `informational`: AI couldn't get a verdict (no key, PDF, service down,
 *   ambiguous output). Send to manual review with a friendly notice.
 */
export type AiOutcome =
  | { kind: "clear" }
  | { kind: "actionable"; issues: string[] }
  | { kind: "informational"; note: string };

/**
 * Classify the AI verdict into one of three outcomes.
 *
 * Goal: maximize auto-approve + actionable; minimize informational. Only true
 * AI failures (network/auth/parse) should go to manual review — everything
 * else gives the volunteer specific feedback to fix and resubmit.
 *
 * Defensive `auto_approve` recompute: trust the three individual signals over
 * the model's overall verdict, so an over-cautious model can't veto cleanly
 * consistent evidence.
 */
export function classifyVerdict(
  verdict: ZooniverseAiVerdict,
  ctx: { reportedHours: number; userFullName: string }
): AiOutcome {
  // AI itself failed (network / no key / model error / parse failure).
  // Only this path goes to manual review.
  if (!verdict.ai_succeeded) {
    return { kind: "informational", note: verdict.reasoning };
  }

  // Recompute auto-approve from the three flags. The model is sometimes
  // conservative and returns auto_approve=false even when all three pass;
  // trust the granular signals.
  const allMatched = verdict.name_match && verdict.hours_match && verdict.profile_consistent;
  if (verdict.auto_approve || allMatched) return { kind: "clear" };

  // AI ran successfully but at least one check didn't pass. Build the most
  // specific feedback we can from what was extracted.
  const issues: string[] = [];

  if (verdict.extracted_cert_name && !verdict.name_match) {
    issues.push(
      `The name on the certificate (${verdict.extracted_cert_name}) doesn't match your account name (${ctx.userFullName}). Make sure you uploaded the right certificate.`
    );
  } else if (!verdict.extracted_cert_name) {
    issues.push(
      `We couldn't read a name from your certificate. Try re-uploading a clearer image (PNG/JPG works best — PDFs sometimes don't render).`
    );
  }

  if (verdict.extracted_cert_hours != null && !verdict.hours_match) {
    issues.push(
      `The certificate shows ${verdict.extracted_cert_hours}h but you reported ${ctx.reportedHours}h. Update the "hours" field to match what's on the certificate.`
    );
  } else if (verdict.extracted_cert_hours == null) {
    issues.push(
      `We couldn't read total hours from your certificate. The certificate must show your total hours for the month.`
    );
  }

  if (!verdict.profile_consistent) {
    if (verdict.extracted_cert_name) {
      issues.push(
        `Your profile URL doesn't look like it belongs to ${verdict.extracted_cert_name}. Open your Zooniverse profile and copy the exact URL.`
      );
    } else {
      issues.push(
        `We couldn't match your profile URL to the certificate. Open your Zooniverse profile and paste the URL exactly as shown.`
      );
    }
  }

  // Belt-and-suspenders: if somehow no issues were generated but auto_approve
  // is still false (shouldn't happen), give a generic actionable message
  // rather than punting to manual review.
  if (issues.length === 0) {
    issues.push(
      "We couldn't auto-verify this submission. Double-check the certificate, profile URL, and reported hours, then resubmit."
    );
  }
  return { kind: "actionable", issues };
}

const ZOON_AI_SYSTEM_PROMPT =
  "You are verifying a Zooniverse Volunteer Certificate against the volunteer's self-report. " +
  "Reply ONLY with strict JSON matching this schema:\n" +
  '{"extracted_cert_name": string|null, "extracted_cert_hours": number|null, ' +
  '"name_match": boolean, "hours_match": boolean, "profile_consistent": boolean, ' +
  '"auto_approve": boolean, "reasoning": string}\n\n' +
  "Rules:\n" +
  "- extracted_cert_name: the volunteer name printed on the certificate, or null if truly not readable.\n" +
  "- extracted_cert_hours: total hours printed on the certificate as a decimal (e.g. 2.5), or null if not present.\n" +
  "- name_match: true if the cert name plausibly refers to the same person as the user's account name. " +
  "Be GENEROUS: allow case, accent, middle-name, hyphenation, nickname (e.g. Sam/Samuel), and Latin/native-script variations.\n" +
  "- hours_match: true if the cert hours are within 0.1 of the user-reported hours.\n" +
  "- profile_consistent: true if the username slug in the profile URL plausibly belongs to the cert name. " +
  "Be GENEROUS: Zooniverse usernames are often nicknames, initials, or shorthand — don't require an exact substring match.\n" +
  "- auto_approve: true when name_match AND hours_match AND profile_consistent are all true.\n" +
  "- reasoning: one short sentence explaining the verdict.\n" +
  "Default to TRUE on the three match flags when the evidence is reasonably consistent. Reserve FALSE for clear mismatches " +
  "(different person entirely, wildly different hours, obviously unrelated profile). Volunteers will see your decisions and " +
  "be asked to fix issues — over-rejecting wastes their time.";

interface ZooniverseAiInput {
  userFullName: string;
  profileUrl: string;
  reportedHours: number;
  cert: { mime: string; base64: string };
  apiKey: string | undefined;
  model?: string;
  siteUrl?: string;
  appName?: string;
}

/** Coerce raw model output (JSON or fenced JSON) into the strict shape. */
function coerceZoonVerdict(raw: unknown): ZooniverseAiVerdict {
  const o = (raw as Record<string, unknown> | null) ?? {};
  const certName = typeof o.extracted_cert_name === "string" ? o.extracted_cert_name : null;
  const certHours = typeof o.extracted_cert_hours === "number" ? o.extracted_cert_hours : null;
  return {
    auto_approve: o.auto_approve === true,
    extracted_cert_name: certName,
    extracted_cert_hours: certHours,
    name_match: o.name_match === true,
    hours_match: o.hours_match === true,
    profile_consistent: o.profile_consistent === true,
    reasoning: typeof o.reasoning === "string" ? o.reasoning : "No reasoning provided.",
    ai_succeeded: true,
  };
}

/**
 * Call OpenRouter vision to cross-check a Zooniverse certificate against the
 * volunteer's self-report. Returns a structured verdict the submit action
 * uses to decide between auto-approve and manual review.
 *
 * The certificate image is sent inline as base64. PDFs are not natively
 * supported by most vision models, so a PDF cert always falls back to manual
 * review (auto_approve stays false). For v1 the auto-approve path applies
 * only when the volunteer uploaded a PNG/JPG of the certificate.
 */
export async function aiVerifyZooniverseCertificate(
  input: ZooniverseAiInput
): Promise<ZooniverseAiVerdict> {
  if (!input.apiKey) return ZOON_AI_FALLBACK;

  const content: unknown[] = [
    {
      type: "text",
      text:
        `Volunteer's account name: ${input.userFullName}\n` +
        `Volunteer's Zooniverse profile URL: ${input.profileUrl}\n` +
        `Volunteer-reported hours for this month: ${input.reportedHours}\n\n` +
        `Certificate image is attached. Verify and reply with the JSON shape.`,
    },
    {
      type: "image_url",
      image_url: { url: `data:${input.cert.mime};base64,${input.cert.base64}` },
    },
  ];

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": input.siteUrl ?? "http://localhost:3000",
        "X-Title": input.appName ?? "colift",
      },
      body: JSON.stringify({
        model: input.model ?? "google/gemini-2.5-flash-lite",
        response_format: { type: "json_object" },
        max_tokens: 512,
        messages: [
          { role: "system", content: ZOON_AI_SYSTEM_PROMPT },
          { role: "user", content },
        ],
      }),
    });
    if (!res.ok) return ZOON_AI_FALLBACK;
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = json.choices?.[0]?.message?.content;
    if (!text) return ZOON_AI_FALLBACK;
    const cleaned = text.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    return coerceZoonVerdict(JSON.parse(cleaned));
  } catch {
    return ZOON_AI_FALLBACK;
  }
}

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
