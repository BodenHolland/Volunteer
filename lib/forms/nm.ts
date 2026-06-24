/** New Mexico HCA ABAWD 002, Verification of Volunteer Hours (rev. 01/22/2026). */
import { PDFDocument, type PDFFont, StandardFonts, rgb } from "pdf-lib";
import type { StateFormData } from "./types";

const W = 612;
const H = 792;
const L = 72;
const R = 540;
const INK = rgb(0.04, 0.04, 0.04);
const BLUE = rgb(0, 0.31, 0.45);

export async function buildNMPdf(data: StateFormData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle("Verification of Volunteer Hours - ABAWD 002");
  pdf.setAuthor("New Mexico Health Care Authority");
  pdf.setProducer("Tended");
  const reg = await pdf.embedFont(StandardFonts.TimesRoman);
  const bold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const t = (top: number) => H - top;
  const page = pdf.addPage([W, H]);
  const draw = (value: string, x: number, top: number, font: PDFFont = reg, size = 11, color = INK) =>
    page.drawText(value, { x, y: t(top), font, size, color });
  const line = (x1: number, top: number, x2: number, width = .6) =>
    page.drawLine({ start: { x: x1, y: t(top) }, end: { x: x2, y: t(top) }, thickness: width, color: rgb(.3, .3, .3) });
  const vline = (x: number, top1: number, top2: number, width = .6) =>
    page.drawLine({ start: { x, y: t(top1) }, end: { x, y: t(top2) }, thickness: width, color: rgb(.3, .3, .3) });
  const table = (x: number, top: number, width: number, height: number) =>
    page.drawRectangle({ x, y: t(top + height), width, height, borderColor: rgb(.3, .3, .3), borderWidth: .65 });

  // A compact vector rendition of the HCA's Zia sun mark; it avoids a runtime
  // asset dependency while retaining the official form's prominent color cue.
  const cx = 132, cy = t(126);
  for (let i = 0; i < 4; i++) {
    const horizontal = i % 2 === 0;
    const sign = i < 2 ? -1 : 1;
    if (horizontal) page.drawRectangle({ x: cx + sign * 21 - 12, y: cy - 3, width: 18, height: 6, color: rgb(0, .65, .78) });
    else page.drawRectangle({ x: cx - 3, y: cy + sign * 21 - 12, width: 6, height: 18, color: rgb(0, .65, .78) });
  }
  page.drawCircle({ x: cx, y: cy, size: 15, color: rgb(.95, .75, .08), borderColor: rgb(0, .65, .78), borderWidth: 2 });
  page.drawCircle({ x: cx, y: cy, size: 9, color: rgb(1, 1, 1) });
  draw("H E A L T H   C A R E", 82, 171, reg, 14, rgb(.2, .2, .2));
  draw("A U T H O R I T Y", 104, 186, reg, 8.5, rgb(.2, .2, .2));

  draw("VERIFICATION OF VOLUNTEER HOURS", 142, 234, reg, 16, BLUE);
  draw("This form can be a tool to help you track your volunteer hours for your work requirements. This", L, 253, reg, 11.5);
  draw("form is not mandatory.", L, 268, reg, 11.5);
  draw("not", 109, 268, bold, 11.5);
  // Section 1.
  page.drawRectangle({ x: L, y: t(308), width: 260, height: 14, color: rgb(.86, .86, .86) });
  draw("SECTION 1. SNAP PARTICIPANT INFORMATION", L, 292, bold, 11.5);
  draw("Fill out this section. This lets your volunteer hours be counted.", L, 307, reg, 11.5);
  table(L, 326, 468, 29);
  vline(248, 326, 355); vline(395, 326, 355);
  draw("Individual Name:", L + 7, 338, reg, 11); draw("Case Number", 254, 338, reg, 11); draw("Phone Number", 401, 338, reg, 11);
  draw(data.participantName, L + 7, 351, reg, 8.5); draw(data.caseNumber ?? "", 254, 351, reg, 8.5); draw(data.participantPhone ?? "", 401, 351, reg, 8.5);

  // Section 2.
  page.drawRectangle({ x: L, y: t(386), width: 285, height: 14, color: rgb(.86, .86, .86) });
  draw("SECTION 2. VOLUNTEER ACTIVITY INFORMATION", L, 370, bold, 11.5);
  draw("Fill in this part to verify hours. Provide all information. This will help process your case more", L, 385, reg, 11.5);
  draw("quickly.", L, 400, reg, 11.5);
  const top = 419, headerH = 43, rowH = 19, cols = [72, 173, 272, 379, 468, 540];
  table(L, top, 468, headerH + rowH * 8);
  cols.slice(1, -1).forEach((x) => vline(x, top, top + headerH + rowH * 8));
  line(L, top + headerH, R);
  for (let row = 1; row < 8; row++) line(L, top + headerH + row * rowH, R);
  [
    ["Date", "Completed"], ["Number of", "Hours", "Completed"], ["Organization"], ["Printed Name", "of Person", "Verifying Hours"], ["Phone Number", "of Person", "Verifying Hours"],
  ].forEach((words, index) => {
    const x = cols[index], width = cols[index + 1] - cols[index];
    words.forEach((word, row) => draw(word, x + (width - bold.widthOfTextAtSize(word, 10.5)) / 2, top + 13 + row * 13, bold, 10.5));
  });
  // Tended stores a monthly measured total rather than daily logs.  Place the
  // reporting month in the first official row and leave the other rows blank.
  const rowTop = top + headerH + 13;
  draw(data.month, cols[0] + 5, rowTop, reg, 8.2);
  draw(String(data.hours), cols[1] + 8, rowTop, reg, 9);
  draw(data.orgName, cols[2] + 4, rowTop, reg, 7.3);
  draw(data.representativeName, cols[3] + 4, rowTop, reg, 7.3);
  draw(data.orgPhone, cols[4] + 4, rowTop, reg, 7.3);

  draw("You can turn in this form online. You can upload it to your account at https://yes.nm.gov. You can", L, 655, reg, 10.8);
  draw("fax it to 1-855-804-8960. You can mail it to: Central ASPEN Scanning, PO Box 830, Bernalillo,", L, 670, reg, 10.8);
  draw("NM 87004. You can bring it in person to your local ISD office.", L, 685, reg, 10.8);
  draw("ABAWD 002 Revised 1/22/2026", L, 748, reg, 10.5);
  return pdf.save();
}
