/**
 * One-off generator: write sample PDFs for every state form into
 * /tmp/audit-out/{state}.pdf. Used to inspect fidelity vs the official forms.
 * Safe to delete after a review pass — not wired to anything.
 */
import { writeFile, mkdir } from "node:fs/promises";
import { buildARPdf } from "../lib/forms/ar.js";
import { buildCOPdf } from "../lib/forms/co.js";
import { buildDCPdf } from "../lib/forms/dc.js";
import { buildGAPdf } from "../lib/forms/ga.js";
import { buildILPdf } from "../lib/forms/il.js";
import { buildMDPdf } from "../lib/forms/md.js";
import { buildMEPdf } from "../lib/forms/me.js";
import { buildMOPdf } from "../lib/forms/mo.js";
import { buildCf888Pdf } from "../lib/cf888.js";
import { buildLetterPdf } from "../lib/forms/letter.js";
import type { StateFormData } from "../lib/forms/types.js";

const sample = (state: string, city: string, zip: string): StateFormData => ({
  participantName: "Jane Q. Sample",
  birthdate: "01/15/1985",
  participantAddress: ["123 Test Lane", `${city}, ${state} ${zip}`, ""],
  participantPhone: "(555) 555-0101",
  caseNumber: `${state}-CASE-001`,
  orgName: "Sample Community Org",
  representativeName: "Pat Rep",
  representativeTitle: "Volunteer Coordinator",
  orgAddress: ["1 Civic Plaza", `${city}, ${state} ${zip}`, ""],
  orgPhone: "(555) 555-0200",
  orgEmail: "vol@sample.org",
  month: "May 2026",
  monthIso: "2026-05",
  hours: 82,
  activity: "ongoing",
  positionDescription: "Community outreach assistance",
  startDate: "05/01/2026",
  signatureName: "Pat Rep",
  dateSigned: "06/01/2026",
});

await mkdir("/tmp/audit-out", { recursive: true });

const tasks: { name: string; pdf: Uint8Array }[] = [
  { name: "ca", pdf: await buildCf888Pdf({
      participantName: "Jane Q. Sample", birthdate: "01/15/1985",
      participantAddress: ["123 Test Lane", "Sacramento, CA 95814", ""],
      orgName: "Sample Community Org", representativeName: "Pat Rep",
      orgAddress: ["1 Civic Plaza", "Sacramento, CA 95814", ""],
      orgPhone: "(916) 555-0200", month: "May 2026", hours: 82,
      activity: "ongoing", signatureName: "Pat Rep", dateSigned: "06/01/2026",
    }) },
  { name: "ar", pdf: await buildARPdf(sample("AR", "Little Rock", "72201")) },
  { name: "co", pdf: await buildCOPdf(sample("CO", "Denver", "80202")) },
  { name: "dc", pdf: await buildDCPdf(sample("DC", "Washington", "20001")) },
  { name: "ga", pdf: await buildGAPdf(sample("GA", "Atlanta", "30303")) },
  { name: "il", pdf: await buildILPdf(sample("IL", "Chicago", "60601")) },
  { name: "md", pdf: await buildMDPdf(sample("MD", "Baltimore", "21201")) },
  { name: "me", pdf: await buildMEPdf(sample("ME", "Portland", "04101")) },
  { name: "mo", pdf: await buildMOPdf(sample("MO", "Springfield", "65801")) },
  { name: "letter-generic", pdf: await buildLetterPdf(
      sample("NY", "Buffalo", "14201"),
      { stateName: "New York", submissionLine: "Submit per your local SNAP agency's documentary-evidence path — typically a portal upload, mail, fax, or in-person at your local office." }
    ) },
];

for (const t of tasks) {
  const path = `/tmp/audit-out/${t.name}.pdf`;
  await writeFile(path, t.pdf);
  console.log(`wrote ${path} (${t.pdf.length} bytes)`);
}
