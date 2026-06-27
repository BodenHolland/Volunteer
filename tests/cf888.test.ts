import { test } from "node:test";
import assert from "node:assert";
import { buildCf888Pdf, type Cf888Data } from "@/lib/cf888";
import { extractPdfText, extractPdfTextRuns } from "./pdf-text";

const SAMPLE: Cf888Data = {
  participantName: "Marisol Reyes",
  birthdate: "March 4, 1990",
  participantAddress: ["123 Elm St", "Apt 2", "Sacramento, CA 95814"],
  orgName: "Canopy Commons",
  representativeName: "Daniel Okafor",
  orgAddress: ["1265 Capitol Ave", "", "Sacramento, CA 95816"],
  orgPhone: "(916) 555-0100",
  month: "June 2026",
  hours: 12,
  activity: "ongoing",
  signatureName: "Daniel Okafor",
  dateSigned: "June 19, 2026",
};

test("buildCf888Pdf returns a Uint8Array starting with the PDF magic bytes", async () => {
  const bytes = await buildCf888Pdf(SAMPLE);
  assert.ok(bytes instanceof Uint8Array, "expected a Uint8Array");
  assert.ok(bytes.length > 0, "expected non-empty output");
  const magic = new TextDecoder().decode(bytes.subarray(0, 5));
  assert.equal(magic, "%PDF-");
});

test("buildCf888Pdf does not throw on minimal / empty data", async () => {
  const bytes = await buildCf888Pdf({
    participantName: "",
    birthdate: "",
    participantAddress: [],
    orgName: "",
    representativeName: "",
    orgAddress: [],
    orgPhone: "",
    month: "",
    hours: 0,
    activity: "one_time",
    signatureName: "",
    dateSigned: "",
  });
  assert.ok(bytes instanceof Uint8Array);
  assert.equal(new TextDecoder().decode(bytes.subarray(0, 5)), "%PDF-");
});

/**
 * LEGAL FORM CONTENT — the audit found these forms were only asserted to "be a
 * PDF". The CF 888 is a legal attestation about a SPECIFIC person's hours; if the
 * participant's data doesn't actually render into the document, the form is
 * worthless. These tests decode the rendered text and assert the real values land.
 */

test("CF 888: participant name, hours, and key fields actually render into the PDF", async () => {
  const text = extractPdfText(await buildCf888Pdf(SAMPLE));
  const runs = extractPdfTextRuns(await buildCf888Pdf(SAMPLE));
  assert.ok(text.includes("Marisol Reyes"), "participant name must render");
  assert.ok(text.includes("Canopy Commons"), "org name must render");
  assert.ok(text.includes("Daniel Okafor"), "representative name must render");
  assert.ok(text.includes("June 2026"), "certification month must render");
  assert.ok(text.includes("123 Elm St"), "participant address must render");
  // Hours must render as a discrete value (not a substring of something else).
  assert.ok(runs.includes("12"), "hours value '12' must render as its own text run");
});

test("CF 888: a different hours value renders correctly (not hard-coded)", async () => {
  const runs = extractPdfTextRuns(await buildCf888Pdf({ ...SAMPLE, hours: 37 }));
  assert.ok(runs.includes("37"), "the actual hours value must render");
  assert.ok(!runs.includes("12"), "the previous sample's hours must NOT leak in");
});

test("CF 888: 'ongoing' activity renders a checkmark (X), data-driven", async () => {
  const runs = extractPdfTextRuns(await buildCf888Pdf({ ...SAMPLE, activity: "ongoing" }));
  // The checkbox mark is drawn as "X"; with activity rendered the form is filled.
  assert.ok(runs.includes("X"), "the activity checkbox should be marked");
});
