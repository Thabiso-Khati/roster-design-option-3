"use client";
import { useState, useEffect, useCallback } from "react";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";
import Link from "next/link";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { useLocale } from "@/context/locale-context";
import { SaveButton } from "@/components/ui/save-button";
import { ExportButton } from "@/components/ui/export-button";

const STORAGE_KEY = "roster_artist_pl_v1";
const COLOR = "#8B5CF6";

type Tab = "revenue" | "costs";

export default function ArtistPLPage() {
  const handleExportPDF = () => { window.print(); };
  const { fmt, locale, currency } = useLocale();
  const [data, setData] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<Tab>("revenue");

  useToolRestore("artist-pl", STORAGE_KEY, setData);

  const set = useCallback((key: string, val: string) => {
    setData(d => {
      const next = { ...d, [key]: val };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const n = (key: string, def = "0") => parseFloat(data[key] || def) || 0;
  const v = (key: string, def = "") => data[key] || def;

  // Assumptions
  const rates = {
    spotify: n("rate_spotify", "0.003"),
    apple: n("rate_apple", "0.008"),
    boomplay: n("rate_boomplay", "0.001"),
    youtube: n("rate_youtube", "0.002"),
    audiomack: n("rate_audiomack", "0.001"),
    download: n("rate_download", "15"),
    cd: n("rate_cd", "120"),
    vinyl: n("rate_vinyl", "350"),
  };

  // Streaming revenues
  const spotifyRev = n("streams_spotify") * rates.spotify;
  const appleRev = n("streams_apple") * rates.apple;
  const boomplayRev = n("streams_boomplay") * rates.boomplay;
  const youtubeRev = n("streams_youtube") * rates.youtube;
  const audiomackRev = n("streams_audiomack") * rates.audiomack;
  const downloadRev = n("units_download") * rates.download;
  const cdRev = n("units_cd") * rates.cd;
  const vinylRev = n("units_vinyl") * rates.vinyl;
  const liveIncome = n("income_live");
  const syncIncome = n("income_sync");
  const merch = n("income_merch");
  const brand = n("income_brand");
  const otherIncome = n("income_other");

  const totalStreamingRev = spotifyRev + appleRev + boomplayRev + youtubeRev + audiomackRev;
  const totalGrossRev = totalStreamingRev + downloadRev + cdRev + vinylRev + liveIncome + syncIncome + merch + brand + otherIncome;
  const totalStreams = n("streams_spotify") + n("streams_apple") + n("streams_boomplay") + n("streams_youtube") + n("streams_audiomack");

  // Costs
  const recordingCosts = n("cost_recording");
  const artworkCosts = n("cost_artwork");
  const marketingCosts = n("cost_marketing");
  const distribCosts = n("cost_distrib");
  const radioCosts = n("cost_radio");
  const prCosts = n("cost_pr");
  const societyCosts = n("cost_societies");
  const physicalCosts = n("cost_physical");
  const tourCosts = n("cost_tour");
  const advanceCosts = n("cost_advance");
  const mgmtPct = n("cost_mgmt_pct", "0");
  const mgmtCost = (mgmtPct / 100) * totalGrossRev;
  const agentPct = n("cost_agent_pct", "0");
  const agentCost = (agentPct / 100) * liveIncome;
  const otherCosts = n("cost_other");

  const totalCosts = recordingCosts + artworkCosts + marketingCosts + distribCosts + radioCosts + prCosts + societyCosts + physicalCosts + tourCosts + advanceCosts + mgmtCost + agentCost + otherCosts;
  const netProfit = totalGrossRev - totalCosts;
  const profitMargin = totalGrossRev > 0 ? (netProfit / totalGrossRev) * 100 : 0;
  const breakEvenStreams = rates.spotify > 0 ? Math.ceil(totalCosts / rates.spotify) : 0;

  const handleReset = () => {
    if (confirm("Reset all P&L figures? This cannot be undone.")) {
      setData({});
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const cellInput = "bg-transparent text-right text-sm text-text-primary placeholder:text-text-muted focus:outline-none border-b border-transparent focus:border-brand w-full py-1";
  const assumptionInput = "bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none border border-border rounded-lg px-3 py-1.5 w-full focus:border-brand text-right";

  const REVENUE_ROWS = [
    { label: "Spotify", key: "spotify", unit: "streams_spotify", rateKey: "rate_spotify", rateDef: "0.003", rev: spotifyRev },
    { label: "Apple Music", key: "apple", unit: "streams_apple", rateKey: "rate_apple", rateDef: "0.008", rev: appleRev },
    { label: "Boomplay", key: "boomplay", unit: "streams_boomplay", rateKey: "rate_boomplay", rateDef: "0.001", rev: boomplayRev },
    { label: "YouTube Music", key: "youtube", unit: "streams_youtube", rateKey: "rate_youtube", rateDef: "0.002", rev: youtubeRev },
    { label: "Audiomack", key: "audiomack", unit: "streams_audiomack", rateKey: "rate_audiomack", rateDef: "0.001", rev: audiomackRev },
  ];

  const COST_ROWS = [
    { label: "Recording & production costs", key: "cost_recording" },
    { label: "Artwork & visual assets", key: "cost_artwork" },
    { label: "Marketing & promotion", key: "cost_marketing" },
    { label: "Distribution fees", key: "cost_distrib" },
    { label: "Radio plugger fees", key: "cost_radio" },
    { label: "PR / publicist fees", key: "cost_pr" },
    { label: "Collecting society registration fees", key: "cost_societies" },
    { label: "Physical manufacturing costs", key: "cost_physical" },
    { label: "Tour / live costs (allocated to album)", key: "cost_tour" },
    { label: "Advance recoupment (if applicable)", key: "cost_advance" },
    { label: "Other costs", key: "cost_other" },
  ];

  return (
    <div className="animate-fade-in max-w-4xl">
      <div className="flex items-center gap-2 text-xs text-text-muted mb-6">
          <SaveButton toolSlug="artist-pl" storageKey={STORAGE_KEY} title={`Artist Pl — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
            <ExportButton onPDF={handleExportPDF} />

        <Link href="/dashboard/library" className="hover:text-text-primary transition-colors">Toolkit</Link>
        <ChevronRight size={12}/>
        <Link href="/dashboard/library/recording" className="hover:text-text-primary transition-colors">Releasing Music</Link>
        <ChevronRight size={12}/>
        <span className="text-text-primary">Artist Profit & Loss</span>
      </div>

      <div className="glass-card rounded-2xl p-7 mb-8" style={{ borderColor: `${COLOR}25` }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: COLOR }}>Full P&L · Live Tool · Auto-Saved</p>
        <h1 className="text-2xl font-black text-text-primary mb-1">Artist Profit & Loss</h1>
        <p className="text-sm font-semibold mb-1" style={{ color: COLOR }}>Revenue model for a single album release, auto-calculated costs and net profit.</p>
        <p className="text-sm text-text-muted">Enter streaming numbers, units sold, and costs. Net profit, margins, and break-even stream count calculate automatically.</p>
      </div>

      {/* Net Profit Summary, always visible */}
      <div className={`glass-card rounded-xl p-5 mb-8 ${netProfit >= 0 ? "" : ""}`} style={{ borderColor: netProfit >= 0 ? "#10B98130" : "#EF444430", backgroundColor: netProfit >= 0 ? "#10B98108" : "#EF444408" }}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Revenue", value: fmt(totalGrossRev), color: COLOR },
            { label: "Total Costs", value: fmt(totalCosts), color: "#F59E0B" },
            { label: "Net Profit / Loss", value: fmt(netProfit), color: netProfit >= 0 ? "#10B981" : "#EF4444" },
            { label: "Profit Margin", value: `${profitMargin.toFixed(1)}%`, color: netProfit >= 0 ? "#10B981" : "#EF4444" },
          ].map(c => (
            <div key={c.label} className="text-center">
              <p className="text-xs text-text-muted mb-0.5">{c.label}</p>
              <p className="text-lg font-black" style={{ color: c.color }}>{c.value}</p>
            </div>
          ))}
        </div>
        {breakEvenStreams > 0 && (
          <div className="mt-4 pt-3 border-t border-border text-center">
            <p className="text-xs text-text-muted">Break-even at Spotify rate ({fmt(rates.spotify)}/stream): <span className="font-black text-text-primary">{breakEvenStreams.toLocaleString(locale)} streams</span></p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-0 mb-6 border-b border-border">
        {(["revenue", "costs"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 -mb-px capitalize ${
              tab === t ? "border-brand text-brand" : "border-transparent text-text-muted hover:text-text-primary"
            }`}>{t === "revenue" ? "Revenue" : "Costs & Net Profit"}</button>
        ))}
      </div>

      {tab === "revenue" && (
        <div className="space-y-5">
          {/* Assumptions */}
          <div className="glass-card rounded-xl p-5">
            <p className="text-xs font-black uppercase tracking-wider mb-3" style={{ color: COLOR }}>Streaming Rate Assumptions ({currency} per stream, editable)</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Spotify", key: "rate_spotify", def: "0.003" },
                { label: "Apple Music", key: "rate_apple", def: "0.008" },
                { label: "Boomplay", key: "rate_boomplay", def: "0.001" },
                { label: "YouTube Music", key: "rate_youtube", def: "0.002" },
                { label: "Audiomack", key: "rate_audiomack", def: "0.001" },
                { label: "Download price (per unit)", key: "rate_download", def: "15" },
                { label: "CD price (per unit)", key: "rate_cd", def: "120" },
                { label: "Vinyl price (per unit)", key: "rate_vinyl", def: "350" },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-[10px] font-semibold text-text-muted block mb-1">{f.label}</label>
                  <input type="number" value={v(f.key, f.def)} onChange={e => set(f.key, e.target.value)}
                    placeholder={f.def} step="0.001" min="0" className={assumptionInput}/>
                </div>
              ))}
            </div>
          </div>

          {/* Streaming Revenue */}
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border" style={{ backgroundColor: `${COLOR}10` }}>
              <p className="text-xs font-black uppercase tracking-wider" style={{ color: COLOR }}>Streaming Revenue</p>
            </div>
            <div className="grid grid-cols-12 px-5 py-2 border-b border-border text-[10px] font-black uppercase tracking-wider text-text-muted">
              <span className="col-span-4">Platform</span>
              <span className="col-span-3 text-right">Streams</span>
              <span className="col-span-2 text-right">Rate ({currency})</span>
              <span className="col-span-3 text-right">Revenue</span>
            </div>
            {REVENUE_ROWS.map((row, i) => (
              <div key={row.key} className={`grid grid-cols-12 px-5 py-2.5 border-b border-border items-center ${i % 2 === 1 ? "bg-surface-2" : ""}`}>
                <span className="col-span-4 text-sm text-text-muted">{row.label}</span>
                <div className="col-span-3 px-1">
                  <input type="number" value={data[row.unit] || ""} onChange={e => set(row.unit, e.target.value)}
                    placeholder="0" min="0" className={cellInput}/>
                </div>
                <span className="col-span-2 text-right text-xs text-text-muted">{fmt(rates[row.key as keyof typeof rates])}</span>
                <span className="col-span-3 text-right text-sm font-semibold" style={{ color: row.rev > 0 ? COLOR : undefined }}>
                  {row.rev > 0 ? fmt(row.rev) : ", "}
                </span>
              </div>
            ))}
            <div className="grid grid-cols-12 px-5 py-3 bg-surface-2 border-t border-border">
              <span className="col-span-9 text-xs font-black uppercase tracking-wider" style={{ color: COLOR }}>Total Streaming ({Math.round(totalStreams).toLocaleString(locale)} streams)</span>
              <span className="col-span-3 text-right text-sm font-black text-text-primary">{fmt(totalStreamingRev)}</span>
            </div>
          </div>

          {/* Other Revenue */}
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border" style={{ backgroundColor: "#10B98110" }}>
              <p className="text-xs font-black uppercase tracking-wider" style={{ color: "#10B981" }}>Downloads, Physical & Other Revenue</p>
            </div>
            {[
              { label: "Digital Downloads", unit: "units_download", rev: downloadRev, unitLabel: "units", rateLabel: fmt(rates.download) + "/unit" },
              { label: "Physical CD Sales", unit: "units_cd", rev: cdRev, unitLabel: "units", rateLabel: fmt(rates.cd) + "/unit" },
              { label: "Vinyl Sales", unit: "units_vinyl", rev: vinylRev, unitLabel: "units", rateLabel: fmt(rates.vinyl) + "/unit" },
            ].map((row, i) => (
              <div key={row.label} className={`grid grid-cols-12 px-5 py-2.5 border-b border-border items-center ${i % 2 === 1 ? "bg-surface-2" : ""}`}>
                <span className="col-span-4 text-sm text-text-muted">{row.label}</span>
                <div className="col-span-3 px-1">
                  <input type="number" value={data[row.unit] || ""} onChange={e => set(row.unit, e.target.value)}
                    placeholder="0" min="0" className={cellInput}/>
                </div>
                <span className="col-span-2 text-right text-xs text-text-muted">{row.rateLabel}</span>
                <span className="col-span-3 text-right text-sm font-semibold" style={{ color: row.rev > 0 ? "#10B981" : undefined }}>
                  {row.rev > 0 ? fmt(row.rev) : ", "}
                </span>
              </div>
            ))}
            {[
              { label: "Live Performance Income", key: "income_live", rev: liveIncome, color: "#F59E0B" },
              { label: "Sync Licensing Income", key: "income_sync", rev: syncIncome, color: "#EC4899" },
              { label: "Merchandise Revenue", key: "income_merch", rev: merch, color: "#06B6D4" },
              { label: "Brand Deal / Endorsement", key: "income_brand", rev: brand, color: "#C9A84C" },
              { label: "Other Income", key: "income_other", rev: otherIncome, color: "#8B5CF6" },
            ].map((row, i) => (
              <div key={row.label} className={`grid grid-cols-12 px-5 py-2.5 border-b border-border items-center ${(i + 3) % 2 === 1 ? "bg-surface-2" : ""}`}>
                <span className="col-span-6 text-sm text-text-muted">{row.label}</span>
                <div className="col-span-3 px-1">
                  <input type="number" value={data[row.key] || ""} onChange={e => set(row.key, e.target.value)}
                    placeholder="0.00" min="0" className={cellInput}/>
                </div>
                <span className="col-span-3 text-right text-sm font-semibold" style={{ color: row.rev > 0 ? row.color : undefined }}>
                  {row.rev > 0 ? fmt(row.rev) : ", "}
                </span>
              </div>
            ))}
            <div className="grid grid-cols-12 px-5 py-3 bg-surface-2 border-t border-border">
              <span className="col-span-9 text-xs font-black uppercase tracking-wider" style={{ color: "#10B981" }}>Total Gross Revenue</span>
              <span className="col-span-3 text-right text-sm font-black text-text-primary">{fmt(totalGrossRev)}</span>
            </div>
          </div>
        </div>
      )}

      {tab === "costs" && (
        <div className="space-y-5">
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border" style={{ backgroundColor: "#F59E0B10" }}>
              <p className="text-xs font-black uppercase tracking-wider" style={{ color: "#F59E0B" }}>Costs</p>
            </div>
            <div className="grid grid-cols-12 px-5 py-2 border-b border-border text-[10px] font-black uppercase tracking-wider text-text-muted">
              <span className="col-span-8">Item</span>
              <span className="col-span-4 text-right">Amount ({currency})</span>
            </div>
            {COST_ROWS.map((row, i) => (
              <div key={row.key} className={`grid grid-cols-12 px-5 py-2.5 border-b border-border items-center ${i % 2 === 1 ? "bg-surface-2" : ""}`}>
                <span className="col-span-8 text-sm text-text-muted">{row.label}</span>
                <div className="col-span-4 px-1">
                  <input type="number" value={data[row.key] || ""} onChange={e => set(row.key, e.target.value)}
                    placeholder="0.00" min="0" className={cellInput}/>
                </div>
              </div>
            ))}
            {/* Commission rows */}
            <div className="grid grid-cols-12 px-5 py-2.5 border-b border-border items-center bg-surface-2">
              <span className="col-span-5 text-sm text-text-muted">Management commission</span>
              <div className="col-span-2 px-1 flex items-center gap-1">
                <input type="number" value={data["cost_mgmt_pct"] || ""} onChange={e => set("cost_mgmt_pct", e.target.value)}
                  placeholder="0" min="0" max="100" className={cellInput}/>
                <span className="text-xs text-text-muted flex-shrink-0">%</span>
              </div>
              <span className="col-span-1 text-xs text-text-muted text-center">of gross</span>
              <span className="col-span-4 text-right text-sm font-semibold" style={{ color: mgmtCost > 0 ? "#F59E0B" : undefined }}>
                {mgmtCost > 0 ? fmt(mgmtCost) : ", "}
              </span>
            </div>
            <div className="grid grid-cols-12 px-5 py-2.5 border-b border-border items-center">
              <span className="col-span-5 text-sm text-text-muted">Booking agent commission</span>
              <div className="col-span-2 px-1 flex items-center gap-1">
                <input type="number" value={data["cost_agent_pct"] || ""} onChange={e => set("cost_agent_pct", e.target.value)}
                  placeholder="0" min="0" max="100" className={cellInput}/>
                <span className="text-xs text-text-muted flex-shrink-0">%</span>
              </div>
              <span className="col-span-1 text-xs text-text-muted text-center">of live</span>
              <span className="col-span-4 text-right text-sm font-semibold" style={{ color: agentCost > 0 ? "#F59E0B" : undefined }}>
                {agentCost > 0 ? fmt(agentCost) : ", "}
              </span>
            </div>
            <div className="grid grid-cols-12 px-5 py-3 bg-surface-2 border-t border-border">
              <span className="col-span-8 text-xs font-black uppercase tracking-wider" style={{ color: "#F59E0B" }}>Total Costs</span>
              <span className="col-span-4 text-right text-sm font-black text-text-primary">{fmt(totalCosts)}</span>
            </div>
          </div>

          {/* Net Profit Detail */}
          <div className="glass-card rounded-xl overflow-hidden" style={{ borderColor: netProfit >= 0 ? "#10B98130" : "#EF444430" }}>
            <div className="px-5 py-3 border-b border-border" style={{ backgroundColor: netProfit >= 0 ? "#10B98108" : "#EF444408" }}>
              <p className="text-xs font-black uppercase tracking-wider" style={{ color: netProfit >= 0 ? "#10B981" : "#EF4444" }}>Net Profit Summary</p>
            </div>
            <div className="divide-y divide-border">
              {[
                { label: "Total Gross Revenue", value: fmt(totalGrossRev), color: COLOR },
                { label: "Total Costs", value: fmt(totalCosts), color: "#F59E0B" },
                { label: "Net Profit / Loss", value: fmt(netProfit), color: netProfit >= 0 ? "#10B981" : "#EF4444", large: true },
                { label: "Profit Margin", value: `${profitMargin.toFixed(1)}%`, color: netProfit >= 0 ? "#10B981" : "#EF4444" },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between px-5 py-3">
                  <span className={`${row.large ? "font-black text-base" : "font-semibold text-sm"} text-text-primary`}>{row.label}</span>
                  <span className={`font-black ${row.large ? "text-xl" : "text-base"}`} style={{ color: row.color }}>{row.value}</span>
                </div>
              ))}
            </div>
            {breakEvenStreams > 0 && (
              <div className="px-5 py-4 border-t border-border" style={{ backgroundColor: `${COLOR}06` }}>
                <p className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: COLOR }}>Break-Even Analysis</p>
                <p className="text-sm text-text-muted">At the current Spotify rate ({fmt(rates.spotify)}/stream), you need <span className="font-black text-text-primary">{breakEvenStreams.toLocaleString(locale)}</span> streams to cover all costs, not including any other revenue streams.</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="glass-card rounded-xl p-4 my-8 flex items-start gap-3" style={{ borderColor: "rgba(201,168,76,0.15)", backgroundColor: "rgba(201,168,76,0.04)" }}>
        <span className="text-base flex-shrink-0">💾</span>
        <p className="text-xs text-text-muted leading-relaxed"><span className="font-semibold text-brand">Auto-saved to this device for 90 days.</span> Streaming rates are estimates and vary by territory, tier, and platform agreements. Verify current rates with your distributor.</p>
      </div>

      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <Link href="/dashboard/library/recording" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors">
          <ChevronLeft size={15}/>Back to Releasing Music
        </Link>
        <button onClick={handleReset}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-text-muted hover:text-text-primary border border-border hover:border-text-muted transition-all">
          <RotateCcw size={12}/>Reset P&L
        </button>
      </div>
    </div>
  );
}
