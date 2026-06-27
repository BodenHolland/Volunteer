/**
 * Arkansas DCO-261 Volunteer Agreement (also written "DCO-0261" in the current
 * SNAP Manual Section 3000 markup).
 *
 * Agency: Arkansas Department of Human Services, Division of County Operations
 * (AR DHS / DCO). Completed by the supervising entity (church, local
 * government agency, or other nonprofit) and submitted to / verified by the
 * local DHS county eligibility worker.
 *
 * Dual-purpose: the same form serves BOTH the general 80-hour volunteer lane
 * (Sections 3500 / 3540.3) and the Comparable Workfare reduced-formula track
 * (Section 3730 / 3751.2).
 *
 * Source: https://humanservices.arkansas.gov/wp-content/uploads/Complete_SNAP_Manual.pdf
 *
 * The fillable DCO-261 PDF is not publicly posted; we hand-draw to match the
 * manual's described field set, via the shared form engine (Workers-safe).
 */
import { createForm, palette } from "./state-form";
import type { StateFormData } from "./types";

const LEFT = 56;
const RIGHT = 556;

export async function buildARPdf(data: StateFormData): Promise<Uint8Array> {
  const f = await createForm({ title: "DCO-261 — Arkansas Volunteer Agreement" });
  const { ink, lineGrey } = palette;
  const BAND = { left: LEFT, right: RIGHT };
  const fld = (label: string, value: string, top: number) => f.field(label, value, top, { labelX: 70, valX: 262, end: RIGHT, size: 11 });
  const blankLine = (top: number) => f.line(262, top + 3, RIGHT, 0.8, lineGrey);

  // ---- Header ----
  f.text("Arkansas Department of Human Services", LEFT, 60, { size: 11 });
  f.text("Division of County Operations", RIGHT, 60, { size: 11, align: "right", maxX: RIGHT });

  // ---- Title ----
  f.text("DCO-261 VOLUNTEER AGREEMENT", LEFT, 92, { font: f.bold, size: 16 });
  f.text("SNAP Required-to-Work Volunteer Hours Verification", LEFT, 112, { font: f.bold, size: 12 });
  f.line(LEFT, 124, RIGHT, 1.2, ink);
  f.line(LEFT, 127, RIGHT, 0.6, ink);

  const intro = [
    "Arkansas SNAP rules require Able-Bodied Adults Without Dependents (ABAWDs) to meet the",
    "Required-to-Work (RTW) obligation. Unpaid and volunteer work qualifies under SNAP Manual",
    "Section 3500 / 3540.3 (general 80-hour lane) and Section 3730 (Comparable Workfare). This",
    "form is completed by the supervising entity (church, local government agency, or other",
    "non-profit) and returned to the household's local DHS county office for verification.",
  ];
  let y = 150;
  for (const ln of intro) { f.text(ln, LEFT, y, { size: 11 }); y += 15; }

  // ---- SECTION 1 — Recipient ----
  f.band("SECTION 1. SNAP RECIPIENT INFORMATION", 240, BAND);
  f.text("To be completed for the household member volunteering toward the RTW obligation.", LEFT, 270, { size: 11 });
  fld("Recipient Name", data.participantName, 300);
  fld("Date of Birth", data.birthdate, 326);
  fld("SNAP Case Number", data.caseNumber || "", 352);
  f.text("Address", 70, 378, { font: f.bold, size: 11 }); blankLine(378);
  if (data.participantAddress[0]) f.text(data.participantAddress[0], 266, 378, { size: 11 });
  blankLine(396);
  if (data.participantAddress[1]) f.text(data.participantAddress[1], 266, 396, { size: 11 });
  fld("Telephone Number", data.participantPhone || "", 422);

  // ---- SECTION 2 — Supervising entity ----
  f.band("SECTION 2. SUPERVISING ENTITY INFORMATION", 446, BAND);
  f.text("To be completed by the supervising church, local government agency, or non-profit.", LEFT, 476, { size: 11 });
  fld("Organization Name", data.orgName, 506);
  fld("Supervisor Name", data.representativeName, 532);
  fld("Supervisor Title", data.representativeTitle || "", 558);
  f.text("Address", 70, 584, { font: f.bold, size: 11 }); blankLine(584);
  if (data.orgAddress[0]) f.text(data.orgAddress[0], 266, 584, { size: 11 });
  blankLine(602);
  if (data.orgAddress[1]) f.text(data.orgAddress[1], 266, 602, { size: 11 });
  fld("Telephone Number", data.orgPhone, 628);
  fld("Email", data.orgEmail || "", 654);

  // ---- SECTION 3 — Volunteer activity / certification ----
  f.band("SECTION 3. VOLUNTEER ACTIVITY AND HOURS", 678, BAND);
  let cx = LEFT;
  const seg = (t: string, b: boolean, top: number, underline = false) => {
    const font = b ? f.bold : f.reg;
    f.text(t, cx, top, { font, size: 11 });
    const w = font.widthOfTextAtSize(t, 11);
    if (underline) f.line(cx, top + 2, cx + w, 0.7, lineGrey);
    cx += w;
  };
  seg("For the month of ", false, 708);
  seg(data.month || "______________", true, 708, true);
  seg(", I certify the recipient named above performed", false, 708);
  cx = LEFT;
  seg("volunteer service for this entity for ", false, 725);
  seg(Number.isFinite(data.hours) ? `${data.hours}` : "______", true, 725, true);
  seg(" hours. Start date: ", false, 725);
  seg(data.startDate || "__________", true, 725, true);

  f.text("Activity type:", LEFT, 750, { font: f.bold, size: 11 });
  f.checkbox("Ongoing", 140, 750, data.activity === "ongoing");
  f.checkbox("One Time", 240, 750, data.activity === "one_time");

  f.text("Description of volunteer activity:", LEFT, 774, { font: f.bold, size: 11 });
  f.line(LEFT, 790, RIGHT, 0.6, lineGrey);
  if (data.positionDescription) f.text(data.positionDescription.slice(0, 110), LEFT, 787, { size: 10 });

  // ---- Page 2 — signature + footer ----
  const p2 = f.addPage();
  p2.text("DCO-261 Volunteer Agreement (continued)", LEFT, 60, { font: f.bold, size: 12 });
  p2.line(LEFT, 72, RIGHT, 0.6, ink);
  const attest = [
    "I certify under penalty of perjury that the hours reported above reflect the recipient's",
    "actual measured volunteer time supervised by this entity. I understand this form will be",
    "submitted to the Arkansas DHS county office for SNAP Required-to-Work verification.",
  ];
  let ay = 100;
  for (const ln of attest) { p2.text(ln, LEFT, ay, { size: 11 }); ay += 15; }

  p2.signatureBlock({
    top: 170, left: LEFT, right: RIGHT, height: 40, splits: [300],
    cells: [
      { label: "Signature of Supervising Representative", value: data.signatureName || undefined, italicValue: true },
      { label: "Date Signed", value: data.dateSigned || undefined },
    ],
  });

  const submitNote = [
    "Return this completed form to the recipient's local Arkansas DHS county office. The eligibility",
    "worker uses it to verify volunteer hours toward the ABAWD Required-to-Work obligation under",
    "SNAP Manual Section 3500/3540.3 (general 80-hour lane) or Section 3730 (Comparable Workfare).",
  ];
  let sy = 250;
  for (const ln of submitNote) { p2.text(ln, LEFT, sy, { size: 10 }); sy += 14; }

  p2.footer({ left: "DCO-261 (also DCO-0261) — Arkansas DHS Division of County Operations", size: 10, rule: true });
  return f.save();
}
