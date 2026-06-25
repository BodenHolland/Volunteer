/**
 * Evaluation pass for the generated state-form PDFs.
 *
 * Loads each PDF with pdf-lib (handles all decompression), then regenerates
 * the same form in memory and compares byte size as a proxy for identical
 * rendering. Also verifies structural checks (page count, metadata title).
 *
 * Usage: pnpm tsx --tsconfig tsconfig.json scripts/eval-all-forms.ts
 */
import { readdir, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PDFDocument } from "pdf-lib";
import { buildStateForm, listStateFormCoverage } from "../lib/forms/index";
import type { StateFormData } from "../lib/forms/types";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FORMS_DIR = join(ROOT, "tmp", "tended-forms");

const TEST_DATA: StateFormData = {
  participantName: "Alex Rivera",
  birthdate: "03/15/1990",
  participantAddress: ["123 Main Street Apt 4B", "San Francisco, CA 94102", ""],
  participantPhone: "(415) 555-0123",
  caseNumber: "CF-2026-000012",
  orgName: "Friends of Urban Forests",
  representativeName: "Jordan Kim",
  representativeTitle: "Volunteer Coordinator",
  orgAddress: ["1007 General Kennedy Ave #1", "San Francisco, CA 94129", ""],
  orgPhone: "(415) 561-6890",
  orgEmail: "volunteers@fuf.net",
  month: "June 2026",
  monthIso: "2026-06",
  hours: 20,
  activity: "ongoing",
  positionDescription: "Urban tree census and canopy mapping",
  startDate: "06/01/2026",
  signatureName: "Jordan Kim",
  dateSigned: "06/24/2026",
};

// Known multi-page forms
const MULTI_PAGE: Record<string, number> = { MA: 2, VT: 2 };

interface EvalResult {
  state: string;
  file: string;
  pass: boolean;
  bytes: number;
  pages: number;
  title: string;
  checks: Record<string, boolean>;
  error?: string;
}

async function evalForm(
  file: string,
  state: string,
  referenceBytes: number,
  refPages: number,
): Promise<EvalResult> {
  const filePath = join(FORMS_DIR, file);
  const buf = await readFile(filePath);

  let pages = 0;
  let title = "";
  try {
    const doc = await PDFDocument.load(buf);
    pages = doc.getPageCount();
    title = doc.getTitle() ?? "";
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { state, file, pass: false, bytes: buf.length, pages: 0, title: "", checks: { pdfLoadable: false }, error: msg };
  }

  const tolerance = 0.05; // ±5 % — allow tiny timestamp/ID drift
  const checks: Record<string, boolean> = {
    pdfLoadable:  true,
    minSize:      buf.length >= 1500,
    sizeInRange:  Math.abs(buf.length - referenceBytes) / referenceBytes <= tolerance,
    pageCount:    pages === refPages,
    hasTitle:     title.length > 0,
  };

  const pass = Object.values(checks).every(Boolean);
  return { state, file, pass, bytes: buf.length, pages, title, checks };
}

async function main() {
  const coverage = listStateFormCoverage();
  const files = new Set((await readdir(FORMS_DIR)).filter(f => f.endsWith(".pdf")));

  console.log("\n=== TENDED FORM EVALUATION REPORT ===");
  console.log(`Date     : 2026-06-24`);
  console.log(`States   : ${coverage.length}`);
  console.log(`Files    : ${files.size}`);
  console.log(`Test data: Alex Rivera / Friends of Urban Forests / June 2026 / 20h\n`);

  // Pre-generate reference PDFs in memory to get canonical byte sizes
  console.log("Generating reference PDFs in memory for size baselines...");
  const reference = new Map<string, { bytes: number; pages: number }>();
  for (const { state } of coverage) {
    const { pdf } = await buildStateForm(state, TEST_DATA);
    const doc = await PDFDocument.load(pdf);
    reference.set(state, { bytes: pdf.length, pages: doc.getPageCount() });
  }

  // Evaluate each file
  const results: EvalResult[] = [];
  for (const { state, formId } of coverage) {
    const filename = `${state.toLowerCase()}-${formId.replace(/[\s/]+/g, "-").toLowerCase()}.pdf`;
    if (!files.has(filename)) {
      results.push({
        state, file: filename, pass: false, bytes: 0, pages: 0, title: "",
        checks: { fileExists: false }, error: "file not found in output directory",
      });
      continue;
    }
    const ref = reference.get(state)!;
    const result = await evalForm(filename, state, ref.bytes, ref.pages);
    results.push(result);
  }

  const passed = results.filter(r => r.pass);
  const failed = results.filter(r => !r.pass);

  console.log(`PASSED : ${passed.length} / ${results.length}`);
  console.log(`FAILED : ${failed.length} / ${results.length}`);

  if (failed.length) {
    console.log("\n--- FAILURES ---");
    for (const r of failed) {
      const bad = Object.entries(r.checks).filter(([,v]) => !v).map(([k]) => k);
      console.log(`  ✗ ${r.state.padEnd(4)} ${r.file}`);
      console.log(`       failing: ${bad.join(", ")}${r.error ? ` | ${r.error}` : ""}`);
      console.log(`       bytes=${r.bytes}  pages=${r.pages}  title="${r.title}"`);
    }
  }

  console.log("\n--- ALL RESULTS ---");
  for (const r of results) {
    const icon = r.pass ? "✓" : "✗";
    console.log(
      `  ${icon} ${r.state.padEnd(4)} ${String(r.bytes).padStart(6)} B  ${r.pages}p  "${r.title.slice(0, 55)}"`
    );
  }

  console.log("\n=== END REPORT ===\n");
  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
