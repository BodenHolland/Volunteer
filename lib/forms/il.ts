/**
 * Form name: SNAP Activity Report
 * Form ID:   IL444-2610
 * Agency:    Illinois Department of Human Services (IDHS)
 * Lane:      Self-initiated community-service / volunteer lane
 *            (DISTINCT from IL444-3673 Community Workfare lane — do not conflate.)
 * Status:    OPTIONAL. IDHS also accepts a signed organization letter OR a
 *            Serve Illinois - Galaxy Digital report.
 * Submit:    Manage My Case (MMC); OR mail/fax to IDHS Central Scanning Unit,
 *            P.O. Box 19138, Springfield, IL 62794; OR local FCRC.
 * Source:    https://www.dhs.state.il.us/onenetlibrary/12/documents/Forms/IL444-2610.pdf
 *
 * Rendered via the shared form engine. The activity-log table uses the engine's
 * auto-fitting table so the "TOTAL HOURS THIS PERIOD" line always clears the
 * Section 3 band below it (the row height adapts instead of overflowing).
 */
import { createForm, palette } from "./state-form";
import type { StateFormData } from "./types";

const LEFT = 56;
const RIGHT = 556;

export async function buildILPdf(data: StateFormData): Promise<Uint8Array> {
  const f = await createForm({ title: "IL444-2610 — SNAP Activity Report" });
  const { ink, lineGrey } = palette;
  const BAND = { left: LEFT, right: RIGHT };
  const fld = (label: string, value: string, top: number) => f.field(label, value, top, { labelX: 70, valX: 240, end: RIGHT, size: 10.5 });
  const blankLine = (top: number) => f.line(240, top + 3, RIGHT, 0.8, lineGrey);

  // ---- Header ----
  f.text("State of Illinois", LEFT, 56, { size: 10 });
  f.text("Illinois Department of Human Services", RIGHT, 56, { size: 10, align: "right", maxX: RIGHT });

  // ---- Title ----
  f.text("SNAP ACTIVITY REPORT", LEFT, 88, { font: f.bold, size: 18 });
  f.text("Self-Initiated Community Service / Volunteer Hours", LEFT, 108, { size: 11 });
  f.line(LEFT, 122, RIGHT, 1.2, ink);
  f.line(LEFT, 125, RIGHT, 0.6, ink);

  const intro = [
    "Use this form to report self-initiated community service or volunteer hours that count toward the",
    "SNAP ABAWD work requirement (an average of 20 hours per week / 80 hours per month). The SNAP",
    "recipient completes the activity information and signs below; a representative of the community",
    "organization then enters the organization name and signs to verify the hours. This form is one",
    "accepted document — IDHS also accepts a signed letter from the organization or a Serve Illinois",
    "(Galaxy Digital) report. Submit via Manage My Case, mail/fax to the Central Scanning Unit, or",
    "your local Family Community Resource Center (FCRC).",
  ];
  let y = 148;
  for (const ln of intro) { f.text(ln, LEFT, y, { size: 10.5 }); y += 14; }

  // ---- SECTION 1 ----
  f.band("SECTION 1. SNAP RECIPIENT INFORMATION", 256, BAND);
  f.text("To be completed by the SNAP recipient.", LEFT, 286, { font: f.italic, size: 10 });
  fld("Name of SNAP Recipient", data.participantName, 308);
  fld("Date of Birth", data.birthdate, 330);
  fld("Case Number (optional)", data.caseNumber || "", 352);
  f.text("Address", 70, 374, { font: f.bold, size: 10.5 }); blankLine(374);
  if (data.participantAddress[0]) f.text(data.participantAddress[0], 244, 374, { size: 10.5 });
  blankLine(392);
  if (data.participantAddress[1]) f.text(data.participantAddress[1], 244, 392, { size: 10.5 });
  fld("Telephone Number", data.participantPhone || "", 414);

  // ---- SECTION 2: Activity Log ----
  f.band("SECTION 2. ACTIVITY LOG", 442, BAND);
  f.text("Enter each volunteer session: activity type/description, date, start time, finish time, and total hours.", LEFT, 472, { size: 10 });

  const hoursStr = Number.isFinite(data.hours) ? `${data.hours}` : "";
  const activityLabel = data.positionDescription && data.positionDescription.trim()
    ? data.positionDescription.trim()
    : `Community service (monthly total — ${data.month})`;
  const tblTop = 488;
  const columns = [LEFT, LEFT + 220, LEFT + 290, LEFT + 360, LEFT + 430, RIGHT];
  // Auto-fitting: the table body must stay above the Section 3 band at top 624,
  // leaving room for the TOTAL line. Bound the table bottom at ~600.
  f.fittedTable({
    x: LEFT, top: tblTop, right: RIGHT, bottom: 598, headerHeight: 18, rows: 5,
    columns,
    headers: ["Activity Type / Description", "Date", "Start", "Finish", "Hours"],
    firstRow: [activityLabel, data.dateSigned || "", undefined, undefined, hoursStr],
  });

  // Total row (under the table). Label sits left of the Hours column.
  const totalTop = 612;
  f.text("TOTAL HOURS THIS PERIOD:", LEFT + 360 - 88, totalTop, { font: f.bold, size: 10.5 });
  f.line(LEFT + 430, totalTop + 3, RIGHT, 0.8, lineGrey);
  f.text(hoursStr, LEFT + 430 + 6, totalTop, { font: f.bold, size: 10.5 });

  // ---- SECTION 3: Organization ----
  f.band("SECTION 3. COMMUNITY ORGANIZATION INFORMATION", 624, BAND);
  f.text("To be completed by a representative of the community organization verifying the hours above.", LEFT, 652, { font: f.italic, size: 9.5 });
  fld("Name of Organization", data.orgName, 670);
  fld("Organization Address", data.orgAddress.filter(Boolean).join(" · "), 688);
  const repLabel = data.representativeTitle ? `${data.representativeName} (${data.representativeTitle})` : data.representativeName;
  fld("Name of Representative", repLabel, 706);
  const contactLine = [data.orgPhone, data.orgEmail].filter(Boolean).join(" · ");
  if (contactLine) fld("Phone / Email", contactLine, 722);

  // ---- SECTION 4: Dual signature table ----
  f.signatureBlock({
    top: 740, left: LEFT, right: RIGHT, height: 21, splits: [300],
    cells: [{ label: "Recipient Signature" }, { label: "Date" }],
  });
  f.signatureBlock({
    top: 761, left: LEFT, right: RIGHT, height: 21, splits: [300],
    cells: [
      { label: "Organization Representative Signature", value: data.representativeName || undefined, italicValue: true },
      { label: "Date", value: data.dateSigned || undefined },
    ],
  });

  f.footer({ left: "IL444-2610 — SNAP Activity Report (IDHS) — optional; org letter or Serve Illinois report also accepted", size: 8, rule: true });
  return f.save();
}
