"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, Zap, RefreshCw, Copy, CheckCircle, AlertCircle, Sparkles, BookmarkPlus } from "lucide-react";
import { loadFullContext, ArtistContext } from "@/lib/artist-context";
import { SaveButton } from "@/components/ui/save-button";
import { ExportButton } from "@/components/ui/export-button";
const STORAGE_KEY = "roster_saved_hooks_v1";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Hook {
  hook: string;
  structure: string;
  platform: string;
  score: number;
  why: string;
}

type ContentType = "release-teaser" | "day-in-life" | "opinion" | "origin-story" | "studio-moment" | "fan-reaction" | "challenge" | "behind-scenes";
type Platform    = "TikTok" | "Reels" | "Shorts" | "Twitter/X" | "All";
type Structure   = "mixed" | "question" | "pov" | "contrarian" | "confession" | "reveal" | "story" | "stat";

// ─── Constants ────────────────────────────────────────────────────────────────

const CONTENT_TYPES: { id: ContentType; label: string; emoji: string }[] = [
  { id: "release-teaser",  label: "Release Teaser",  emoji: "🎵" },
  { id: "day-in-life",     label: "Day in the Life", emoji: "📅" },
  { id: "opinion",         label: "Hot Take / Opinion", emoji: "🔥" },
  { id: "origin-story",    label: "Origin Story",    emoji: "🌱" },
  { id: "studio-moment",   label: "Studio Moment",   emoji: "🎙️" },
  { id: "fan-reaction",    label: "Fan Reaction",    emoji: "❤️" },
  { id: "challenge",       label: "Challenge / Trend", emoji: "⚡" },
  { id: "behind-scenes",   label: "Behind the Scenes", emoji: "🎬" },
];

const PLATFORMS: Platform[]   = ["All", "TikTok", "Reels", "Shorts", "Twitter/X"];
const STRUCTURES: { id: Structure; label: string }[] = [
  { id: "mixed",       label: "Mix it up" },
  { id: "question",    label: "Question" },
  { id: "pov",         label: "POV" },
  { id: "contrarian",  label: "Hot take" },
  { id: "confession",  label: "Confession" },
  { id: "reveal",      label: "Reveal" },
  { id: "story",       label: "Story" },
  { id: "stat",        label: "Stat / Fact" },
];

const ACCENT = "#F59E0B";

function scoreColor(score: number) {
  if (score >= 9) return "#34D399";
  if (score >= 7) return "#F59E0B";
  return "#94A3B8";
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ViralHooksPage() {
  const handleExportPDF = () => { window.print(); };
  const [ctx, setCtx]               = useState<ArtistContext | null>(null);
  const [contentType, setContentType] = useState<ContentType>("release-teaser");
  const [platform, setPlatform]     = useState<Platform>("All");
  const [structure, setStructure]   = useState<Structure>("mixed");
  const [count, setCount]           = useState<6 | 8 | 10>(8);

  const [generating, setGenerating] = useState(false);
  const [hooks, setHooks]           = useState<Hook[]>([]);
  const [saved, setSaved]           = useState<Hook[]>([]);
  const [error, setError]           = useState("");
  const [copiedIdx, setCopiedIdx]   = useState<number | null>(null);
  const [activeTab, setActiveTab]   = useState<"generate" | "saved">("generate");

  useEffect(() => {
    const loaded = loadFullContext();
    setCtx(loaded);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setSaved(JSON.parse(raw) as Hook[]);
        return;
      }
    } catch {}
    fetch(`/api/tools/save?slug=viral-hooks`)
      .then(r => r.json())
      .then(({ snapshot }) => {
        if (!snapshot?.data) return;
        const d = snapshot.data as Hook[];
        setSaved(d);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {}
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const saveSaved = (hooks: Hook[]) => {
    setSaved(hooks);
    localStorage.setItem("roster_saved_hooks_v1", JSON.stringify(hooks));
  };

  const handleGenerate = async () => {
    setError("");
    setGenerating(true);
    setHooks([]);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "hooks-generate",
          artistContext: ctx || {
            artistName: "Your Artist", genre: "Afrobeats", market: "South Africa", careerStage: "developing",
          },
          params: {
            contentType: CONTENT_TYPES.find(c => c.id === contentType)?.label,
            platform,
            hookStructure: structure === "mixed" ? "varied — use multiple structures" : structure,
            count: String(count),
          },
        }),
      });
      if (!res.ok) throw new Error("Generation failed — check your API key in .env.local");
      const { result, error: apiErr } = await res.json();
      if (apiErr) throw new Error(apiErr);

      // Parse JSON from result
      const jsonMatch = (result as string).match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("Unexpected response format. Try regenerating.");
      const parsed: Hook[] = JSON.parse(jsonMatch[0]);
      setHooks(parsed);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleSave = (hook: Hook) => {
    if (!saved.find(h => h.hook === hook.hook)) {
      saveSaved([hook, ...saved]);
    }
  };

  const handleUnsave = (hook: Hook) => {
    saveSaved(saved.filter(h => h.hook !== hook.hook));
  };

  const HookCard = ({ hook, idx, isSaved }: { hook: Hook; idx: number; isSaved?: boolean }) => (
    <div className="glass-card rounded-xl p-4 group">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black"
          style={{ backgroundColor: `${scoreColor(hook.score)}20`, color: scoreColor(hook.score) }}>
          {hook.score}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-text-primary leading-snug mb-2">&ldquo;{hook.hook}&rdquo;</p>
          <div className="flex flex-wrap gap-1.5 mb-2">
            <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded" style={{ color: ACCENT, backgroundColor: `${ACCENT}15` }}>
              {hook.structure}
            </span>
            <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-surface-2 text-text-muted">
              {hook.platform}
            </span>
          </div>
          <p className="text-xs text-text-muted leading-relaxed">{hook.why}</p>
        </div>
        <div className="flex flex-col gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => handleCopy(hook.hook, idx)}
            className="p-1.5 rounded-lg text-text-muted hover:text-brand hover:bg-brand/10 transition-all">
            {copiedIdx === idx ? <CheckCircle size={14} className="text-green-400"/> : <Copy size={14}/>}
          </button>
          {isSaved ? (
            <button onClick={() => handleUnsave(hook)}
              className="p-1.5 rounded-lg transition-all" style={{ color: ACCENT }}>
              <BookmarkPlus size={14}/>
            </button>
          ) : (
            <button onClick={() => handleSave(hook)}
              className="p-1.5 rounded-lg text-text-muted hover:text-brand hover:bg-brand/10 transition-all">
              <BookmarkPlus size={14}/>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in max-w-4xl">
      <Link href="/dashboard/library/marketing" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary mb-6 transition-colors">
        <ChevronLeft size={15}/>Back to Marketing
      </Link>

      {/* Header */}
      <div className="glass-card rounded-2xl p-6 mb-6" style={{ borderColor: `${ACCENT}25` }}>
        <div className="flex items-center gap-4">
          <SaveButton toolSlug="viral-hooks" storageKey={STORAGE_KEY} title={`Viral Hooks — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
            <ExportButton onPDF={handleExportPDF} />

          <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${ACCENT}15` }}>
            <Zap size={26} style={{ color: ACCENT }}/>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: ACCENT }}>AI-Generated · Brand Book Aware</p>
            <h1 className="text-2xl font-black text-text-primary">Viral Hooks Engine</h1>
            <p className="text-sm text-text-muted mt-0.5">
              {ctx?.artistName
                ? `Hooks written for ${ctx.artistName} — ${ctx.archetype || ctx.genre || "your artist"}. Not for everyone. For them.`
                : "Set up your Brand Book to get hooks tuned to your artist's voice and archetype."}
            </p>
          </div>
        </div>
      </div>

      {/* Context status */}
      {!ctx && (
        <div className="flex items-start gap-3 p-4 rounded-xl mb-5 border" style={{ borderColor: `${ACCENT}30`, backgroundColor: `${ACCENT}08` }}>
          <AlertCircle size={15} style={{ color: ACCENT }} className="flex-shrink-0 mt-0.5"/>
          <p className="text-sm text-text-muted">
            No Brand Book found.{" "}
            <Link href="/dashboard/library/marketing/brand-studio" className="font-semibold underline" style={{ color: ACCENT }}>
              Complete Brand Studio
            </Link>
            {" "}first for hooks that sound like your artist. Or generate now for generic results.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-0 border-b border-border mb-6">
        {[
          { id: "generate", label: "Generate" },
          { id: "saved",    label: `Saved${saved.length > 0 ? ` (${saved.length})` : ""}` },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as "generate" | "saved")}
            className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 -mb-px ${
              activeTab === t.id ? "border-brand text-brand" : "border-transparent text-text-muted hover:text-text-primary"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "generate" && (
        <>
          {/* Controls */}
          <div className="glass-card rounded-xl p-5 mb-5 space-y-5">
            {/* Content type */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2.5">Content type</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CONTENT_TYPES.map(t => (
                  <button key={t.id} onClick={() => setContentType(t.id)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-left"
                    style={contentType === t.id
                      ? { color: ACCENT, backgroundColor: `${ACCENT}12`, borderColor: `${ACCENT}40` }
                      : { color: "var(--text-muted)", borderColor: "var(--border)" }}>
                    <span>{t.emoji}</span>{t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Platform + Structure + Count */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Platform</p>
                <div className="flex flex-wrap gap-1.5">
                  {PLATFORMS.map(p => (
                    <button key={p} onClick={() => setPlatform(p)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all"
                      style={platform === p
                        ? { color: ACCENT, backgroundColor: `${ACCENT}12`, borderColor: `${ACCENT}40` }
                        : { color: "var(--text-muted)", borderColor: "var(--border)" }}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Hook structure</p>
                <div className="flex flex-wrap gap-1.5">
                  {STRUCTURES.map(s => (
                    <button key={s.id} onClick={() => setStructure(s.id)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all"
                      style={structure === s.id
                        ? { color: ACCENT, backgroundColor: `${ACCENT}12`, borderColor: `${ACCENT}40` }
                        : { color: "var(--text-muted)", borderColor: "var(--border)" }}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">How many</p>
                <div className="flex gap-1.5">
                  {([6, 8, 10] as const).map(n => (
                    <button key={n} onClick={() => setCount(n)}
                      className="px-3 py-1 rounded-lg text-xs font-bold border transition-all"
                      style={count === n
                        ? { color: ACCENT, backgroundColor: `${ACCENT}12`, borderColor: `${ACCENT}40` }
                        : { color: "var(--text-muted)", borderColor: "var(--border)" }}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-400 mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <AlertCircle size={14}/>{error}
            </div>
          )}

          <div className="flex items-center gap-3 mb-6">
            <button onClick={handleGenerate} disabled={generating}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
              style={{ color: "#fff", backgroundColor: ACCENT }}>
              <Sparkles size={16} className={generating ? "animate-spin" : ""}/>
              {generating ? `Generating ${count} hooks…` : `Generate ${count} hooks`}
            </button>
            {hooks.length > 0 && (
              <button onClick={handleGenerate} disabled={generating}
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-text-muted hover:text-text-primary hover:bg-surface-2 transition-all">
                <RefreshCw size={14}/>Regenerate
              </button>
            )}
          </div>

          {/* Hooks */}
          {generating && (
            <div className="space-y-3">
              {[...Array(count)].map((_, i) => (
                <div key={i} className="glass-card rounded-xl p-4 animate-pulse">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-surface-2"/>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-surface-2 rounded w-3/4"/>
                      <div className="h-3 bg-surface-2 rounded w-1/4"/>
                      <div className="h-3 bg-surface-2 rounded w-full"/>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!generating && hooks.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-text-muted">{hooks.length} hooks generated · Score out of 10</p>
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <span className="w-2 h-2 rounded-full bg-green-400 inline-block"/>≥9 killer
                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"/>≥7 solid
                  <span className="w-2 h-2 rounded-full bg-slate-400 inline-block"/>test it
                </div>
              </div>
              <div className="space-y-3">
                {[...hooks].sort((a, b) => b.score - a.score).map((hook, i) => (
                  <HookCard key={i} hook={hook} idx={i}/>
                ))}
              </div>
            </>
          )}

          {!generating && hooks.length === 0 && (
            <div className="glass-card rounded-xl p-10 text-center">
              <Zap size={32} className="mx-auto mb-3 text-text-muted opacity-40"/>
              <p className="text-sm text-text-muted">Select your content type and hit generate.</p>
              <p className="text-xs text-text-muted opacity-60 mt-1">
                {ctx ? `Hooks will be tailored to ${ctx.artistName}${ctx.archetype ? ` — ${ctx.archetype}` : ""}.` : "Complete your Brand Book for personalised hooks."}
              </p>
            </div>
          )}
        </>
      )}

      {activeTab === "saved" && (
        <>
          {saved.length === 0 ? (
            <div className="glass-card rounded-xl p-10 text-center">
              <BookmarkPlus size={32} className="mx-auto mb-3 text-text-muted opacity-40"/>
              <p className="text-sm text-text-muted">No saved hooks yet.</p>
              <p className="text-xs text-text-muted opacity-60 mt-1">Generate hooks and bookmark the ones you want to use.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {saved.map((hook, i) => (
                <HookCard key={i} hook={hook} idx={i} isSaved/>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
