import assert from "node:assert";
import test from "node:test";
import { getStateFormSpec, buildStateForm } from "@/lib/forms";
import type { StateFormData } from "@/lib/forms/types";
import { extractPdfText, extractPdfTextRuns } from "./pdf-text";

test("official forms and Tended certificates have explicit, safe kinds", () => {
  assert.equal(getStateFormSpec("CA").kind, "official");
  assert.equal(getStateFormSpec("NM").kind, "official");
  assert.equal(getStateFormSpec("TX").kind, "certificate");
  assert.equal(getStateFormSpec("TX").formId, "Volunteer Hours Verification Certificate");
});

/**
 * LEGAL FORM CONTENT — like the CF 888, the state forms attest to a specific
 * person's hours. The audit found they were only checked to "be a PDF". These
 * tests decode the rendered text and assert the participant's NAME, HOURS, and
 * CASE NUMBER actually land in the produced document.
 */

const DATA: StateFormData = {
  participantName: "Marisol Reyes",
  birthdate: "03/04/1990",
  participantAddress: ["123 Elm St", "Sacramento, CA 95814", ""],
  participantPhone: "(916) 555-0199",
  caseNumber: "CN-7788991",
  orgName: "Canopy Commons",
  representativeName: "Daniel Okafor",
  representativeTitle: "Coordinator",
  orgAddress: ["1265 Capitol Ave", "Sacramento, CA 95816", ""],
  orgPhone: "(916) 555-0100",
  orgEmail: "rep@canopy.org",
  month: "June 2026",
  monthIso: "2026-06",
  hours: 17,
  activity: "ongoing",
  positionDescription: "Tree census volunteer",
  startDate: "06/01/2026",
  signatureName: "Daniel Okafor",
  dateSigned: "06/19/2026",
};

// Two distinct named state forms, both of which render name + hours + case # as
// discrete text runs (verified empirically against the shared rendering engine).
for (const state of ["MA", "GA"] as const) {
  test(`${state} form: participant name, hours, and case number render into the PDF`, async () => {
    const { pdf, spec } = await buildStateForm(state, DATA);
    assert.equal(spec.state, state);
    const text = extractPdfText(pdf);
    const runs = extractPdfTextRuns(pdf);

    assert.ok(text.includes("Marisol Reyes"), `${state}: participant name must render`);
    assert.ok(text.includes("Canopy Commons"), `${state}: org name must render`);
    assert.ok(text.includes("Daniel Okafor"), `${state}: representative name must render`);
    assert.ok(
      runs.some((r) => r === "CN-7788991"),
      `${state}: case number must render as its own text run`
    );
    assert.ok(
      runs.some((r) => r === "17"),
      `${state}: hours value must render as its own text run`
    );
  });

  test(`${state} form: hours value is data-driven (not hard-coded)`, async () => {
    const { pdf } = await buildStateForm(state, { ...DATA, hours: 42 });
    const runs = extractPdfTextRuns(pdf);
    assert.ok(runs.some((r) => r === "42"), `${state}: the actual hours value must render`);
    assert.ok(!runs.some((r) => r === "17"), `${state}: the previous hours value must not leak`);
  });
}

test("generic certificate (no named form): participant name and hours render", async () => {
  // TX has no named form → falls back to the Tended verification certificate,
  // which renders hours inline ("…17 hours…") rather than as a discrete field.
  const { pdf, spec } = await buildStateForm("TX", DATA);
  assert.equal(spec.kind, "certificate");
  const text = extractPdfText(pdf);
  assert.ok(text.includes("Marisol Reyes"), "certificate must render the participant name");
  assert.ok(/\b17\b/.test(text), "certificate must render the hours value");
  assert.ok(text.includes("Canopy Commons"), "certificate must render the org name");
});

test("generic certificate: hours value is data-driven (not hard-coded)", async () => {
  const { pdf } = await buildStateForm("TX", { ...DATA, hours: 42 });
  const text = extractPdfText(pdf);
  assert.ok(/\b42\b/.test(text), "the actual hours value must render");
});
