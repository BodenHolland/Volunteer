export type ArticleMeta = {
  number: number;
  slug: string;
  title: string;
  starred?: boolean;
};

export const ARTICLES: ArticleMeta[] = [
  { number: 1, slug: "1-what-is-tended", title: "What is Tended?" },
  { number: 2, slug: "2-how-it-works", title: "How the platform works (for volunteers)" },
  { number: 3, slug: "3-funding", title: "Who funds Tended" },
  { number: 4, slug: "4-what-counts", title: "What counts as SNAP volunteer hours, and our authority for it", starred: true },
  { number: 5, slug: "5-remote-online", title: "Why remote and online volunteer hours count", starred: true },
  { number: 6, slug: "6-surveys", title: "Surveys & community-research contributions" },
  { number: 7, slug: "7-not-count", title: "What does NOT count" },
  { number: 8, slug: "8-verify", title: "How we verify volunteer hours", starred: true },
  { number: 9, slug: "9-calibrate", title: "How we calibrate hour caps" },
  { number: 10, slug: "10-certifier", title: "Who certifies your hours, and how" },
  { number: 11, slug: "11-privacy", title: "Privacy, PII, and what we publish" },
  { number: 12, slug: "12-caseworkers", title: "For caseworkers — a one-page methodology", starred: true },
  { number: 13, slug: "13-ledger", title: "Audit & methodology ledger" },
  { number: 14, slug: "14-questioned", title: "What happens if a county questions your hours" },
  { number: 15, slug: "15-legal-help", title: "Where to get legal help" },
];

export const SECTIONS = [
  { name: "About Tended", range: [1, 3] as const },
  { name: "What counts as SNAP volunteer hours", range: [4, 7] as const },
  { name: "How we verify", range: [8, 11] as const },
  { name: "For caseworkers", range: [12, 13] as const },
  { name: "If your hours are questioned", range: [14, 15] as const },
];

export function neighbors(n: number) {
  const prev = ARTICLES.find((a) => a.number === n - 1);
  const next = ARTICLES.find((a) => a.number === n + 1);
  return {
    prev: prev ? { href: `/help/${prev.slug}`, title: prev.title } : undefined,
    next: next ? { href: `/help/${next.slug}`, title: next.title } : undefined,
  };
}
