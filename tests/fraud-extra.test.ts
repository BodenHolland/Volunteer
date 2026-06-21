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

test("CITY_CENTROIDS: Sacramento is present with plausible coordinates", () => {
  const sac = CITY_CENTROIDS["Sacramento"];
  assert.ok(sac, "Sacramento centroid missing");
  assert.ok(sac.lat > 38 && sac.lat < 39, `lat out of range: ${sac.lat}`);
  assert.ok(sac.lng < -121 && sac.lng > -122, `lng out of range: ${sac.lng}`);
});
