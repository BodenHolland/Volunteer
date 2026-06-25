/**
 * Maine — "ABAWD Volunteer Form"
 * Full title: "SNAP Community Service Volunteer/Workfare Verification - Action Required"
 * Agency: Maine Department of Health and Human Services (DHHS), Office for Family Independence (OFI)
 * Current fillable version: "ABAWD Volunteer Form Fillable 11.24.25.pdf"
 *
 * Submission paths (per the form itself):
 *   - Mail/fax to Farmington DHHS: 114 Corn Shop Lane, Farmington, ME 04938 / Fax (207) 778-8429
 *   - Email: Farmington.DHHS@Maine.gov
 *   - Upload to recipient account at MyMaineConnection.gov
 *
 * Source:
 *   https://www.maine.gov/dhhs/sites/maine.gov.dhhs/files/inline-files/ABAWD%20Volunteer%20Form%20Fillable%2011.24.25.pdf
 *
 * Hand-drawn with pdf-lib (no template loading) for Cloudflare Workers runtime.
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

export async function buildMEPdf(data: StateFormData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle("ABAWD Volunteer Form — SNAP Community Service Volunteer/Workfare Verification");
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
  draw("Maine Department of Health and Human Services", LEFT, 60, reg, 11);
  const rightHeader = "Office for Family Independence";
  draw(rightHeader, RIGHT - reg.widthOfTextAtSize(rightHeader, 11), 60, reg, 11);

  // ---- Title ----
  draw("SNAP COMMUNITY SERVICE", LEFT, 92, bold, 16);
  draw("VOLUNTEER/WORKFARE VERIFICATION", LEFT, 112, bold, 16);
  draw("- ACTION REQUIRED -", LEFT, 132, bold, 13);

  // double rule
  page.drawLine({ start: { x: LEFT, y: T(144) }, end: { x: RIGHT, y: T(144) }, thickness: 1.2, color: INK });
  page.drawLine({ start: { x: LEFT, y: T(147) }, end: { x: RIGHT, y: T(147) }, thickness: 0.6, color: INK });

  // ---- Intro paragraph ----
  const intro = [
    "Maine SNAP rules require some recipients (Able-Bodied Adults Without Dependents) to complete",
    "qualifying work activity hours each month. Volunteer or community service hours at an approved",
    "non-profit site count toward this requirement. Recipients must send this form to the address or fax",
    "below, e-mail it to Farmington.DHHS@Maine.gov, or upload it to their account at",
    "MyMaineConnection.gov. Volunteer hours will need to be verified at each application or annual",
    "eligibility review.",
  ];
  let y = 170;
  for (const ln of intro) {
    draw(ln, LEFT, y, reg, 11);
    y += 15;
  }
  // tint the email + portal mentions
  const emailLinePrefix = "below, e-mail it to ";
  const emailX = LEFT + reg.widthOfTextAtSize(emailLinePrefix, 11);
  draw("Farmington.DHHS@Maine.gov", emailX, 170 + 15 * 3, reg, 11, LINK_BLUE);
  draw("MyMaineConnection.gov", LEFT, 170 + 15 * 4, reg, 11, LINK_BLUE);

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

  // ---- SECTION 1: SNAP recipient ----
  band("SECTION 1. SNAP RECIPIENT INFORMATION", 280);
  draw("This section must be completed by the SNAP recipient.", LEFT, 310, reg, 11);

  field("Name of SNAP Recipient", data.participantName, 336);
  field("Date of Birth", data.birthdate, 362);
  if (data.caseNumber) {
    field("Case Number", data.caseNumber, 388);
  } else {
    field("Case Number", "", 388);
  }
  field("Phone Number", data.participantPhone || "", 414);
  draw("Address", labelX, 440, bold, 11);
  blankLine(440);
  if (data.participantAddress[0]) draw(data.participantAddress[0], valX + 4, 440, reg, 11);
  blankLine(458);
  if (data.participantAddress[1]) draw(data.participantAddress[1], valX + 4, 458, reg, 11);

  // ---- SECTION 2: Organization ----
  band("SECTION 2. VOLUNTEER ORGANIZATION INFORMATION", 482);
  draw("This section must be completed by a representative of the non-profit organization where the", LEFT, 512, reg, 11);
  draw("person named above volunteers or performs community service.", LEFT, 527, reg, 11);

  field("Name of Organization", data.orgName, 553);
  field("Name of Representative", data.representativeName, 579);
  field("Title of Representative", data.representativeTitle || "", 605);
  field("Telephone Number", data.orgPhone, 631);

  // ---- Certification sentence with inline filled values ----
  const certTop = 662;
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
  seg(", I certify that the person named above completed", reg);

  // line 2
  cx = LEFT;
  const certTop2 = 679;
  const seg2 = (t: string, font: PDFFont) => {
    draw(t, cx, certTop2, font, 11);
    cx += font.widthOfTextAtSize(t, 11);
  };
  const hoursText = Number.isFinite(data.hours) ? `${data.hours}` : "______";
  seg2(hoursText, bold);
  page.drawLine({
    start: { x: cx - bold.widthOfTextAtSize(hoursText, 11), y: T(certTop2 + 2) },
    end: { x: cx, y: T(certTop2 + 2) },
    thickness: 0.7,
    color: LINE_GREY,
  });
  seg2(" hours of volunteer/community service for the organization I represent.", reg);

  // checkboxes
  draw("The volunteer activity is:", LEFT, 702, reg, 11);
  const checkbox = (label: string, x: number, top: number, checked: boolean) => {
    page.drawRectangle({ x, y: T(top + 10), width: 11, height: 11, borderColor: INK, borderWidth: 1 });
    if (checked) draw("X", x + 2.5, top - 0.5, bold, 11);
    draw(label, x + 20, top, reg, 11);
  };
  checkbox("Ongoing", labelX + 12, 720, data.activity === "ongoing");
  checkbox("One Time", labelX + 132, 720, data.activity === "one_time");

  // ---- Signature table ----
  const tableTop = 738;
  const tableBottom = 770;
  const midX = 300;
  page.drawRectangle({ x: LEFT, y: T(tableBottom), width: RIGHT - LEFT, height: tableBottom - tableTop, borderColor: INK, borderWidth: 0.8 });
  page.drawLine({ start: { x: midX, y: T(tableTop) }, end: { x: midX, y: T(tableBottom) }, thickness: 0.8, color: INK });
  page.drawLine({ start: { x: LEFT, y: T(tableTop + 12) }, end: { x: RIGHT, y: T(tableTop + 12) }, thickness: 0.8, color: INK });
  draw("Signature of Representative", LEFT + 6, tableTop + 9, reg, 9);
  draw("Date Signed", midX + 6, tableTop + 9, reg, 9);
  if (data.signatureName) draw(data.signatureName, LEFT + 12, tableTop + 26, ital, 14);
  if (data.dateSigned) draw(data.dateSigned, midX + 10, tableTop + 26, reg, 11);

  // ---- Footer ----
  page.drawLine({ start: { x: LEFT, y: T(782) }, end: { x: RIGHT, y: T(782) }, thickness: 0.6, color: INK });
  draw("ABAWD Volunteer Form (Rev. 11/24/25) - Maine DHHS Office for Family Independence", LEFT, 790, reg, 8.5);

  return doc.save();
}
