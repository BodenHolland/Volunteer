// English-only build. Multi-language dictionaries are archived on the
// `archive/i18n-full` branch; restore them there if you want to ship
// localized copy again. Single-locale bundle keeps the Worker small.
import { en } from "./dictionaries/en";
export type Dict = typeof en;

export const DICTS: Record<string, Dict> = { en };
