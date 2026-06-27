/**
 * Minimal PDF text extractor for tests.
 *
 * The CF 888 and every state form are drawn with pdf-lib by overlaying text at
 * fixed coordinates (no AcroForm fields to read back). pdf-lib emits each
 * drawText as a hex- (or, rarely, literal-) string `Tj` operator inside a
 * FlateDecode-compressed content stream. To assert that the PARTICIPANT'S DATA
 * actually lands in the produced PDF — not merely that "it is a PDF" — we
 * inflate every content stream and decode the `Tj` text operands back to the
 * rendered strings.
 *
 * This is test-only and intentionally simple (no full PDF parser): it is enough
 * to prove name / hours / case-number values are rendered into the document.
 */
import { inflateSync } from "node:zlib";

/** Return the list of rendered text runs (one per Tj operator), in document order. */
export function extractPdfTextRuns(bytes: Uint8Array): string[] {
  const buf = Buffer.from(bytes);
  const raw = buf.toString("latin1");
  const runs: string[] = [];
  const re = /stream\r?\n/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    const start = m.index + m[0].length;
    const end = raw.indexOf("endstream", start);
    if (end < 0) continue;
    const chunk = buf.subarray(start, end);
    let content: string;
    try {
      content = inflateSync(chunk).toString("latin1");
    } catch {
      content = chunk.toString("latin1"); // uncompressed stream
    }
    for (const hm of content.matchAll(/<([0-9A-Fa-f]+)>\s*Tj/g)) {
      runs.push(Buffer.from(hm[1], "hex").toString("latin1"));
    }
    for (const pm of content.matchAll(/\(((?:[^()\\]|\\.)*)\)\s*Tj/g)) {
      runs.push(pm[1].replace(/\\([()\\])/g, "$1"));
    }
  }
  return runs;
}

/** Concatenated rendered text (newline-joined runs) for substring assertions. */
export function extractPdfText(bytes: Uint8Array): string {
  return extractPdfTextRuns(bytes).join("\n");
}
