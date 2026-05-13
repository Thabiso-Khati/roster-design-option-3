"use client";
import { Plus, Trash2 } from "lucide-react";
import { ResourcePage, inputClass, labelClass, useLocalState } from "@/components/library/module-shell";
import { SaveButton } from "@/components/ui/save-button";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";

const COLOR = "#64748B";
const STORAGE_KEY = "roster_copyright_tracker_v1";

interface Reg {
  id: string;
  workTitle: string;
  workType: "Sound recording" | "Musical composition" | "Lyric (literary)" | "Music video (audiovisual)" | "Cover art (artistic)";
  jurisdiction: string;
  status: "Not registered" | "Application submitted" | "Registered" | "Refused";
  registrationNumber: string;
  filed: string;
  registered: string;
  isrcOrIswc: string;
  notes: string;
}

const newReg = (): Reg => ({
  id: Math.random().toString(36).slice(2, 8),
  workTitle: "", workType: "Sound recording",
  jurisdiction: "South Africa", status: "Not registered",
  registrationNumber: "", filed: "", registered: "", isrcOrIswc: "", notes: "",
});

const STATUS_COLOR: Record<Reg["status"], string> = {
  "Not registered": "#94A3B8",
  "Application submitted": "#F59E0B",
  "Registered": "#10B981",
  "Refused": "#EF4444",
};

export default function CopyrightTrackerPage() {
  const [regs, setRegs] = useLocalState<Reg[]>(STORAGE_KEY, []);
  useToolRestore("copyright-tracker", STORAGE_KEY, setRegs);
  const update = (id: string, p: Partial<Reg>) => setRegs(regs.map((r) => (r.id === id ? { ...r, ...p } : r)));
  const remove = (id: string) => setRegs(regs.filter((r) => r.id !== id));

  return (
    <ResourcePage
      parentHref="/dashboard/library/legal"
      parentLabel="Back to Legal"
      color={COLOR}
      tag="Legal · Tracker"
      title="Copyright Registration Tracker"
      intro="Track formal copyright registrations across every work and every jurisdiction. SA + NG: copyright vests automatically on creation, but US Library of Congress registration is needed for statutory damages in US infringement claims (and required before filing suit). Worth registering for any catalogue work likely to see US distribution."
      toolbar={<><SaveButton toolSlug="copyright-tracker" storageKey={STORAGE_KEY} title={`Copyright Tracker — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
          
        <button onClick={() => setRegs([...regs, newReg()])} className="text-xs font-semibold inline-flex items-center gap-1 px-3 py-1.5 rounded-lg" style={{ backgroundColor: `${COLOR}15`, color: COLOR }}>
          <Plus size={13}/> Add registration
        </button>
            </>
      }
      next={{ href: "/dashboard/library/legal/popia-gdpr-template", label: "Privacy Policy Template" }}
    >
      <div className="glass-card rounded-2xl p-5 mb-6 flex items-start gap-3" style={{ borderColor: `${COLOR}20`, backgroundColor: `${COLOR}08` }}>
        <p className="text-xs text-text-muted leading-relaxed">
          <span className="font-semibold text-text-primary">Quick reference.</span> US Library of Congress (copyright.gov) — paid form (USD 65). South Africa CIPC + DALRO database. Nigeria NCC (Nigerian Copyright Commission) — register at nigerian-copyright.org. UK IPO not strictly required (©vests). Most African jurisdictions have automatic protection but optional registration adds evidentiary weight.
        </p>
      </div>

      {regs.length === 0 && <div className="glass-card rounded-2xl p-12 text-center text-text-muted text-sm">No copyright registrations tracked.</div>}

      <div className="space-y-3">
        {regs.map((r) => (
          <div key={r.id} className="glass-card rounded-2xl p-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              <div className="col-span-2"><label className={labelClass}>Work title</label><input className={inputClass} value={r.workTitle} onChange={(e) => update(r.id, { workTitle: e.target.value })}/></div>
              <div><label className={labelClass}>Work type</label><select className={inputClass} value={r.workType} onChange={(e) => update(r.id, { workType: e.target.value as Reg["workType"] })}>
                <option>Sound recording</option><option>Musical composition</option><option>Lyric (literary)</option><option>Music video (audiovisual)</option><option>Cover art (artistic)</option>
              </select></div>
              <div><label className={labelClass}>Status</label><select className={inputClass} value={r.status} onChange={(e) => update(r.id, { status: e.target.value as Reg["status"] })} style={{ borderColor: STATUS_COLOR[r.status] }}>
                {(["Not registered","Application submitted","Registered","Refused"] as Reg["status"][]).map((s) => <option key={s}>{s}</option>)}
              </select></div>
              <div><label className={labelClass}>Jurisdiction</label><select className={inputClass} value={r.jurisdiction} onChange={(e) => update(r.id, { jurisdiction: e.target.value })}>
                {["South Africa","Nigeria","Ghana","Kenya","Tanzania","Uganda","USA (Library of Congress)","UK (IPO)","EU","Other"].map((c) => <option key={c}>{c}</option>)}
              </select></div>
              <div><label className={labelClass}>Registration #</label><input className={inputClass} value={r.registrationNumber} onChange={(e) => update(r.id, { registrationNumber: e.target.value })}/></div>
              <div><label className={labelClass}>ISRC / ISWC</label><input className={inputClass} value={r.isrcOrIswc} onChange={(e) => update(r.id, { isrcOrIswc: e.target.value })}/></div>
              <div><label className={labelClass}>Filed date</label><input type="date" className={inputClass} value={r.filed} onChange={(e) => update(r.id, { filed: e.target.value })}/></div>
              <div><label className={labelClass}>Registered date</label><input type="date" className={inputClass} value={r.registered} onChange={(e) => update(r.id, { registered: e.target.value })}/></div>
              <div className="col-span-2 sm:col-span-4">
                <label className={labelClass}>Notes</label>
                <textarea className={inputClass} rows={2} value={r.notes} onChange={(e) => update(r.id, { notes: e.target.value })} placeholder="Joint-author registrations, deposits, attorney handling"/>
              </div>
            </div>
            <button onClick={() => remove(r.id)} className="text-xs text-red-400 hover:text-red-300 inline-flex items-center gap-1"><Trash2 size={11}/> Remove</button>
          </div>
        ))}
      </div>
    </ResourcePage>
  );
}
