/** New York OTDA Monthly ABAWD Volunteer Participation Record (Attachment 5).
 *
 * Rendered via the shared form engine. NOTE: this form deliberately does NOT
 * print data.signatureName — the program-staff attestation requires a real
 * signature, and a PDF cannot substitute for it. This behavior is preserved as
 * an explicit policy (showSignatureName = false). See the report's
 * signature-name divergence note.
 */
import { createForm, palette } from "./state-form";
import type { StateFormData } from "./types";

const L = 60;
const R = 550;

/** This form intentionally omits the prefilled signature name (legal attestation). */
const SHOW_SIGNATURE_NAME = false;

export async function buildNYPdf(data: StateFormData): Promise<Uint8Array> {
  const f = await createForm({ title: "Monthly ABAWD Volunteer Participation Record" });
  const { ink } = palette;

  const draw = (p: ReturnType<typeof f.addPage>, v: string, x: number, top: number, size = 10, b = false) =>
    p.text(v, x, top, { font: b ? f.bold : f.reg, size });
  const box = (p: ReturnType<typeof f.addPage>, x: number, top: number, w = 19, h = 18) =>
    p.rect(x, top, w, h, { border: ink, borderWidth: 1 });
  const field = (p: ReturnType<typeof f.addPage>, label: string, value: string, top: number, x = L, end = R) => {
    p.text(label, x, top, { size: 10.8 });
    const sx = x + f.reg.widthOfTextAtSize(label, 10.8) + 5;
    p.line(sx, top + 3, end, 0.55, ink);
    if (value) p.text(value, sx + 3, top, { size: 10.5 });
  };

  // ---- Page 1 ----
  const p1 = f;
  draw(p1, "Monthly ABAWD Volunteer Participation Record", L, 100, 14.2, true);
  draw(p1, "Instructions", L, 125, 12.7, true);
  let y = 143;
  [
    "Able-Bodied Adults Without Dependents (ABAWDs) who aren't working or in an education or training program can meet federal ABAWD work rules by volunteering in community service activities. You don't need to fill out this form if you are exempt from the federal ABAWD work rules.",
    "To find out how many hours that you need to volunteer each month, divide your monthly SNAP benefit by the current New York State minimum wage for your area. For example, if you get $155 per month in SNAP and you live upstate where the minimum wage is $15.50, then you must volunteer for 10 hours per month. If you need help figuring out your hours, contact your local social services district.",
    "If you're already volunteering or want to start, take this form to a non-profit or public organization after the end of each month. Ask them to complete Part 2 of this form.",
    "You must give this completed form to your local social services district by the 10th of the month following the month(s) that you participate in the community service program to prove you're meeting the federal ABAWD work rules. If you don't submit proof of your participation, you may lose your SNAP benefits.",
    "To make sure that a community service program meets the federal ABAWD work rules or to find a program, reach out to your local social services district. Note that the community service program cannot be part of a candidate's campaign for public office.",
    "If something stops you from attending your community service program, inform your local social services district about the reason and the date(s) you couldn't attend.",
  ].forEach((paragraph, i) => { y = p1.wrap(paragraph, L, y, R - L, { size: 11.1, leading: 14.5 }); y += i === 5 ? 6 : 9; });
  draw(p1, "Part 1: To be completed by the Participant", L, y, 12.2, true); y += 26;
  field(p1, "Participant name:", data.participantName, y); y += 25;
  field(p1, "Case #:", data.caseNumber ?? "", y, L, 270); field(p1, "County:", "", y, 313, R); y += 25;
  field(p1, "Address:", data.participantAddress.filter(Boolean).join(", "), y); y += 67;
  p1.rect(53, y, 497, 77, { border: ink, borderWidth: 0.6 });
  draw(p1, "Participant Authorization", L, y + 16, 11.6, true);
  draw(p1, "I authorize the release of requested volunteer/community service program information", L, y + 39, 10.7);
  draw(p1, "to the Department of Social Services.", L, y + 54, 10.7);
  field(p1, "Participant signature:", "", y + 70, L, 430); field(p1, "Date:", "", y + 70, 416, R);

  // ---- Page 2 ----
  const p2 = f.addPage();
  let p = 100;
  draw(p2, "Part 2: To be completed by the Volunteer/Community Service Program Staff", L, p, 12.2, true); p += 25;
  field(p2, "Program name:", data.positionDescription ?? "", p); p += 24;
  field(p2, "Organization name:", data.orgName, p); p += 24;
  field(p2, "Organization address:", data.orgAddress.filter(Boolean).join(", "), p); p += 25;
  draw(p2, "Is this organization public or non-profit?", L, p, 10.8);
  box(p2, 337, p - 13); draw(p2, "Public", 362, p, 10.8); box(p2, 431, p - 13); draw(p2, "Non-Profit", 456, p, 10.8); box(p2, 537, p - 13); draw(p2, "Other", 562, p, 10.8);
  draw(p2, "X", 434, p - 2, 12, true);  // Non-Profit
  p += 70;
  field(p2, "Date participant began or will begin program:", data.startDate ?? "", p); p += 24;
  field(p2, "Report month/year (previous month):", data.month, p); p += 24;
  draw(p2, "Is the participant still volunteering in the program?", L, p, 10.8); box(p2, 59, p + 10); draw(p2, "Yes", 84, p + 22, 10.8); box(p2, 117, p + 10); draw(p2, "No", 142, p + 22, 10.8);
  draw(p2, "X", 62, p + 20, 12, true);  // Yes — ongoing
  p += 66;
  field(p2, "Date participant expects to complete program:", "", p); p += 27;
  draw(p2, "If the participant is already volunteering in the program, indicate how many hours per", L, p, 10.8); draw(p2, "month they have completed below:", L, p + 15, 10.8); p += 42;
  draw(p2, "Month/Year", L, p, 11.5, true); draw(p2, "Hours Completed", 360, p, 11.5, true); p2.line(L, p + 17, 260, 0.55, ink); p2.line(360, p + 17, 495, 0.55, ink); draw(p2, data.month, L + 3, p + 14, 10.5); draw(p2, String(data.hours), 363, p + 14, 10.5); p += 125;
  p2.rect(53, p, 497, 163, { border: ink, borderWidth: 0.6 });
  draw(p2, "Program Certification", L, p + 16, 11.7, true);
  p2.wrap("I certify that the participant listed in Part 1 is currently volunteering in the program described above.", L, p + 40, 465, { size: 10.7, leading: 14 });
  field(p2, "Signature of program staff:", "", p + 87, L, 400); field(p2, "Date:", "", p + 87, 397, R);
  field(p2, "Printed name of program staff:", data.representativeName, p + 111, L, R);
  field(p2, "Telephone:", data.orgPhone, p + 135, L, R);
  field(p2, "Title of program staff:", data.representativeTitle ?? "", p + 159, L, R);
  // data.signatureName is deliberately not rendered (see SHOW_SIGNATURE_NAME).
  void SHOW_SIGNATURE_NAME;
  return f.save();
}
