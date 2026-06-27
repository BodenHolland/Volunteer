import { test } from "node:test";
import assert from "node:assert";
import { nearestPresenceMeters } from "@/lib/audit-pipeline";

const STORE = { lat: 38.5816, lng: -121.4944 }; // Sacramento
const NEAR = { lat: 38.5817, lng: -121.4945 }; // ~15 m away
const FAR = { lat: 37.7749, lng: -122.4194 }; // San Francisco, ~120 km

test("nearestPresenceMeters: null when no location signal is present", () => {
  assert.strictEqual(
    nearestPresenceMeters(STORE, [
      { lat: null, lng: null },
      { lat: null, lng: null },
    ]),
    null
  );
});

test("nearestPresenceMeters: any nearby signal clears the check (no false positive)", () => {
  // EXIF near + device far → the near signal wins.
  const d = nearestPresenceMeters(STORE, [NEAR, FAR]);
  assert.ok(d != null && d < 100, `expected <100m, got ${d}`);
});

test("nearestPresenceMeters: device GPS covers a photo with no EXIF location", () => {
  // EXIF absent, device far → returns the far distance so the gate can flag it.
  const d = nearestPresenceMeters(STORE, [{ lat: null, lng: null }, FAR]);
  assert.ok(d != null && d > 100_000, `expected far distance, got ${d}`);
});

test("nearestPresenceMeters: flags when every present signal is far", () => {
  const d = nearestPresenceMeters(STORE, [FAR, FAR]);
  assert.ok(d != null && d > 100_000, `expected far distance, got ${d}`);
});
