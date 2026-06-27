/**
 * Rhode Island DHS-SNAP-ABAWD-3, ABAWD Combined Activity Reporting Form
 * (Rev. 12.8.25).
 *
 * Rendered via the shared form engine (Workers-safe — no PDF template loaded).
 * The supervisor-signature attestation is left genuinely blank; do not prefill
 * it from account data.
 */
import { createForm } from "./state-form";
import { rgb } from "pdf-lib";
import type { StateFormData } from "./types";

const W = 612;
const L = 36;
const R = 576;
const GREY = rgb(0.82, 0.82, 0.82);

export async function buildRIPdf(data: StateFormData): Promise<Uint8Array> {
  const f = await createForm({ title: "DHS-SNAP-ABAWD-3 - ABAWD Combined Activity Reporting Form" });
  const ink = rgb(0, 0, 0);
  const italic = f.italic; // HelveticaOblique-equivalent; Times italic reads similarly
  const text = (v: string, x: number, top: number, size = 10, b = false, it = false) =>
    f.text(v, x, top, { font: it ? italic : b ? f.bold : f.reg, size, color: ink });
  const rule = (x1: number, top: number, x2: number, thickness = 0.55) => f.line(x1, top, x2, thickness, ink);
  const center = (v: string, top: number, size: number, b = false) =>
    f.text(v, 0, top, { font: b ? f.bold : f.reg, size, align: "center", maxX: W, color: ink });

  // Seal.
  f.page.drawCircle({ x: 306, y: f.T(54), size: 24, borderColor: rgb(0.52, 0.33, 0.08), borderWidth: 1.5 });
  f.page.drawCircle({ x: 306, y: f.T(54), size: 18, borderColor: rgb(0.52, 0.33, 0.08), borderWidth: 0.7 });
  center("RI DHS", 57, 7, true);
  text("DHS-SNAP-ABAWD-3", 505, 19, 8.3);
  text("Rev. 12.8.25", 505, 31, 8.3);
  center("RHODE ISLAND DEPARTMENT OF HUMAN SERVICES", 116, 13, true);
  center("ABAWD Combined Activity Reporting Form", 134, 12.5, true);

  text("Section 1: Participant Information", L, 160, 11, true);
  text("Name:", L, 184, 10); rule(68, 187, R); text(data.participantName, 72, 184, 10);
  text("Address:", L, 212, 10); rule(84, 215, R); text(data.participantAddress.filter(Boolean).join(", "), 88, 212, 10);
  text("Phone Number:", L, 239, 10); rule(111, 242, 192); text(data.participantPhone ?? "", 115, 239, 10);
  text("RI Bridges Case # (if known):", 196, 239, 9.5); rule(350, 242, 422); text(data.caseNumber ?? "", 353, 239, 9.5);
  text("Email (optional):", 426, 239, 9); rule(510, 242, R);

  text("Section 2: Work / School / Training / Volunteer Activity Log", L, 271, 11, true);
  [
    "This form, which must be provided to the agencies you are working with and signed by you and the agency supervisor as",
    "verification of your participation, must be returned by you at your application, interim or recertification. Activity hours that you",
    "report and verify will count towards your required 80 monthly hours. Changes to those hours must be reported to the",
    "Department of Human Services within 10 days.",
  ].forEach((line, i) => text(line, L, 291 + i * 12.5, 8.9));
  text("Under penalty of perjury, I attest that all the information contained in this form is true. I understand that I am", L, 348, 9.4, false, true);
  text("breaking the law if I give false information and can be punished under federal law, state law, or both.", L, 360, 9.4, false, true);

  const tableTop = 375;
  const cols = [L, 136, 346, 454, R];
  const rowH = 19;
  f.rect(L, tableTop, R - L, rowH * 8, { fill: GREY, border: ink, borderWidth: 0.55 });
  f.page.drawRectangle({ x: L + .55, y: f.T(tableTop + rowH * 8) + .55, width: R - L - 1.1, height: rowH * 7 - 1.1, color: rgb(1, 1, 1) });
  cols.slice(1, -1).forEach((x) => f.vline(x, tableTop, tableTop + rowH * 8, 0.55, ink));
  for (let i = 1; i < 8; i += 1) rule(L, tableTop + rowH * i, R);
  const heads = ["Activity Type", "Location", "Total Hours/Month", "Supervisor Signature"];
  heads.forEach((head, index) => text(head, cols[index] + (cols[index + 1] - cols[index] - f.bold.widthOfTextAtSize(head, 8.4)) / 2, tableTop + 13, 8.4, true));
  const activity = data.positionDescription || "Volunteer activity";
  text(activity.slice(0, 22), cols[0] + 4, tableTop + rowH + 13, 8.5);
  text(data.orgName.slice(0, 42), cols[1] + 4, tableTop + rowH + 13, 8.5);
  text(String(data.hours), cols[2] + 9, tableTop + rowH + 13, 9, true);
  // Supervisor signature column intentionally blank (handwritten attestation).
  center("(You may attach another sheet for additional entries)", 535, 8.2, false);

  text("Section 3: Certification", L, 559, 11, true);
  text("Under penalty of perjury, I attest that all the information contained in this form is true. I understand that I am", L, 583, 9.4, false, true);
  text("breaking the law if I give false information and can be punished under federal law, state law, or both.", L, 595, 9.4, false, true);
  text("Participant Signature:", L, 618, 9.5); rule(130, 621, 391);
  text("Date:", 402, 618, 9.5); rule(430, 621, R);

  text("Section 4: Submission Instructions", L, 646, 11, true);
  text("Submit the completed and signed form through the following pathways:", L, 668, 9.2);
  [
    "- Mail to RI Department of Human Services, P.O. Box 8709, Cranston, RI 02920-8787;",
    "- Drop off in person or at a Drop Box Office location listed at https://dhs.ri.gov/about-us/dhs-offices;",
    "- Log in and upload to your Customer Portal account at http://www.healthyrhode.ri.gov; or",
    "- Access through the HealthyRhode Mobile App in the APP store or Google Play",
    "For questions, call: 1-855-MY-RIDHS (1-855-697-4347)",
    "Note: If you are applying or recertifying at this time, you may submit this completed and signed form with your DHS",
    "application or renewal documents.",
  ].forEach((line, index) => text(line, L, 684 + index * 11.3, 8.2));
  center("Page 1 of 1", 776, 8.3);
  return f.save();
}
