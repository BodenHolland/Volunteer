import { getDb } from "@/lib/cf";
import { csvEscape } from "@/lib/audit-aggregate";
import { rateLimit } from "@/lib/ratelimit";
import { requireDatasetAccess } from "@/lib/dataset-access";
import type { ZooniversePublicActivity } from "@/lib/types";

/**
 * Citizen-science activity dataset (Zooniverse-verified).
 *
 * DATA PRINCIPLE: reads ONLY zooniverse_public_activity. That table has no
 * FK to users or submissions — the only link is an opaque public_session_ref
 * the requester cannot dereference. The export is safe by construction
 * because the public table simply does not have PII columns to leak.
 *
 * See migration 0019_zooniverse.sql and docs/prd-zooniverse-verification.md §10.
 *
 * M1 — Streaming + keyset pagination: streamed page-by-page so memory stays
 * bounded regardless of row count. zooniverse_public_activity has no surrogate
 * `id` PK; its PRIMARY KEY is public_session_ref (TEXT), so the keyset cursor
 * walks on that column.
 */

const PAGE_SIZE = 1000;

const COLUMNS = [
  "public_session_ref",
  "external_project_id",
  "external_project_slug",
  "task_type_label",
  "reporting_month",
  "credited_minutes",
  "evidence_tier",
  "approved_at_iso",
];

function rowToCsvLine(r: ZooniversePublicActivity): string {
  return [
    csvEscape(r.public_session_ref),
    csvEscape(r.external_project_id),
    csvEscape(r.external_project_slug),
    csvEscape(r.task_type_label),
    csvEscape(r.reporting_month),
    String(r.credited_minutes),
    csvEscape(r.evidence_tier),
    csvEscape(new Date(r.approved_at).toISOString()),
  ].join(",");
}

export async function GET(req: Request) {
  // M14 — auth gate retained (signed-in only, deliberate product decision);
  // payload carries no PII (CC0 public-cluster data) and is CDN-cacheable below.
  const denied = await requireDatasetAccess(req);
  if (denied) return denied;

  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for") ?? "anon";
  const rl = await rateLimit(`zooniverse-csv:${ip}`, 5, 60_000).catch(() => ({ ok: true }));
  if (!rl.ok) return new Response("rate limited", { status: 429 });

  const db = getDb();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      controller.enqueue(encoder.encode(COLUMNS.join(",") + "\n"));
      let cursor = "";
      for (;;) {
        // Keyset cursor on the PRIMARY KEY (public_session_ref). Ordering by the
        // PK rather than reporting_month/approved_at keeps the walk stable and
        // index-backed under concurrent inserts.
        const page =
          (
            await db
              .prepare(
                `SELECT public_session_ref, external_project_id, external_project_slug,
                        task_type_label, reporting_month, credited_minutes,
                        evidence_tier, approved_at
                   FROM zooniverse_public_activity
                   WHERE public_session_ref > ?
                   ORDER BY public_session_ref ASC
                   LIMIT ?`
              )
              .bind(cursor, PAGE_SIZE)
              .all<ZooniversePublicActivity>()
          ).results ?? [];
        if (page.length === 0) break;
        let chunk = "";
        for (const r of page) chunk += rowToCsvLine(r) + "\n";
        controller.enqueue(encoder.encode(chunk));
        cursor = page[page.length - 1].public_session_ref;
        if (page.length < PAGE_SIZE) break;
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=zooniverse-activity.csv",
      // M14 — Public-cluster CC0 data (no PII) — cacheable at the CDN. The
      // requireDatasetAccess gate above forces a per-user response today, so CDN
      // caching only fully takes effect once/if that gate is removed.
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
