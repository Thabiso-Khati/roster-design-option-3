"use client";
import { useMemo, useState } from "react";
import { ResourcePage, inputClass } from "@/components/library/module-shell";

const COLOR = "#0EA5E9";

interface DSP {
  name: string;
  perStream: string;
  reach: string;
  africaShare: string;
  payoutCadence: string;
  editorial: string;
  artistTools: string;
  partnerships: string;
}

const DSPS: DSP[] = [
  { name: "Spotify", perStream: "~$0.0035 (varies)", reach: "626M users globally; ~110M revenue from sub-Saharan Africa (2024)", africaShare: "Strong", payoutCadence: "Monthly via distributor", editorial: "Spotify for Artists pitching, editorial playlists", artistTools: "S4A analytics, Marquee, Discovery Mode", partnerships: "Spotify Africa office (Lagos / Joburg); RADAR Africa programme" },
  { name: "Apple Music", perStream: "~$0.008", reach: "100M+ subscribers; high ARPU", africaShare: "Strong", payoutCadence: "Monthly via distributor", editorial: "Apple Music for Artists pitching", artistTools: "AMfA analytics, Spatial Audio bonus pool", partnerships: "Apple Music Africa Now playlist" },
  { name: "YouTube Music + YouTube CMS", perStream: "$0.006 (premium) / $0.0009 (ad)", reach: "2.7B YouTube users", africaShare: "Dominant in mainstream Africa", payoutCadence: "Monthly via Content ID / distributor", editorial: "YT Music editorial + algo", artistTools: "YT Studio analytics, Shorts, CMS", partnerships: "Heavy in Africa via mobile + cheap data plans" },
  { name: "Audiomack", perStream: "~$0.0028", reach: "~25M MAU; #1 music app in Nigeria (15.3M MAU)", africaShare: "Dominant in West Africa", payoutCadence: "Monthly via distributor / direct", editorial: "Audiomack Originals, supporters", artistTools: "Audiomack for Creators, Premium Plus / Trendsetter tiers", partnerships: "Free Plus tier with mobile carriers in NG / GH" },
  { name: "Boomplay", perStream: "~$0.0009", reach: "~75M MAU; pre-installed on 50%+ Nigerian smartphones (Transsion)", africaShare: "Dominant in West / East Africa", payoutCadence: "Monthly via distributor", editorial: "Boomplay editorial + chart playlists", artistTools: "Boomplay for Artists analytics", partnerships: "Carrier integration; Transsion (Tecno / Infinix / itel)" },
  { name: "Deezer", perStream: "~$0.0048", reach: "9.3M subscribers; strong in Francophone Africa via Orange partnership", africaShare: "Strong (Francophone)", payoutCadence: "Monthly via distributor", editorial: "Editor's playlists, Deezer Africa", artistTools: "Deezer for Creators", partnerships: "Orange MEA carrier bundles" },
  { name: "Tidal", perStream: "~$0.0125", reach: "~5M subscribers; high-fidelity premium", africaShare: "Niche", payoutCadence: "Monthly via distributor", editorial: "Tidal Rising; curatorial editorial", artistTools: "Direct artist payouts (artist-centric model)", partnerships: "Limited Africa-specific" },
  { name: "Mdundo", perStream: "~$0.0015", reach: "5M+ MAU East Africa; 2.8M Kenya alone", africaShare: "Dominant in Kenya / Tanzania", payoutCadence: "Monthly via distributor", editorial: "East African chart focus", artistTools: "Mdundo for Artists", partnerships: "Carrier bundles (Safaricom etc.)" },
  { name: "Anghami", perStream: "~$0.0017", reach: "20M MAU; dominant MENA region", africaShare: "Dominant in Egypt / Morocco / Algeria / Tunisia", payoutCadence: "Monthly via distributor", editorial: "Anghami editorial + radio", artistTools: "Anghami for Artists", partnerships: "MENA telco bundles" },
  { name: "Amazon Music", perStream: "~$0.004", reach: "100M+ users (Prime + Unlimited combined)", africaShare: "Niche", payoutCadence: "Monthly via distributor", editorial: "Amazon Music editorial", artistTools: "Amazon Music for Artists", partnerships: "Limited Africa-specific" },
  { name: "Pandora", perStream: "~$0.0012", reach: "~50M users (US-focused)", africaShare: "Niche (US-only)", payoutCadence: "Monthly via distributor + SoundExchange", editorial: "Pandora algo-driven", artistTools: "Pandora AMP", partnerships: "US-only" },
];

export default function DSPComparisonPage() {
  const [filter, setFilter] = useState<"All" | "African" | "Premium-rate">("All");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => DSPS.filter((d) => {
    if (filter === "African" && (d.africaShare === "Niche")) return false;
    if (filter === "Premium-rate" && parseFloat(d.perStream.replace(/[^0-9.]/g, "")) < 0.005) return false;
    if (search && !`${d.name} ${d.partnerships}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [filter, search]);

  const shareColor: Record<string, string> = {
    Dominant: "#10B981", Strong: "#0EA5E9", Growing: "#F59E0B", Niche: "#94A3B8",
    "Dominant in mainstream Africa": "#10B981",
    "Dominant in West Africa": "#10B981",
    "Dominant in West / East Africa": "#10B981",
    "Dominant in Kenya / Tanzania": "#10B981",
    "Dominant in Egypt / Morocco / Algeria / Tunisia": "#10B981",
    "Strong (Francophone)": "#0EA5E9",
    "Niche (US-only)": "#94A3B8",
  };
  const colorFor = (key: string) => shareColor[key] ?? "#94A3B8";

  return (
    <ResourcePage
      parentHref="/dashboard/library/distribution"
      parentLabel="Back to Distribution"
      color={COLOR}
      tag="Distribution · DSP matrix"
      title="DSP Comparison Matrix"
      intro="Per-platform per-stream rates, reach, African market share, editorial routes. Decide where to push — and where to skip the pitch effort."
      next={{ href: "/dashboard/library/distribution/audio-qc", label: "Audio QC Tool" }}
    >
      <div className="glass-card rounded-2xl p-4 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input className={inputClass} placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)}/>
        <select className={inputClass} value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
          <option>All</option>
          <option>African</option>
          <option>Premium-rate</option>
        </select>
        <p className="text-xs text-text-muted self-center">{filtered.length} of {DSPS.length} DSPs</p>
      </div>

      <div className="space-y-3">
        {filtered.map((d) => (
          <div key={d.name} className="glass-card rounded-2xl p-5">
            <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
              <div>
                <p className="font-bold text-text-primary">{d.name}</p>
                <p className="text-xs text-text-muted">Per-stream rate: <span className="font-semibold text-text-primary">{d.perStream}</span></p>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{ color: colorFor(d.africaShare), backgroundColor: `${colorFor(d.africaShare)}15` }}>
                Africa: {d.africaShare}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs mb-2">
              <div><p className="text-text-muted mb-1">Reach</p><p className="text-text-primary">{d.reach}</p></div>
              <div><p className="text-text-muted mb-1">Payout cadence</p><p className="text-text-primary">{d.payoutCadence}</p></div>
              <div><p className="text-text-muted mb-1">Editorial route</p><p className="text-text-primary">{d.editorial}</p></div>
              <div><p className="text-text-muted mb-1">Artist tools</p><p className="text-text-primary">{d.artistTools}</p></div>
              <div className="col-span-2"><p className="text-text-muted mb-1">Notable partnerships / context</p><p className="text-text-primary">{d.partnerships}</p></div>
            </div>
          </div>
        ))}
      </div>
    </ResourcePage>
  );
}
