/** Vermont Economic Services Division 218-WFV (revised 09/2024). */
import { PDFDocument, PDFFont, StandardFonts, rgb } from "pdf-lib";
import type { StateFormData } from "./types";

const W = 612;
const H = 792;
const L = 50;
const R = 562;
const INK = rgb(0, 0, 0);

export async function buildVTPdf(data: StateFormData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle("218-WFV - Workfare Verification Form");
  doc.setProducer("Tended");
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const T = (top: number) => H - top;
  const page = doc.addPage([W, H]);
  const text = (p: typeof page, value: string, x: number, top: number, size = 10, font: PDFFont = regular) => p.drawText(value, { x, y: T(top), size, font, color: INK });
  const rule = (p: typeof page, x1: number, top: number, x2: number, thickness = .55) => p.drawLine({ start: { x: x1, y: T(top) }, end: { x: x2, y: T(top) }, thickness, color: INK });
  const rect = (p: typeof page, x: number, top: number, width: number, height: number) => p.drawRectangle({ x, y: T(top + height), width, height, borderColor: INK, borderWidth: .55 });
  const center = (p: typeof page, value: string, top: number, size: number, font: PDFFont = regular) => text(p, value, (W - font.widthOfTextAtSize(value, size)) / 2, top, size, font);
  const lineField = (p: typeof page, label: string, value: string, x: number, top: number, lineStart: number, lineEnd: number) => { text(p, label, x, top, 10); rule(p, lineStart, top + 3, lineEnd); if (value) text(p, value, lineStart + 3, top, 10); };

  // Header closely follows the official form's small Vermont mark and barcode.
  text(page, "⌁", L, 46, 38, bold);
  text(page, "VERMONT", 108, 48, 23, regular);
  text(page, "Department for Children and Families", L, 74, 8);
  text(page, "Economic Services Division", L, 86, 8);
  for (let x = 440; x < 552; x += 4) page.drawLine({ start: { x, y: T(25) }, end: { x, y: T(50) }, thickness: x % 8 === 0 ? 1.7 : .75, color: INK });
  text(page, "218-WFV  (218AR in OnBase)", 448, 67, 8.5);
  center(page, "Workfare Verification Form", 113, 13, bold);

  lineField(page, "Customer name:", data.participantName, 64, 145, 158, 406);
  lineField(page, "Last 4 of SSN:", "", 410, 145, 488, 562);
  lineField(page, "Customer phone number:", data.participantPhone ?? "", 64, 172, 176, 394);
  lineField(page, "Number of hours customer must complete:", "", 64, 199, 300, 364);
  text(page, "You must provide the information to Economic Services at your initial approval and recertification.", 64, 229, 9.8, bold);

  const tableX = 118, tableY = 248, tableW = 370, split = 304, rowH = 23;
  rect(page, tableX, tableY, tableW, rowH * 13);
  rule(page, split, tableY, split);
  for (let i = 1; i < 13; i += 1) rule(page, tableX, tableY + i * rowH, tableX + tableW);
  center(page, "Month\\Year", tableY + 14, 10, bold);
  text(page, "Hours volunteered in month", split + 29, tableY + 14, 10, bold);
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const selectedMonth = (data.month || "").split(" ")[0].toLowerCase();
  months.forEach((month, index) => {
    const top = tableY + rowH * (index + 1) + 15;
    const label = `${month}, 20________`;
    text(page, label, tableX + 49, top, 10);
    if (month.toLowerCase() === selectedMonth) text(page, String(data.hours), split + 32, top, 10, bold);
  });
  text(page, "If this is your first month volunteering, are you planning to continue volunteering at this", 64, 569, 9.7);
  text(page, "volunteer site moving forward?", 64, 584, 9.7);
  rect(page, 280, 576, 11, 11); text(page, "Yes", 298, 584, 9.5);
  rect(page, 328, 576, 11, 11); text(page, "No", 346, 584, 9.5);
  rule(page, 64, 610, R, 1.2);
  text(page, "To be completed by local organization staff after completion of monthly volunteer hours.", 64, 623, 9.7, bold);
  lineField(page, "Organization Name:", data.orgName, 64, 649, 167, R);
  lineField(page, "Organization Address:", data.orgAddress.filter(Boolean).join(", "), 64, 676, 176, R);
  lineField(page, "Supervisor Name:", data.representativeName, 64, 703, 150, 330);
  lineField(page, "Organization Phone#:", data.orgPhone, 335, 703, 438, R);
  text(page, "Is your organization a non-profit?", 76, 728, 9.7);
  rect(page, 280, 720, 11, 11); text(page, "Yes", 298, 728, 9.5);
  rect(page, 328, 720, 11, 11); text(page, "No", 346, 728, 9.5);
  lineField(page, "Printed name of volunteer supervisor:", data.representativeName, 64, 758, 258, R);
  // Page one matches the official static reverse-side information and keeps
  // the supervisor signature genuinely blank for an authorized signer.
  const p2 = doc.addPage([W, H]);
  center(p2, "Workfare Frequently Asked Questions", 59, 14, bold);
  const faq: Array<[string, string[]]> = [
    ["What is Workfare?", ["• Workfare is a program in which individuals receiving 3SquaresVT benefits can fulfill their work", "requirements by volunteering for a predetermined number of hours per month at a non-profit", "organization. Individuals must find their own volunteer sites."]],
    ["What are the work requirements?", ["• Individuals who are age 18 or over and under 55 are limited to three months of 3SquaresVT benefits in", "a three-year period unless they are working, participating in a work training program, or participating in Workfare.", "Some individuals are exempt from this requirement, such as those who live with children, individuals", "determined to be unfit for work, and pregnant women."]],
    ["Where can I volunteer?", ["• Individuals can volunteer at any non-profit public or private organization."]],
    ["What is a non-profit organization?", ["• A non-profit organization is an organization which does not give its income to owners or shareholders.", "It uses its income to achieve its purpose or mission."]],
    ["What are examples of non-profit organizations in Vermont?", ["• Lake Champlain International (LCI), Humane Society, Ronald McDonald House, Camp Ta-Kum-Ta,", "American Legion, churches, public municipalities, local food shelves. For more information on nonprofit", "organizations in your area contact Vermont 211."]],
    ["I found a non-profit volunteer site; now what do I do?", ["• Once you have found a non-profit volunteer site and you have completed enough volunteering hours to", "fulfill your monthly work requirement, complete the reverse side of this form. A supervisor or member of", "the non-profit organization staff will need to sign this form, and then you must submit the completed", "form to Economic Services."]],
    ["How often do I need to provide these forms to Economic Services?", ["• You will need to provide this form after you complete your first month of volunteering and meet your", "work requirement. Additionally, you will need to provide this form at your next recertification interview."]],
  ];
  let y = 94;
  faq.forEach(([question, lines]) => { text(p2, question, L, y, 10, bold); y += 16; lines.forEach((line) => { text(p2, line, L, y, 9.4); y += 13; }); y += 12; });
  center(p2, "For more information about Workfare please visit your local Economic Services office", 722, 9.2);
  center(p2, "or call 1-800-479-6151", 737, 9.2);
  text(p2, "Revised 09/2024", 500, 770, 8);
  text(p2, "218-WFV", 64, 770, 8);
  return doc.save();
}
