/**
 * Generates one volunteer-hours verification form for every US state + DC
 * and writes the PDFs to ~/Desktop/tended-forms/.
 *
 * Usage: pnpm tsx --tsconfig tsconfig.json scripts/gen-all-forms.ts
 */
import { writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildStateForm, listStateFormCoverage } from "../lib/forms/index";
import type { StateFormData } from "../lib/forms/types";

// Write to the project's tmp/ directory (the Desktop is sandboxed for child
// processes — move to Desktop with `mv` after generation).
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "tmp", "tended-forms");

const TEST_DATA: StateFormData = {
  // Section 1 — recipient
  participantName: "Alex Rivera",
  birthdate: "03/15/1990",
  participantAddress: ["123 Main Street Apt 4B", "San Francisco, CA 94102", ""],
  participantPhone: "(415) 555-0123",
  caseNumber: "CF-2026-000012",

  // Section 2 — certifying org
  orgName: "Friends of Urban Forests",
  representativeName: "Jordan Kim",
  representativeTitle: "Volunteer Coordinator",
  orgAddress: ["1007 General Kennedy Ave #1", "San Francisco, CA 94129", ""],
  orgPhone: "(415) 561-6890",
  orgEmail: "volunteers@fuf.net",

  // Certification
  month: "June 2026",
  monthIso: "2026-06",
  hours: 20,
  activity: "ongoing",
  positionDescription: "Urban tree census and canopy mapping",
  startDate: "06/01/2026",

  // Authorized-person signature (test / made-up)
  signatureName: "Jordan Kim",
  dateSigned: "06/24/2026",
};

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const coverage = listStateFormCoverage();
  console.log(`\nGenerating ${coverage.length} forms → ${OUT_DIR}\n`);

  const results: Array<{ state: string; formId: string; kind: string; file: string; bytes: number; ok: boolean; error?: string }> = [];

  for (const { state, stateName, formId, kind } of coverage) {
    const filename = `${state.toLowerCase()}-${formId.replace(/[\s/]+/g, "-").toLowerCase()}.pdf`;
    const outPath = join(OUT_DIR, filename);
    try {
      const { pdf, spec } = await buildStateForm(state, TEST_DATA);
      await writeFile(outPath, pdf);
      const ok = pdf.length > 1000;
      results.push({ state, formId: spec.formId, kind, file: filename, bytes: pdf.length, ok });
      console.log(`  ${ok ? "✓" : "✗"} ${state.padEnd(4)} ${spec.formId.padEnd(42)} ${pdf.length.toLocaleString()} bytes`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({ state, formId, kind, file: filename, bytes: 0, ok: false, error: msg });
      console.error(`  ✗ ${state.padEnd(4)} ${formId.padEnd(42)} ERROR: ${msg}`);
    }
  }

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n─────────────────────────────────────────────`);
  console.log(`  ${passed} / ${coverage.length} forms generated successfully`);
  if (failed) console.log(`  ${failed} FAILED`);
  console.log(`  Output: ${OUT_DIR}\n`);

  if (failed) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
