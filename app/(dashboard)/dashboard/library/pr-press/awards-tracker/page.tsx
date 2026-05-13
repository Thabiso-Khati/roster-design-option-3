"use client";
import { Plus, Trash2 } from "lucide-react";
import { ResourcePage, inputClass, labelClass, useLocalState } from "@/components/library/module-shell";
import { SaveButton } from "@/components/ui/save-button";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";

const COLOR = "#F472B6";
const STORAGE_KEY = "roster_awards_tracker_v1";

interface Submission {
  id: string;
  award: string;
  year: string;
  category: string;
  workTitle: string;
  status: "Researching" | "Eligible" | "Submitted" | "Long-listed" | "Nominated" | "Won" | "Did not make list";
  submitDeadline: string;
  submittedDate: string;
  fee: string;
  notes: string;
}

const newSub = (): Submission => ({
  id: Math.random().toString(36).slice(2, 8),
  award: "SAMA", year: "2026", category: "", workTitle: "", status: "Researching",
  submitDeadline: "", submittedDate: "", fee: "", notes: "",
});

const STATUS_COLOR: Record<Submission["status"], string> = {
  "Researching": "#94A3B8",
  "Eligible": "#3B82F6",
  "Submitted": "#F59E0B",
  "Long-listed": "#A855F7",
  "Nominated": "#22D3EE",
  "Won": "#10B981",
  "Did not make list": "#EF4444",
};

const AWARDS = [
  { name: "SAMA (South African Music Awards)", region: "South Africa" },
  { name: "Headies", region: "Nigeria" },
  { name: "AFRIMA (All Africa Music Awards)", region: "Pan-African" },
  { name: "MTV MAMA", region: "Pan-African" },
  { name: "Ghana Music Awards", region: "Ghana" },
  { name: "MTV Africa Music Awards", region: "Pan-African" },
  { name: "Channel O Music Video Awards", region: "Pan-African" },
  { name: "Grammy Awards", region: "USA" },
  { name: "BET Awards", region: "USA" },
  { name: "BET Hip Hop Awards", region: "USA" },
  { name: "MOBO Awards", region: "UK" },
  { name: "BRIT Awards", region: "UK" },
  { name: "MTV EMAs", region: "Global" },
  { name: "Latin Grammys (where applicable)", region: "Latin America" },
  { name: "ARIA Awards (where applicable)", region: "Australia" },
  { name: "Other", region: "—" },
];

export default function AwardsTrackerPage() {
  const [subs, setSubs] = useLocalState<Submission[]>(STORAGE_KEY, []);
  useToolRestore("awards-tracker", STORAGE_KEY, setSubs);
  const update = (id: string, p: Partial<Submission>) => setSubs(subs.map((s) => (s.id === id ? { ...s, ...p } : s)));
  const remove = (id: string) => setSubs(subs.filter((s) => s.id !== id));

  const stats = {
    submitted: subs.filter((s) => ["Submitted", "Long-listed", "Nominated", "Won"].includes(s.status)).length,
    nominated: subs.filter((s) => ["Nominated", "Won"].includes(s.status)).length,
    won: subs.filter((s) => s.status === "Won").length,
  };

  return (
    <ResourcePage
      parentHref="/dashboard/library/pr-press"
      parentLabel="Back to PR, Press and Awards"
      color={COLOR}
      tag="PR · Awards"
      title="Awards Submission Tracker"
      intro="Don't miss eligibility windows. Track submissions across SAMA, Headies, AFRIMA, Grammy, BET, MOBO and more — by award × year × category × status."
      toolbar={<><SaveButton toolSlug="awards-tracker" storageKey={STORAGE_KEY} title={`Awards Tracker — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
          
        <button onClick={() => setSubs([...subs, newSub()])} className="text-xs font-semibold inline-flex items-center gap-1 px-3 py-1.5 rounded-lg" style={{ backgroundColor: `${COLOR}15`, color: COLOR }}>
          <Plus size={13}/> Add submission
        </button>
            </>
      }
      next={{ href: "/dashboard/library/pr-press/awards-bio-pack", label: "Awards Bio + EPK Pack" }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="glass-card rounded-xl p-4 text-center"><p className="text-xs text-text-muted mb-1">Submitted</p><p className="font-bold text-xl text-text-primary">{stats.submitted}</p></div>
        <div className="glass-card rounded-xl p-4 text-center"><p className="text-xs text-text-muted mb-1">Nominated</p><p className="font-bold text-xl" style={{ color: "#22D3EE" }}>{stats.nominated}</p></div>
        <div className="glass-card rounded-xl p-4 text-center" style={{ borderColor: `${COLOR}40` }}><p className="text-xs text-text-muted mb-1">Won</p><p className="font-black text-2xl" style={{ color: "#10B981" }}>{stats.won}</p></div>
      </div>

      {subs.length === 0 && <div className="glass-card rounded-2xl p-12 text-center text-text-muted text-sm">No submissions tracked.</div>}

      <div className="space-y-3">
        {subs.map((s) => (
          <div key={s.id} className="glass-card rounded-2xl p-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              <div><label className={labelClass}>Award</label><select className={inputClass} value={s.award} onChange={(e) => update(s.id, { award: e.target.value })}>{AWARDS.map((a) => <option key={a.name}>{a.name}</option>)}</select></div>
              <div><label className={labelClass}>Year</label><input className={inputClass} value={s.year} onChange={(e) => update(s.id, { year: e.target.value })}/></div>
              <div><label className={labelClass}>Category</label><input className={inputClass} value={s.category} onChange={(e) => update(s.id, { category: e.target.value })} placeholder="Best Amapiano / Album of the Year / etc."/></div>
              <div><label className={labelClass}>Work title</label><input className={inputClass} value={s.workTitle} onChange={(e) => update(s.id, { workTitle: e.target.value })}/></div>
              <div><label className={labelClass}>Status</label><select className={inputClass} value={s.status} onChange={(e) => update(s.id, { status: e.target.value as Submission["status"] })} style={{ borderColor: STATUS_COLOR[s.status] }}>
                {(["Researching","Eligible","Submitted","Long-listed","Nominated","Won","Did not make list"] as Submission["status"][]).map((o) => <option key={o}>{o}</option>)}
              </select></div>
              <div><label className={labelClass}>Submission deadline</label><input type="date" className={inputClass} value={s.submitDeadline} onChange={(e) => update(s.id, { submitDeadline: e.target.value })}/></div>
              <div><label className={labelClass}>Submitted date</label><input type="date" className={inputClass} value={s.submittedDate} onChange={(e) => update(s.id, { submittedDate: e.target.value })}/></div>
              <div><label className={labelClass}>Fee</label><input className={inputClass} value={s.fee} onChange={(e) => update(s.id, { fee: e.target.value })} placeholder="USD / ZAR"/></div>
              <div className="col-span-2 sm:col-span-4">
                <label className={labelClass}>Notes</label>
                <textarea className={inputClass} rows={2} value={s.notes} onChange={(e) => update(s.id, { notes: e.target.value })} placeholder="Eligibility specifics, key contacts, voting strategy"/>
              </div>
            </div>
            <button onClick={() => remove(s.id)} className="text-xs text-red-400 hover:text-red-300 inline-flex items-center gap-1"><Trash2 size={11}/> Remove</button>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-2xl p-5 mt-6 flex items-start gap-3" style={{ borderColor: `${COLOR}20`, backgroundColor: `${COLOR}08` }}>
        <p className="text-xs text-text-muted leading-relaxed">
          <span className="font-semibold text-text-primary">Tip.</span> Pair with the Awards Bio Pack — most awards require a 250-word bio + EPK + clean audio + cleared video. Pre-build the pack and re-version per award. Most African artists miss SAMA / Headies / AFRIMA windows because submissions open in March-May for September-November ceremonies.
        </p>
      </div>
    </ResourcePage>
  );
}
