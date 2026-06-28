/**
 * Open Prices contribution client.
 *
 * Open Prices is the open-data project hosted by Open Food Facts at
 * https://prices.openfoodfacts.org. Every verified colift food audit
 * contributes its per-item prices upstream under the project tag
 * `colift-ca-food-access` so the global dataset benefits too.
 *
 * Pure module: caller passes the token. Persistence + retry queue live
 * in lib/audit-pipeline.ts (contributeAuditToOpenPrices).
 */

import type { BasketItem } from "./food-audit";

export const OPEN_PRICES_PROJECT_TAG = "colift-ca-food-access";
export const OPEN_PRICES_BASE = "https://prices.openfoodfacts.org/api/v1";

/**
 * basket_item.id → Open Food Facts product code (barcode-as-string).
 * Generic / store-brand codes for the 6-item USDA basket. Produce is
 * intentionally omitted (per handoff §8 Slice 3: "produce is by-region
 * so this needs care") — skipped contributions are recorded with
 * status='skipped' and never retried.
 *
 * Codes here are illustrative US generic-brand placeholders; update with
 * the canonical codes from world.openfoodfacts.org before going live.
 */
export const OFF_PRODUCT_CODES: Record<string, string | null> = {
  "milk-gallon": "0070038501022",
  "eggs-dozen": "0070000000016",
  "bread-loaf": "0073410000030",
  "rice-1lb": "0017400118228",
  "peanut-butter": "0051500255162", // creamy peanut butter, 16 oz (OFF-verified)
  "produce-banana-or-apple": null, // skip — region-specific
};

export interface OpenPricesPriceInput {
  product_code: string;
  price: number; // USD
  currency: "USD";
  date: string; // YYYY-MM-DD
  location_osm_id?: number;
  location_osm_type?: "node" | "way" | "relation";
  location_label?: string; // free-text fallback when no OSM id
  source: string; // free-text — we use the project tag + audit id
}

export interface OpenPricesResult {
  ok: boolean;
  open_prices_id?: string;
  status?: number;
  error?: string;
}

export interface ContribInput {
  token: string;
  price: OpenPricesPriceInput;
  baseUrl?: string;
}

/**
 * POST one price to Open Prices. Returns { ok, open_prices_id } on success;
 * { ok:false, status, error } otherwise.
 */
export async function postOpenPrice(input: ContribInput): Promise<OpenPricesResult> {
  const url = `${input.baseUrl ?? OPEN_PRICES_BASE}/prices`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.token}`,
        "Content-Type": "application/json",
        "User-Agent": "colift-food-access/1.0 (https://colift.org)",
      },
      body: JSON.stringify(input.price),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return { ok: false, status: res.status, error: errText.slice(0, 500) };
    }
    const json = (await res.json().catch(() => ({}))) as { id?: string | number };
    return {
      ok: true,
      open_prices_id: json.id != null ? String(json.id) : undefined,
      status: res.status,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/** ISO date (YYYY-MM-DD) in UTC. */
export function isoDate(ts: number): string {
  const d = new Date(ts);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Per-item normalization: returns the USD unit price OFF expects. */
export function normalizeUnitPrice(
  item: BasketItem,
  priceUsd: number
): number {
  // Open Prices expects the as-tagged shelf price. We pass through.
  // (Per-unit-of-measure normalization could be added later; not required
  //  for v1 contribution — the dataset already carries size + unit.)
  return Math.round(priceUsd * 100) / 100;
}

/** Exponential backoff: 0 → 30s → 5min → 30min → 6h, capped. */
export function nextRetryDelayMs(attempt: number): number {
  const ladder = [30_000, 5 * 60_000, 30 * 60_000, 6 * 60 * 60_000];
  if (attempt < 0) return ladder[0];
  return ladder[Math.min(attempt, ladder.length - 1)];
}

export const MAX_RETRY_ATTEMPTS = 5;
