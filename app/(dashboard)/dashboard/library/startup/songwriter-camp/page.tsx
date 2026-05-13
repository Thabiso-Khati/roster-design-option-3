"use client";
import { Plus, Trash2, Printer, RotateCcw } from "lucide-react";
import { ResourcePage, inputClass, labelClass, useLocalState } from "@/components/library/module-shell";
import { SaveButton } from "@/components/ui/save-button";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";

const COLOR = "#C9A84C";
const STORAGE_KEY = "roster_songwriter_camp_v1";

interface Writer {
  id: string;
  name: string;
  role: "Topliner" | "Producer / beatmaker" | "Co-writer / lyricist" | "Vocalist (lead)" | "Vocalist (BV)" | "A&R / curator";
  publisher: string;
  pro: string;
  ipi: string;
  rate: string;
  flightDates: string;
  status: "Invited" | "Confirmed" | "Travel booked" | "Attending" | "Cancelled";
  notes: string;
}

interface DaySchedule { id: string; day: string; theme: string; rooms: string; targetDeliverables: string; }

interface State {
  campName: string; campTheme: string;
  artist: string;
  startDate: string; endDate: string;
  location: string; studio: string;
  publisherSplitPolicy: string;
  defaultSplits: string;
  campAdvanceTotal: string;
  perWriterAdvance: string;
  hospitality: string;
  writers: Writer[];
  schedule: DaySchedule[];
  ndaInPlace: string;
  notes: string;
}

const newWriter = (): Writer => ({
  id: Math.random().toString(36).slice(2, 8),
  name: "", role: "Topliner", publisher: "", pro: "SAMRO", ipi: "", rate: "", flightDates: "", status: "Invited", notes: "",
});

const newDay = (): DaySchedule => ({
  id: Math.random().toString(36).slice(2, 8),
  day: "", theme: "", rooms: "Room A: 4 writers / Room B: 4 writers / Room C: instrumental", targetDeliverables: "Min 2 demos per room (toplines + rough mix)",
});

const empty: State = {
  campName: "", campTheme: "Amapiano-Afrobeats crossover for global TV / sync market",
  artist: "Camp commissioned by [artist / label / publisher]",
  startDate: "", endDate: "",
  location: "Cape Town", studio: "Red Bull Studios Cape Town / Match Studios Joburg / etc.",
  publisherSplitPolicy: "100% writer pool · publisher splits per Schedule (typically equal among co-writers in room unless specifically allocated)",
  defaultSplits: "Equal among all credited writers in room (4 writers = 25% each). Adjust by mutual agreement before delivery.",
  campAdvanceTotal: "", perWriterAdvance: "USD 1,500 / writer (room rate covering travel + per diem)",
  hospitality: "Daily catering, mid-tier hotel near studio, ground transport, daily per diem",
  writers: [newWriter()],
  schedule: [
    { id: "d1", day: "Day 1", theme: "Onboarding + ice-breaker session", rooms: "Mixed groups, brief topline pairings", targetDeliverables: "1 demo per room (low-pressure)" },
    { id: "d2", day: "Day 2", theme: "Rotation A — pop crossover", rooms: "Room A / Room B / Room C", targetDeliverables: "2 demos per room" },
    { id: "d3", day: "Day 3", theme: "Rotation B — sync-friendly mid-tempo", rooms: "Re-grouped", targetDeliverables: "2 demos per room" },
    { id: "d4", day: "Day 4", theme: "Rotation C — anchor singles", rooms: "Re-grouped", targetDeliverables: "2 demos per room — best of camp" },
    { id: "d5", day: "Day 5", theme: "Mix / polish + group listening session", rooms: "Engineers in", targetDeliverables: "Top 6 demos polished + delivered" },
  ],
  ndaInPlace: "Yes — every writer signs the One-Way NDA before arrival",
  notes: "Camp output goes to [pitch destination — artist's project / publisher catalogue / sync library]. Writers retain writer share; publisher share allocated per Schedule.",
};

const F = ({ label, value, onChange, rows, placeholder }: { label: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) => (
  <div>
    <label className={labelClass}>{label}</label>
    {rows ? <textarea className={inputClass} rows={rows} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
          : <input className={inputClass} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />}
  </div>
);

export default function SongwriterCampPage() {
  const [s, setS] = useLocalState<State>(STORAGE_KEY, empty);
  useToolRestore("songwriter-camp", STORAGE_KEY, setS);
  const set = (k: keyof State) => (v: string) => setS({ ...s, [k]: v });
  const updateWriter = (id: string, p: Partial<Writer>) => setS({ ...s, writers: s.writers.map((w) => (w.id === id ? { ...w, ...p } : w)) });
  const removeWriter = (id: string) => setS({ ...s, writers: s.writers.filter((w) => w.id !== id) });
  const updateDay = (id: string, p: Partial<DaySchedule>) => setS({ ...s, schedule: s.schedule.map((d) => (d.id === id ? { ...d, ...p } : d)) });
  const removeDay = (id: string) => setS({ ...s, schedule: s.schedule.filter((d) => d.id !== id) });

  return (
    <ResourcePage
      parentHref="/dashboard/library/startup"
      parentLabel="Back to Onboarding"
      color={COLOR}
      tag="A&R · Songwriter Camp"
      title="Songwriter Camp Programmer"
      intro="Plan and document a multi-day songwriter / producer camp. Schedule rooms, log writers + splits, set hospitality, NDA reminder. Pair with the One-Way NDA template before invites go out."
      toolbar={<><SaveButton toolSlug="songwriter-camp" storageKey={STORAGE_KEY} title={`Songwriter Camp — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
          
        <>
          <button onClick={() => setS(empty)} className="text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1"><RotateCcw size={13}/> Reset</button>
          <button onClick={() => window.print()} className="text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1"><Printer size={13}/> Print / PDF</button>
        </>
            </>
      }
      next={{ href: "/dashboard/library/startup/songwriter-camp-hold-letter", label: "Songwriter Camp Hold Letter" }}
    >
      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Camp identity</p>
        <div className="grid grid-cols-2 gap-4">
          <F label="Camp name" value={s.campName} onChange={set("campName")}/>
          <F label="Camp theme" value={s.campTheme} onChange={set("campTheme")}/>
          <F label="Commissioned by" value={s.artist} onChange={set("artist")}/>
          <F label="Studio" value={s.studio} onChange={set("studio")}/>
          <F label="Start date" value={s.startDate} onChange={set("startDate")}/>
          <F label="End date" value={s.endDate} onChange={set("endDate")}/>
          <F label="Location / city" value={s.location} onChange={set("location")}/>
          <F label="Hospitality" value={s.hospitality} onChange={set("hospitality")}/>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Splits & advances</p>
        <div className="space-y-4">
          <F label="Publisher split policy" value={s.publisherSplitPolicy} onChange={set("publisherSplitPolicy")} rows={2}/>
          <F label="Default writer split" value={s.defaultSplits} onChange={set("defaultSplits")} rows={2}/>
          <div className="grid grid-cols-2 gap-4">
            <F label="Camp advance total" value={s.campAdvanceTotal} onChange={set("campAdvanceTotal")}/>
            <F label="Per-writer advance" value={s.perWriterAdvance} onChange={set("perWriterAdvance")}/>
          </div>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: COLOR }}>Writers / Producers ({s.writers.length})</p>
          <button onClick={() => setS({ ...s, writers: [...s.writers, newWriter()] })} className="text-xs font-semibold inline-flex items-center gap-1" style={{ color: COLOR }}><Plus size={12}/> Add writer</button>
        </div>
        <div className="space-y-3">
          {s.writers.map((w) => (
            <div key={w.id} className="border border-border rounded-xl p-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-2">
                <div><label className={labelClass}>Name</label><input className={inputClass} value={w.name} onChange={(e) => updateWriter(w.id, { name: e.target.value })}/></div>
                <div><label className={labelClass}>Role</label><select className={inputClass} value={w.role} onChange={(e) => updateWriter(w.id, { role: e.target.value as Writer["role"] })}>{["Topliner","Producer / beatmaker","Co-writer / lyricist","Vocalist (lead)","Vocalist (BV)","A&R / curator"].map((o) => <option key={o}>{o}</option>)}</select></div>
                <div><label className={labelClass}>Publisher</label><input className={inputClass} value={w.publisher} onChange={(e) => updateWriter(w.id, { publisher: e.target.value })}/></div>
                <div><label className={labelClass}>PRO</label><select className={inputClass} value={w.pro} onChange={(e) => updateWriter(w.id, { pro: e.target.value })}>{["SAMRO","CAPASSO","COSON","MCSN","ASCAP","BMI","PRS","SACEM","Other"].map((o) => <option key={o}>{o}</option>)}</select></div>
                <div><label className={labelClass}>IPI #</label><input className={inputClass} value={w.ipi} onChange={(e) => updateWriter(w.id, { ipi: e.target.value })}/></div>
                <div><label className={labelClass}>Rate / advance</label><input className={inputClass} value={w.rate} onChange={(e) => updateWriter(w.id, { rate: e.target.value })}/></div>
                <div><label className={labelClass}>Flight dates</label><input className={inputClass} value={w.flightDates} onChange={(e) => updateWriter(w.id, { flightDates: e.target.value })}/></div>
                <div><label className={labelClass}>Status</label><select className={inputClass} value={w.status} onChange={(e) => updateWriter(w.id, { status: e.target.value as Writer["status"] })}>{["Invited","Confirmed","Travel booked","Attending","Cancelled"].map((o) => <option key={o}>{o}</option>)}</select></div>
                <div className="col-span-2 sm:col-span-4">
                  <label className={labelClass}>Notes</label>
                  <textarea className={inputClass} rows={2} value={w.notes} onChange={(e) => updateWriter(w.id, { notes: e.target.value })} placeholder="Allergies, preferred room partners, NDA signed status, payment status"/>
                </div>
              </div>
              <button onClick={() => removeWriter(w.id)} className="text-xs text-red-400 hover:text-red-300 inline-flex items-center gap-1"><Trash2 size={11}/> Remove</button>
            </div>
          ))}
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: COLOR }}>Schedule</p>
          <button onClick={() => setS({ ...s, schedule: [...s.schedule, newDay()] })} className="text-xs font-semibold inline-flex items-center gap-1" style={{ color: COLOR }}><Plus size={12}/> Add day</button>
        </div>
        <div className="space-y-3">
          {s.schedule.map((d) => (
            <div key={d.id} className="border border-border rounded-xl p-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-2">
                <div><label className={labelClass}>Day</label><input className={inputClass} value={d.day} onChange={(e) => updateDay(d.id, { day: e.target.value })}/></div>
                <div className="col-span-3"><label className={labelClass}>Theme</label><input className={inputClass} value={d.theme} onChange={(e) => updateDay(d.id, { theme: e.target.value })}/></div>
                <div className="col-span-2"><label className={labelClass}>Room configuration</label><input className={inputClass} value={d.rooms} onChange={(e) => updateDay(d.id, { rooms: e.target.value })}/></div>
                <div className="col-span-2"><label className={labelClass}>Target deliverables</label><input className={inputClass} value={d.targetDeliverables} onChange={(e) => updateDay(d.id, { targetDeliverables: e.target.value })}/></div>
              </div>
              <button onClick={() => removeDay(d.id)} className="text-xs text-red-400 hover:text-red-300 inline-flex items-center gap-1"><Trash2 size={11}/> Remove</button>
            </div>
          ))}
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Compliance & notes</p>
        <div className="space-y-4">
          <F label="NDA in place" value={s.ndaInPlace} onChange={set("ndaInPlace")} rows={2}/>
          <F label="Notes" value={s.notes} onChange={set("notes")} rows={3}/>
        </div>
      </section>
    </ResourcePage>
  );
}
