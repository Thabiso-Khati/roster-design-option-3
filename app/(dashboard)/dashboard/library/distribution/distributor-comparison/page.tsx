"use client";
import { useMemo, useState } from "react";
import { ResourcePage, inputClass } from "@/components/library/module-shell";

const COLOR = "#0EA5E9";

interface Distributor {
  name: string;
  payout: string;
  upfront: string;
  pricing: string;
  africanFocus: "Strong" | "Medium" | "Light" | "None";
  syncIncluded: string;
  bestFor: string;
  watchOuts: string;
  url?: string;
}

const DISTRIBUTORS: Distributor[] = [
  { name: "Africori", payout: "70-85% royalty share", upfront: "Free + paid tiers", pricing: "% deal — no upfront", africanFocus: "Strong", syncIncluded: "Add-on", bestFor: "African artists wanting Africa-first DSP push (Audiomack / Boomplay / Mdundo) + global", watchOuts: "Royalty share rather than 100% retention; check sub-publishing terms", url: "africori.com" },
  { name: "Mvelopay", payout: "100% retained", upfront: "Free", pricing: "Free at base, paid features", africanFocus: "Strong", syncIncluded: "No", bestFor: "SA-first artists, free entry distribution into African DSPs", watchOuts: "Newer player; verify per-DSP delivery breadth", url: "mvelopay.com" },
  { name: "DistroKid", payout: "100% retained", upfront: "USD 22.99/year base", pricing: "Annual subscription", africanFocus: "Light", syncIncluded: "Add-on", bestFor: "High-volume releasers, fast turnaround, established global tools", watchOuts: "Annual fee scales with artist count; African DSPs covered but not prioritised; pulled from Mdundo previously" },
  { name: "TuneCore", payout: "100% retained", upfront: "USD 9.99/single up to USD 49.99/album/yr", pricing: "Per-release annual", africanFocus: "Medium", syncIncluded: "Add-on", bestFor: "Established artists with sync ambition + admin", watchOuts: "Costs add up across catalogue; YouTube CMS routing differs", url: "tunecore.com" },
  { name: "AWAL", payout: "85-90% royalty share", upfront: "Application-only", pricing: "% deal", africanFocus: "Medium", syncIncluded: "Yes — full team", bestFor: "Artists with track record looking for label-style services without giving up masters", watchOuts: "Curatorial — must apply and be accepted; service tier varies", url: "awal.com" },
  { name: "Stem", payout: "100% retained", upfront: "Application-only", pricing: "% per release", africanFocus: "Medium", syncIncluded: "Yes", bestFor: "Multi-collaborator works (split payments built-in), independent label workflow", watchOuts: "Application-based; fee structure can change post-acceptance", url: "stem.is" },
  { name: "Symphonic", payout: "85-92% royalty share", upfront: "Free + paid tiers", pricing: "% or flat", africanFocus: "Medium", syncIncluded: "Yes", bestFor: "Indie label workflow; comprehensive sync + neighbouring rights services", watchOuts: "Royalty share takes a slice; verify reporting cadence", url: "symphonic.com" },
  { name: "DistroVibes", payout: "100% retained", upfront: "USD 9.99/year", pricing: "Annual subscription", africanFocus: "Medium", syncIncluded: "No", bestFor: "Cost-conscious artists with low volume", watchOuts: "Newer, verify DSP delivery breadth; African DSP coverage variable", url: "distrovibes.com" },
  { name: "Tunecore Publishing (admin)", payout: "80% / 20% split", upfront: "USD 75/yr setup", pricing: "Admin deal", africanFocus: "Light", syncIncluded: "Yes (admin)", bestFor: "Worldwide collection of mechanical / sync as an admin layer above distribution", watchOuts: "Admin only; not master distribution", url: "publishing.tunecore.com" },
  { name: "CD Baby", payout: "91% retained (digital)", upfront: "USD 9.95/single, USD 29/album one-time + annual", pricing: "One-time + annual", africanFocus: "Light", syncIncluded: "Yes (Sync Licensing)", bestFor: "Long-tail catalogue artists; one-time fee structure", watchOuts: "Older platform; verify African DSP coverage", url: "cdbaby.com" },
  { name: "UnitedMasters", payout: "100% retained (Select Plus 90%)", upfront: "Free", pricing: "% on premium tiers", africanFocus: "Light", syncIncluded: "Yes — brand partnerships", bestFor: "Hip-hop / Afrobeats artists with crossover into US market", watchOuts: "Brand partnership focus rather than traditional sync", url: "unitedmasters.com" },
  { name: "Songtradr (Vydia distribution)", payout: "Varies", upfront: "Negotiated", pricing: "Per-deal", africanFocus: "Medium", syncIncluded: "Yes — sync first", bestFor: "Artists / labels primarily targeting sync revenue", watchOuts: "Sync-first orientation; less traditional DSP-pitch focused", url: "songtradr.com" },
];

export default function DistributorComparisonPage() {
  const [filter, setFilter] = useState<"All" | "African focus" | "Sync included">("All");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return DISTRIBUTORS.filter((d) => {
      if (filter === "African focus" && d.africanFocus === "None") return false;
      if (filter === "African focus" && d.africanFocus === "Light") return false;
      if (filter === "Sync included" && d.syncIncluded === "No") return false;
      if (search && !`${d.name} ${d.bestFor}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [filter, search]);

  const focusColor = {
    Strong: "#10B981", Medium: "#F59E0B", Light: "#94A3B8", None: "#EF4444",
  } as const;

  return (
    <ResourcePage
      parentHref="/dashboard/library/distribution"
      parentLabel="Back to Distribution"
      color={COLOR}
      tag="Distribution · Decision support"
      title="Distributor Comparison Matrix"
      intro="Pick the right distributor before you upload. Matrix covers payout structure, upfront cost, African-DSP focus, sync inclusion, and best-fit profile."
    >
      <div className="glass-card rounded-2xl p-4 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input className={inputClass} placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)}/>
        <select className={inputClass} value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
          <option>All</option>
          <option>African focus</option>
          <option>Sync included</option>
        </select>
        <p className="text-xs text-text-muted self-center">{filtered.length} of {DISTRIBUTORS.length} distributors</p>
      </div>

      <div className="space-y-3">
        {filtered.map((d) => (
          <div key={d.name} className="glass-card rounded-2xl p-5">
            <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
              <p className="font-bold text-text-primary">{d.name}</p>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{ color: focusColor[d.africanFocus], backgroundColor: `${focusColor[d.africanFocus]}15` }}>
                Africa: {d.africanFocus}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-3">
              <div><p className="text-text-muted">Payout</p><p className="font-semibold text-text-primary">{d.payout}</p></div>
              <div><p className="text-text-muted">Upfront</p><p className="font-semibold text-text-primary">{d.upfront}</p></div>
              <div><p className="text-text-muted">Pricing</p><p className="font-semibold text-text-primary">{d.pricing}</p></div>
              <div><p className="text-text-muted">Sync</p><p className="font-semibold text-text-primary">{d.syncIncluded}</p></div>
            </div>
            <p className="text-xs text-text-muted leading-relaxed mb-1"><span className="font-semibold text-text-primary">Best for:</span> {d.bestFor}</p>
            <p className="text-xs text-text-muted leading-relaxed mb-2"><span className="font-semibold text-text-primary">Watch-outs:</span> {d.watchOuts}</p>
            <p className="text-[11px] font-mono" style={{ color: COLOR }}>{d.url}</p>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-text-muted leading-relaxed mt-6">
        Matrix is a starter reference. Always verify current terms on each distributor's website before signing — pricing tiers, percentage shares, and sync inclusion change. Re-check at least annually.
      </p>
    </ResourcePage>
  );
}
