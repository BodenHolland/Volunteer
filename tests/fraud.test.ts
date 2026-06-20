import { test } from "node:test";
import assert from "node:assert";
import { createHash } from "node:crypto";
import {
  detectDuplicateImages,
  detectAiContent,
  detectGeotagMismatch,
  detectVelocityAnomaly,
  haversineMiles,
  routeStatus,
  CITY_CENTROIDS,
} from "@/lib/fraud";
import { AI_FALLBACK, type AiVerdict } from "@/lib/ai";

const sha = (s: string) => createHash("sha256").update(s).digest("hex");

test("duplicate image: exact prior duplicate is flagged", () => {
  const h1 = sha("photo-A");
  const flags = detectDuplicateImages(
    [{ fileId: "f1", hash: h1 }],
    [{ submissionId: "subPrev", fileId: "fp", hash: h1 }]
  );
  assert.equal(flags.length, 1);
  assert.equal(flags[0].kind, "duplicate_image");
  assert.equal(flags[0].severity, "flag");
});

test("duplicate image: unique image not flagged", () => {
  const flags = detectDuplicateImages(
    [{ fileId: "f1", hash: sha("photo-B") }],
    [{ submissionId: "s", fileId: "fp", hash: sha("photo-A") }]
  );
  assert.equal(flags.length, 0);
});

test("duplicate image: duplicate within the same submission is flagged", () => {
  const h1 = sha("photo-A");
  const flags = detectDuplicateImages(
    [
      { fileId: "a", hash: h1 },
      { fileId: "b", hash: h1 },
    ],
    []
  );
  assert.equal(flags.length, 1);
  assert.equal(flags[0].evidence?.within_submission, true);
});

test("ai content: suspected_ai_content verdict flags", () => {
  const verdict: AiVerdict = { ...AI_FALLBACK, suspected_ai_content: true };
  assert.equal(detectAiContent(verdict).length, 1);
});

test("ai content: reasoning mentioning 'AI-generated' flags", () => {
  const verdict: AiVerdict = { ...AI_FALLBACK, reasoning: "This looks AI-generated." };
  assert.equal(detectAiContent(verdict).length, 1);
});

test("ai content: clean verdict does not flag", () => {
  assert.equal(detectAiContent(AI_FALLBACK).length, 0);
});

test("geotag haversine: SF centroid to Oakland is ~8 miles", () => {
  const sf = CITY_CENTROIDS["San Francisco"];
  const oakland = { lat: 37.8044, lng: -122.2712 };
  const miles = haversineMiles(sf, oakland);
  assert.ok(miles > 7 && miles < 9, `expected ~8mi, got ${miles}`);
  // zero distance
  assert.equal(haversineMiles(sf, sf), 0);
});

test("geotag mismatch: nearby in_person geotag is ok", () => {
  const sf = CITY_CENTROIDS["San Francisco"];
  const near = detectGeotagMismatch("in_person", [{ lat: 37.7599, lng: -122.4148 }], sf);
  assert.equal(near.length, 0);
});

test("geotag mismatch: far in_person geotag warns", () => {
  const sf = CITY_CENTROIDS["San Francisco"];
  const far = detectGeotagMismatch("in_person", [{ lat: 37.8044, lng: -122.2712 }], sf);
  assert.equal(far.length, 1);
  assert.equal(far[0].severity, "warn");
});

test("geotag mismatch: online task skips the check", () => {
  const sf = CITY_CENTROIDS["San Francisco"];
  assert.equal(detectGeotagMismatch("online", [{ lat: 40, lng: -100 }], sf).length, 0);
});

test("velocity: too-fast submission warns", () => {
  const now = 1_700_000_000_000;
  const fast = detectVelocityAnomaly(now, now - 5 * 60 * 1000, 3); // 5 min vs 3h est
  assert.equal(fast.length, 1);
  assert.equal(fast[0].kind, "velocity_anomaly");
  assert.equal(fast[0].severity, "warn");
});

test("velocity: normal pace is ok", () => {
  const now = 1_700_000_000_000;
  const ok = detectVelocityAnomaly(now, now - 2 * 3600 * 1000, 3); // 2h vs 3h est
  assert.equal(ok.length, 0);
});

test("velocity: missing start time or est hours is ignored", () => {
  const now = 1_700_000_000_000;
  assert.equal(detectVelocityAnomaly(now, null, 3).length, 0);
  assert.equal(detectVelocityAnomaly(now, now - 1000, 0).length, 0);
});

test("routeStatus: reject routes to rejected", () => {
  assert.equal(routeStatus({ ...AI_FALLBACK, verdict: "reject" }, []), "rejected");
});

test("routeStatus: a block-severity flag routes to needs_changes", () => {
  assert.equal(
    routeStatus(AI_FALLBACK, [{ kind: "duplicate_image", severity: "block" }]),
    "needs_changes"
  );
});

test("routeStatus: approve with warn flags routes to pending_review", () => {
  const sf = CITY_CENTROIDS["San Francisco"];
  const far = detectGeotagMismatch("in_person", [{ lat: 37.8044, lng: -122.2712 }], sf);
  assert.equal(routeStatus({ ...AI_FALLBACK, verdict: "approve" }, far), "pending_review");
});
