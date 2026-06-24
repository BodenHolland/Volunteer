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
 */

interface VerifiedRow {
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

export async function GET(req: Request) {
  const denied = await requireDatasetAccess(req);
  if (denied) return denied;

  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for") ?? "anon";
  const rl = await rateLimit(`audits-csv:${ip}`, 5, 60_000).catch(() => ({ ok: true }));
  if (!rl.ok) return new Response("rate limited", { status: 429 });

  const db = getDb();
  const rows =
    (
      await db
        .prepare(
          `SELECT s.public_session_ref, s.submitted_at, s.verified_at,
                  s.store_name, s.store_address,
                  s.store_type_observed, s.ebt_observation,
                  c.basket_item_id, c.stock_status, c.price_usd, c.size_value, c.size_unit
           FROM audit_public_summaries s
           JOIN audit_item_captures c ON c.public_session_ref = s.public_session_ref
           WHERE s.verified_at IS NOT NULL
           ORDER BY s.verified_at DESC`
        )
        .all<VerifiedRow>()
    ).results ?? [];

  const columns = [
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

  const lines = [columns.join(",")];
  for (const r of rows) {
    const item = USDA_THRIFTY_6.items.find((i) => i.id === r.basket_item_id);
    lines.push(
      [
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
      ].join(",")
    );
  }
  const body = lines.join("\n") + "\n";

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="tended-food-audits.csv"',
      "Cache-Control": "private, no-store",
    },
  });
}
