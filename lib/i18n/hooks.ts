// ============================================================
// ROSTER — i18n React hooks
// ------------------------------------------------------------
// Separated from the pure engine (index.ts) so server components
// and tests can import translate() without pulling in React.
//
// Usage in client components:
//   import { useTranslation } from "@/lib/i18n/hooks";
//   const { t, lang, dir } = useTranslation();
//   t("nav.dashboard")  // → "Dashboard" | "Tableau de bord" | …
// ============================================================

"use client";

import { useCallback }         from "react";
import { useUILanguage }       from "@/context/locale-context";
import { translate, LANGUAGE_MAP } from "@/lib/i18n";
import type { UILanguage, LanguageMeta, TranslationPath } from "@/lib/i18n";

export interface UseTranslationReturn {
  /** Translate a dot-path key with optional variable interpolation. */
  t:    (path: TranslationPath, vars?: Record<string, string | number>) => string;
  lang: UILanguage;
  dir:  "ltr" | "rtl";
  meta: LanguageMeta;
}

/**
 * Primary hook for translating UI strings in React components.
 *
 * @example
 *   const { t, dir } = useTranslation();
 *   <div dir={dir}>{t("nav.dashboard")}</div>
 *   <p>{t("roster.confirmRemove", { name: artist.name })}</p>
 */
export function useTranslation(): UseTranslationReturn {
  const lang = useUILanguage();
  const meta = LANGUAGE_MAP[lang];

  const t = useCallback(
    (path: TranslationPath, vars?: Record<string, string | number>) =>
      translate(lang, path, vars),
    [lang],
  );

  return { t, lang, dir: meta.dir, meta };
}
