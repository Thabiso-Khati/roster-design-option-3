"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ChevronLeft, ChevronDown, ChevronUp, Sparkles, Copy, RefreshCw,
  Plus, Trash2, CheckCircle, Send, MessageSquare,
  User, Building2, Mic2, Music, Tv, BookOpen, Star, AlertCircle, Mail,
} from "lucide-react";
import { loadFullContext, saveArtistContext, ArtistContext } from "@/lib/artist-context";
import { SaveButton } from "@/components/ui/save-button";
import { ExportButton } from "@/components/ui/export-button";

// ─── Types ────────────────────────────────────────────────────────────────────

type OutreachType = "pr-press" | "dsp-editorial" | "radio" | "sync" | "label-ar" | "booking" | "publisher";
type PitchStatus  = "draft" | "sent" | "opened" | "replied" | "placed" | "passed";

interface TrackerEntry {
  id: string;
  date: string;
  outreachType: OutreachType;
  outlet: string;
  contactName: string;
  subject: string;
  status: PitchStatus;
  notes: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

function FilmIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="2"/><line x1="7" y1="2" x2="7" y2="22"/>
      <line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/>
      <line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/>
      <line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/>
    </svg>
  );
}

const OUTREACH_TYPES: { id: OutreachType; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: "pr-press",      label: "PR & Press",       icon: <Mic2 size={14}/>,       desc: "Blogs, magazines, online media" },
  { id: "dsp-editorial", label: "DSP Editorial",     icon: <Music size={14}/>,      desc: "Spotify, Apple Music, Audiomack, Boomplay" },
  { id: "radio",         label: "Radio",             icon: <Tv size={14}/>,         desc: "Radio stations & presenters" },
  { id: "sync",          label: "Sync & Licensing",  icon: <FilmIcon size={14}/>,   desc: "TV, film, ads, games" },
  { id: "label-ar",      label: "Label / A&R",       icon: <Building2 size={14}/>,  desc: "Labels, distribution deals" },
  { id: "booking",       label: "Booking Agent",     icon: <Star size={14}/>,       desc: "Festivals, shows, tours" },
  { id: "publisher",     label: "Publisher",         icon: <BookOpen size={14}/>,   desc: "Music publishing deals" },
];

const STATUS_CONFIG: Record<PitchStatus, { label: string; color: string; bg: string }> = {
  draft:   { label: "Draft",   color: "#94A3B8", bg: "#94A3B820" },
  sent:    { label: "Sent",    color: "#60A5FA", bg: "#60A5FA20" },
  opened:  { label: "Opened",  color: "#F59E0B", bg: "#F59E0B20" },
  replied: { label: "Replied", color: "#A78BFA", bg: "#A78BFA20" },
  placed:  { label: "Placed",  color: "#34D399", bg: "#34D39920" },
  passed:  { label: "Passed",  color: "#F87171", bg: "#F8717120" },
};

const ACCENT = "#EC4899";
const STORAGE_KEY = "roster_pitch_tracker_v1";
const CTX_FIELDS: { key: keyof ArtistContext; label: string; placeholder: string }[] = [
  { key: "artistName",        label: "Artist name",          placeholder: "e.g. Nasty C" },
  { key: "genre",             label: "Genre",                placeholder: "e.g. Hip-Hop, Amapiano" },
  { key: "market",            label: "Primary market",       placeholder: "e.g. South Africa, Nigeria" },
  { key: "recentRelease",     label: "Most recent release",  placeholder: "e.g. 'ZULU MAN WITH SOME POWER'" },
  { key: "streamingNumbers",  label: "Streaming numbers",    placeholder: "e.g. 4M monthly Spotify listeners" },
  { key: "pressHighlights",   label: "Press highlights",     placeholder: "e.g. Rolling Stone cover, OkayAfrica feature" },
  { key: "playlistFeatures",  label: "Playlist features",    placeholder: "e.g. Spotify Afrobeats (480k), Apple Music Africa" },
  { key: "managerName",       label: "Your name (manager)",  placeholder: "e.g. Thabiso" },
  { key: "managerEmail",      label: "Your email",           placeholder: "e.g. you@example.com" },
];

function uid() { return Math.random().toString(36).slice(2, 9); }

// ─── Component ────────────────────────────────────────────────────────────────

export default function PitchingScriptsPage() {
  const handleExportPDF = () => { window.print(); };
  const [ctx, setCtx]               = useState<ArtistContext | null>(null);
  const [ctxOpen, setCtxOpen]       = useState(false);
  const [ctxFields, setCtxFields]   = useState<Partial<ArtistContext>>({});

  const [outreachType, setOutreachType]           = useState<OutreachType>("pr-press");
  const [outlet, setOutlet]                       = useState("");
  const [contactName, setContactName]             = useState("");
  const [contactFocus, setContactFocus]           = useState("");
  const [additionalContext, setAdditionalContext] = useState("");

  const [generating, setGenerating]           = useState(false);
  const [editedSubject, setEditedSubject]     = useState("");
  const [editedPitch, setEditedPitch]         = useState("");
  const [error, setError]                     = useState("");
  const [copied, setCopied]                   = useState(false);

  const [tracker, setTracker]       = useState<TrackerEntry[]>([]);
  const [trackerOpen, setTrackerOpen] = useState(false);

  useEffect(() => {
    const loaded = loadFullContext();
    setCtx(loaded);
    if (loaded) setCtxFields(loaded as Partial<ArtistContext>);
    else setCtxOpen(true);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setTracker(JSON.parse(raw) as TrackerEntry[]);
        return;
      }
    } catch {}
    fetch(`/api/tools/save?slug=pitching-scripts`)
      .then(r => r.json())
      .then(({ snapshot }) => {
        if (!snapshot?.data) return;
        const d = snapshot.data as TrackerEntry[];
        setTracker(d);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {}
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const saveTracker = useCallback((entries: TrackerEntry[]) => {
    setTracker(entries);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, []);

  const mergedCtx = (): ArtistContext => ({
    artistName:      (ctxFields.artistName      || ctx?.artistName      || "Your Artist") as string,
    genre:           (ctxFields.genre           || ctx?.genre           || "") as string,
    market:          (ctxFields.market          || ctx?.market          || "") as string,
    careerStage:     (ctxFields.careerStage     || ctx?.careerStage     || "developing") as ArtistContext["careerStage"],
    archetype:       ctxFields.archetype        || ctx?.archetype,
    brandVoice:      ctxFields.brandVoice       || ctx?.brandVoice,
    recentRelease:   ctxFields.recentRelease    || ctx?.recentRelease,
    streamingNumbers: ctxFields.streamingNumbers || ctx?.streamingNumbers,
    pressHighlights:  ctxFields.pressHighlights  || ctx?.pressHighlights,
    playlistFeatures: ctxFields.playlistFeatures || ctx?.playlistFeatures,
    managerName:     ctxFields.managerName      || ctx?.managerName,
    managerEmail:    ctxFields.managerEmail     || ctx?.managerEmail,
  });

  const handleGenerate = async () => {
    if (!outlet.trim()) { setError("Enter the outlet or platform name."); return; }
    setError("");
    setGenerating(true);
    setEditedSubject("");
    setEditedPitch("");
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "pitch-generate",
          artistContext: mergedCtx(),
          params: { outreachType, outlet, contactName, contactFocus, additionalContext },
        }),
      });
      if (!res.ok) throw new Error("Generation failed — check your API key in .env.local");
      const { result, error: apiErr } = await res.json();
      if (apiErr) throw new Error(apiErr);

      const lines = (result as string).split("\n");
      const subLine = lines.find(l => l.startsWith("SUBJECT:"));
      const subject = subLine ? subLine.replace("SUBJECT:", "").trim() : "";
      const body = lines.filter(l => !l.startsWith("SUBJECT:")).join("\n").replace(/^\n+/, "").trim();
      setEditedSubject(subject);
      setEditedPitch(body);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subject: ${editedSubject}\n\n${editedPitch}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddToTracker = () => {
    const entry: TrackerEntry = {
      id: uid(), date: new Date().toISOString().split("T")[0],
      outreachType, outlet, contactName, subject: editedSubject, status: "draft", notes: "",
    };
    saveTracker([entry, ...tracker]);
    setTrackerOpen(true);
  };

  const hasCtx = !!(ctxFields.artistName || ctx?.artistName);
  const showResult = editedPitch || generating;

  return (
    <div className="animate-fade-in max-w-4xl">
      <Link href="/dashboard/library/marketing" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary mb-6 transition-colors">
        <ChevronLeft size={15}/>Back to Marketing
      </Link>

      {/* Header */}
      <div className="glass-card rounded-2xl p-6 mb-6" style={{ borderColor: `${ACCENT}25` }}>
        <div className="flex items-center gap-4">
          <SaveButton toolSlug="pitching-scripts" storageKey={STORAGE_KEY} title={`Pitching Scripts — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
            <ExportButton onPDF={handleExportPDF} />

          <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${ACCENT}15` }}>
            <Mail size={26} style={{ color: ACCENT }}/>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: ACCENT }}>AI-Powered · Personalised</p>
            <h1 className="text-2xl font-black text-text-primary">Pitching Scripts CRM</h1>
            <p className="text-sm text-text-muted mt-0.5">Outreach written around your artist, your target, your specific ask. Not a template.</p>
          </div>
        </div>
      </div>

      {/* Artist Context Panel */}
      <div className="glass-card rounded-xl mb-5 overflow-hidden">
        <button onClick={() => setCtxOpen(v => !v)} className="w-full flex items-center justify-between px-5 py-3.5 text-left">
          <div className="flex items-center gap-3">
            <User size={15} className="text-text-muted"/>
            <span className="text-sm font-semibold text-text-primary">
              {hasCtx ? `Artist: ${ctxFields.artistName || ctx?.artistName}` : "⚠️  Set up your artist profile first"}
            </span>
            {hasCtx && <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded" style={{ color: ACCENT, backgroundColor: `${ACCENT}15` }}>Ready</span>}
          </div>
          {ctxOpen ? <ChevronUp size={15} className="text-text-muted"/> : <ChevronDown size={15} className="text-text-muted"/>}
        </button>

        {ctxOpen && (
          <div className="px-5 pb-5 border-t border-border pt-4">
            <p className="text-xs text-text-muted mb-4">The AI uses this to write pitches that sound specific, not generic. Fill in as much as you have.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CTX_FIELDS.map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">{label}</label>
                  <input
                    value={(ctxFields[key] as string) || ""}
                    onChange={e => setCtxFields(p => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-brand/40"/>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => { saveArtistContext(ctxFields); setCtxOpen(false); }}
                className="px-4 py-2 rounded-lg text-sm font-bold transition-all" style={{ color: "#fff", backgroundColor: ACCENT }}>
                Save & continue
              </button>
              <button onClick={() => setCtxOpen(false)} className="px-4 py-2 rounded-lg text-sm text-text-muted hover:text-text-primary transition-colors">
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pitch Builder */}
      <div className="glass-card rounded-xl p-6 mb-5">
        <p className="text-[10px] font-black uppercase tracking-widest mb-4 text-text-muted">Who are you pitching?</p>

        {/* Outreach type */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
          {OUTREACH_TYPES.map(t => (
            <button key={t.id} onClick={() => setOutreachType(t.id)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-left border transition-all"
              style={outreachType === t.id
                ? { color: ACCENT, backgroundColor: `${ACCENT}12`, borderColor: `${ACCENT}40` }
                : { color: "var(--text-muted)", borderColor: "var(--border)" }}>
              <span className="flex-shrink-0">{t.icon}</span>
              <span className="text-xs font-semibold leading-tight">{t.label}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">Outlet / platform <span style={{ color: ACCENT }}>*</span></label>
            <input value={outlet} onChange={e => setOutlet(e.target.value)} placeholder="e.g. OkayAfrica, Trident Music, Apple Music Africa"
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-brand/40"/>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">Contact name (optional)</label>
            <input value={contactName} onChange={e => setContactName(e.target.value)} placeholder="e.g. Siya Dube"
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-brand/40"/>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">Their editorial focus or what they care about</label>
            <input value={contactFocus} onChange={e => setContactFocus(e.target.value)}
              placeholder="e.g. Afrobeats editorial, independent SA hip-hop, sync for lifestyle brands, emerging African acts"
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-brand/40"/>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">Your specific ask / additional context (optional)</label>
            <textarea value={additionalContext} onChange={e => setAdditionalContext(e.target.value)} rows={2}
              placeholder="e.g. Asking for editorial playlist consideration for 'Lagos Nights'. Just completed a support slot for Burna Boy."
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-brand/40 resize-none"/>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-400 mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertCircle size={14}/>{error}
          </div>
        )}

        <button onClick={handleGenerate} disabled={generating}
          className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
          style={{ color: "#fff", backgroundColor: ACCENT }}>
          <Sparkles size={16} className={generating ? "animate-spin" : ""}/>
          {generating ? "Writing your pitch…" : "Generate personalised pitch"}
        </button>
      </div>

      {/* Result */}
      {showResult && (
        <div className="glass-card rounded-xl p-6 mb-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: ACCENT }}>Your pitch — edit directly</p>
            <div className="flex gap-2">
              <button onClick={handleGenerate} disabled={generating}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-text-muted hover:text-text-primary hover:bg-surface-2 transition-all">
                <RefreshCw size={12}/>Regenerate
              </button>
              <button onClick={handleCopy} disabled={!editedPitch}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                style={{ color: ACCENT, backgroundColor: `${ACCENT}15` }}>
                {copied ? <><CheckCircle size={12}/>Copied!</> : <><Copy size={12}/>Copy all</>}
              </button>
            </div>
          </div>

          {generating ? (
            <div className="space-y-2.5">
              {[100,85,92,70,88,60,75].map((w,i) => (
                <div key={i} className="h-3.5 rounded animate-pulse bg-surface-2" style={{ width: `${w}%` }}/>
              ))}
            </div>
          ) : (
            <>
              <div className="mb-3">
                <label className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">Subject line</label>
                <input value={editedSubject} onChange={e => setEditedSubject(e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm font-semibold text-text-primary focus:outline-none focus:border-brand/40"/>
              </div>
              <div className="mb-4">
                <label className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">Email body</label>
                <textarea value={editedPitch} onChange={e => setEditedPitch(e.target.value)} rows={11}
                  className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary leading-relaxed focus:outline-none focus:border-brand/40 resize-none"/>
              </div>
              <div className="flex gap-2">
                <button onClick={handleAddToTracker}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all"
                  style={{ color: ACCENT, backgroundColor: `${ACCENT}15` }}>
                  <Plus size={14}/>Add to tracker
                </button>
                <button onClick={handleCopy}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm text-text-muted hover:text-text-primary hover:bg-surface-2 transition-all">
                  {copied ? <><CheckCircle size={14}/>Copied</> : <><Copy size={14}/>Copy</>}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* CRM Tracker */}
      <div className="glass-card rounded-xl overflow-hidden mb-6">
        <button onClick={() => setTrackerOpen(v => !v)} className="w-full flex items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-3">
            <Send size={15} className="text-text-muted"/>
            <span className="text-sm font-semibold text-text-primary">Outreach tracker</span>
            {tracker.length > 0 && (
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded" style={{ color: ACCENT, backgroundColor: `${ACCENT}15` }}>{tracker.length}</span>
            )}
          </div>
          {trackerOpen ? <ChevronUp size={15} className="text-text-muted"/> : <ChevronDown size={15} className="text-text-muted"/>}
        </button>

        {trackerOpen && (
          <div className="border-t border-border">
            {tracker.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-text-muted">Generate a pitch and add it to the tracker to start logging your outreach.</p>
            ) : (
              <div className="divide-y divide-border">
                {tracker.map(entry => (
                  <div key={entry.id} className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="text-sm font-bold text-text-primary">{entry.outlet}</span>
                          {entry.contactName && <span className="text-xs text-text-muted">· {entry.contactName}</span>}
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded"
                            style={{ color: STATUS_CONFIG[entry.status].color, backgroundColor: STATUS_CONFIG[entry.status].bg }}>
                            {STATUS_CONFIG[entry.status].label}
                          </span>
                        </div>
                        <p className="text-xs text-text-muted mb-2 truncate">Re: {entry.subject}</p>
                        <div className="flex flex-wrap gap-1">
                          {(["draft","sent","opened","replied","placed","passed"] as PitchStatus[]).map(s => (
                            <button key={s} onClick={() => saveTracker(tracker.map(e => e.id === entry.id ? { ...e, status: s } : e))}
                              className="text-[10px] font-semibold px-2 py-0.5 rounded transition-all"
                              style={entry.status === s
                                ? { color: STATUS_CONFIG[s].color, backgroundColor: STATUS_CONFIG[s].bg }
                                : { color: "var(--text-muted)", backgroundColor: "var(--surface-2)" }}>
                              {STATUS_CONFIG[s].label}
                            </button>
                          ))}
                        </div>
                        <input value={entry.notes}
                          onChange={e => saveTracker(tracker.map(en => en.id === entry.id ? { ...en, notes: e.target.value } : en))}
                          placeholder="Add notes…"
                          className="w-full mt-2 bg-transparent border-b border-border/50 py-1 text-xs text-text-muted placeholder:text-text-muted/40 focus:outline-none"/>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="text-[10px] text-text-muted">{entry.date}</span>
                        <button onClick={() => saveTracker(tracker.filter(e => e.id !== entry.id))}
                          className="p-1 text-text-muted hover:text-red-400 transition-colors">
                          <Trash2 size={13}/>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="glass-card rounded-xl p-4 flex items-start gap-3" style={{ borderColor: "rgba(201,168,76,0.15)", backgroundColor: "rgba(201,168,76,0.04)" }}>
        <MessageSquare size={14} className="flex-shrink-0 mt-0.5" style={{ color: "#C9A84C" }}/>
        <p className="text-xs text-text-muted leading-relaxed">
          <span className="font-semibold" style={{ color: "#C9A84C" }}>AI writes the first draft — you own the relationship.</span> Always review and personalise before sending. The more detail you put into your artist profile, the more specific and effective the output.
        </p>
      </div>
    </div>
  );
}
