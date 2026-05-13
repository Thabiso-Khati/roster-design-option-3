"use client";
import { useState, useEffect } from "react";
import { Save, BarChart3, Printer } from "lucide-react";
import { useLocale } from "@/context/locale-context";
import { storageSave, storageLoad } from "@/lib/storage";
import { PrintDocument } from "@/components/tools/print-document";
import type { PrintSection } from "@/components/tools/print-document";
import { SaveButton } from "@/components/ui/save-button";
import { ExportButton } from "@/components/ui/export-button";
const STORAGE_KEY = "roster_mkt_forecast";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const SA_EVENTS: Record<string, string[]> = {
  Jan: ["New Year campaign","Summer festival season"],
  Feb: ["Valentine's Day (14 Feb)","Grammy Awards"],
  Mar: ["Human Rights Day (21 Mar)","SAMA nominations open"],
  Apr: ["Freedom Day (27 Apr)","Easter weekend performances"],
  May: ["Workers' Day (1 May)","Africa Day (25 May)","Africa Day concerts"],
  Jun: ["Youth Day (16 Jun)","Soweto Uprising anniversary","Oppikoppi announcements"],
  Jul: ["Mandela Day (18 Jul)","Winter break","Durban July"],
  Aug: ["Women's Month","National Women's Day (9 Aug)","Channel O Awards voting"],
  Sep: ["Heritage Month","Spring festivals","SAMA Awards ceremony"],
  Oct: ["DSTV Delicious Festival","Awesome Africa Festival"],
  Nov: ["AfriMuseXchange","Year-end campaign build"],
  Dec: ["Festive Season push","Year-end review","Summer tour season"],
};

const ACTIVITY_ROWS = [
  "New single / EP release campaign",
  "Music video release",
  "Pre-save / pre-order campaign",
  "Radio plugging campaign",
  "DSP editorial pitching",
  "Paid social media ads (Meta/TikTok)",
  "Playlist pitching campaign",
  "PR / press outreach",
  "Brand partnership activation",
  "Live performance / tour",
  "Content series launch",
  "Fan community activation",
  "Email / WhatsApp campaign",
  "Award submissions",
  "International market push",
];

const BUDGET_CATS = ["Paid Advertising","Radio Promotion","PR / Publicist","Content Production","Music Video","Playlist Pitching","Events / Live","Merchandise","Other"];

type CalData = Record<string, Record<string, boolean>>;
type BudgetData = Record<string, Record<string, string>>;

type Tab = "calendar" | "budget" | "checklist";

const WEEKLY_TASKS = [
  "Post TikTok (trending sound or original)",
  "Post Instagram Reel or Story",
  "Post YouTube Short (repurpose or create fresh)",
  "Reply to comments & DMs (within 2 hrs)",
  "Post 2–3 Instagram Stories (polls, BTS, Q&A)",
  "Check and respond to booking / collab enquiries",
  "Review active paid campaigns",
  "Check Spotify for Artists dashboard",
  "Pitch to 3–5 playlist curators",
  "Send weekly email / WhatsApp broadcast",
  "Upload or schedule weekly YouTube video",
  "Review press / media opportunities",
  "Update income / expense log",
];

export default function MarketingForecast() {
  const handleExportPDF = () => { window.print(); };
  const { sym, locale, currency } = useLocale();
  const [tab, setTab] = useState<Tab>("calendar");
  const [calData, setCalData] = useState<CalData>({});
  const [budgetData, setBudgetData] = useState<BudgetData>({});
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);
  const [showPrint, setShowPrint] = useState(false);

  useEffect(() => {
    type Saved = { cal?: CalData; budget?: BudgetData; checklist?: Record<string, boolean> };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const d: Saved = JSON.parse(raw);
        if (d.cal) setCalData(d.cal);
        if (d.budget) setBudgetData(d.budget);
        if (d.checklist) setChecklist(d.checklist);
        return;
      }
    } catch {}
    fetch(`/api/tools/save?slug=marketing-forecast`)
      .then(r => r.json())
      .then(({ snapshot }) => {
        if (!snapshot?.data) return;
        const d = snapshot.data as Saved;
        if (d.cal) setCalData(d.cal);
        if (d.budget) setBudgetData(d.budget);
        if (d.checklist) setChecklist(d.checklist);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {}
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const save = () => {
    storageSave("roster_mkt_forecast", { cal: calData, budget: budgetData, checklist });
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const toggleCal = (row: string, month: string) =>
    setCalData(p => ({ ...p, [row]: { ...(p[row]??{}), [month]: !(p[row]??{})[month] } }));

  const setBudget = (cat: string, month: string, val: string) =>
    setBudgetData(p => ({ ...p, [cat]: { ...(p[cat]??{}), [month]: val } }));

  const toggleCheck = (task: string) =>
    setChecklist(p => ({ ...p, [task]: !p[task] }));

  const totalByMonth = MONTHS.map(m =>
    BUDGET_CATS.reduce((sum, c) => sum + (parseFloat(budgetData[c]?.[m]??"")||0), 0)
  );

  const TABS: {id: Tab; label: string}[] = [
    { id: "calendar", label: "Annual Activity Calendar" },
    { id: "budget", label: `Monthly Budget (${currency})` },
    { id: "checklist", label: "Weekly Routine Checklist" },
  ];

  return (
    <div className="animate-fade-in">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 size={18} className="text-brand"/>
            <h1 className="text-xl font-black text-text-primary">Marketing Forecast</h1>
          </div>
          <p className="text-sm text-text-muted">Annual cultural calendar + monthly budget tracker.</p>
        </div>
        <ExportButton onPDF={handleExportPDF} />
        <SaveButton toolSlug="marketing-forecast" storageKey={STORAGE_KEY} title={`Marketing Forecast — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-6 border-b border-border overflow-x-auto scrollbar-none">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-shrink-0 px-4 py-2.5 text-xs font-semibold transition-all border-b-2 -mb-px ${tab===t.id?"border-brand text-brand":"border-transparent text-text-muted hover:text-text-primary"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Annual Calendar */}
      {tab === "calendar" && (
        <div>
          <p className="text-xs text-text-muted mb-4">Click any cell to mark a campaign activity as active for that month. SA cultural moments shown above each column.</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-xs">
              <thead>
                <tr>
                  <th className="text-left px-4 py-2.5 font-semibold text-text-muted w-44 sticky left-0 bg-surface border-r border-b border-border">Activity</th>
                  {MONTHS.map(m => (
                    <th key={m} className="px-2 py-2 border-b border-border text-center min-w-[60px]">
                      <div className="font-black text-text-primary mb-1">{m}</div>
                      <div className="space-y-0.5">
                        {(SA_EVENTS[m]??[]).map(e => (
                          <div key={e} className="text-[9px] text-brand/70 font-medium leading-tight">{e}</div>
                        ))}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ACTIVITY_ROWS.map((row, ri) => (
                  <tr key={row} className={ri%2===0?"":"bg-surface-2/20"}>
                    <td className="px-4 py-2 font-medium text-text-primary sticky left-0 bg-inherit border-r border-border">{row}</td>
                    {MONTHS.map(m => {
                      const active = calData[row]?.[m];
                      return (
                        <td key={m} className="px-2 py-1.5 text-center">
                          <button onClick={() => toggleCal(row, m)}
                            className={`w-7 h-7 rounded transition-all mx-auto ${active ? "bg-brand text-bg font-bold" : "bg-surface-2 text-text-muted hover:bg-brand/20 hover:text-brand"}`}>
                            {active ? "●" : "○"}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Budget */}
      {tab === "budget" && (
        <div>
          <div className="glass-card rounded-xl p-4 mb-5 flex items-center justify-between">
            <p className="text-xs font-semibold text-text-muted">Total Annual Budget</p>
            <p className="text-lg font-black text-brand">{sym} {totalByMonth.reduce((a,b)=>a+b,0).toLocaleString(locale)}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-xs">
              <thead>
                <tr className="border-b border-border bg-surface-2">
                  <th className="text-left px-4 py-2.5 font-bold text-text-muted w-36 sticky left-0 bg-surface-2 border-r border-border">Category</th>
                  {MONTHS.map(m => <th key={m} className="px-2 py-2.5 font-bold text-text-muted text-center">{m}</th>)}
                  <th className="px-3 py-2.5 font-bold text-text-muted text-center">Total</th>
                </tr>
              </thead>
              <tbody>
                {BUDGET_CATS.map((cat, ci) => {
                  const rowTotal = MONTHS.reduce((s,m) => s+(parseFloat(budgetData[cat]?.[m]??"")||0), 0);
                  return (
                    <tr key={cat} className={ci%2===0?"":"bg-surface-2/20"}>
                      <td className="px-4 py-2 font-medium text-text-primary sticky left-0 bg-inherit border-r border-border">{cat}</td>
                      {MONTHS.map(m => (
                        <td key={m} className="px-1 py-1.5">
                          <input type="text" value={budgetData[cat]?.[m]??""} placeholder="0"
                            onChange={e => setBudget(cat, m, e.target.value)}
                            className="w-full text-center bg-transparent border border-transparent hover:border-brand/30 focus:border-brand focus:bg-surface-2 rounded px-1 py-1 outline-none transition-all text-text-primary placeholder:text-text-muted/30"/>
                        </td>
                      ))}
                      <td className="px-3 py-2 text-center font-bold text-text-primary">{rowTotal > 0 ? `${sym} ${rowTotal.toLocaleString(locale)}` : ", "}</td>
                    </tr>
                  );
                })}
                <tr className="border-t-2 border-brand/30">
                  <td className="px-4 py-2.5 font-black text-text-primary sticky left-0 bg-surface border-r border-border">Total / Month</td>
                  {totalByMonth.map((t,i) => (
                    <td key={i} className="px-2 py-2.5 text-center font-bold" style={{ color: t > 0 ? "#C9A84C" : undefined }}>
                      {t > 0 ? `${sym} ${t.toLocaleString(locale)}` : ", "}
                    </td>
                  ))}
                  <td className="px-3 py-2.5 text-center font-black text-brand">{sym} {totalByMonth.reduce((a,b)=>a+b,0).toLocaleString(locale)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Weekly Checklist */}
      {tab === "checklist" && (
        <div>
          <div className="glass-card rounded-xl p-4 mb-4 flex items-center justify-between">
            <p className="text-sm text-text-muted">Use this each week. Reset every Monday.</p>
            <button onClick={() => setChecklist({})} className="text-xs text-text-muted hover:text-error transition-colors">Reset week</button>
          </div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-text-muted">{Object.values(checklist).filter(Boolean).length} / {WEEKLY_TASKS.length} completed</p>
            <div className="flex-1 mx-4 h-1.5 bg-surface-2 rounded-full overflow-hidden">
              <div className="h-full bg-brand transition-all rounded-full"
                style={{ width: `${(Object.values(checklist).filter(Boolean).length/WEEKLY_TASKS.length)*100}%` }}/>
            </div>
          </div>
          <div className="space-y-1.5">
            {WEEKLY_TASKS.map(task => (
              <button key={task} onClick={() => toggleCheck(task)}
                className="w-full flex items-start gap-3 px-4 py-3 glass-card rounded-xl hover:border-brand/20 transition-all text-left group">
                <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${checklist[task] ? "border-brand bg-brand" : "border-border group-hover:border-brand/50"}`}>
                  {checklist[task] && <span className="text-bg text-xs font-black">✓</span>}
                </div>
                <span className={`text-sm transition-colors ${checklist[task] ? "line-through text-text-muted" : "text-text-primary"}`}>{task}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <p className="text-xs text-text-muted mt-4 text-center">Press Save to keep your data between sessions (stored 90 days).</p>

      {showPrint && (() => {
        const MNTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        const activeRows = ACTIVITY_ROWS.filter(r => MNTHS.some(m => calData[r]?.[m]));
        const sections: PrintSection[] = [
          { heading: `Annual Marketing Budget (${currency})`, color: "#F59E0B",
            stats: [
              { label: "Total Annual Budget", value: `${sym} ${totalByMonth.reduce((a,b)=>a+b,0).toLocaleString(locale)}` },
              ...MNTHS.map((m,i) => ({ label: m, value: totalByMonth[i] > 0 ? `${sym} ${totalByMonth[i].toLocaleString(locale)}` : ", " }))
            ] },
          { heading: "Active Campaign Calendar", color: "#8B5CF6",
            tables: activeRows.length > 0 ? [{ headers: ["Campaign / Activity", ...MNTHS],
              rows: activeRows.map(r => [r, ...MNTHS.map(m => calData[r]?.[m] ? "●" : "")]) }] : undefined,
            note: activeRows.length === 0 ? "No campaigns marked yet, open the Annual Activity Calendar tab to plan your year." : undefined },
          { heading: "Budget Breakdown by Category", color: "#F59E0B",
            tables: [{ headers: ["Category", ...MNTHS, "Total"],
              rows: BUDGET_CATS.map(cat => {
                const total = MNTHS.reduce((s,m) => s+(parseFloat(budgetData[cat]?.[m]??"")||0), 0);
                return [cat, ...MNTHS.map(m => budgetData[cat]?.[m] ? `${sym} ${budgetData[cat][m]}` : ""), total > 0 ? `${sym} ${total.toLocaleString(locale)}` : ", "];
              }) }] },
          { heading: "Weekly Routine Checklist", color: "#10B981",
            lists: [{ items: WEEKLY_TASKS.map(t => `${checklist[t] ? "✓" : "○"}  ${t}`) }] },
        ];
        return <PrintDocument toolName="Marketing Forecast" subtitle="Annual Plan & Budget" sections={sections} onClose={() => setShowPrint(false)}/>;
      })()}
    </div>
  );
}
