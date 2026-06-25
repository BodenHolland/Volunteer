/**
 * Rhode Island DHS-SNAP-ABAWD-3, ABAWD Combined Activity Reporting Form
 * (Rev. 12.8.25).
 *
 * This is drawn from the public form's layout rather than using the PDF as a
 * runtime template, which keeps it deployable in Cloudflare Workers.
 */
import { PDFDocument, PDFFont, StandardFonts, rgb } from "pdf-lib";
import type { StateFormData } from "./types";

const W = 612;
const H = 792;
const L = 36;
const R = 576;
const INK = rgb(0, 0, 0);
const GREY = rgb(0.82, 0.82, 0.82);

export async function buildRIPdf(data: StateFormData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle("DHS-SNAP-ABAWD-3 - ABAWD Combined Activity Reporting Form");
  doc.setProducer("Tended");
  const page = doc.addPage([W, H]);
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const italic = await doc.embedFont(StandardFonts.HelveticaOblique);
  const T = (top: number) => H - top;
  const text = (value: string, x: number, top: number, size = 10, font: PDFFont = regular) =>
    page.drawText(value, { x, y: T(top), size, font, color: INK });
  const rule = (x1: number, top: number, x2: number, thickness = 0.55) =>
    page.drawLine({ start: { x: x1, y: T(top) }, end: { x: x2, y: T(top) }, thickness, color: INK });
  const box = (x: number, top: number, width: number, height: number, fill?: ReturnType<typeof rgb>) =>
    page.drawRectangle({ x, y: T(top + height), width, height, borderColor: INK, borderWidth: 0.55, ...(fill ? { color: fill } : {}) });
  const center = (value: string, top: number, size: number, font: PDFFont = regular) =>
    text(value, (W - font.widthOfTextAtSize(value, size)) / 2, top, size, font);

  // The seal is deliberately simple, but keeps the public form's centered
  // visual anchor without embedding a state-owned PDF/image asset.
  page.drawCircle({ x: 306, y: T(54), size: 24, borderColor: rgb(0.52, 0.33, 0.08), borderWidth: 1.5 });
  page.drawCircle({ x: 306, y: T(54), size: 18, borderColor: rgb(0.52, 0.33, 0.08), borderWidth: 0.7 });
  center("RI DHS", 57, 7, bold);
  text("DHS-SNAP-ABAWD-3", 505, 19, 8.3);
  text("Rev. 12.8.25", 505, 31, 8.3);
  center("RHODE ISLAND DEPARTMENT OF HUMAN SERVICES", 116, 13, bold);
  center("ABAWD Combined Activity Reporting Form", 134, 12.5, bold);

  text("Section 1: Participant Information", L, 160, 11, bold);
  text("Name:", L, 184, 10);
  rule(68, 187, R);
  text(data.participantName, 72, 184, 10);
  text("Address:", L, 212, 10);
  rule(84, 215, R);
  text(data.participantAddress.filter(Boolean).join(", "), 88, 212, 10);
  text("Phone Number:", L, 239, 10);
  rule(111, 242, 192);
  text(data.participantPhone ?? "", 115, 239, 10);
  text("RI Bridges Case # (if known):", 196, 239, 9.5);
  rule(350, 242, 422);
  text(data.caseNumber ?? "", 353, 239, 9.5);
  text("Email (optional):", 426, 239, 9);
  rule(510, 242, R);

  text("Section 2: Work / School / Training / Volunteer Activity Log", L, 271, 11, bold);
  const intro = [
    "This form, which must be provided to the agencies you are working with and signed by you and the agency supervisor as",
    "verification of your participation, must be returned by you at your application, interim or recertification. Activity hours that you",
    "report and verify will count towards your required 80 monthly hours. Changes to those hours must be reported to the",
    "Department of Human Services within 10 days.",
  ];
  intro.forEach((line, index) => text(line, L, 291 + index * 12.5, 8.9));
  text("Under penalty of perjury, I attest that all the information contained in this form is true. I understand that I am", L, 348, 9.4, italic);
  text("breaking the law if I give false information and can be punished under federal law, state law, or both.", L, 360, 9.4, italic);

  const tableTop = 375;
  const cols = [L, 136, 346, 454, R];
  const rowH = 19;
  box(L, tableTop, R - L, rowH * 8, GREY);
  // Restore white body rows after the gray header.
  page.drawRectangle({ x: L + .55, y: T(tableTop + rowH * 8) + .55, width: R - L - 1.1, height: rowH * 7 - 1.1, color: rgb(1, 1, 1) });
  cols.slice(1, -1).forEach((x) => page.drawLine({ start: { x, y: T(tableTop) }, end: { x, y: T(tableTop + rowH * 8) }, thickness: .55, color: INK }));
  for (let i = 1; i < 8; i += 1) rule(L, tableTop + rowH * i, R);
  const heads = ["Activity Type", "Location", "Total Hours/Month", "Supervisor Signature"];
  heads.forEach((head, index) => text(head, cols[index] + (cols[index + 1] - cols[index] - bold.widthOfTextAtSize(head, 8.4)) / 2, tableTop + 13, 8.4, bold));
  const activity = data.positionDescription || "Volunteer activity";
  text(activity.slice(0, 22), cols[0] + 4, tableTop + rowH + 13, 8.5);
  text(data.orgName.slice(0, 42), cols[1] + 4, tableTop + rowH + 13, 8.5);
  text(String(data.hours), cols[2] + 9, tableTop + rowH + 13, 9, bold);
  // The official form calls for a handwritten supervisor signature. Do not
  // prefill that attestation from account data.
  center("(You may attach another sheet for additional entries)", 535, 8.2, italic);

  text("Section 3: Certification", L, 559, 11, bold);
  text("Under penalty of perjury, I attest that all the information contained in this form is true. I understand that I am", L, 583, 9.4, italic);
  text("breaking the law if I give false information and can be punished under federal law, state law, or both.", L, 595, 9.4, italic);
  text("Participant Signature:", L, 618, 9.5);
  rule(130, 621, 391);
  text("Date:", 402, 618, 9.5);
  rule(430, 621, R);

  text("Section 4: Submission Instructions", L, 646, 11, bold);
  text("Submit the completed and signed form through the following pathways:", L, 668, 9.2);
  const instructions = [
    "- Mail to RI Department of Human Services, P.O. Box 8709, Cranston, RI 02920-8787;",
    "- Drop off in person or at a Drop Box Office location listed at https://dhs.ri.gov/about-us/dhs-offices;",
    "- Log in and upload to your Customer Portal account at http://www.healthyrhode.ri.gov; or",
    "- Access through the HealthyRhode Mobile App in the APP store or Google Play",
    "For questions, call: 1-855-MY-RIDHS (1-855-697-4347)",
    "Note: If you are applying or recertifying at this time, you may submit this completed and signed form with your DHS",
    "application or renewal documents.",
  ];
  instructions.forEach((line, index) => text(line, L, 684 + index * 11.3, 8.2));
  center("Page 1 of 1", 776, 8.3);
  return doc.save();
}
