/**
 * Massachusetts DTA ABAWD WPPR-EN (09-323-0917-05, rev. 04/2025).
 *
 * Two-page DTA form. Rendered via the shared form engine (Workers-safe — the
 * source PDF is never loaded at runtime). Folds in the latest Part-2 layout:
 * the APID value, the wrapped two-line "start date / hours" and "already
 * volunteering" questions with repositioned answer underlines, the two-line org
 * address, and the tightened civil-rights notice block.
 */
import { createForm } from "./state-form";
import { rgb, type PDFFont } from "pdf-lib";
import type { StateFormData } from "./types";

const W = 612;
const H = 792;
const L = 36;
const R = 576;

export async function buildMAPdf(data: StateFormData): Promise<Uint8Array> {
  const f = await createForm({
    title: "ABAWD Work Program Participation Report - ABAWD WPPR-EN",
    author: "Massachusetts Department of Transitional Assistance",
  });
  const INK = rgb(0.04, 0.04, 0.04);
  const RULE = rgb(0.22, 0.22, 0.22);
  type P = ReturnType<typeof f.addPage>;
  const draw = (p: P, v: string, x: number, top: number, b = false, size = 10) =>
    p.text(v, x, top, { font: b ? f.bold : f.reg, size, color: INK });
  const line = (p: P, x1: number, top: number, x2: number, width = 0.65) => p.line(x1, top, x2, width, RULE);
  const vline = (p: P, x: number, top1: number, top2: number, width = 0.65) => p.vline(x, top1, top2, width, RULE);
  const rect = (p: P, x: number, top: number, w: number, h: number) => p.rect(x, top, w, h, { border: RULE, borderWidth: 0.65 });
  const writeLines = (p: P, lines: string[], x: number, top: number, size = 10.5, leading = 15, b = false) =>
    lines.forEach((v, i) => draw(p, v, x, top + i * leading, b, size));
  const footer = (p: P) => { draw(p, "ABAWD WPPR-EN (Rev. 4/2025)", L, 755, false, 7.4); draw(p, "09-323-0917-05", L, 766, false, 7.4); };

  // Page 1.
  const p1 = f;
  p1.page.drawCircle({ x: 58, y: f.T(94), size: 18, borderWidth: 2, borderColor: rgb(0, 0.18, 0.29) });
  p1.page.drawCircle({ x: 58, y: f.T(94), size: 14, borderWidth: 0.6, borderColor: rgb(0, 0.18, 0.29) });
  draw(p1, "dta", 46, 100, false, 15);
  draw(p1, "Massachusetts Department of Transitional Assistance", 78, 79, true, 10.7);
  draw(p1, "Supplemental Nutrition Assistance Program", 78, 94, true, 10.5);
  draw(p1, "ABAWD Work Program Participation Report", 78, 112, true, 13.2);
  rect(p1, 371, 66, 190, 94);
  draw(p1, "Give this form to DTA:", 379, 80, true, 9.6);
  ["Upload to DTA Connect", "Fax to 617-887-8765", "Mail to the DTA Document Processing", "Center: P.O.  Box 4406, Taunton, MA", "02780", "Scan at a local DTA office"].forEach((t, i) => {
    if ([0, 1, 2, 5].includes(i)) draw(p1, "•", 379, 92 + i * 11, true, 10);
    draw(p1, t, 396, 92 + i * 11, false, 9.3);
  });

  draw(p1, "Part 1: ABAWD PARTICIPATION INFORMATION", 164, 192, true, 12.8);
  rect(p1, L, 202, 540, 70);
  vline(p1, 94, 202, 272); vline(p1, 307, 202, 272); vline(p1, 367, 202, 272); vline(p1, 472, 202, 237); vline(p1, 501, 202, 237);
  line(p1, L, 237, R);
  writeLines(p1, ["Name of", "ABAWD", "Participant:"], 42, 213, 8.5, 13);
  writeLines(p1, ["Participant’s", "Agency ID", "Number:"], 313, 213, 8.5, 13);
  draw(p1, "Date:", 477, 224, false, 8.5);
  writeLines(p1, ["Mailing", "Address:"], 42, 248, 8.5, 13);
  writeLines(p1, ["Telephone", "Number:"], 313, 248, 8.5, 13);
  draw(p1, data.participantName, 100, 224, false, 9);
  draw(p1, data.caseNumber ?? "", 372, 224, false, 9);
  draw(p1, data.dateSigned, 506, 224, false, 8.5);
  draw(p1, data.participantAddress.filter(Boolean).join(", "), 100, 259, false, 8.5);
  draw(p1, data.participantPhone ?? "", 372, 259, false, 8.5);

  writeLines(p1, ["You must meet the work rules for Able-Bodied Adults without Dependents (ABAWDs).  Based on information", "known to DTA, you are:"], L, 296, 10.4, 17);
  writeLines(p1, ["•    not exempt from the work rules,", "•    not working at least 20 hours per week, or", "•    not in an employment/training activity at least 20 hours per week."], 53, 337, 10.4, 17);
  writeLines(p1, ["If you are exempt, working or in employment/training, please call 877-382-2363 to let us know.  Otherwise, to", "keep getting SNAP benefits, you must volunteer at a non-profit or public organization.  To make sure that a", "community service site you choose meets the requirement, or for help finding a site, visit", "SNAPPathtoWork.org or call the SNAP Path to Work Line at 888-483-0255."], L, 405, 10.2, 17);
  writeLines(p1, ["You may use this form to prove that you will be volunteering at a non-profit or public organization.  The", "number of hours that you must volunteer is determined by dividing your monthly SNAP benefit by the current", "Massachusetts minimum wage.  Example: If you get $150 per month in SNAP and the state minimum wage is", "$15, you must volunteer for 10 hours per month."], L, 491, 10.2, 17);
  draw(p1, "NOTE: The community service site cannot be in the office of a candidate's campaign for public office.", L, 566, true, 9.6);
  writeLines(p1, ["For help figuring out how many hours you must volunteer, or if you think you have a good reason for not", "volunteering, call the DTA Assistance Line at 877-382-2363.  Visit https://www.mass.gov/info-details/work-", "rules-for-snap-clients to see a list of exemptions and call 877-382-2363 if you meet one.  If you need the work", "rules explained to you, visit www.mass.gov/snapworkrules."], L, 604, 10.1, 17);
  writeLines(p1, ["To prove that you will be volunteering at a non-profit or public organization: Have a staff person from the", "Community Service site complete the section on the back of this page."], L, 690, 10.2, 17);
  footer(p1);

  // Page 2.
  const p2 = f.addPage();
  draw(p2, "Part 2:  TO BE COMPLETED BY STAFF AT COMMUNITY SERVICE SITE", 108, 84, true, 12.5);
  rect(p2, L, 103, 540, 53);
  vline(p2, 102, 103, 156); vline(p2, 432, 103, 129); line(p2, L, 129, R);
  draw(p2, "Client Name:", 42, 118, true, 8.5); draw(p2, "APID:", 438, 118, true, 8.5); draw(p2, "Address:", 42, 145, true, 8.5);
  draw(p2, data.participantName, 108, 118, false, 9); draw(p2, data.caseNumber ?? "", 470, 118, false, 9);
  draw(p2, data.participantAddress.filter(Boolean).join(", "), 108, 145, false, 8.5);
  line(p2, L, 184, R, 0.8);
  draw(p2, "Name of Non-Profit or Public Organization", L, 197, false, 10);
  draw(p2, "Address", 308, 197, false, 10); draw(p2, "Phone Number", 455, 197, false, 10);
  line(p2, L, 215, 297); line(p2, 308, 215, 443); line(p2, 455, 215, R);
  draw(p2, data.orgName, L + 2, 211, false, 8.5);
  draw(p2, data.orgAddress[0] ?? "", 310, 211, false, 7.4);
  if (data.orgAddress[1]) draw(p2, data.orgAddress[1], 310, 222, false, 7.4);
  draw(p2, data.orgPhone, 457, 211, false, 8.5);
  draw(p2, "Is this organization public or non-profit?", L, 250, true, 10.5);
  ([[278, "Public"], [345, "Non-Profit"], [435, "Neither"]] as Array<[number, string]>).forEach(([x, label]) => {
    rect(p2, x, 241, 9, 9); draw(p2, label, x + 13, 250, true, 10);
  });
  draw(p2, "X", 347, 249, true, 7.5);  // Non-Profit
  draw(p2, "What is the start date and total hours per month", L, 287, true, 10.5);
  draw(p2, "this individual will volunteer?", L, 301, true, 10.5);
  line(p2, 250, 303, 360); line(p2, 430, 303, 540);
  draw(p2, data.startDate ?? "", 252, 300, false, 9); draw(p2, String(data.hours), 432, 300, false, 9);
  draw(p2, "Start Date", 280, 316, false, 8.5); draw(p2, "Hours", 470, 316, false, 8.5);
  draw(p2, "If this individual is already volunteering, how", L, 335, true, 10.5);
  draw(p2, "many hours did they volunteer last month?", L, 349, true, 10.5);
  line(p2, 360, 351, 480); draw(p2, String(data.hours), 362, 348, false, 9); draw(p2, "Hours", 410, 364, false, 8.5);
  rect(p2, 28, 374, 530, 103);
  draw(p2, "Fill this out if the individual needs proof that they volunteered for a month DTA did not know about.", 40, 389, true, 10);
  draw(p2, "Month", 42, 410, true, 10.5); draw(p2, "Year", 215, 410, true, 10.5); draw(p2, "Hours per Month", 335, 410, true, 10.5);
  const [monthName = data.month, year = ""] = data.month.split(/\s+(?=\d{4}$)/);
  [432, 453, 474].forEach((top, index) => {
    line(p2, 42, top, 164); line(p2, 214, top, 291); line(p2, 332, top, 451);
    if (index === 0) { draw(p2, monthName, 44, top - 3, false, 8.5); draw(p2, year, 216, top - 3, false, 8.5); draw(p2, String(data.hours), 334, top - 3, false, 8.5); }
  });
  line(p2, L, 506, 250); line(p2, 274, 506, 494);
  draw(p2, data.representativeName, 38, 502, false, 9); draw(p2, data.representativeTitle ?? "", 276, 502, false, 9);
  draw(p2, "Printed Name of Staff Person", L, 519, true, 9.5); draw(p2, "Title of Staff Person", 274, 519, true, 9.5);
  line(p2, L, 551, 317); line(p2, 397, 551, 468);
  if (data.signatureName) p2.text(data.signatureName, 38, 547, { font: f.italic, size: 12, color: INK });
  draw(p2, data.dateSigned, 399, 547, false, 9);
  draw(p2, "Signature of Community Service Site Staff Person", L, 564, true, 9.5); draw(p2, "Date", 397, 564, true, 9.5);
  draw(p2, "Please return the completed form to DTA by:", L, 597, false, 10.2);
  writeLines(p2, ["•    submitting proof online: Go to DTAConnect.com or download the DTA Connect mobile app", "•    mailing to DTA Document Processing Center, P.O.  Box 4406, Taunton, MA 02780-0420", "•    fax at 617-887-8765; or", "•    giving the completed form to the community service participant so they can return the form to DTA."], L, 614, 10, 17);
  draw(p2, "This institution is an equal opportunity provider.", L, 698, false, 10);
  writeLines(p2, ["We must not discriminate due to race, color, national origin, sex (including gender identity and sexual", "orientation), disability, age, or reprisal or retaliation for prior civil rights activity.  If you think that we have", "discriminated against you, call 617-348-8555 to find out how to file a complaint."], L, 716, 9.7, 14);
  footer(p2);
  return f.save();
}
