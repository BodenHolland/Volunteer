import { test } from "node:test";
import assert from "node:assert";
import { countyIdForCity } from "@/lib/county";

test("countyIdForCity: known cities map to county ids", () => {
  assert.equal(countyIdForCity("Sacramento"), "county_sacramento");
  assert.equal(countyIdForCity("Los Angeles"), "county_losangeles");
  assert.equal(countyIdForCity("Fresno"), "county_fresno");
});

test("countyIdForCity: unknown city returns null", () => {
  assert.equal(countyIdForCity("San Francisco"), null);
  assert.equal(countyIdForCity("Oakland"), null);
});

test("countyIdForCity: null / undefined / empty returns null", () => {
  assert.equal(countyIdForCity(null), null);
  assert.equal(countyIdForCity(undefined), null);
  assert.equal(countyIdForCity(""), null);
});

test("countyIdForCity: lookup is case-sensitive (no fuzzy match)", () => {
  assert.equal(countyIdForCity("sacramento"), null);
  assert.equal(countyIdForCity("SACRAMENTO"), null);
});
