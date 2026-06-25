/**
 * Form name: SNAP Activity Report
 * Form ID:   IL444-2610
 * Agency:    Illinois Department of Human Services (IDHS)
 * Lane:      Self-initiated community-service / volunteer lane
 *            (DISTINCT from IL444-3673 "SNAP Work Requirement - Community
 *            Workfare Verification", which is the assigned Community
 *            Workfare lane — do not conflate.)
 * Status:    OPTIONAL. IDHS also accepts a signed letter from the community
 *            organization OR a Serve Illinois - Galaxy Digital report.
 * Submit:    Manage My Case (MMC) "Upload Documents"; OR mail/fax to IDHS
 *            Central Scanning Unit, P.O. Box 19138, Springfield, IL 62794;
 *            OR local Family Community Resource Center (FCRC).
 * Source:    https://www.dhs.state.il.us/onenetlibrary/12/documents/Forms/IL444-2610.pdf
 *
 * Hand-drawn with pdf-lib to run in the Cloudflare Workers runtime (no fs,
 * no template load). Mirrors the layout of cf888.ts.
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

export async function buildILPdf(data: StateFormData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle("IL444-2610 — SNAP Activity Report");
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
  draw("State of Illinois", LEFT, 56, reg, 10);
  const rightHeader = "Illinois Department of Human Services";
  draw(rightHeader, RIGHT - reg.widthOfTextAtSize(rightHeader, 10), 56, reg, 10);

  // ---- Title ----
  draw("SNAP ACTIVITY REPORT", LEFT, 88, bold, 18);
  draw("Self-Initiated Community Service / Volunteer Hours", LEFT, 108, reg, 11);

  // double rule
  page.drawLine({ start: { x: LEFT, y: T(122) }, end: { x: RIGHT, y: T(122) }, thickness: 1.2, color: INK });
  page.drawLine({ start: { x: LEFT, y: T(125) }, end: { x: RIGHT, y: T(125) }, thickness: 0.6, color: INK });

  // ---- Intro paragraph ----
  const intro = [
    "Use this form to report self-initiated community service or volunteer hours that count toward the",
    "SNAP ABAWD work requirement (an average of 20 hours per week / 80 hours per month). The SNAP",
    "recipient completes the activity information and signs below; a representative of the community",
    "organization then enters the organization name and signs to verify the hours. This form is one",
    "accepted document — IDHS also accepts a signed letter from the organization or a Serve Illinois",
    "(Galaxy Digital) report. Submit via Manage My Case, mail/fax to the Central Scanning Unit, or",
    "your local Family Community Resource Center (FCRC).",
  ];
  let y = 148;
  for (const ln of intro) {
    draw(ln, LEFT, y, reg, 10.5);
    y += 14;
  }

  // ---- helper: section band ----
  const band = (label: string, top: number) => {
    page.drawRectangle({ x: LEFT, y: T(top + 14), width: RIGHT - LEFT, height: 18, color: BAND });
    draw(label, LEFT + 6, top + 11, bold, 11.5);
  };
  // ---- helper: labeled field with value on an underline ----
  const labelX = 70;
  const valX = 240;
  const valEnd = RIGHT;
  const field = (label: string, value: string, top: number) => {
    draw(label, labelX, top, bold, 10.5);
    page.drawLine({ start: { x: valX, y: T(top + 3) }, end: { x: valEnd, y: T(top + 3) }, thickness: 0.8, color: LINE_GREY });
    if (value) draw(value, valX + 4, top, reg, 10.5);
  };
  const blankLine = (top: number) => {
    page.drawLine({ start: { x: valX, y: T(top + 3) }, end: { x: valEnd, y: T(top + 3) }, thickness: 0.8, color: LINE_GREY });
  };

  // ---- SECTION 1: Recipient ----
  band("SECTION 1. SNAP RECIPIENT INFORMATION", 256);
  draw("To be completed by the SNAP recipient.", LEFT, 286, ital, 10);

  field("Name of SNAP Recipient", data.participantName, 308);
  field("Date of Birth", data.birthdate, 330);
  if (data.caseNumber !== undefined) {
    field("Case Number (optional)", data.caseNumber || "", 352);
  } else {
    field("Case Number (optional)", "", 352);
  }
  draw("Address", labelX, 374, bold, 10.5);
  blankLine(374);
  if (data.participantAddress[0]) draw(data.participantAddress[0], valX + 4, 374, reg, 10.5);
  blankLine(392);
  if (data.participantAddress[1]) draw(data.participantAddress[1], valX + 4, 392, reg, 10.5);
  if (data.participantPhone) {
    field("Telephone Number", data.participantPhone, 414);
  } else {
    field("Telephone Number", "", 414);
  }

  // ---- SECTION 2: Activity Log ----
  band("SECTION 2. ACTIVITY LOG", 442);
  draw(
    "Enter each volunteer session: activity type/description, date, start time, finish time, and total hours.",
    LEFT,
    472,
    reg,
    10
  );

  // Table
  const tblTop = 488;
  const rowH = 22;
  const headerH = 18;
  const rows = 5;
  const tblBottom = tblTop + headerH + rowH * rows;

  // column x positions
  const colActivityX = LEFT;
  const colDateX = LEFT + 220;
  const colStartX = LEFT + 290;
  const colFinishX = LEFT + 360;
  const colHoursX = LEFT + 430;
  const colEnd = RIGHT;

  // Outer box
  page.drawRectangle({
    x: LEFT,
    y: T(tblBottom),
    width: RIGHT - LEFT,
    height: tblBottom - tblTop,
    borderColor: INK,
    borderWidth: 0.8,
  });
  // header row shading
  page.drawRectangle({
    x: LEFT,
    y: T(tblTop + headerH),
    width: RIGHT - LEFT,
    height: headerH,
    color: BAND,
  });
  // header text
  draw("Activity Type / Description", colActivityX + 6, tblTop + 12, bold, 9.5);
  draw("Date", colDateX + 6, tblTop + 12, bold, 9.5);
  draw("Start", colStartX + 6, tblTop + 12, bold, 9.5);
  draw("Finish", colFinishX + 6, tblTop + 12, bold, 9.5);
  draw("Hours", colHoursX + 6, tblTop + 12, bold, 9.5);

  // vertical column dividers
  for (const x of [colDateX, colStartX, colFinishX, colHoursX]) {
    page.drawLine({
      start: { x, y: T(tblTop) },
      end: { x, y: T(tblBottom) },
      thickness: 0.6,
      color: INK,
    });
  }
  // horizontal row dividers
  for (let i = 0; i <= rows; i++) {
    const y = tblTop + headerH + rowH * i;
    page.drawLine({
      start: { x: LEFT, y: T(y) },
      end: { x: colEnd, y: T(y) },
      thickness: 0.6,
      color: INK,
    });
  }

  // Fill summary row (row 1) with the monthly rollup colift logs.
  const summaryRowTop = tblTop + headerH + 14; // baseline inside row 1
  const activityLabel =
    data.positionDescription && data.positionDescription.trim()
      ? data.positionDescription.trim()
      : `Community service (monthly total — ${data.month})`;
  // truncate to fit column
  const maxActivityW = colDateX - colActivityX - 10;
  let actText = activityLabel;
  while (reg.widthOfTextAtSize(actText, 10) > maxActivityW && actText.length > 4) {
    actText = actText.slice(0, -2);
  }
  if (actText !== activityLabel) actText = actText.slice(0, -1) + "…";
  draw(actText, colActivityX + 6, summaryRowTop, reg, 10);
  // Date column: end-of-month signature date (start/finish unknown — colift only stores rolled-up hours)
  draw(data.dateSigned || "", colDateX + 6, summaryRowTop, reg, 10);
  // Start/Finish intentionally blank (monthly rollup, no per-session times)
  // Hours column: monthly total
  const hoursStr = Number.isFinite(data.hours) ? `${data.hours}` : "";
  draw(hoursStr, colHoursX + 6, summaryRowTop, reg, 10);

  // Total row (under the table)
  const totalTop = tblBottom + 16;
  draw("TOTAL HOURS THIS PERIOD:", colFinishX - 60, totalTop, bold, 10.5);
  page.drawLine({
    start: { x: colHoursX, y: T(totalTop + 3) },
    end: { x: colEnd, y: T(totalTop + 3) },
    thickness: 0.8,
    color: LINE_GREY,
  });
  draw(hoursStr, colHoursX + 6, totalTop, bold, 10.5);

  // ---- SECTION 3: Organization ----
  band("SECTION 3. COMMUNITY ORGANIZATION INFORMATION", 624);
  draw(
    "To be completed by a representative of the community organization verifying the hours above.",
    LEFT,
    652,
    ital,
    9.5
  );

  field("Name of Organization", data.orgName, 670);
  // Organization address (single condensed line — Section 3 has tight vertical
  // budget against the signature table below).
  const addrLine = data.orgAddress.filter(Boolean).join(" · ");
  field("Organization Address", addrLine, 688);
  // Representative + optional title on a single line.
  const repLabel = data.representativeTitle
    ? `${data.representativeName} (${data.representativeTitle})`
    : data.representativeName;
  field("Name of Representative", repLabel, 706);
  // Phone · Email on a single compact line so we use everything the data
  // model already carries.
  const contactLine = [data.orgPhone, data.orgEmail].filter(Boolean).join(" · ");
  if (contactLine) field("Phone / Email", contactLine, 722);

  // ---- SECTION 4: Dual signature table ----
  const sigTop = 740;
  const sigBottom = 782;
  const midX = 300;
  page.drawRectangle({
    x: LEFT,
    y: T(sigBottom),
    width: RIGHT - LEFT,
    height: sigBottom - sigTop,
    borderColor: INK,
    borderWidth: 0.8,
  });
  // horizontal mid-line for the two sub-rows
  const sigMidY = sigTop + (sigBottom - sigTop) / 2;
  page.drawLine({
    start: { x: LEFT, y: T(sigMidY) },
    end: { x: RIGHT, y: T(sigMidY) },
    thickness: 0.8,
    color: INK,
  });
  // vertical divider
  page.drawLine({
    start: { x: midX, y: T(sigTop) },
    end: { x: midX, y: T(sigBottom) },
    thickness: 0.8,
    color: INK,
  });

  // Recipient signature row (top)
  draw("Recipient Signature", LEFT + 6, sigTop + 9, reg, 9);
  draw("Date", midX + 6, sigTop + 9, reg, 9);
  if (data.signatureName) draw(data.signatureName, LEFT + 12, sigTop + 19, ital, 13);
  if (data.dateSigned) draw(data.dateSigned, midX + 10, sigTop + 19, reg, 10.5);

  // Org representative signature row (bottom)
  draw("Organization Representative Signature", LEFT + 6, sigMidY + 9, reg, 9);
  draw("Date", midX + 6, sigMidY + 9, reg, 9);
  if (data.representativeName) draw(data.representativeName, LEFT + 12, sigMidY + 19, ital, 13);
  if (data.dateSigned) draw(data.dateSigned, midX + 10, sigMidY + 19, reg, 10.5);

  // ---- Footer (placed clear of the resized signature table) ----
  page.drawLine({ start: { x: LEFT, y: T(786) }, end: { x: RIGHT, y: T(786) }, thickness: 0.6, color: INK });
  draw("IL444-2610 — SNAP Activity Report (IDHS) — optional; org letter or Serve Illinois report also accepted", LEFT, 795, reg, 8);

  return doc.save();
}
