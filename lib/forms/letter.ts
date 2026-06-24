/**
 * Generic verification letter for states with no named volunteer-hours form.
 *
 * Federal default applies (7 CFR §273.2(f)(8)): verification is by documentary
 * evidence — typically a signed letter on the volunteer organization's
 * letterhead naming the participant, hours, date range, and a supervisor
 * signature. Used for AK, AL, AZ, CT, DE, FL, HI, IA, ID, IN, KS, KY, LA, and
 * any other state where no state-specific form exists.
 *
 * Hand-drawn with pdf-lib; Workers-runtime safe (no fs, no template load).
 */
import { PDFDocument, StandardFonts, rgb, PDFFont } from "pdf-lib";
import type { StateFormData } from "./types";

const PAGE_W = 612;
const PAGE_H = 792;
const LEFT = 72;
const RIGHT = 540;
const INK = rgb(0.04, 0.04, 0.04);
const MUTED = rgb(0.42, 0.42, 0.42);
const LINE_GREY = rgb(0.55, 0.55, 0.55);

export async function buildLetterPdf(
  data: StateFormData,
  opts?: { stateName?: string; agencyLine?: string; submissionLine?: string; requirementsLine?: string }
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`${opts?.stateName || "State"} Volunteer Hours Verification Certificate`);
  doc.setProducer("Tended");
  const page = doc.addPage([PAGE_W, PAGE_H]);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const reg = await doc.embedFont(StandardFonts.Helvetica);
  const ital = await doc.embedFont(StandardFonts.TimesRomanItalic);

  const T = (top: number) => PAGE_H - top;
  const draw = (
    text: string,
    x: number,
    top: number,
    font: PDFFont,
    size: number,
    color = INK
  ) => page.drawText(text, { x, y: T(top), size, font, color });

  // Wrapping helper
  const wrap = (text: string, maxWidth: number, font: PDFFont, size: number) => {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let line = "";
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (font.widthOfTextAtSize(test, size) > maxWidth && line) {
        lines.push(line);
        line = w;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  };

  // Letterhead
  draw(data.orgName || "Certifying Organization", LEFT, 72, bold, 16);
  let y = 92;
  for (const ln of data.orgAddress.filter(Boolean)) {
    draw(ln, LEFT, y, reg, 10, MUTED);
    y += 13;
  }
  if (data.orgPhone) {
    draw(data.orgPhone, LEFT, y, reg, 10, MUTED);
    y += 13;
  }
  if (data.orgEmail) {
    draw(data.orgEmail, LEFT, y, reg, 10, MUTED);
    y += 13;
  }
  // rule under letterhead
  page.drawLine({
    start: { x: LEFT, y: T(y + 4) },
    end: { x: RIGHT, y: T(y + 4) },
    thickness: 0.8,
    color: LINE_GREY,
  });

  // Date
  y += 30;
  draw(data.dateSigned, LEFT, y, reg, 11);

  // Addressee
  y += 30;
  const agency =
    opts?.agencyLine ||
    (opts?.stateName
      ? `${opts.stateName} SNAP Agency`
      : "SNAP Eligibility Worker");
  draw(agency, LEFT, y, reg, 11);
  y += 14;
  draw(`${opts?.stateName || "State"} SNAP ABAWD volunteer-hours verification certificate`, LEFT, y, bold, 11);

  // Salutation
  y += 28;
  draw("To Whom It May Concern,", LEFT, y, reg, 11);

  // Body
  y += 24;
  const body = [
    `This letter certifies that ${data.participantName || "the SNAP participant named below"} performed ${
      Number.isFinite(data.hours) ? data.hours : "____"
    } hours of unpaid volunteer / community-service work for ${
      data.orgName || "our organization"
    } during ${data.month}.`,
    data.positionDescription
      ? `Activity: ${data.positionDescription}.`
      : `Activity: general community-service volunteer work consistent with the qualifying activities described in 7 CFR §273.24(a)(2)(iii).`,
    `The participant's volunteer hours were ${
      data.activity === "ongoing" ? "ongoing across the month" : "performed as a one-time engagement"
    }. The above hours reflect the participant's actual measured time logged with our organization and have not been inflated.`,
    `Should you require additional verification, please contact the undersigned representative using the contact information at the top of this letter.`,
  ];
  if (opts?.requirementsLine) body.splice(2, 0, opts.requirementsLine);
  for (const para of body) {
    for (const ln of wrap(para, RIGHT - LEFT, reg, 11)) {
      draw(ln, LEFT, y, reg, 11);
      y += 16;
    }
    y += 6;
  }

  // Participant details block
  y += 8;
  draw("PARTICIPANT", LEFT, y, bold, 10);
  y += 16;
  const partKv = (label: string, value: string) => {
    draw(label, LEFT, y, reg, 10, MUTED);
    draw(value || "—", LEFT + 160, y, reg, 10);
    y += 14;
  };
  partKv("Name", data.participantName);
  partKv("Date of birth", data.birthdate);
  partKv("Address", data.participantAddress.filter(Boolean).join(", "));
  if (data.caseNumber) partKv("Case number", data.caseNumber);
  if (data.participantPhone) partKv("Phone", data.participantPhone);
  partKv("Verified reporting period", data.month);
  partKv("Verified actual hours", Number.isFinite(data.hours) ? `${data.hours} hours` : "");

  // Signature block
  y += 24;
  draw("Sincerely,", LEFT, y, reg, 11);
  y += 36;
  if (data.signatureName) {
    draw(data.signatureName, LEFT, y, ital, 16);
  }
  y += 6;
  page.drawLine({
    start: { x: LEFT, y: T(y + 4) },
    end: { x: LEFT + 260, y: T(y + 4) },
    thickness: 0.8,
    color: LINE_GREY,
  });
  y += 18;
  draw(data.signatureName || "Authorized representative", LEFT, y, bold, 11);
  if (data.representativeTitle) {
    y += 14;
    draw(data.representativeTitle, LEFT, y, reg, 10, MUTED);
  }
  y += 14;
  draw(data.orgName, LEFT, y, reg, 10, MUTED);
  y += 14;
  draw(`Date: ${data.dateSigned}`, LEFT, y, reg, 10, MUTED);

  // Footer with submission notes (if provided)
  if (opts?.submissionLine) {
    const lines = wrap(opts.submissionLine, RIGHT - LEFT, reg, 9);
    let fy = PAGE_H - 60;
    page.drawLine({
      start: { x: LEFT, y: fy + 14 },
      end: { x: RIGHT, y: fy + 14 },
      thickness: 0.6,
      color: LINE_GREY,
    });
    for (const ln of lines) {
      page.drawText(ln, { x: LEFT, y: fy, size: 9, font: reg, color: MUTED });
      fy -= 11;
    }
  }

  // Tended attribution footer
  page.drawText("Generated by Tended — volunteer hours certification platform", {
    x: LEFT,
    y: 32,
    size: 8,
    font: reg,
    color: MUTED,
  });

  return doc.save();
}
