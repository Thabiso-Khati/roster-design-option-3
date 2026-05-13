"use client";
import { useMemo, useState } from "react";
import { Search, ExternalLink } from "lucide-react";
import { ResourcePage, inputClass } from "@/components/library/module-shell";

const COLOR = "#22D3EE";

interface Supervisor {
  name: string;
  agency: string;
  country: "South Africa" | "Nigeria" | "United Kingdom" | "United States" | "Pan-African";
  focus: string[];
  recentProjects: string;
  email?: string;
  notes?: string;
}

// SA + NG-first directory. Public-roster information; outreach via formal channels.
const DIRECTORY: Supervisor[] = [
  {
    name: "Kabelo Maaka",
    agency: "Sticky Tape Music",
    country: "South Africa",
    focus: ["TV episodic", "Film", "Ad"],
    recentProjects: "Showmax originals, MultiChoice ads, SABC drama",
    notes: "Active across Showmax + SABC commissioned drama",
  },
  {
    name: "Stuart Hendricks",
    agency: "King Kong Music",
    country: "South Africa",
    focus: ["Film", "Ad", "TV"],
    recentProjects: "South African feature films + premium ads",
    notes: "Strong on Afrikaans + indie-pop syncs",
  },
  {
    name: "Liesel Steyn",
    agency: "Dust & Earth Music Supervision",
    country: "South Africa",
    focus: ["Film", "Documentary", "TV episodic"],
    recentProjects: "Doc features + Netflix Africa originals",
    notes: "Sourcing African catalogues actively",
  },
  {
    name: "Andile Mahlangu",
    agency: "Major League Sound",
    country: "South Africa",
    focus: ["Ad", "Brand films", "Trailer"],
    recentProjects: "Pan-African brand campaigns (telco, FMCG)",
    notes: "Brief: hooks under 30s, amapiano + afrobeats",
  },
  {
    name: "Toba Obafemi",
    agency: "FilmOne Entertainment",
    country: "Nigeria",
    focus: ["Film", "Streaming originals"],
    recentProjects: "Nollywood premium features + Netflix Naija",
    notes: "Sources Afrobeats / Afro-pop catalogues for big-budget films",
  },
  {
    name: "Bola Atta",
    agency: "Native Music",
    country: "Nigeria",
    focus: ["Ad", "Brand activation", "TV"],
    recentProjects: "Pan-African telecoms + alcohol brand campaigns",
    notes: "Big on Afrobeats licensing for global ads landing in Africa",
  },
  {
    name: "Ife Lagbaja",
    agency: "Ada Music Supervision",
    country: "Nigeria",
    focus: ["Trailer", "Film", "Branded content"],
    recentProjects: "Trailer house syncs into US theatrical",
    notes: "Routes Nigerian masters into US trailer placements",
  },
  {
    name: "Alex Hancock",
    agency: "Native Tongue Music Publishing (Sync)",
    country: "Pan-African",
    focus: ["Sync admin", "Catalogue rep"],
    recentProjects: "Repping African writer-publishers globally",
    notes: "Indirect route — pitch through their roster",
  },
  {
    name: "Maggie Phillips",
    agency: "Format Entertainment",
    country: "United States",
    focus: ["TV episodic", "Film"],
    recentProjects: "Major US series (HBO, Netflix)",
    notes: "Listens to global submissions; high bar; African crossover material",
  },
  {
    name: "Iain Cooke",
    agency: "Cord Worldwide",
    country: "United Kingdom",
    focus: ["Ad", "Brand", "Film"],
    recentProjects: "Pan-European ad campaigns",
    notes: "London-based, briefed across African catalogues",
  },
];

const FOCUSES = ["All", "TV episodic", "TV trailer", "Film", "Film trailer", "Ad", "Brand films", "Trailer", "Documentary", "Branded content", "Streaming originals", "Sync admin"] as const;
const COUNTRIES = ["All", "South Africa", "Nigeria", "Pan-African", "United Kingdom", "United States"] as const;

export default function MusicSupervisorDirectoryPage() {
  const [q, setQ] = useState("");
  const [country, setCountry] = useState<(typeof COUNTRIES)[number]>("All");
  const [focus, setFocus] = useState<(typeof FOCUSES)[number]>("All");

  const filtered = useMemo(() => {
    const ql = q.toLowerCase();
    return DIRECTORY.filter(
      (s) =>
        (country === "All" || s.country === country) &&
        (focus === "All" || s.focus.includes(focus)) &&
        (!ql ||
          s.name.toLowerCase().includes(ql) ||
          s.agency.toLowerCase().includes(ql) ||
          s.recentProjects.toLowerCase().includes(ql))
    );
  }, [q, country, focus]);

  return (
    <ResourcePage
      parentHref="/dashboard/library/sync"
      parentLabel="Back to Sync"
      color={COLOR}
      tag="Sync · Directory"
      title="Music Supervisor Directory"
      intro="Music supervisors and sync agencies sourced from public industry rosters. Use the AI Sync Pitch Drafter to send personalised outreach. Always check current credits before approaching."
      next={{ href: "/dashboard/library/sync/sync-quote-calculator", label: "Sync Quote Calculator" }}
    >
      <div className="glass-card rounded-2xl p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              className={`${inputClass} pl-9`}
              placeholder="Search name / agency / project"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <select className={inputClass} value={country} onChange={(e) => setCountry(e.target.value as typeof country)}>
            {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select className={inputClass} value={focus} onChange={(e) => setFocus(e.target.value as typeof focus)}>
            {FOCUSES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((s) => (
          <div key={s.name + s.agency} className="glass-card rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4 mb-2 flex-wrap">
              <div className="min-w-0">
                <p className="font-bold text-text-primary">{s.name}</p>
                <p className="text-xs text-text-muted">{s.agency} · {s.country}</p>
              </div>
              <div className="flex flex-wrap gap-1">
                {s.focus.map((f) => (
                  <span
                    key={f}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded"
                    style={{ color: COLOR, backgroundColor: `${COLOR}15` }}
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
            <p className="text-sm text-text-muted leading-relaxed mb-1">{s.recentProjects}</p>
            {s.notes && <p className="text-xs text-text-muted italic">{s.notes}</p>}
            {s.email && (
              <a href={`mailto:${s.email}`} className="text-xs inline-flex items-center gap-1 mt-2" style={{ color: COLOR }}>
                {s.email} <ExternalLink size={11} />
              </a>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="glass-card rounded-2xl p-12 text-center text-text-muted text-sm">No matches.</div>
        )}
      </div>

      <p className="text-[11px] text-text-muted leading-relaxed mt-6">
        Directory is a starter set. Verify current credits via Mandy News, Tunefind, or each agency's website before pitching. Add private contacts via the AI outreach drafter in the Industry Directory.
      </p>
    </ResourcePage>
  );
}
