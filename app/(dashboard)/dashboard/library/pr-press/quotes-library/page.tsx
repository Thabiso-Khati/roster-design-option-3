"use client";
import { Plus, Trash2, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { ResourcePage, inputClass, labelClass, useLocalState } from "@/components/library/module-shell";
import { SaveButton } from "@/components/ui/save-button";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";

const COLOR = "#F472B6";
const STORAGE_KEY = "roster_quotes_library_v1";

interface Quote {
  id: string;
  topic: string;
  context: string;
  quote: string;
  attribution: string;
  approvedBy: string;
  lastUsed: string;
  notes: string;
}

const newQuote = (): Quote => ({
  id: Math.random().toString(36).slice(2, 8),
  topic: "Music / sound", context: "", quote: "", attribution: "Artist", approvedBy: "", lastUsed: "", notes: "",
});

const SEED_QUOTES: Quote[] = [
  {
    id: "s1", topic: "Origin / influences", context: "Use for press intros / first-time profiles",
    quote: "I grew up between two languages, two cities, two ways of hearing rhythm. The music I make is what came out when I stopped translating.",
    attribution: "Artist", approvedBy: "Manager + Artist", lastUsed: "", notes: "Adjustable per outlet — edit specifics."
  },
  {
    id: "s2", topic: "Music / sound", context: "Use for music-led pieces (album reviews, song features)",
    quote: "I'm not trying to make global music. I'm making music in my voice and trusting that the world has room for it.",
    attribution: "Artist", approvedBy: "Manager + Artist", lastUsed: "", notes: "Strong opener; works for radio + print."
  },
  {
    id: "s3", topic: "Live shows", context: "Pre-tour announcements / festival press",
    quote: "Live is the only honest version. Everything else can be edited. On stage I either deliver or I don't, and the room knows immediately.",
    attribution: "Artist", approvedBy: "Manager + Artist", lastUsed: "", notes: "Use sparingly — high-impact quote."
  },
  {
    id: "s4", topic: "Industry / business", context: "Use for industry / trade press (Music Ally, Variety Africa, etc.)",
    quote: "We're past the moment where African artists need permission from the global industry. The audience is here, the data is here, the infrastructure is finally being built. The conversation is what we choose to do with it.",
    attribution: "Artist or Manager", approvedBy: "Manager + Artist", lastUsed: "", notes: "Manager-attributable variant available."
  },
  {
    id: "s5", topic: "Industry / business", context: "Manager-led quote for trade press",
    quote: "[Artist] doesn't sit between two markets. They sit at the centre of one — the one they grew up in — and that's where the work starts.",
    attribution: "Manager", approvedBy: "Manager + Artist", lastUsed: "", notes: "Reframes 'crossover' narrative."
  },
  {
    id: "s6", topic: "Brand / sponsorship", context: "Brand-partnership announcements",
    quote: "I work with people whose values overlap with mine. Not partners — overlaps. The deal works when the audiences see themselves in both directions.",
    attribution: "Artist", approvedBy: "Manager + Artist + brand", lastUsed: "", notes: "Always co-approve with brand legal."
  },
  {
    id: "s7", topic: "Awards / accolades", context: "Award nomination / win announcements",
    quote: "Awards land different here — they're not just industry recognition, they're a signal to the wider region that this music is travelling. Grateful, and back to work.",
    attribution: "Artist", approvedBy: "Manager + Artist", lastUsed: "", notes: "Humble + forward-looking."
  },
  {
    id: "s8", topic: "Crisis / clarification", context: "Where a holding quote is needed quickly",
    quote: "We're aware. We're taking it seriously. We'll respond fully when we have the full picture — not before.",
    attribution: "Manager", approvedBy: "Manager + lawyer", lastUsed: "", notes: "Buys time without admitting / denying. Always lawyer-reviewed."
  },
];

const TOPICS = ["Origin / influences", "Music / sound", "Songwriting", "Production", "Live shows", "Industry / business", "Brand / sponsorship", "Collaborations", "Awards / accolades", "Family / personal", "Crisis / clarification", "Other"];

export default function QuotesLibraryPage() {
  const [quotes, setQuotes] = useLocalState<Quote[]>(STORAGE_KEY, SEED_QUOTES);
  useToolRestore("quotes-library", STORAGE_KEY, setQuotes);
  const [filterTopic, setFilterTopic] = useState("All");
  const [search, setSearch] = useState("");

  const update = (id: string, p: Partial<Quote>) => setQuotes(quotes.map((q) => (q.id === id ? { ...q, ...p } : q)));
  const remove = (id: string) => setQuotes(quotes.filter((q) => q.id !== id));

  const filtered = useMemo(() => quotes.filter((q) => {
    if (filterTopic !== "All" && q.topic !== filterTopic) return false;
    if (search && !`${q.quote} ${q.context}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [quotes, filterTopic, search]);

  return (
    <ResourcePage
      parentHref="/dashboard/library/pr-press"
      parentLabel="Back to PR, Press and Awards"
      color={COLOR}
      tag="PR · Reference"
      title="Quotes Library"
      intro="Pre-approved quotes the artist (or manager) is ready to use. Saves the hour-long 'what should I say to journalist X' loop. Add quotes per topic, mark as approved, copy when needed."
      toolbar={<><SaveButton toolSlug="quotes-library" storageKey={STORAGE_KEY} title={`Quotes Library — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
          
        <button onClick={() => setQuotes([...quotes, newQuote()])} className="text-xs font-semibold inline-flex items-center gap-1 px-3 py-1.5 rounded-lg" style={{ backgroundColor: `${COLOR}15`, color: COLOR }}>
          <Plus size={13}/> Add quote
        </button>
            </>
      }
      next={{ href: "/dashboard/library/pr-press/crisis-comms-playbook", label: "Crisis Comms Playbook" }}
    >
      <div className="glass-card rounded-2xl p-4 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"/>
          <input className={`${inputClass} pl-9`} placeholder="Search quotes / context..." value={search} onChange={(e) => setSearch(e.target.value)}/>
        </div>
        <select className={inputClass} value={filterTopic} onChange={(e) => setFilterTopic(e.target.value)}>
          <option>All</option>
          {TOPICS.map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>

      <div className="space-y-3">
        {filtered.map((q) => (
          <div key={q.id} className="glass-card rounded-2xl p-5">
            <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{ color: COLOR, backgroundColor: `${COLOR}15` }}>{q.topic}</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{ color: "#10B981", backgroundColor: "#10B98115" }}>{q.attribution}</span>
              </div>
              <button onClick={() => navigator.clipboard.writeText(q.quote)} className="text-xs text-text-muted hover:text-text-primary">Copy</button>
            </div>
            <blockquote className="text-sm text-text-primary italic leading-relaxed mb-3 pl-4 border-l-2" style={{ borderColor: COLOR }}>
              "{q.quote}"
            </blockquote>
            <p className="text-xs text-text-muted mb-3">{q.context}</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div><label className={labelClass}>Topic</label><select className={inputClass} value={q.topic} onChange={(e) => update(q.id, { topic: e.target.value })}>{TOPICS.map((t) => <option key={t}>{t}</option>)}</select></div>
              <div><label className={labelClass}>Attribution</label><select className={inputClass} value={q.attribution} onChange={(e) => update(q.id, { attribution: e.target.value })}><option>Artist</option><option>Manager</option><option>Artist or Manager</option><option>Other</option></select></div>
              <div><label className={labelClass}>Approved by</label><input className={inputClass} value={q.approvedBy} onChange={(e) => update(q.id, { approvedBy: e.target.value })}/></div>
              <div><label className={labelClass}>Last used</label><input type="date" className={inputClass} value={q.lastUsed} onChange={(e) => update(q.id, { lastUsed: e.target.value })}/></div>
              <div className="col-span-2 sm:col-span-4"><label className={labelClass}>Quote text</label><textarea className={inputClass} rows={2} value={q.quote} onChange={(e) => update(q.id, { quote: e.target.value })}/></div>
              <div className="col-span-2 sm:col-span-4"><label className={labelClass}>Context / when to use</label><input className={inputClass} value={q.context} onChange={(e) => update(q.id, { context: e.target.value })}/></div>
              <div className="col-span-2 sm:col-span-4"><label className={labelClass}>Notes</label><textarea className={inputClass} rows={2} value={q.notes} onChange={(e) => update(q.id, { notes: e.target.value })}/></div>
            </div>
            <button onClick={() => remove(q.id)} className="text-xs text-red-400 hover:text-red-300 inline-flex items-center gap-1 mt-3"><Trash2 size={11}/> Remove</button>
          </div>
        ))}
      </div>
    </ResourcePage>
  );
}
