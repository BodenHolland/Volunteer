import type { Locale } from "@/lib/i18n";

export type ArticleMeta = {
  number: number;
  slug: string;
  title: string;
  title_es: string;
  starred?: boolean;
};

export const ARTICLES: ArticleMeta[] = [
  { number: 1, slug: "1-what-is-tended", title: "What is Tended?", title_es: "¿Qué es Tended?" },
  { number: 2, slug: "2-how-it-works", title: "How the platform works (for volunteers)", title_es: "Cómo funciona la plataforma (para voluntarios)" },
  { number: 3, slug: "3-funding", title: "Who funds Tended", title_es: "Quién financia Tended" },
  { number: 4, slug: "4-what-counts", title: "What counts as SNAP volunteer hours, and our authority for it", title_es: "Qué cuenta como horas de voluntariado para SNAP, y nuestra autoridad para ello", starred: true },
  { number: 5, slug: "5-remote-online", title: "Why remote and online volunteer hours count", title_es: "Por qué cuentan las horas de voluntariado remoto y en línea", starred: true },
  { number: 6, slug: "6-surveys", title: "Surveys & community-research contributions", title_es: "Encuestas y contribuciones de investigación comunitaria" },
  { number: 7, slug: "7-not-count", title: "What does NOT count", title_es: "Qué NO cuenta" },
  { number: 8, slug: "8-verify", title: "How we verify volunteer hours", title_es: "Cómo verificamos las horas de voluntariado", starred: true },
  { number: 9, slug: "9-calibrate", title: "How we calibrate hour caps", title_es: "Cómo calibramos los topes de horas" },
  { number: 10, slug: "10-certifier", title: "Who certifies your hours, and how", title_es: "Quién certifica tus horas, y cómo" },
  { number: 11, slug: "11-privacy", title: "Privacy, PII, and what we publish", title_es: "Privacidad, datos personales y lo que publicamos" },
  { number: 12, slug: "12-caseworkers", title: "For caseworkers — a one-page methodology", title_es: "Para trabajadores sociales — una metodología de una página", starred: true },
  { number: 13, slug: "13-ledger", title: "Audit & methodology ledger", title_es: "Registro de auditoría y metodología" },
  { number: 14, slug: "14-questioned", title: "What happens if a county questions your hours", title_es: "Qué pasa si un condado cuestiona tus horas" },
  { number: 15, slug: "15-legal-help", title: "Where to get legal help", title_es: "Dónde conseguir ayuda legal" },
];

export type SectionMeta = {
  name: string;
  name_es: string;
  range: readonly [number, number];
};

export const SECTIONS: SectionMeta[] = [
  { name: "About Tended", name_es: "Acerca de Tended", range: [1, 3] as const },
  { name: "What counts as SNAP volunteer hours", name_es: "Qué cuenta como horas de voluntariado para SNAP", range: [4, 7] as const },
  { name: "How we verify", name_es: "Cómo verificamos", range: [8, 11] as const },
  { name: "For caseworkers", name_es: "Para trabajadores sociales", range: [12, 13] as const },
  { name: "If your hours are questioned", name_es: "Si se cuestionan tus horas", range: [14, 15] as const },
];

export function articleTitle(a: ArticleMeta, locale: Locale): string {
  return locale === "es" ? a.title_es : a.title;
}

export function sectionName(s: SectionMeta, locale: Locale): string {
  return locale === "es" ? s.name_es : s.name;
}

export function neighbors(n: number, locale: Locale = "en") {
  const prev = ARTICLES.find((a) => a.number === n - 1);
  const next = ARTICLES.find((a) => a.number === n + 1);
  return {
    prev: prev ? { href: `/help/${prev.slug}`, title: articleTitle(prev, locale) } : undefined,
    next: next ? { href: `/help/${next.slug}`, title: articleTitle(next, locale) } : undefined,
  };
}
