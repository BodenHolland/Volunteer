import { getDb } from "@/lib/cf";
import { rateLimit } from "@/lib/ratelimit";
import { requireDatasetAccess } from "@/lib/dataset-access";

/**
 * Signed-in JSON export — EMS ambulance billing rates.
 *
 * Same data, same moderation gate, and same public-cluster-only guarantee as
 * the CSV export (app/api/data/ems-rates.csv/route.ts). Reads ONLY
 * ems_rate_reports — never submissions or users.
 *
 * Free-text gate: `notes` AND `zip_codes` (migration 0015 marks zip_codes "free
 * text — moderation status below gates publishing") publish only when
 * text_moderation_status = 'approved'.
 *
 * Streaming + keyset pagination: rows are streamed as a valid JSON array
 * (`[`, comma-separated objects, `]`), paged by a keyset cursor on
 * ems_rate_reports.id so memory stays bounded regardless of row count.
 */

const PAGE_SIZE = 1000;

interface EmsRateExportRow {
  id: string;
  public_session_ref: string;
  provider_name: string;
  city: string;
  state: string;
  bls_amount: string | null;
  bls_source_url: string | null;
  bls_not_found: number;
  als_amount: string | null;
  als_source_url: string | null;
  als_not_found: number;
  mileage_amount: string | null;
  mileage_source_url: string | null;
  mileage_not_found: number;
  tnt_amount: string | null;
  tnt_source_url: string | null;
  tnt_not_found: number;
  tnt_description: string | null;
  effective_date: string | null;
  zip_codes: string | null;
  notes: string | null;
  text_moderation_status: string;
  created_at: number;
  published_at: number;
}

function shapeRate(amount: string | null, sourceUrl: string | null, notFound: number) {
  if (notFound) return { found: false as const };
  if (!amount) return { found: null };
  return { found: true as const, amount, source_url: sourceUrl };
}

function shapeRow(r: EmsRateExportRow) {
  // Free text (notes + zip_codes) publishes only when explicitly approved.
  const textApproved = r.text_moderation_status === "approved";
  return {
    public_session_ref: r.public_session_ref,
    provider: { name: r.provider_name, city: r.city, state: r.state },
    rates: {
      bls_base: shapeRate(r.bls_amount, r.bls_source_url, r.bls_not_found),
      als_base: shapeRate(r.als_amount, r.als_source_url, r.als_not_found),
      per_mile: shapeRate(r.mileage_amount, r.mileage_source_url, r.mileage_not_found),
      tnt: {
        ...shapeRate(r.tnt_amount, r.tnt_source_url, r.tnt_not_found),
        description: r.tnt_description,
      },
    },
    effective_date: r.effective_date,
    zip_codes: textApproved ? r.zip_codes : null,
    notes: textApproved ? r.notes : null,
    created_at: new Date(r.created_at).toISOString(),
    published_at: new Date(r.published_at).toISOString(),
  };
}

export async function GET(req: Request) {
  const denied = await requireDatasetAccess(req);
  if (denied) return denied;

  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for") ?? "anon";
  const rl = await rateLimit(`ems-rates-json:${ip}`, 5, 60_000).catch(() => ({ ok: true }));
  if (!rl.ok) return new Response("rate limited", { status: 429 });

  const db = getDb();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      controller.enqueue(encoder.encode("["));
      let cursor = "";
      let first = true;
      for (;;) {
        const page =
          (
            await db
              .prepare(
                `SELECT id, public_session_ref, provider_name, city, state,
                        bls_amount, bls_source_url, bls_not_found,
                        als_amount, als_source_url, als_not_found,
                        mileage_amount, mileage_source_url, mileage_not_found,
                        tnt_amount, tnt_source_url, tnt_not_found, tnt_description,
                        effective_date, zip_codes, notes, text_moderation_status,
                        created_at, published_at
                 FROM ems_rate_reports
                 WHERE published_at IS NOT NULL AND id > ?
                 ORDER BY id ASC
                 LIMIT ?`
              )
              .bind(cursor, PAGE_SIZE)
              .all<EmsRateExportRow>()
          ).results ?? [];
        if (page.length === 0) break;
        let chunk = "";
        for (const r of page) {
          chunk += (first ? "" : ",") + JSON.stringify(shapeRow(r));
          first = false;
        }
        controller.enqueue(encoder.encode(chunk));
        cursor = page[page.length - 1].id;
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
      // Public-cluster data (no PII) — cacheable at the CDN. NOTE: the
      // requireDatasetAccess auth gate above forces a per-user response today,
      // so CDN caching only fully takes effect once/if that gate is removed.
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
