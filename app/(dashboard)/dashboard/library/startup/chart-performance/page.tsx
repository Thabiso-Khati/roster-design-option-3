"use client";
import { useMemo } from "react";
import { Plus, Trash2, BarChart3, Award, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { ResourcePage, inputClass, labelClass, useLocalState } from "@/components/library/module-shell";
import { SaveButton } from "@/components/ui/save-button";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";

const COLOR = "#C9A84C";

interface ChartEntry {
  id: string;
  artistName: string;
  workTitle: string;
  workType: "Single" | "EP" | "Album" | "Mixtape";
  chart: string;
  position: number;
  weekDate: string;
  source: string;
  prevPosition: number | null;
  isPeak: boolean;
  notes: string;
}

interface CertificationEntry {
  id: string;
  artistName: string;
  workTitle: string;
  body: string;        // RIAA / RiSA / BPI / etc.
  level: string;       // Gold / Platinum / Diamond / etc.
  dateAwarded: string;
  units: string;       // raw threshold context
  notes: string;
}

const CHART_PRESETS = [
  "Spotify Top 200 — South Africa",
  "Spotify Top 50 — South Africa",
  "Spotify Top 200 — Nigeria",
  "Apple Music Top 100 — South Africa",
  "Apple Music Top 100 — Nigeria",
  "Apple Music Top 100 — Global",
  "Billboard 200",
  "Billboard Hot 100",
  "TurnTable Charts (Nigeria)",
  "Official Charts Company (UK)",
  "Boomplay Top 100 — Nigeria",
  "Audiomack Trending — Africa",
  "iTunes Top 100 — South Africa",
  "TikTok Top 50",
];

const CERT_BODIES = [
  { body: "RIAA (US)",         levels: ["Gold (500k)", "Platinum (1M)", "2x Platinum", "5x Platinum", "Diamond (10M)"] },
  { body: "RiSA (SA)",          levels: ["Gold (15k)", "Platinum (30k)", "2x Platinum", "Diamond (100k)"] },
  { body: "BPI (UK)",           levels: ["Silver (60k)", "Gold (100k)", "Platinum (300k)", "Diamond (1M)"] },
  { body: "ARIA (AU)",          levels: ["Gold (35k)", "Platinum (70k)", "Diamond (500k)"] },
  { body: "MC (FR)",            levels: ["Gold (50k)", "Platinum (100k)", "Diamond (250k)"] },
  { body: "BVMI (DE)",          levels: ["Gold (100k)", "Platinum (200k)", "Diamond (1M)"] },
  { body: "MUSO.AI / Custom",   levels: ["Custom"] },
];

const blankEntry = (): ChartEntry => ({
  id: crypto.randomUUID(),
  artistName: "",
  workTitle: "",
  workType: "Single",
  chart: "Spotify Top 200 — South Africa",
  position: 0,
  weekDate: new Date().toISOString().slice(0, 10),
  source: "",
  prevPosition: null,
  isPeak: false,
  notes: "",
});

const blankCert = (): CertificationEntry => ({
  id: crypto.randomUUID(),
  artistName: "",
  workTitle: "",
  body: "RiSA (SA)",
  level: "Gold (15k)",
  dateAwarded: new Date().toISOString().slice(0, 10),
  units: "",
  notes: "",
});

export default function ChartPerformancePage() {
  const [entries, setEntries] = useLocalState<ChartEntry[]>("roster_chart_entries_v1", []);
  useToolRestore("chart-performance", "roster_chart_entries_v1", setEntries);
  const [certs, setCerts] = useLocalState<CertificationEntry[]>("roster_chart_certs_v1", []);

  const summary = useMemo(() => {
    const peaks = entries.filter((e) => e.isPeak).length;
    const top10s = entries.filter((e) => e.position > 0 && e.position <= 10).length;
    const charted = entries.length;
    const certifications = certs.length;
    return { peaks, top10s, charted, certifications };
  }, [entries, certs]);

  function addEntry() { setEntries((p) => [blankEntry(), ...p]); }
  function removeEntry(id: string) { if (!confirm("Delete this chart entry?")) return; setEntries((p) => p.filter((e) => e.id !== id)); }
  function updateEntry(id: string, patch: Partial<ChartEntry>) { setEntries((p) => p.map((e) => (e.id === id ? { ...e, ...patch } : e))); }

  function addCert() { setCerts((p) => [blankCert(), ...p]); }
  function removeCert(id: string) { if (!confirm("Delete this certification?")) return; setCerts((p) => p.filter((c) => c.id !== id)); }
  function updateCert(id: string, patch: Partial<CertificationEntry>) {
    setCerts((p) =>
      p.map((c) => {
        if (c.id !== id) return c;
        const next = { ...c, ...patch };
        // When body changes, default level to first option of that body
        if (patch.body !== undefined) {
          const found = CERT_BODIES.find((b) => b.body === patch.body);
          if (found) next.level = found.levels[0];
        }
        return next;
      }),
    );
  }

  return (
    <ResourcePage
      parentHref="/dashboard/library/startup"
      parentLabel="Back to Onboarding"
      color={COLOR}
      tag="Onboarding · Chart Performance"
      title="Chart-Performance Tracker"
      intro="Manual entry layer for chart positions and certifications across every chart that matters — Spotify, Apple, Boomplay, Audiomack, RiSA / RIAA / BPI Gold/Plat/Diamond. Pair with the Goal-Setter to set chart-position targets."
      toolbar={<><SaveButton toolSlug="chart-performance" storageKey={"roster_chart_entries_v1"} title={`Chart Performance — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
          
        <>
          <button onClick={addEntry} className="text-sm font-semibold inline-flex items-center gap-1.5 px-4 py-2 rounded-lg" style={{ backgroundColor: COLOR, color: "white" }}>
            <Plus size={14} /> Chart entry
          </button>
          <button onClick={addCert} className="text-sm font-semibold inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border text-text-primary hover:bg-surface-2">
            <Award size={14} /> Add cert
          </button>
        </>
            </>
      }
    >
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <SummaryStat label="Chart entries"   value={summary.charted.toString()}      color={COLOR} />
        <SummaryStat label="Top 10 weeks"    value={summary.top10s.toString()}        color="#10B981" />
        <SummaryStat label="Peak positions"  value={summary.peaks.toString()}         color="#F59E0B" />
        <SummaryStat label="Certifications"  value={summary.certifications.toString()} color="#8B5CF6" />
      </div>

      {/* Chart positions */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 size={16} style={{ color: COLOR }} />
          <p className="font-bold text-text-primary text-sm">Chart positions ({entries.length})</p>
        </div>

        {entries.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <p className="text-sm text-text-muted">No chart entries yet. Add one when an artist enters a chart.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((e) => {
              const movement = e.prevPosition != null && e.position > 0 ? e.prevPosition - e.position : null;
              return (
                <div key={e.id} className="glass-card rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${COLOR}15` }}>
                        <span className="text-base font-black" style={{ color: COLOR }}>#{e.position || "—"}</span>
                      </div>
                      <div>
                        <p className="font-bold text-sm text-text-primary">
                          {e.artistName || "(artist)"} <span className="text-text-muted font-normal">— {e.workTitle || "(work)"}</span>
                        </p>
                        <p className="text-xs text-text-muted mt-0.5">
                          {e.chart} · week of {e.weekDate}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {movement !== null && (
                        movement > 0
                          ? <span className="inline-flex items-center gap-0.5 text-emerald-400 text-xs font-semibold"><TrendingUp size={12} />+{movement}</span>
                          : movement < 0
                            ? <span className="inline-flex items-center gap-0.5 text-red-400 text-xs font-semibold"><TrendingDown size={12} />{movement}</span>
                            : <span className="inline-flex items-center gap-0.5 text-text-muted text-xs"><Minus size={12} /></span>
                      )}
                      {e.isPeak && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded" style={{ color: "#F59E0B", backgroundColor: "#F59E0B15" }}>Peak</span>
                      )}
                      <button onClick={() => removeEntry(e.id)} className="text-xs text-red-400 hover:text-red-300 inline-flex items-center gap-1">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div><label className={labelClass}>Artist</label><input className={inputClass} value={e.artistName} onChange={(ev) => updateEntry(e.id, { artistName: ev.target.value })} /></div>
                    <div><label className={labelClass}>Work title</label><input className={inputClass} value={e.workTitle} onChange={(ev) => updateEntry(e.id, { workTitle: ev.target.value })} /></div>
                    <div>
                      <label className={labelClass}>Type</label>
                      <select className={inputClass} value={e.workType} onChange={(ev) => updateEntry(e.id, { workType: ev.target.value as ChartEntry["workType"] })}>
                        <option>Single</option><option>EP</option><option>Album</option><option>Mixtape</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelClass}>Chart</label>
                      <select className={inputClass} value={e.chart} onChange={(ev) => updateEntry(e.id, { chart: ev.target.value })}>
                        {CHART_PRESETS.map((c) => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div><label className={labelClass}>Week date</label><input type="date" className={inputClass} value={e.weekDate} onChange={(ev) => updateEntry(e.id, { weekDate: ev.target.value })} /></div>
                    <div><label className={labelClass}>Position</label><input type="number" min={1} className={inputClass} value={e.position || ""} onChange={(ev) => updateEntry(e.id, { position: Number(ev.target.value) || 0 })} /></div>
                    <div><label className={labelClass}>Previous week</label><input type="number" min={1} className={inputClass} value={e.prevPosition ?? ""} onChange={(ev) => updateEntry(e.id, { prevPosition: ev.target.value ? Number(ev.target.value) : null })} /></div>
                    <div>
                      <label className={labelClass}>Is peak?</label>
                      <select className={inputClass} value={e.isPeak ? "yes" : "no"} onChange={(ev) => updateEntry(e.id, { isPeak: ev.target.value === "yes" })}>
                        <option value="no">No</option><option value="yes">Yes — peak</option>
                      </select>
                    </div>
                    <div className="md:col-span-3"><label className={labelClass}>Source link / screenshot ref</label><input className={inputClass} value={e.source} onChange={(ev) => updateEntry(e.id, { source: ev.target.value })} placeholder="https://… or screenshot filename" /></div>
                    <div className="md:col-span-3"><label className={labelClass}>Notes</label><input className={inputClass} value={e.notes} onChange={(ev) => updateEntry(e.id, { notes: ev.target.value })} placeholder="Context — release week, sync placement, push, etc." /></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Certifications */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Award size={16} style={{ color: "#8B5CF6" }} />
          <p className="font-bold text-text-primary text-sm">Certifications ({certs.length})</p>
        </div>

        {certs.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <p className="text-sm text-text-muted">No certifications yet. Add Gold / Platinum / Diamond awards as they come in.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {certs.map((c) => {
              const bodyConfig = CERT_BODIES.find((b) => b.body === c.body);
              return (
                <div key={c.id} className="glass-card rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#8B5CF615" }}>
                        <Award size={18} style={{ color: "#8B5CF6" }} />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-text-primary">
                          {c.artistName || "(artist)"} — {c.workTitle || "(work)"}
                        </p>
                        <p className="text-xs text-text-muted mt-0.5">
                          {c.body} · {c.level} · awarded {c.dateAwarded}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => removeCert(c.id)} className="text-xs text-red-400 hover:text-red-300 inline-flex items-center gap-1">
                      <Trash2 size={12} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div><label className={labelClass}>Artist</label><input className={inputClass} value={c.artistName} onChange={(ev) => updateCert(c.id, { artistName: ev.target.value })} /></div>
                    <div><label className={labelClass}>Work title</label><input className={inputClass} value={c.workTitle} onChange={(ev) => updateCert(c.id, { workTitle: ev.target.value })} /></div>
                    <div>
                      <label className={labelClass}>Certifying body</label>
                      <select className={inputClass} value={c.body} onChange={(ev) => updateCert(c.id, { body: ev.target.value })}>
                        {CERT_BODIES.map((b) => <option key={b.body}>{b.body}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Level</label>
                      <select className={inputClass} value={c.level} onChange={(ev) => updateCert(c.id, { level: ev.target.value })}>
                        {(bodyConfig?.levels ?? ["Custom"]).map((l) => <option key={l}>{l}</option>)}
                      </select>
                    </div>
                    <div><label className={labelClass}>Date awarded</label><input type="date" className={inputClass} value={c.dateAwarded} onChange={(ev) => updateCert(c.id, { dateAwarded: ev.target.value })} /></div>
                    <div><label className={labelClass}>Units / threshold</label><input className={inputClass} value={c.units} onChange={(ev) => updateCert(c.id, { units: ev.target.value })} placeholder="e.g. 35,000 album-equivalents" /></div>
                    <div className="md:col-span-3"><label className={labelClass}>Notes</label><input className={inputClass} value={c.notes} onChange={(ev) => updateCert(c.id, { notes: ev.target.value })} placeholder="Press release URL, plaque receipt, ceremony info…" /></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div
        className="glass-card rounded-2xl p-5 flex items-start gap-3"
        style={{ borderColor: `${COLOR}25`, backgroundColor: `${COLOR}06` }}
      >
        <BarChart3 size={16} className="flex-shrink-0 mt-0.5" style={{ color: COLOR }} />
        <p className="text-xs text-text-muted leading-relaxed">
          <span className="font-semibold text-text-primary">Manual capture for now.</span> When ROSTER's connector layer expands (Apple Music for Artists, Boomplay, Mdundo), we'll auto-populate chart positions where APIs allow. For certifications, RIAA / RiSA / BPI data is mostly press-release driven and stays manual. Always keep a screenshot link or press URL with each entry — proof matters when pitching.
        </p>
      </div>
    </ResourcePage>
  );
}

function SummaryStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="glass-card rounded-xl p-4">
      <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color }}>{label}</p>
      <p className="text-2xl font-black text-text-primary">{value}</p>
    </div>
  );
}
