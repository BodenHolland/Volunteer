/**
 * Colorado — "Volunteer Verification Form" (a.k.a. "ABAWD Volunteer
 * Verification Form" per CDHS).
 *
 * Agency: Colorado Department of Human Services (CDHS), Food and Energy
 * Assistance Division. SNAP is county-administered via the CBMS statewide
 * system, but this form is state-issued and uniform across counties.
 *
 * Submission paths (recipient's choice):
 *   - Colorado PEAK portal upload (https://peak.my.gov.co/)
 *   - MyCOBenefits mobile app upload
 *   - In-person or by mail to the recipient's county human-services office
 *
 * Cadence quirk: Unlike CF 888 (monthly), this form is submitted ONCE per
 * SNAP certification period — typically at recertification. The compliance
 * question is a Yes/No checkbox: "Is the individual volunteering an average
 * of 20 hours/week or 80 hours/month?"
 *
 * Source: https://cdhs.colorado.gov/snap/abawd
 * Rule:   10 CCR 2506-1-4.311
 *
 * Drawn from scratch with pdf-lib for Workers-runtime compatibility (no fs).
 */
import { PDFDocument, StandardFonts, rgb, PDFFont } from "pdf-lib";
import type { StateFormData } from "./types";

const PAGE_W = 612;
const PAGE_H = 792;
const LEFT = 56;
const RIGHT = 556;
const INK = rgb(0.04, 0.04, 0.04);
const LINK_BLUE = rgb(0.05, 0.32, 0.66);
const BAND = rgb(0.85, 0.86, 0.86);
const LINE_GREY = rgb(0.45, 0.45, 0.45);
// Colorado state colors (subtle accent for header)
const CO_BLUE = rgb(0.0, 0.27, 0.55);

export async function buildCOPdf(data: StateFormData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle("Colorado Volunteer Verification Form (ABAWD)");
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
  draw("Colorado Department of Human Services", LEFT, 60, bold, 12, CO_BLUE);
  const rightHeader = "Food and Energy Assistance Division";
  draw(
    rightHeader,
    RIGHT - reg.widthOfTextAtSize(rightHeader, 11),
    60,
    reg,
    11
  );

  // ---- Title ----
  draw("VOLUNTEER VERIFICATION FORM", LEFT, 92, bold, 18);
  draw("SNAP / ABAWD Work Requirement", LEFT, 114, reg, 12);

  // double rule
  page.drawLine({ start: { x: LEFT, y: T(126) }, end: { x: RIGHT, y: T(126) }, thickness: 1.2, color: INK });
  page.drawLine({ start: { x: LEFT, y: T(129) }, end: { x: RIGHT, y: T(129) }, thickness: 0.6, color: INK });

  // ---- Intro paragraph ----
  const intro = [
    "SNAP recipients subject to the ABAWD work requirement may satisfy the requirement by volunteering",
    "an average of 20 hours per week or 80 hours per month. This form is completed by the organization or",
    "individual the recipient volunteers for and is submitted ONE time during the SNAP certification period.",
    "Submit by uploading to Colorado PEAK (peak.my.gov.co), the MyCOBenefits mobile app, or by returning",
    "this form to your county human-services office in person or by mail.",
  ];
  let y = 152;
  for (const ln of intro) {
    draw(ln, LEFT, y, reg, 11);
    y += 15;
  }
  // tint the PEAK URL inline on its line (index 3)
  const urlLinePrefix = "Submit by uploading to Colorado PEAK (";
  const urlX = LEFT + reg.widthOfTextAtSize(urlLinePrefix, 11);
  draw("peak.my.gov.co", urlX, 152 + 15 * 3, reg, 11, LINK_BLUE);

  // ---- helper: section band ----
  const band = (label: string, top: number) => {
    page.drawRectangle({ x: LEFT, y: T(top + 14), width: RIGHT - LEFT, height: 18, color: BAND });
    draw(label, LEFT + 6, top + 11, bold, 11.5);
  };
  // ---- helper: labeled field with value on an underline ----
  const labelX = 70;
  const valX = 262;
  const valEnd = RIGHT;
  const field = (label: string, value: string, top: number) => {
    draw(label, labelX, top, bold, 11);
    page.drawLine({ start: { x: valX, y: T(top + 3) }, end: { x: valEnd, y: T(top + 3) }, thickness: 0.8, color: LINE_GREY });
    if (value) draw(value, valX + 4, top, reg, 11);
  };
  const blankLine = (top: number) => {
    page.drawLine({ start: { x: valX, y: T(top + 3) }, end: { x: valEnd, y: T(top + 3) }, thickness: 0.8, color: LINE_GREY });
  };

  // ---- SECTION 1: Volunteer (recipient) ----
  band("SECTION 1. VOLUNTEER INFORMATION", 240);
  draw(
    "To be completed using the SNAP recipient's information. The CBMS case number appears on county",
    LEFT,
    270,
    reg,
    11
  );
  draw("correspondence and in the PEAK account.", LEFT, 285, reg, 11);

  field("Volunteer Name", data.participantName, 312);
  field("CBMS Case Number", data.caseNumber || "", 338);
  field("Date of Birth", data.birthdate, 364);
  field("Volunteer Start Date", data.startDate || "", 390);
  draw("Address", labelX, 416, bold, 11);
  blankLine(416);
  if (data.participantAddress[0]) draw(data.participantAddress[0], valX + 4, 416, reg, 11);
  blankLine(434);
  if (data.participantAddress[1]) draw(data.participantAddress[1], valX + 4, 434, reg, 11);

  // ---- SECTION 2: Organization / supervisor ----
  band("SECTION 2. ORGANIZATION OR SUPERVISOR INFORMATION", 458);
  draw(
    "To be completed by the organization or individual the recipient volunteers for. Per 10 CCR 2506-1-",
    LEFT,
    488,
    reg,
    11
  );
  draw(
    "4.311, unpaid work may be verified by any provider of the unpaid work.",
    LEFT,
    503,
    reg,
    11
  );

  field("Organization or Agency Name", data.orgName, 530);
  draw("(if applicable)", labelX + 12, 545, ital, 9);
  field("Supervisor / Individual Name", data.representativeName, 562);
  draw("Address", labelX, 588, bold, 11);
  blankLine(588);
  if (data.orgAddress[0]) draw(data.orgAddress[0], valX + 4, 588, reg, 11);
  blankLine(606);
  if (data.orgAddress[1]) draw(data.orgAddress[1], valX + 4, 606, reg, 11);
  field("Phone", data.orgPhone, 632);
  field("Email", data.orgEmail || "", 658);

  // ---- SECTION 3: Compliance + nature of work ----
  band("SECTION 3. VOLUNTEER ACTIVITY", 682);

  // Compliance Yes/No
  const compTop = 712;
  draw(
    "Is the individual volunteering an average of 20 hours/week or 80 hours/month?",
    LEFT,
    compTop,
    reg,
    11
  );
  const yesChecked = data.hours >= 80;
  const yesX = LEFT + reg.widthOfTextAtSize(
    "Is the individual volunteering an average of 20 hours/week or 80 hours/month?  ",
    11
  );
  // Yes box
  page.drawRectangle({ x: yesX, y: T(compTop + 10), width: 11, height: 11, borderColor: INK, borderWidth: 1 });
  if (yesChecked) draw("X", yesX + 2.5, compTop - 0.5, bold, 11);
  draw("Yes", yesX + 16, compTop, reg, 11);
  // No box
  const noX = yesX + 46;
  page.drawRectangle({ x: noX, y: T(compTop + 10), width: 11, height: 11, borderColor: INK, borderWidth: 1 });
  if (!yesChecked) draw("X", noX + 2.5, compTop - 0.5, bold, 11);
  draw("No", noX + 16, compTop, reg, 11);

  // Nature of work — left label + multi-line underline area
  const natTop = 734;
  draw("Nature of Work / Position Description:", LEFT, natTop, bold, 11);
  const natLines = [752, 770];
  for (const nt of natLines) {
    page.drawLine({
      start: { x: LEFT, y: T(nt + 3) },
      end: { x: RIGHT, y: T(nt + 3) },
      thickness: 0.8,
      color: LINE_GREY,
    });
  }
  // Wrap position description into the two lines (rough word-wrap)
  const desc = data.positionDescription || "";
  if (desc) {
    const maxWidth = RIGHT - LEFT - 4;
    const words = desc.split(/\s+/);
    let line1 = "";
    let line2 = "";
    let target: 1 | 2 = 1;
    for (const w of words) {
      if (target === 1) {
        const trial = line1 ? line1 + " " + w : w;
        if (reg.widthOfTextAtSize(trial, 11) <= maxWidth) line1 = trial;
        else { target = 2; line2 = w; }
      } else {
        const trial = line2 ? line2 + " " + w : w;
        if (reg.widthOfTextAtSize(trial, 11) <= maxWidth) line2 = trial;
        // overflow truncated — single-page form
      }
    }
    if (line1) draw(line1, LEFT + 2, natLines[0], reg, 11);
    if (line2) draw(line2, LEFT + 2, natLines[1], reg, 11);
  }

  // ---- Footer signature line ----
  // Compact signature row at very bottom (single page).
  const sigTop = 788;
  // Signature on left
  page.drawLine({
    start: { x: LEFT, y: T(sigTop) },
    end: { x: LEFT + 240, y: T(sigTop) },
    thickness: 0.8,
    color: INK,
  });
  draw("Signature", LEFT, sigTop + 4, reg, 9);
  if (data.signatureName) draw(data.signatureName, LEFT + 6, sigTop - 4, ital, 13);
  // Date on right
  page.drawLine({
    start: { x: LEFT + 260, y: T(sigTop) },
    end: { x: RIGHT, y: T(sigTop) },
    thickness: 0.8,
    color: INK,
  });
  draw("Date", LEFT + 260, sigTop + 4, reg, 9);
  if (data.dateSigned) draw(data.dateSigned, LEFT + 266, sigTop - 4, reg, 11);

  return doc.save();
}
