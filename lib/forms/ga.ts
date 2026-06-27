/**
 * Georgia Form 805 — "ABAWD Volunteer Work Verification Form" (also known as
 * the "Comparable Workfare Activity Form"; English + Spanish editions exist).
 *
 * Agency: Georgia Department of Human Services (DHS) / Division of Family &
 * Children Services (DFCS). Footer reads "Form 805 (01/19) ABAWD Comparable
 * Workfare." Two parts:
 *   PART I — completed by the SNAP case manager (left blank — the recipient
 *            generates the form before their case manager fills it).
 *   PART II — completed by the volunteer organization after the hours are done.
 *
 * Source: https://dfcs.georgia.gov/document/document/comparable-workfare-activity-form-805-0/download
 * Policy: PAMMS 3355. Submission: return to SNAP eligibility specialist at the
 * county DFCS office. Form 805 is statewide (no county variation).
 *
 * Rendered via the shared form engine (Workers-safe).
 */
import { createForm, palette } from "./state-form";
import type { StateFormData } from "./types";

const LEFT = 56;
const RIGHT = 556;

export async function buildGAPdf(data: StateFormData): Promise<Uint8Array> {
  const f = await createForm({ title: "Form 805 — ABAWD Volunteer Work Verification Form" });
  const { ink, lineGrey } = palette;
  const BAND = { left: LEFT, right: RIGHT };
  const fld = (label: string, value: string, top: number) => f.field(label, value, top, { labelX: 70, valX: 262, end: RIGHT, size: 10.5, valueFont: f.reg });

  // ---- Header ----
  f.text("Georgia Department of Human Services", LEFT, 60, { size: 11 });
  f.text("Division of Family & Children Services", RIGHT, 60, { size: 11, align: "right", maxX: RIGHT });
  f.text("___________________ County Department of Family and Children Services", LEFT, 74, { size: 10 });

  // ---- Title ----
  f.text("STATE OF GEORGIA", LEFT, 92, { font: f.bold, size: 14 });
  f.text("ABAWD VOLUNTEER WORK VERIFICATION FORM", LEFT, 112, { font: f.bold, size: 15 });
  f.text("(Comparable Workfare Activity Form)", LEFT, 130, { font: f.italic, size: 11 });
  f.line(LEFT, 142, RIGHT, 1.2, ink);
  f.line(LEFT, 145, RIGHT, 0.6, ink);

  const intro = [
    "Georgia SNAP rules require Able-Bodied Adults Without Dependents (ABAWDs) to meet a monthly work",
    "requirement. Comparable Workfare — unpaid volunteer hours at a community-service site serving a useful",
    "public purpose — satisfies this requirement. PART I is completed by the SNAP case manager to assign the",
    "required monthly hours. PART II is completed by the volunteer organization after the hours are performed.",
    "Return the completed form to your SNAP eligibility specialist at your county DFCS office.",
  ];
  let y = 162;
  for (const ln of intro) { f.text(ln, LEFT, y, { size: 10.5 }); y += 14; }

  // ---- PART I (case manager) — left blank ----
  f.band("PART I — TO BE COMPLETED BY THE SNAP CASE MANAGER", 240, BAND);
  f.text("Assigns the required monthly work-activity hours (allotment / federal minimum wage).", LEFT, 270, { size: 10 });
  fld("Case Manager Name", "", 294);
  fld("Case Manager Phone", "", 316);
  fld("Case Manager Fax", "", 338);
  fld("Work Activity Type", "Comparable Workfare", 360);
  fld("Required Hours Per Month", "", 382);
  fld("Participation Month", "", 404);
  fld("Client Name", data.participantName || "", 426);
  fld("Client ID Number", "", 448);
  fld("Case Number", data.caseNumber || "", 470);

  // ---- PART II (organization) ----
  f.band("PART II — TO BE COMPLETED BY THE LOCAL ORGANIZATION", 496, BAND);
  f.text("To be completed by organization staff AFTER the volunteer work-activity hours have been performed.", LEFT, 526, { size: 10 });
  fld("Organization Name", data.orgName || "", 550);
  fld("Organization Address", (data.orgAddress || []).filter(Boolean).join(", "), 572);
  fld("Organization Phone #", data.orgPhone || "", 594);
  fld("Volunteer Supervisor Name", data.representativeName || "", 616);

  // ---- Attestation sentence ----
  const attTop = 646;
  let cx = LEFT;
  const seg = (t: string, top: number, b = false) => {
    const font = b ? f.bold : f.reg;
    f.text(t, cx, top, { font, size: 10.5 });
    cx += font.widthOfTextAtSize(t, 10.5);
  };
  seg("The person named above is participating in a satisfactory manner: ", attTop);
  f.checkbox("", cx, attTop, true, { boxSize: 10 }); cx += 14; seg("Yes   ", attTop);
  f.checkbox("", cx, attTop, false, { boxSize: 10 }); cx += 14; seg("No", attTop);

  cx = LEFT;
  const att2 = attTop + 20;
  const segU = (t: string, b: boolean, underline = false) => {
    const font = b ? f.bold : f.reg;
    f.text(t, cx, att2, { font, size: 10.5 });
    const w = font.widthOfTextAtSize(t, 10.5);
    if (underline) f.line(cx, att2 + 2, cx + w, 0.7, lineGrey);
    cx += w;
  };
  segU("and completed ", false);
  segU(Number.isFinite(data.hours) ? `${data.hours}` : "______", true, true);
  segU(" hours in the month of ", false);
  segU(data.month || "______________", true, true);
  segU(" (month/year).", false);

  fld("Printed Name of Volunteer Supervisor", data.representativeName || "", att2 + 30);

  // ---- Signature table ----
  f.signatureBlock({
    top: att2 + 56, left: LEFT, right: RIGHT, height: 38, splits: [380],
    cells: [
      { label: "Signature of Volunteer Supervisor", value: data.signatureName || undefined, italicValue: true },
      { label: "Date Signed", value: data.dateSigned || undefined },
    ],
  });

  f.footer({ left: "Form 805 (01/19) — ABAWD Comparable Workfare", right: "Return to your SNAP case manager at your county DFCS office.", size: 9, rule: true });
  return f.save();
}
