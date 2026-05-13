"use client";
import { useState, useMemo, useEffect } from "react";
import {
  Search, X, Mail, Phone, Globe,
  Camera, AtSign, Users, MapPin, User,
} from "lucide-react";
import { DIRECTORY } from "@/lib/directory-data";
import { DraftWithAI } from "@/components/ui/draft-with-ai";
import { loadFullContext, type ArtistContext } from "@/lib/artist-context";
import { useTranslation } from "@/lib/i18n/hooks";

const COLOR = "#C9A84C";

// ── Social URL helpers ────────────────────────────────────────
function igUrl(h: string) {
  const clean = h.replace(/^@/, "");
  return clean ? `https://instagram.com/${clean}` : "";
}
function twUrl(h: string) {
  const clean = h.replace(/^@/, "");
  return clean ? `https://x.com/${clean}` : "";
}
function fbUrl(h: string) {
  if (!h) return "";
  if (h.startsWith("http")) return h;
  const clean = h.replace(/^@/, "");
  return `https://facebook.com/${clean}`;
}
function siteUrl(w: string) {
  if (!w) return "";
  if (w.startsWith("http")) return w;
  return `https://${w}`;
}

// ── Entry card ────────────────────────────────────────────────
function EntryCard({
  entry,
  color,
  artistContext,
}: {
  entry: typeof DIRECTORY[0]["entries"][0];
  color: string;
  artistContext: ArtistContext | null;
}) {
  const { t } = useTranslation();
  const ig = igUrl(entry.instagram);
  const tw = twUrl(entry.twitter);
  const fb = fbUrl(entry.facebook);
  const site = siteUrl(entry.website);

  return (
    <div className="glass-card rounded-xl p-5 flex flex-col gap-3 hover:border-brand/20 transition-all">
      {/* Name + badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-bold text-sm text-text-primary leading-snug">{entry.name}</h3>
            {entry.category && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded flex-shrink-0"
                style={{ color, backgroundColor: `${color}15` }}>
                {entry.category}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <MapPin size={10} className="flex-shrink-0" />
            <span>{[entry.city, entry.country].filter(Boolean).join(", ")}</span>
          </div>
        </div>
      </div>

      {/* Contact person */}
      {entry.contact && (
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <User size={11} className="flex-shrink-0" style={{ color }} />
          <span>{entry.contact}</span>
        </div>
      )}

      {/* Notes */}
      {entry.notes && (
        <p className="text-xs text-text-muted leading-relaxed border-l-2 pl-3 italic"
          style={{ borderColor: `${color}40` }}>
          {entry.notes}
        </p>
      )}

      {/* Clickable contact links */}
      <div className="flex flex-wrap gap-2 pt-0.5">
        {entry.email && (
          <a href={`mailto:${entry.email}`}
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all hover:opacity-80"
            style={{ backgroundColor: `${color}12`, color }}>
            <Mail size={11} />
            {entry.email}
          </a>
        )}
        {entry.email && artistContext && (
          <DraftWithAI
            tool="outreach-email"
            label={t("contacts.draftOutreach")}
            modalSubtitle={`Cold-intro email to ${entry.contact || entry.name}, ready to copy into your inbox.`}
            artistContext={artistContext}
            params={{
              contactName: entry.contact || entry.name,
              contactRole: entry.category || "",
              contactOrg: entry.name,
              contactCountry: entry.country,
              contactFocus: entry.notes || "",
              intent: "intro",
            }}
            contextSources={[
              `your artist (${artistContext.artistName})`,
              `recipient (${entry.name})`,
            ]}
          />
        )}
        {entry.phone && (
          <a href={`tel:${entry.phone.replace(/\s/g, "")}`}
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all hover:opacity-80"
            style={{ backgroundColor: "rgba(16,185,129,0.10)", color: "#10B981" }}>
            <Phone size={11} />
            {entry.phone}
          </a>
        )}
        {site && (
          <a href={site} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all hover:opacity-80"
            style={{ backgroundColor: "rgba(99,102,241,0.10)", color: "#6366F1" }}>
            <Globe size={11} />
            {entry.website.replace(/^https?:\/\//, "")}
          </a>
        )}
      </div>

      {/* Social handles */}
      {(ig || tw || fb) && (
        <div className="flex items-center gap-3 flex-wrap">
          {ig && (
            <a href={ig} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] font-semibold text-text-muted hover:text-[#E1306C] transition-colors">
              <Camera size={12} />
              {entry.instagram}
            </a>
          )}
          {tw && (
            <a href={tw} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] font-semibold text-text-muted hover:text-[#1DA1F2] transition-colors">
              <AtSign size={12} />
              {entry.twitter}
            </a>
          )}
          {fb && (
            <a href={fb} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] font-semibold text-text-muted hover:text-[#1877F2] transition-colors">
              <Users size={12} />
              {entry.facebook}
            </a>
          )}
        </div>
      )}

      {/* Address */}
      {entry.address && (
        <p className="text-[11px] text-text-muted/70 leading-snug">{entry.address}</p>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function IndustryDirectoryPage() {
  const { t } = useTranslation();
  const [activeSheet, setActiveSheet] = useState(0);
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [catFilter, setCatFilter] = useState("");
  // Brand Book / artist context — loaded from localStorage. Drives the
  // "Draft outreach" AI button on each contact card. If the user hasn't
  // set up their brand book yet, the button stays hidden.
  const [artistContext, setArtistContext] = useState<ArtistContext | null>(
    null
  );

  useEffect(() => {
    setArtistContext(loadFullContext());
  }, []);

  const sheet = DIRECTORY[activeSheet];

  const countries = useMemo(() =>
    Array.from(new Set(sheet.entries.map(e => e.country).filter(Boolean))).sort(),
    [sheet]
  );
  const categories = useMemo(() =>
    Array.from(new Set(sheet.entries.map(e => e.category).filter(Boolean))).sort(),
    [sheet]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return sheet.entries.filter(e => {
      if (countryFilter && e.country !== countryFilter) return false;
      if (catFilter && e.category !== catFilter) return false;
      if (!q) return true;
      return (
        e.name.toLowerCase().includes(q) ||
        e.country.toLowerCase().includes(q) ||
        e.city.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        e.notes.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.website.toLowerCase().includes(q)
      );
    });
  }, [sheet, search, countryFilter, catFilter]);

  const grouped = useMemo(() => {
    const map: Record<string, typeof filtered> = {};
    for (const e of filtered) {
      const key = e.country || "Other";
      if (!map[key]) map[key] = [];
      map[key].push(e);
    }
    return map;
  }, [filtered]);

  const handleTabChange = (i: number) => {
    setActiveSheet(i);
    setSearch("");
    setCountryFilter("");
    setCatFilter("");
  };

  const clearFilters = () => {
    setSearch("");
    setCountryFilter("");
    setCatFilter("");
  };
  const hasFilters = !!(search || countryFilter || catFilter);
  const totalContacts = DIRECTORY.reduce((s, d) => s + d.entries.length, 0);

  return (
    <div className="animate-fade-in max-w-5xl">

      {/* ── Header ── */}
      <div className="glass-card rounded-2xl p-7 mb-6" style={{ borderColor: `${COLOR}25` }}>
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl flex-shrink-0"
            style={{ backgroundColor: `${COLOR}15` }}>
            🌍
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: COLOR }}>
              Live Tool · Pan-African Edition · 2026
            </p>
            <h1 className="text-2xl font-black text-text-primary mb-1">
              African Music Industry Directory
            </h1>
            <p className="text-sm font-semibold mb-2" style={{ color: COLOR }}>
              South Africa · Nigeria · Kenya · Ghana · Côte d&apos;Ivoire · Tanzania · Cameroon · Senegal · Uganda
            </p>
            <p className="text-sm text-text-muted leading-relaxed">
              {totalContacts}+ verified contacts across record labels, distributors, PROs, radio,
              TV, press, creative services and industry professionals. Click any email to open your
              mail app — you&apos;ll return here automatically. Tap any social handle to visit their page.
            </p>
            <div className="flex items-center gap-4 mt-3 text-xs flex-wrap">
              <span className="font-bold" style={{ color: COLOR }}>{DIRECTORY.length} categories</span>
              <span className="text-text-muted">·</span>
              <span className="font-bold" style={{ color: COLOR }}>{totalContacts} contacts</span>
              <span className="text-text-muted">·</span>
              <span className="font-bold" style={{ color: COLOR }}>9 countries</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Category tabs ── */}
      <div className="flex gap-0 mb-5 border-b border-border overflow-x-auto">
        {DIRECTORY.map((d, i) => (
          <button
            key={d.id}
            onClick={() => handleTabChange(i)}
            className={`px-4 py-3 text-xs font-bold transition-all border-b-2 -mb-px whitespace-nowrap flex items-center gap-1.5 ${
              activeSheet === i
                ? "border-brand text-brand"
                : "border-transparent text-text-muted hover:text-text-primary"
            }`}
          >
            <span>{d.icon}</span>
            {d.label}
            <span
              className="text-[10px] px-1.5 py-0.5 rounded font-black"
              style={activeSheet === i
                ? { color: d.color, backgroundColor: `${d.color}15` }
                : { color: "#6B7280", backgroundColor: "rgba(255,255,255,0.06)" }
              }
            >
              {d.entries.length}
            </span>
          </button>
        ))}
      </div>

      {/* ── Active category label ── */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-1 h-8 rounded-full" style={{ backgroundColor: sheet.color }} />
        <div>
          <p className="text-xs font-black uppercase tracking-widest" style={{ color: sheet.color }}>
            {sheet.icon} {sheet.label}
          </p>
          <p className="text-xs text-text-muted">{sheet.entries.length} organisations</p>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          <input
            className="w-full bg-surface-2 border border-border rounded-lg pl-9 pr-9 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand transition-colors"
            placeholder={`Search ${sheet.label.toLowerCase()}…`}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors">
              <X size={13} />
            </button>
          )}
        </div>

        <select
          className="bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand transition-colors min-w-[140px]"
          value={countryFilter}
          onChange={e => setCountryFilter(e.target.value)}
        >
          <option value="">{t("contacts.allCountries")}</option>
          {countries.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select
          className="bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand transition-colors min-w-[130px]"
          value={catFilter}
          onChange={e => setCatFilter(e.target.value)}
        >
          <option value="">{t("contacts.allTypes")}</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-bold text-text-muted hover:text-red-400 transition-colors border border-border hover:border-red-400/30"
          >
            <X size={12} />
            Clear
          </button>
        )}
      </div>

      {/* ── Results count ── */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-text-muted">
          {hasFilters ? (
            <>
              <span className="font-bold text-text-primary">{filtered.length}</span>
              {" "}result{filtered.length !== 1 ? "s" : ""}
              {countryFilter ? ` · ${countryFilter}` : ""}
              {catFilter ? ` · ${catFilter}` : ""}
            </>
          ) : (
            <>
              Showing all <span className="font-bold text-text-primary">{filtered.length}</span> {sheet.label.toLowerCase()}
            </>
          )}
        </p>
        {hasFilters && (
          <button onClick={clearFilters} className="text-xs text-text-muted hover:text-red-400 transition-colors">
            Clear filters
          </button>
        )}
      </div>

      {/* ── No results ── */}
      {filtered.length === 0 && (
        <div className="glass-card rounded-xl p-12 text-center">
          <p className="text-3xl mb-3">🔍</p>
          <p className="text-sm font-bold text-text-primary mb-1">{t("contacts.noResults")}</p>
          <p className="text-xs text-text-muted">{t("contacts.noResultsDesc")}</p>
          <button onClick={clearFilters}
            className="mt-4 text-xs font-bold px-4 py-2 rounded-lg transition-all hover:opacity-80"
            style={{ backgroundColor: `${COLOR}15`, color: COLOR }}>
            Clear all filters
          </button>
        </div>
      )}

      {/* ── Grouped entries ── */}
      {filtered.length > 0 && (
        <div className="space-y-8 mb-8">
          {Object.entries(grouped).map(([country, entries]) => (
            <div key={country}>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1" style={{ backgroundColor: `${sheet.color}30` }} />
                <span className="text-xs font-black uppercase tracking-widest"
                  style={{ color: sheet.color }}>
                  {country}
                </span>
                <span className="text-xs text-text-muted font-semibold">
                  {entries.length}
                </span>
                <div className="h-px flex-1" style={{ backgroundColor: `${sheet.color}30` }} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {entries.map((entry, i) => (
                  <EntryCard
                    key={`${entry.name}-${i}`}
                    entry={entry}
                    color={sheet.color}
                    artistContext={artistContext}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Footer ── */}
      <div className="glass-card rounded-xl p-4 mb-6 flex items-start gap-3"
        style={{ borderColor: `${COLOR}20`, backgroundColor: `${COLOR}06` }}>
        <span className="text-base flex-shrink-0">📋</span>
        <p className="text-xs text-text-muted leading-relaxed">
          <span className="font-semibold" style={{ color: COLOR }}>
            African Music Industry Directory 2026.
          </span>{" "}
          Compiled for artists, managers, labels, and music industry professionals across Africa.
          Contacts are verified at time of publication — always confirm details before outreach.
          Click any email to compose directly from your device; you&apos;ll return to this page after sending.
        </p>
      </div>
    </div>
  );
}
