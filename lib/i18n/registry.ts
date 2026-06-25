// English-only build. See lib/i18n/loaders.ts for the rationale.
// Multi-language registry is on the `archive/i18n-full` branch.

export interface LocaleMeta {
  name: string;
  englishName: string;
  short: string;
  rtl: boolean;
}

export const LOCALE_META: Record<string, LocaleMeta> = {
  en: { name: "English", englishName: "English", short: "EN", rtl: false },
};
