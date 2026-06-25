/**
 * MO — "ABAWD Volunteer Agreement" (form revision 08/2024).
 * Agency: Missouri Department of Social Services, Family Support Division (FSD).
 *
 * Structure (per MO.json verification_instrument):
 *  - Section 1: SNAP participant fills name, DCN, phone, DOB, address, signs.
 *  - Section 2: Volunteer Agency fills job title, position description, start
 *    date, projected hours/month, agency name/phone/address, supervisor
 *    name/title, supervisor signature.
 *  - Section 3: Submission instructions (email DSS.FSD.Agreements@dss.mo.gov,
 *    or mail to Family Support Division, 3415 Division Drive, Suite 1,
 *    West Plains, MO 65775).
 *
 * Source: https://dss.mo.gov/employment-training-provider-portal/docs/abawd-volunteer-agreement.pdf
 *
 * Quirk: the form itself carries NO monthly hours attestation — it is a
 * one-time enrollment agreement that binds the recipient + agency. Actual
 * hours are verified separately (scanned/emailed to the same FSD address).
 * Section 2 still asks for "projected hours per month," which we draw and
 * fill from data.hours as the spec requires.
 *
 * Hand-drawn with pdf-lib for the Workers runtime — no fs / no template load.
 */
import { PDFDocument, StandardFonts, rgb, PDFFont } from "pdf-lib";
import type { StateFormData } from "./types";

const PAGE_W = 612;
const PAGE_H = 792;
const LEFT = 56;
const RIGHT = 556;
const INK = rgb(0.04, 0.04, 0.04);
const BAND = rgb(0.85, 0.86, 0.86);
const LINE_GREY = rgb(0.45, 0.45, 0.45);

export async function buildMOPdf(data: StateFormData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle("ABAWD Volunteer Agreement");
  doc.setProducer("Tended");
  const page = doc.addPage([PAGE_W, PAGE_H]);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const reg = await doc.embedFont(StandardFonts.Helvetica);
  const ital = await doc.embedFont(StandardFonts.TimesRomanItalic);

  // top-origin helper
  const T = (top: number) => PAGE_H - top;
  const draw = (
    text: string,
    x: number,
    top: number,
    font: PDFFont,
    size: number,
    color = INK
  ) => page.drawText(text, { x, y: T(top), size, font, color });

  // ---- Header ----
  draw("Missouri Department of Social Services", LEFT, 56, reg, 11);
  const rightHeader = "Family Support Division";
  draw(rightHeader, RIGHT - reg.widthOfTextAtSize(rightHeader, 11), 56, reg, 11);

  // ---- Title ----
  draw("ABAWD VOLUNTEER AGREEMENT", LEFT, 92, bold, 18);

  // double rule
  page.drawLine({ start: { x: LEFT, y: T(108) }, end: { x: RIGHT, y: T(108) }, thickness: 1.2, color: INK });
  page.drawLine({ start: { x: LEFT, y: T(111) }, end: { x: RIGHT, y: T(111) }, thickness: 0.6, color: INK });

  // ---- Intro ----
  const intro = [
    "Able-Bodied Adults Without Dependents (ABAWDs) must meet 80 hours of work, training, or",
    "volunteer activity each calendar month to maintain SNAP eligibility. Volunteering at a qualifying",
    "Volunteer Agency that promotes job readiness and builds work experience is one accepted",
    "pathway. Complete this agreement once at the start of the volunteer arrangement.",
  ];
  let y = 132;
  for (const ln of intro) {
    draw(ln, LEFT, y, reg, 11);
    y += 15;
  }

  // ---- helpers ----
  const band = (label: string, top: number) => {
    page.drawRectangle({ x: LEFT, y: T(top + 14), width: RIGHT - LEFT, height: 18, color: BAND });
    draw(label, LEFT + 6, top + 11, bold, 11.5);
  };
  const labelX = 70;
  const valX = 232;
  const valEnd = RIGHT;
  const field = (label: string, value: string | undefined, top: number) => {
    draw(label, labelX, top, bold, 11);
    page.drawLine({ start: { x: valX, y: T(top + 3) }, end: { x: valEnd, y: T(top + 3) }, thickness: 0.8, color: LINE_GREY });
    if (value) draw(value, valX + 4, top, reg, 11);
  };
  const blankLine = (top: number) => {
    page.drawLine({ start: { x: valX, y: T(top + 3) }, end: { x: valEnd, y: T(top + 3) }, thickness: 0.8, color: LINE_GREY });
  };

  // ---- SECTION 1 — Participant ----
  band("SECTION 1. SNAP PARTICIPANT INFORMATION", 205);
  draw("To be completed by the SNAP participant.", LEFT, 235, reg, 11);

  field("Participant Name", data.participantName, 260);
  field("DCN (Case Number)", data.caseNumber ?? "", 282);
  field("Phone", data.participantPhone ?? "", 304);
  field("Date of Birth", data.birthdate, 326);
  draw("Address", labelX, 348, bold, 11);
  blankLine(348);
  if (data.participantAddress[0]) draw(data.participantAddress[0], valX + 4, 348, reg, 11);
  blankLine(366);
  if (data.participantAddress[1]) draw(data.participantAddress[1], valX + 4, 366, reg, 11);

  // Participant attestation
  const p1 = [
    "I agree to call the Volunteer Agency in advance if I will be absent, and to contact",
    "the Family Support Division if I quit or my volunteer arrangement ends.",
  ];
  let py = 388;
  for (const ln of p1) {
    draw(ln, LEFT, py, reg, 10.5);
    py += 13;
  }

  // Participant signature table
  const sig1Top = 418;
  const sig1Bot = 456;
  const mid1 = 360;
  page.drawRectangle({ x: LEFT, y: T(sig1Bot), width: RIGHT - LEFT, height: sig1Bot - sig1Top, borderColor: INK, borderWidth: 0.8 });
  page.drawLine({ start: { x: mid1, y: T(sig1Top) }, end: { x: mid1, y: T(sig1Bot) }, thickness: 0.8, color: INK });
  page.drawLine({ start: { x: LEFT, y: T(sig1Top + 14) }, end: { x: RIGHT, y: T(sig1Top + 14) }, thickness: 0.8, color: INK });
  draw("Participant Signature", LEFT + 6, sig1Top + 11, reg, 10);
  draw("Date Signed", mid1 + 6, sig1Top + 11, reg, 10);
  // Participant signs Section 1 themselves — leave blank in generated form.

  // ---- SECTION 2 — Volunteer Agency ----
  band("SECTION 2. VOLUNTEER AGENCY INFORMATION", 478);
  draw("To be completed by the Volunteer Agency supervisor.", LEFT, 508, reg, 11);

  field("Job Title", "Volunteer", 532);
  field("Position Description", data.positionDescription ?? "", 554);
  field("Start Date", data.startDate ?? "", 576);
  const projHours = Number.isFinite(data.hours) ? `${data.hours}` : "";
  field("Projected Hours / Month", projHours, 598);
  field("Agency Name", data.orgName, 620);
  field("Agency Phone", data.orgPhone, 642);
  draw("Agency Address", labelX, 664, bold, 11);
  blankLine(664);
  if (data.orgAddress[0]) draw(data.orgAddress[0], valX + 4, 664, reg, 11);
  blankLine(682);
  if (data.orgAddress[1]) draw(data.orgAddress[1], valX + 4, 682, reg, 11);
  field("Supervisor Name", data.representativeName, 704);
  field("Supervisor Title", data.representativeTitle ?? "", 726);

  // Supervisor signature row
  const sig2Top = 748;
  const sig2Bot = 770;
  const mid2 = 360;
  page.drawRectangle({ x: LEFT, y: T(sig2Bot), width: RIGHT - LEFT, height: sig2Bot - sig2Top, borderColor: INK, borderWidth: 0.8 });
  page.drawLine({ start: { x: mid2, y: T(sig2Top) }, end: { x: mid2, y: T(sig2Bot) }, thickness: 0.8, color: INK });
  page.drawLine({ start: { x: LEFT, y: T(sig2Top + 12) }, end: { x: RIGHT, y: T(sig2Top + 12) }, thickness: 0.4, color: INK });
  draw("Supervisor Signature", LEFT + 6, sig2Top + 9, reg, 8.5);
  draw("Date Signed", mid2 + 6, sig2Top + 9, reg, 8.5);
  if (data.signatureName) draw(data.signatureName, LEFT + 6, sig2Top + 20, ital, 9);
  if (data.dateSigned) draw(data.dateSigned, mid2 + 6, sig2Top + 20, reg, 9);

  // ---- Footer (two stacked rows so the form-id and the submit address never
  // collide on the same baseline) ----
  page.drawLine({ start: { x: LEFT, y: T(775) }, end: { x: RIGHT, y: T(775) }, thickness: 0.6, color: INK });
  draw("ABAWD Volunteer Agreement (08/2024) — Missouri DSS / FSD", LEFT, 784, reg, 9);
  const submit = "Submit: DSS.FSD.Agreements@dss.mo.gov · FSD, 3415 Division Dr Ste 1, West Plains, MO 65775";
  draw(submit, LEFT, 794, reg, 8);

  return doc.save();
}
