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
 * Signed-in CSV export — government website audits.
 *
 * DATA PRINCIPLE (CLAUDE.md): this endpoint reads ONLY the public cluster
 * (gov_audit_page_evaluations, gov_audit_site_evaluations, gov_audit_auto_checks).
 * It NEVER touches gov_audit_sessions or users — there is no FK to a person in
 * the queried tables, so the export is safe by construction.
 *
 * H5 — Publish gate via the PUBLIC cluster, not a private join. Migration 0021
 * adds `published_at` to gov_audit_page_evaluations; this export filters on
 * `published_at IS NOT NULL` so an unpublished/draft row never escapes. The
 * earlier design gated publishability by INNER-JOINing the private
 * gov_audit_sessions table on status='finalized' — that pulled a private table
 * into the public export path. The public-cluster column removes that coupling:
 * publishability is now a property of the work product itself. (Apply 0021
 * before merge — see PR notes. Until then no row publishes, which fails safe.)
 *
 * M6 — Moderation gate (PRD §8): the three free-text columns publish only when
 * text_moderation_status = 'approved'. Scores / structured fields always publish.
 *
 * M1 — Streaming + keyset pagination: streamed page-by-page (keyset cursor on
 * gov_audit_page_evaluations.id) so memory stays bounded regardless of row count.
 */

const PAGE_SIZE = 1000;

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
    Pick<GovAuditAutoCheckRow, "axe_violations" | "http_status" | "https_ok" | "load_ok"> {
  page_id: string;
}

const COLUMNS = [
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

function rowToCsvLine(r: GovAuditExportRow): string {
  // M6 — moderation gate: free text only when explicitly approved.
  const approved = r.text_moderation_status === "approved";
  return [
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
  ].join(",");
}

export async function GET(req: Request) {
  // M14 — auth gate retained (signed-in only, deliberate product decision);
  // payload carries no PII and is marked CDN-cacheable below.
  const denied = await requireDatasetAccess(req);
  if (denied) return denied;

  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for") ?? "anon";
  const rl = await rateLimit(`gov-audits-csv:${ip}`, 5, 60_000).catch(() => ({ ok: true }));
  if (!rl.ok) return new Response("rate limited", { status: 429 });

  const db = getDb();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      controller.enqueue(encoder.encode(COLUMNS.join(",") + "\n"));
      let cursor = "";
      for (;;) {
        // H5 — `p.published_at` is added by migration 0021 (db-perf agent owns
        // it). Referenced via this string SQL so the route compiles before the
        // column exists; the query succeeds once 0021 is applied. Until then it
        // returns zero rows (no column / no published rows) — fails safe.
        const page =
          (
            await db
              .prepare(
                `SELECT p.id AS page_id, p.public_session_ref,
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
                 WHERE p.published_at IS NOT NULL AND p.id > ?
                 ORDER BY p.id ASC
                 LIMIT ?`
              )
              .bind(cursor, PAGE_SIZE)
              .all<GovAuditExportRow>()
          ).results ?? [];
        if (page.length === 0) break;
        let chunk = "";
        for (const r of page) chunk += rowToCsvLine(r) + "\n";
        controller.enqueue(encoder.encode(chunk));
        cursor = page[page.length - 1].page_id;
        if (page.length < PAGE_SIZE) break;
      }
      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="colift-gov-website-audits.csv"',
      // M14 — Public-cluster data (no PII) — cacheable at the CDN. NOTE: the
      // requireDatasetAccess auth gate above forces a per-user response today,
      // so CDN caching only fully takes effect once/if that gate is removed.
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
