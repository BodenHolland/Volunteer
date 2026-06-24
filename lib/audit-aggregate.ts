/**
 * Aggregate verified food audits into a public-facing report:
 *  - basket cost by zip (median per item × 6, or sum of medians)
 *  - out-of-stock rate per item
 *  - store-type mix
 *
 * Reads ONLY the public cluster (audit_public_summaries + audit_item_captures);
 * never touches `audits` or any private-cluster table. See migration 0016.
 */

import { getDb } from "./cf";
import { USDA_THRIFTY_6 } from "./food-audit";

export interface AuditRowAgg {
  /** public_session_ref — the only id that crosses to the private cluster. */
  id: string;
  submitted_at: number;
  store_type_observed: string | null;
  ebt_observation: string | null;
  store_name: string | null;
  store_address: string | null;
  store_zip: string | null;
}

export interface CaptureRowAgg {
  /** public_session_ref of the audit this capture belongs to. */
  public_session_ref: string;
  basket_item_id: string;
  stock_status: string;
  price_usd: number | null;
  size_value: number | null;
  size_unit: string | null;
}

export interface ZipReport {
  zip: string;
  audit_count: number;
  basket_cost_usd: number | null; // sum of median in-stock prices across 6 items
  median_prices: Record<string, number | null>; // basket_item_id → median USD
  oos_rates: Record<string, number>; // basket_item_id → 0..1
}

export interface StateReport {
  generated_at: number;
  verified_audits: number;
  unique_stores: number;
  zips: ZipReport[];
  oos_rate_overall: Record<string, number>;
  store_type_mix: Record<string, number>;
}

const ZIP_RE = /\b(\d{5})(?:-\d{4})?\b/;

export function extractZip(address: string | null | undefined): string | null {
  if (!address) return null;
  const m = ZIP_RE.exec(address);
  return m ? m[1] : null;
}

export function median(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) return (sorted[mid - 1] + sorted[mid]) / 2;
  return sorted[mid];
}

export function aggregate(
  audits: AuditRowAgg[],
  captures: CaptureRowAgg[]
): StateReport {
  const verified = audits.length;
  const stores = new Set<string>();
  for (const a of audits) if (a.store_address) stores.add(a.store_address);

  const auditsByZip = new Map<string, AuditRowAgg[]>();
  for (const a of audits) {
    const z = extractZip(a.store_address) ?? "unknown";
    const arr = auditsByZip.get(z) ?? [];
    arr.push(a);
    auditsByZip.set(z, arr);
  }

  const capturesByAudit = new Map<string, CaptureRowAgg[]>();
  for (const c of captures) {
    const arr = capturesByAudit.get(c.public_session_ref) ?? [];
    arr.push(c);
    capturesByAudit.set(c.public_session_ref, arr);
  }

  const zips: ZipReport[] = [];
  for (const [zip, zipAudits] of auditsByZip) {
    const pricesByItem: Record<string, number[]> = {};
    const inStockByItem: Record<string, number> = {};
    const totalByItem: Record<string, number> = {};
    for (const item of USDA_THRIFTY_6.items) {
      pricesByItem[item.id] = [];
      inStockByItem[item.id] = 0;
      totalByItem[item.id] = 0;
    }
    for (const a of zipAudits) {
      for (const c of capturesByAudit.get(a.id) ?? []) {
        totalByItem[c.basket_item_id] = (totalByItem[c.basket_item_id] ?? 0) + 1;
        if (c.stock_status === "in-stock" && c.price_usd != null) {
          pricesByItem[c.basket_item_id]?.push(c.price_usd);
          inStockByItem[c.basket_item_id] = (inStockByItem[c.basket_item_id] ?? 0) + 1;
        }
      }
    }
    const medianPrices: Record<string, number | null> = {};
    const oosRates: Record<string, number> = {};
    let basket: number | null = 0;
    for (const item of USDA_THRIFTY_6.items) {
      const med = median(pricesByItem[item.id]);
      medianPrices[item.id] = med;
      oosRates[item.id] =
        (totalByItem[item.id] ?? 0) === 0
          ? 0
          : 1 - (inStockByItem[item.id] ?? 0) / (totalByItem[item.id] ?? 1);
      if (med == null) basket = null;
      else if (basket != null) basket += med;
    }
    zips.push({
      zip,
      audit_count: zipAudits.length,
      basket_cost_usd: basket != null ? Math.round(basket * 100) / 100 : null,
      median_prices: medianPrices,
      oos_rates: oosRates,
    });
  }

  zips.sort((a, b) => b.audit_count - a.audit_count);

  // Overall OOS rates
  const overallIn: Record<string, number> = {};
  const overallTot: Record<string, number> = {};
  for (const item of USDA_THRIFTY_6.items) {
    overallIn[item.id] = 0;
    overallTot[item.id] = 0;
  }
  for (const c of captures) {
    overallTot[c.basket_item_id] = (overallTot[c.basket_item_id] ?? 0) + 1;
    if (c.stock_status === "in-stock") {
      overallIn[c.basket_item_id] = (overallIn[c.basket_item_id] ?? 0) + 1;
    }
  }
  const oosOverall: Record<string, number> = {};
  for (const item of USDA_THRIFTY_6.items) {
    oosOverall[item.id] = overallTot[item.id]
      ? 1 - overallIn[item.id] / overallTot[item.id]
      : 0;
  }

  const storeTypes: Record<string, number> = {};
  for (const a of audits) {
    const k = a.store_type_observed ?? "unknown";
    storeTypes[k] = (storeTypes[k] ?? 0) + 1;
  }

  return {
    generated_at: Date.now(),
    verified_audits: verified,
    unique_stores: stores.size,
    zips,
    oos_rate_overall: oosOverall,
    store_type_mix: storeTypes,
  };
}

export async function loadVerifiedAudits(): Promise<StateReport> {
  // PUBLIC-only query path. Reads only audit_public_summaries +
  // audit_item_captures, both keyed by public_session_ref. No JOIN to audits,
  // users, or any private-cluster table.
  const db = getDb();
  const audits =
    (
      await db
        .prepare(
          `SELECT s.public_session_ref AS id,
                  COALESCE(s.submitted_at, 0) AS submitted_at,
                  s.store_type_observed, s.ebt_observation,
                  s.store_name, s.store_address
           FROM audit_public_summaries s
           WHERE s.verified_at IS NOT NULL`
        )
        .all<Omit<AuditRowAgg, "store_zip">>()
    ).results?.map((r) => ({ ...r, store_zip: null })) ?? [];
  const refs = audits.map((a) => a.id);
  if (refs.length === 0) return aggregate([], []);
  const placeholders = refs.map(() => "?").join(",");
  const caps =
    (
      await db
        .prepare(
          `SELECT public_session_ref, basket_item_id, stock_status, price_usd, size_value, size_unit
           FROM audit_item_captures
           WHERE public_session_ref IN (${placeholders})`
        )
        .bind(...refs)
        .all<CaptureRowAgg>()
    ).results ?? [];
  return aggregate(audits, caps);
}

export function csvEscape(v: unknown): string {
  if (v == null) return "";
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function rowsToCsv(rows: Record<string, unknown>[], columns: string[]): string {
  const head = columns.join(",");
  const body = rows.map((r) => columns.map((c) => csvEscape(r[c])).join(",")).join("\n");
  return head + "\n" + body + (body ? "\n" : "");
}
