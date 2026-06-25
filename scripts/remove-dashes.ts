#!/usr/bin/env tsx
/**
 * Removes em dashes (—) and en dashes (–) from all locale files and app source.
 * Rules:
 *  1. " — colift" in meta titles → " | colift"
 *  2. </strong> — or </code> —  → </strong>:  (HTML option strings)
 *  3. "— text" at string start (after quote) → "Text" (leading dash removed)
 *  4. Everything else: " — " or " – " → ", "
 */

import { readFileSync, writeFileSync } from "fs";
import { readdirSync, statSync } from "fs";
import { join } from "path";

function fix(src: string): string {
  // 1. Meta title separator: " — colift" → " | colift"
  src = src.replace(/ — colift"/g, ' | colift"');
  src = src.replace(/ — Help Center"/g, ' | Help Center"');

  // 2. HTML inline option descriptions: </strong> — or </code> —  → </strong>:
  src = src.replace(/<\/strong> — /g, "</strong>: ");
  src = src.replace(/<\/code> — /g, "</code>: ");

  // 3. Leading dash at string value start: ": "— text" → ": "Text"
  //    Matches quote char + em/en dash + space at the start of a string value
  src = src.replace(/": "— /g, '": "');
  src = src.replace(/": "– /g, '": "');
  // Also inside template literals and after `
  src = src.replace(/`— /g, "`");

  // 4. " — " remaining → ", "  (mid-sentence pause)
  src = src.replace(/ — /g, ", ");
  src = src.replace(/ – /g, ", ");

  // 5. Trailing bare dashes (e.g. "word —") → "word"
  src = src.replace(/ —"/g, '"');
  src = src.replace(/ –"/g, '"');

  // 6. Any remaining stray em/en dash
  src = src.replace(/—/g, "");
  src = src.replace(/–/g, "");

  return src;
}

function walkFiles(dir: string, ext: string[]): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (entry === "node_modules" || entry === ".next" || entry === ".git") continue;
    const stat = statSync(full);
    if (stat.isDirectory()) {
      results.push(...walkFiles(full, ext));
    } else if (ext.some((e) => full.endsWith(e))) {
      results.push(full);
    }
  }
  return results;
}

const root = process.cwd();
const files = [
  ...walkFiles(join(root, "lib/i18n/dictionaries"), [".ts"]),
  ...walkFiles(join(root, "app"), [".tsx", ".ts"]),
  ...walkFiles(join(root, "components"), [".tsx", ".ts"]),
];

let changed = 0;
for (const f of files) {
  const orig = readFileSync(f, "utf8");
  const next = fix(orig);
  if (next !== orig) {
    writeFileSync(f, next, "utf8");
    console.log(`fixed: ${f.replace(root + "/", "")}`);
    changed++;
  }
}

console.log(`\nDone. ${changed} files updated.`);
