/**
 * CF 888 — "CalFresh Able-Bodied Adults Without Dependents Volunteer Work Hours
 * Verification Form" (CDSS, rev 5/25).
 *
 * We recreate the form from scratch with pdf-lib rather than filling the real
 * CDSS PDF: that file is an encrypted XFA form pdf-lib cannot parse. Drawing it
 * ourselves is fully controllable, works in the Workers runtime (no fs/template
 * load), and renders identically every time. Layout mirrors the official form
 * (see docs/screenshots/cf888-comparison.png).
 */
import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from "pdf-lib";

export interface Cf888Data {
  participantName: string;
  birthdate: string;
  participantAddress: string[]; // up to 3 lines
  orgName: string;
  representativeName: string;
  orgAddress: string[]; // up to 3 lines
  orgPhone: string;
  month: string; // e.g. "June 2026"
  hours: number;
  activity: "ongoing" | "one_time";
  signatureName: string;
  dateSigned: string;
}

const PAGE_W = 612;
const PAGE_H = 792;
const LEFT = 56;
const RIGHT = 556;
const INK = rgb(0.04, 0.04, 0.04);
const LINK_BLUE = rgb(0.05, 0.32, 0.66);
const BAND = rgb(0.85, 0.86, 0.86);
const LINE_GREY = rgb(0.45, 0.45, 0.45);

export async function buildCf888Pdf(data: Cf888Data): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle("CF 888 — CalFresh Volunteer Work Hours Verification");
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
  draw("California Health & Human Services Agency", LEFT, 60, reg, 11);
  const rightHeader = "California Department of Social Services";
  draw(rightHeader, RIGHT - reg.widthOfTextAtSize(rightHeader, 11), 60, reg, 11);

  // ---- Title ----
  draw("CALFRESH ABLE-BODIED ADULTS WITHOUT DEPENDENTS", LEFT, 92, bold, 16);
  draw("VOLUNTEER WORK HOURS VERIFICATION FORM", LEFT, 112, bold, 16);

  // double rule
  page.drawLine({ start: { x: LEFT, y: T(124) }, end: { x: RIGHT, y: T(124) }, thickness: 1.2, color: INK });
  page.drawLine({ start: { x: LEFT, y: T(127) }, end: { x: RIGHT, y: T(127) }, thickness: 0.6, color: INK });

  // ---- Intro paragraph ----
  const intro = [
    "CalFresh rules require some CalFresh participants to work or participate in a qualifying work activity to",
    "keep their CalFresh benefits. Volunteering or doing community service is a qualifying work activity. This",
    "form may be used to verify volunteer or community service hours. You can turn in this form online by",
    "uploading it to your BenefitsCal account at www.BenefitsCal.com, by mail, or in person at your local",
    "county office.",
  ];
  let y = 150;
  for (const ln of intro) {
    draw(ln, LEFT, y, reg, 11);
    y += 15;
  }
  // tint the BenefitsCal URL on its line (line index 3)
  const urlLinePrefix = "uploading it to your BenefitsCal account at ";
  const urlX = LEFT + reg.widthOfTextAtSize(urlLinePrefix, 11);
  draw("www.BenefitsCal.com", urlX, 150 + 15 * 3, reg, 11, LINK_BLUE);

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
  band("SECTION 1. CALFRESH PARTICIPANT INFORMATION", 240);
  draw("This section must be completed by the CalFresh participant. Please fill in the information below.", LEFT, 270, reg, 11);

  field("Name of CalFresh Participant", data.participantName, 300);
  field("Birthdate", data.birthdate, 326);
  draw("Address", labelX, 352, bold, 11);
  blankLine(352);
  if (data.participantAddress[0]) draw(data.participantAddress[0], valX + 4, 352, reg, 11);
  blankLine(370);
  if (data.participantAddress[1]) draw(data.participantAddress[1], valX + 4, 370, reg, 11);
  blankLine(388);
  if (data.participantAddress[2]) draw(data.participantAddress[2], valX + 4, 388, reg, 11);

  // ---- SECTION 2 ----
  band("SECTION 2. VOLUNTEER ACTIVITY INFORMATION", 412);
  draw("This section must be completed by a representative of the organization where the person named", LEFT, 442, reg, 11);
  draw("above volunteers or does community service. Please fill in the information below.", LEFT, 457, reg, 11);

  field("Name of Organization", data.orgName, 487);
  field("Name of Representative", data.representativeName, 513);
  draw("Address", labelX, 539, bold, 11);
  blankLine(539);
  if (data.orgAddress[0]) draw(data.orgAddress[0], valX + 4, 539, reg, 11);
  blankLine(557);
  if (data.orgAddress[1]) draw(data.orgAddress[1], valX + 4, 557, reg, 11);
  blankLine(575);
  if (data.orgAddress[2]) draw(data.orgAddress[2], valX + 4, 575, reg, 11);
  field("Telephone Number", data.orgPhone, 601);

  // ---- Certification sentence with inline filled values ----
  const certTop = 636;
  // "For the month of {month}, I certify that the person named above volunteered or performed community"
  let cx = LEFT;
  const seg = (t: string, font: PDFFont, color = INK) => {
    draw(t, cx, certTop, font, 11, color);
    cx += font.widthOfTextAtSize(t, 11);
  };
  seg("For the month of ", reg);
  const monthText = data.month || "______________";
  seg(monthText, bold);
  // underline the month
  page.drawLine({
    start: { x: cx - bold.widthOfTextAtSize(monthText, 11), y: T(certTop + 2) },
    end: { x: cx, y: T(certTop + 2) },
    thickness: 0.7,
    color: LINE_GREY,
  });
  seg(", I certify that the person named above volunteered or performed", reg);

  // line 2
  cx = LEFT;
  const certTop2 = 653;
  const seg2 = (t: string, font: PDFFont) => {
    draw(t, cx, certTop2, font, 11);
    cx += font.widthOfTextAtSize(t, 11);
  };
  seg2("community service for the organization I represent for ", reg);
  const hoursText = Number.isFinite(data.hours) ? `${data.hours}` : "______";
  seg2(hoursText, bold);
  page.drawLine({
    start: { x: cx - bold.widthOfTextAtSize(hoursText, 11), y: T(certTop2 + 2) },
    end: { x: cx, y: T(certTop2 + 2) },
    thickness: 0.7,
    color: LINE_GREY,
  });
  seg2(" hours. The volunteer activity is:", reg);

  // checkboxes
  const checkbox = (label: string, top: number, checked: boolean) => {
    page.drawRectangle({ x: labelX + 12, y: T(top + 10), width: 11, height: 11, borderColor: INK, borderWidth: 1 });
    if (checked) draw("X", labelX + 14.5, top - 0.5, bold, 11);
    draw(label, labelX + 32, top, reg, 11);
  };
  checkbox("Ongoing", 684, data.activity === "ongoing");
  checkbox("One Time", 705, data.activity === "one_time");

  // ---- Signature table ----
  const tableTop = 724;
  const tableBottom = 762;
  const midX = 300;
  // outer box + header row
  page.drawRectangle({ x: LEFT, y: T(tableBottom), width: RIGHT - LEFT, height: tableBottom - tableTop, borderColor: INK, borderWidth: 0.8 });
  page.drawLine({ start: { x: midX, y: T(tableTop) }, end: { x: midX, y: T(tableBottom) }, thickness: 0.8, color: INK });
  page.drawLine({ start: { x: LEFT, y: T(tableTop + 14) }, end: { x: RIGHT, y: T(tableTop + 14) }, thickness: 0.8, color: INK });
  draw("Signature Of Representative", LEFT + 6, tableTop + 11, reg, 10);
  draw("Date Signed", midX + 6, tableTop + 11, reg, 10);
  // filled signature (cursive-ish via Times italic) + date
  if (data.signatureName) draw(data.signatureName, LEFT + 12, tableTop + 30, ital, 15);
  if (data.dateSigned) draw(data.dateSigned, midX + 10, tableTop + 30, reg, 11);

  // ---- Footer ----
  page.drawLine({ start: { x: LEFT, y: T(778) }, end: { x: RIGHT, y: T(778) }, thickness: 0.6, color: INK });
  draw("CF 888 (5/25) - Required Form - No Substitutes Permitted", LEFT, 790, reg, 10);

  return doc.save();
}
