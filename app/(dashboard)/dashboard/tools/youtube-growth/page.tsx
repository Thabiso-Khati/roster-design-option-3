"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ChevronLeft, PlayCircle, TrendingUp, Zap, DollarSign,
  CheckSquare, Square, Copy, Check, ChevronDown, ChevronUp,
  AlertCircle, RefreshCw, ExternalLink
} from "lucide-react";
import { loadFullContext } from "@/lib/artist-context";
import { SaveButton } from "@/components/ui/save-button";
import { ExportButton } from "@/components/ui/export-button";

const MODULE_COLOR = "#EF4444";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "audit" | "revenue" | "health";

interface ChannelInputs {
  channelName: string;
  subscriberCount: string;
  avgViews: string;
  topVideo: string;
  uploadFrequency: string;
  recentTitles: string;
  thumbnailStyle: string;
  monetised: string;
}

interface AuditSection {
  heading: string;
  body: string;
}

// ─── Revenue milestone data ───────────────────────────────────────────────────

interface Milestone {
  id: string;
  label: string;
  sublabel: string;
  threshold: { subs?: number; watchHours?: number; views?: number };
  reward: string;
  tip: string;
  color: string;
}

const MILESTONES: Milestone[] = [
  {
    id: "ypp-eligible",
    label: "YPP Eligible",
    sublabel: "YouTube Partner Programme",
    threshold: { subs: 1000, watchHours: 4000 },
    reward: "Ad revenue unlocked. Enable monetisation in YouTube Studio.",
    tip: "Watch hours accrue fastest from long-form videos (8 min+). One viral video can do it.",
    color: "#F59E0B",
  },
  {
    id: "silver",
    label: "Silver Play Button",
    sublabel: "100K subscribers",
    threshold: { subs: 100000 },
    reward: "Silver Play Button award. Milestone for press and booking leverage.",
    tip: "At 100K you're a credible digital asset. Use it in pitch decks and booking proposals.",
    color: "#94A3B8",
  },
  {
    id: "gold",
    label: "Gold Play Button",
    sublabel: "1M subscribers",
    threshold: { subs: 1000000 },
    reward: "Gold Play Button. Major press milestone. Global booking rate increase.",
    tip: "1M subscribers commands a minimum fee premium of 2–3× artist-without-channel of same stream count.",
    color: "#F59E0B",
  },
  {
    id: "diamond",
    label: "Diamond Play Button",
    sublabel: "10M subscribers",
    threshold: { subs: 10000000 },
    reward: "Diamond Play Button. Global superstar-tier digital presence.",
    tip: "Only ~2,000 channels globally. Major label leverage and brand partnership territory.",
    color: "#06B6D4",
  },
];

// ─── Health check items ───────────────────────────────────────────────────────

const HEALTH_CHECKS = [
  { id: "banner", category: "Profile", text: "Channel banner is high-res (2560×1440) and matches the active release campaign" },
  { id: "pfp", category: "Profile", text: "Profile picture matches all other social platforms exactly" },
  { id: "description", category: "Profile", text: "Channel description includes bio, streaming links, socials — reviewed in the last 90 days" },
  { id: "yt-music", category: "Profile", text: "Official Artist Channel claimed on YouTube Music via distributor" },
  { id: "playlists", category: "Organisation", text: "Videos are organised into playlists: Official Videos / Live Sessions / Behind the Scenes / Shorts" },
  { id: "featured-playlist", category: "Organisation", text: "A curated playlist is set as the default shelf for new visitors" },
  { id: "shorts-active", category: "Content", text: "Shorts section has at least 4 recent Shorts (posted within last 30 days)" },
  { id: "shorts-cta", category: "Content", text: "Each Short ends with a verbal or visual CTA directing to full video or channel" },
  { id: "end-screens", category: "Content", text: "All long-form videos have end screens linking to next video + subscribe prompt" },
  { id: "cards", category: "Content", text: "Relevant older videos have cards linking to current release" },
  { id: "chapters", category: "Content", text: "All videos 8 min+ have chapter markers in the description" },
  { id: "tags", category: "SEO", text: "Every video has tags: artist name, genre, song title, featured artists" },
  { id: "vid-description", category: "SEO", text: "Every video description includes streaming links, socials, lyrics source, and credits" },
  { id: "premiere", category: "Release", text: "Most recent major release was published as a Premiere (not direct upload)" },
  { id: "pinned-comment", category: "Engagement", text: "Top 3 videos have a pinned artist comment" },
  { id: "community", category: "Engagement", text: "Community tab posted at least twice in the last 30 days" },
  { id: "analytics", category: "Intelligence", text: "YouTube Analytics reviewed in the last 30 days — top traffic sources identified" },
  { id: "ab-thumbnails", category: "Intelligence", text: "At least one video has had its thumbnail A/B tested in the last 60 days" },
];

const HEALTH_CATEGORIES = ["Profile", "Organisation", "Content", "SEO", "Release", "Engagement", "Intelligence"];

// ─── Parse AI audit response ─────────────────────────────────────────────────

function parseAuditSections(raw: string): AuditSection[] {
  const sectionHeadings = [
    "DIAGNOSIS",
    "CRITICAL FIXES",
    "TITLE INTELLIGENCE",
    "THUMBNAIL INTELLIGENCE",
    "CONTENT STRATEGY",
    "30-DAY ACTION PLAN",
  ];

  const sections: AuditSection[] = [];

  for (let i = 0; i < sectionHeadings.length; i++) {
    const heading = sectionHeadings[i];
    const nextHeading = sectionHeadings[i + 1];
    const start = raw.indexOf(heading);
    if (start === -1) continue;
    const bodyStart = start + heading.length;
    const end = nextHeading ? raw.indexOf(nextHeading) : raw.length;
    const body = raw.slice(bodyStart, end === -1 ? raw.length : end).trim();
    sections.push({ heading, body });
  }

  return sections;
}

const SECTION_ICONS: Record<string, string> = {
  "DIAGNOSIS": "🔬",
  "CRITICAL FIXES": "⚡",
  "TITLE INTELLIGENCE": "🏷️",
  "THUMBNAIL INTELLIGENCE": "🖼️",
  "CONTENT STRATEGY": "🎯",
  "30-DAY ACTION PLAN": "📅",
};

const SECTION_COLORS: Record<string, string> = {
  "DIAGNOSIS": "#8B5CF6",
  "CRITICAL FIXES": "#EF4444",
  "TITLE INTELLIGENCE": "#F59E0B",
  "THUMBNAIL INTELLIGENCE": "#06B6D4",
  "CONTENT STRATEGY": "#10B981",
  "30-DAY ACTION PLAN": "#EF4444",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function YouTubeGrowthPage() {
  const handleExportPDF = () => { window.print(); };
  const [tab, setTab] = useState<Tab>("audit");

  // Audit state
  const [inputs, setInputs] = useState<ChannelInputs>({
    channelName: "", subscriberCount: "", avgViews: "", topVideo: "",
    uploadFrequency: "", recentTitles: "", thumbnailStyle: "", monetised: "",
  });
  const [loading, setLoading] = useState(false);
  const [auditSections, setAuditSections] = useState<AuditSection[]>([]);
  const [auditError, setAuditError] = useState("");
  const [expandedSection, setExpandedSection] = useState<string | null>("DIAGNOSIS");
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [noBrandBook, setNoBrandBook] = useState(false);

  // Revenue state
  const [subCount, setSubCount] = useState("");
  const [watchHours, setWatchHours] = useState("");

  // Health state
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  // Load artist context on mount
  useEffect(() => {
    const ctx = loadFullContext();
    if (!ctx?.artistName) setNoBrandBook(true);
    if (ctx?.artistName) {
      setInputs(prev => ({ ...prev, channelName: ctx.artistName }));
    }
  }, []);

  // ── Audit ──

  const inp = (field: keyof ChannelInputs, value: string) =>
    setInputs(prev => ({ ...prev, [field]: value }));

  const runAudit = async () => {
    setLoading(true);
    setAuditError("");
    setAuditSections([]);
    setExpandedSection("DIAGNOSIS");
    try {
      const ctx = loadFullContext();
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "youtube-audit",
          artistContext: ctx,
          params: {
            channelName: inputs.channelName || ctx?.artistName,
            subscriberCount: inputs.subscriberCount,
            avgViews: inputs.avgViews,
            topVideo: inputs.topVideo,
            uploadFrequency: inputs.uploadFrequency,
            recentTitles: inputs.recentTitles,
            thumbnailStyle: inputs.thumbnailStyle,
            monetised: inputs.monetised,
          },
        }),
      });
      const data = await res.json();
      if (data.error) {
        setAuditError(data.error);
      } else {
        const sections = parseAuditSections(data.result);
        setAuditSections(sections);
      }
    } catch {
      setAuditError("Failed to reach AI. Check your network and try again.");
    } finally {
      setLoading(false);
    }
  };

  const copySection = (heading: string, body: string) => {
    navigator.clipboard.writeText(`${heading}\n\n${body}`).catch(() => {});
    setCopiedSection(heading);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  // ── Revenue ──

  const parsedSubs = parseInt(subCount.replace(/[^0-9]/g, "")) || 0;
  const parsedHours = parseInt(watchHours.replace(/[^0-9]/g, "")) || 0;

  const getMilestoneStatus = (m: Milestone) => {
    if (m.threshold.subs && m.threshold.watchHours) {
      const subsOk = parsedSubs >= m.threshold.subs;
      const hoursOk = parsedHours >= m.threshold.watchHours;
      if (subsOk && hoursOk) return "done";
      if (subsOk || hoursOk) return "partial";
      return "pending";
    }
    if (m.threshold.subs) {
      if (parsedSubs >= m.threshold.subs) return "done";
      if (parsedSubs >= m.threshold.subs * 0.5) return "partial";
      return "pending";
    }
    return "pending";
  };

  const subsProgress = (m: Milestone) => {
    if (!m.threshold.subs) return null;
    return Math.min(100, Math.round((parsedSubs / m.threshold.subs) * 100));
  };

  const hoursProgress = (m: Milestone) => {
    if (!m.threshold.watchHours) return null;
    return Math.min(100, Math.round((parsedHours / m.threshold.watchHours) * 100));
  };

  // ── Health ──

  const toggleCheck = (id: string) =>
    setChecked(prev => ({ ...prev, [id]: !prev[id] }));

  const healthDone = Object.values(checked).filter(Boolean).length;
  const healthPct = Math.round((healthDone / HEALTH_CHECKS.length) * 100);

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "audit", label: "Channel Audit", icon: <TrendingUp size={13}/> },
    { id: "revenue", label: "Revenue Milestones", icon: <DollarSign size={13}/> },
    { id: "health", label: "30-Day Health Check", icon: <Zap size={13}/> },
  ];

  return (
    <div className="animate-fade-in max-w-4xl">
      <Link
        href="/dashboard/library/marketing"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary mb-6 transition-colors"
      >
        <ChevronLeft size={15}/> Back to Marketing
      </Link>

      {/* Header */}
      <div className="glass-card rounded-2xl p-6 mb-7" style={{ borderColor: `${MODULE_COLOR}25` }}>
        <div className="flex items-center gap-4">
          <SaveButton toolSlug="youtube-growth" getData={() => {}} title={`Youtube Growth — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
            <ExportButton onPDF={handleExportPDF} />

          <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${MODULE_COLOR}15` }}>
            <PlayCircle size={26} style={{ color: MODULE_COLOR }}/>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: MODULE_COLOR }}>Work Tools</p>
            <h1 className="text-2xl font-black text-text-primary">YouTube Intelligence</h1>
            <p className="text-sm text-text-muted mt-0.5">
              AI channel diagnosis, monetisation tracking, and a 30-day health protocol — built for managers, not creators.
            </p>
          </div>
        </div>
      </div>

      {/* No Brand Book Warning */}
      {noBrandBook && (
        <div className="glass-card rounded-xl p-4 mb-5 flex items-start gap-3" style={{ borderColor: "#F59E0B30", backgroundColor: "#F59E0B08" }}>
          <AlertCircle size={16} style={{ color: "#F59E0B" }} className="flex-shrink-0 mt-0.5"/>
          <p className="text-xs text-text-muted leading-relaxed">
            Your <strong className="text-text-primary">Brand Book</strong> isn't set up yet — the AI will work, but results will be more accurate once you fill in your artist profile.{" "}
            <Link href="/dashboard/library/marketing" className="underline" style={{ color: "#F59E0B" }}>Set it up →</Link>
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-0 border-b border-border mb-7">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold transition-all border-b-2 -mb-px whitespace-nowrap ${
              tab === t.id
                ? "border-red-500 text-red-500"
                : "border-transparent text-text-muted hover:text-text-primary"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── AUDIT TAB ───────────────────────────────────────────────────── */}
      {tab === "audit" && (
        <div>
          <div className="glass-card rounded-xl p-5 mb-5">
            <p className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: MODULE_COLOR }}>
              Channel Stats
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1.5">Channel Name</label>
                <input
                  value={inputs.channelName}
                  onChange={e => inp("channelName", e.target.value)}
                  placeholder="e.g. Tyla Official"
                  className="w-full glass-card rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none placeholder:text-text-muted/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1.5">Subscriber Count</label>
                <input
                  value={inputs.subscriberCount}
                  onChange={e => inp("subscriberCount", e.target.value)}
                  placeholder="e.g. 2.1M"
                  className="w-full glass-card rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none placeholder:text-text-muted/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1.5">Average Views / Video</label>
                <input
                  value={inputs.avgViews}
                  onChange={e => inp("avgViews", e.target.value)}
                  placeholder="e.g. 180K"
                  className="w-full glass-card rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none placeholder:text-text-muted/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1.5">Upload Frequency</label>
                <input
                  value={inputs.uploadFrequency}
                  onChange={e => inp("uploadFrequency", e.target.value)}
                  placeholder="e.g. 2× per month"
                  className="w-full glass-card rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none placeholder:text-text-muted/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1.5">Top-Performing Video</label>
                <input
                  value={inputs.topVideo}
                  onChange={e => inp("topVideo", e.target.value)}
                  placeholder="Title + view count"
                  className="w-full glass-card rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none placeholder:text-text-muted/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1.5">Monetised?</label>
                <select
                  value={inputs.monetised}
                  onChange={e => inp("monetised", e.target.value)}
                  className="w-full glass-card rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none"
                >
                  <option value="">Select…</option>
                  <option value="yes">Yes — in YPP</option>
                  <option value="no-eligible">No — but eligible</option>
                  <option value="no-not-eligible">No — not yet eligible</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1.5">Recent Video Titles (last 3–5)</label>
                <textarea
                  value={inputs.recentTitles}
                  onChange={e => inp("recentTitles", e.target.value)}
                  placeholder="Paste them here, one per line"
                  rows={3}
                  className="w-full glass-card rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none placeholder:text-text-muted/50 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1.5">Thumbnail Style (describe it)</label>
                <input
                  value={inputs.thumbnailStyle}
                  onChange={e => inp("thumbnailStyle", e.target.value)}
                  placeholder="e.g. Face close-up, yellow background, bold white text"
                  className="w-full glass-card rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none placeholder:text-text-muted/50"
                />
              </div>
            </div>

            <button
              onClick={runAudit}
              disabled={loading}
              className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: MODULE_COLOR }}
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="animate-spin"/> Running AI Diagnosis…
                </>
              ) : (
                <>
                  <TrendingUp size={14}/> Run Channel Audit
                </>
              )}
            </button>
          </div>

          {/* Error */}
          {auditError && (
            <div className="glass-card rounded-xl p-4 mb-5 flex items-start gap-3" style={{ borderColor: "#EF444430", backgroundColor: "#EF444408" }}>
              <AlertCircle size={15} style={{ color: "#EF4444" }} className="flex-shrink-0 mt-0.5"/>
              <div>
                <p className="text-sm font-semibold text-text-primary mb-0.5">Audit failed</p>
                <p className="text-xs text-text-muted">{auditError}</p>
              </div>
            </div>
          )}

          {/* Results */}
          {auditSections.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: MODULE_COLOR }}>
                Audit Results
              </p>
              {auditSections.map(section => {
                const isOpen = expandedSection === section.heading;
                const color = SECTION_COLORS[section.heading] ?? MODULE_COLOR;
                const isCopied = copiedSection === section.heading;
                return (
                  <div key={section.heading} className="glass-card rounded-xl overflow-hidden" style={{ borderColor: `${color}20` }}>
                    <button
                      onClick={() => setExpandedSection(isOpen ? null : section.heading)}
                      className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-surface-2/40 transition-colors"
                    >
                      <span className="text-base">{SECTION_ICONS[section.heading] ?? "📌"}</span>
                      <span className="flex-1 text-sm font-bold text-text-primary">{section.heading}</span>
                      {isOpen ? <ChevronUp size={14} className="text-text-muted"/> : <ChevronDown size={14} className="text-text-muted"/>}
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 pt-1">
                        <div className="border-l-2 pl-4 py-1" style={{ borderColor: color }}>
                          <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">{section.body}</p>
                        </div>
                        <button
                          onClick={() => copySection(section.heading, section.body)}
                          className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-text-primary transition-colors"
                        >
                          {isCopied ? <Check size={12} style={{ color: "#10B981" }}/> : <Copy size={12}/>}
                          {isCopied ? "Copied" : "Copy section"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="mt-2 flex justify-end">
                <button
                  onClick={() => { setAuditSections([]); setAuditError(""); }}
                  className="text-xs text-text-muted hover:text-text-primary transition-colors flex items-center gap-1"
                >
                  <RefreshCw size={11}/> Run a new audit
                </button>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loading && auditSections.length === 0 && !auditError && (
            <div className="glass-card rounded-xl p-8 text-center" style={{ borderColor: `${MODULE_COLOR}15` }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: `${MODULE_COLOR}12` }}>
                <TrendingUp size={22} style={{ color: MODULE_COLOR }}/>
              </div>
              <p className="text-sm font-semibold text-text-primary mb-1">Enter your channel stats above</p>
              <p className="text-xs text-text-muted max-w-xs mx-auto">The AI will give you a surgical diagnosis — specific fixes, not generic creator advice. Results in about 15 seconds.</p>
            </div>
          )}
        </div>
      )}

      {/* ── REVENUE TAB ─────────────────────────────────────────────────── */}
      {tab === "revenue" && (
        <div>
          {/* Input bar */}
          <div className="glass-card rounded-xl p-5 mb-6">
            <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: MODULE_COLOR }}>
              Your Numbers
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1.5">Current Subscribers</label>
                <input
                  value={subCount}
                  onChange={e => setSubCount(e.target.value)}
                  placeholder="e.g. 45000"
                  className="w-full glass-card rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none placeholder:text-text-muted/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1.5">Watch Hours (last 12 months)</label>
                <input
                  value={watchHours}
                  onChange={e => setWatchHours(e.target.value)}
                  placeholder="e.g. 3200"
                  className="w-full glass-card rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none placeholder:text-text-muted/50"
                />
              </div>
            </div>
            {!subCount && !watchHours && (
              <p className="text-xs text-text-muted mt-3">Enter numbers to see your position on each milestone track.</p>
            )}
          </div>

          {/* Milestones */}
          <div className="space-y-4">
            {MILESTONES.map(m => {
              const status = getMilestoneStatus(m);
              const sp = subsProgress(m);
              const hp = hoursProgress(m);
              const isDone = status === "done";
              return (
                <div
                  key={m.id}
                  className="glass-card rounded-xl p-5"
                  style={{ borderColor: isDone ? `${m.color}40` : `${m.color}15` }}
                >
                  <div className="flex items-start gap-4 mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
                      style={{ backgroundColor: isDone ? `${m.color}25` : `${m.color}10` }}
                    >
                      {isDone ? "✓" : "○"}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className="font-bold text-text-primary">{m.label}</p>
                        {isDone && (
                          <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded" style={{ color: m.color, backgroundColor: `${m.color}20` }}>
                            Achieved
                          </span>
                        )}
                        {status === "partial" && !isDone && (
                          <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded" style={{ color: "#F59E0B", backgroundColor: "#F59E0B20" }}>
                            In Progress
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-muted">{m.sublabel}</p>
                    </div>
                  </div>

                  {/* Progress bars */}
                  <div className="space-y-2 mb-4">
                    {sp !== null && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-text-muted font-semibold">
                            Subscribers: {parsedSubs.toLocaleString()} / {m.threshold.subs!.toLocaleString()}
                          </span>
                          <span className="text-[10px] font-black" style={{ color: sp >= 100 ? "#10B981" : m.color }}>{sp}%</span>
                        </div>
                        <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${sp}%`, backgroundColor: sp >= 100 ? "#10B981" : m.color }}
                          />
                        </div>
                      </div>
                    )}
                    {hp !== null && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-text-muted font-semibold">
                            Watch Hours: {parsedHours.toLocaleString()} / {m.threshold.watchHours!.toLocaleString()}
                          </span>
                          <span className="text-[10px] font-black" style={{ color: hp >= 100 ? "#10B981" : m.color }}>{hp}%</span>
                        </div>
                        <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${hp}%`, backgroundColor: hp >= 100 ? "#10B981" : m.color }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-border/60 pt-3 space-y-2">
                    <p className="text-xs text-text-primary leading-relaxed">
                      <span className="font-semibold">What you unlock: </span>{m.reward}
                    </p>
                    <p className="text-xs text-text-muted leading-relaxed">
                      <span className="font-semibold text-text-primary">Manager tip: </span>{m.tip}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* YPP link */}
          <div className="mt-5 glass-card rounded-xl p-4 flex items-center gap-3" style={{ borderColor: "#F59E0B20" }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#F59E0B15" }}>
              <ExternalLink size={14} style={{ color: "#F59E0B" }}/>
            </div>
            <div>
              <p className="text-xs font-semibold text-text-primary mb-0.5">Enable monetisation in YouTube Studio</p>
              <a
                href="https://studio.youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs underline"
                style={{ color: "#F59E0B" }}
              >
                studio.youtube.com → Monetisation
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── HEALTH CHECK TAB ─────────────────────────────────────────────── */}
      {tab === "health" && (
        <div>
          {/* Score */}
          <div className="glass-card rounded-xl p-5 mb-5">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-xs font-black uppercase tracking-widest" style={{ color: MODULE_COLOR }}>
                  {healthDone} / {HEALTH_CHECKS.length} checks
                </span>
                {healthPct >= 85 && (
                  <span className="ml-3 text-xs font-bold" style={{ color: "#10B981" }}>✓ Channel is in good shape</span>
                )}
                {healthPct < 60 && healthPct > 0 && (
                  <span className="ml-3 text-xs font-bold" style={{ color: "#F59E0B" }}>⚠ Several things need attention</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-black" style={{ color: healthPct >= 85 ? "#10B981" : healthPct >= 60 ? "#F59E0B" : MODULE_COLOR }}>
                  {healthPct}%
                </span>
                <button
                  onClick={() => setChecked({})}
                  className="text-xs text-text-muted hover:text-text-primary transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
            <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${healthPct}%`,
                  backgroundColor: healthPct >= 85 ? "#10B981" : healthPct >= 60 ? "#F59E0B" : MODULE_COLOR,
                }}
              />
            </div>
          </div>

          {/* Checks grouped by category */}
          <div className="space-y-5">
            {HEALTH_CATEGORIES.map(category => {
              const items = HEALTH_CHECKS.filter(h => h.category === category);
              const catDone = items.filter(i => checked[i.id]).length;
              return (
                <div key={category}>
                  <div className="flex items-center justify-between mb-2 px-1">
                    <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: MODULE_COLOR }}>
                      {category}
                    </p>
                    <span className="text-[10px] text-text-muted font-semibold">{catDone}/{items.length}</span>
                  </div>
                  <div className="glass-card rounded-xl overflow-hidden">
                    <div className="divide-y divide-border/60">
                      {items.map(item => (
                        <button
                          key={item.id}
                          onClick={() => toggleCheck(item.id)}
                          className="w-full flex items-start gap-3 px-5 py-4 text-left hover:bg-surface-2/50 transition-colors"
                        >
                          <div className="flex-shrink-0 mt-0.5">
                            {checked[item.id]
                              ? <CheckSquare size={16} style={{ color: MODULE_COLOR }}/>
                              : <Square size={16} className="text-text-muted"/>}
                          </div>
                          <p className={`text-sm leading-relaxed ${checked[item.id] ? "line-through text-text-muted" : "text-text-primary"}`}>
                            {item.text}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-text-muted text-center mt-5">Run this checklist every 30 days. Save a screenshot to track improvement over time.</p>
        </div>
      )}
    </div>
  );
}
