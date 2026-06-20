import { cookies } from "next/headers";
import { en } from "./dictionaries/en";
import { es } from "./dictionaries/es";

export type Locale = "en" | "es";
export const LOCALES: Locale[] = ["en", "es"];
export const LOCALE_LABELS: Record<Locale, string> = { en: "English", es: "Español" };

export type Dict = typeof en;

export function getDictionary(locale: Locale): Dict {
  return locale === "es" ? (es as Dict) : en;
}

/** Current UI locale from the `locale` cookie (defaults to English). */
export async function getLocale(): Promise<Locale> {
  const c = await cookies();
  return c.get("locale")?.value === "es" ? "es" : "en";
}

export async function getDict(): Promise<{ locale: Locale; t: Dict }> {
  const locale = await getLocale();
  return { locale, t: getDictionary(locale) };
}
