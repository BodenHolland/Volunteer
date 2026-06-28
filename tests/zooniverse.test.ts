import { test } from "node:test";
import assert from "node:assert";
import { readFileSync } from "node:fs";
import {
  sha256Hex,
  reportingMonth,
  ALLOWED_CERT_MIMES,
  MAX_CERT_BYTES,
  looksLikeZooniverseProfileUrl,
} from "@/lib/zooniverse";

test("sha256Hex: deterministic 64-char hex for known input", async () => {
  const input = new TextEncoder().encode("colift-zooniverse").buffer as ArrayBuffer;
  const a = await sha256Hex(input);
  const b = await sha256Hex(input);
  assert.equal(a, b);
  assert.match(a, /^[0-9a-f]{64}$/);
});

test("sha256Hex: different inputs produce different hashes", async () => {
  const a = await sha256Hex(new TextEncoder().encode("a").buffer as ArrayBuffer);
  const b = await sha256Hex(new TextEncoder().encode("b").buffer as ArrayBuffer);
  assert.notEqual(a, b);
});

test("reportingMonth: formats UTC year-month", () => {
  // 2026-03-15 12:00 UTC
  const ts = Date.UTC(2026, 2, 15, 12, 0, 0);
  assert.equal(reportingMonth(ts), "2026-03");
  // accepts Date too
  assert.equal(reportingMonth(new Date(ts)), "2026-03");
});

test("looksLikeZooniverseProfileUrl: accepts canonical profile URLs", () => {
  assert.ok(looksLikeZooniverseProfileUrl("https://www.zooniverse.org/users/some-user"));
  assert.ok(looksLikeZooniverseProfileUrl("https://zooniverse.org/users/some-user"));
  assert.ok(looksLikeZooniverseProfileUrl("https://www.zooniverse.org/users/some-user/"));
});

test("looksLikeZooniverseProfileUrl: rejects non-profile / wrong-host / malformed", () => {
  assert.equal(looksLikeZooniverseProfileUrl("https://zooniverse.org"), false);
  assert.equal(looksLikeZooniverseProfileUrl("https://zooniverse.org/projects/foo"), false);
  assert.equal(looksLikeZooniverseProfileUrl("https://evil.com/users/x"), false);
  assert.equal(looksLikeZooniverseProfileUrl("https://www.zooniverse.org/users/"), false);
  assert.equal(looksLikeZooniverseProfileUrl("not a url"), false);
  assert.equal(looksLikeZooniverseProfileUrl(""), false);
});

test("certificate upload guard rails are tight", () => {
  assert.equal(MAX_CERT_BYTES, 15 * 1024 * 1024);
  // PDFs are intentionally excluded: vision models can't read PDF content
  // reliably, so a PDF cert can't auto-verify. Only PNG/JPG are accepted.
  assert.deepEqual(
    [...ALLOWED_CERT_MIMES].sort(),
    ["image/jpeg", "image/png"].sort()
  );
});

/**
 * Structural privacy guarantee: the public-cluster writer must not reference
 * any private-cluster column. If a future edit threads `user_id` (or any
 * users / submissions FK column) into zooniverse_public_activity, this test
 * fails before the PII can leak through the public CSV/JSON export.
 *
 * See docs/prd-zooniverse-verification.md §10 and migration 0019.
 */
test("public-cluster writer references no PII columns", () => {
  const src = readFileSync(new URL("../lib/zooniverse.ts", import.meta.url), "utf8");
  const writerStart = src.indexOf("export async function writePublicActivityRow");
  assert.ok(writerStart > 0, "writePublicActivityRow not found");
  const writerEnd = src.indexOf("\n}", writerStart);
  const body = src.slice(writerStart, writerEnd);
  // The forbidden columns / table names should appear nowhere in the writer body.
  for (const forbidden of [
    "user_id",
    "legal_name",
    "case_number",
    "address_json",
    "dob",
    "phone",
    "email",
    "full_name",
    "users",
    "submissions",
  ]) {
    assert.equal(
      body.includes(forbidden),
      false,
      `public-cluster writer leaks reference to "${forbidden}"`
    );
  }
});

/**
 * Structural privacy guarantee: the public CSV/JSON exports read ONLY from
 * zooniverse_public_activity. Mirrors the food-audit pattern (migration 0016).
 */
test("public exports query only zooniverse_public_activity", () => {
  const csv = readFileSync(
    new URL("../app/api/data/zooniverse-activity.csv/route.ts", import.meta.url),
    "utf8"
  );
  const json = readFileSync(
    new URL("../app/api/data/zooniverse-activity.json/route.ts", import.meta.url),
    "utf8"
  );
  for (const src of [csv, json]) {
    assert.ok(src.includes("zooniverse_public_activity"));
    // None of the private tables may appear in the export source.
    for (const forbidden of [
      "FROM users",
      "FROM submissions",
      "FROM submission_files",
      "FROM certificate_reviews",
    ]) {
      assert.equal(
        src.includes(forbidden),
        false,
        `public export contains forbidden join: ${forbidden}`
      );
    }
  }
});
