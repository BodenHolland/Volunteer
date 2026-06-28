import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Never lint generated / build / dependency output.
  {
    ignores: [
      ".next/**",
      ".open-next/**",
      "node_modules/**",
      "out/**",
      "build/**",
      "dist/**",
      "next-env.d.ts",
      "cloudflare-env.d.ts",
      "public/**",
    ],
  },

  ...compat.extends("next/core-web-vitals", "next/typescript"),

  {
    rules: {
      // ── Relaxed rules (see note below) ───────────────────────────────────
      // This ~30k-LOC codebase had never been linted. The CI lint gate is meant
      // to catch *new* regressions, not force a one-time restyle of existing
      // code. The rules below are downgraded to "warn" (still reported, never
      // fails CI) or "off" where they would otherwise require sweeping,
      // risk-bearing edits across the whole tree. Tighten incrementally later.

      // Pre-existing code has many intentional / placeholder `any`s (Cloudflare
      // env shims, AI JSON parsing, pdf-lib field access). Warn, don't block.
      "@typescript-eslint/no-explicit-any": "warn",

      // Unused vars/args are common in WIP server actions and destructured
      // props. Keep visible as warnings; allow leading-underscore opt-out.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],

      // React Hooks exhaustive-deps fixes can subtly change runtime behavior;
      // surfacing as warnings avoids a risky sweep.
      "react-hooks/exhaustive-deps": "warn",

      // The codebase uses plain <img> in a few spots (data:/blob: previews,
      // generated thumbnails) where next/image adds no value. Warn only.
      "@next/next/no-img-element": "warn",

      // Apostrophes/quotes in user-facing copy are everywhere; auto-escaping
      // them is churn with no correctness benefit.
      "react/no-unescaped-entities": "off",

      // ts-expect-error / ts-ignore directives exist for runtime shims. Warn.
      "@typescript-eslint/ban-ts-comment": "warn",

      // A few `let`s in pre-existing form/script code are never reassigned.
      // Stylistic only; surface as a warning rather than blocking CI on churn.
      "prefer-const": "warn",
    },
  },
];

export default eslintConfig;
