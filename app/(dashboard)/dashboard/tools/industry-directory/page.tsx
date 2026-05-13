"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronLeft, Search, X, Mail, Phone, Globe,
  Camera, AtSign, Users, MapPin, User, ExternalLink,
} from "lucide-react";
import { DIRECTORY } from "@/lib/directory-data";

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
function EntryCard({ entry, color }: { entry: typeof DIRECTORY[0]["entries"][0]; color: string }) {
  const ig = igUrl(entry.instagram);
  const tw = twUrl(entry.twitter);
  const fb = fbUrl(entry.facebook);
  const site = siteUrl(entry.website);

  return (
    <div className="glass-card rounded-xl p-5 flex flex-col gap-3 hover:border-brand/20 transition-all">
      {/* Header */}
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

      {/* Contact links */}
      <div className="flex flex-wrap gap-2 pt-1">
        {entry.email && (
          <a href={`mailto:${entry.email}`}
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all hover:opacity-80"
            style={{ backgroundColor: `${color}12`, color }}>
            <Mail size={11} />
            {entry.email}
          </a>
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
        <div className="flex items-center gap-2 flex-wrap">
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
  const [activeSheet, setActiveSheet] = useState(0);
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [catFilter, setCatFilter] = useState("");

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

  // Group by country
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
  const hasFilters = search || countryFilter || catFilter;

  return (
    <div className="animate-fade-in max-w-5xl">
      <Link href="/dashboard/contacts"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary mb-6 transition-colors">
        <ChevronLeft size={15} />Back to Industry Directory
      </Link>

      {/* Header */}
      <div className="glass-card rounded-2xl p-7 mb-6" style={{ borderColor: `${COLOR}25` }}>
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl flex-shrink-0"
            style={{ backgroundColor: `${COLOR}15` }}>
            🌍
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: COLOR }}>
              Live Tool · 2026 Edition
            </p>
            <h1 className="text-2xl font-black text-text-primary mb-1">Music Industry Directory</h1>
            <p className="text-sm font-semibold mb-2" style={{ color: COLOR }}>
              South Africa · Nigeria · Kenya · Ghana · Côte d&apos;Ivoire · Tanzania · Cameroon · Senegal · Uganda
            </p>
            <p className="text-sm text-text-muted leading-relaxed">
              360+ verified contacts across record labels, distributors, PROs, radio stations, TV channels,
              press, creative services, and industry professionals. Click any email to open your mail app,
              or tap a social handle to visit their page directly.
            </p>
            <div className="flex items-center gap-4 mt-3 text-xs text-text-muted flex-wrap">
              <span style={{ color: COLOR }} className="font-semibold">{DIRECTORY.length} categories</span>
              <span>·</span>
              <span style={{ color: COLOR }} className="font-semibold">
                {DIRECTORY.reduce((s, d) => s + d.entries.length, 0)} contacts
              </span>
              <span>·</span>
              <span style={{ color: COLOR }} className="font-semibold">9 countries</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sheet tabs, scrollable */}
      <div className="flex gap-0 mb-5 border-b border-border overflow-x-auto">
        {DIRECTORY.map((d, i) => (
          <button key={d.id} onClick={() => handleTabChange(i)}
            className={`px-4 py-3 text-xs font-bold transition-all border-b-2 -mb-px whitespace-nowrap flex items-center gap-1.5 ${
              activeSheet === i
                ? "border-brand text-brand"
                : "border-transparent text-text-muted hover:text-text-primary"
            }`}>
            <span>{d.icon}</span>
            {d.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-black ${
              activeSheet === i ? "" : "text-text-muted"
            }`}
              style={activeSheet === i ? { color: d.color, backgroundColor: `${d.color}15` } : {}}>
              {d.entries.length}
            </span>
          </button>
        ))}
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          <input
            className="w-full bg-surface-2 border border-border rounded-lg pl-9 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand transition-colors"
            placeholder={`Search ${sheet.label.toLowerCase()}…`}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
              <X size={13} />
            </button>
          )}
        </div>

        <select
          className="bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand transition-colors"
          value={countryFilter}
          onChange={e => setCountryFilter(e.target.value)}>
          <option value="">All countries</option>
          {countries.map(c => <option key={c}>{c}</option>)}
        </select>

        <select
          className="bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand transition-colors"
          value={catFilter}
          onChange={e => setCatFilter(e.target.value)}>
          <option value="">All types</option>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>

        {hasFilters && (
          <button onClick={clearFilters}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-bold text-text-muted hover:text-red-400 transition-colors border border-border hover:border-red-400/30">
            <X size={12} />Clear
          </button>
        )}
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-text-muted">
          {hasFilters
            ? <><span className="font-bold text-text-primary">{filtered.length}</span> results{countryFilter ? ` in ${countryFilter}` : ""}</>
            : <><span className="font-bold text-text-primary">{filtered.length}</span> {sheet.label.toLowerCase()}</>
          }
        </p>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: sheet.color }} />
          <p className="text-xs font-semibold" style={{ color: sheet.color }}>{sheet.label}</p>
        </div>
      </div>

      {/* Grouped entries */}
      {filtered.length === 0 ? (
        <div className="glass-card rounded-xl p-10 text-center">
          <p className="text-2xl mb-2">🔍</p>
          <p className="text-sm font-semibold text-text-primary mb-1">No results</p>
          <p className="text-xs text-text-muted">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([country, entries]) => (
            <div key={country}>
              {/* Country divider */}
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-black uppercase tracking-widest px-3"
                  style={{ color: sheet.color }}>
                  {country}
                </span>
                <span className="text-xs text-text-muted">({entries.length})</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {entries.map((entry, i) => (
                  <EntryCard key={`${entry.name}-${i}`} entry={entry} color={sheet.color} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer note */}
      <div className="glass-card rounded-xl p-4 mt-8 mb-6 flex items-start gap-3"
        style={{ borderColor: `${COLOR}20`, backgroundColor: `${COLOR}06` }}>
        <span className="text-base flex-shrink-0">💾</span>
        <p className="text-xs text-text-muted leading-relaxed">
          <span className="font-semibold text-brand">Music Industry Directory 2026.</span>{" "}
          Click any email address to open your mail client directly, after sending, your device will return you here.
          Social handles link directly to the artist or organisation&apos;s page.
          Contacts verified at time of publication, always confirm details before outreach.
        </p>
      </div>
    </div>
  );
}
