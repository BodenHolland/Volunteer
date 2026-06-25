// Auto-generated — do not edit manually. Run: pnpm translate --sync
// This file imports every generated dictionary so they are bundled at build time.
import type { en as EnType } from "./dictionaries/en";
export type Dict = typeof EnType;

import { en } from "./dictionaries/en";
import { es } from "./dictionaries/es";
import { ko } from "./dictionaries/ko";
import { tl } from "./dictionaries/tl";
import { vi } from "./dictionaries/vi";
import { zh } from "./dictionaries/zh";

export const DICTS: Record<string, Dict> = {
  en,
  es: es as Dict,
  ko: ko as Dict,
  tl: tl as Dict,
  vi: vi as Dict,
  zh: zh as Dict,
};
