"use client";
import { useMemo, useState } from "react";
import { Plus, Trash2, Users, ChevronUp, ChevronDown, Minus, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { ResourcePage, inputClass, labelClass, useLocalState } from "@/components/library/module-shell";
import { SaveButton } from "@/components/ui/save-button";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";
import { ExportButton } from "@/components/ui/export-button";

const COLOR = "#C9A84C";

interface ScoreSet {
  reach: number;
  momentum: number;
  engagement: number;
}

interface CompetitorEntry {
  id: string;
  name: string;
  notes: string;
  scores: ScoreSet;
}

interface CompetitorSet {
  id: string;
  artistName: string;
  artistScores: ScoreSet;
  competitors: CompetitorEntry[];
  lastUpdated: string;
}

const blankSet = (): CompetitorSet => ({
  id: crypto.randomUUID(),
  artistName: "",
  artistScores: { reach: 0, momentum: 0, engagement: 0 },
  competitors: [],
  lastUpdated: new Date().toISOString().slice(0, 10),
});

const blankCompetitor = (): CompetitorEntry => ({
  id: crypto.randomUUID(),
  name: "",
  notes: "",
  scores: { reach: 0, momentum: 0, engagement: 0 },
});

function compositeScore(s: ScoreSet): number {
  // Reach 40% / Momentum 35% / Engagement 25% — matches scoring engine weighting pattern
  return Math.round(s.reach * 0.4 + s.momentum * 0.35 + s.engagement * 0.25);
}

type PullStatus = "idle" | "loading" | "success" | "error";

interface PullState {
  status: PullStatus;
  message?: string;
  pulledAt?: string;
}

export default function CompetitorSetPage() {
  const handleExportPDF = () => { window.print(); };
  const [sets, setSets] = useLocalState<CompetitorSet[]>("roster_competitor_sets_v1", []);
  useToolRestore<CompetitorSet[]>("competitor-set", "roster_competitor_sets_v1", setSets);
  const [pullStates, setPullStates] = useState<Record<string, PullState>>({});

  async function pullCompetitorData(setId: string, compId: string, name: string) {
    if (!name.trim()) return;
    const key = `${setId}:${compId}`;
    setPullStates((prev) => ({ ...prev, [key]: { status: "loading" } }));

    try {
      const res = await fetch("/api/competitor/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const json = await res.json() as {
        scores?: { reach: number; engagement: number; momentum: number; platformCount: number };
        error?: string;
        pulledAt?: string;
      };

      if (!res.ok || json.error) {
        setPullStates((prev) => ({
          ...prev,
          [key]: { status: "error", message: json.error ?? "Lookup failed" },
        }));
        return;
      }

      if (json.scores) {
        updateCompetitorScore(setId, compId, "reach", json.scores.reach);
        updateCompetitorScore(setId, compId, "momentum", json.scores.momentum);
        updateCompetitorScore(setId, compId, "engagement", json.scores.engagement);
      }

      setPullStates((prev) => ({
        ...prev,
        [key]: {
          status: "success",
          pulledAt: json.pulledAt ? new Date(json.pulledAt).toLocaleTimeString() : "just now",
        },
      }));
    } catch {
      setPullStates((prev) => ({
        ...prev,
        [key]: { status: "error", message: "Network error" },
      }));
    }
  }

  function addSet() {
    setSets((prev) => [blankSet(), ...prev]);
  }

  function removeSet(id: string) {
    if (!confirm("Delete this competitor set?")) return;
    setSets((prev) => prev.filter((s) => s.id !== id));
  }

  function updateSet(id: string, patch: Partial<CompetitorSet>) {
    setSets((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch, lastUpdated: new Date().toISOString().slice(0, 10) } : s)));
  }

  function updateArtistScore(setId: string, key: keyof ScoreSet, value: number) {
    setSets((prev) =>
      prev.map((s) =>
        s.id === setId
          ? { ...s, artistScores: { ...s.artistScores, [key]: value }, lastUpdated: new Date().toISOString().slice(0, 10) }
          : s,
      ),
    );
  }

  function addCompetitor(setId: string) {
    setSets((prev) =>
      prev.map((s) =>
        s.id === setId ? { ...s, competitors: [...s.competitors, blankCompetitor()] } : s,
      ),
    );
  }

  function removeCompetitor(setId: string, compId: string) {
    setSets((prev) =>
      prev.map((s) =>
        s.id === setId ? { ...s, competitors: s.competitors.filter((c) => c.id !== compId) } : s,
      ),
    );
  }

  function updateCompetitor(setId: string, compId: string, patch: Partial<CompetitorEntry>) {
    setSets((prev) =>
      prev.map((s) =>
        s.id === setId
          ? { ...s, competitors: s.competitors.map((c) => (c.id === compId ? { ...c, ...patch } : c)) }
          : s,
      ),
    );
  }

  function updateCompetitorScore(setId: string, compId: string, key: keyof ScoreSet, value: number) {
    setSets((prev) =>
      prev.map((s) =>
        s.id === setId
          ? {
              ...s,
              competitors: s.competitors.map((c) =>
                c.id === compId ? { ...c, scores: { ...c.scores, [key]: value } } : c,
              ),
            }
          : s,
      ),
    );
  }

  return (
    <ResourcePage
      parentHref="/dashboard/library/startup"
      parentLabel="Back to Onboarding"
      color={COLOR}
      tag="Onboarding · Competitor Set"
      title="Competitor Set Tracker"
      intro="Define a 3–5 artist comparator set per artist. Track Reach / Momentum / Engagement side-by-side to identify where you're leading, lagging, and what to learn from each. Update monthly."
      toolbar={
        <button
          onClick={addSet}
          className="text-sm font-semibold inline-flex items-center gap-1.5 px-4 py-2 rounded-lg"
          style={{ backgroundColor: COLOR, color: "white" }}
        >
      <div className="flex items-center gap-2 mb-4">
        <SaveButton toolSlug="competitor-set" storageKey="roster_competitor_sets_v1" title={`Competitor Set — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
            <ExportButton onPDF={handleExportPDF} />
      </div>
          <Plus size={14} /> New artist set
        </button>
      }
      next={{ href: "/dashboard/library/startup/chart-performance", label: "Chart Performance Tracker" }}
    >
      {sets.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Users size={28} className="mx-auto mb-3 opacity-40" style={{ color: COLOR }} />
          <p className="font-bold text-text-primary mb-1">No competitor sets yet</p>
          <p className="text-sm text-text-muted mb-4">Create a set per artist on your roster — typically 3–5 comparators.</p>
          <button
            onClick={addSet}
            className="text-sm font-semibold inline-flex items-center gap-1.5 px-4 py-2 rounded-lg"
            style={{ backgroundColor: COLOR, color: "white" }}
          >
            <Plus size={14} /> Create first set
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {sets.map((s) => {
            const allScores = [
              { name: s.artistName || "(your artist)", composite: compositeScore(s.artistScores), scores: s.artistScores, isArtist: true, id: "self" },
              ...s.competitors.map((c) => ({ name: c.name || "(unnamed)", composite: compositeScore(c.scores), scores: c.scores, isArtist: false, id: c.id })),
            ];
            const sorted = [...allScores].sort((a, b) => b.composite - a.composite);
            const artistRank = sorted.findIndex((x) => x.isArtist) + 1;

            return (
              <div key={s.id} className="glass-card rounded-2xl p-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
                  <div className="flex-1 min-w-0">
                    <input
                      className={`${inputClass} text-base font-bold`}
                      value={s.artistName}
                      onChange={(e) => updateSet(s.id, { artistName: e.target.value })}
                      placeholder="Artist name"
                    />
                    <p className="text-xs text-text-muted mt-1">
                      Last updated {s.lastUpdated} · {s.competitors.length} {s.competitors.length === 1 ? "competitor" : "competitors"}
                      {s.competitors.length > 0 && (
                        <> · Rank in set: <span className="font-bold text-text-primary">#{artistRank} of {sorted.length}</span></>
                      )}
                    </p>
                  </div>
                  <button onClick={() => removeSet(s.id)} className="text-xs text-red-400 hover:text-red-300 inline-flex items-center gap-1">
                    <Trash2 size={12} /> Delete set
                  </button>
                </div>

                {/* Score input row — artist */}
                <div className="bg-surface-2 rounded-xl p-4 mb-4">
                  <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: COLOR }}>{s.artistName || "Your artist"} — current scores (0–100)</p>
                  <div className="grid grid-cols-3 gap-3">
                    <ScoreInput label="Reach" value={s.artistScores.reach} onChange={(v) => updateArtistScore(s.id, "reach", v)} />
                    <ScoreInput label="Momentum" value={s.artistScores.momentum} onChange={(v) => updateArtistScore(s.id, "momentum", v)} />
                    <ScoreInput label="Engagement" value={s.artistScores.engagement} onChange={(v) => updateArtistScore(s.id, "engagement", v)} />
                  </div>
                </div>

                {/* Competitors */}
                {s.competitors.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {s.competitors.map((c) => {
                      const key = `${s.id}:${c.id}`;
                      const pull = pullStates[key] ?? { status: "idle" };
                      const isLoading = pull.status === "loading";
                      return (
                        <div key={c.id} className="border border-border rounded-xl p-4">
                          {/* Name row + pull + delete */}
                          <div className="flex items-start gap-2 flex-wrap mb-3">
                            <input
                              className={`${inputClass} flex-1 min-w-[160px]`}
                              value={c.name}
                              onChange={(e) => updateCompetitor(s.id, c.id, { name: e.target.value })}
                              placeholder="Competitor artist"
                            />
                            {/* Pull data button */}
                            <button
                              onClick={() => pullCompetitorData(s.id, c.id, c.name)}
                              disabled={isLoading || !c.name.trim()}
                              title={c.name.trim() ? "Pull live scores from Spotify & YouTube" : "Enter artist name first"}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-semibold text-text-primary hover:bg-surface-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                              style={pull.status === "success" ? { borderColor: "#34D39966", color: "#34D399" } : undefined}
                            >
                              {isLoading ? (
                                <RefreshCw size={12} className="animate-spin" />
                              ) : pull.status === "success" ? (
                                <CheckCircle2 size={12} />
                              ) : pull.status === "error" ? (
                                <AlertCircle size={12} className="text-rose-400" />
                              ) : (
                                <RefreshCw size={12} />
                              )}
                              <span className="hidden sm:inline">
                                {isLoading ? "Pulling…" : pull.status === "success" ? "Updated" : "Pull data"}
                              </span>
                            </button>
                            <button
                              onClick={() => removeCompetitor(s.id, c.id)}
                              className="text-xs text-red-400 hover:text-red-300 inline-flex items-center gap-1 flex-shrink-0"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>

                          {/* Pull status line */}
                          {pull.status === "success" && pull.pulledAt && (
                            <p className="text-[10px] text-emerald-400/70 mb-2">
                              ✓ Scores pulled from Spotify & YouTube at {pull.pulledAt}. Edit manually if needed.
                            </p>
                          )}
                          {pull.status === "error" && pull.message && (
                            <p className="text-[10px] text-rose-400/80 mb-2">
                              ⚠ {pull.message}
                            </p>
                          )}

                          {/* Score inputs — auto-filled by pull, still editable */}
                          <div className="grid grid-cols-3 gap-3 mb-2">
                            <ScoreInput label="Reach" value={c.scores.reach} onChange={(v) => updateCompetitorScore(s.id, c.id, "reach", v)} />
                            <ScoreInput label="Momentum" value={c.scores.momentum} onChange={(v) => updateCompetitorScore(s.id, c.id, "momentum", v)} />
                            <ScoreInput label="Engagement" value={c.scores.engagement} onChange={(v) => updateCompetitorScore(s.id, c.id, "engagement", v)} />
                          </div>
                          <input
                            className={inputClass}
                            value={c.notes}
                            onChange={(e) => updateCompetitor(s.id, c.id, { notes: e.target.value })}
                            placeholder="What can we learn from this artist? Visual style, drop cadence, fan engagement…"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}

                <button
                  onClick={() => addCompetitor(s.id)}
                  className="text-xs font-semibold inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-text-primary hover:bg-surface-2 mb-4"
                >
                  <Plus size={12} /> Add competitor
                </button>

                {/* Side-by-side comparison */}
                {s.competitors.length > 0 && (
                  <div className="bg-surface-2 rounded-xl overflow-hidden">
                    <div className="p-3 border-b border-border">
                      <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: COLOR }}>Side-by-side comparison</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-[10px] uppercase font-black text-text-muted">
                            <th className="text-left p-3">Rank</th>
                            <th className="text-left p-3">Artist</th>
                            <th className="text-right p-3">Reach</th>
                            <th className="text-right p-3">Momentum</th>
                            <th className="text-right p-3">Engagement</th>
                            <th className="text-right p-3">Composite</th>
                            <th className="text-right p-3">vs You</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sorted.map((row, i) => {
                            const youComp = compositeScore(s.artistScores);
                            const delta = row.composite - youComp;
                            return (
                              <tr key={row.id} className={`border-t border-border ${row.isArtist ? "bg-surface-3" : ""}`}>
                                <td className="p-3 font-bold text-text-primary">#{i + 1}</td>
                                <td className="p-3 text-text-primary">
                                  {row.name}
                                  {row.isArtist && <span className="text-[10px] font-black uppercase ml-2 px-1.5 py-0.5 rounded" style={{ color: COLOR, backgroundColor: `${COLOR}15` }}>You</span>}
                                </td>
                                <td className="p-3 text-right tabular-nums text-text-primary">{row.scores.reach}</td>
                                <td className="p-3 text-right tabular-nums text-text-primary">{row.scores.momentum}</td>
                                <td className="p-3 text-right tabular-nums text-text-primary">{row.scores.engagement}</td>
                                <td className="p-3 text-right tabular-nums font-bold text-text-primary">{row.composite}</td>
                                <td className="p-3 text-right tabular-nums">
                                  {row.isArtist ? (
                                    <span className="text-text-muted">—</span>
                                  ) : delta > 0 ? (
                                    <span className="inline-flex items-center gap-0.5 text-amber-400 font-semibold"><ChevronUp size={12} />+{delta}</span>
                                  ) : delta < 0 ? (
                                    <span className="inline-flex items-center gap-0.5 text-emerald-400 font-semibold"><ChevronDown size={12} />{delta}</span>
                                  ) : (
                                    <span className="inline-flex items-center gap-0.5 text-text-muted"><Minus size={12} />0</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div
        className="glass-card rounded-2xl p-5 mt-6 flex items-start gap-3"
        style={{ borderColor: `${COLOR}25`, backgroundColor: `${COLOR}06` }}
      >
        <Users size={16} className="flex-shrink-0 mt-0.5" style={{ color: COLOR }} />
        <p className="text-xs text-text-muted leading-relaxed">
          <span className="font-semibold text-text-primary">Composite scoring.</span> Each artist's composite = Reach×40% + Momentum×35% + Engagement×25%. Hit <span className="font-semibold text-text-primary">Pull data</span> on any competitor row to auto-fill scores live from Spotify & YouTube. Scores are editable after pulling. Pull monthly to track Momentum. The amber arrow means the competitor is ahead of you on that metric — a learning signal, not a panic signal.
        </p>
      </div>
    </ResourcePage>
  );
}

function ScoreInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <input
        type="number"
        min={0}
        max={100}
        className={inputClass}
        value={value || ""}
        onChange={(e) => {
          const n = Math.max(0, Math.min(100, Number(e.target.value) || 0));
          onChange(n);
        }}
      />
    </div>
  );
}
