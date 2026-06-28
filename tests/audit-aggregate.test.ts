import { test } from "node:test";
import assert from "node:assert";
import {
  aggregate,
  csvEscape,
  extractZip,
  median,
  rowsToCsv,
  type AuditRowAgg,
  type CaptureRowAgg,
} from "@/lib/audit-aggregate";
import { haversineMeters } from "@/lib/audit-pipeline";

test("extractZip pulls 5-digit ZIP from CA addresses", () => {
  assert.strictEqual(extractZip("2020 Market St, San Francisco, CA 94114"), "94114");
  assert.strictEqual(extractZip("123 Main St, San Diego, CA 92101-1234"), "92101");
  assert.strictEqual(extractZip(null), null);
  assert.strictEqual(extractZip("no zip here"), null);
});

test("median: odd, even, empty", () => {
  assert.strictEqual(median([3, 1, 2]), 2);
  assert.strictEqual(median([1, 2, 3, 4]), 2.5);
  assert.strictEqual(median([]), null);
});

test("haversineMeters: ~0 for identical points, sane for nearby SF points", () => {
  const a = { lat: 37.7749, lng: -122.4194 };
  assert.strictEqual(haversineMeters(a, a), 0);
  const b = { lat: 37.7785, lng: -122.4194 }; // ~400m north
  const d = haversineMeters(a, b);
  assert.ok(d > 350 && d < 450, `expected ~400m, got ${d}`);
});

test("aggregate: empty → zero everything", () => {
  const r = aggregate([], []);
  assert.strictEqual(r.verified_audits, 0);
  assert.strictEqual(r.unique_stores, 0);
  assert.strictEqual(r.zips.length, 0);
});

test("aggregate: one audit at one store → one zip, basket cost is sum of per-item medians", () => {
  const audits: AuditRowAgg[] = [
    {
      id: "a1",
      submitted_at: 0,
      store_type_observed: "chain-supermarket",
      ebt_observation: "signage-visible",
      store_name: "Safeway",
      store_address: "2020 Market St, SF, CA 94114",
      store_zip: null,
    },
  ];
  const caps: CaptureRowAgg[] = [
    { public_session_ref: "a1", basket_item_id: "milk-gallon", stock_status: "in-stock", price_usd: 5.0, size_value: 1, size_unit: "gal" },
    { public_session_ref: "a1", basket_item_id: "eggs-dozen", stock_status: "in-stock", price_usd: 6.0, size_value: 12, size_unit: "count" },
    { public_session_ref: "a1", basket_item_id: "bread-loaf", stock_status: "in-stock", price_usd: 4.0, size_value: 16, size_unit: "oz" },
    { public_session_ref: "a1", basket_item_id: "rice-1lb", stock_status: "in-stock", price_usd: 2.0, size_value: 1, size_unit: "lb" },
    { public_session_ref: "a1", basket_item_id: "peanut-butter", stock_status: "in-stock", price_usd: 1.5, size_value: 16, size_unit: "oz" },
    { public_session_ref: "a1", basket_item_id: "produce-banana-or-apple", stock_status: "in-stock", price_usd: 0.79, size_value: 1, size_unit: "lb" },
  ];
  const r = aggregate(audits, caps);
  assert.strictEqual(r.verified_audits, 1);
  assert.strictEqual(r.unique_stores, 1);
  assert.strictEqual(r.zips.length, 1);
  assert.strictEqual(r.zips[0].zip, "94114");
  assert.strictEqual(r.zips[0].audit_count, 1);
  assert.strictEqual(r.zips[0].basket_cost_usd, 5 + 6 + 4 + 2 + 1.5 + 0.79);
});

test("aggregate: OOS rate reflects stock_status mix", () => {
  const audits: AuditRowAgg[] = [
    { id: "a1", submitted_at: 0, store_type_observed: null, ebt_observation: null, store_name: null, store_address: "94110", store_zip: null },
    { id: "a2", submitted_at: 0, store_type_observed: null, ebt_observation: null, store_name: null, store_address: "94110", store_zip: null },
  ];
  const caps: CaptureRowAgg[] = [
    { public_session_ref: "a1", basket_item_id: "milk-gallon", stock_status: "in-stock", price_usd: 5, size_value: 1, size_unit: "gal" },
    { public_session_ref: "a2", basket_item_id: "milk-gallon", stock_status: "out-of-stock", price_usd: null, size_value: null, size_unit: null },
  ];
  const r = aggregate(audits, caps);
  assert.strictEqual(r.oos_rate_overall["milk-gallon"], 0.5);
});

test("csvEscape: quotes strings with commas, quotes, newlines", () => {
  assert.strictEqual(csvEscape("hello"), "hello");
  assert.strictEqual(csvEscape("a,b"), '"a,b"');
  assert.strictEqual(csvEscape('a"b'), '"a""b"');
  assert.strictEqual(csvEscape("a\nb"), '"a\nb"');
  assert.strictEqual(csvEscape(null), "");
  assert.strictEqual(csvEscape(undefined), "");
});

test("rowsToCsv produces header + rows", () => {
  const out = rowsToCsv([{ a: 1, b: "x,y" }], ["a", "b"]);
  assert.match(out, /^a,b\n1,"x,y"\n$/);
});
