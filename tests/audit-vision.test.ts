import { test } from "node:test";
import assert from "node:assert";
import { visionPasses, VISION_FALLBACK, type VisionResult } from "@/lib/audit-vision";

const good: VisionResult = {
  contains_price_tag: true,
  tag_is_readable: true,
  ocr_price_value: 4.99,
  ocr_price_currency: "USD",
  contains_item: true,
  item_category_observed: "dairy",
  confidence: 0.9,
  notes: "",
};

test("visionPasses: clean photo with matching category passes", () => {
  assert.strictEqual(visionPasses(good, "dairy"), true);
});

test("visionPasses: 'unknown' category is accepted (low-confidence model output)", () => {
  assert.strictEqual(
    visionPasses({ ...good, item_category_observed: "unknown" }, "dairy"),
    true
  );
});

test("visionPasses: missing tag fails", () => {
  assert.strictEqual(visionPasses({ ...good, contains_price_tag: false }, "dairy"), false);
});

test("visionPasses: unreadable tag fails", () => {
  assert.strictEqual(visionPasses({ ...good, tag_is_readable: false }, "dairy"), false);
});

test("visionPasses: missing item fails", () => {
  assert.strictEqual(visionPasses({ ...good, contains_item: false }, "dairy"), false);
});

test("visionPasses: mismatched category fails", () => {
  assert.strictEqual(visionPasses({ ...good, item_category_observed: "rice" }, "dairy"), false);
});

test("VISION_FALLBACK never passes", () => {
  for (const cat of ["dairy", "eggs", "bread", "rice", "beans", "produce"] as const) {
    assert.strictEqual(visionPasses(VISION_FALLBACK, cat), false);
  }
});
