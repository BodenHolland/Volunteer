import { test } from "node:test";
import assert from "node:assert";
import {
  FLAG_LABELS,
  CITY_CENTROIDS,
  type FlagKind,
} from "@/lib/fraud";

const ALL_KINDS: FlagKind[] = [
  "duplicate_image",
  "likely_ai_content",
  "geotag_mismatch",
  "velocity_anomaly",
];

test("FLAG_LABELS: every flag kind has a label and a valid tone", () => {
  for (const kind of ALL_KINDS) {
    const entry = FLAG_LABELS[kind];
    assert.ok(entry, `missing FLAG_LABELS entry for ${kind}`);
    assert.ok(entry.label.length > 0, `empty label for ${kind}`);
    assert.ok(
      entry.tone === "error" || entry.tone === "amber",
      `unexpected tone for ${kind}: ${entry.tone}`
    );
  }
});

test("FLAG_LABELS: tone mapping matches severity intent", () => {
  assert.equal(FLAG_LABELS.duplicate_image.tone, "error");
  assert.equal(FLAG_LABELS.likely_ai_content.tone, "error");
  assert.equal(FLAG_LABELS.geotag_mismatch.tone, "amber");
  assert.equal(FLAG_LABELS.velocity_anomaly.tone, "amber");
});

test("CITY_CENTROIDS: San Francisco is present with plausible coordinates", () => {
  const sf = CITY_CENTROIDS["San Francisco"];
  assert.ok(sf, "San Francisco centroid missing");
  assert.ok(sf.lat > 37 && sf.lat < 38, `lat out of range: ${sf.lat}`);
  assert.ok(sf.lng < -122 && sf.lng > -123, `lng out of range: ${sf.lng}`);
});
