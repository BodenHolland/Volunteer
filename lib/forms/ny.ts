/** New York OTDA Monthly ABAWD Volunteer Participation Record (Attachment 5). */
import { PDFDocument, PDFFont, StandardFonts, rgb } from "pdf-lib";
import type { StateFormData } from "./types";

const W = 612;
const H = 792;
const L = 60;
const R = 550;
const ink = rgb(0.04, 0.04, 0.04);

export async function buildNYPdf(data: StateFormData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle("Monthly ABAWD Volunteer Participation Record");
  doc.setProducer("colift");
  const reg = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const italic = await doc.embedFont(StandardFonts.TimesRomanItalic);
  const T = (top: number) => H - top;
  const newPage = () => {
    const page = doc.addPage([W, H]);
    page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: rgb(1, 1, 1) });
    return page;
  };
  const p1 = newPage();
  const draw = (p: typeof p1, value: string, x: number, top: number, size = 10, font: PDFFont = reg) => p.drawText(value, { x, y: T(top), size, font, color: ink });
  const line = (p: typeof p1, x1: number, top: number, x2: number, thickness = .55) => p.drawLine({ start: { x: x1, y: T(top) }, end: { x: x2, y: T(top) }, thickness, color: ink });
  const wrap = (p: typeof p1, value: string, x: number, top: number, maxWidth: number, size: number, leading: number, font: PDFFont = reg) => {
    const words = value.split(/\s+/); let current = ""; let y = top;
    for (const word of words) { const next = current ? `${current} ${word}` : word; if (font.widthOfTextAtSize(next, size) > maxWidth && current) { draw(p, current, x, y, size, font); y += leading; current = word; } else current = next; }
    if (current) { draw(p, current, x, y, size, font); y += leading; }
    return y;
  };
  const box = (p: typeof p1, x: number, top: number, width = 19, height = 18) => p.drawRectangle({ x, y: T(top + height), width, height, borderColor: ink, borderWidth: 1 });
  const field = (p: typeof p1, label: string, value: string, top: number, x = L, end = R) => { draw(p, label, x, top, 10.8); line(p, x + reg.widthOfTextAtSize(label, 10.8) + 5, top + 3, end); if (value) draw(p, value, x + reg.widthOfTextAtSize(label, 10.8) + 8, top, 10.5); };

  draw(p1, "Monthly ABAWD Volunteer Participation Record", L, 100, 14.2, bold);
  draw(p1, "Instructions", L, 125, 12.7, bold);
  let y = 143;
  [
    "Able-Bodied Adults Without Dependents (ABAWDs) who aren't working or in an education or training program can meet federal ABAWD work rules by volunteering in community service activities. You don't need to fill out this form if you are exempt from the federal ABAWD work rules.",
    "To find out how many hours that you need to volunteer each month, divide your monthly SNAP benefit by the current New York State minimum wage for your area. For example, if you get $155 per month in SNAP and you live upstate where the minimum wage is $15.50, then you must volunteer for 10 hours per month. If you need help figuring out your hours, contact your local social services district.",
    "If you're already volunteering or want to start, take this form to a non-profit or public organization after the end of each month. Ask them to complete Part 2 of this form.",
    "You must give this completed form to your local social services district by the 10th of the month following the month(s) that you participate in the community service program to prove you're meeting the federal ABAWD work rules. If you don't submit proof of your participation, you may lose your SNAP benefits.",
    "To make sure that a community service program meets the federal ABAWD work rules or to find a program, reach out to your local social services district. Note that the community service program cannot be part of a candidate's campaign for public office.",
    "If something stops you from attending your community service program, inform your local social services district about the reason and the date(s) you couldn't attend.",
  ].forEach((paragraph, i) => { y = wrap(p1, paragraph, L, y, R - L, 11.1, 14.5); y += i === 5 ? 6 : 9; });
  draw(p1, "Part 1: To be completed by the Participant", L, y, 12.2, bold); y += 26;
  field(p1, "Participant name:", data.participantName, y); y += 25;
  field(p1, "Case #:", data.caseNumber ?? "", y, L, 270); field(p1, "County:", "", y, 313, R); y += 25;
  field(p1, "Address:", data.participantAddress.filter(Boolean).join(", "), y); y += 67;
  p1.drawRectangle({ x: 53, y: T(y + 77), width: 497, height: 77, borderColor: ink, borderWidth: .6 });
  draw(p1, "Participant Authorization", L, y + 16, 11.6, bold);
  draw(p1, "I authorize the release of requested volunteer/community service program information", L, y + 39, 10.7);
  draw(p1, "to the Department of Social Services.", L, y + 54, 10.7);
  field(p1, "Participant signature:", "", y + 70, L, 430); field(p1, "Date:", "", y + 70, 416, R);

  const p2 = newPage();
  let p = 100;
  draw(p2, "Part 2: To be completed by the Volunteer/Community Service Program Staff", L, p, 12.2, bold); p += 25;
  field(p2, "Program name:", data.positionDescription ?? "", p); p += 24;
  field(p2, "Organization name:", data.orgName, p); p += 24;
  field(p2, "Organization address:", data.orgAddress.filter(Boolean).join(", "), p); p += 25;
  draw(p2, "Is this organization public or non-profit?", L, p, 10.8);
  box(p2, 337, p - 13); draw(p2, "Public", 362, p, 10.8); box(p2, 431, p - 13); draw(p2, "Non-Profit", 456, p, 10.8); box(p2, 537, p - 13); draw(p2, "Other", 562, p, 10.8); p += 70;
  field(p2, "Date participant began or will begin program:", data.startDate ?? "", p); p += 24;
  field(p2, "Report month/year (previous month):", data.month, p); p += 24;
  draw(p2, "Is the participant still volunteering in the program?", L, p, 10.8); box(p2, 59, p + 10); draw(p2, "Yes", 84, p + 22, 10.8); box(p2, 117, p + 10); draw(p2, "No", 142, p + 22, 10.8); p += 66;
  field(p2, "Date participant expects to complete program:", "", p); p += 27;
  draw(p2, "If the participant is already volunteering in the program, indicate how many hours per", L, p, 10.8); draw(p2, "month they have completed below:", L, p + 15, 10.8); p += 42;
  draw(p2, "Month/Year", L, p, 11.5, bold); draw(p2, "Hours Completed", 360, p, 11.5, bold); line(p2, L, p + 17, 260); line(p2, 360, p + 17, 495); draw(p2, data.month, L + 3, p + 14, 10.5); draw(p2, String(data.hours), 363, p + 14, 10.5); p += 125;
  p2.drawRectangle({ x: 53, y: T(p + 163), width: 497, height: 163, borderColor: ink, borderWidth: .6 });
  draw(p2, "Program Certification", L, p + 16, 11.7, bold);
  wrap(p2, "I certify that the participant listed in Part 1 is currently volunteering in the program described above.", L, p + 40, 465, 10.7, 14);
  field(p2, "Signature of program staff:", "", p + 87, L, 400); field(p2, "Date:", "", p + 87, 397, R);
  field(p2, "Printed name of program staff:", data.representativeName, p + 111, L, R);
  field(p2, "Telephone:", data.orgPhone, p + 135, L, R);
  field(p2, "Title of program staff:", data.representativeTitle ?? "", p + 159, L, R);
  // data.signatureName is deliberately not rendered: a PDF cannot substitute for a real attestation.
  void italic;
  return doc.save();
}
