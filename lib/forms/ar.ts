/**
 * Arkansas DCO-261 Volunteer Agreement (also written "DCO-0261" in the current
 * SNAP Manual Section 3000 markup).
 *
 * Agency: Arkansas Department of Human Services, Division of County Operations
 * (AR DHS / DCO). Completed by the supervising entity (church, local
 * government agency, or other nonprofit) and submitted to / verified by the
 * local DHS county eligibility worker.
 *
 * Dual-purpose: the same form serves BOTH the general 80-hour volunteer lane
 * (Sections 3500 / 3540.3) and the Comparable Workfare reduced-formula track
 * (Section 3730 / 3751.2).
 *
 * Source: https://humanservices.arkansas.gov/wp-content/uploads/Complete_SNAP_Manual.pdf
 * Program page: https://humanservices.arkansas.gov/divisions-shared-services/county-operations/supplemental-nutrition-assistance-snap/snap-time-limit-rules/
 *
 * The fillable DCO-261 PDF is not publicly posted; we hand-draw with pdf-lib
 * to match the manual's described field set. Works in the Workers runtime
 * (no fs, no template load).
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

export async function buildARPdf(data: StateFormData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle("DCO-261 — Arkansas Volunteer Agreement");
  doc.setProducer("colift");
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
  draw("Arkansas Department of Human Services", LEFT, 60, reg, 11);
  const rightHeader = "Division of County Operations";
  draw(rightHeader, RIGHT - reg.widthOfTextAtSize(rightHeader, 11), 60, reg, 11);

  // ---- Title ----
  draw("DCO-261 VOLUNTEER AGREEMENT", LEFT, 92, bold, 16);
  draw("SNAP Required-to-Work Volunteer Hours Verification", LEFT, 112, bold, 12);

  // double rule
  page.drawLine({ start: { x: LEFT, y: T(124) }, end: { x: RIGHT, y: T(124) }, thickness: 1.2, color: INK });
  page.drawLine({ start: { x: LEFT, y: T(127) }, end: { x: RIGHT, y: T(127) }, thickness: 0.6, color: INK });

  // ---- Intro paragraph ----
  const intro = [
    "Arkansas SNAP rules require Able-Bodied Adults Without Dependents (ABAWDs) to meet the",
    "Required-to-Work (RTW) obligation. Unpaid and volunteer work qualifies under SNAP Manual",
    "Section 3500 / 3540.3 (general 80-hour lane) and Section 3730 (Comparable Workfare). This",
    "form is completed by the supervising entity (church, local government agency, or other",
    "non-profit) and returned to the household's local DHS county office for verification.",
  ];
  let y = 150;
  for (const ln of intro) {
    draw(ln, LEFT, y, reg, 11);
    y += 15;
  }

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

  // ---- SECTION 1 — Recipient ----
  band("SECTION 1. SNAP RECIPIENT INFORMATION", 240);
  draw("To be completed for the household member volunteering toward the RTW obligation.", LEFT, 270, reg, 11);

  field("Recipient Name", data.participantName, 300);
  field("Date of Birth", data.birthdate, 326);
  field("SNAP Case Number", data.caseNumber || "", 352);
  draw("Address", labelX, 378, bold, 11);
  blankLine(378);
  if (data.participantAddress[0]) draw(data.participantAddress[0], valX + 4, 378, reg, 11);
  blankLine(396);
  if (data.participantAddress[1]) draw(data.participantAddress[1], valX + 4, 396, reg, 11);
  field("Telephone Number", data.participantPhone || "", 422);

  // ---- SECTION 2 — Supervising entity ----
  band("SECTION 2. SUPERVISING ENTITY INFORMATION", 446);
  draw("To be completed by the supervising church, local government agency, or non-profit.", LEFT, 476, reg, 11);

  field("Organization Name", data.orgName, 506);
  field("Supervisor Name", data.representativeName, 532);
  field("Supervisor Title", data.representativeTitle || "", 558);
  draw("Address", labelX, 584, bold, 11);
  blankLine(584);
  if (data.orgAddress[0]) draw(data.orgAddress[0], valX + 4, 584, reg, 11);
  blankLine(602);
  if (data.orgAddress[1]) draw(data.orgAddress[1], valX + 4, 602, reg, 11);
  field("Telephone Number", data.orgPhone, 628);
  field("Email", data.orgEmail || "", 654);

  // ---- SECTION 3 — Volunteer activity / certification ----
  band("SECTION 3. VOLUNTEER ACTIVITY AND HOURS", 678);

  // Certification line 1
  const certTop = 708;
  let cx = LEFT;
  const seg = (t: string, font: PDFFont, top: number) => {
    draw(t, cx, top, font, 11);
    cx += font.widthOfTextAtSize(t, 11);
  };
  seg("For the month of ", reg, certTop);
  const monthText = data.month || "______________";
  seg(monthText, bold, certTop);
  page.drawLine({
    start: { x: cx - bold.widthOfTextAtSize(monthText, 11), y: T(certTop + 2) },
    end: { x: cx, y: T(certTop + 2) },
    thickness: 0.7,
    color: LINE_GREY,
  });
  seg(", I certify the recipient named above performed", reg, certTop);

  // Certification line 2
  const certTop2 = 725;
  cx = LEFT;
  seg("volunteer service for this entity for ", reg, certTop2);
  const hoursText = Number.isFinite(data.hours) ? `${data.hours}` : "______";
  seg(hoursText, bold, certTop2);
  page.drawLine({
    start: { x: cx - bold.widthOfTextAtSize(hoursText, 11), y: T(certTop2 + 2) },
    end: { x: cx, y: T(certTop2 + 2) },
    thickness: 0.7,
    color: LINE_GREY,
  });
  seg(" hours. Start date: ", reg, certTop2);
  const startText = data.startDate || "__________";
  seg(startText, bold, certTop2);
  page.drawLine({
    start: { x: cx - bold.widthOfTextAtSize(startText, 11), y: T(certTop2 + 2) },
    end: { x: cx, y: T(certTop2 + 2) },
    thickness: 0.7,
    color: LINE_GREY,
  });

  // Activity type checkboxes
  const checkboxAt = (label: string, x: number, top: number, checked: boolean) => {
    page.drawRectangle({ x, y: T(top + 10), width: 11, height: 11, borderColor: INK, borderWidth: 1 });
    if (checked) draw("X", x + 2.5, top - 0.5, bold, 11);
    draw(label, x + 20, top, reg, 11);
  };
  draw("Activity type:", LEFT, 750, bold, 11);
  checkboxAt("Ongoing", labelX + 70, 750, data.activity === "ongoing");
  checkboxAt("One Time", labelX + 170, 750, data.activity === "one_time");

  // Activity description
  draw("Description of volunteer activity:", LEFT, 774, bold, 11);
  page.drawLine({ start: { x: LEFT, y: T(790) }, end: { x: RIGHT, y: T(790) }, thickness: 0.6, color: LINE_GREY });
  if (data.positionDescription) {
    const desc = data.positionDescription.slice(0, 110);
    draw(desc, LEFT, 787, reg, 10);
  }

  // ---- New page for signature + footer (we ran out of room) ----
  const page2 = doc.addPage([PAGE_W, PAGE_H]);
  const draw2 = (
    text: string,
    x: number,
    top: number,
    font: PDFFont,
    size: number,
    color = INK
  ) => page2.drawText(text, { x, y: T(top), size, font, color });

  draw2("DCO-261 Volunteer Agreement (continued)", LEFT, 60, bold, 12);
  page2.drawLine({ start: { x: LEFT, y: T(72) }, end: { x: RIGHT, y: T(72) }, thickness: 0.6, color: INK });

  // attestation
  const attest = [
    "I certify under penalty of perjury that the hours reported above reflect the recipient's",
    "actual measured volunteer time supervised by this entity. I understand this form will be",
    "submitted to the Arkansas DHS county office for SNAP Required-to-Work verification.",
  ];
  let ay = 100;
  for (const ln of attest) {
    draw2(ln, LEFT, ay, reg, 11);
    ay += 15;
  }

  // signature table
  const tableTop = 170;
  const tableBottom = 210;
  const midX = 300;
  page2.drawRectangle({
    x: LEFT,
    y: T(tableBottom),
    width: RIGHT - LEFT,
    height: tableBottom - tableTop,
    borderColor: INK,
    borderWidth: 0.8,
  });
  page2.drawLine({ start: { x: midX, y: T(tableTop) }, end: { x: midX, y: T(tableBottom) }, thickness: 0.8, color: INK });
  page2.drawLine({ start: { x: LEFT, y: T(tableTop + 14) }, end: { x: RIGHT, y: T(tableTop + 14) }, thickness: 0.8, color: INK });
  draw2("Signature of Supervising Representative", LEFT + 6, tableTop + 11, reg, 10);
  draw2("Date Signed", midX + 6, tableTop + 11, reg, 10);
  if (data.signatureName) draw2(data.signatureName, LEFT + 12, tableTop + 32, ital, 15);
  if (data.dateSigned) draw2(data.dateSigned, midX + 10, tableTop + 32, reg, 11);

  // submission note
  const submitNote = [
    "Return this completed form to the recipient's local Arkansas DHS county office. The eligibility",
    "worker uses it to verify volunteer hours toward the ABAWD Required-to-Work obligation under",
    "SNAP Manual Section 3500/3540.3 (general 80-hour lane) or Section 3730 (Comparable Workfare).",
  ];
  let sy = 250;
  for (const ln of submitNote) {
    draw2(ln, LEFT, sy, reg, 10);
    sy += 14;
  }

  // ---- Footer ----
  page2.drawLine({ start: { x: LEFT, y: T(778) }, end: { x: RIGHT, y: T(778) }, thickness: 0.6, color: INK });
  draw2("DCO-261 (also DCO-0261) — Arkansas DHS Division of County Operations", LEFT, 790, reg, 10);

  return doc.save();
}
