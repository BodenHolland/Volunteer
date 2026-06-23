/**
 * FIA/500b — "Verification of Activity Participation" (Maryland DHS)
 *
 * Form number: FIA/500b · Revision 07/2017
 * Agency: Maryland Department of Human Services, Family Investment
 *   Administration (FIA). Used by Local Departments of Social Services
 *   (LDSS) to verify ABAWD work-activity participation including
 *   "Volunteering at a non-profit organization" (MD SNAP Manual §106.6.D,
 *   §106.9.A).
 *
 * Sources:
 *   Form PDF — https://dhs.maryland.gov/documents/DHS%20Forms/FIA%20Forms/English/Other-Forms/DHS-FIA%20500%20Medical%20Report%20Form/0500-B%20Verification%20of%20Activity%20Participation%20Form.pdf
 *   Manual   — https://dhs.maryland.gov/documents/FIA/Manuals/Supplemental%20Nutrition%20Assistance%20Program%20(SNAP)/106%20ABAWDS/106-ABAWDS-SEPT-2025.docx.pdf
 *   Portal   — https://mymdthink.maryland.gov
 *
 * Layout mirrors the actual rendered FIA/500b — two numbered activity
 * blocks (Activity Type checkboxes · Org · Address · Supervisor · Hours
 * per week · attestation · sig) plus a bottom Participant block (Name ·
 * DOB · Last 4 SSN · Sig · Date). Activity #1 is populated from data;
 * Activity #2 is drawn blank for a second supervisor to fill later — the
 * form is explicit about supporting combined activity reporting.
 *
 * Workers-safe: no fs, no template loading.
 */
import { PDFDocument, StandardFonts, rgb, PDFFont } from "pdf-lib";
import type { StateFormData } from "./types";

const PAGE_W = 612;
const PAGE_H = 792;
const LEFT = 48;
const RIGHT = 564;
const INK = rgb(0.04, 0.04, 0.04);
const BAND = rgb(0.85, 0.86, 0.86);
const LINE_GREY = rgb(0.5, 0.5, 0.5);

export async function buildMDPdf(data: StateFormData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle("FIA/500b — Verification of Activity Participation");
  doc.setProducer("Tended");
  const page = doc.addPage([PAGE_W, PAGE_H]);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const reg = await doc.embedFont(StandardFonts.Helvetica);
  const ital = await doc.embedFont(StandardFonts.TimesRomanItalic);

  const T = (top: number) => PAGE_H - top;
  const draw = (text: string, x: number, top: number, font: PDFFont, size: number, color = INK) =>
    page.drawText(text, { x, y: T(top), size, font, color });

  const centered = (text: string, top: number, font: PDFFont, size: number) => {
    const w = font.widthOfTextAtSize(text, size);
    draw(text, (PAGE_W - w) / 2, top, font, size);
  };

  const labeled = (
    label: string,
    value: string | undefined,
    top: number,
    labelX: number,
    valX: number,
    valEnd: number,
    size = 10
  ) => {
    draw(label, labelX, top, bold, size);
    page.drawLine({
      start: { x: valX, y: T(top + 3) },
      end: { x: valEnd, y: T(top + 3) },
      thickness: 0.7,
      color: LINE_GREY,
    });
    if (value) draw(value, valX + 4, top, reg, size);
  };

  const checkbox = (x: number, top: number, label: string, checked = false) => {
    page.drawRectangle({ x, y: T(top + 9), width: 9, height: 9, borderColor: INK, borderWidth: 0.8 });
    if (checked) draw("X", x + 1.5, top - 0.5, bold, 9);
    draw(label, x + 14, top, reg, 9.5);
  };

  // ---- Header (single centered line, no DHS sub-line on the actual form) ----
  centered("FAMILY INVESTMENT ADMINISTRATION", 56, bold, 12);
  page.drawLine({ start: { x: LEFT, y: T(64) }, end: { x: RIGHT, y: T(64) }, thickness: 0.8, color: INK });

  // ---- Title ----
  centered("VERIFICATION OF ACTIVITY PARTICIPATION", 82, bold, 15);

  // ---- Intro ----
  const intro = [
    "To verify participation in an activity, this form must be completed and signed by BOTH the Participant",
    "and the Supervisor and can be used for combined activity reporting.",
  ];
  let y = 104;
  for (const ln of intro) {
    draw(ln, LEFT, y, reg, 10);
    y += 13;
  }
  // Single-line attestation checkbox.
  checkbox(LEFT, 134, "I take part in the activity or activities listed below.", true);

  // ---- Return to: Attn ----
  draw("Return to:  Attn:", LEFT, 156, bold, 10);
  page.drawLine({ start: { x: LEFT + 86, y: T(159) }, end: { x: RIGHT, y: T(159) }, thickness: 0.7, color: LINE_GREY });

  // Helper: draw one numbered activity block at a given top.
  // Returns the y offset of the block's bottom edge.
  const drawActivity = (n: 1 | 2, blockTop: number, filled: boolean): number => {
    // Number rule
    draw(`${n}.`, LEFT, blockTop, bold, 11);
    page.drawLine({
      start: { x: LEFT + 14, y: T(blockTop + 3) },
      end: { x: RIGHT, y: T(blockTop + 3) },
      thickness: 0.6,
      color: LINE_GREY,
    });

    // Activity-type checkbox row
    const cbTop = blockTop + 18;
    draw("Activity Type:", LEFT + 6, cbTop, bold, 9.5);
    let cbx = LEFT + 90;
    const types: { label: string; key: "Volunteer" | "Education" | "Job Readiness" | "Work"; gap: number }[] = [
      { label: "Volunteer", key: "Volunteer", gap: 92 },
      { label: "Education", key: "Education", gap: 92 },
      { label: "Job Readiness", key: "Job Readiness", gap: 110 },
      { label: "Work", key: "Work", gap: 90 },
    ];
    for (const t of types) {
      checkbox(cbx, cbTop, t.label, filled && t.key === "Volunteer");
      cbx += t.gap;
    }

    // Field group
    const labelX = LEFT + 6;
    const valX = LEFT + 132;
    const valEnd = RIGHT - 6;
    const orgName = filled ? data.orgName : "";
    const street = filled ? data.orgAddress[0] ?? "" : "";
    const cityLine = filled ? data.orgAddress[1] ?? "" : "";
    const supName = filled ? data.representativeName : "";
    const supPhone = filled ? data.orgPhone : "";
    labeled("Name of organization", orgName, cbTop + 22, labelX, valX, valEnd);
    labeled("Street Address", street, cbTop + 40, labelX, valX, valEnd);
    labeled("City / State / Zip", cityLine, cbTop + 58, labelX, valX, valEnd);
    labeled("Supervisor's name", supName, cbTop + 76, labelX, valX, valEnd);
    labeled("Supervisor's phone", supPhone, cbTop + 94, labelX, valX, valEnd);

    // Hours / days per week
    const hoursTop = cbTop + 114;
    draw("What are the individual's participation hours per week?", labelX, hoursTop, bold, 9.5);
    draw("(example: 8:00 a.m. to 1:00 p.m. / 3 days per week)", labelX, hoursTop + 12, ital, 9);
    page.drawLine({
      start: { x: labelX, y: T(hoursTop + 30) },
      end: { x: RIGHT - 6, y: T(hoursTop + 30) },
      thickness: 0.7,
      color: LINE_GREY,
    });
    if (filled) {
      // Tended logs monthly totals, not per-week schedules — render a derived
      // weekly average so the LDSS reviewer gets the answer pattern they expect.
      const wk = Math.round((data.hours / 4) * 10) / 10;
      draw(`Approx. ${wk} hours / week across the month of ${data.month}`, labelX + 2, hoursTop + 28, reg, 10);
    }

    // Attestation sentence
    const attTop = hoursTop + 46;
    const attest = [
      "My signature verifies that the information I have provided is true and correct and that the individual",
      "named below currently participates for the reported number of hours / days per week.",
    ];
    for (let i = 0; i < attest.length; i++) {
      draw(attest[i], labelX, attTop + i * 12, reg, 9);
    }

    // Supervisor signature + Date table
    const sigTop = attTop + 30;
    const sigBot = sigTop + 28;
    const midX = (LEFT + RIGHT) / 2 + 60;
    page.drawRectangle({
      x: LEFT,
      y: T(sigBot),
      width: RIGHT - LEFT,
      height: sigBot - sigTop,
      borderColor: INK,
      borderWidth: 0.7,
    });
    page.drawLine({ start: { x: midX, y: T(sigTop) }, end: { x: midX, y: T(sigBot) }, thickness: 0.7, color: INK });
    draw("Supervisor's Signature", LEFT + 4, sigTop + 8, reg, 8.5);
    draw("Date", midX + 4, sigTop + 8, reg, 8.5);
    if (filled) {
      if (data.signatureName) draw(data.signatureName, LEFT + 10, sigTop + 22, ital, 12);
      if (data.dateSigned) draw(data.dateSigned, midX + 8, sigTop + 22, reg, 10);
    }

    return sigBot;
  };

  // ---- Two activity blocks ----
  const block1Bottom = drawActivity(1, 178, true);
  const block2Bottom = drawActivity(2, block1Bottom + 14, false);

  // ---- Participant footer block (Name / DOB / Last 4 SSN / Sig / Date) ----
  const partTop = block2Bottom + 16;
  page.drawRectangle({ x: LEFT, y: T(partTop + 14), width: RIGHT - LEFT, height: 18, color: BAND });
  draw("PARTICIPANT INFORMATION", LEFT + 6, partTop + 11, bold, 10);

  const partLabelX = LEFT + 6;
  const partValX = LEFT + 80;
  const partValEnd = (LEFT + RIGHT) / 2 - 8;
  const partValX2 = (LEFT + RIGHT) / 2 + 64;
  const partValEnd2 = RIGHT - 6;
  // Row 1: Name (full row)
  labeled("Name", data.participantName, partTop + 34, partLabelX, partValX, partValEnd2, 10);
  // Row 2: DOB | Last 4 SSN — Last 4 SSN is on the official form but not in
  // the Tended data model; the line is drawn blank for the recipient to fill.
  labeled("D.O.B.", data.birthdate, partTop + 56, partLabelX, partValX, partValEnd, 10);
  draw("Last 4 SSN", partValEnd + 24, partTop + 56, bold, 10);
  page.drawLine({
    start: { x: partValX2, y: T(partTop + 59) },
    end: { x: partValEnd2, y: T(partTop + 59) },
    thickness: 0.7,
    color: LINE_GREY,
  });
  // Row 3: Participant Signature | Date Signed (sig table)
  const psigTop = partTop + 76;
  const psigBot = psigTop + 28;
  page.drawRectangle({
    x: LEFT,
    y: T(psigBot),
    width: RIGHT - LEFT,
    height: psigBot - psigTop,
    borderColor: INK,
    borderWidth: 0.7,
  });
  const sigMidX = (LEFT + RIGHT) / 2 + 60;
  page.drawLine({ start: { x: sigMidX, y: T(psigTop) }, end: { x: sigMidX, y: T(psigBot) }, thickness: 0.7, color: INK });
  draw("Participant's Signature", LEFT + 4, psigTop + 8, reg, 8.5);
  draw("Date", sigMidX + 4, psigTop + 8, reg, 8.5);
  // Participant signature isn't carried by the Tended data model — leave blank
  // for the recipient to sign before submission.

  // ---- Footer ----
  page.drawLine({ start: { x: LEFT, y: T(770) }, end: { x: RIGHT, y: T(770) }, thickness: 0.6, color: INK });
  draw("FIA/500b   Revised 07/2017", LEFT, 781, reg, 9);
  const submit = "Return completed form to your LDSS (mail · fax · in-person) or upload via mymdthink.maryland.gov";
  draw(submit, LEFT, 793, reg, 8);

  return doc.save();
}
