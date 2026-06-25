/**
 * DC — "Verification of Employment or Qualifying Work Activity Form"
 * Agency: District of Columbia Department of Human Services (DHS),
 *   Economic Security Administration (ESA).
 * Trilingual: available in English, Spanish, and Amharic.
 * Submission paths: District Direct portal/app (districtdirect.dc.gov),
 *   in person at a DHS service center, or by mail/fax.
 * Launched: June 1, 2026 (ABAWD time limits returned to DC the same date).
 * Source: https://dhs.dc.gov/page/snap-work-requirements
 *
 * Filled by the customer; signed by an employer or organization representative
 * to verify work/qualifying-activity hours. Hand-drawn with pdf-lib so it works
 * in the Cloudflare Workers runtime (no fs, no template load).
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

export async function buildDCPdf(data: StateFormData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle("DC — Verification of Employment or Qualifying Work Activity");
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

  // ---- Header row ----
  draw("Government of the District of Columbia", LEFT, 60, reg, 11);
  const rightHeader = "Department of Human Services";
  draw(rightHeader, RIGHT - reg.widthOfTextAtSize(rightHeader, 11), 60, reg, 11);
  draw("Economic Security Administration", LEFT, 74, reg, 10);

  // ---- Title ----
  draw("VERIFICATION OF EMPLOYMENT OR", LEFT, 108, bold, 16);
  draw("QUALIFYING WORK ACTIVITY FORM", LEFT, 128, bold, 16);

  // double rule
  page.drawLine({ start: { x: LEFT, y: T(140) }, end: { x: RIGHT, y: T(140) }, thickness: 1.2, color: INK });
  page.drawLine({ start: { x: LEFT, y: T(143) }, end: { x: RIGHT, y: T(143) }, thickness: 0.6, color: INK });

  // ---- Intro paragraph ----
  const intro = [
    "SNAP work requirements may apply to you. Volunteer work or other qualifying work activities can",
    "count toward the ABAWD 80-hours-per-month requirement. This form is completed by the customer and",
    "signed by an employer or organization representative to verify hours worked or volunteered. You can",
    "submit this form online through District Direct at districtdirect.dc.gov, in person at a DHS service",
    "center, or by mail or fax. Available in English, Spanish, and Amharic.",
  ];
  let y = 166;
  for (const ln of intro) {
    draw(ln, LEFT, y, reg, 11);
    y += 15;
  }
  // tint the District Direct URL on its line (line index 3)
  const urlLinePrefix = "submit this form online through District Direct at ";
  const urlX = LEFT + reg.widthOfTextAtSize(urlLinePrefix, 11);
  draw("districtdirect.dc.gov", urlX, 166 + 15 * 3, reg, 11, LINK_BLUE);

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

  // ---- SECTION 1 ----
  band("SECTION 1. CUSTOMER INFORMATION", 256);
  draw("To be completed by the SNAP customer. Please fill in the information below.", LEFT, 286, reg, 11);

  field("Customer Name", data.participantName, 314);
  field("Date of Birth", data.birthdate, 340);
  if (data.caseNumber) {
    field("DHS Case / Client Number", data.caseNumber, 366);
  } else {
    draw("DHS Case / Client Number", labelX, 366, bold, 11);
    blankLine(366);
  }
  draw("Address", labelX, 392, bold, 11);
  blankLine(392);
  if (data.participantAddress[0]) draw(data.participantAddress[0], valX + 4, 392, reg, 11);
  blankLine(410);
  if (data.participantAddress[1]) draw(data.participantAddress[1], valX + 4, 410, reg, 11);
  if (data.participantPhone) {
    field("Telephone Number", data.participantPhone, 436);
  } else {
    draw("Telephone Number", labelX, 436, bold, 11);
    blankLine(436);
  }

  // ---- SECTION 2 ----
  band("SECTION 2. EMPLOYER OR ORGANIZATION INFORMATION", 460);
  draw("To be completed by a representative of the employer or organization where the customer worked or", LEFT, 490, reg, 11);
  draw("volunteered. Please fill in the information below.", LEFT, 505, reg, 11);

  field("Name of Employer / Organization", data.orgName, 533);
  field("Name of Representative", data.representativeName, 559);
  if (data.representativeTitle) {
    field("Title", data.representativeTitle, 585);
  } else {
    draw("Title", labelX, 585, bold, 11);
    blankLine(585);
  }
  draw("Address", labelX, 611, bold, 11);
  blankLine(611);
  if (data.orgAddress[0]) draw(data.orgAddress[0], valX + 4, 611, reg, 11);
  blankLine(629);
  if (data.orgAddress[1]) draw(data.orgAddress[1], valX + 4, 629, reg, 11);
  field("Telephone Number", data.orgPhone, 655);

  // ---- Certification sentence with inline filled values ----
  const certTop = 690;
  let cx = LEFT;
  const seg = (t: string, font: PDFFont, color = INK) => {
    draw(t, cx, certTop, font, 11, color);
    cx += font.widthOfTextAtSize(t, 11);
  };
  seg("For the month of ", reg);
  const monthText = data.month || "______________";
  seg(monthText, bold);
  page.drawLine({
    start: { x: cx - bold.widthOfTextAtSize(monthText, 11), y: T(certTop + 2) },
    end: { x: cx, y: T(certTop + 2) },
    thickness: 0.7,
    color: LINE_GREY,
  });
  seg(", I certify that the customer named above performed", reg);

  // line 2
  cx = LEFT;
  const certTop2 = 707;
  const seg2 = (t: string, font: PDFFont) => {
    draw(t, cx, certTop2, font, 11);
    cx += font.widthOfTextAtSize(t, 11);
  };
  seg2("qualifying work activity for the organization I represent for ", reg);
  const hoursText = Number.isFinite(data.hours) ? `${data.hours}` : "______";
  seg2(hoursText, bold);
  page.drawLine({
    start: { x: cx - bold.widthOfTextAtSize(hoursText, 11), y: T(certTop2 + 2) },
    end: { x: cx, y: T(certTop2 + 2) },
    thickness: 0.7,
    color: LINE_GREY,
  });
  seg2(" hours. The activity is:", reg);

  // Activity-cadence checkboxes (Ongoing / One Time) laid out side-by-side.
  const ongoingX = labelX + 12;
  const oneTimeX = labelX + 130;
  page.drawRectangle({ x: ongoingX, y: T(737), width: 11, height: 11, borderColor: INK, borderWidth: 1 });
  if (data.activity === "ongoing") draw("X", ongoingX + 2.5, 726.5, bold, 11);
  draw("Ongoing", ongoingX + 20, 727, reg, 11);
  page.drawRectangle({ x: oneTimeX, y: T(737), width: 11, height: 11, borderColor: INK, borderWidth: 1 });
  if (data.activity === "one_time") draw("X", oneTimeX + 2.5, 726.5, bold, 11);
  draw("One Time", oneTimeX + 20, 727, reg, 11);

  // ---- Signature table ----
  const tableTop = 748;
  const tableBottom = 778;
  const midX = 300;
  page.drawRectangle({ x: LEFT, y: T(tableBottom), width: RIGHT - LEFT, height: tableBottom - tableTop, borderColor: INK, borderWidth: 0.8 });
  page.drawLine({ start: { x: midX, y: T(tableTop) }, end: { x: midX, y: T(tableBottom) }, thickness: 0.8, color: INK });
  page.drawLine({ start: { x: LEFT, y: T(tableTop + 12) }, end: { x: RIGHT, y: T(tableTop + 12) }, thickness: 0.8, color: INK });
  draw("Signature of Representative", LEFT + 6, tableTop + 10, reg, 9);
  draw("Date Signed", midX + 6, tableTop + 10, reg, 9);
  if (data.signatureName) draw(data.signatureName, LEFT + 12, tableTop + 26, ital, 13);
  if (data.dateSigned) draw(data.dateSigned, midX + 10, tableTop + 26, reg, 11);

  // ---- Footer ----
  page.drawLine({ start: { x: LEFT, y: T(784) }, end: { x: RIGHT, y: T(784) }, thickness: 0.5, color: INK });
  draw("DC DHS — Verification of Employment or Qualifying Work Activity (6/26)", LEFT, 790, reg, 9);
  const subRight = "Submit via District Direct, DHS service center, mail, or fax";
  draw(subRight, RIGHT - reg.widthOfTextAtSize(subRight, 9), 790, reg, 9);

  return doc.save();
}
