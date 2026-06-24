/**
 * Nebraska DHHS "Volunteer Verify ABAWDx" / Work Verification Request.
 *
 * Re-drawn from the public 2/13/2019 form.  This intentionally uses no
 * source PDF at runtime: Workers only need pdf-lib and the data passed in.
 */
import { PDFDocument, PDFFont, StandardFonts, rgb } from "pdf-lib";
import type { StateFormData } from "./types";

const W = 612;
const H = 792;
const L = 65;
const R = 547;
const ink = rgb(0.06, 0.06, 0.06);
const teal = rgb(0, 0.35, 0.50);
const gold = rgb(0.96, 0.68, 0.13);

export async function buildNEPdf(data: StateFormData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle("Volunteer Verify ABAWDx - Work Verification Request");
  doc.setProducer("Tended");
  const page = doc.addPage([W, H]);
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: rgb(1, 1, 1) });
  const reg = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const italic = await doc.embedFont(StandardFonts.TimesRomanItalic);
  const T = (top: number) => H - top;
  const text = (value: string, x: number, top: number, size = 10, font: PDFFont = reg, color = ink) =>
    page.drawText(value, { x, y: T(top), size, font, color });
  const rule = (x1: number, top: number, x2: number, color = ink, width = 0.55) =>
    page.drawLine({ start: { x: x1, y: T(top) }, end: { x: x2, y: T(top) }, thickness: width, color });
  const fit = (value: string, font: PDFFont, size: number, width: number) => {
    let s = value;
    while (s && font.widthOfTextAtSize(s, size) > width) s = s.slice(0, -1);
    return s;
  };

  // Nebraska wordmark / agency lockup, reproduced as typography and rules.
  text("NEBRASKA", L, 64, 28, reg, teal);
  page.drawLine({ start: { x: L, y: T(72) }, end: { x: 286, y: T(61) }, thickness: 1.2, color: gold });
  text("Good Life. Great Mission.", L, 93, 17, reg, rgb(0.26, 0.51, 0.62));
  rule(L, 108, 260, gold, 1.35);
  text("DEPT. OF HEALTH AND HUMAN SERVICES", L, 123, 9.4, bold, teal);
  // A simple seal preserves the source form's visual balance without copying an image asset.
  page.drawCircle({ x: 504, y: T(67), size: 46, borderColor: rgb(0.42, 0.56, 0.65), borderWidth: 1.1 });
  page.drawCircle({ x: 504, y: T(67), size: 37, borderColor: rgb(0.42, 0.56, 0.65), borderWidth: 0.6 });
  text("STATE OF NEBRASKA", 463, 57, 6.2, bold, rgb(0.42, 0.56, 0.65));
  text("GREAT SEAL", 484, 70, 6.5, bold, rgb(0.42, 0.56, 0.65));
  text("Governor", 478, 123, 8.5, bold, rgb(0.42, 0.56, 0.65));

  const returnLines = [
    "Return to Nebraska Department of Health and Human Services",
    "Fax #: 402-742-2351",
    "Or Mail to P.O. Box 2992, Omaha NE 68172",
    "Or Email to DHHS.ANDICenter@nebraska.gov",
  ];
  returnLines.forEach((line, i) => text(line, R - reg.widthOfTextAtSize(line, 10.2), 141 + i * 13, 10.2));
  text("DATE:", 65, 205, 10.4);
  text(data.dateSigned, 104, 205, 10.4);

  const title = "Work Verification Request";
  text(title, (W - bold.widthOfTextAtSize(title, 14.5)) / 2, 258, 14.5, bold);
  page.drawRectangle({ x: 66, y: T(315), width: 480, height: 42, borderColor: ink, borderWidth: 0.7 });
  text("NAME:", 72, 292, 10.4);
  text(fit(data.participantName, reg, 10.6, 292), 112, 292, 10.6);
  text("MC#:", 385, 292, 10.4);
  text(fit(data.caseNumber ?? "", reg, 10.6, 115), 416, 292, 10.6);

  [
    "The above individual has applied for or receives assistance from our Agency. In order to",
    "determine eligibility, we need to verify the following information. Your help is greatly",
    "appreciated.",
  ].forEach((line, i) => text(line, 72, 338 + i * 12.5, 10.2));

  const weekly = (Math.round((data.hours / 4.33) * 10) / 10).toString();
  text("The above named person is working", 72, 407, 10.5);
  rule(278, 410, 318); text(weekly, 281, 407, 10);
  text("hours per week starting", 325, 407, 10.5);
  rule(446, 410, 525); text(data.startDate ?? "", 449, 407, 9.4);
  text("This work is (circle one):", 110, 447, 10.3);
  [["Unpaid/volunteer work", true], ["In-kind (Work in exchange for rent or other services)", false], ["Paid employment", false]].forEach(([label, chosen], i) => {
    text("•", 94, 469 + i * 22, 11, bold);
    text(label as string, 116, 469 + i * 22, 10.3, chosen ? bold : reg);
    if (i === 1) rule(417, 472, 481);
  });
  text("Comments:", 72, 560, 10.2);
  rule(133, 562, 528); rule(112, 588, 536);
  if (data.positionDescription) text(fit(data.positionDescription, reg, 9.5, 388), 136, 560, 9.5);
  text("Thank you for providing this information.", 95, 614, 10.2);

  // Signature fields are intentionally blank. A stored name is not a signature.
  const sigX = 228;
  rule(sigX, 657, 418); text("Name", sigX, 668, 8.6);
  rule(sigX, 692, 418); text("Title", sigX, 703, 8.6);
  rule(sigX, 727, 418); text("Phone #", sigX, 738, 8.6);
  rule(sigX, 762, 418); text("Date", sigX, 773, 8.6);

  page.drawRectangle({ x: 38, y: 5, width: 536, height: 25, color: teal });
  page.drawRectangle({ x: 38, y: 27, width: 536, height: 6, color: gold });
  text("Helping People Live Better Lives", 173, 24, 7.5, italic, rgb(0.25, 0.45, 0.47));
  text("Updated 2/13/2019", 487, 24, 7.2, reg, rgb(1, 1, 1));
  return doc.save();
}
