"use client";
import { Plus, Trash2, RotateCcw } from "lucide-react";
import { SaveButton } from "@/components/ui/save-button";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";
import {
  ResourcePage,
  inputClass,
  labelClass,
  useLocalState,
} from "@/components/library/module-shell";

const COLOR = "#22D3EE";
const STORAGE_KEY = "roster_sync_pitch_tracker_v1";

const STATUSES = ["Drafted", "Sent", "In review", "Quoted", "MFN sent", "Licensed", "Passed", "Dead"] as const;
type Status = (typeof STATUSES)[number];

interface Pitch {
  id: string;
  song: string;
  supervisor: string;
  agency: string;
  project: string;
  type: string;
  dateSent: string;
  status: Status;
  feeQuoted: string;
  notes: string;
}

const newPitch = (): Pitch => ({
  id: Math.random().toString(36).slice(2, 8),
  song: "",
  supervisor: "",
  agency: "",
  project: "",
  type: "TV episodic",
  dateSent: "",
  status: "Drafted",
  feeQuoted: "",
  notes: "",
});

const STATUS_COLOR: Record<Status, string> = {
  Drafted: "#94A3B8",
  Sent: "#3B82F6",
  "In review": "#F59E0B",
  Quoted: "#A855F7",
  "MFN sent": "#22D3EE",
  Licensed: "#10B981",
  Passed: "#64748B",
  Dead: "#EF4444",
};

export default function SyncPitchTrackerPage() {
  const [pitches, setPitches] = useLocalState<Pitch[]>(STORAGE_KEY, []);
  useToolRestore("sync-pitch-tracker", STORAGE_KEY, setPitches);
  const update = (id: string, patch: Partial<Pitch>) =>
    setPitches(pitches.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const remove = (id: string) => setPitches(pitches.filter((p) => p.id !== id));
  const stats = pitches.reduce<Record<Status, number>>(
    (acc, p) => ({ ...acc, [p.status]: (acc[p.status] || 0) + 1 }),
    {} as Record<Status, number>
  );

  return (
    <ResourcePage
      parentHref="/dashboard/library/sync"
      parentLabel="Back to Sync"
      color={COLOR}
      tag="Sync · Tracker"
      title="Sync Pitch Tracker"
      intro="Every pitch in flight, by song × music supervisor × project × status. Use this with the One-Sheet (per song) and Quote Calculator (per request)."
      toolbar={<><SaveButton toolSlug="sync-pitch-tracker" storageKey={STORAGE_KEY} title={`Sync Pitch Tracker — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
          
        <>
          <button
            onClick={() => setPitches([...pitches, newPitch()])}
            className="text-xs font-semibold inline-flex items-center gap-1 px-3 py-1.5 rounded-lg"
            style={{ backgroundColor: `${COLOR}15`, color: COLOR }}
          >
            <Plus size={13} /> Add pitch
          </button>
          <button
            onClick={() => setPitches([])}
            className="text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1"
          >
            <RotateCcw size={13} /> Clear
          </button>
        </>
            </>
      }
      next={{ href: "/dashboard/library/sync/music-supervisor-directory", label: "Music Supervisor Directory" }}
    >
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-6">
        {STATUSES.map((s) => (
          <div
            key={s}
            className="glass-card rounded-lg p-3 text-center"
            style={{ borderColor: `${STATUS_COLOR[s]}25` }}
          >
            <p className="text-xs text-text-muted mb-1">{s}</p>
            <p className="font-black text-lg" style={{ color: STATUS_COLOR[s] }}>
              {stats[s] || 0}
            </p>
          </div>
        ))}
      </div>

      {pitches.length === 0 && (
        <div className="glass-card rounded-2xl p-12 text-center text-text-muted text-sm">
          No pitches yet. Click <span className="font-semibold text-brand">Add pitch</span> to start tracking.
        </div>
      )}

      <div className="space-y-3">
        {pitches.map((p) => (
          <div key={p.id} className="glass-card rounded-2xl p-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              <div>
                <label className={labelClass}>Song</label>
                <input className={inputClass} value={p.song} onChange={(e) => update(p.id, { song: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Music Supervisor</label>
                <input className={inputClass} value={p.supervisor} onChange={(e) => update(p.id, { supervisor: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Agency / Production Co</label>
                <input className={inputClass} value={p.agency} onChange={(e) => update(p.id, { agency: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Project</label>
                <input className={inputClass} value={p.project} onChange={(e) => update(p.id, { project: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Type</label>
                <select className={inputClass} value={p.type} onChange={(e) => update(p.id, { type: e.target.value })}>
                  {["TV episodic", "TV trailer", "Film", "Film trailer", "Ad / commercial", "Game", "Trailer house", "Promo / branded"].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Date sent</label>
                <input type="date" className={inputClass} value={p.dateSent} onChange={(e) => update(p.id, { dateSent: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Status</label>
                <select
                  className={inputClass}
                  value={p.status}
                  onChange={(e) => update(p.id, { status: e.target.value as Status })}
                  style={{ borderColor: STATUS_COLOR[p.status] }}
                >
                  {STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Fee quoted</label>
                <input className={inputClass} value={p.feeQuoted} onChange={(e) => update(p.id, { feeQuoted: e.target.value })} placeholder="USD / ZAR" />
              </div>
            </div>
            <div>
              <label className={labelClass}>Notes</label>
              <textarea
                className={inputClass}
                rows={2}
                value={p.notes}
                onChange={(e) => update(p.id, { notes: e.target.value })}
                placeholder="MFN clauses, brief, follow-up date, who else is on it"
              />
            </div>
            <button
              onClick={() => remove(p.id)}
              className="text-xs text-red-400 hover:text-red-300 inline-flex items-center gap-1 mt-3"
            >
              <Trash2 size={12} /> Remove
            </button>
          </div>
        ))}
      </div>
    </ResourcePage>
  );
}
