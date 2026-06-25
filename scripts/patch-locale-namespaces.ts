#!/usr/bin/env tsx
/**
 * Extracts top-level namespace blocks from en.ts and appends missing ones
 * to each locale file as English fallbacks.
 */
import { readFileSync, writeFileSync } from "fs";

const enSrc = readFileSync("./lib/i18n/dictionaries/en.ts", "utf8");

// Extract all top-level namespace blocks from en.ts
// A namespace looks like:  name: {\n    ...\n  },
function extractNamespaces(src: string): Map<string, string> {
  const result = new Map<string, string>();
  // Find all top-level "  name: {" patterns
  const topLevelRe = /^  ([a-zA-Z]\w*): \{/gm;
  let m: RegExpExecArray | null;
  const starts: { name: string; pos: number }[] = [];
  while ((m = topLevelRe.exec(src)) !== null) {
    starts.push({ name: m[1], pos: m.index });
  }

  for (let i = 0; i < starts.length; i++) {
    const { name, pos } = starts[i];
    const end = i < starts.length - 1 ? starts[i + 1].pos : src.length;
    let block = src.slice(pos, end).trimEnd();
    // Remove trailing comma if present, we'll add it back
    if (block.endsWith(",")) block = block.slice(0, -1);
    result.set(name, block);
  }
  return result;
}

const enNamespaces = extractNamespaces(enSrc);

const LOCALES = ["es", "ko", "tl", "vi", "zh"];

for (const locale of LOCALES) {
  const path = `./lib/i18n/dictionaries/${locale}.ts`;
  let src = readFileSync(path, "utf8");

  // Find which top-level namespaces are already in this locale file
  const topLevelRe = /^  ([a-zA-Z]\w*): \{/gm;
  const existing = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = topLevelRe.exec(src)) !== null) {
    existing.add(m[1]);
  }

  // Find missing namespaces (preserve en.ts order)
  const missing: string[] = [];
  for (const [name] of enNamespaces) {
    if (!existing.has(name)) {
      missing.push(name);
    }
  }

  if (missing.length === 0) {
    console.log(`${locale}: no missing namespaces`);
    continue;
  }

  // Insert missing blocks before the final `};`
  const insertIdx = src.lastIndexOf("\n};\n") !== -1
    ? src.lastIndexOf("\n};\n")
    : src.lastIndexOf("\n};");
  const toInsert = missing
    .map((name) => {
      const block = enNamespaces.get(name)!;
      return `  ${block},`;
    })
    .join("\n");

  src = src.slice(0, insertIdx) + "\n" + toInsert + src.slice(insertIdx);

  writeFileSync(path, src, "utf8");
  console.log(`${locale}: added ${missing.length} namespaces: ${missing.join(", ")}`);
}

console.log("Done.");
