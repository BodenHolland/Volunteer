/** New Mexico HCA ABAWD 002, Verification of Volunteer Hours (rev. 01/22/2026). */
import { createForm } from "./state-form";
import { rgb } from "pdf-lib";
import type { StateFormData } from "./types";

const L = 72;
const R = 540;
const BLUE = rgb(0, 0.31, 0.45);

export async function buildNMPdf(data: StateFormData): Promise<Uint8Array> {
  const f = await createForm({
    title: "Verification of Volunteer Hours - ABAWD 002",
    author: "New Mexico Health Care Authority",
    font: "times",
  });
  const { reg, bold } = f;
  const grey = rgb(0.3, 0.3, 0.3);
  const draw = (v: string, x: number, top: number, b = false, size = 11, color = f.ink) =>
    f.text(v, x, top, { font: b ? bold : reg, size, color });

  // Zia sun mark (compact vector rendition).
  const cx = 132, cyTop = 126;
  for (let i = 0; i < 4; i++) {
    const horizontal = i % 2 === 0;
    const sign = i < 2 ? -1 : 1;
    if (horizontal) f.page.drawRectangle({ x: cx + sign * 21 - 12, y: f.T(cyTop) - 3, width: 18, height: 6, color: rgb(0, .65, .78) });
    else f.page.drawRectangle({ x: cx - 3, y: f.T(cyTop) + sign * 21 - 12, width: 6, height: 18, color: rgb(0, .65, .78) });
  }
  f.page.drawCircle({ x: cx, y: f.T(cyTop), size: 15, color: rgb(.95, .75, .08), borderColor: rgb(0, .65, .78), borderWidth: 2 });
  f.page.drawCircle({ x: cx, y: f.T(cyTop), size: 9, color: rgb(1, 1, 1) });
  draw("H E A L T H   C A R E", 82, 171, false, 14, rgb(.2, .2, .2));
  draw("A U T H O R I T Y", 104, 186, false, 8.5, rgb(.2, .2, .2));

  draw("VERIFICATION OF VOLUNTEER HOURS", 142, 234, false, 16, BLUE);
  draw("This form can be a tool to help you track your volunteer hours for your work requirements. This", L, 253, false, 11.5);
  draw("form is not mandatory.", L, 268, false, 11.5);
  draw("not", 109, 268, true, 11.5);

  // Section 1.
  f.page.drawRectangle({ x: L, y: f.T(308), width: 260, height: 14, color: rgb(.86, .86, .86) });
  draw("SECTION 1. SNAP PARTICIPANT INFORMATION", L, 292, true, 11.5);
  draw("Fill out this section. This lets your volunteer hours be counted.", L, 307, false, 11.5);
  f.rect(L, 326, 468, 29, { border: grey, borderWidth: 0.65 });
  f.vline(248, 326, 355, 0.6, grey); f.vline(395, 326, 355, 0.6, grey);
  draw("Individual Name:", L + 7, 338, false, 11); draw("Case Number", 254, 338, false, 11); draw("Phone Number", 401, 338, false, 11);
  draw(data.participantName, L + 7, 351, false, 8.5); draw(data.caseNumber ?? "", 254, 351, false, 8.5); draw(data.participantPhone ?? "", 401, 351, false, 8.5);

  // Section 2.
  f.page.drawRectangle({ x: L, y: f.T(386), width: 285, height: 14, color: rgb(.86, .86, .86) });
  draw("SECTION 2. VOLUNTEER ACTIVITY INFORMATION", L, 370, true, 11.5);
  draw("Fill in this part to verify hours. Provide all information. This will help process your case more", L, 385, false, 11.5);
  draw("quickly.", L, 400, false, 11.5);
  const top = 419, headerH = 43, rowH = 19, cols = [72, 173, 272, 379, 468, 540];
  f.rect(L, top, 468, headerH + rowH * 8, { border: grey, borderWidth: 0.65 });
  cols.slice(1, -1).forEach((x) => f.vline(x, top, top + headerH + rowH * 8, 0.6, grey));
  f.line(L, top + headerH, R, 0.6, grey);
  for (let row = 1; row < 8; row++) f.line(L, top + headerH + row * rowH, R, 0.6, grey);
  [
    ["Date", "Completed"], ["Number of", "Hours", "Completed"], ["Organization"], ["Printed Name", "of Person", "Verifying Hours"], ["Phone Number", "of Person", "Verifying Hours"],
  ].forEach((words, index) => {
    const x = cols[index], width = cols[index + 1] - cols[index];
    words.forEach((word, row) => draw(word, x + (width - bold.widthOfTextAtSize(word, 10.5)) / 2, top + 13 + row * 13, true, 10.5));
  });
  const rowTop = top + headerH + 13;
  draw(data.month, cols[0] + 5, rowTop, false, 8.2);
  draw(String(data.hours), cols[1] + 8, rowTop, false, 9);
  draw(data.orgName, cols[2] + 4, rowTop, false, 7.3);
  draw(data.representativeName, cols[3] + 4, rowTop, false, 7.3);
  draw(data.orgPhone, cols[4] + 4, rowTop, false, 7.3);

  draw("You can turn in this form online. You can upload it to your account at https://yes.nm.gov. You can", L, 655, false, 10.8);
  draw("fax it to 1-855-804-8960. You can mail it to: Central ASPEN Scanning, PO Box 830, Bernalillo,", L, 670, false, 10.8);
  draw("NM 87004. You can bring it in person to your local ISD office.", L, 685, false, 10.8);
  draw("ABAWD 002 Revised 1/22/2026", L, 748, false, 10.5);
  return f.save();
}
