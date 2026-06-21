import { test } from "node:test";
import assert from "node:assert";
import { buildCf888Pdf, type Cf888Data } from "@/lib/cf888";

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
