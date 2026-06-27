/**
 * DC — "Verification of Employment or Qualifying Work Activity Form"
 * Agency: District of Columbia Department of Human Services (DHS),
 *   Economic Security Administration (ESA).
 * Trilingual: available in English, Spanish, and Amharic.
 * Submission paths: District Direct portal/app (districtdirect.dc.gov),
 *   in person at a DHS service center, or by mail/fax.
 * Launched: June 1, 2026 (ABAWD time limits returned to DC the same date).
 * Source: https://dhs.dc.gov/page/snap-work-requirements
 *
 * Filled by the customer; signed by an employer or organization representative
 * to verify work/qualifying-activity hours. Rendered via the shared form engine
 * (Workers-safe: no fs, no template load).
 */
import { createForm, palette } from "./state-form";
import type { StateFormData } from "./types";

const LEFT = 56;
const RIGHT = 556;

export async function buildDCPdf(data: StateFormData): Promise<Uint8Array> {
  const f = await createForm({ title: "DC — Verification of Employment or Qualifying Work Activity" });
  const { ink, lineGrey, linkBlue } = palette;
  const BAND = { left: LEFT, right: RIGHT };

  // ---- Header row ----
  f.text("Government of the District of Columbia", LEFT, 60, { size: 11 });
  f.text("Department of Human Services", RIGHT, 60, { size: 11, align: "right", maxX: RIGHT });
  f.text("Economic Security Administration", LEFT, 74, { size: 10 });

  // ---- Title ----
  f.text("VERIFICATION OF EMPLOYMENT OR", LEFT, 108, { font: f.bold, size: 16 });
  f.text("QUALIFYING WORK ACTIVITY FORM", LEFT, 128, { font: f.bold, size: 16 });
  f.line(LEFT, 140, RIGHT, 1.2, ink);
  f.line(LEFT, 143, RIGHT, 0.6, ink);

  // ---- Intro paragraph ----
  const intro = [
    "SNAP work requirements may apply to you. Volunteer work or other qualifying work activities can",
    "count toward the ABAWD 80-hours-per-month requirement. This form is completed by the customer and",
    "signed by an employer or organization representative to verify hours worked or volunteered. You can",
    "submit this form online through District Direct at districtdirect.dc.gov, in person at a DHS service",
    "center, or by mail or fax. Available in English, Spanish, and Amharic.",
  ];
  let y = 166;
  for (const ln of intro) { f.text(ln, LEFT, y, { size: 11 }); y += 15; }
  const urlLinePrefix = "submit this form online through District Direct at ";
  f.text("districtdirect.dc.gov", LEFT + f.reg.widthOfTextAtSize(urlLinePrefix, 11), 166 + 15 * 3, { size: 11, color: linkBlue });

  const labelX = 70, valX = 262, valEnd = RIGHT;
  const fld = (label: string, value: string, top: number) => f.field(label, value, top, { labelX, valX, end: valEnd, size: 11 });
  const blankLine = (top: number) => f.line(valX, top + 3, valEnd, 0.8, lineGrey);

  // ---- SECTION 1 ----
  f.band("SECTION 1. CUSTOMER INFORMATION", 256, BAND);
  f.text("To be completed by the SNAP customer. Please fill in the information below.", LEFT, 286, { size: 11 });
  fld("Customer Name", data.participantName, 314);
  fld("Date of Birth", data.birthdate, 340);
  if (data.caseNumber) fld("DHS Case / Client Number", data.caseNumber, 366);
  else { f.text("DHS Case / Client Number", labelX, 366, { font: f.bold, size: 11 }); blankLine(366); }
  f.text("Address", labelX, 392, { font: f.bold, size: 11 }); blankLine(392);
  if (data.participantAddress[0]) f.text(data.participantAddress[0], valX + 4, 392, { size: 11 });
  blankLine(410);
  if (data.participantAddress[1]) f.text(data.participantAddress[1], valX + 4, 410, { size: 11 });
  if (data.participantPhone) fld("Telephone Number", data.participantPhone, 436);
  else { f.text("Telephone Number", labelX, 436, { font: f.bold, size: 11 }); blankLine(436); }

  // ---- SECTION 2 ----
  f.band("SECTION 2. EMPLOYER OR ORGANIZATION INFORMATION", 460, BAND);
  f.text("To be completed by a representative of the employer or organization where the customer worked or", LEFT, 490, { size: 11 });
  f.text("volunteered. Please fill in the information below.", LEFT, 505, { size: 11 });
  fld("Name of Employer / Organization", data.orgName, 533);
  fld("Name of Representative", data.representativeName, 559);
  if (data.representativeTitle) fld("Title", data.representativeTitle, 585);
  else { f.text("Title", labelX, 585, { font: f.bold, size: 11 }); blankLine(585); }
  f.text("Address", labelX, 611, { font: f.bold, size: 11 }); blankLine(611);
  if (data.orgAddress[0]) f.text(data.orgAddress[0], valX + 4, 611, { size: 11 });
  blankLine(629);
  if (data.orgAddress[1]) f.text(data.orgAddress[1], valX + 4, 629, { size: 11 });
  fld("Telephone Number", data.orgPhone, 655);

  // ---- Certification sentence with inline filled values ----
  const certTop = 690;
  let cx = LEFT;
  const seg = (t: string, italicOrBold: "reg" | "bold", top: number, underline = false) => {
    const font = italicOrBold === "bold" ? f.bold : f.reg;
    f.text(t, cx, top, { font, size: 11 });
    const w = font.widthOfTextAtSize(t, 11);
    if (underline) f.line(cx, top + 2, cx + w, 0.7, lineGrey);
    cx += w;
  };
  seg("For the month of ", "reg", certTop);
  seg(data.month || "______________", "bold", certTop, true);
  seg(", I certify that the customer named above performed", "reg", certTop);
  cx = LEFT;
  const certTop2 = 707;
  seg("qualifying work activity for the organization I represent for ", "reg", certTop2);
  seg(Number.isFinite(data.hours) ? `${data.hours}` : "______", "bold", certTop2, true);
  seg(" hours. The activity is:", "reg", certTop2);

  // Activity-cadence checkboxes.
  f.checkbox("Ongoing", labelX + 12, 727, data.activity === "ongoing");
  f.checkbox("One Time", labelX + 130, 727, data.activity === "one_time");

  // ---- Signature table ----
  f.signatureBlock({
    top: 748, left: LEFT, right: RIGHT, height: 30, splits: [300],
    cells: [
      { label: "Signature of Representative", value: data.signatureName || undefined, italicValue: true },
      { label: "Date Signed", value: data.dateSigned || undefined },
    ],
  });

  // ---- Footer (size 8 per latest layout) ----
  f.footer({
    left: "DC DHS — Verification of Employment or Qualifying Work Activity (6/26)",
    right: "Submit via District Direct, DHS service center, mail, or fax",
    size: 8, rule: true, rightAlign: true,
  });

  return f.save();
}
