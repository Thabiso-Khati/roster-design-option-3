// ============================================================
// ROSTER — i18n engine  (pure, no React)
// ------------------------------------------------------------
// Lightweight translation system. No external dependencies.
//
// Usage (in React components):
//   import { useTranslation } from "@/lib/i18n/hooks";
//   const { t, lang } = useTranslation();
//   t("nav.dashboard")           // → "Dashboard"
//   t("roster.confirmRemove", { name: "Rema" }) // → "Are you sure…"
//
// Usage (outside React — server components, API routes, tests):
//   import { translate } from "@/lib/i18n";
//   translate("fr", "nav.dashboard") // → "Tableau de bord"
//
// Supported languages:
//   en  — English     (default)
//   fr  — Français    (Francophone Africa)
//   sw  — Kiswahili   (East Africa)
//   pt  — Português   (Lusophone Africa)
//   ar  — العربية     (North Africa, RTL)
// ============================================================

import { en } from "./translations/en";
import { fr } from "./translations/fr";
import { sw } from "./translations/sw";
import { pt } from "./translations/pt";
import { ar } from "./translations/ar";

// ── Language metadata ────────────────────────────────────────

export type UILanguage = "en" | "fr" | "sw" | "pt" | "ar";

export interface LanguageMeta {
  code:       UILanguage;
  name:       string;   // Native name
  nameEn:     string;   // English name
  dir:        "ltr" | "rtl";
  flag:       string;   // Emoji flag
}

export const LANGUAGES: LanguageMeta[] = [
  { code: "en", name: "English",    nameEn: "English",    dir: "ltr", flag: "🌐" },
  { code: "fr", name: "Français",   nameEn: "French",     dir: "ltr", flag: "🇨🇮" },
  { code: "sw", name: "Kiswahili",  nameEn: "Swahili",    dir: "ltr", flag: "🇰🇪" },
  { code: "pt", name: "Português",  nameEn: "Portuguese", dir: "ltr", flag: "🇦🇴" },
  { code: "ar", name: "العربية",    nameEn: "Arabic",     dir: "rtl", flag: "🇪🇬" },
];

export const LANGUAGE_MAP: Record<UILanguage, LanguageMeta> =
  Object.fromEntries(LANGUAGES.map(l => [l.code, l])) as Record<UILanguage, LanguageMeta>;

// ── Translation dictionary ───────────────────────────────────

const DICTIONARIES: Record<UILanguage, typeof en> = { en, fr, sw, pt, ar };

// ── BCP-47 locale → UI language inference ───────────────────
// Derives the best UI language from the user's country locale
// (stored in locale-context). Explicit user overrides take precedence.

export function inferLanguageFromLocale(bcp47Locale: string): UILanguage {
  if (!bcp47Locale) return "en";
  const lang = bcp47Locale.split("-")[0].toLowerCase();
  switch (lang) {
    case "fr": return "fr";
    case "sw": return "sw";
    case "pt": return "pt";
    case "ar": return "ar";
    default:   return "en";
  }
}

// ── Country → language fast lookup ──────────────────────────
// Covers all African markets in ROSTER's target region.

const COUNTRY_LANGUAGE: Record<string, UILanguage> = {
  // Francophone Africa
  "Côte d'Ivoire":  "fr",
  "Cameroon":       "fr",
  "Senegal":        "fr",
  "Congo (DRC)":    "fr",
  "Mali":           "fr",
  "Burkina Faso":   "fr",
  "Niger":          "fr",
  "Guinea":         "fr",
  "Togo":           "fr",
  "Benin":          "fr",
  "Gabon":          "fr",
  "Chad":           "fr",
  "Madagascar":     "fr",
  "Rwanda":         "fr",
  "Burundi":        "fr",
  "Mauritius":      "fr",

  // Lusophone Africa
  "Angola":         "pt",
  "Mozambique":     "pt",
  "Cape Verde":     "pt",

  // East Africa (Swahili-dominant)
  "Tanzania":       "sw",
  "Kenya":          "sw",
  "Uganda":         "sw",

  // Arabic-speaking Africa + Middle East
  "Egypt":          "ar",
  "Morocco":        "ar",
  "Algeria":        "ar",
  "Tunisia":        "ar",
  "Libya":          "ar",
  "Sudan":          "ar",
  "Saudi Arabia":   "ar",
  "UAE":            "ar",
  "Jordan":         "ar",
  "Lebanon":        "ar",
  "Qatar":          "ar",
  "Kuwait":         "ar",
  "Bahrain":        "ar",
  "Oman":           "ar",
  "Iraq":           "ar",
  "Yemen":          "ar",
};

export function inferLanguageFromCountry(country: string | null | undefined): UILanguage {
  if (!country) return "en";
  return COUNTRY_LANGUAGE[country] ?? "en";
}

// ── Dot-path resolver ────────────────────────────────────────

type DotPaths<T, P extends string = ""> = T extends string
  ? P
  : {
      [K in keyof T]: K extends string
        ? P extends ""
          ? DotPaths<T[K], K>
          : DotPaths<T[K], `${P}.${K}`>
        : never;
    }[keyof T];

export type TranslationPath = DotPaths<typeof en>;

function resolvePath(obj: Record<string, unknown>, path: string): string {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (current == null || typeof current !== "object") return path;
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === "string" ? current : path;
}

// ── Variable substitution ────────────────────────────────────
// t("roster.confirmRemove", { name: "Rema" })
// → "Are you sure you want to remove Rema from your roster?"

function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    key in vars ? String(vars[key]) : `{${key}}`
  );
}

// ── Core translate function ──────────────────────────────────

export function translate(
  lang: UILanguage,
  path: string,
  vars?: Record<string, string | number>,
): string {
  const dict  = DICTIONARIES[lang] ?? en;
  const enStr = resolvePath(en as unknown as Record<string, unknown>, path);
  const str   = resolvePath(dict as unknown as Record<string, unknown>, path);

  // Fall back to English if the translation is missing or unchanged from key
  const resolved = (str === path) ? enStr : str;
  return vars ? interpolate(resolved, vars) : resolved;
}

// ── React hook lives in @/lib/i18n/hooks.ts to keep this file
// free of React imports (usable in server components and tests).
// ──────────────────────────���─────────────────────────��────────
// import { useTranslation } from "@/lib/i18n/hooks";
