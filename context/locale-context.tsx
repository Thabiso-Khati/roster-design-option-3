"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { LocaleConfig, DEFAULT_LOCALE, getLocale, getLocaleWithCurrencyOverride } from "@/lib/locale";
import type { UILanguage } from "@/lib/i18n";
import { inferLanguageFromCountry } from "@/lib/i18n";

const SUPABASE_CONFIGURED =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== "your_supabase_project_url" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith("http");

const LS_COUNTRY_KEY  = "roster_dev_country";
const LS_CURRENCY_KEY = "roster_dev_currency";
const LS_LANGUAGE_KEY = "roster_ui_language";

/** Applies language to cookie + document attributes without touching React state. */
function applyLangToDom(lang: UILanguage) {
  if (typeof document === "undefined") return;
  document.cookie = `roster_ui_language=${lang}; path=/; max-age=31536000; SameSite=Lax`;
  document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
  document.documentElement.setAttribute("lang", lang);
}

// ── Context types ────────────────────────────────────────────

interface LocaleContextValue extends LocaleConfig {
  loading:        boolean;
  fmt:            (n: number, decimals?: number) => string;
  fmtSigned:      (n: number, decimals?: number) => string;
  uiLanguage:     UILanguage;
  setUILanguage:  (lang: UILanguage) => void;
}

// ── Defaults ─────────────────────────────────────────────────

const LocaleContext = createContext<LocaleContextValue>({
  ...DEFAULT_LOCALE,
  loading: true,
  fmt: (n, d = 0) => `R ${n.toLocaleString("en-ZA", { minimumFractionDigits: d, maximumFractionDigits: d })}`,
  fmtSigned: (n, d = 0) => n === 0 ? " - " : (n < 0
    ? `–R ${Math.abs(n).toLocaleString("en-ZA", { minimumFractionDigits: d, maximumFractionDigits: d })}`
    : `R ${n.toLocaleString("en-ZA", { minimumFractionDigits: d, maximumFractionDigits: d })}`
  ),
  uiLanguage:    "en",
  setUILanguage: () => {},
});

// ── Provider ─────────────────────────────────────────────────

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<LocaleConfig>(DEFAULT_LOCALE);
  const [loading, setLoading] = useState(true);
  const [uiLanguage, setUILanguageState] = useState<UILanguage>("en");

  // ── Language setter (writes to cookie + localStorage + Supabase) ────
  const setUILanguage = useCallback((lang: UILanguage) => {
    setUILanguageState(lang);

    try { localStorage.setItem(LS_LANGUAGE_KEY, lang); } catch {}

    // Cookie + document attributes — applyLangToDom writes the cookie that
    // getServerT() reads on the very next request, eliminating the Supabase
    // fire-and-forget race condition for server-rendered strings.
    applyLangToDom(lang);

    // Persist to Supabase profile when available (fire-and-forget)
    if (SUPABASE_CONFIGURED) {
      import("@/lib/supabase/client").then(({ createClient }) => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data }) => {
          if (data.user) {
            supabase.from("profiles")
              .update({ ui_language: lang })
              .eq("id", data.user.id)
              .then(() => {/* silent */});
          }
        });
      }).catch(() => {/* silent */});
    }
  }, []);

  // ── Locale loader ──────────────────────────────────────────
  const loadLocale = useCallback(async () => {
    try {
      if (SUPABASE_CONFIGURED) {
        try {
          const { createClient } = await import("@/lib/supabase/client");
          const supabase = createClient();
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("country, currency_override, ui_language")
              .eq("id", session.user.id)
              .single();
            if (profile?.country) {
              const country = profile.country === "Ivory Coast" ? "Côte d'Ivoire" : profile.country;
              setConfig(getLocaleWithCurrencyOverride(country, profile.currency_override));
              // Priority: explicit Supabase value → localStorage (written
              // immediately by setUILanguage, beats fire-and-forget race) →
              // country inference.
              const storedLang = (() => {
                try { return localStorage.getItem(LS_LANGUAGE_KEY) as UILanguage | null; }
                catch { return null; }
              })();
              const lang: UILanguage = (profile.ui_language as UILanguage | null)
                ?? storedLang
                ?? inferLanguageFromCountry(country);
              setUILanguageState(lang);
              applyLangToDom(lang);
              return;
            }
          }
        } catch {
          // Supabase unavailable — fall through to localStorage fallback
        }
      }
      // Fallback: use localStorage (populated by Settings on save)
      const savedCountry  = localStorage.getItem(LS_COUNTRY_KEY);
      const savedCurrency = localStorage.getItem(LS_CURRENCY_KEY);
      const savedLang     = localStorage.getItem(LS_LANGUAGE_KEY) as UILanguage | null;
      const normCountry   = savedCountry === "Ivory Coast" ? "Côte d'Ivoire" : savedCountry;
      if (normCountry) setConfig(getLocaleWithCurrencyOverride(normCountry, savedCurrency));
      const lang: UILanguage = savedLang ?? inferLanguageFromCountry(normCountry);
      setUILanguageState(lang);
      applyLangToDom(lang);
    } catch {
      // silently fall back to default
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on mount
  useEffect(() => { loadLocale(); }, [loadLocale]);

  // Re-fetch when Settings saves (dispatches "roster:locale-updated")
  useEffect(() => {
    const onUpdate = (e: Event) => {
      if (e instanceof CustomEvent && e.detail?.country) {
        const country = e.detail.country as string;
        setConfig(getLocaleWithCurrencyOverride(country, e.detail.currencyOverride ?? null));
        // Only auto-update language if no explicit override is stored
        const storedLang = localStorage.getItem(LS_LANGUAGE_KEY) as UILanguage | null;
        if (!storedLang && e.detail.uiLanguage) {
          setUILanguage(e.detail.uiLanguage as UILanguage);
        } else if (!storedLang) {
          setUILanguage(inferLanguageFromCountry(country));
        }
      } else {
        loadLocale();
      }
    };
    window.addEventListener("roster:locale-updated", onUpdate);
    return () => window.removeEventListener("roster:locale-updated", onUpdate);
  }, [loadLocale, setUILanguage]);

  // Listen for country/currency changes in dev (non-Supabase) mode
  useEffect(() => {
    if (SUPABASE_CONFIGURED) return;
    const onStorage = (e: StorageEvent) => {
      if (e.key === LS_COUNTRY_KEY || e.key === LS_CURRENCY_KEY) {
        const country  = localStorage.getItem(LS_COUNTRY_KEY);
        const currency = localStorage.getItem(LS_CURRENCY_KEY);
        setConfig(getLocaleWithCurrencyOverride(country, currency));
      }
      if (e.key === LS_LANGUAGE_KEY) {
        const lang = (e.newValue as UILanguage | null) ?? "en";
        setUILanguageState(lang);
        applyLangToDom(lang);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const fmt = useCallback((n: number, decimals = 0): string => {
    if (n === 0) return " - ";
    return `${config.sym} ${n.toLocaleString(config.locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}`;
  }, [config]);

  const fmtSigned = useCallback((n: number, decimals = 0): string => {
    if (n === 0) return " - ";
    const abs = Math.abs(n).toLocaleString(config.locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    return n < 0 ? `–${config.sym} ${abs}` : `${config.sym} ${abs}`;
  }, [config]);

  return (
    <LocaleContext.Provider value={{ ...config, loading, fmt, fmtSigned, uiLanguage, setUILanguage }}>
      {children}
    </LocaleContext.Provider>
  );
}

// ── Hooks ────────────────────────────────────────────────────

export function useLocale(): LocaleContextValue {
  return useContext(LocaleContext);
}

/** Thin hook — returns only the current UI language code. */
export function useUILanguage(): UILanguage {
  return useContext(LocaleContext).uiLanguage;
}

// ── Persistence helpers ──────────────────────────────────────

/** Called by Settings page to persist country + optional currency override */
export function saveDevLocale(country: string, currencyOverride?: string) {
  localStorage.setItem(LS_COUNTRY_KEY, country);
  if (currencyOverride) {
    localStorage.setItem(LS_CURRENCY_KEY, currencyOverride);
  } else {
    localStorage.removeItem(LS_CURRENCY_KEY);
  }
  window.dispatchEvent(new StorageEvent("storage", { key: LS_COUNTRY_KEY, newValue: country }));
}

/** Called by LanguageSwitcher to explicitly set language without changing country */
export function saveDevLanguage(lang: UILanguage) {
  localStorage.setItem(LS_LANGUAGE_KEY, lang);
  window.dispatchEvent(new StorageEvent("storage", { key: LS_LANGUAGE_KEY, newValue: lang }));
}

/** @deprecated use saveDevLocale */
export function saveDevCountry(country: string) {
  saveDevLocale(country);
}
