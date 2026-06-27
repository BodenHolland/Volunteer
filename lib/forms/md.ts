/**
 * FIA/500b — "Verification of Activity Participation" (Maryland DHS)
 *
 * Form number: FIA/500b · Revision 07/2017
 * Agency: Maryland Department of Human Services, Family Investment
 *   Administration (FIA). Verifies ABAWD work-activity participation including
 *   "Volunteering at a non-profit organization" (MD SNAP Manual §106.6.D).
 *
 * Two numbered activity blocks (Activity Type checkboxes · Org · Address ·
 * Supervisor · Hours per week · attestation · sig) plus a bottom Participant
 * block. Activity #1 is populated from data; Activity #2 is drawn blank for a
 * second supervisor. Portal: https://mymdthink.maryland.gov
 *
 * Rendered via the shared form engine (Workers-safe).
 */
import { createForm, palette } from "./state-form";
import type { StateFormData } from "./types";

const LEFT = 48;
const RIGHT = 564;

export async function buildMDPdf(data: StateFormData): Promise<Uint8Array> {
  const f = await createForm({ title: "FIA/500b — Verification of Activity Participation" });
  const { ink, lineGrey } = palette;

  const labeled = (label: string, value: string | undefined, top: number, labelX: number, valX: number, valEnd: number, size = 10) =>
    f.field(label, value, top, { labelX, valX, end: valEnd, size });

  // ---- Header ----
  f.text("FAMILY INVESTMENT ADMINISTRATION", LEFT, 56, { font: f.bold, size: 12, align: "center", maxX: RIGHT });
  f.line(LEFT, 64, RIGHT, 0.8, ink);
  f.text("VERIFICATION OF ACTIVITY PARTICIPATION", LEFT, 82, { font: f.bold, size: 15, align: "center", maxX: RIGHT });

  const intro = [
    "To verify participation in an activity, this form must be completed and signed by BOTH the Participant",
    "and the Supervisor and can be used for combined activity reporting.",
  ];
  let y = 104;
  for (const ln of intro) { f.text(ln, LEFT, y, { size: 10 }); y += 13; }
  f.checkbox("I take part in the activity or activities listed below.", LEFT, 134, true, { boxSize: 9, size: 9.5 });

  f.text("Return to:  Attn:", LEFT, 156, { font: f.bold, size: 10 });
  f.line(LEFT + 86, 159, RIGHT, 0.7, lineGrey);

  const drawActivity = (n: 1 | 2, blockTop: number, filled: boolean): number => {
    f.text(`${n}.`, LEFT, blockTop, { font: f.bold, size: 11 });
    f.line(LEFT + 14, blockTop + 3, RIGHT, 0.6, lineGrey);

    const cbTop = blockTop + 18;
    f.text("Activity Type:", LEFT + 6, cbTop, { font: f.bold, size: 9.5 });
    let cbx = LEFT + 90;
    const types: { label: string; key: string; gap: number }[] = [
      { label: "Volunteer", key: "Volunteer", gap: 92 },
      { label: "Education", key: "Education", gap: 92 },
      { label: "Job Readiness", key: "Job Readiness", gap: 110 },
      { label: "Work", key: "Work", gap: 90 },
    ];
    for (const t of types) {
      f.checkbox(t.label, cbx, cbTop, filled && t.key === "Volunteer", { boxSize: 9, size: 9.5 });
      cbx += t.gap;
    }

    const labelX = LEFT + 6, valX = LEFT + 132, valEnd = RIGHT - 6;
    labeled("Name of organization", filled ? data.orgName : "", cbTop + 22, labelX, valX, valEnd);
    labeled("Street Address", filled ? data.orgAddress[0] ?? "" : "", cbTop + 40, labelX, valX, valEnd);
    labeled("City / State / Zip", filled ? data.orgAddress[1] ?? "" : "", cbTop + 58, labelX, valX, valEnd);
    labeled("Supervisor's name", filled ? data.representativeName : "", cbTop + 76, labelX, valX, valEnd);
    labeled("Supervisor's phone", filled ? data.orgPhone : "", cbTop + 94, labelX, valX, valEnd);

    const hoursTop = cbTop + 114;
    f.text("What are the individual's participation hours per week?", labelX, hoursTop, { font: f.bold, size: 9.5 });
    f.text("(example: 8:00 a.m. to 1:00 p.m. / 3 days per week)", labelX, hoursTop + 12, { font: f.italic, size: 9 });
    f.line(labelX, hoursTop + 30, RIGHT - 6, 0.7, lineGrey);
    if (filled) {
      const wk = Math.round((data.hours / 4) * 10) / 10;
      f.text(`Approx. ${wk} hours / week across the month of ${data.month}`, labelX + 2, hoursTop + 28, { size: 10 });
    }

    const attTop = hoursTop + 46;
    const attest = [
      "My signature verifies that the information I have provided is true and correct and that the individual",
      "named below currently participates for the reported number of hours / days per week.",
    ];
    for (let i = 0; i < attest.length; i++) f.text(attest[i], labelX, attTop + i * 12, { size: 9 });

    const sigTop = attTop + 30;
    const midX = (LEFT + RIGHT) / 2 + 60;
    f.signatureBlock({
      top: sigTop, left: LEFT, right: RIGHT, height: 28, splits: [midX],
      cells: [
        { label: "Supervisor's Signature", value: filled && data.signatureName ? data.signatureName : undefined, italicValue: true },
        { label: "Date", value: filled && data.dateSigned ? data.dateSigned : undefined },
      ],
    });
    return sigTop + 28;
  };

  const block1Bottom = drawActivity(1, 178, true);
  const block2Bottom = drawActivity(2, block1Bottom + 14, false);

  // ---- Participant footer block ----
  const partTop = block2Bottom + 16;
  f.band("PARTICIPANT INFORMATION", partTop, { left: LEFT, right: RIGHT, size: 10 });
  const partLabelX = LEFT + 6, partValX = LEFT + 80;
  const partValEnd = (LEFT + RIGHT) / 2 - 8;
  const partValX2 = (LEFT + RIGHT) / 2 + 64, partValEnd2 = RIGHT - 6;
  labeled("Name", data.participantName, partTop + 34, partLabelX, partValX, partValEnd2, 10);
  labeled("D.O.B.", data.birthdate, partTop + 56, partLabelX, partValX, partValEnd, 10);
  f.text("Last 4 SSN", partValEnd + 24, partTop + 56, { font: f.bold, size: 10 });
  f.line(partValX2, partTop + 59, partValEnd2, 0.7, lineGrey);

  const psigTop = partTop + 76;
  const sigMidX = (LEFT + RIGHT) / 2 + 60;
  f.signatureBlock({
    top: psigTop, left: LEFT, right: RIGHT, height: 28, splits: [sigMidX],
    cells: [{ label: "Participant's Signature" }, { label: "Date" }],
  });

  f.footer({
    left: "FIA/500b   Revised 07/2017",
    right: "Return completed form to your LDSS (mail · fax · in-person) or upload via mymdthink.maryland.gov",
    size: 8, rule: true,
  });
  return f.save();
}
