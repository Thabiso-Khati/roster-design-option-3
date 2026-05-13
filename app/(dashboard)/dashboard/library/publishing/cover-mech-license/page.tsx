"use client";
import { useMemo } from "react";
import { ResourcePage, inputClass, labelClass, useLocalState } from "@/components/library/module-shell";
import { ContractScaffold, ContractSendButton } from "@/components/library/contract-scaffold";
import { SaveButton } from "@/components/ui/save-button";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";

const COLOR = "#06B6D4";
const STORAGE_KEY = "roster_cover_mech_v1";

interface State {
  songTitle: string;
  originalArtist: string;
  yourArtist: string;
  releaseFormat: "Single" | "Album" | "EP";
  duration: number;
  isrc: string;
  upc: string;
  releaseDate: string;
  copies: number;
  countries: string[];
  publishers: string;
  prodNotes: string;
}

const empty: State = {
  songTitle: "", originalArtist: "", yourArtist: "",
  releaseFormat: "Single", duration: 240, isrc: "", upc: "", releaseDate: "",
  copies: 0, countries: [], publishers: "", prodNotes: "",
};

const ROUTES = [
  {
    region: "United States", body: "MLC + The Harry Fox Agency",
    method: "Direct via MLC for streaming/download mechanicals, Easy Song Licensing or Songfile (HFA) for physical and on-demand",
    rate: "Statutory rate set by Copyright Royalty Board (CRB). Currently US$0.124 per copy under 5 minutes; longer = US$0.0239/min", url: "themlc.com / easysonglicensing.com",
  },
  {
    region: "South Africa", body: "CAPASSO",
    method: "Direct via CAPASSO portal — submit cover declaration before release",
    rate: "9.06% of dealer price for physical; equivalent statutory rate for digital", url: "capasso.co.za",
  },
  {
    region: "Nigeria", body: "MCSN",
    method: "Direct via MCSN. Cover song notification must include original writer + publisher details",
    rate: "Negotiated; typical 8% of wholesale", url: "mcsnnigeria.org",
  },
  {
    region: "United Kingdom", body: "MCPS (PRS for Music)",
    method: "Online via PRS for Music — direct licence for physical, AP1 for online",
    rate: "8.5% of dealer price (physical) or AP1 streaming rates", url: "prsformusic.com",
  },
  {
    region: "Canada", body: "CMRRA",
    method: "Direct via CMRRA",
    rate: "Statutory CRB rate", url: "cmrra.ca",
  },
  {
    region: "Australia", body: "AMCOS",
    method: "Direct via APRA AMCOS",
    rate: "Statutory rate", url: "apraamcos.com.au",
  },
];

export default function CoverMechLicensePage() {
  const [s, setS] = useLocalState<State>(STORAGE_KEY, empty);
  useToolRestore("cover-mech-license", STORAGE_KEY, setS);
  const set = (k: keyof State) => (v: string) => setS({ ...s, [k]: v });

  const usMechRate = useMemo(() => {
    if (s.duration <= 300) return 0.124;
    return Number((Math.ceil(s.duration / 60) * 0.0239).toFixed(4));
  }, [s.duration]);

  const usEstCost = (s.copies || 0) * usMechRate;
  const fmt = (n: number) => `USD ${n.toFixed(2)}`;

  return (
    <ResourcePage
      parentHref="/dashboard/library/publishing"
      parentLabel="Back to Publishing"
      color={COLOR}
      tag="Publishing · Compliance"
      title="Cover Song Mechanical Licence Tool"
      intro="Releasing a cover? You owe the original songwriter mechanical royalties. Routing per territory below — non-payment is copyright infringement."
    
      toolbar={<><SaveButton toolSlug="cover-mech-license" storageKey={STORAGE_KEY} title={`Cover Mech License — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
          <ContractSendButton contractId="cover-mech-license" />          </>
          }
    >
      <ContractScaffold contractId="cover-mech-license">
      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Cover details</p>
        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelClass}>Song title</label><input className={inputClass} value={s.songTitle} onChange={(e) => set("songTitle")(e.target.value)}/></div>
          <div><label className={labelClass}>Original artist</label><input className={inputClass} value={s.originalArtist} onChange={(e) => set("originalArtist")(e.target.value)}/></div>
          <div><label className={labelClass}>Your artist</label><input className={inputClass} value={s.yourArtist} onChange={(e) => set("yourArtist")(e.target.value)}/></div>
          <div><label className={labelClass}>Release format</label><select className={inputClass} value={s.releaseFormat} onChange={(e) => setS({ ...s, releaseFormat: e.target.value as State["releaseFormat"] })}><option>Single</option><option>EP</option><option>Album</option></select></div>
          <div><label className={labelClass}>Duration (seconds)</label><input type="number" className={inputClass} value={s.duration} onChange={(e) => setS({ ...s, duration: Number(e.target.value) || 0 })}/></div>
          <div><label className={labelClass}>Estimated copies (US)</label><input type="number" className={inputClass} value={s.copies} onChange={(e) => setS({ ...s, copies: Number(e.target.value) || 0 })} placeholder="Streams equivalent / physical units"/></div>
          <div><label className={labelClass}>ISRC</label><input className={inputClass} value={s.isrc} onChange={(e) => set("isrc")(e.target.value)}/></div>
          <div><label className={labelClass}>UPC</label><input className={inputClass} value={s.upc} onChange={(e) => set("upc")(e.target.value)}/></div>
          <div><label className={labelClass}>Release date</label><input type="date" className={inputClass} value={s.releaseDate} onChange={(e) => set("releaseDate")(e.target.value)}/></div>
          <div className="col-span-2"><label className={labelClass}>Original publisher(s)</label><input className={inputClass} value={s.publishers} onChange={(e) => set("publishers")(e.target.value)} placeholder="Lookup at PRO database (ASCAP / BMI / SAMRO)"/></div>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6" style={{ borderColor: `${COLOR}40` }}>
        <p className="text-[11px] font-black uppercase tracking-widest mb-3" style={{ color: COLOR }}>US statutory cost estimate</p>
        <p className="text-3xl font-black" style={{ color: COLOR }}>{fmt(usEstCost)}</p>
        <p className="text-xs text-text-muted mt-2">Based on US CRB rate of {fmt(usMechRate)} per copy ({s.duration}s duration) × {s.copies.toLocaleString()} copies. Streaming mechanicals are paid at a different per-stream rate via the MLC; this estimate is for physical / download.</p>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Routing by region</p>
        <div className="space-y-3">
          {ROUTES.map((r) => (
            <div key={r.region} className="border border-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                <p className="font-bold text-sm text-text-primary">{r.region}</p>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{ color: COLOR, backgroundColor: `${COLOR}15` }}>{r.body}</span>
              </div>
              <p className="text-xs text-text-muted leading-relaxed mb-1">{r.method}</p>
              <p className="text-xs text-text-muted leading-relaxed mb-1"><span className="font-semibold text-text-primary">Rate:</span> {r.rate}</p>
              <p className="text-[11px] font-mono" style={{ color: COLOR }}>{r.url}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="glass-card rounded-2xl p-5 flex items-start gap-3" style={{ borderColor: `${COLOR}20`, backgroundColor: `${COLOR}08` }}>
        <p className="text-xs text-text-muted leading-relaxed">
          <span className="font-semibold text-text-primary">Streaming mechanicals.</span> For DSP streaming (Spotify, Apple, etc.), MLC handles US automatically once the work is registered. Other territories: rely on local MROs (CAPASSO, MCSN, MCPS, etc.) which are paid via reciprocal agreements with the DSPs. Direct cover-license route applies primarily to physical releases and yourown DSP delivery via aggregators like Songtrust, Songfile, or Loudr.
        </p>
      </div>
          </ContractScaffold>
    </ResourcePage>
  );
}
