"use client";
import { Plus, Trash2, RotateCcw } from "lucide-react";
import { ResourcePage, inputClass, labelClass, useLocalState } from "@/components/library/module-shell";
import { SaveButton } from "@/components/ui/save-button";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";

const COLOR = "#EF4444";
const STORAGE_KEY = "roster_email_calendar_v1";

interface Email { id: string; date: string; phase: string; subject: string; segment: string; cta: string; sent: boolean; }

const newEmail = (): Email => ({ id: Math.random().toString(36).slice(2, 8), date: "", phase: "Tease", subject: "", segment: "All subscribers", cta: "", sent: false });

const SEED: Email[] = [
  { id: "a1", date: "T−21", phase: "Tease", subject: "Something's coming.", segment: "All subscribers", cta: "Pre-save", sent: false },
  { id: "a2", date: "T−14", phase: "Reveal", subject: "[Artist]: New single, [Date].", segment: "All", cta: "Pre-save", sent: false },
  { id: "a3", date: "T−7", phase: "Story", subject: "How [Song] was made.", segment: "All", cta: "Pre-save / share", sent: false },
  { id: "a4", date: "T−3", phase: "Reminder", subject: "3 days. Hit pre-save.", segment: "Non-pre-savers", cta: "Pre-save", sent: false },
  { id: "a5", date: "T−1", phase: "Final reminder", subject: "Tomorrow — set your alarm.", segment: "Non-pre-savers", cta: "Pre-save", sent: false },
  { id: "b1", date: "T", phase: "Drop", subject: "[Song] — out now.", segment: "All", cta: "Stream / save", sent: false },
  { id: "b2", date: "T+1", phase: "Drop follow-up", subject: "What you missed last night.", segment: "Drop-day non-openers", cta: "Stream", sent: false },
  { id: "b3", date: "T+3", phase: "Behind the scenes", subject: "Studio session video — only for the list.", segment: "All", cta: "Watch", sent: false },
  { id: "b4", date: "T+7", phase: "Ask for share", subject: "Share with one friend who needs to hear this.", segment: "Engaged listeners", cta: "Share via WA / IG", sent: false },
  { id: "c1", date: "T+14", phase: "Tour pre-announce", subject: "We're going on the road.", segment: "VIPs (paid tier)", cta: "Pre-sale code", sent: false },
  { id: "c2", date: "T+21", phase: "Tour public announce", subject: "Tour dates inside.", segment: "All", cta: "Tickets", sent: false },
  { id: "c3", date: "T+30", phase: "Merch drop", subject: "Limited tee available — list members get 24h head start.", segment: "All", cta: "Shop", sent: false },
];

export default function EmailMarketingCalendarPage() {
  const [emails, setEmails] = useLocalState<Email[]>(STORAGE_KEY, SEED);
  useToolRestore("email-marketing-calendar", STORAGE_KEY, setEmails);
  const update = (id: string, p: Partial<Email>) => setEmails(emails.map((e) => (e.id === id ? { ...e, ...p } : e)));
  const remove = (id: string) => setEmails(emails.filter((e) => e.id !== id));
  const sentCount = emails.filter((e) => e.sent).length;

  return (
    <ResourcePage
      parentHref="/dashboard/library/fan-crm"
      parentLabel="Back to Fan, CRM and Audience"
      color={COLOR}
      tag="CRM · Calendar"
      title="Email Marketing Calendar"
      intro="12-step email cadence for a release campaign — pre-launch hype, drop day, post-launch nurture, tour announcement. Adjust dates around T (release day) for your timeline."
      toolbar={<><SaveButton toolSlug="email-marketing-calendar" storageKey={STORAGE_KEY} title={`Email Marketing Calendar — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
          
        <>
          <button onClick={() => setEmails([...emails, newEmail()])} className="text-xs font-semibold inline-flex items-center gap-1 px-3 py-1.5 rounded-lg" style={{ backgroundColor: `${COLOR}15`, color: COLOR }}><Plus size={13}/> Add email</button>
          <button onClick={() => setEmails(SEED)} className="text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1"><RotateCcw size={13}/> Reset to default</button>
        </>
            </>
      }
    >
      <div className="glass-card rounded-2xl p-4 mb-6 flex items-center justify-between flex-wrap gap-3" style={{ borderColor: `${COLOR}40` }}>
        <p className="text-sm font-bold text-text-primary">{sentCount} / {emails.length} sent</p>
        <div className="w-1/2 bg-surface-2 rounded-full h-2 overflow-hidden">
          <div className="h-full transition-all" style={{ width: `${(sentCount / emails.length) * 100}%`, backgroundColor: COLOR }}/>
        </div>
      </div>

      <div className="space-y-2">
        {emails.map((e) => (
          <div key={e.id} className={`glass-card rounded-xl p-4 ${e.sent ? "opacity-60" : ""}`}>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 items-start">
              <button onClick={() => update(e.id, { sent: !e.sent })} className="w-5 h-5 rounded mt-1 flex-shrink-0" style={{ backgroundColor: e.sent ? COLOR : "transparent", border: `1px solid ${e.sent ? COLOR : "var(--border)"}` }}>{e.sent ? "✓" : ""}</button>
              <div><label className={labelClass}>When</label><input className={inputClass} value={e.date} onChange={(ev) => update(e.id, { date: ev.target.value })}/></div>
              <div><label className={labelClass}>Phase</label><input className={inputClass} value={e.phase} onChange={(ev) => update(e.id, { phase: ev.target.value })}/></div>
              <div className="col-span-2"><label className={labelClass}>Subject line</label><input className={inputClass} value={e.subject} onChange={(ev) => update(e.id, { subject: ev.target.value })}/></div>
              <div><label className={labelClass}>Segment</label><input className={inputClass} value={e.segment} onChange={(ev) => update(e.id, { segment: ev.target.value })}/></div>
              <div className="col-span-2 sm:col-span-6"><label className={labelClass}>CTA</label><input className={inputClass} value={e.cta} onChange={(ev) => update(e.id, { cta: ev.target.value })}/></div>
            </div>
            <button onClick={() => remove(e.id)} className="text-xs text-red-400 hover:text-red-300 inline-flex items-center gap-1 mt-2"><Trash2 size={12}/> Remove</button>
          </div>
        ))}
      </div>
    </ResourcePage>
  );
}
