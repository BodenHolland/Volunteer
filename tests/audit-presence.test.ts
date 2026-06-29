import { test } from "node:test";
import assert from "node:assert";
import { nearestPresenceMeters } from "@/lib/audit-pipeline";

const STORE = { lat: 38.5816, lng: -121.4944 }; // a store in Sacramento
const FAR = { lat: 40.7128, lng: -74.006 }; // NYC — thousands of km away
const NEAR = { lat: STORE.lat + 0.0002, lng: STORE.lng }; // ~22m north

test("no location signal → null (treated as 'no evidence', never 'near')", () => {
  assert.strictEqual(nearestPresenceMeters(STORE, []), null);
  assert.strictEqual(
    nearestPresenceMeters(STORE, [
      { lat: null, lng: null },
      { lat: null, lng: null },
    ]),
    null
  );
});

test("a signal at the store → ~0m", () => {
  const d = nearestPresenceMeters(STORE, [{ lat: STORE.lat, lng: STORE.lng }]);
  assert.ok(d != null && d < 1, `expected ~0m, got ${d}`);
});

test("ANY nearby signal clears it — returns the nearest, not the farthest", () => {
  // EXIF GPS is far, device GPS is near → presence is established (nearest wins).
  const d = nearestPresenceMeters(STORE, [FAR, NEAR]);
  assert.ok(d != null && d < 100, `expected <100m (near signal wins), got ${d}`);
});

test("null EXIF but device present → uses the device signal", () => {
  const d = nearestPresenceMeters(STORE, [{ lat: null, lng: null }, FAR]);
  assert.ok(d != null && d > 100, `expected the far device distance, got ${d}`);
});
