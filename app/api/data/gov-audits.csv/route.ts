import { getDb } from "@/lib/cf";
import { csvEscape } from "@/lib/audit-aggregate";
import { rateLimit } from "@/lib/ratelimit";
import { requireDatasetAccess } from "@/lib/dataset-access";
import type {
  GovAuditSiteEvalRow,
  GovAuditPageEvalRow,
  GovAuditAutoCheckRow,
} from "@/lib/gov-audit";

/**
 * Signed-in CSV export, government website audits.
 *
 * DATA PRINCIPLE (CLAUDE.md): this endpoint reads ONLY the public cluster
 * (gov_audit_page_evaluations, gov_audit_site_evaluations, gov_audit_auto_checks).
 * It NEVER touches gov_audit_sessions or users, there is no FK to a person here,
 * so the export is safe by construction. One row per page evaluation; a page
 * evaluation only exists in the public cluster once a session is finalized, so
 * every public row is publishable.
 *
 * Moderation gate (PRD §8): the three free-text columns are published only when
 * text_moderation_status = 'approved'. Scores / structured fields always publish.
 */

// Joined shape: one row per page_evaluation, flattening its session-level site
// evaluation and the matching auto-check for the same URL.
interface GovAuditExportRow
  extends Pick<
      GovAuditPageEvalRow,
      | "public_session_ref"
      | "url"
      | "url_domain"
      | "page_title"
      | "time_on_anchor_sec"
      | "accessibility"
      | "acc_alt_text"
      | "acc_keyboard_nav"
      | "acc_contrast"
      | "acc_zoom_200"
      | "task_completion"
      | "maintained"
      | "nav_1to5"
      | "clarity_1to5"
      | "trust_1to5"
      | "overall_1to5"
      | "intent_text"
      | "blocker_text"
      | "fix_text"
      | "text_moderation_status"
      | "created_at"
    >,
    Pick<
      GovAuditSiteEvalRow,
      | "site_domain"
      | "official_domain"
      | "https"
      | "mobile_responsive"
      | "language_access"
      | "site_search"
      | "mobile_firsthand"
    >,
    Pick<GovAuditAutoCheckRow, "axe_violations" | "http_status" | "https_ok" | "load_ok"> {}

export async function GET(req: Request) {
  const denied = await requireDatasetAccess(req);
  if (denied) return denied;

  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for") ?? "anon";
  const rl = await rateLimit(`gov-audits-csv:${ip}`, 5, 60_000).catch(() => ({ ok: true }));
  if (!rl.ok) return new Response("rate limited", { status: 429 });

  const db = getDb();
  const rows =
    (
      await db
        .prepare(
          `SELECT p.public_session_ref,
                  s.site_domain, s.official_domain, s.https, s.mobile_responsive,
                  s.language_access, s.site_search, s.mobile_firsthand,
                  p.url, p.url_domain, p.page_title, p.time_on_anchor_sec,
                  p.accessibility, p.acc_alt_text, p.acc_keyboard_nav, p.acc_contrast,
                  p.acc_zoom_200, p.task_completion, p.maintained,
                  p.nav_1to5, p.clarity_1to5, p.trust_1to5, p.overall_1to5,
                  p.intent_text, p.blocker_text, p.fix_text, p.text_moderation_status,
                  c.axe_violations, c.http_status, c.https_ok, c.load_ok,
                  p.created_at
           FROM gov_audit_page_evaluations p
           LEFT JOIN gov_audit_site_evaluations s
             ON s.public_session_ref = p.public_session_ref
           LEFT JOIN gov_audit_auto_checks c
             ON c.public_session_ref = p.public_session_ref AND c.url = p.url
           ORDER BY p.created_at DESC`
        )
        .all<GovAuditExportRow>()
    ).results ?? [];

  const columns = [
    "public_session_ref",
    "site_domain",
    "official_domain",
    "https",
    "mobile_responsive",
    "language_access",
    "site_search",
    "mobile_firsthand",
    "url",
    "url_domain",
    "page_title",
    "time_on_anchor_sec",
    "accessibility",
    "acc_alt_text",
    "acc_keyboard_nav",
    "acc_contrast",
    "acc_zoom_200",
    "task_completion",
    "maintained",
    "nav_1to5",
    "clarity_1to5",
    "trust_1to5",
    "overall_1to5",
    "intent_text",
    "blocker_text",
    "fix_text",
    "axe_violations",
    "http_status",
    "https_ok",
    "load_ok",
    "created_at_iso",
  ];

  const lines = [columns.join(",")];
  for (const r of rows) {
    // Moderation gate: free text only when explicitly approved.
    const approved = r.text_moderation_status === "approved";
    lines.push(
      [
        csvEscape(r.public_session_ref),
        csvEscape(r.site_domain),
        csvEscape(r.official_domain),
        csvEscape(r.https),
        csvEscape(r.mobile_responsive),
        csvEscape(r.language_access),
        csvEscape(r.site_search),
        csvEscape(r.mobile_firsthand),
        csvEscape(r.url),
        csvEscape(r.url_domain),
        csvEscape(r.page_title),
        csvEscape(r.time_on_anchor_sec),
        csvEscape(r.accessibility),
        csvEscape(r.acc_alt_text),
        csvEscape(r.acc_keyboard_nav),
        csvEscape(r.acc_contrast),
        csvEscape(r.acc_zoom_200),
        csvEscape(r.task_completion),
        csvEscape(r.maintained),
        csvEscape(r.nav_1to5),
        csvEscape(r.clarity_1to5),
        csvEscape(r.trust_1to5),
        csvEscape(r.overall_1to5),
        csvEscape(approved ? r.intent_text : ""),
        csvEscape(approved ? r.blocker_text : ""),
        csvEscape(approved ? r.fix_text : ""),
        csvEscape(r.axe_violations),
        csvEscape(r.http_status),
        csvEscape(r.https_ok),
        csvEscape(r.load_ok),
        csvEscape(new Date(r.created_at).toISOString()),
      ].join(",")
    );
  }
  const body = lines.join("\n") + "\n";

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="colift-gov-website-audits.csv"',
      "Cache-Control": "private, no-store",
    },
  });
}
