/**
 * Colorado — "Volunteer Verification Form" (a.k.a. "ABAWD Volunteer
 * Verification Form" per CDHS).
 *
 * Agency: Colorado Department of Human Services (CDHS), Food and Energy
 * Assistance Division. SNAP is county-administered via the CBMS statewide
 * system, but this form is state-issued and uniform across counties.
 *
 * Submission paths (recipient's choice):
 *   - Colorado PEAK portal upload (https://peak.my.gov.co/)
 *   - MyCOBenefits mobile app upload
 *   - In-person or by mail to the recipient's county human-services office
 *
 * Cadence quirk: submitted ONCE per SNAP certification period. The compliance
 * question is a Yes/No checkbox: "Is the individual volunteering an average of
 * 20 hours/week or 80 hours/month?"
 *
 * Source: https://cdhs.colorado.gov/snap/abawd · Rule: 10 CCR 2506-1-4.311
 *
 * Rendered via the shared form engine (Workers-safe: no fs).
 */
import { createForm, palette } from "./state-form";
import { rgb } from "pdf-lib";
import type { StateFormData } from "./types";

const LEFT = 56;
const RIGHT = 556;
const CO_BLUE = rgb(0.0, 0.27, 0.55);

export async function buildCOPdf(data: StateFormData): Promise<Uint8Array> {
  const f = await createForm({ title: "Colorado Volunteer Verification Form (ABAWD)" });
  const { ink, lineGrey, linkBlue } = palette;
  const BAND = { left: LEFT, right: RIGHT };
  const fld = (label: string, value: string, top: number) => f.field(label, value, top, { labelX: 70, valX: 262, end: RIGHT, size: 11 });
  const blankLine = (top: number) => f.line(262, top + 3, RIGHT, 0.8, lineGrey);

  // ---- Header ----
  f.text("Colorado Department of Human Services", LEFT, 60, { font: f.bold, size: 12, color: CO_BLUE });
  f.text("Food and Energy Assistance Division", RIGHT, 60, { size: 11, align: "right", maxX: RIGHT });

  // ---- Title ----
  f.text("VOLUNTEER VERIFICATION FORM", LEFT, 92, { font: f.bold, size: 18 });
  f.text("SNAP / ABAWD Work Requirement", LEFT, 114, { size: 12 });
  f.line(LEFT, 126, RIGHT, 1.2, ink);
  f.line(LEFT, 129, RIGHT, 0.6, ink);

  const intro = [
    "SNAP recipients subject to the ABAWD work requirement may satisfy the requirement by volunteering",
    "an average of 20 hours per week or 80 hours per month. This form is completed by the organization or",
    "individual the recipient volunteers for and is submitted ONE time during the SNAP certification period.",
    "Submit by uploading to Colorado PEAK (peak.my.gov.co), the MyCOBenefits mobile app, or by returning",
    "this form to your county human-services office in person or by mail.",
  ];
  let y = 152;
  for (const ln of intro) { f.text(ln, LEFT, y, { size: 11 }); y += 15; }
  f.text("peak.my.gov.co", LEFT + f.reg.widthOfTextAtSize("Submit by uploading to Colorado PEAK (", 11), 152 + 15 * 3, { size: 11, color: linkBlue });

  // ---- SECTION 1 ----
  f.band("SECTION 1. VOLUNTEER INFORMATION", 240, BAND);
  f.text("To be completed using the SNAP recipient's information. The CBMS case number appears on county", LEFT, 270, { size: 11 });
  f.text("correspondence and in the PEAK account.", LEFT, 285, { size: 11 });
  fld("Volunteer Name", data.participantName, 312);
  fld("CBMS Case Number", data.caseNumber || "", 338);
  fld("Date of Birth", data.birthdate, 364);
  fld("Volunteer Start Date", data.startDate || "", 390);
  f.text("Address", 70, 416, { font: f.bold, size: 11 }); blankLine(416);
  if (data.participantAddress[0]) f.text(data.participantAddress[0], 266, 416, { size: 11 });
  blankLine(434);
  if (data.participantAddress[1]) f.text(data.participantAddress[1], 266, 434, { size: 11 });

  // ---- SECTION 2 ----
  f.band("SECTION 2. ORGANIZATION OR SUPERVISOR INFORMATION", 458, BAND);
  f.text("To be completed by the organization or individual the recipient volunteers for. Per 10 CCR 2506-1-", LEFT, 488, { size: 11 });
  f.text("4.311, unpaid work may be verified by any provider of the unpaid work.", LEFT, 503, { size: 11 });
  fld("Organization or Agency Name", data.orgName, 530);
  f.text("(if applicable)", 82, 545, { font: f.italic, size: 9 });
  fld("Supervisor / Individual Name", data.representativeName, 562);
  f.text("Address", 70, 588, { font: f.bold, size: 11 }); blankLine(588);
  if (data.orgAddress[0]) f.text(data.orgAddress[0], 266, 588, { size: 11 });
  blankLine(606);
  if (data.orgAddress[1]) f.text(data.orgAddress[1], 266, 606, { size: 11 });
  fld("Phone", data.orgPhone, 632);
  fld("Email", data.orgEmail || "", 658);

  // ---- SECTION 3 ----
  f.band("SECTION 3. VOLUNTEER ACTIVITY", 682, BAND);
  const compTop = 712;
  const compQ = "Is the individual volunteering an average of 20 hours/week or 80 hours/month?";
  f.text(compQ, LEFT, compTop, { size: 11 });
  const yesChecked = data.hours >= 80;
  const yesX = LEFT + f.reg.widthOfTextAtSize(compQ + "  ", 11);
  f.checkbox("Yes", yesX, compTop, yesChecked, { boxSize: 11 });
  f.checkbox("No", yesX + 46, compTop, !yesChecked, { boxSize: 11 });

  const natTop = 734;
  f.text("Nature of Work / Position Description:", LEFT, natTop, { font: f.bold, size: 11 });
  f.line(LEFT, 752 + 3, RIGHT, 0.8, lineGrey);
  f.line(LEFT, 770 + 3, RIGHT, 0.8, lineGrey);
  if (data.positionDescription) {
    const maxWidth = RIGHT - LEFT - 4;
    const words = data.positionDescription.split(/\s+/);
    let l1 = "", l2 = "", target: 1 | 2 = 1;
    for (const w of words) {
      if (target === 1) {
        const trial = l1 ? l1 + " " + w : w;
        if (f.reg.widthOfTextAtSize(trial, 11) <= maxWidth) l1 = trial; else { target = 2; l2 = w; }
      } else {
        const trial = l2 ? l2 + " " + w : w;
        if (f.reg.widthOfTextAtSize(trial, 11) <= maxWidth) l2 = trial;
      }
    }
    if (l1) f.text(l1, LEFT + 2, 752, { size: 11 });
    if (l2) f.text(l2, LEFT + 2, 770, { size: 11 });
  }

  // ---- Footer signature row (compact, single page) ----
  const sigTop = 788;
  f.line(LEFT, sigTop, LEFT + 240, 0.8, ink);
  f.text("Signature", LEFT, sigTop + 4, { size: 9 });
  if (data.signatureName) f.text(data.signatureName, LEFT + 6, sigTop - 4, { font: f.italic, size: 13 });
  f.line(LEFT + 260, sigTop, RIGHT, 0.8, ink);
  f.text("Date", LEFT + 260, sigTop + 4, { size: 9 });
  if (data.dateSigned) f.text(data.dateSigned, LEFT + 266, sigTop - 4, { size: 11 });

  return f.save();
}
