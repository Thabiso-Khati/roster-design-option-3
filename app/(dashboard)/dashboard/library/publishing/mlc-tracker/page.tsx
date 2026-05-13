"use client";
import { Plus, Trash2 } from "lucide-react";
import { ResourcePage, inputClass, labelClass, useLocalState } from "@/components/library/module-shell";
import { SaveButton } from "@/components/ui/save-button";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";

const COLOR = "#06B6D4";
const STORAGE_KEY = "roster_mlc_tracker_v1";

interface Work {
  id: string;
  title: string;
  iswc: string;
  writers: string;
  publisher: string;
  ipiPublisher: string;
  ipiWriter: string;
  mlcRegistered: "Yes" | "No" | "In progress";
  mlcWorkId: string;
  hfaRegistered: "Yes" | "No" | "Not applicable";
  hfaSongCode: string;
  notes: string;
}

const newWork = (): Work => ({
  id: Math.random().toString(36).slice(2, 8),
  title: "", iswc: "", writers: "", publisher: "",
  ipiPublisher: "", ipiWriter: "",
  mlcRegistered: "No", mlcWorkId: "",
  hfaRegistered: "No", hfaSongCode: "", notes: "",
});

export default function MLCTrackerPage() {
  const [works, setWorks] = useLocalState<Work[]>(STORAGE_KEY, []);
  useToolRestore("mlc-tracker", STORAGE_KEY, setWorks);
  const update = (id: string, patch: Partial<Work>) =>
    setWorks(works.map((w) => (w.id === id ? { ...w, ...patch } : w)));
  const remove = (id: string) => setWorks(works.filter((w) => w.id !== id));

  const stats = {
    mlcActive: works.filter((w) => w.mlcRegistered === "Yes").length,
    mlcPending: works.filter((w) => w.mlcRegistered === "In progress").length,
    mlcMissing: works.filter((w) => w.mlcRegistered === "No").length,
  };

  return (
    <ResourcePage
      parentHref="/dashboard/library/publishing"
      parentLabel="Back to Publishing"
      color={COLOR}
      tag="Publishing · Tracker"
      title="MLC Registration Tracker"
      intro="The Mechanical Licensing Collective (MLC) — the US body that pays mechanical royalties from streaming services on behalf of writers and publishers. Register every work or you forfeit US streaming mechanicals (a chunk of every African artist's catalogue earnings)."
      toolbar={<><SaveButton toolSlug="mlc-tracker" storageKey={STORAGE_KEY} title={`MLC Tracker — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
          
        <button onClick={() => setWorks([...works, newWork()])} className="text-xs font-semibold inline-flex items-center gap-1 px-3 py-1.5 rounded-lg" style={{ backgroundColor: `${COLOR}15`, color: COLOR }}>
          <Plus size={13}/> Add work
        </button>
            </>
      }
      next={{ href: "/dashboard/library/publishing/soundexchange-guide", label: "SoundExchange Guide" }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="glass-card rounded-xl p-4 text-center" style={{ borderColor: "#10B98140" }}>
          <p className="text-xs text-text-muted mb-1">MLC active</p>
          <p className="font-black text-xl" style={{ color: "#10B981" }}>{stats.mlcActive}</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center" style={{ borderColor: "#F59E0B40" }}>
          <p className="text-xs text-text-muted mb-1">In progress</p>
          <p className="font-black text-xl" style={{ color: "#F59E0B" }}>{stats.mlcPending}</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center" style={{ borderColor: "#EF444440" }}>
          <p className="text-xs text-text-muted mb-1">Not registered</p>
          <p className="font-black text-xl" style={{ color: "#EF4444" }}>{stats.mlcMissing}</p>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5 mb-6 flex items-start gap-3" style={{ borderColor: `${COLOR}20`, backgroundColor: `${COLOR}08` }}>
        <p className="text-xs text-text-muted leading-relaxed">
          <span className="font-semibold text-text-primary">Why this matters.</span> The MLC sits between US DSPs (Spotify, Apple, Amazon, YouTube) and writers / publishers. If your works aren't registered, your share of US streaming mechanical royalties either flows to a US co-writer's publisher or goes into the unmatched pool. Register at <a href="https://www.themlc.com" className="font-semibold" style={{ color: COLOR }}>themlc.com</a> — free for writers and publishers worldwide. HFA (Harry Fox Agency) overlap covers older deals.
        </p>
      </div>

      {works.length === 0 && (
        <div className="glass-card rounded-2xl p-12 text-center text-text-muted text-sm">No works tracked yet.</div>
      )}

      <div className="space-y-3">
        {works.map((w) => (
          <div key={w.id} className="glass-card rounded-2xl p-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
              <div className="col-span-2 sm:col-span-3"><label className={labelClass}>Composition title</label><input className={inputClass} value={w.title} onChange={(e) => update(w.id, { title: e.target.value })}/></div>
              <div><label className={labelClass}>ISWC</label><input className={inputClass} value={w.iswc} onChange={(e) => update(w.id, { iswc: e.target.value })} placeholder="T-000.000.001-0"/></div>
              <div className="col-span-2"><label className={labelClass}>Writers (with %)</label><input className={inputClass} value={w.writers} onChange={(e) => update(w.id, { writers: e.target.value })} placeholder="A. Maaka 50% / B. Soko 50%"/></div>
              <div><label className={labelClass}>Publisher</label><input className={inputClass} value={w.publisher} onChange={(e) => update(w.id, { publisher: e.target.value })}/></div>
              <div><label className={labelClass}>IPI publisher</label><input className={inputClass} value={w.ipiPublisher} onChange={(e) => update(w.id, { ipiPublisher: e.target.value })}/></div>
              <div><label className={labelClass}>IPI writer (lead)</label><input className={inputClass} value={w.ipiWriter} onChange={(e) => update(w.id, { ipiWriter: e.target.value })}/></div>
              <div><label className={labelClass}>MLC registered</label><select className={inputClass} value={w.mlcRegistered} onChange={(e) => update(w.id, { mlcRegistered: e.target.value as Work["mlcRegistered"] })}><option>No</option><option>In progress</option><option>Yes</option></select></div>
              <div><label className={labelClass}>MLC Work ID</label><input className={inputClass} value={w.mlcWorkId} onChange={(e) => update(w.id, { mlcWorkId: e.target.value })} placeholder="Once activated"/></div>
              <div><label className={labelClass}>HFA registered</label><select className={inputClass} value={w.hfaRegistered} onChange={(e) => update(w.id, { hfaRegistered: e.target.value as Work["hfaRegistered"] })}><option>No</option><option>Yes</option><option>Not applicable</option></select></div>
              <div><label className={labelClass}>HFA Song Code</label><input className={inputClass} value={w.hfaSongCode} onChange={(e) => update(w.id, { hfaSongCode: e.target.value })}/></div>
              <div className="col-span-2 sm:col-span-3">
                <label className={labelClass}>Notes</label>
                <textarea className={inputClass} rows={2} value={w.notes} onChange={(e) => update(w.id, { notes: e.target.value })} placeholder="Last royalty receipt date, disputes, sub-publishing"/>
              </div>
            </div>
            <button onClick={() => remove(w.id)} className="text-xs text-red-400 hover:text-red-300 inline-flex items-center gap-1"><Trash2 size={11}/> Remove</button>
          </div>
        ))}
      </div>
    </ResourcePage>
  );
}
