"use client";
import { Plus, Trash2 } from "lucide-react";
import { ResourcePage, inputClass, labelClass, useLocalState } from "@/components/library/module-shell";
import { SaveButton } from "@/components/ui/save-button";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";

const COLOR = "#0EA5E9";
const STORAGE_KEY = "roster_pitch_audit_v1";

interface PlatformResult {
  id: string;
  platform: string;
  pitched: "Yes" | "No";
  added: "Yes" | "No" | "Pending";
  playlist: string;
  followers: number;
  initialStreams: number;
  notes: string;
}

const newResult = (): PlatformResult => ({
  id: Math.random().toString(36).slice(2, 8),
  platform: "Spotify Editorial", pitched: "Yes", added: "No", playlist: "", followers: 0, initialStreams: 0, notes: "",
});

interface State {
  releaseTitle: string;
  releaseDate: string;
  artist: string;
  isrc: string;
  results: PlatformResult[];
}

const empty: State = { releaseTitle: "", releaseDate: "", artist: "", isrc: "", results: [] };

const PLATFORMS = [
  "Spotify Editorial", "Spotify Algorithmic (Discover Weekly / Release Radar)", "Spotify Marquee",
  "Apple Music Editorial", "Apple Music Algorithmic", "Audiomack Editorial", "Audiomack Trending",
  "Boomplay Editorial", "Boomplay Charts", "Deezer Editorial", "Tidal Rising", "Mdundo Editorial",
  "Anghami Editorial", "YouTube Music", "YouTube Algo / Suggested",
];

export default function PitchAuditPage() {
  const [s, setS] = useLocalState<State>(STORAGE_KEY, empty);
  useToolRestore("pitch-audit", STORAGE_KEY, setS);
  const update = (id: string, patch: Partial<PlatformResult>) =>
    setS({ ...s, results: s.results.map((r) => (r.id === id ? { ...r, ...patch } : r)) });
  const remove = (id: string) => setS({ ...s, results: s.results.filter((r) => r.id !== id) });
  const add = () => setS({ ...s, results: [...s.results, newResult()] });

  const totals = s.results.reduce(
    (acc, r) => ({
      pitched: acc.pitched + (r.pitched === "Yes" ? 1 : 0),
      added: acc.added + (r.added === "Yes" ? 1 : 0),
      streams: acc.streams + r.initialStreams,
      followers: acc.followers + r.followers,
    }),
    { pitched: 0, added: 0, streams: 0, followers: 0 }
  );

  const conversion = totals.pitched > 0 ? Math.round((totals.added / totals.pitched) * 100) : 0;

  return (
    <ResourcePage
      parentHref="/dashboard/library/distribution"
      parentLabel="Back to Distribution"
      color={COLOR}
      tag="Distribution · Audit"
      title="Pitch Audit Report (post-release)"
      intro="Did the release land? Audit your pitches against actual placements 14–28 days post-release. Closes the loop on DSP Pitching tracker."
      toolbar={<><SaveButton toolSlug="pitch-audit" storageKey={STORAGE_KEY} title={`Pitch Audit — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
          
        <button onClick={add} className="text-xs font-semibold inline-flex items-center gap-1 px-3 py-1.5 rounded-lg" style={{ backgroundColor: `${COLOR}15`, color: COLOR }}>
          <Plus size={13}/> Add platform
        </button>
            </>
      }
    >
      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Release</p>
        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelClass}>Release title</label><input className={inputClass} value={s.releaseTitle} onChange={(e) => setS({ ...s, releaseTitle: e.target.value })}/></div>
          <div><label className={labelClass}>Artist</label><input className={inputClass} value={s.artist} onChange={(e) => setS({ ...s, artist: e.target.value })}/></div>
          <div><label className={labelClass}>Release date</label><input type="date" className={inputClass} value={s.releaseDate} onChange={(e) => setS({ ...s, releaseDate: e.target.value })}/></div>
          <div><label className={labelClass}>ISRC</label><input className={inputClass} value={s.isrc} onChange={(e) => setS({ ...s, isrc: e.target.value })}/></div>
        </div>
      </section>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="glass-card rounded-xl p-4 text-center"><p className="text-xs text-text-muted mb-1">Pitched</p><p className="font-bold text-text-primary">{totals.pitched}</p></div>
        <div className="glass-card rounded-xl p-4 text-center"><p className="text-xs text-text-muted mb-1">Landed</p><p className="font-bold" style={{ color: COLOR }}>{totals.added}</p></div>
        <div className="glass-card rounded-xl p-4 text-center" style={{ borderColor: `${COLOR}40` }}><p className="text-xs text-text-muted mb-1">Conversion</p><p className="font-black text-xl" style={{ color: COLOR }}>{conversion}%</p></div>
        <div className="glass-card rounded-xl p-4 text-center"><p className="text-xs text-text-muted mb-1">First-week streams</p><p className="font-bold text-text-primary">{totals.streams.toLocaleString()}</p></div>
      </div>

      {s.results.length === 0 && <div className="glass-card rounded-2xl p-12 text-center text-text-muted text-sm">No platforms tracked. Click <span className="font-semibold text-brand">Add platform</span> per editorial / algorithmic surface.</div>}

      <div className="space-y-3">
        {s.results.map((r) => (
          <div key={r.id} className="glass-card rounded-2xl p-4">
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mb-2">
              <div className="col-span-2"><label className={labelClass}>Platform</label><select className={inputClass} value={r.platform} onChange={(e) => update(r.id, { platform: e.target.value })}>{PLATFORMS.map((p) => <option key={p}>{p}</option>)}</select></div>
              <div><label className={labelClass}>Pitched</label><select className={inputClass} value={r.pitched} onChange={(e) => update(r.id, { pitched: e.target.value as PlatformResult["pitched"] })}><option>Yes</option><option>No</option></select></div>
              <div><label className={labelClass}>Added</label><select className={inputClass} value={r.added} onChange={(e) => update(r.id, { added: e.target.value as PlatformResult["added"] })}><option>No</option><option>Pending</option><option>Yes</option></select></div>
              <div><label className={labelClass}>Playlist name</label><input className={inputClass} value={r.playlist} onChange={(e) => update(r.id, { playlist: e.target.value })}/></div>
              <div><label className={labelClass}>Followers / size</label><input type="number" className={inputClass} value={r.followers} onChange={(e) => update(r.id, { followers: Number(e.target.value) || 0 })}/></div>
              <div><label className={labelClass}>1st-week streams from this surface</label><input type="number" className={inputClass} value={r.initialStreams} onChange={(e) => update(r.id, { initialStreams: Number(e.target.value) || 0 })}/></div>
              <div className="col-span-2 sm:col-span-5">
                <label className={labelClass}>Notes</label>
                <textarea className={inputClass} rows={2} value={r.notes} onChange={(e) => update(r.id, { notes: e.target.value })} placeholder="Why landed / why missed / curator feedback / re-pitch plan"/>
              </div>
            </div>
            <button onClick={() => remove(r.id)} className="text-xs text-red-400 hover:text-red-300 inline-flex items-center gap-1"><Trash2 size={11}/> Remove</button>
          </div>
        ))}
      </div>
    </ResourcePage>
  );
}
