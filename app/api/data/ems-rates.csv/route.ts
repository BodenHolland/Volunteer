import { getDb } from "@/lib/cf";
import { csvEscape } from "@/lib/audit-aggregate";
import { rateLimit } from "@/lib/ratelimit";
import { requireDatasetAccess } from "@/lib/dataset-access";

/**
 * Signed-in CSV export — EMS ambulance billing rates.
 *
 * DATA PRINCIPLE (CLAUDE.md): this endpoint reads ONLY the public cluster
 * (ems_rate_reports). It NEVER touches submissions or users — there is no
 * FK to a person in this table, so the export is safe by construction. Only
 * rows with published_at IS NOT NULL surface (gated on org reviewer approval).
 *
 * M6 — Moderation gate: structured rate/url/date columns publish on
 * `published_at`. The free-text `notes` AND `zip_codes` columns (migration 0015
 * marks zip_codes "free text — moderation status below gates publishing")
 * publish only when text_moderation_status = 'approved'. zip_codes was
 * previously emitted unconditionally; it is now gated to match notes.
 *
 * M1 — Streaming + keyset pagination: streamed page-by-page (keyset cursor on
 * ems_rate_reports.id) so memory stays bounded regardless of row count.
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

const COLUMNS = [
  "public_session_ref",
  "provider_name",
  "city",
  "state",
  "bls_amount",
  "bls_source_url",
  "bls_not_found",
  "als_amount",
  "als_source_url",
  "als_not_found",
  "mileage_amount",
  "mileage_source_url",
  "mileage_not_found",
  "tnt_amount",
  "tnt_source_url",
  "tnt_not_found",
  "tnt_description",
  "effective_date",
  "zip_codes",
  "notes",
  "created_at_iso",
  "published_at_iso",
];

function rowToCsvLine(r: EmsRateExportRow): string {
  // M6 — free text (notes + zip_codes) publishes only when explicitly approved.
  const textApproved = r.text_moderation_status === "approved";
  return [
    csvEscape(r.public_session_ref),
    csvEscape(r.provider_name),
    csvEscape(r.city),
    csvEscape(r.state),
    csvEscape(r.bls_amount),
    csvEscape(r.bls_source_url),
    csvEscape(r.bls_not_found),
    csvEscape(r.als_amount),
    csvEscape(r.als_source_url),
    csvEscape(r.als_not_found),
    csvEscape(r.mileage_amount),
    csvEscape(r.mileage_source_url),
    csvEscape(r.mileage_not_found),
    csvEscape(r.tnt_amount),
    csvEscape(r.tnt_source_url),
    csvEscape(r.tnt_not_found),
    csvEscape(r.tnt_description),
    csvEscape(r.effective_date),
    csvEscape(textApproved ? r.zip_codes : ""),
    csvEscape(textApproved ? r.notes : ""),
    csvEscape(new Date(r.created_at).toISOString()),
    csvEscape(new Date(r.published_at).toISOString()),
  ].join(",");
}

export async function GET(req: Request) {
  // M14 — auth gate retained (signed-in only, deliberate product decision);
  // payload carries no PII and is marked CDN-cacheable below.
  const denied = await requireDatasetAccess(req);
  if (denied) return denied;

  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for") ?? "anon";
  const rl = await rateLimit(`ems-rates-csv:${ip}`, 5, 60_000).catch(() => ({ ok: true }));
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
        for (const r of page) chunk += rowToCsvLine(r) + "\n";
        controller.enqueue(encoder.encode(chunk));
        cursor = page[page.length - 1].id;
        if (page.length < PAGE_SIZE) break;
      }
      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="colift-ems-rates.csv"',
      // M14 — Public-cluster data (no PII) — cacheable at the CDN. NOTE: the
      // requireDatasetAccess auth gate above forces a per-user response today,
      // so CDN caching only fully takes effect once/if that gate is removed.
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
