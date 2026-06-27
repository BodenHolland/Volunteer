/**
 * MO — "ABAWD Volunteer Agreement" (form revision 08/2024).
 * Agency: Missouri Department of Social Services, Family Support Division (FSD).
 *
 * Structure:
 *  - Section 1: SNAP participant fills name, DCN, phone, DOB, address, signs.
 *  - Section 2: Volunteer Agency fills job title, position description, start
 *    date, projected hours/month, agency name/phone/address, supervisor
 *    name/title, supervisor signature.
 *  - Section 3: Submission instructions.
 *
 * Source: https://dss.mo.gov/employment-training-provider-portal/docs/abawd-volunteer-agreement.pdf
 *
 * Quirk: the form carries NO monthly hours attestation — it is a one-time
 * enrollment agreement. Section 2 asks for "projected hours per month," filled
 * from data.hours.
 *
 * Rendered via the shared form engine (Workers-safe).
 */
import { createForm, palette } from "./state-form";
import type { StateFormData } from "./types";

const LEFT = 56;
const RIGHT = 556;

export async function buildMOPdf(data: StateFormData): Promise<Uint8Array> {
  const f = await createForm({ title: "ABAWD Volunteer Agreement" });
  const { ink, lineGrey } = palette;
  const BAND = { left: LEFT, right: RIGHT };
  const fld = (label: string, value: string | undefined, top: number) => f.field(label, value, top, { labelX: 70, valX: 232, end: RIGHT, size: 11 });
  const blankLine = (top: number) => f.line(232, top + 3, RIGHT, 0.8, lineGrey);

  // ---- Header ----
  f.text("Missouri Department of Social Services", LEFT, 56, { size: 11 });
  f.text("Family Support Division", RIGHT, 56, { size: 11, align: "right", maxX: RIGHT });

  // ---- Title ----
  f.text("ABAWD VOLUNTEER AGREEMENT", LEFT, 92, { font: f.bold, size: 18 });
  f.line(LEFT, 108, RIGHT, 1.2, ink);
  f.line(LEFT, 111, RIGHT, 0.6, ink);

  const intro = [
    "Able-Bodied Adults Without Dependents (ABAWDs) must meet 80 hours of work, training, or",
    "volunteer activity each calendar month to maintain SNAP eligibility. Volunteering at a qualifying",
    "Volunteer Agency that promotes job readiness and builds work experience is one accepted",
    "pathway. Complete this agreement once at the start of the volunteer arrangement.",
  ];
  let y = 132;
  for (const ln of intro) { f.text(ln, LEFT, y, { size: 11 }); y += 15; }

  // ---- SECTION 1 ----
  f.band("SECTION 1. SNAP PARTICIPANT INFORMATION", 205, BAND);
  f.text("To be completed by the SNAP participant.", LEFT, 235, { size: 11 });
  fld("Participant Name", data.participantName, 260);
  fld("DCN (Case Number)", data.caseNumber ?? "", 282);
  fld("Phone", data.participantPhone ?? "", 304);
  fld("Date of Birth", data.birthdate, 326);
  f.text("Address", 70, 348, { font: f.bold, size: 11 }); blankLine(348);
  if (data.participantAddress[0]) f.text(data.participantAddress[0], 236, 348, { size: 11 });
  blankLine(366);
  if (data.participantAddress[1]) f.text(data.participantAddress[1], 236, 366, { size: 11 });

  const p1 = [
    "I agree to call the Volunteer Agency in advance if I will be absent, and to contact",
    "the Family Support Division if I quit or my volunteer arrangement ends.",
  ];
  let py = 388;
  for (const ln of p1) { f.text(ln, LEFT, py, { size: 10.5 }); py += 13; }

  // Participant signature row (blank — participant signs).
  f.signatureBlock({
    top: 418, left: LEFT, right: RIGHT, height: 38, splits: [360],
    cells: [{ label: "Participant Signature" }, { label: "Date Signed" }],
  });

  // ---- SECTION 2 ----
  f.band("SECTION 2. VOLUNTEER AGENCY INFORMATION", 478, BAND);
  f.text("To be completed by the Volunteer Agency supervisor.", LEFT, 508, { size: 11 });
  fld("Job Title", "Volunteer", 532);
  fld("Position Description", data.positionDescription ?? "", 554);
  fld("Start Date", data.startDate ?? "", 576);
  fld("Projected Hours / Month", Number.isFinite(data.hours) ? `${data.hours}` : "", 598);
  fld("Agency Name", data.orgName, 620);
  fld("Agency Phone", data.orgPhone, 642);
  f.text("Agency Address", 70, 664, { font: f.bold, size: 11 }); blankLine(664);
  if (data.orgAddress[0]) f.text(data.orgAddress[0], 236, 664, { size: 11 });
  blankLine(682);
  if (data.orgAddress[1]) f.text(data.orgAddress[1], 236, 682, { size: 11 });
  fld("Supervisor Name", data.representativeName, 704);
  fld("Supervisor Title", data.representativeTitle ?? "", 726);

  // Supervisor signature row (filled).
  f.signatureBlock({
    top: 748, left: LEFT, right: RIGHT, height: 22, splits: [360],
    cells: [
      { label: "Supervisor Signature", value: data.signatureName || undefined, italicValue: true },
      { label: "Date Signed", value: data.dateSigned || undefined },
    ],
  });

  f.footer({
    left: "ABAWD Volunteer Agreement (08/2024) — Missouri DSS / FSD",
    right: "Submit: DSS.FSD.Agreements@dss.mo.gov · FSD, 3415 Division Dr Ste 1, West Plains, MO 65775",
    size: 8, rule: true,
  });
  return f.save();
}
