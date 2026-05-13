import { dirname } from "path";
import { fileURLToPath } from "url";
import nextConfig    from "eslint-config-next/core-web-vitals";
import tseslint      from "typescript-eslint";
import jsxA11y       from "eslint-plugin-jsx-a11y";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default tseslint.config(
  // -- Next.js core rules --------------------------------------------------
  // Includes: @next/next, react, react-hooks, basic @typescript-eslint,
  // import, and 6 selective jsx-a11y rules.
  ...nextConfig,

  // -- TypeScript type-checked rules ---------------------------------------
  // Scoped to TS files only. Uses projectService so ESLint finds the
  // right tsconfig automatically - no manual path config needed.
  tseslint.config({
    extends: tseslint.configs.recommendedTypeChecked,
    files:   ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parserOptions: {
        projectService:  true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      // High-signal errors - catch real async bugs
      "@typescript-eslint/no-floating-promises":    "error",
      "@typescript-eslint/no-misused-promises":     "error",
      "@typescript-eslint/await-thenable":          "error",

      // Warn for now; harden to 'error' incrementally.
      // These are noisy on a codebase that hasn't been type-checked at
      // lint level before. Fix the warnings, then promote to error.
      "@typescript-eslint/no-unsafe-assignment":    "warn",
      "@typescript-eslint/no-unsafe-member-access": "warn",
      "@typescript-eslint/no-unsafe-argument":      "warn",
      "@typescript-eslint/no-unsafe-return":        "warn",
      "@typescript-eslint/no-unsafe-call":          "warn",
      "@typescript-eslint/no-explicit-any":         "warn",

      // Off - too noisy for existing patterns
      "@typescript-eslint/no-base-to-string":             "off",
      "@typescript-eslint/restrict-template-expressions": "off",
    },
  }),

  // -- Full jsx-a11y recommended ---------------------------------------------
  // next/core-web-vitals already registers the jsx-a11y plugin; spreading
  // flatConfigs.recommended (which includes a `plugins` key) would cause
  // ESLint 9 to throw "Cannot redefine plugin". Rules-only override here.
  {
    files: ["**/*.tsx", "**/*.jsx"],
    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,

      // Start as warnings; promote to error once fixed
      "jsx-a11y/click-events-have-key-events":           "warn",
      "jsx-a11y/no-noninteractive-element-interactions": "warn",
      "jsx-a11y/no-static-element-interactions":         "warn",
      "jsx-a11y/anchor-ambiguous-text":                  "warn",

      // Already covered by Next.js <Image> checks
      "jsx-a11y/alt-text": "off",
    },
  },

  // -- Global ignores --------------------------------------------------------
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "**/*.stories.ts",
      "**/*.stories.tsx",
      "**/*.stories.mdx",
      "stories/**",
      ".storybook/**",
    ],
  },
);
