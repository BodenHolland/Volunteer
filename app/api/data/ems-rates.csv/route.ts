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
 * Moderation gate: structured rate/url/date columns publish on `published_at`;
 * the free-text `notes` column publishes only when text_moderation_status =
 * 'approved'.
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

export async function GET(req: Request) {
  const denied = await requireDatasetAccess(req);
  if (denied) return denied;

  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for") ?? "anon";
  const rl = await rateLimit(`ems-rates-csv:${ip}`, 5, 60_000).catch(() => ({ ok: true }));
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

  const columns = [
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

  const lines = [columns.join(",")];
  for (const r of rows) {
    const notesApproved = r.text_moderation_status === "approved";
    lines.push(
      [
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
        csvEscape(r.zip_codes),
        csvEscape(notesApproved ? r.notes : ""),
        csvEscape(new Date(r.created_at).toISOString()),
        csvEscape(new Date(r.published_at).toISOString()),
      ].join(",")
    );
  }
  const body = lines.join("\n") + "\n";

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="tended-ems-rates.csv"',
      "Cache-Control": "private, no-store",
    },
  });
}
