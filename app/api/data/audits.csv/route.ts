import { getDb } from "@/lib/cf";
import { csvEscape, extractZip } from "@/lib/audit-aggregate";
import { USDA_THRIFTY_6 } from "@/lib/food-audit";
import { rateLimit } from "@/lib/ratelimit";


interface VerifiedRow {
  audit_id: string;
  submitted_at: number;
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
  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for") ?? "anon";
  const rl = await rateLimit(`audits-csv:${ip}`, 5, 60_000).catch(() => ({ ok: true }));
  if (!rl.ok) return new Response("rate limited", { status: 429 });

  const db = getDb();
  const rows =
    (
      await db
        .prepare(
          `SELECT a.id AS audit_id, a.submitted_at,
                  COALESCE(a.store_name_snapshot, s.name) AS store_name,
                  COALESCE(a.store_address_snapshot, s.address) AS store_address,
                  a.store_type_observed, a.ebt_observation,
                  c.basket_item_id, c.stock_status, c.price_usd, c.size_value, c.size_unit
           FROM audits a
           JOIN audit_item_captures c ON c.audit_id = a.id
           LEFT JOIN stores s ON s.id = a.store_id
           WHERE a.validation_status = 'verified'
           ORDER BY a.submitted_at DESC`
        )
        .all<VerifiedRow>()
    ).results ?? [];

  const columns = [
    "audit_id",
    "submitted_at_iso",
    "store_name_hashed_if_volunteer_added",
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
        csvEscape(r.audit_id),
        csvEscape(new Date(r.submitted_at).toISOString()),
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
      "Cache-Control": "public, max-age=300",
    },
  });
}
