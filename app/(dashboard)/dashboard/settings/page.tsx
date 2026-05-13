"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Phone, Globe, Save, AlertCircle, DollarSign, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveDevLocale, useLocale } from "@/context/locale-context";
import { GROUPED_COUNTRIES, ALL_CURRENCIES, getLocale } from "@/lib/locale";
import { LANGUAGES } from "@/lib/i18n";
import { useTranslation } from "@/lib/i18n/hooks";
import { DataPrivacySection } from "@/components/settings/data-privacy-section";
import { TeamSection } from "@/components/settings/team-section";
import { SpotifyConnectCard } from "@/components/settings/spotify-connect-card";

const SUPABASE_CONFIGURED =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== "your_supabase_project_url" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith("http");

export default function SettingsPage() {
  const router                                  = useRouter();
  const { t }                                   = useTranslation();
  const { uiLanguage, setUILanguage }           = useLocale();
  const [fullName, setFullName]                 = useState("");
  const [phone, setPhone]                       = useState("");
  const [country, setCountry]                   = useState("South Africa");
  const [currencyOverride, setCurrencyOverride] = useState("");
  const [email, setEmail]                       = useState("");
  const [loading, setLoading]                   = useState(false);
  const [saved, setSaved]                       = useState(false);
  const [error, setError]                       = useState("");

  // The default currency for the selected country
  const defaultCurrency = getLocale(country).currency;

  // When country changes, reset override if it matches the new default
  useEffect(() => {
    if (currencyOverride === defaultCurrency) setCurrencyOverride("");
  }, [country, defaultCurrency, currencyOverride]);

  useEffect(() => {
    if (!SUPABASE_CONFIGURED) {
      const savedCountry  = localStorage.getItem("roster_dev_country");
      const savedCurrency = localStorage.getItem("roster_dev_currency");
      if (savedCountry)  setCountry(savedCountry === "Ivory Coast" ? "Côte d'Ivoire" : savedCountry);
      if (savedCurrency) setCurrencyOverride(savedCurrency);
      return;
    }

    const load = async () => {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        const user = session.user;
        setEmail(user.email ?? "");

        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, phone, country, currency_override")
          .eq("id", user.id)
          .single();

        if (profile) {
          setFullName(profile.full_name || "");
          setPhone(profile.phone || "");
          setCountry((profile.country === "Ivory Coast" ? "Côte d'Ivoire" : profile.country) || "South Africa");
          setCurrencyOverride(profile.currency_override || "");
        }
      } catch (err) {
        console.error("Settings load error:", err);
      }
    };

    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!SUPABASE_CONFIGURED) {
      saveDevLocale(country, currencyOverride || undefined);
      // Notify locale context with country data so it updates immediately
      window.dispatchEvent(new CustomEvent("roster:locale-updated", {
        detail: { country, currencyOverride: currencyOverride || null },
      }));
      // Refresh server components so any server-rendered prices/locales update too
      router.refresh();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      return;
    }

    setLoading(true);
    setError("");
    setSaved(false);

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        setError(t("auth.sessionExpired"));
        return;
      }

      const { error: upsertError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            full_name: fullName,
            phone,
            country,
            currency_override: currencyOverride || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );

      if (upsertError) {
        setError(upsertError.message);
      } else {
        // Always mirror to localStorage so the locale context fallback is fresh.
        localStorage.setItem("roster_dev_country", country);
        if (currencyOverride) {
          localStorage.setItem("roster_dev_currency", currencyOverride);
        } else {
          localStorage.removeItem("roster_dev_currency");
        }
        // Dispatch with country data so locale context updates immediately
        // without needing a round-trip back to Supabase.
        window.dispatchEvent(new CustomEvent("roster:locale-updated", {
          detail: { country, currencyOverride: currencyOverride || null },
        }));
        // Refresh server components so any server-rendered prices/locales update too
        router.refresh();
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error.generic"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-xl">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-text-primary">{t("settings.title")}</h1>
        <p className="text-text-muted mt-2">{t("settings.subtitle")}</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* ── Profile ── */}
        <div className="glass-card rounded-2xl p-7">
          <h2 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-6">
            {t("settings.profile")}
          </h2>
          <div className="space-y-5">

            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                <User size={11} className="inline mr-1.5" />{t("settings.fullName")}
              </label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder={t("settings.namePlaceholder")}
                className="w-full bg-surface-2 border border-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-muted transition-all outline-none focus:border-brand"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                <Mail size={11} className="inline mr-1.5" />{t("settings.email")}
              </label>
              <div className="w-full bg-surface-2 border border-border rounded-lg px-4 py-3 text-sm text-text-muted">
                {email || <span className="opacity-40 italic"> - </span>}
              </div>
              <p className="text-xs text-text-muted mt-1.5">
                {t("settings.emailNote")}{" "}
                <a href="mailto:support@rosterapp.ai" className="text-brand underline">support@rosterapp.ai</a>{" "}
                {t("settings.contactSupport")}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                <Phone size={11} className="inline mr-1.5" />{t("settings.phone")}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+27 xx xxx xxxx"
                className="w-full bg-surface-2 border border-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-muted transition-all outline-none focus:border-brand"
              />
            </div>

            {/* Country — grouped select, Africa first */}
            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                <Globe size={11} className="inline mr-1.5" />{t("settings.country")}
              </label>
              <select
                value={country}
                onChange={e => setCountry(e.target.value)}
                className="w-full bg-surface-2 border border-border rounded-lg px-4 py-3 text-sm text-text-primary transition-all outline-none focus:border-brand"
              >
                {GROUPED_COUNTRIES.map(group => (
                  <optgroup key={group.label} label={group.label}>
                    {group.countries.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Language — explicit user override, independent of country */}
            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                <Languages size={11} className="inline mr-1.5" />{t("settings.language")}
              </label>
              <select
                value={uiLanguage}
                onChange={async e => {
                  setUILanguage(e.target.value as import("@/lib/i18n").UILanguage);
                  await new Promise(r => setTimeout(r, 600));
                  router.refresh();
                }}
                className="w-full bg-surface-2 border border-border rounded-lg px-4 py-3 text-sm text-text-primary transition-all outline-none focus:border-brand"
              >
                {LANGUAGES.map(({ code, flag, name, nameEn }) => (
                  <option key={code} value={code}>
                    {flag}  {name}{name !== nameEn ? `  —  ${nameEn}` : ""}
                  </option>
                ))}
              </select>
              <p className="text-xs text-text-muted mt-1.5">
                Takes effect immediately across the whole platform.
              </p>
            </div>

            {/* Currency — defaults to country currency, can be overridden */}
            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                <DollarSign size={11} className="inline mr-1.5" />{t("settings.preferredCurrency")}
              </label>
              <select
                value={currencyOverride || defaultCurrency}
                onChange={e => {
                  const val = e.target.value;
                  setCurrencyOverride(val === defaultCurrency ? "" : val);
                }}
                className="w-full bg-surface-2 border border-border rounded-lg px-4 py-3 text-sm text-text-primary transition-all outline-none focus:border-brand"
              >
                {ALL_CURRENCIES.map(({ code, sym, name }) => (
                  <option key={code} value={code}>
                    {code} · {sym} · {name}{code === defaultCurrency ? ` (${t("status.active").toLowerCase()})` : ""}
                  </option>
                ))}
              </select>
              <p className="text-xs text-text-muted mt-1.5">
                {t("settings.currencyNote")}
              </p>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-error/10 border border-error/20 rounded-lg px-4 py-3 text-sm text-error mt-5">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {saved && (
            <div className="flex items-center gap-2 bg-success/10 border border-success/20 rounded-lg px-4 py-3 text-sm text-success mt-5">
              <Save size={14} />
              {t("settings.profileSaved")}
            </div>
          )}

          <Button type="submit" loading={loading} size="lg" className="w-full mt-6">
            <Save size={15} className="mr-2" />
            {t("settings.saveChanges")}
          </Button>
        </div>

        {/* ── Subscription ── */}
        <div className="glass-card rounded-2xl p-7">
          <h2 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-4">
            {t("settings.subscription")}
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-text-primary">{t("settings.activeMember")}</p>
              <p className="text-xs text-text-muted mt-0.5">{t("settings.fullAccess")}</p>
            </div>
            <span className="text-xs font-bold text-success bg-success/10 border border-success/20 rounded-full px-3 py-1">
              {t("status.active")}
            </span>
          </div>
          <p className="text-xs text-text-muted mt-4">
            {t("settings.contactSupport")}{" "}
            <a href="mailto:support@rosterapp.ai" className="text-brand underline">support@rosterapp.ai</a>
          </p>
        </div>

      </form>

      {/* ── Integrations ── */}
      <SpotifyConnectCard />

      {/* ── Team ── */}
      <TeamSection />

      {/* ── Data & Privacy (POPIA / GDPR) ── */}
      <DataPrivacySection userEmail={email} />
    </div>
  );
}
