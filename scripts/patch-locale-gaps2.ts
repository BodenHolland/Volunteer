#!/usr/bin/env tsx
import { readFileSync, writeFileSync } from "fs";

const LOCALES = ["es", "ko", "tl", "vi", "zh"];

for (const locale of LOCALES) {
  const path = `./lib/i18n/dictionaries/${locale}.ts`;
  let src = readFileSync(path, "utf8");

  // 1. Add skipToContent at the very start of the landing block if not already there
  //    (the key may exist in another namespace, so check it's in the landing block)
  const landingStart = src.indexOf("  landing: {");
  const landingEnd = src.indexOf("\n  },\n", landingStart); // closing of landing
  const landingBlock = src.slice(landingStart, landingEnd);
  if (!landingBlock.includes("    skipToContent:")) {
    // Insert after `  landing: {\n`
    const afterOpen = src.indexOf("\n", landingStart) + 1;
    src = src.slice(0, afterOpen) + `    skipToContent: "Skip to content",\n` + src.slice(afterOpen);
    console.log(`${locale}: added landing.skipToContent`);
  }

  // 2. orgTasks.noOrgLinked — add at start of orgTasks block
  const orgTasksIdx = src.indexOf("  orgTasks: {");
  if (orgTasksIdx !== -1) {
    const orgTasksBlock = src.slice(orgTasksIdx, src.indexOf("\n  },\n", orgTasksIdx));
    if (!orgTasksBlock.includes("    noOrgLinked:")) {
      const afterOpen = src.indexOf("\n", orgTasksIdx) + 1;
      src = src.slice(0, afterOpen) + `    noOrgLinked: "No organization linked.",\n` + src.slice(afterOpen);
      console.log(`${locale}: added orgTasks.noOrgLinked`);
    }
  }

  // 3. orgProfilePage missing keys — insert at start of block
  const orgProfileIdx = src.indexOf("  orgProfilePage: {");
  if (orgProfileIdx !== -1) {
    const orgProfileBlock = src.slice(orgProfileIdx, src.indexOf("\n  },\n", orgProfileIdx));
    const missingProfileKeys: [string, string][] = [
      ["noOrgLinked", "No organization linked."],
      ["streetAddressPlaceholder", "123 Main St"],
      ["suitePlaceholder", "Suite 100"],
      ["cityPlaceholder", "City"],
      ["statePlaceholder", "CA"],
      ["zipPlaceholder", "00000"],
    ];
    const missing = missingProfileKeys.filter(([k]) => !orgProfileBlock.includes(`    ${k}:`));
    if (missing.length > 0) {
      const afterOpen = src.indexOf("\n", orgProfileIdx) + 1;
      const block = missing.map(([k, v]) => `    ${k}: "${v}",`).join("\n");
      src = src.slice(0, afterOpen) + block + "\n" + src.slice(afterOpen);
      console.log(`${locale}: added orgProfilePage keys: ${missing.map(([k]) => k).join(", ")}`);
    }
  }

  writeFileSync(path, src, "utf8");
}

console.log("Done.");
