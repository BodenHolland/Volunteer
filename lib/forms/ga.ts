/**
 * Georgia Form 805 — "ABAWD Volunteer Work Verification Form" (also known as
 * the "Comparable Workfare Activity Form"; English + Spanish editions exist).
 *
 * Agency: Georgia Department of Human Services (DHS) / Division of Family &
 * Children Services (DFCS). Footer reads "Form 805 (01/19) ABAWD Comparable
 * Workfare." Two parts:
 *   PART I — completed by the SNAP case manager: assigns required monthly
 *            work-activity hours (allotment / $7.25 minimum wage formula),
 *            client name/ID/case number. We leave the values blank — the
 *            recipient generates the form before their case manager fills it.
 *   PART II — completed by the volunteer organization/provider after the
 *            volunteer hours are done, attesting satisfactory participation
 *            and N hours in month/year. We populate this from StateFormData.
 *
 * Source: https://dfcs.georgia.gov/document/document/comparable-workfare-activity-form-805-0/download
 * Policy: PAMMS 3355 (https://pamms.dhs.ga.gov/dfcs/snap/3355/).
 * Submission: ABAWD returns the completed Form 805 to their SNAP eligibility
 * specialist / case manager at the county DFCS office. No county-level form
 * variation (Georgia SNAP is state-administered; Form 805 is statewide).
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

export async function buildGAPdf(data: StateFormData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle("Form 805 — ABAWD Volunteer Work Verification Form");
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

  // ---- Header row ----
  draw("Georgia Department of Human Services", LEFT, 60, reg, 11);
  const rightHeader = "Division of Family & Children Services";
  draw(rightHeader, RIGHT - reg.widthOfTextAtSize(rightHeader, 11), 60, reg, 11);
  // County slot — official form has "______ County Department of Family and
  // Children Services" on the second header line. We leave it blank for the
  // case manager / org rep to write in by hand.
  draw("___________________ County Department of Family and Children Services", LEFT, 74, reg, 10);

  // ---- Title ----
  draw("STATE OF GEORGIA", LEFT, 92, bold, 14);
  draw("ABAWD VOLUNTEER WORK VERIFICATION FORM", LEFT, 112, bold, 15);
  draw("(Comparable Workfare Activity Form)", LEFT, 130, ital, 11);

  // double rule
  page.drawLine({ start: { x: LEFT, y: T(142) }, end: { x: RIGHT, y: T(142) }, thickness: 1.2, color: INK });
  page.drawLine({ start: { x: LEFT, y: T(145) }, end: { x: RIGHT, y: T(145) }, thickness: 0.6, color: INK });

  // ---- Intro paragraph ----
  const intro = [
    "Georgia SNAP rules require Able-Bodied Adults Without Dependents (ABAWDs) to meet a monthly work",
    "requirement. Comparable Workfare — unpaid volunteer hours at a community-service site serving a useful",
    "public purpose — satisfies this requirement. PART I is completed by the SNAP case manager to assign the",
    "required monthly hours. PART II is completed by the volunteer organization after the hours are performed.",
    "Return the completed form to your SNAP eligibility specialist at your county DFCS office.",
  ];
  let y = 162;
  for (const ln of intro) {
    draw(ln, LEFT, y, reg, 10.5);
    y += 14;
  }

  // ---- helpers ----
  const band = (label: string, top: number) => {
    page.drawRectangle({ x: LEFT, y: T(top + 14), width: RIGHT - LEFT, height: 18, color: BAND });
    draw(label, LEFT + 6, top + 11, bold, 11.5);
  };
  const labelX = 70;
  const valX = 262;
  const valEnd = RIGHT;
  const field = (label: string, value: string, top: number) => {
    draw(label, labelX, top, bold, 10.5);
    page.drawLine({ start: { x: valX, y: T(top + 3) }, end: { x: valEnd, y: T(top + 3) }, thickness: 0.8, color: LINE_GREY });
    if (value) draw(value, valX + 4, top, reg, 11);
  };

  // ---- PART I (case manager) — left blank ----
  band("PART I — TO BE COMPLETED BY THE SNAP CASE MANAGER", 240);
  draw("Assigns the required monthly work-activity hours (allotment / federal minimum wage).", LEFT, 270, reg, 10);

  field("Case Manager Name", "", 294);
  field("Case Manager Phone", "", 316);
  field("Case Manager Fax", "", 338);
  field("Work Activity Type", "Comparable Workfare", 360);
  field("Required Hours Per Month", "", 382);
  field("Participation Month", "", 404);
  field("Client Name", data.participantName || "", 426);
  field("Client ID Number", "", 448);
  field("Case Number", data.caseNumber || "", 470);

  // ---- PART II (organization) — populated from data ----
  band("PART II — TO BE COMPLETED BY THE LOCAL ORGANIZATION", 496);
  draw("To be completed by organization staff AFTER the volunteer work-activity hours have been performed.", LEFT, 526, reg, 10);

  field("Organization Name", data.orgName || "", 550);
  // address — single line collapse for compactness
  const orgAddrLine = (data.orgAddress || []).filter(Boolean).join(", ");
  field("Organization Address", orgAddrLine, 572);
  field("Organization Phone #", data.orgPhone || "", 594);
  field("Volunteer Supervisor Name", data.representativeName || "", 616);

  // ---- Attestation sentence ----
  const attTop = 646;
  let cx = LEFT;
  const seg = (t: string, font: PDFFont, top = attTop) => {
    draw(t, cx, top, font, 10.5);
    cx += font.widthOfTextAtSize(t, 10.5);
  };
  seg("The person named above is participating in a satisfactory manner: ", reg);
  // Yes/No checkboxes
  page.drawRectangle({ x: cx, y: T(attTop + 9), width: 10, height: 10, borderColor: INK, borderWidth: 1 });
  draw("X", cx + 1.8, attTop - 0.5, bold, 10.5);
  cx += 14;
  seg("Yes   ", reg);
  page.drawRectangle({ x: cx, y: T(attTop + 9), width: 10, height: 10, borderColor: INK, borderWidth: 1 });
  cx += 14;
  seg("No", reg);

  // line 2 — "completed ___ hours in the month of __/__ (month/year)"
  cx = LEFT;
  const att2 = attTop + 20;
  const seg2 = (t: string, font: PDFFont) => {
    draw(t, cx, att2, font, 10.5);
    cx += font.widthOfTextAtSize(t, 10.5);
  };
  seg2("and completed ", reg);
  const hoursText = Number.isFinite(data.hours) ? `${data.hours}` : "______";
  const hoursW = bold.widthOfTextAtSize(hoursText, 10.5);
  seg2(hoursText, bold);
  page.drawLine({
    start: { x: cx - hoursW, y: T(att2 + 2) },
    end: { x: cx, y: T(att2 + 2) },
    thickness: 0.7,
    color: LINE_GREY,
  });
  seg2(" hours in the month of ", reg);
  const monthText = data.month || "______________";
  const monthW = bold.widthOfTextAtSize(monthText, 10.5);
  seg2(monthText, bold);
  page.drawLine({
    start: { x: cx - monthW, y: T(att2 + 2) },
    end: { x: cx, y: T(att2 + 2) },
    thickness: 0.7,
    color: LINE_GREY,
  });
  seg2(" (month/year).", reg);

  // Printed supervisor name
  field("Printed Name of Volunteer Supervisor", data.representativeName || "", att2 + 30);

  // ---- Signature table ----
  const tableTop = att2 + 56;
  const tableBottom = tableTop + 38;
  const midX = 380;
  page.drawRectangle({ x: LEFT, y: T(tableBottom), width: RIGHT - LEFT, height: tableBottom - tableTop, borderColor: INK, borderWidth: 0.8 });
  page.drawLine({ start: { x: midX, y: T(tableTop) }, end: { x: midX, y: T(tableBottom) }, thickness: 0.8, color: INK });
  page.drawLine({ start: { x: LEFT, y: T(tableTop + 14) }, end: { x: RIGHT, y: T(tableTop + 14) }, thickness: 0.8, color: INK });
  draw("Signature of Volunteer Supervisor", LEFT + 6, tableTop + 11, reg, 10);
  draw("Date Signed", midX + 6, tableTop + 11, reg, 10);
  if (data.signatureName) draw(data.signatureName, LEFT + 12, tableTop + 30, ital, 15);
  if (data.dateSigned) draw(data.dateSigned, midX + 10, tableTop + 30, reg, 11);

  // ---- Footer (two stacked rows — form id above, return-to instruction below
  //   — so they never collide on the same baseline) ----
  page.drawLine({ start: { x: LEFT, y: T(772) }, end: { x: RIGHT, y: T(772) }, thickness: 0.6, color: INK });
  draw("Form 805 (01/19) — ABAWD Comparable Workfare", LEFT, 783, reg, 10);
  const submitNote = "Return to your SNAP case manager at your county DFCS office.";
  draw(submitNote, LEFT, 795, reg, 9);

  return doc.save();
}
