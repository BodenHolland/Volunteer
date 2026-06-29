import { getDb } from "@/lib/cf";
import { csvEscape, extractZip } from "@/lib/audit-aggregate";
import { USDA_THRIFTY_6 } from "@/lib/food-audit";
import { rateLimit } from "@/lib/ratelimit";
import { requireDatasetAccess } from "@/lib/dataset-access";

/**
 * Signed-in CSV export — food access price audits.
 *
 * DATA PRINCIPLE (CLAUDE.md): this endpoint reads ONLY the public cluster
 * (audit_public_summaries + audit_item_captures, joined on public_session_ref).
 * It NEVER touches `audits`, `users`, `submissions`, or any row carrying PII —
 * the public tables have no FK to a person, so the export is safe by
 * construction. Only rows with verified_at IS NOT NULL surface (gated on the
 * fraud / spot-review pipeline).
 *
 * See migration 0016 for the structural split.
 *
 * M1 — Streaming + keyset pagination: the payload is streamed page-by-page so
 * memory stays bounded regardless of row count (no full-table read into an
 * array). Pages are walked by a keyset cursor on audit_item_captures.id (the
 * PK), which is stable under concurrent inserts — far cheaper than OFFSET on a
 * large set.
 */

const PAGE_SIZE = 1000;

interface VerifiedRow {
  capture_id: string;
  public_session_ref: string;
  submitted_at: number | null;
  verified_at: number | null;
  store_name: string | null;
  store_address: string | null;
  store_type_observed: string | null;
  ebt_observation: string | null;
  basket_item_id: string;
  stock_status: string;
  price_usd: number | null;
  size_value: number | null;
  size_unit: string | null;
}

const COLUMNS = [
  "public_session_ref",
  "submitted_at_iso",
  "verified_at_iso",
  "store_name",
  "store_address",
  "store_zip",
  "store_type_observed",
  "ebt_observation",
  "basket_item_id",
  "basket_item_category",
  "stock_status",
  "price_usd",
  "size_value",
  "size_unit",
];

function rowToCsvLine(r: VerifiedRow): string {
  const item = USDA_THRIFTY_6.items.find((i) => i.id === r.basket_item_id);
  return [
    csvEscape(r.public_session_ref),
    csvEscape(r.submitted_at ? new Date(r.submitted_at).toISOString() : ""),
    csvEscape(r.verified_at ? new Date(r.verified_at).toISOString() : ""),
    csvEscape(r.store_name),
    csvEscape(r.store_address),
    csvEscape(extractZip(r.store_address) ?? ""),
    csvEscape(r.store_type_observed),
    csvEscape(r.ebt_observation),
    csvEscape(r.basket_item_id),
    csvEscape(item?.category ?? ""),
    csvEscape(r.stock_status),
    csvEscape(r.price_usd),
    csvEscape(r.size_value),
    csvEscape(r.size_unit),
  ].join(",");
}

export async function GET(req: Request) {
  // M14 — auth gate is retained: dataset access is a deliberate product
  // decision (signed-in only) even though the payload carries no PII. The
  // response is still marked CDN-cacheable below so the gate doesn't force a
  // re-query of the whole dataset on every download.
  const denied = await requireDatasetAccess(req);
  if (denied) return denied;

  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for") ?? "anon";
  const rl = await rateLimit(`audits-csv:${ip}`, 5, 60_000).catch(() => ({ ok: true }));
  if (!rl.ok) return new Response("rate limited", { status: 429 });

  const db = getDb();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      controller.enqueue(encoder.encode(COLUMNS.join(",") + "\n"));
      let cursor = "";
      for (;;) {
        const page =
          (
            await db
              .prepare(
                `SELECT c.id AS capture_id, s.public_session_ref, s.submitted_at, s.verified_at,
                        s.store_name, s.store_address,
                        s.store_type_observed, s.ebt_observation,
                        c.basket_item_id, c.stock_status, c.price_usd, c.size_value, c.size_unit
                 FROM audit_item_captures c
                 JOIN audit_public_summaries s ON s.public_session_ref = c.public_session_ref
                 WHERE s.verified_at IS NOT NULL AND c.id > ?
                 ORDER BY c.id ASC
                 LIMIT ?`
              )
              .bind(cursor, PAGE_SIZE)
              .all<VerifiedRow>()
          ).results ?? [];
        if (page.length === 0) break;
        let chunk = "";
        for (const r of page) chunk += rowToCsvLine(r) + "\n";
        controller.enqueue(encoder.encode(chunk));
        cursor = page[page.length - 1].capture_id;
        if (page.length < PAGE_SIZE) break;
      }
      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="colift-food-audits.csv"',
      // M14 — Public-cluster data (no PII) — cacheable at the CDN. NOTE: the
      // requireDatasetAccess auth gate above forces a per-user response today,
      // so CDN caching only fully takes effect once/if that gate is removed.
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
