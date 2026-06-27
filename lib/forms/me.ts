/**
 * Maine — "ABAWD Volunteer Form"
 * Full title: "SNAP Community Service Volunteer/Workfare Verification - Action Required"
 * Agency: Maine Department of Health and Human Services (DHHS), Office for Family Independence (OFI)
 * Current fillable version: "ABAWD Volunteer Form Fillable 11.24.25.pdf"
 *
 * Submission paths (per the form itself):
 *   - Mail/fax to Farmington DHHS: 114 Corn Shop Lane, Farmington, ME 04938 / Fax (207) 778-8429
 *   - Email: Farmington.DHHS@Maine.gov
 *   - Upload to recipient account at MyMaineConnection.gov
 *
 * Source:
 *   https://www.maine.gov/dhhs/sites/maine.gov.dhhs/files/inline-files/ABAWD%20Volunteer%20Form%20Fillable%2011.24.25.pdf
 *
 * Rendered via the shared form engine (Workers-safe: no fs, no template load).
 */
import { createForm, palette } from "./state-form";
import type { StateFormData } from "./types";

const LEFT = 56;
const RIGHT = 556;

export async function buildMEPdf(data: StateFormData): Promise<Uint8Array> {
  const f = await createForm({ title: "ABAWD Volunteer Form — SNAP Community Service Volunteer/Workfare Verification" });
  const { ink, lineGrey, linkBlue } = palette;
  const BAND = { left: LEFT, right: RIGHT };
  const fld = (label: string, value: string, top: number) => f.field(label, value, top, { labelX: 70, valX: 262, end: RIGHT, size: 11 });
  const blankLine = (top: number) => f.line(262, top + 3, RIGHT, 0.8, lineGrey);

  // ---- Header ----
  f.text("Maine Department of Health and Human Services", LEFT, 60, { size: 11 });
  f.text("Office for Family Independence", RIGHT, 60, { size: 11, align: "right", maxX: RIGHT });

  // ---- Title ----
  f.text("SNAP COMMUNITY SERVICE", LEFT, 92, { font: f.bold, size: 16 });
  f.text("VOLUNTEER/WORKFARE VERIFICATION", LEFT, 112, { font: f.bold, size: 16 });
  f.text("- ACTION REQUIRED -", LEFT, 132, { font: f.bold, size: 13 });
  f.line(LEFT, 144, RIGHT, 1.2, ink);
  f.line(LEFT, 147, RIGHT, 0.6, ink);

  // ---- Intro ----
  const intro = [
    "Maine SNAP rules require some recipients (Able-Bodied Adults Without Dependents) to complete",
    "qualifying work activity hours each month. Volunteer or community service hours at an approved",
    "non-profit site count toward this requirement. Recipients must send this form to the address or fax",
    "below, e-mail it to Farmington.DHHS@Maine.gov, or upload it to their account at",
    "MyMaineConnection.gov. Volunteer hours will need to be verified at each application or annual",
    "eligibility review.",
  ];
  let y = 170;
  for (const ln of intro) { f.text(ln, LEFT, y, { size: 11 }); y += 15; }
  f.text("Farmington.DHHS@Maine.gov", LEFT + f.reg.widthOfTextAtSize("below, e-mail it to ", 11), 170 + 15 * 3, { size: 11, color: linkBlue });
  f.text("MyMaineConnection.gov", LEFT, 170 + 15 * 4, { size: 11, color: linkBlue });

  // ---- SECTION 1 ----
  f.band("SECTION 1. SNAP RECIPIENT INFORMATION", 280, BAND);
  f.text("This section must be completed by the SNAP recipient.", LEFT, 310, { size: 11 });
  fld("Name of SNAP Recipient", data.participantName, 336);
  fld("Date of Birth", data.birthdate, 362);
  fld("Case Number", data.caseNumber || "", 388);
  fld("Phone Number", data.participantPhone || "", 414);
  f.text("Address", 70, 440, { font: f.bold, size: 11 }); blankLine(440);
  if (data.participantAddress[0]) f.text(data.participantAddress[0], 266, 440, { size: 11 });
  blankLine(458);
  if (data.participantAddress[1]) f.text(data.participantAddress[1], 266, 458, { size: 11 });

  // ---- SECTION 2 ----
  f.band("SECTION 2. VOLUNTEER ORGANIZATION INFORMATION", 482, BAND);
  f.text("This section must be completed by a representative of the non-profit organization where the", LEFT, 512, { size: 11 });
  f.text("person named above volunteers or performs community service.", LEFT, 527, { size: 11 });
  fld("Name of Organization", data.orgName, 553);
  fld("Name of Representative", data.representativeName, 579);
  fld("Title of Representative", data.representativeTitle || "", 605);
  fld("Telephone Number", data.orgPhone, 631);

  // ---- Certification sentence with inline filled values ----
  let cx = LEFT;
  const seg = (t: string, b: boolean, top: number, underline = false) => {
    const font = b ? f.bold : f.reg;
    f.text(t, cx, top, { font, size: 11 });
    const w = font.widthOfTextAtSize(t, 11);
    if (underline) f.line(cx, top + 2, cx + w, 0.7, lineGrey);
    cx += w;
  };
  seg("For the month of ", false, 662);
  seg(data.month || "______________", true, 662, true);
  seg(", I certify that the person named above completed", false, 662);
  cx = LEFT;
  seg(Number.isFinite(data.hours) ? `${data.hours}` : "______", true, 679, true);
  seg(" hours of volunteer/community service for the organization I represent.", false, 679);

  // checkboxes
  f.text("The volunteer activity is:", LEFT, 702, { size: 11 });
  f.checkbox("Ongoing", 82, 720, data.activity === "ongoing");
  f.checkbox("One Time", 202, 720, data.activity === "one_time");

  // ---- Signature table ----
  f.signatureBlock({
    top: 738, left: LEFT, right: RIGHT, height: 32, splits: [300],
    cells: [
      { label: "Signature of Representative", value: data.signatureName || undefined, italicValue: true },
      { label: "Date Signed", value: data.dateSigned || undefined },
    ],
  });

  f.footer({ left: "ABAWD Volunteer Form (Rev. 11/24/25) - Maine DHHS Office for Family Independence", size: 8.5, rule: true });
  return f.save();
}
