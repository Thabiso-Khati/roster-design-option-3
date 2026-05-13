"use client";
import { Plus, Trash2 } from "lucide-react";
import { ResourcePage, inputClass, labelClass, useLocalState } from "@/components/library/module-shell";
import { SaveButton } from "@/components/ui/save-button";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";

const COLOR = "#06B6D4";
const STORAGE_KEY = "roster_pro_tracker_v1";

interface Membership {
  id: string;
  writer: string;
  org: string;
  type: "PRO" | "MRO" | "Neighbouring";
  country: string;
  status: "Not started" | "Application submitted" | "Active" | "Pending docs" | "Suspended";
  memberId: string;
  appDate: string;
  activatedDate: string;
  notes: string;
}

const newMembership = (): Membership => ({
  id: Math.random().toString(36).slice(2, 8),
  writer: "", org: "SAMRO", type: "PRO", country: "South Africa", status: "Not started",
  memberId: "", appDate: "", activatedDate: "", notes: "",
});

const STATUS_COLOR: Record<Membership["status"], string> = {
  "Not started": "#94A3B8",
  "Application submitted": "#F59E0B",
  "Active": "#10B981",
  "Pending docs": "#EAB308",
  "Suspended": "#EF4444",
};

export default function PROMembershipTrackerPage() {
  const [memberships, setMemberships] = useLocalState<Membership[]>(STORAGE_KEY, []);
  useToolRestore("pro-membership-tracker", STORAGE_KEY, setMemberships);
  const update = (id: string, patch: Partial<Membership>) =>
    setMemberships(memberships.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  const remove = (id: string) => setMemberships(memberships.filter((m) => m.id !== id));

  const stats = memberships.reduce<Record<string, number>>(
    (acc, m) => ({ ...acc, [m.status]: (acc[m.status] || 0) + 1 }),
    {}
  );

  return (
    <ResourcePage
      parentHref="/dashboard/library/publishing"
      parentLabel="Back to Publishing"
      color={COLOR}
      tag="Publishing · Tracker"
      title="PRO / MRO / Neighbouring Rights Membership Tracker"
      intro="Track every writer's membership across every collection society. Missing memberships = missing money. SAMRO, CAPASSO, SAMPRA, COSON, MCSN, MCSK, GHAMRO, ASCAP, BMI, PRS, MLC, SoundExchange, PPL — track all of them."
      toolbar={<><SaveButton toolSlug="pro-membership-tracker" storageKey={STORAGE_KEY} title={`PRO Membership Tracker — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
          
        <button onClick={() => setMemberships([...memberships, newMembership()])} className="text-xs font-semibold inline-flex items-center gap-1 px-3 py-1.5 rounded-lg" style={{ backgroundColor: `${COLOR}15`, color: COLOR }}>
          <Plus size={13}/> Add membership
        </button>
            </>
      }
      next={{ href: "/dashboard/library/publishing/mlc-tracker", label: "MLC Registration Tracker" }}
    >
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-6">
        {(["Not started","Application submitted","Active","Pending docs","Suspended"] as Membership["status"][]).map((s) => (
          <div key={s} className="glass-card rounded-lg p-3 text-center" style={{ borderColor: `${STATUS_COLOR[s]}40` }}>
            <p className="text-xs text-text-muted mb-1">{s}</p>
            <p className="font-black text-lg" style={{ color: STATUS_COLOR[s] }}>{stats[s] || 0}</p>
          </div>
        ))}
      </div>

      {memberships.length === 0 && (
        <div className="glass-card rounded-2xl p-12 text-center text-text-muted text-sm">
          No memberships tracked. Add one per writer × per society.
        </div>
      )}

      <div className="space-y-3">
        {memberships.map((m) => (
          <div key={m.id} className="glass-card rounded-2xl p-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              <div><label className={labelClass}>Writer</label><input className={inputClass} value={m.writer} onChange={(e) => update(m.id, { writer: e.target.value })}/></div>
              <div><label className={labelClass}>Type</label><select className={inputClass} value={m.type} onChange={(e) => update(m.id, { type: e.target.value as Membership["type"] })}><option>PRO</option><option>MRO</option><option>Neighbouring</option></select></div>
              <div><label className={labelClass}>Org</label><select className={inputClass} value={m.org} onChange={(e) => update(m.id, { org: e.target.value })}>
                {["SAMRO","CAPASSO","SAMPRA","COSON","MCSN","ARPSON","MCSK","KAMP","PRSK","GHAMRO","COSOTA","BUMDA","BCDA","ZIMRA","ECRA","BMDA","BSDA","UPRS","BUMDA","ASCAP","BMI","SESAC","HFA","MLC","SoundExchange","AIRCO","PRS","PPL","PPCA","PRSF","SACEM","SDRM","GEMA","STIM","KODA","SIAE","JASRAC","SACVEN","KCI","MUST","Other"].map((o) => <option key={o}>{o}</option>)}
              </select></div>
              <div><label className={labelClass}>Country</label><input className={inputClass} value={m.country} onChange={(e) => update(m.id, { country: e.target.value })}/></div>
              <div><label className={labelClass}>Status</label><select className={inputClass} value={m.status} onChange={(e) => update(m.id, { status: e.target.value as Membership["status"] })} style={{ borderColor: STATUS_COLOR[m.status] }}>
                {(["Not started","Application submitted","Active","Pending docs","Suspended"] as Membership["status"][]).map((s) => <option key={s}>{s}</option>)}
              </select></div>
              <div><label className={labelClass}>Member ID</label><input className={inputClass} value={m.memberId} onChange={(e) => update(m.id, { memberId: e.target.value })}/></div>
              <div><label className={labelClass}>Application date</label><input type="date" className={inputClass} value={m.appDate} onChange={(e) => update(m.id, { appDate: e.target.value })}/></div>
              <div><label className={labelClass}>Activated date</label><input type="date" className={inputClass} value={m.activatedDate} onChange={(e) => update(m.id, { activatedDate: e.target.value })}/></div>
              <div className="col-span-2 sm:col-span-4">
                <label className={labelClass}>Notes</label>
                <textarea className={inputClass} rows={2} value={m.notes} onChange={(e) => update(m.id, { notes: e.target.value })} placeholder="Reciprocal arrangements, sub-publishing, audit history"/>
              </div>
            </div>
            <button onClick={() => remove(m.id)} className="text-xs text-red-400 hover:text-red-300 inline-flex items-center gap-1"><Trash2 size={11}/> Remove</button>
          </div>
        ))}
      </div>
    </ResourcePage>
  );
}
