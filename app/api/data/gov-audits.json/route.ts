import { getDb } from "@/lib/cf";
import { rateLimit } from "@/lib/ratelimit";
import { requireDatasetAccess } from "@/lib/dataset-access";
import type {
  GovAuditSiteEvalRow,
  GovAuditPageEvalRow,
  GovAuditAutoCheckRow,
} from "@/lib/gov-audit";

/**
 * Signed-in JSON export — government website audits.
 *
 * Same data, same moderation gate, same publish gate, and same
 * public-cluster-only guarantee as the CSV export
 * (app/api/data/gov-audits.csv/route.ts). Reads ONLY
 * gov_audit_page_evaluations / gov_audit_site_evaluations / gov_audit_auto_checks
 * — never gov_audit_sessions or users.
 *
 * H5 — Publish gate via the PUBLIC cluster, not a private join: filters on
 * `p.published_at IS NOT NULL` (column added by migration 0021), so an
 * unpublished/draft page evaluation never escapes and no private table is pulled
 * into the export path. Apply 0021 before merge (PR notes); until then no row
 * publishes — fails safe.
 *
 * M6 — Moderation gate: the three free-text columns publish only when
 * text_moderation_status = 'approved'.
 *
 * M1 — Streaming + keyset pagination: rows are streamed as a valid JSON array
 * (`[`, comma-separated objects, `]`), paged by a keyset cursor on
 * gov_audit_page_evaluations.id so memory stays bounded regardless of row count.
 */

const PAGE_SIZE = 1000;

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

function shapeRow(r: GovAuditExportRow) {
  // M6 — moderation gate: free text only when explicitly approved.
  const approved = r.text_moderation_status === "approved";
  return {
    public_session_ref: r.public_session_ref,
    site_domain: r.site_domain,
    official_domain: r.official_domain,
    https: r.https,
    mobile_responsive: r.mobile_responsive,
    language_access: r.language_access,
    site_search: r.site_search,
    mobile_firsthand: r.mobile_firsthand,
    url: r.url,
    url_domain: r.url_domain,
    page_title: r.page_title,
    time_on_anchor_sec: r.time_on_anchor_sec,
    accessibility: r.accessibility,
    acc_alt_text: r.acc_alt_text,
    acc_keyboard_nav: r.acc_keyboard_nav,
    acc_contrast: r.acc_contrast,
    acc_zoom_200: r.acc_zoom_200,
    task_completion: r.task_completion,
    maintained: r.maintained,
    nav_1to5: r.nav_1to5,
    clarity_1to5: r.clarity_1to5,
    trust_1to5: r.trust_1to5,
    overall_1to5: r.overall_1to5,
    intent_text: approved ? r.intent_text : "",
    blocker_text: approved ? r.blocker_text : "",
    fix_text: approved ? r.fix_text : "",
    axe_violations: r.axe_violations,
    http_status: r.http_status,
    https_ok: r.https_ok,
    load_ok: r.load_ok,
    created_at_iso: new Date(r.created_at).toISOString(),
  };
}

export async function GET(req: Request) {
  // M14 — auth gate retained (signed-in only, deliberate product decision);
  // payload carries no PII and is marked CDN-cacheable below.
  const denied = await requireDatasetAccess(req);
  if (denied) return denied;

  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for") ?? "anon";
  const rl = await rateLimit(`gov-audits-json:${ip}`, 5, 60_000).catch(() => ({ ok: true }));
  if (!rl.ok) return new Response("rate limited", { status: 429 });

  const db = getDb();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      controller.enqueue(encoder.encode("["));
      let cursor = "";
      let first = true;
      for (;;) {
        // H5 — `p.published_at` is added by migration 0021 (db-perf agent owns
        // it). Referenced via this string SQL so the route compiles before the
        // column exists; the query succeeds once 0021 is applied.
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
        for (const r of page) {
          chunk += (first ? "" : ",") + JSON.stringify(shapeRow(r));
          first = false;
        }
        controller.enqueue(encoder.encode(chunk));
        cursor = page[page.length - 1].page_id;
        if (page.length < PAGE_SIZE) break;
      }
      controller.enqueue(encoder.encode("]"));
      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      // M14 — Public-cluster data (no PII) — cacheable at the CDN. NOTE: the
      // requireDatasetAccess auth gate above forces a per-user response today,
      // so CDN caching only fully takes effect once/if that gate is removed.
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
