/**
 * lib/agreements/index.ts — Country Agreement Loader
 *
 * Provides lazy, per-country loading of the 14 artist management agreement
 * templates so the agreement page only loads the selected country's data
 * (~400 lines) rather than all 14 countries (~5,800 lines) at once.
 *
 * Usage (in a page or component):
 *
 *   import { loadAgreement, AGREEMENT_COUNTRIES } from "@/lib/agreements";
 *
 *   // Static country list (for the picker UI — no agreement content loaded)
 *   const options = AGREEMENT_COUNTRIES.map(c => ({ value: c.key, label: c.meta.country }));
 *
 *   // Load one country's full agreement on demand
 *   const agreement = await loadAgreement("nigeria");
 *   agreement.clauses    // Clause[]
 *   agreement.schedule   // ScheduleItem[]
 *   agreement.meta       // { country, currency, flag, … }
 *
 * ── Re-exports for any code that still does direct imports ───────────────────
 * The individual files re-export all their named exports unchanged.
 * Legacy direct imports (e.g. `import { NIGERIA_CLAUSES } from "@/lib/agreements/nigeria-agreement"`)
 * continue to work — no consumer changes needed.
 */

export type { Clause, SubClause, ScheduleItem } from "./nigeria-agreement";

// ── Country key type ──────────────────────────────────────────────────────────

export type AgreementCountryKey =
  | "nigeria"
  | "kenya"
  | "ghana"
  | "tanzania"
  | "uganda"
  | "zimbabwe"
  | "ethiopia"
  | "egypt"
  | "morocco"
  | "algeria"
  | "cote-divoire"
  | "cameroon"
  | "angola"
  | "senegal";

// ── Lightweight country list (no content — safe to import everywhere) ─────────

export interface AgreementCountryMeta {
  key:            AgreementCountryKey;
  country:        string;
  flag:           string;
  currency:       string;
  currencySymbol: string;
  governingLaw:   string;
}

export const AGREEMENT_COUNTRIES: AgreementCountryMeta[] = [
  { key: "nigeria",     country: "Nigeria",          flag: "🇳🇬", currency: "NGN", currencySymbol: "₦",  governingLaw: "the Federal Republic of Nigeria" },
  { key: "kenya",       country: "Kenya",            flag: "🇰🇪", currency: "KES", currencySymbol: "KSh",governingLaw: "the Republic of Kenya" },
  { key: "ghana",       country: "Ghana",            flag: "🇬🇭", currency: "GHS", currencySymbol: "₵",  governingLaw: "the Republic of Ghana" },
  { key: "tanzania",    country: "Tanzania",         flag: "🇹🇿", currency: "TZS", currencySymbol: "TSh",governingLaw: "the United Republic of Tanzania" },
  { key: "uganda",      country: "Uganda",           flag: "🇺🇬", currency: "UGX", currencySymbol: "USh",governingLaw: "the Republic of Uganda" },
  { key: "zimbabwe",    country: "Zimbabwe",         flag: "🇿🇼", currency: "USD", currencySymbol: "$",  governingLaw: "the Republic of Zimbabwe" },
  { key: "ethiopia",    country: "Ethiopia",         flag: "🇪🇹", currency: "ETB", currencySymbol: "Br", governingLaw: "the Federal Democratic Republic of Ethiopia" },
  { key: "egypt",       country: "Egypt",            flag: "🇪🇬", currency: "EGP", currencySymbol: "£",  governingLaw: "the Arab Republic of Egypt" },
  { key: "morocco",     country: "Morocco",          flag: "🇲🇦", currency: "MAD", currencySymbol: "د.م.",governingLaw: "the Kingdom of Morocco" },
  { key: "algeria",     country: "Algeria",          flag: "🇩🇿", currency: "DZD", currencySymbol: "دج", governingLaw: "the People's Democratic Republic of Algeria" },
  { key: "cote-divoire",country: "Côte d'Ivoire",   flag: "🇨🇮", currency: "XOF", currencySymbol: "CFA",governingLaw: "the Republic of Côte d'Ivoire" },
  { key: "cameroon",    country: "Cameroon",         flag: "🇨🇲", currency: "XAF", currencySymbol: "CFA",governingLaw: "the Republic of Cameroon" },
  { key: "angola",      country: "Angola",           flag: "🇦🇴", currency: "AOA", currencySymbol: "Kz", governingLaw: "the Republic of Angola" },
  { key: "senegal",     country: "Senegal",          flag: "🇸🇳", currency: "XOF", currencySymbol: "CFA",governingLaw: "the Republic of Senegal" },
];

// ── Lazy loader ───────────────────────────────────────────────────────────────
// Uses dynamic import so Next.js code-splits each country file into its own
// chunk (~10-15 kB each). The agreement page loads only the selected country.

export interface AgreementData {
  meta:     AgreementCountryMeta;
  clauses:  import("./nigeria-agreement").Clause[];
  schedule: import("./nigeria-agreement").ScheduleItem[];
}

export async function loadAgreement(key: AgreementCountryKey): Promise<AgreementData> {
  const meta = AGREEMENT_COUNTRIES.find(c => c.key === key);
  if (!meta) throw new Error(`Unknown agreement country key: "${key}"`);

  switch (key) {
    case "nigeria": {
      const m = await import("./nigeria-agreement");
      return { meta, clauses: m.NIGERIA_CLAUSES, schedule: m.NIGERIA_SCHEDULE };
    }
    case "kenya": {
      const m = await import("./kenya-agreement");
      return { meta, clauses: m.KENYA_CLAUSES, schedule: m.KENYA_SCHEDULE };
    }
    case "ghana": {
      const m = await import("./ghana-agreement");
      return { meta, clauses: m.GHANA_CLAUSES, schedule: m.GHANA_SCHEDULE };
    }
    case "tanzania": {
      const m = await import("./tanzania-agreement");
      return { meta, clauses: m.TANZANIA_CLAUSES, schedule: m.TANZANIA_SCHEDULE };
    }
    case "uganda": {
      const m = await import("./uganda-agreement");
      return { meta, clauses: m.UGANDA_CLAUSES, schedule: m.UGANDA_SCHEDULE };
    }
    case "zimbabwe": {
      const m = await import("./zimbabwe-agreement");
      return { meta, clauses: m.ZIMBABWE_CLAUSES, schedule: m.ZIMBABWE_SCHEDULE };
    }
    case "ethiopia": {
      const m = await import("./ethiopia-agreement");
      return { meta, clauses: m.ETHIOPIA_CLAUSES, schedule: m.ETHIOPIA_SCHEDULE };
    }
    case "egypt": {
      const m = await import("./egypt-agreement");
      return { meta, clauses: m.EGYPT_CLAUSES, schedule: m.EGYPT_SCHEDULE };
    }
    case "morocco": {
      const m = await import("./morocco-agreement");
      return { meta, clauses: m.MOROCCO_CLAUSES, schedule: m.MOROCCO_SCHEDULE };
    }
    case "algeria": {
      const m = await import("./algeria-agreement");
      return { meta, clauses: m.ALGERIA_CLAUSES, schedule: m.ALGERIA_SCHEDULE };
    }
    case "cote-divoire": {
      const m = await import("./cote-divoire-agreement");
      return { meta, clauses: m.COTE_DIVOIRE_CLAUSES, schedule: m.COTE_DIVOIRE_SCHEDULE };
    }
    case "cameroon": {
      const m = await import("./cameroon-agreement");
      return { meta, clauses: m.CAMEROON_CLAUSES, schedule: m.CAMEROON_SCHEDULE };
    }
    case "angola": {
      const m = await import("./angola-agreement");
      return { meta, clauses: m.ANGOLA_CLAUSES, schedule: m.ANGOLA_SCHEDULE };
    }
    case "senegal": {
      const m = await import("./senegal-agreement");
      return { meta, clauses: m.SENEGAL_CLAUSES, schedule: m.SENEGAL_SCHEDULE };
    }
  }
}
