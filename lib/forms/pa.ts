/** Pennsylvania PA 1938 (3/20), Community Service | Volunteer Verification Form. */
import { PDFDocument, PDFFont, StandardFonts, rgb } from "pdf-lib";
import type { StateFormData } from "./types";

const W = 792;
const H = 612;
const L = 22;
const R = 770;
const ink = rgb(0.12, 0.10, 0.10);
const grey = rgb(.89, .89, .89);

export async function buildPAPdf(data: StateFormData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle("PA 1938 - Community Service | Volunteer Verification Form");
  doc.setProducer("Tended");
  const page = doc.addPage([W, H]);
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: rgb(1, 1, 1) });
  const reg = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const italic = await doc.embedFont(StandardFonts.TimesRomanItalic);
  const T = (top: number) => H - top;
  const text = (value: string, x: number, top: number, size = 8.5, font: PDFFont = reg, color = ink) => page.drawText(value, { x, y: T(top), size, font, color });
  const rule = (x1: number, top: number, x2: number, width = .45) => page.drawLine({ start: { x: x1, y: T(top) }, end: { x: x2, y: T(top) }, thickness: width, color: ink });
  const band = (label: string, top: number) => { page.drawRectangle({ x: L, y: T(top + 14), width: R - L, height: 14, color: ink }); text(label, L + 4, top + 10, 8.8, bold, rgb(1, 1, 1)); };
  const cell = (x: number, top: number, width: number, height: number, fill?: boolean) => page.drawRectangle({ x, y: T(top + height), width, height, borderColor: ink, borderWidth: .65, ...(fill ? { color: grey } : {}) });
  const field = (label: string, value: string, x: number, top: number, end: number) => { text(label, x, top, 7.4); const sx = x + reg.widthOfTextAtSize(label, 7.4) + 3; rule(sx, top + 2, end); if (value) text(value, sx + 2, top, 7.4); };
  const truncate = (v: string, f: PDFFont, s: number, w: number) => { let out = v; while (out && f.widthOfTextAtSize(out, s) > w) out = out.slice(0, -1); return out; };

  // Header / DHS mark.
  page.drawRectangle({ x: 22, y: T(20), width: 44, height: 44, color: ink });
  // Minimal line-art approximation of the DHS keystone mark. Standard PDF
  // fonts cannot encode the original glyph, so it is drawn with primitives.
  page.drawCircle({ x: 44, y: T(42), size: 12, borderColor: rgb(1, 1, 1), borderWidth: 1.2 });
  page.drawCircle({ x: 39, y: T(38), size: 3, color: rgb(1, 1, 1) });
  page.drawCircle({ x: 49, y: T(38), size: 3, color: rgb(1, 1, 1) });
  page.drawLine({ start: { x: 33, y: T(53) }, end: { x: 55, y: T(53) }, thickness: 1.2, color: rgb(1, 1, 1) });
  text("pennsylvania", 73, 41, 22, bold); text("DEPARTMENT OF HUMAN SERVICES", 74, 57, 10, reg);
  text("RESET FIELDS", 250, 17, 9, reg, rgb(.19, .19, .72));
  text("Community Service | Volunteer Verification Form", 20, 92, 14, bold);
  // Mailing and CAO boxes.
  [[358, "MAIL OR FAX THIS FORM TO:"], [578, "CAO / CONTRACTOR USE ONLY"]].forEach(([x, label]) => { cell(x as number, 20, 200, 84); page.drawRectangle({ x: x as number, y: T(44), width: 200, height: 24, color: ink }); text(label as string, (x as number) + (200 - bold.widthOfTextAtSize(label as string, 8.6)) / 2, 36, 8.6, bold, rgb(1, 1, 1)); });
  text("CAO or Work Ready Name", 380, 52, 7.8); text("CO / REC:", 580, 52, 7.8); rule(580, 71, 778); text("MONTHLY HOURS:", 580, 81, 7.8); rule(580, 102, 778);
  text("INSTRUCTIONS: Please mail or FAX the completed form within 10 days of receipt to the office listed above.", 22, 127, 13, bold);
  text("See reverse for detailed directions. Questions? Call the Statewide Customer Service Center at 1-877-395-8930.", 22, 142, 8.8);
  band("SECTION I.  Volunteer | Agency Information", 152);
  field("Name of volunteer:", data.participantName, 22, 180, 505); field("Birthdate:", data.birthdate, 511, 180, 625); field("Last 4 digits of SSN:", "", 631, 180, 770);
  field("Address of volunteer:", data.participantAddress[0] ?? "", 22, 197, 397); field("City:", data.participantAddress[1]?.split(",")[0] ?? "", 402, 197, 555); field("State:", "", 562, 197, 610); field("ZIP code:", "", 616, 197, 770);
  field("Name of agency:", data.orgName, 22, 214, 505); field("Agency Phone Number:", data.orgPhone, 510, 214, 770);
  field("Address of agency:", data.orgAddress[0] ?? "", 22, 231, 397); field("City:", data.orgAddress[1]?.split(",")[0] ?? "", 402, 231, 555); field("State:", "", 562, 231, 610); field("ZIP code:", "", 616, 231, 770);
  band("SECTION II.  Community Service Activity Information", 246);
  // Three source-form table groups.
  cell(36, 268, 217, 110); cell(36, 268, 110, 30, true); cell(146, 268, 107, 30, true); cell(36, 298, 110, 30, true); cell(146, 298, 107, 30, true); cell(36, 328, 110, 50, true); cell(146, 328, 107, 50, true);
  text("Start Date of Service", 42, 285, 9.4, bold); text(data.startDate ?? "", 151, 285, 8.4); text("Expected", 72, 310, 9.2, bold); text("End Date of Service*", 46, 323, 9.2, bold); text("Transportation", 52, 345, 9, bold); text("Provided by Agency", 45, 357, 9, bold); text("at No Cost?", 65, 369, 9, bold); text("YES       NO", 170, 354, 9.2, bold); text("(Circle one)", 180, 386, 8.2);
  cell(288, 268, 218, 110); cell(288, 268, 218, 19, true); text("Monthly Schedule of Service", 329, 282, 9.2, bold); cell(288, 287, 109, 27); cell(397, 287, 109, 27); text("Estimated", 457, 301, 9, bold); text("Weekly Hours", 446, 312, 9, bold);
  const weekly = (Math.round(data.hours / 4 * 10) / 10).toString();
  ["Week 1", "Week 2", "Week 3", "Week 4", "Total Monthly", "Estimated Hours"].forEach((label, i) => { const top = 314 + i * 18; cell(288, top, 109, 18, i >= 4); cell(397, top, 109, 18, i >= 4); text(label, 292, top + 13, 8.8, i >= 4 ? bold : reg); if (i < 4) text(weekly, 400, top + 13, 8.5); if (i === 5) text(String(data.hours), 400, top + 13, 8.8, bold); });
  cell(540, 268, 213, 110); cell(540, 268, 213, 37, true); text("Description of", 606, 283, 9.5, bold); text("Tasks Performed:", 602, 296, 9.5, bold); [305, 342, 378].forEach(t => rule(540, t, 753)); text("1.)", 544, 326, 8.8); text("2.)", 544, 363, 8.8); text("3.)", 544, 391, 8.8); const task = truncate(data.positionDescription ?? "Volunteer community service", reg, 8.1, 188); text(task, 561, 326, 8.1);
  band("SECTION III.  Agency Certification", 386);
  text("COMMUNITY SERVICE AGENCY CERTIFICATION:", 22, 409, 10.2, bold);
  const cert = "I hereby certify that our organization is a nonprofit with 501(C)(3) or 501(C)(4) status, a federal, state, or local government agency, or a church/place of worship that meets all applicable federal, state, and local laws and the above-named volunteer is registered with our agency to complete community service for the hours and period indicated above. I understand that this form is used to verify up to six months of community service participation.";
  const words = cert.split(" "); let current = ""; let cy = 421; for (const word of words) { const next = current ? `${current} ${word}` : word; if (reg.widthOfTextAtSize(next, 7.5) > 740) { text(current, 22, cy, 7.5); cy += 9; current = word; } else current = next; } text(current, 22, cy, 7.5);
  text("X", 28, 472, 10, bold); rule(30, 477, 354); rule(374, 477, 629); rule(647, 477, 770); text("Signature of Site Manager", 128, 486, 7.8, bold); text("Name of Site Manager (please print)", 447, 486, 7.8, bold); text("Date", 692, 486, 7.8, bold);
  band("SECTION IV.  Reporting Changes (Complete this section if updating an existing form). Mail or fax within 10 days from date change occurred.", 493);
  [22, 107, 332, 512, 690, 770].forEach((x, i, a) => { if (i < a.length - 1) cell(x, 512, a[i + 1] - x, 36, i === 0 || i === 2 || i === 4); });
  text("Actual End Date", 36, 524, 7.8, bold); text("Other Changes (Please explain below)", 131, 524, 7.8, bold); text("Signature of Site Manager", 369, 524, 7.8, bold); text("Name of Site Manager", 560, 524, 7.8, bold); text("Date", 716, 524, 7.8, bold);
  text("* No more than six months from start date. If community service is expected to continue beyond six months, enter six months from start date. A new form is required every six months.", 22, 570, 7);
  text("PA 1938   3/20", 730, 580, 6.8); void italic;
  return doc.save();
}
