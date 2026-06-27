/**
 * Washington DSHS 01-205, ABAWD Activity Report (REV. 03/2026).
 *
 * Four-page form. Rendered via the shared form engine (Workers-safe — the state
 * PDF is never fetched/embedded). Folds in the latest table layout: a narrower
 * week column (47px) so the five week columns + Total fit, and the monthly
 * "Total hours" value placed beside its label in the First-Provider column.
 */
import { createForm } from "./state-form";
import { rgb, type PDFFont } from "pdf-lib";
import type { StateFormData } from "./types";

const W = 612;
const L = 72;
const R = 576;
const INK = rgb(0, 0, 0);
const BLUE = rgb(0.12, 0.42, 0.66);
const PALE_BLUE = rgb(0.84, 0.9, 0.95);

export async function buildWAPdf(data: StateFormData): Promise<Uint8Array> {
  const f = await createForm({ title: "DSHS 01-205 - ABAWD Activity Report" });
  type P = ReturnType<typeof f.addPage>;
  const regular = f.reg, bold = f.bold;
  const text = (p: P, v: string, x: number, top: number, size = 10, fnt: PDFFont = regular) => p.text(v, x, top, { font: fnt, size, color: INK });
  const rule = (p: P, x1: number, top: number, x2: number, thickness = .5, color = INK) => p.line(x1, top, x2, thickness, color);
  const rect = (p: P, x: number, top: number, w: number, h: number, fill?: ReturnType<typeof rgb>) => p.rect(x, top, w, h, { border: INK, borderWidth: .5, ...(fill ? { fill } : {}) });
  const label = (p: P, v: string, x: number, top: number) => text(p, v, x, top, 7.2);
  const checkbox = (p: P, x: number, top: number) => rect(p, x, top, 10, 10);
  const footer = (p: P) => {
    text(p, "ABAWD ACTIVITY REPORT", 78, 757, 8, bold);
    text(p, "DSHS 01-205 (REV. 03/2026)", 78, 767, 8, bold);
    rect(p, 310, 752, 128, 39); text(p, "Barcode label", 338, 776, 11, regular);
    for (let x = 462; x < 570; x += 4) rule(p, x, 755, x, x % 8 === 0 ? 1.7 : .75);
    text(p, "01205", 510, 782, 5.5);
  };
  const logoAndTitle = (p: P) => {
    p.rect(81, 43, 37, 20, { border: INK, borderWidth: 1 });
    p.page.drawCircle({ x: 92, y: f.T(53), size: 3, borderColor: INK, borderWidth: 1 });
    p.page.drawCircle({ x: 104, y: f.T(53), size: 3, borderColor: INK, borderWidth: 1 });
    text(p, "DSHS", 120, 48, 15, bold);
    text(p, "DEPARTMENT OF SOCIAL", 120, 59, 4.8);
    text(p, "AND HEALTH SERVICES", 120, 65, 4.8);
    const title1 = "Able Bodied Adults Without Dependents (ABAWD)";
    text(p, title1, Math.max((W - bold.widthOfTextAtSize(title1, 15)) / 2 + 30, 200), 48, 15, bold);
    const title2 = "Activity Report";
    text(p, title2, Math.max((W - bold.widthOfTextAtSize(title2, 15)) / 2 + 30, 200), 65, 15, bold);
  };
  const pageHeading = (p: P) => {
    text(p, "ABAWD ACTIVITY REPORT", 78, 24, 8, bold);
    text(p, "DSHS 01-205 (REV. 03/2026)", 78, 34, 8, bold);
  };
  const wrap = (p: P, v: string, x: number, top: number, maxWidth: number, size = 9.6, fnt: PDFFont = regular, lineHeight = 12) =>
    p.wrap(v, x, top, maxWidth, { size, font: fnt, leading: lineHeight, color: INK });

  // Page 1.
  const p1 = f;
  logoAndTitle(p1);
  rect(p1, L, 86, R - L, 40);
  rule(p1, 416, 86, 416);
  label(p1, "CLIENT’S NAME", L + 7, 94); text(p1, data.participantName, L + 7, 113, 10);
  label(p1, "CLIENT NUMBER", 422, 94); text(p1, data.caseNumber ?? "", 422, 113, 10);
  rect(p1, L, 126, R - L, 570);
  wrap(p1, "Please complete this form to help us review your ABAWD status. Work and training activities help you stay eligible for food benefits while gaining experience or education or seeking employment.", L + 7, 145, R - L - 14, 9.8);
  text(p1, "Instructions:", L + 7, 178, 10, bold);
  [
    "1.    Provide this form to the agencies you’re working with for them to complete.",
    "2.    This form must be signed by you and the agencies you’re working with.",
    "3.    Provide this form monthly by the 10th of the following month.",
    "4.    Return the completed form to DSHS by:",
    "      •    Faxing to:  1-888-338-7410, or",
    "      •    Taking it to your local Community Services Office (CSO), or",
    "      •    Mailing to:   DSHS CSD Customer Service Center",
    "                         PO Box 11699",
    "                         Tacoma WA 98411-6699",
  ].forEach((line, index) => text(p1, line, L + 7, 198 + index * 20, 9.7));
  text(p1, "Important Things to Know:", L + 7, 397, 10, bold);
  [
    "•    You must complete 80 hours per month of approved work or training activities, or",
    "•    If participating in Workfare, your referral letter has the number of hours you must complete.",
    "•    Weeks start on Sunday and end the following Saturday. Total monthly hours start from the first of the",
    "     month to the last day of the month. See last page for examples.",
  ].forEach((line, index) => text(p1, line, L + 7, 418 + index * 20, 9.5));
  rule(p1, L, 490, R, 3.5, BLUE);
  text(p1, "If you couldn’t finish all the required hours (working plus other work related activities), please share the", L + 7, 509, 9.6);
  text(p1, "reason(s) why.", L + 7, 523, 9.6);
  checkbox(p1, L + 7, 538);
  text(p1, "I wasn’t able to complete all of the hours for this month because (please explain):", L + 25, 548, 9.4);
  text(p1, "Please see the next page for the month report.", L + 7, 685, 9.4);
  footer(p1);

  // Page 2 — monthly report.
  const p2 = f.addPage();
  pageHeading(p2);
  rect(p2, L, 37, R - L, 40); label(p2, "MONTH", L + 7, 45); text(p2, data.month, L + 7, 65, 10);
  rect(p2, L, 77, R - L, 40); rule(p2, 416, 77, 416); label(p2, "CLIENT’S NAME", L + 7, 85); text(p2, data.participantName, L + 7, 105, 10); label(p2, "CLIENT NUMBER", 422, 85); text(p2, data.caseNumber ?? "", 422, 105, 10);
  const tx = L, ty = 117, tw = R - L, leftCol = 202, weekW = 47, totalCol = 439;
  rect(p2, tx, ty, tw, 294, PALE_BLUE);
  p2.page.drawRectangle({ x: tx + .5, y: f.T(164 + 247) + .5, width: tw - 1, height: 246, color: rgb(1, 1, 1) });
  rule(p2, tx, 164, R); rule(p2, leftCol + tx, ty, leftCol + tx);
  for (let i = 1; i < 5; i += 1) rule(p2, tx + leftCol + i * weekW, ty + 26, tx + leftCol + i * weekW);
  rule(p2, tx + totalCol, ty, tx + totalCol);
  [190, 212, 234, 290, 324, 346, 368, 390, 411].forEach((top) => rule(p2, tx, top, R));
  text(p2, "Enter number of hours completed", tx + 7, 132, 10, bold); text(p2, "with approved providers for each", tx + 7, 145, 10, bold); text(p2, "week.", tx + 7, 158, 10, bold);
  text(p2, "Weeks in a month", 326, 137, 10, bold);
  ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"].forEach((week, index) => text(p2, week, tx + leftCol + 11 + weekW * index, 155, 9.2, bold));
  text(p2, "Total", tx + totalCol + 13, 137, 9.5, bold); text(p2, "hours", tx + totalCol + 12, 150, 9.5, bold);
  const activities: Array<[string, number]> = [
    ["Supervised Job Search", 181], ["Job Search Training", 203], ["Education Activities to include:", 225], ["•  General Education Degree Basic", 239], ["   Education", 251], ["•  English Language Acquisition (ELA)", 265],
    ["Vocational Training to include:", 304], ["Refugee Work Program", 318], ["Supervised Life Skills Training", 339], ["Job Retention", 361], ["Unpaid Work", 383], ["Workfare", 404],
  ];
  activities.forEach(([value, top]) => text(p2, value, tx + 7, Number(top), 8.9));
  text(p2, String(data.hours), tx + totalCol + 18, 389, 10, bold);
  // Total belongs with the First Provider (the org that did the work); keep it
  // next to its label rather than drifting into the empty Additional Provider column.
  text(p2, "Total hours", 206, 428, 9.5, bold); text(p2, String(data.hours), 264, 428, 10, bold);
  rule(p2, tx, 414, R, 3.5, BLUE);
  rule(p2, tx + 269, 414, tx + 269);
  text(p2, "First Provider:", tx + 7, 432, 9.5); text(p2, "Additional Provider:", tx + 276, 432, 9.5);
  text(p2, "I certify the above-named client did complete the hours", tx + 7, 452, 9.3); text(p2, "indicated for the period described above.", tx + 7, 465, 9.3);
  text(p2, "I certify the above-named client did complete the", tx + 276, 452, 9.3); text(p2, "hours indicated for the period described above.", tx + 276, 465, 9.3);
  label(p2, "ACTIVITY SITE NAME", tx + 7, 487); rule(p2, tx + 7, 498, tx + 260); text(p2, data.orgName, tx + 10, 495, 9.2);
  label(p2, "ACTIVITIES", tx + 7, 530); rule(p2, tx + 7, 541, tx + 260); text(p2, data.positionDescription || "Volunteer / unpaid work", tx + 10, 538, 8.7);
  label(p2, "SIGNATURE", tx + 7, 574); rule(p2, tx + 7, 585, tx + 260);
  label(p2, "ACTIVITY SITE NAME", tx + 276, 487); rule(p2, tx + 276, 498, R - 7);
  label(p2, "ACTIVITIES", tx + 276, 530); rule(p2, tx + 276, 541, R - 7);
  label(p2, "SIGNATURE", tx + 276, 574); rule(p2, tx + 276, 585, R - 7);
  rect(p2, tx, 620, tw, 84);
  checkbox(p2, tx + 7, 629); text(p2, "I’m currently working; this job has been reported to DSHS and there are no changes in my hours.", tx + 25, 639, 9.4, bold);
  text(p2, "(If you have a job that wasn’t previously reported to DSHS, provide proof to include: name and telephone", tx + 25, 658, 8.8); text(p2, "number of your employer; rate of pay; start date; hours worked weekly; when pay periods end; pay dates;", tx + 25, 670, 8.8); text(p2, "and if tips or commissions are paid, the amounts expected.)", tx + 25, 682, 8.8);
  checkbox(p2, tx + 7, 690); text(p2, "I’m currently in a WIOA approved program and there are no changes in my hours.", tx + 25, 700, 9.2, bold);
  rect(p2, tx, 704, tw, 55); text(p2, "I declare that the information I’m providing on all pages of this form is true and complete.", tx + 7, 722, 9.6, bold);
  label(p2, "CLIENT’S SIGNATURE", tx + 7, 741); label(p2, "DATE OF SIGNATURE", 440, 741);
  footer(p2);

  // Page 3 — descriptions.
  const p3 = f.addPage(); pageHeading(p3);
  text(p3, "ABAWD Activity Report Descriptions and Examples", L, 63, 13, bold);
  wrap(p3, "The descriptions below help identify activities that count toward your participation. Activities only count if an approved program supervises them. Find out more about these programs by visiting: https://www.dshs.wa.gov/ABAWDprograms.", L, 87, R - L, 9.5);
  const descriptions: Array<[string, string[]]> = [
    ["Supervised Job Search", ["assists you with finding employment. Activities include:", "• Contacting potential employers", "• Searching job listings", "• Obtaining IDs, professional licenses or certifications"]],
    ["Job Search Training", ["helps you seek and obtain employment. Services include:", "• Resume writing, interview skills, preparing a master application", "• Instruction and support related to seeking employment", "• Workplace workshops and career planning"]],
    ["Basic Education", ["helps you to increase your employability. Activities include:", "• Basic computer skills, reading or math assistance", "• High School Equivalency (formerly GED)", "• Basic Education for Adults (BEA)", "• English Language Acquisition (ELA)"]],
    ["Life Skills", ["increases your ability to meet the demands and challenges of working and everyday life. Some WorkSource locations and Basic Food Employment and Training providers offer these services."]],
    ["Vocational Education", ["provides programs requiring specialized training such as welding or computer programming. These programs result in recognized credentials. The activity must be:", "• Credentialed", "• Recognized by an independent third party", "• Accepted by local industry employers"]],
    ["Job Retention Services", ["assists and supports employed adults through the Basic Food Employment and Training program to achieve better job performance and increase earnings. Activities may include:", "• Counseling or coaching", "• Case management", "• Assistance with expenses related to keeping a job"]],
    ["Workfare", ["is a volunteer activity for ABAWDs to increase overall employability by developing basic job skills and confidence. Participants must volunteer a certain number of hours monthly at Workfare sites. DSHS will refer ABAWDs to Workfare sites."]],
    ["Unpaid Work", ["is an opportunity for an ABAWD to meet participation requirements by volunteering with a State, local, religious, or community non-profit organization. Unpaid work can also occur in other formats within the community."]],
  ];
  let dy = 135;
  descriptions.forEach(([head, lines]) => { text(p3, `${head} -`, L, dy, 9.5, bold); const x = L + bold.widthOfTextAtSize(`${head} -`, 9.5) + 4; lines.forEach((line, index) => { if (index === 0) { text(p3, line, x, dy, 9.5); dy += 14; } else { text(p3, line, L + 8, dy, 9.5); dy += 14; } }); dy += 8; });
  footer(p3);

  // Page 4 — examples.
  const p4 = f.addPage(); pageHeading(p4);
  text(p4, "Examples of how to complete form DSHS 01-205", L, 61, 13, bold);
  text(p4, "Example One:  One activity with one provider.", L, 91, 10, bold);
  text(p4, "If June 1 is on Saturday, week 1 will have one day. The next four (4) weeks will all have seven (7) days.", L, 108, 9.2);
  text(p4, "The final day, June 30, will be on a Sunday. The final week will have one day.", L, 121, 9.2);
  const exampleTable = (top: number, second = false) => {
    const x = L, split = 220, ww = 49, total = 465;
    rect(p4, x, top, R - L, second ? 123 : 98, PALE_BLUE);
    p4.page.drawRectangle({ x: x + .5, y: f.T(top + (second ? 123 : 98)) + .5, width: R - L - 1, height: (second ? 95 : 70), color: rgb(1, 1, 1) });
    rule(p4, x, top + 27, R); rule(p4, x + split, top, x + split); for (let i = 1; i < 5; i += 1) rule(p4, x + split + i * ww, top, x + split + i * ww); rule(p4, x + total, top, x + total);
    ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"].forEach((v, i) => text(p4, v, x + split + 7 + i * ww, top + 19, 8.4, bold)); text(p4, "Total", x + total + 11, top + 13, 8.4, bold); text(p4, "hours", x + total + 11, top + 23, 8.4, bold);
    if (!second) { text(p4, "Education Activities to include:", x + 7, top + 43, 8.7); text(p4, "• General Education Degree (GED)     • Basic Education     • English as a Second Language (ESL)", x + 12, top + 57, 7.8); ["2", "13", "33", "20", "15", "85"].forEach((v, i) => text(p4, v, x + split + 17 + i * ww, top + 75, 9, bold)); }
    else { ["Supervised Job Search (JS)", "Job Search Training (JT)", "Education Activities to include:", "• General Education Degree (GED)  • Basic Education  • English as a Second Language (ESL)", "Total hours"].forEach((v, i) => text(p4, v, x + 7, top + 43 + i * 15, i === 4 ? 9 : 8.5, i === 4 ? bold : regular)); [["", "5", "5", "", "", "10"], ["5", "5", "", "", "", "10"], ["15", "15", "15", "15", "", "60"], ["20", "20", "20", "20", "", "80"]].forEach((row, r) => row.forEach((v, i) => v && text(p4, v, x + split + 17 + i * ww, top + 43 + (r === 0 ? 0 : r === 1 ? 15 : r === 2 ? 45 : 90), 8.7, r === 3 ? bold : regular))); }
  };
  exampleTable(145);
  text(p4, "Example Two:  Multiple activities with two providers.", L, 276, 10, bold);
  exampleTable(299, true);
  text(p4, "First Provider:", L + 7, 447, 9.5); text(p4, "Additional Provider:", 345, 447, 9.5);
  text(p4, "ACTIVITY SITE NAME", L + 7, 485, 7.2); rule(p4, L + 7, 494, 316); text(p4, "WorkSource Auburn", L + 9, 491, 9);
  text(p4, "ACTIVITIES", L + 7, 526, 7.2); rule(p4, L + 7, 535, 316); text(p4, "JS / JT", L + 9, 532, 9);
  text(p4, "SIGNATURE", L + 7, 568, 7.2); rule(p4, L + 7, 577, 316);
  text(p4, "ACTIVITY SITE NAME", 345, 485, 7.2); rule(p4, 345, 494, R - 7); text(p4, "Green River Community College", 347, 491, 9);
  text(p4, "ACTIVITIES", 345, 526, 7.2); rule(p4, 345, 535, R - 7); text(p4, "Basic Education", 347, 532, 9);
  text(p4, "SIGNATURE", 345, 568, 7.2); rule(p4, 345, 577, R - 7);
  footer(p4);
  return f.save();
}
