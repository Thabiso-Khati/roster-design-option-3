"use client";
import { Plus, Trash2 } from "lucide-react";
import { ResourcePage, inputClass, labelClass, useLocalState } from "@/components/library/module-shell";
import { SaveButton } from "@/components/ui/save-button";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";

const COLOR = "#64748B";
const STORAGE_KEY = "roster_trademark_tracker_v1";

interface Mark {
  id: string;
  mark: string;
  type: "Word mark" | "Logo / device" | "Combined word + device";
  classes: string;
  jurisdiction: string;
  status: "Search complete" | "Filed" | "Examination" | "Published" | "Registered" | "Refused" | "Opposition";
  appNumber: string;
  regNumber: string;
  filed: string;
  registered: string;
  renewal: string;
  notes: string;
}

const newMark = (): Mark => ({
  id: Math.random().toString(36).slice(2, 8),
  mark: "", type: "Word mark", classes: "9, 25, 41",
  jurisdiction: "South Africa", status: "Search complete",
  appNumber: "", regNumber: "", filed: "", registered: "", renewal: "", notes: "",
});

const STATUS_COLOR: Record<Mark["status"], string> = {
  "Search complete": "#94A3B8",
  "Filed": "#3B82F6",
  "Examination": "#F59E0B",
  "Published": "#A855F7",
  "Registered": "#10B981",
  "Refused": "#EF4444",
  "Opposition": "#EC4899",
};

export default function TrademarkTrackerPage() {
  const [marks, setMarks] = useLocalState<Mark[]>(STORAGE_KEY, []);
  useToolRestore("trademark-tracker", STORAGE_KEY, setMarks);
  const update = (id: string, p: Partial<Mark>) => setMarks(marks.map((m) => (m.id === id ? { ...m, ...p } : m)));
  const remove = (id: string) => setMarks(marks.filter((m) => m.id !== id));

  return (
    <ResourcePage
      parentHref="/dashboard/library/legal"
      parentLabel="Back to Legal"
      color={COLOR}
      tag="Legal · Tracker"
      title="Trademark Application Tracker"
      intro="Track every trademark application — artist name, logo, tour name, merch wordmark — across every jurisdiction. Common Nice classes for music artists: 9 (sound recordings), 25 (apparel), 41 (entertainment services). Renew every 10 years or you lose the registration."
      toolbar={<><SaveButton toolSlug="trademark-tracker" storageKey={STORAGE_KEY} title={`Trademark Tracker — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
          
        <button onClick={() => setMarks([...marks, newMark()])} className="text-xs font-semibold inline-flex items-center gap-1 px-3 py-1.5 rounded-lg" style={{ backgroundColor: `${COLOR}15`, color: COLOR }}>
          <Plus size={13}/> Add mark
        </button>
            </>
      }
      next={{ href: "/dashboard/library/legal/copyright-tracker", label: "Copyright Registration Tracker" }}
    >
      {marks.length === 0 && <div className="glass-card rounded-2xl p-12 text-center text-text-muted text-sm">No trademarks tracked. Click <span className="font-semibold text-brand">Add mark</span> to start.</div>}

      <div className="space-y-3">
        {marks.map((m) => (
          <div key={m.id} className="glass-card rounded-2xl p-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              <div className="col-span-2"><label className={labelClass}>Mark</label><input className={inputClass} value={m.mark} onChange={(e) => update(m.id, { mark: e.target.value })} placeholder="ARTIST NAME / LOGO / etc."/></div>
              <div><label className={labelClass}>Type</label><select className={inputClass} value={m.type} onChange={(e) => update(m.id, { type: e.target.value as Mark["type"] })}><option>Word mark</option><option>Logo / device</option><option>Combined word + device</option></select></div>
              <div><label className={labelClass}>Status</label><select className={inputClass} value={m.status} onChange={(e) => update(m.id, { status: e.target.value as Mark["status"] })} style={{ borderColor: STATUS_COLOR[m.status] }}>
                {(["Search complete","Filed","Examination","Published","Registered","Refused","Opposition"] as Mark["status"][]).map((s) => <option key={s}>{s}</option>)}
              </select></div>
              <div><label className={labelClass}>Jurisdiction</label><select className={inputClass} value={m.jurisdiction} onChange={(e) => update(m.id, { jurisdiction: e.target.value })}>
                {["South Africa","Nigeria","Ghana","Kenya","Tanzania","Uganda","Cameroon","Senegal","ARIPO (regional)","OAPI (regional)","Egypt","Morocco","UK","EU (EUIPO)","USA","Madrid Protocol (international)","Other"].map((c) => <option key={c}>{c}</option>)}
              </select></div>
              <div><label className={labelClass}>Nice classes</label><input className={inputClass} value={m.classes} onChange={(e) => update(m.id, { classes: e.target.value })} placeholder="9, 25, 41"/></div>
              <div><label className={labelClass}>Application #</label><input className={inputClass} value={m.appNumber} onChange={(e) => update(m.id, { appNumber: e.target.value })}/></div>
              <div><label className={labelClass}>Registration #</label><input className={inputClass} value={m.regNumber} onChange={(e) => update(m.id, { regNumber: e.target.value })}/></div>
              <div><label className={labelClass}>Filed date</label><input type="date" className={inputClass} value={m.filed} onChange={(e) => update(m.id, { filed: e.target.value })}/></div>
              <div><label className={labelClass}>Registered date</label><input type="date" className={inputClass} value={m.registered} onChange={(e) => update(m.id, { registered: e.target.value })}/></div>
              <div><label className={labelClass}>Next renewal</label><input type="date" className={inputClass} value={m.renewal} onChange={(e) => update(m.id, { renewal: e.target.value })}/></div>
              <div className="col-span-2 sm:col-span-4">
                <label className={labelClass}>Notes</label>
                <textarea className={inputClass} rows={2} value={m.notes} onChange={(e) => update(m.id, { notes: e.target.value })} placeholder="Conflicting marks searched, attorney handling, opposition history"/>
              </div>
            </div>
            <button onClick={() => remove(m.id)} className="text-xs text-red-400 hover:text-red-300 inline-flex items-center gap-1"><Trash2 size={11}/> Remove</button>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-2xl p-5 mt-6 flex items-start gap-3" style={{ borderColor: `${COLOR}20`, backgroundColor: `${COLOR}08` }}>
        <p className="text-xs text-text-muted leading-relaxed">
          <span className="font-semibold text-text-primary">Quick reference.</span> SA: CIPC. NG: Trademarks Registry. GH: Registrar-General. KE: KIPI. ARIPO and OAPI are regional groupings (anglophone vs francophone Africa). Madrid Protocol allows central filing into 130+ jurisdictions from one application.
        </p>
      </div>
    </ResourcePage>
  );
}
