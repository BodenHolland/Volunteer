import { test } from "node:test";
import assert from "node:assert";
import { readFileSync } from "node:fs";
import {
  sha256Hex,
  reportingMonth,
  ALLOWED_CERT_MIMES,
  MAX_CERT_BYTES,
  looksLikeZooniverseProfileUrl,
  creditableDeltaMinutes,
  classifyVerdict,
  externalCertAutoApproveEnabled,
  type ZooniverseAiVerdict,
} from "@/lib/zooniverse";

/** A fully-passing AI verdict — every signal true, model said auto_approve. */
function passingVerdict(over: Partial<ZooniverseAiVerdict> = {}): ZooniverseAiVerdict {
  return {
    auto_approve: true,
    extracted_cert_name: "Sam Rivera",
    extracted_cert_hours: 2.0,
    name_match: true,
    hours_match: true,
    profile_consistent: true,
    reasoning: "All signals consistent.",
    ai_succeeded: true,
    ...over,
  };
}

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

// ---------------------------------------------------------------------------
// C1: credited time is the DELTA vs prior cumulative, never the raw self-report.
// ---------------------------------------------------------------------------

test("creditableDeltaMinutes: credits only the delta, never the raw cumulative", () => {
  // Certificate reports 180 cumulative minutes; we've already credited 120.
  // Only the 60 NEW minutes may be credited — NOT the full 180 self-report.
  const current = 180;
  const prior = 120;
  const delta = creditableDeltaMinutes(current, prior);
  assert.equal(delta, 60);
  assert.notEqual(delta, current, "must not credit the raw self-reported cumulative");
});

test("creditableDeltaMinutes: first submission credits full cumulative (prior 0)", () => {
  assert.equal(creditableDeltaMinutes(120, 0), 120);
});

test("creditableDeltaMinutes: re-export with same/lower cumulative credits zero (clamped >= 0)", () => {
  // Same cumulative re-uploaded (L6 re-export): no new work => zero.
  assert.equal(creditableDeltaMinutes(120, 120), 0);
  // Lower cumulative (stale cert) never goes negative.
  assert.equal(creditableDeltaMinutes(90, 120), 0);
});

test("creditableDeltaMinutes: coerces non-finite inputs to 0", () => {
  assert.equal(creditableDeltaMinutes(Number.NaN, 30), 0);
  assert.equal(creditableDeltaMinutes(90, Number.NaN), 90);
});

test("credited (delta capped) is always <= cap and <= delta, never the raw report", () => {
  // Mirror the actions.ts math: credited = min(delta, remaining-cap).
  const reportedCumulative = 600; // raw self-report
  const prior = 200;
  const delta = creditableDeltaMinutes(reportedCumulative, prior); // 400
  const remainingCap = 120; // conservative monthly cap window
  const credited = Math.min(delta, remainingCap);
  assert.equal(delta, 400);
  assert.equal(credited, 120);
  assert.ok(credited <= remainingCap, "credited must not exceed the cap");
  assert.ok(credited <= delta, "credited must not exceed the delta");
  assert.ok(credited < reportedCumulative, "credited must never be the raw self-report");
});

// ---------------------------------------------------------------------------
// H10: STRICT-AND classifier — a model "no" never becomes a "clear".
// ---------------------------------------------------------------------------

const CTX = { reportedHours: 2.0, userFullName: "Sam Rivera" };

test("classifyVerdict: all signals pass AND model auto_approve => clear", () => {
  const out = classifyVerdict(passingVerdict(), CTX);
  assert.equal(out.kind, "clear");
});

test("classifyVerdict: model auto_approve=false NEVER auto-approves, even if all flags true", () => {
  // The prior bug re-derived a pass from the granular flags. STRICT-AND must
  // respect the model's "no".
  const out = classifyVerdict(passingVerdict({ auto_approve: false }), CTX);
  assert.notEqual(out.kind, "clear");
});

test("classifyVerdict: any single granular flag false => not clear", () => {
  for (const flag of ["name_match", "hours_match", "profile_consistent"] as const) {
    const out = classifyVerdict(passingVerdict({ [flag]: false }), CTX);
    assert.notEqual(out.kind, "clear", `${flag}=false must not be clear`);
  }
});

test("classifyVerdict: AI failure routes to manual review (informational), not clear", () => {
  const out = classifyVerdict(
    passingVerdict({ ai_succeeded: false, reasoning: "service down" }),
    CTX
  );
  assert.equal(out.kind, "informational");
});

// ---------------------------------------------------------------------------
// C2: auto-approve is OFF by default (env-gated, fail-closed).
// ---------------------------------------------------------------------------

test("externalCertAutoApproveEnabled: defaults OFF when env is unreadable", () => {
  // In the test runtime there is no Cloudflare context, so getEnv() throws and
  // the gate must fail closed to manual-review-only.
  assert.equal(externalCertAutoApproveEnabled(), false);
});
