import { getDb } from "@/lib/cf";
import { rateLimit } from "@/lib/ratelimit";
import { requireDatasetAccess } from "@/lib/dataset-access";

/**
 * Signed-in JSON export — EMS ambulance billing rates.
 *
 * Same data, same moderation gate, and same public-cluster-only guarantee as
 * the CSV export (app/api/data/ems-rates.csv/route.ts). Reads ONLY
 * ems_rate_reports — never submissions or users.
 */

interface EmsRateExportRow {
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

export async function GET(req: Request) {
  const denied = await requireDatasetAccess(req);
  if (denied) return denied;

  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for") ?? "anon";
  const rl = await rateLimit(`ems-rates-json:${ip}`, 5, 60_000).catch(() => ({ ok: true }));
  if (!rl.ok) return new Response("rate limited", { status: 429 });

  const db = getDb();
  const rows =
    (
      await db
        .prepare(
          `SELECT public_session_ref, provider_name, city, state,
                  bls_amount, bls_source_url, bls_not_found,
                  als_amount, als_source_url, als_not_found,
                  mileage_amount, mileage_source_url, mileage_not_found,
                  tnt_amount, tnt_source_url, tnt_not_found, tnt_description,
                  effective_date, zip_codes, notes, text_moderation_status,
                  created_at, published_at
           FROM ems_rate_reports
           WHERE published_at IS NOT NULL
           ORDER BY published_at DESC`
        )
        .all<EmsRateExportRow>()
    ).results ?? [];

  const data = rows.map((r) => {
    const notesApproved = r.text_moderation_status === "approved";
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
      zip_codes: r.zip_codes,
      notes: notesApproved ? r.notes : null,
      created_at: new Date(r.created_at).toISOString(),
      published_at: new Date(r.published_at).toISOString(),
    };
  });

  return new Response(JSON.stringify({ count: data.length, rows: data }, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "private, no-store",
    },
  });
}
