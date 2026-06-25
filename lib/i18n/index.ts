import { cookies } from "next/headers";
import { LOCALE_META } from "./registry";
import { DICTS, type Dict } from "./loaders";

export type { Dict };
export type Locale = string;
export { LOCALE_META };

export function getDictionary(locale: string): Dict {
  return DICTS[locale] ?? DICTS.en;
}

export async function getLocale(): Promise<string> {
  const c = await cookies();
  const val = c.get("locale")?.value ?? "en";
  return val in LOCALE_META ? val : "en";
}

export async function getDict(): Promise<{ locale: string; t: Dict }> {
  const locale = await getLocale();
  return { locale, t: getDictionary(locale) };
}

/** Safe accessor for page-local COPY objects that only cover some locales.
 *  Falls back to the "en" key when the requested locale has no entry. */
export function fromCopy<T>(copy: { en: T } & Partial<Record<string, T>>, locale: string): T {
  return copy[locale] ?? copy.en;
}
