import { test } from "node:test";
import assert from "node:assert";
import { countyIdForCity } from "@/lib/county";

test("countyIdForCity: known cities map to county ids", () => {
  assert.equal(countyIdForCity("San Francisco"), "county_sf");
  assert.equal(countyIdForCity("Oakland"), "county_alameda");
  assert.equal(countyIdForCity("San Jose"), "county_santaclara");
});

test("countyIdForCity: unknown city returns null", () => {
  assert.equal(countyIdForCity("Fresno"), null);
  assert.equal(countyIdForCity("Sacramento"), null);
});

test("countyIdForCity: null / undefined / empty returns null", () => {
  assert.equal(countyIdForCity(null), null);
  assert.equal(countyIdForCity(undefined), null);
  assert.equal(countyIdForCity(""), null);
});

test("countyIdForCity: lookup is case-sensitive (no fuzzy match)", () => {
  assert.equal(countyIdForCity("san francisco"), null);
  assert.equal(countyIdForCity("SAN FRANCISCO"), null);
});
