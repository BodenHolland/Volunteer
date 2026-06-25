import type { Locale } from "@/lib/i18n";

export type ArticleMeta = {
  number: number;
  slug: string;
  title: string;
  title_es: string;
  starred?: boolean;
};

export const ARTICLES: ArticleMeta[] = [
  { number: 1, slug: "1-what-is-colift", title: "What is colift?", title_es: "¿Qué es colift?" },
  { number: 2, slug: "2-how-it-works", title: "How the platform works (for volunteers)", title_es: "Cómo funciona la plataforma (para voluntarios)" },
  { number: 3, slug: "3-funding", title: "Who funds colift", title_es: "Quién financia colift" },
  { number: 4, slug: "4-what-counts", title: "What counts as SNAP volunteer hours", title_es: "Qué cuenta como horas de voluntariado para SNAP", starred: true },
  { number: 5, slug: "5-remote-online", title: "Why remote and online volunteer hours count", title_es: "Por qué cuentan las horas de voluntariado remoto y en línea", starred: true },
  { number: 6, slug: "6-surveys", title: "Surveys & community-research contributions", title_es: "Encuestas y contribuciones de investigación comunitaria" },
  { number: 7, slug: "7-not-count", title: "What does NOT count", title_es: "Qué NO cuenta" },
  { number: 8, slug: "8-verify", title: "How we verify volunteer hours", title_es: "Cómo verificamos las horas de voluntariado", starred: true },
  { number: 9, slug: "9-calibrate", title: "How we calibrate hour caps", title_es: "Cómo calibramos los topes de horas" },
  { number: 10, slug: "10-certifier", title: "Who certifies your hours, and how", title_es: "Quién certifica tus horas, y cómo" },
  { number: 11, slug: "11-privacy", title: "Privacy, PII, and what we publish", title_es: "Privacidad, datos personales y lo que publicamos" },
  { number: 12, slug: "12-caseworkers", title: "For caseworkers — a one-page methodology", title_es: "Para trabajadores sociales — una metodología de una página", starred: true },
  { number: 13, slug: "13-ledger", title: "Audit & methodology ledger", title_es: "Registro de auditoría y metodología" },
  { number: 14, slug: "14-find-a-task", title: "How to find and commit to a task", title_es: "Cómo encontrar y comprometerte con una tarea" },
  { number: 15, slug: "15-complete-work", title: "How to complete and submit your work", title_es: "Cómo completar y enviar tu trabajo" },
  { number: 16, slug: "16-hours-cf888", title: "Your hours and how to download your CF 888", title_es: "Tus horas y cómo descargar tu formulario CF 888" },
  { number: 17, slug: "17-account-settings", title: "Changing your account details", title_es: "Cambiar los detalles de tu cuenta" },
  { number: 18, slug: "18-password-lockout", title: "Forgot your password or locked out", title_es: "Olvidaste tu contraseña o tu cuenta está bloqueada" },
  { number: 19, slug: "19-community-guidelines", title: "Community guidelines", title_es: "Normas de la comunidad" },
  { number: 20, slug: "20-contact-bug", title: "Report a bug or contact us", title_es: "Reportar un error o contactarnos" },
];

export type SectionMeta = {
  slug: string;
  name: string;
  name_es: string;
  range: readonly [number, number];
};

export const SECTIONS: SectionMeta[] = [
  { slug: "about", name: "About colift", name_es: "Acerca de colift", range: [1, 3] as const },
  { slug: "snap-hours", name: "What counts as SNAP volunteer hours", name_es: "Qué cuenta como horas de voluntariado para SNAP", range: [4, 7] as const },
  { slug: "verification", name: "How we verify", name_es: "Cómo verificamos", range: [8, 11] as const },
  { slug: "caseworkers", name: "For caseworkers", name_es: "Para trabajadores sociales", range: [12, 13] as const },
  { slug: "using-colift", name: "Using colift", name_es: "Usar colift", range: [14, 16] as const },
  { slug: "account", name: "Your account", name_es: "Tu cuenta", range: [17, 18] as const },
  { slug: "getting-help", name: "Getting help", name_es: "Obtener ayuda", range: [19, 20] as const },
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
