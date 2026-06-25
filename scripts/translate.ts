#!/usr/bin/env tsx
/**
 * Translates the English dictionary to any of the 99 M2M100-supported languages
 * using Cloudflare Workers AI (@cf/meta/m2m100-1.2b).
 *
 * Usage:
 *   pnpm translate fr zh vi tl ko   — translate to specific locales
 *   pnpm translate --all              — translate to all 99 supported locales
 *   pnpm translate --list             — list all supported locale codes
 *   pnpm translate --sync             — regenerate registry.ts + loaders.ts only
 *
 * Env vars required for translation (not needed for --list or --sync):
 *   CF_ACCOUNT_ID   your Cloudflare account ID
 *   CF_API_TOKEN    Workers AI–enabled API token (dash.cloudflare.com > My Profile > API Tokens)
 *
 * Existing files are never overwritten unless --force is passed.
 * English (en) and any already-translated locales are skipped by default.
 */

import { writeFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..");
const DICTS_DIR = join(ROOT, "lib", "i18n", "dictionaries");
const REGISTRY_PATH = join(ROOT, "lib", "i18n", "registry.ts");
const LOADERS_PATH = join(ROOT, "lib", "i18n", "loaders.ts");

// ---------------------------------------------------------------------------
// Full M2M100 language table
// cfName = the lowercase language name the Cloudflare AI API expects
// ---------------------------------------------------------------------------
interface LocaleInfo {
  name: string;
  short: string;
  rtl: boolean;
  cfName: string;
}

function toTitleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

const ALL_LOCALES: Record<string, LocaleInfo> = {
  af:  { name: "Afrikaans",          short: "AF",  rtl: false, cfName: "afrikaans" },
  am:  { name: "አማርኛ",              short: "AM",  rtl: false, cfName: "amharic" },
  ar:  { name: "العربية",            short: "AR",  rtl: true,  cfName: "arabic" },
  ast: { name: "Asturianu",          short: "AST", rtl: false, cfName: "asturian" },
  az:  { name: "Azərbaycan",         short: "AZ",  rtl: false, cfName: "azerbaijani" },
  ba:  { name: "Башҡорт",            short: "BA",  rtl: false, cfName: "bashkir" },
  be:  { name: "Беларуская",         short: "BE",  rtl: false, cfName: "belarusian" },
  bg:  { name: "Български",          short: "BG",  rtl: false, cfName: "bulgarian" },
  bn:  { name: "বাংলা",              short: "BN",  rtl: false, cfName: "bengali" },
  br:  { name: "Brezhoneg",          short: "BR",  rtl: false, cfName: "breton" },
  bs:  { name: "Bosanski",           short: "BS",  rtl: false, cfName: "bosnian" },
  ca:  { name: "Català",             short: "CA",  rtl: false, cfName: "catalan" },
  ceb: { name: "Cebuano",            short: "CEB", rtl: false, cfName: "cebuano" },
  cs:  { name: "Čeština",            short: "CS",  rtl: false, cfName: "czech" },
  cy:  { name: "Cymraeg",            short: "CY",  rtl: false, cfName: "welsh" },
  da:  { name: "Dansk",              short: "DA",  rtl: false, cfName: "danish" },
  de:  { name: "Deutsch",            short: "DE",  rtl: false, cfName: "german" },
  el:  { name: "Ελληνικά",           short: "EL",  rtl: false, cfName: "greek" },
  es:  { name: "Español",            short: "ES",  rtl: false, cfName: "spanish" },
  et:  { name: "Eesti",              short: "ET",  rtl: false, cfName: "estonian" },
  fa:  { name: "فارسی",              short: "FA",  rtl: true,  cfName: "persian" },
  ff:  { name: "Fula",               short: "FF",  rtl: false, cfName: "fulah" },
  fi:  { name: "Suomi",              short: "FI",  rtl: false, cfName: "finnish" },
  fr:  { name: "Français",           short: "FR",  rtl: false, cfName: "french" },
  fy:  { name: "Frysk",              short: "FY",  rtl: false, cfName: "western frisian" },
  ga:  { name: "Gaeilge",            short: "GA",  rtl: false, cfName: "irish" },
  gd:  { name: "Gàidhlig",           short: "GD",  rtl: false, cfName: "scottish gaelic" },
  gl:  { name: "Galego",             short: "GL",  rtl: false, cfName: "galician" },
  gu:  { name: "ગુજરાતી",            short: "GU",  rtl: false, cfName: "gujarati" },
  ha:  { name: "Hausa",              short: "HA",  rtl: false, cfName: "hausa" },
  he:  { name: "עברית",              short: "HE",  rtl: true,  cfName: "hebrew" },
  hi:  { name: "हिन्दी",              short: "HI",  rtl: false, cfName: "hindi" },
  hr:  { name: "Hrvatski",           short: "HR",  rtl: false, cfName: "croatian" },
  ht:  { name: "Kreyòl ayisyen",     short: "HT",  rtl: false, cfName: "haitian creole" },
  hu:  { name: "Magyar",             short: "HU",  rtl: false, cfName: "hungarian" },
  hy:  { name: "Հայերեն",            short: "HY",  rtl: false, cfName: "armenian" },
  id:  { name: "Bahasa Indonesia",   short: "ID",  rtl: false, cfName: "indonesian" },
  ig:  { name: "Igbo",               short: "IG",  rtl: false, cfName: "igbo" },
  ilo: { name: "Ilokano",            short: "ILO", rtl: false, cfName: "iloko" },
  is:  { name: "Íslenska",           short: "IS",  rtl: false, cfName: "icelandic" },
  it:  { name: "Italiano",           short: "IT",  rtl: false, cfName: "italian" },
  ja:  { name: "日本語",              short: "JA",  rtl: false, cfName: "japanese" },
  jv:  { name: "Basa Jawa",          short: "JV",  rtl: false, cfName: "javanese" },
  ka:  { name: "ქართული",            short: "KA",  rtl: false, cfName: "georgian" },
  kk:  { name: "Қазақша",            short: "KK",  rtl: false, cfName: "kazakh" },
  km:  { name: "ខ្មែរ",              short: "KM",  rtl: false, cfName: "central khmer" },
  kn:  { name: "ಕನ್ನಡ",              short: "KN",  rtl: false, cfName: "kannada" },
  ko:  { name: "한국어",              short: "KO",  rtl: false, cfName: "korean" },
  lb:  { name: "Lëtzebuergesch",     short: "LB",  rtl: false, cfName: "luxembourgish" },
  lg:  { name: "Luganda",            short: "LG",  rtl: false, cfName: "ganda" },
  ln:  { name: "Lingála",            short: "LN",  rtl: false, cfName: "lingala" },
  lo:  { name: "ລາວ",               short: "LO",  rtl: false, cfName: "lao" },
  lt:  { name: "Lietuvių",           short: "LT",  rtl: false, cfName: "lithuanian" },
  lv:  { name: "Latviešu",           short: "LV",  rtl: false, cfName: "latvian" },
  mg:  { name: "Malagasy",           short: "MG",  rtl: false, cfName: "malagasy" },
  mk:  { name: "Македонски",         short: "MK",  rtl: false, cfName: "macedonian" },
  ml:  { name: "മലയാളം",             short: "ML",  rtl: false, cfName: "malayalam" },
  mn:  { name: "Монгол",             short: "MN",  rtl: false, cfName: "mongolian" },
  ms:  { name: "Bahasa Melayu",      short: "MS",  rtl: false, cfName: "malay" },
  my:  { name: "မြန်မာ",             short: "MY",  rtl: false, cfName: "burmese" },
  ne:  { name: "नेपाली",             short: "NE",  rtl: false, cfName: "nepali" },
  nl:  { name: "Nederlands",         short: "NL",  rtl: false, cfName: "dutch" },
  no:  { name: "Norsk",              short: "NO",  rtl: false, cfName: "norwegian" },
  ns:  { name: "Sesotho sa Leboa",   short: "NS",  rtl: false, cfName: "northern sotho" },
  oc:  { name: "Occitan",            short: "OC",  rtl: false, cfName: "occitan" },
  or:  { name: "ଓଡ଼ିଆ",              short: "OR",  rtl: false, cfName: "oriya" },
  pa:  { name: "ਪੰਜਾਬੀ",             short: "PA",  rtl: false, cfName: "punjabi" },
  pl:  { name: "Polski",             short: "PL",  rtl: false, cfName: "polish" },
  ps:  { name: "پښتو",               short: "PS",  rtl: true,  cfName: "pashto" },
  pt:  { name: "Português",          short: "PT",  rtl: false, cfName: "portuguese" },
  ro:  { name: "Română",             short: "RO",  rtl: false, cfName: "romanian" },
  ru:  { name: "Русский",            short: "RU",  rtl: false, cfName: "russian" },
  sd:  { name: "سنڌي",               short: "SD",  rtl: true,  cfName: "sindhi" },
  si:  { name: "සිංහල",              short: "SI",  rtl: false, cfName: "sinhala" },
  sk:  { name: "Slovenčina",         short: "SK",  rtl: false, cfName: "slovak" },
  sl:  { name: "Slovenščina",        short: "SL",  rtl: false, cfName: "slovenian" },
  so:  { name: "Soomaali",           short: "SO",  rtl: false, cfName: "somali" },
  sq:  { name: "Shqip",              short: "SQ",  rtl: false, cfName: "albanian" },
  sr:  { name: "Српски",             short: "SR",  rtl: false, cfName: "serbian" },
  ss:  { name: "Siswati",            short: "SS",  rtl: false, cfName: "swati" },
  su:  { name: "Basa Sunda",         short: "SU",  rtl: false, cfName: "sundanese" },
  sv:  { name: "Svenska",            short: "SV",  rtl: false, cfName: "swedish" },
  sw:  { name: "Kiswahili",          short: "SW",  rtl: false, cfName: "swahili" },
  ta:  { name: "தமிழ்",              short: "TA",  rtl: false, cfName: "tamil" },
  th:  { name: "ภาษาไทย",            short: "TH",  rtl: false, cfName: "thai" },
  tl:  { name: "Filipino",           short: "TL",  rtl: false, cfName: "tagalog" },
  tn:  { name: "Setswana",           short: "TN",  rtl: false, cfName: "tswana" },
  tr:  { name: "Türkçe",             short: "TR",  rtl: false, cfName: "turkish" },
  uk:  { name: "Українська",         short: "UK",  rtl: false, cfName: "ukrainian" },
  ur:  { name: "اردو",               short: "UR",  rtl: true,  cfName: "urdu" },
  uz:  { name: "Oʻzbek",             short: "UZ",  rtl: false, cfName: "uzbek" },
  vi:  { name: "Tiếng Việt",         short: "VI",  rtl: false, cfName: "vietnamese" },
  wo:  { name: "Wolof",              short: "WO",  rtl: false, cfName: "wolof" },
  xh:  { name: "IsiXhosa",           short: "XH",  rtl: false, cfName: "xhosa" },
  yi:  { name: "ייִדיש",             short: "YI",  rtl: true,  cfName: "yiddish" },
  yo:  { name: "Yorùbá",             short: "YO",  rtl: false, cfName: "yoruba" },
  zh:  { name: "中文",               short: "ZH",  rtl: false, cfName: "chinese" },
  zu:  { name: "IsiZulu",            short: "ZU",  rtl: false, cfName: "zulu" },
};

// ---------------------------------------------------------------------------
// Dictionary helpers
// ---------------------------------------------------------------------------
type NestedStrings = { [key: string]: string | NestedStrings };

function flattenDict(obj: NestedStrings, prefix = ""): Array<[string, string]> {
  const result: Array<[string, string]> = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") {
      result.push([fullKey, value]);
    } else {
      result.push(...flattenDict(value as NestedStrings, fullKey));
    }
  }
  return result;
}

function setNested(obj: NestedStrings, path: string, value: string): void {
  const parts = path.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!cur[parts[i]] || typeof cur[parts[i]] === "string") cur[parts[i]] = {};
    cur = cur[parts[i]] as NestedStrings;
  }
  cur[parts[parts.length - 1]] = value;
}

function serializeDict(obj: NestedStrings, indent = 1): string {
  const pad = "  ".repeat(indent);
  const lines = Object.entries(obj).map(([k, v]) => {
    const key = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) ? k : JSON.stringify(k);
    if (typeof v === "string") {
      return `${pad}${key}: ${JSON.stringify(v)},`;
    }
    return `${pad}${key}: {\n${serializeDict(v as NestedStrings, indent + 1)}\n${pad}},`;
  });
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Translation providers
// ---------------------------------------------------------------------------

type Translator = (text: string, targetLangCfName: string, targetCode: string) => Promise<string>;

// Cloudflare Workers AI — best quality, requires an API token
function makeCfTranslator(accountId: string, apiToken: string): Translator {
  return async (text, targetLangCfName) => {
    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/m2m100-1.2b`;
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) await sleep(1000 * attempt);
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { Authorization: `Bearer ${apiToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({ text, source_lang: "english", target_lang: targetLangCfName }),
        });
        if (res.status === 429) { await sleep(2000 * (attempt + 1)); continue; }
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
        const data = (await res.json()) as { result?: { translated_text: string } };
        if (!data.result?.translated_text) throw new Error(`Unexpected CF response: ${JSON.stringify(data)}`);
        return data.result.translated_text;
      } catch (e) { lastError = e as Error; }
    }
    throw lastError ?? new Error("CF translation failed after retries");
  };
}

// MyMemory — free, no key required (~5 000 words/day limit, ~4 languages/run)
// Free tier: https://mymemory.translated.net/doc/spec.php
const MY_MEMORY_CODES: Record<string, string> = {
  zh: "zh-CN",  // MyMemory uses zh-CN for Simplified Chinese
  jv: "jw",     // Javanese quirk
};

function makeMyMemoryTranslator(): Translator {
  return async (_text, _cfName, targetCode) => {
    const to = MY_MEMORY_CODES[targetCode] ?? targetCode;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(_text)}&langpair=en|${to}`;
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) await sleep(1500 * attempt);
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as {
          responseStatus: number;
          responseData: { translatedText: string };
          responseMessage?: string;
        };
        if (data.responseStatus === 429) { await sleep(3000); continue; }
        if (data.responseStatus !== 200) throw new Error(data.responseMessage ?? "MyMemory error");
        const t = data.responseData.translatedText;
        if (!t) throw new Error("MyMemory returned empty translation");
        return t;
      } catch (e) { lastError = e as Error; }
    }
    throw lastError ?? new Error("MyMemory translation failed after retries");
  };
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ---------------------------------------------------------------------------
// File generation
// ---------------------------------------------------------------------------
async function translateLocale(
  locale: string,
  info: LocaleInfo,
  enDict: NestedStrings,
  translator: Translator,
  force: boolean,
  merge: boolean,
): Promise<void> {
  const outPath = join(DICTS_DIR, `${locale}.ts`);

  // --merge: load existing translations, only translate missing keys
  let existingMap: Record<string, string> = {};
  if (merge && !force && existsSync(outPath)) {
    try {
      const mod = await import(`${outPath}?t=${Date.now()}`);
      const existingDict = (mod[locale] ?? {}) as NestedStrings;
      for (const [k, v] of flattenDict(existingDict)) existingMap[k] = v;
    } catch {
      // If import fails, fall back to translating everything
    }
  }

  if (!merge && !force && existsSync(outPath)) {
    console.log(`  [${locale}] already exists — skip (use --force to overwrite, --merge to add new keys)`);
    return;
  }

  const pairs = flattenDict(enDict);
  const toTranslate = (merge && !force)
    ? pairs.filter(([key]) => !existingMap[key])
    : pairs;

  if (merge && !force && existsSync(outPath) && toTranslate.length === 0) {
    console.log(`  [${locale}] up to date — no new keys`);
    return;
  }

  const translated: NestedStrings = {};

  // Seed with existing translations first
  for (const [key, value] of pairs) {
    setNested(translated, key, existingMap[key] ?? value);
  }

  console.log(`  [${locale}] translating ${toTranslate.length} strings → ${info.name}…`);
  let done = 0;
  for (const [key, value] of toTranslate) {
    if (!value.trim()) {
      setNested(translated, key, value);
      done++;
      continue;
    }
    let result = value;
    try {
      result = await translator(value, info.cfName, locale);
    } catch (e) {
      process.stdout.write(`\n    [skip] ${key}: ${(e as Error).message}\n`);
    }
    setNested(translated, key, result);
    done++;
    if (done % 10 === 0) process.stdout.write(`    ${done}/${toTranslate.length}\r`);
    await sleep(150);
  }
  process.stdout.write("\n");
  const source = `import type { en } from "./en";\n\nexport const ${locale}: typeof en = {\n${serializeDict(translated)}\n};\n`;
  writeFileSync(outPath, source, "utf8");
  console.log(`  [${locale}] ✓ written to ${outPath}`);
}

// ---------------------------------------------------------------------------
// Registry + loaders regeneration
// ---------------------------------------------------------------------------
function syncRegistryAndLoaders(): void {
  // Discover all existing locale files
  const files = readdirSync(DICTS_DIR)
    .filter((f) => f.endsWith(".ts") && f !== "en.ts")
    .map((f) => f.replace(/\.ts$/, ""))
    .filter((code) => code in ALL_LOCALES || code === "es");

  // Always include en first, then sorted
  const allCodes = ["en", ...files.sort()];

  // registry.ts
  const metaEntries = allCodes.map((code) => {
    const info = code === "en"
      ? { name: "English", englishName: "English", short: "EN", rtl: false }
      : { ...ALL_LOCALES[code], englishName: toTitleCase(ALL_LOCALES[code].cfName) };
    return `  ${code}: { name: ${JSON.stringify(info.name)}, englishName: ${JSON.stringify(info.englishName)}, short: ${JSON.stringify(info.short)}, rtl: ${info.rtl} },`;
  });
  const registry = [
    "// Auto-generated — do not edit manually. Run: pnpm translate --sync",
    "// Add languages by running: pnpm translate [locale...] e.g. pnpm translate fr zh vi",
    "",
    "export interface LocaleMeta {",
    "  name: string;       // native name (shown in the language itself)",
    "  englishName: string; // English name (shown as subtitle)",
    "  short: string;      // label shown in the button/badge",
    "  rtl: boolean;",
    "}",
    "",
    "export const LOCALE_META: Record<string, LocaleMeta> = {",
    ...metaEntries,
    "};",
    "",
  ].join("\n");
  writeFileSync(REGISTRY_PATH, registry, "utf8");

  // loaders.ts
  const nonEn = files.sort();
  const imports = nonEn.map((code) => `import { ${code} } from "./dictionaries/${code}";`);
  const dictEntries = ["  en,", ...nonEn.map((code) => `  ${code}: ${code} as Dict,`)];
  const loaders = [
    "// Auto-generated — do not edit manually. Run: pnpm translate --sync",
    "// This file imports every generated dictionary so they are bundled at build time.",
    'import type { en as EnType } from "./dictionaries/en";',
    "export type Dict = typeof EnType;",
    "",
    'import { en } from "./dictionaries/en";',
    ...imports,
    "",
    "export const DICTS: Record<string, Dict> = {",
    ...dictEntries,
    "};",
    "",
  ].join("\n");
  writeFileSync(LOADERS_PATH, loaders, "utf8");

  console.log(`  registry.ts + loaders.ts updated (${allCodes.length} locales: ${allCodes.join(", ")})`);
}

// ---------------------------------------------------------------------------
// CLI entrypoint
// ---------------------------------------------------------------------------
async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--list")) {
    console.log("\nSupported locales (99 target languages):\n");
    for (const [code, info] of Object.entries(ALL_LOCALES)) {
      const exists = existsSync(join(DICTS_DIR, `${code}.ts`)) ? "✓" : " ";
      console.log(`  ${exists} ${code.padEnd(5)} ${info.name}`);
    }
    console.log("\n✓ = dictionary file already exists\n");
    return;
  }

  if (args.includes("--sync")) {
    console.log("Syncing registry.ts + loaders.ts from existing dictionary files…");
    syncRegistryAndLoaders();
    return;
  }

  const force = args.includes("--force");
  const merge = args.includes("--merge");
  const doAll = args.includes("--all");
  const requested = doAll
    ? Object.keys(ALL_LOCALES)
    : args.filter((a) => !a.startsWith("--"));

  if (requested.length === 0) {
    console.log(`
Usage:
  pnpm translate fr zh vi tl ko   — translate to specific locales
  pnpm translate --all              — translate all 99 supported locales
  pnpm translate --list             — show all locale codes + which exist
  pnpm translate --sync             — regenerate registry.ts + loaders.ts only
  pnpm translate --force fr         — overwrite existing translation
  pnpm translate --merge zh vi tl  — add new keys to existing translations

Providers (auto-selected):
  MyMemory  — free, no setup, ~4 languages/run (used when CF_API_TOKEN is unset)
  Cloudflare Workers AI — unlimited, set CF_API_TOKEN in .dev.vars to enable
`);
    return;
  }

  // Validate locales
  const invalid = requested.filter((c) => !(c in ALL_LOCALES));
  if (invalid.length) {
    console.error(`Unknown locale codes: ${invalid.join(", ")}\nRun pnpm translate --list to see all supported codes.`);
    process.exit(1);
  }

  // Skip 'en' (source language)
  const targets = requested.filter((c) => c !== "en");

  // Pick translation provider: Cloudflare (best) or MyMemory (free fallback)
  const accountId = process.env.CF_ACCOUNT_ID ?? "65fb048fa9b4fb99f6473038c393d6a0";
  const apiToken = process.env.CF_API_TOKEN ?? "";
  let translator: Translator;
  if (apiToken) {
    console.log("\nProvider: Cloudflare Workers AI (@cf/meta/m2m100-1.2b)");
    translator = makeCfTranslator(accountId, apiToken);
  } else {
    console.log("\nProvider: MyMemory (free, ~5 000 words/day ≈ 4 languages per run)");
    console.log("  Set CF_API_TOKEN in .dev.vars for unlimited translations via Cloudflare AI.\n");
    translator = makeMyMemoryTranslator();
  }

  // Import English source
  const { en: enDict } = await import("../lib/i18n/dictionaries/en.js");

  console.log(`Translating ${targets.length} locale(s)…\n`);
  for (const locale of targets) {
    await translateLocale(locale, ALL_LOCALES[locale], enDict as NestedStrings, translator, force, merge);
  }

  console.log("\nSyncing registry.ts + loaders.ts…");
  syncRegistryAndLoaders();
  console.log("\nDone. Rebuild the app to include the new dictionaries.\n");
}

main().catch((e) => { console.error(e); process.exit(1); });
