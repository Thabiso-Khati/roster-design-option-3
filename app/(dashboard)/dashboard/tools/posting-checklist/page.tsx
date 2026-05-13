"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ChevronLeft, CheckSquare, Square, RotateCcw, Clock,
  Smartphone, Globe, Sparkles, Loader2, Copy, Check,
  ChevronDown, ChevronUp, CalendarClock
} from "lucide-react";
import { loadFullContext } from "@/lib/artist-context";
import { SaveButton } from "@/components/ui/save-button";
import { ExportButton } from "@/components/ui/export-button";

const MODULE_COLOR = "#10B981";

type Platform = "instagram" | "tiktok" | "youtube-shorts" | "twitter-x" | "facebook" | "audiomack" | "boomplay";
type ContentFormat = "video" | "photo" | "reel" | "story" | "text" | "live";
type Market = "africa" | "us-uk-eu" | "asia" | "latin";

const PLATFORMS: { id: Platform; label: string; emoji: string }[] = [
  { id: "instagram",      label: "Instagram",      emoji: "📸" },
  { id: "tiktok",         label: "TikTok",         emoji: "🎵" },
  { id: "youtube-shorts", label: "YouTube Shorts", emoji: "▶️" },
  { id: "twitter-x",      label: "X / Twitter",    emoji: "🐦" },
  { id: "facebook",       label: "Facebook",       emoji: "📘" },
  { id: "audiomack",      label: "Audiomack",      emoji: "🎧" },
  { id: "boomplay",       label: "Boomplay",       emoji: "🎶" },
];

const FORMATS: { id: ContentFormat; label: string }[] = [
  { id: "video",  label: "Video" },
  { id: "photo",  label: "Photo / Carousel" },
  { id: "reel",   label: "Reel / Short" },
  { id: "story",  label: "Story" },
  { id: "text",   label: "Text / Thread" },
  { id: "live",   label: "Live" },
];

const MARKETS: { id: Market; label: string; flag: string }[] = [
  { id: "africa",    label: "Africa",       flag: "🌍" },
  { id: "us-uk-eu",  label: "US · UK · EU", flag: "🌎" },
  { id: "asia",      label: "Asia",         flag: "🌏" },
  { id: "latin",     label: "Latin",        flag: "🌐" },
];

const BEST_TIMES: Record<Platform, Record<Market, string[]>> = {
  instagram: {
    africa:    ["06:00–08:00 SAST", "12:00–13:00 SAST", "18:00–20:00 SAST", "21:00–22:00 SAST"],
    "us-uk-eu":["08:00–09:00 EST", "11:00–13:00 EST", "17:00–19:00 EST", "20:00–22:00 GMT"],
    asia:      ["07:00–09:00 KST", "11:00–13:00 JST", "19:00–21:00 KST"],
    latin:     ["07:00–09:00 BRT", "12:00–14:00 BRT", "18:00–21:00 ART"],
  },
  tiktok: {
    africa:    ["06:00–08:00 WAT/SAST", "15:00–16:00", "19:00–22:00 SAST"],
    "us-uk-eu":["07:00–09:00 EST", "14:00–15:00 EST", "19:00–21:00 EST"],
    asia:      ["08:00–10:00 KST", "14:00–16:00 JST", "20:00–22:00 KST"],
    latin:     ["09:00–11:00 BRT", "14:00–16:00 BRT", "20:00–22:00 ART"],
  },
  "youtube-shorts": {
    africa:    ["09:00–11:00 SAST", "17:00–19:00 SAST"],
    "us-uk-eu":["09:00–11:00 EST", "17:00–20:00 EST"],
    asia:      ["10:00–12:00 JST", "17:00–20:00 KST"],
    latin:     ["10:00–12:00 BRT", "18:00–21:00 BRT"],
  },
  "twitter-x": {
    africa:    ["08:00–09:00 WAT", "12:00–13:00 SAST", "17:00–18:00 EAT"],
    "us-uk-eu":["08:00–10:00 EST", "12:00–13:00 GMT", "17:00–18:00 CET"],
    asia:      ["08:00–10:00 KST", "12:00–13:00 JST"],
    latin:     ["09:00–11:00 BRT", "17:00–19:00 ART"],
  },
  facebook: {
    africa:    ["09:00–10:00 WAT", "19:00–20:00 EAT"],
    "us-uk-eu":["09:00–10:00 EST", "13:00–15:00 CET"],
    asia:      ["10:00–11:00 JST", "20:00–21:00 KST"],
    latin:     ["10:00–12:00 BRT", "20:00–22:00 ART"],
  },
  audiomack: {
    africa:    ["18:00–22:00 WAT", "20:00–23:00 SAST"],
    "us-uk-eu":["18:00–22:00 EST"],
    asia:      ["19:00–22:00 JST"],
    latin:     ["19:00–23:00 BRT"],
  },
  boomplay: {
    africa:    ["07:00–09:00 WAT", "18:00–22:00 EAT"],
    "us-uk-eu":["Not primary — focus on Spotify / Apple"],
    asia:      ["Not primary — focus on NetEase / QQ"],
    latin:     ["Not primary — focus on Spotify Latin"],
  },
};

interface ChecklistSection {
  title: string;
  emoji: string;
  checks: { id: string; text: string; note?: string }[];
}

const getChecklist = (platform: Platform, format: ContentFormat, market: Market): ChecklistSection[] => {
  const isVideo = format === "video" || format === "reel";
  const isAfrica = market === "africa";
  const isAsia = market === "asia";

  const sections: ChecklistSection[] = [
    {
      title: "Content Quality",
      emoji: "🎬",
      checks: [
        { id: "hook", text: "Hook lands in first 3 seconds", note: "Viewers decide in 2–3 seconds. Your hook must appear immediately." },
        ...(isVideo ? [
          { id: "aspect", text: "Correct aspect ratio", note: platform === "tiktok" || platform === "youtube-shorts" ? "9:16 vertical (1080×1920)" : platform === "instagram" ? "9:16 for Reels, 1:1 or 4:5 for feed" : "Platform default" },
          { id: "audio-clear", text: "Audio is clear, no clipping or distortion" },
          { id: "safe-zone", text: "Text/key visuals within safe zones (avoid top 15% and bottom 25%)", note: "UI overlays cover edges on most platforms." },
          { id: "captions-on", text: "Captions / subtitles added", note: "60–80% of users watch without sound." },
        ] : []),
        ...(format === "photo" ? [
          { id: "quality", text: "Image is at least 1080px on shortest side" },
          { id: "colour", text: "Colour grading is consistent with your palette" },
        ] : []),
        { id: "audio-licensed", text: "Audio is original or properly licensed", note: isAfrica ? "Avoid popular songs not cleared — even African hits." : "Avoid trending audio without clearance." },
      ],
    },
    {
      title: "Caption",
      emoji: "✍️",
      checks: [
        { id: "hook-caption", text: "Caption opens with a hook or statement (not 'New music out now')" },
        { id: "length", text: `Caption length appropriate: ${platform === "twitter-x" ? "under 240 chars or split into thread" : platform === "tiktok" ? "under 150 chars with key hashtags" : "3–8 lines for context, then CTA"}` },
        { id: "cta", text: "Clear call to action included (stream, comment, tag, share)" },
        ...(isAfrica ? [
          { id: "whatsapp", text: "Caption can be copy-pasted to WhatsApp status if relevant", note: "WhatsApp is a primary sharing surface across Africa." },
        ] : []),
        ...(isAsia ? [
          { id: "multilang", text: "Bilingual caption considered if targeting cross-market audience" },
        ] : []),
      ],
    },
    {
      title: "Hashtags & Tags",
      emoji: "#",
      checks: [
        { id: "hashtags", text: `Hashtags added: ${platform === "tiktok" ? "3–5 specific" : platform === "instagram" ? "5–10 relevant" : platform === "twitter-x" ? "1–2 only" : "3–7 relevant"}` },
        { id: "location", text: "Location tag added where relevant" },
        { id: "collaborators", text: "Collaborators / featured artists tagged in post and caption" },
        { id: "no-banned", text: "No banned or shadowlisted hashtags", note: "Check before posting. Even innocent tags can be flagged." },
      ],
    },
    {
      title: "Timing",
      emoji: "🕐",
      checks: [
        { id: "best-time", text: `Scheduled for peak time in your market (see Best Times panel)` },
        { id: "not-competing", text: "Not clashing with a major release or viral moment in your genre" },
        { id: "timezone", text: `Time zone confirmed: ${isAfrica ? "SAST / WAT / EAT" : isAsia ? "KST / JST / CST" : market === "latin" ? "BRT / ART / CDT" : "EST / GMT / CET"}` },
      ],
    },
    {
      title: "Post-Publish Pulse",
      emoji: "📊",
      checks: [
        { id: "pulse-15", text: "✔ 15-minute check: comment on early engagement, reply to first comments" },
        { id: "pulse-1h", text: "✔ 1-hour check: record saves, shares, initial reach" },
        { id: "pulse-24h", text: "✔ 24-hour check: log key stats to your Artist Audience Report" },
        { id: "repurpose", text: "Scheduled for repurpose on secondary platforms within 48 hours" },
      ],
    },
  ];

  return sections;
};

// ─── Cross-platform scheduling windows ──────────────────────────────────────

const CROSS_PLATFORM: Record<Platform, { platform: string; emoji: string; delay: string; note: string }[]> = {
  instagram: [
    { platform: "TikTok",          emoji: "🎵", delay: "2–4 hrs later",   note: "Re-cut for 9:16, re-caption natively" },
    { platform: "YouTube Shorts",  emoji: "▶️", delay: "4–6 hrs later",   note: "Add to Shorts + long-form channel" },
    { platform: "X / Twitter",     emoji: "🐦", delay: "Same day",        note: "Share the IG link with punchy 1-liner" },
    { platform: "Facebook",        emoji: "📘", delay: "24 hrs later",    note: "Re-upload natively — don't cross-post the link" },
    { platform: "Audiomack",       emoji: "🎧", delay: "Release day",     note: "Upload audio version with artwork same day" },
  ],
  tiktok: [
    { platform: "Instagram Reels", emoji: "📸", delay: "2–4 hrs later",   note: "Remove TikTok watermark before uploading" },
    { platform: "YouTube Shorts",  emoji: "▶️", delay: "Same day",        note: "Native upload outperforms cross-posted links" },
    { platform: "X / Twitter",     emoji: "🐦", delay: "Within 1 hr",     note: "Quote-tweet or embed — viral TikToks do well on X" },
    { platform: "WhatsApp Status", emoji: "💬", delay: "Same day",        note: "Africa + Latin: WhatsApp is a sharing surface" },
  ],
  "youtube-shorts": [
    { platform: "TikTok",          emoji: "🎵", delay: "2–4 hrs later",   note: "Re-upload without YouTube Shorts branding if possible" },
    { platform: "Instagram Reels", emoji: "📸", delay: "4–6 hrs later",   note: "Same" },
    { platform: "X / Twitter",     emoji: "🐦", delay: "Same day",        note: "Share the YouTube link — drives watch-time" },
  ],
  "twitter-x": [
    { platform: "Instagram",       emoji: "📸", delay: "1–2 hrs later",   note: "Expand into caption format with visual" },
    { platform: "TikTok",          emoji: "🎵", delay: "Same day",        note: "Screenshot strong reply threads as content" },
  ],
  facebook: [
    { platform: "Instagram",       emoji: "📸", delay: "Same day",        note: "Always post natively — never share the FB link" },
    { platform: "TikTok",          emoji: "🎵", delay: "2–4 hrs later",   note: "Vertical re-cut if video content" },
  ],
  audiomack: [
    { platform: "TikTok",          emoji: "🎵", delay: "Same day",        note: "Clip best 30s as Audiomack-linked TikTok" },
    { platform: "Instagram",       emoji: "📸", delay: "Same day",        note: "Artwork + audio post with Audiomack link in bio" },
    { platform: "WhatsApp Status", emoji: "💬", delay: "Same day",        note: "Share Audiomack link via WhatsApp broadcast" },
  ],
  boomplay: [
    { platform: "TikTok",          emoji: "🎵", delay: "Same day",        note: "Boomplay does well in West + East Africa TikTok" },
    { platform: "Instagram",       emoji: "📸", delay: "Same day",        note: "Drive to Boomplay link via bio" },
    { platform: "WhatsApp Status", emoji: "💬", delay: "Same day",        note: "Boomplay link in WhatsApp broadcast" },
  ],
};

// ─── First comment templates ─────────────────────────────────────────────────

const FIRST_COMMENT: Record<Platform, string> = {
  instagram:
    "🔥 STREAM NOW → [Spotify/Apple/Audiomack link]\n\n📲 Tap the link in bio\n\n🎵 Add to your playlist and share if you're feeling it 🙏\n\n#[ArtistName] #[SongTitle] #[Genre]",
  tiktok:
    "🎵 Full song on all platforms → link in bio\n\nStream · Save · Share 🙏\n\n#[ArtistName] #[SongTitle] #[Genre]",
  "youtube-shorts":
    "🎵 Full track → link in description\n\nLike · Comment · Subscribe for more 🔔\n\nStream on Spotify, Apple Music, Audiomack 🙏",
  "twitter-x":
    "🎵 Stream everywhere → [link]\n\nRT if you're feeling it 🙏",
  facebook:
    "🎵 Stream · Download · Share\n\n→ [Streaming link]\n→ [Audiomack / Boomplay link if Africa]\n\nTag someone who needs to hear this 🙏",
  audiomack:
    "🎵 New drop! Stream · Favourite · Repost to support 🙏\n\nFollow me on Audiomack for more 🔥",
  boomplay:
    "🎵 New drop on Boomplay! Heart · Comment · Share 🙏\n\nFollow me for more 🔥",
};

type CheckedState = Record<string, boolean>;

interface CaptionOption {
  caption: string;
  tone: string;
  hashtags: string[];
}

export default function PostingChecklistPage() {
  const handleExportPDF = () => { window.print(); };
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [format, setFormat] = useState<ContentFormat>("reel");
  const [market, setMarket] = useState<Market>("africa");
  const [checked, setChecked] = useState<CheckedState>({});

  // AI Caption state
  const [captionDesc, setCaptionDesc] = useState("");
  const [captionTone, setCaptionTone] = useState("");
  const [captionLoading, setCaptionLoading] = useState(false);
  const [captions, setCaptions] = useState<CaptionOption[]>([]);
  const [captionError, setCaptionError] = useState("");
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [captionOpen, setCaptionOpen] = useState(false);
  const [firstCommentCopied, setFirstCommentCopied] = useState(false);
  const [crossPlatOpen, setCrossPlatOpen] = useState(false);

  // Reset checklist when options change
  useEffect(() => { setChecked({}); }, [platform, format, market]);

  const checklist = getChecklist(platform, format, market);
  const allItems = checklist.flatMap(s => s.checks);
  const total = allItems.length;
  const done = allItems.filter(c => checked[c.id]).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const bestTimes = BEST_TIMES[platform]?.[market] ?? [];

  const toggle = (id: string) => setChecked(prev => ({ ...prev, [id]: !prev[id] }));
  const resetAll = () => setChecked({});

  const generateCaptions = async () => {
    if (!captionDesc.trim()) return;
    setCaptionLoading(true);
    setCaptionError("");
    setCaptions([]);
    try {
      const ctx = loadFullContext();
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "caption-generate",
          artistContext: ctx,
          params: {
            platform: PLATFORMS.find(p => p.id === platform)?.label ?? platform,
            contentDescription: captionDesc,
            tone: captionTone || "match the artist's natural voice",
          },
        }),
      });
      const data = await res.json();
      if (data.error) {
        setCaptionError(data.error);
      } else {
        const match = data.result.match(/\[[\s\S]*\]/);
        if (match) {
          setCaptions(JSON.parse(match[0]));
        } else {
          setCaptionError("Couldn't parse captions. Try again.");
        }
      }
    } catch {
      setCaptionError("Failed to reach AI. Check your network and try again.");
    } finally {
      setCaptionLoading(false);
    }
  };

  const copyCaption = (idx: number, caption: CaptionOption) => {
    const text = `${caption.caption}\n\n${caption.hashtags.map(h => `#${h}`).join(" ")}`;
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const copyFirstComment = () => {
    const template = FIRST_COMMENT[platform] ?? "";
    navigator.clipboard.writeText(template).catch(() => {});
    setFirstCommentCopied(true);
    setTimeout(() => setFirstCommentCopied(false), 2000);
  };

  return (
    <div className="animate-fade-in max-w-4xl">
      <Link href="/dashboard/library/marketing" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary mb-6 transition-colors">
        <ChevronLeft size={15}/>Back to Marketing
      </Link>

      {/* Header */}
      <div className="glass-card rounded-2xl p-6 mb-7" style={{ borderColor: `${MODULE_COLOR}25` }}>
        <div className="flex items-center gap-4">
          <SaveButton toolSlug="posting-checklist" getData={() => {}} title={`Posting Checklist — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
            <ExportButton onPDF={handleExportPDF} />

          <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${MODULE_COLOR}15` }}>
            <CheckSquare size={26} style={{ color: MODULE_COLOR }}/>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: MODULE_COLOR }}>Work Tools</p>
            <h1 className="text-2xl font-black text-text-primary">Master Posting Checklist</h1>
            <p className="text-sm text-text-muted mt-0.5">Platform-specific pre-publish checks + best-time-to-post + post-publish pulse tracker.</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-4 mb-7">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-text-muted mb-2">Platform</p>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map(p => {
              const active = platform === p.id;
              return (
                <button key={p.id} onClick={() => setPlatform(p.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                    active ? "text-white border-transparent" : "text-text-muted border-border hover:border-brand/30"
                  }`}
                  style={active ? { backgroundColor: MODULE_COLOR } : {}}>
                  <span>{p.emoji}</span>{p.label}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-text-muted mb-2">Content Format</p>
          <div className="flex flex-wrap gap-2">
            {FORMATS.map(f => {
              const active = format === f.id;
              return (
                <button key={f.id} onClick={() => setFormat(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                    active ? "text-white border-transparent" : "text-text-muted border-border hover:border-brand/30"
                  }`}
                  style={active ? { backgroundColor: MODULE_COLOR } : {}}>
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-text-muted mb-2">Market</p>
          <div className="flex flex-wrap gap-2">
            {MARKETS.map(m => {
              const active = market === m.id;
              return (
                <button key={m.id} onClick={() => setMarket(m.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                    active ? "text-white border-transparent" : "text-text-muted border-border hover:border-brand/30"
                  }`}
                  style={active ? { backgroundColor: "#8B5CF6" } : {}}>
                  {m.flag} {m.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Checklist */}
        <div className="lg:col-span-2 space-y-4">
          {/* Progress */}
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider" style={{ color: MODULE_COLOR }}>{done} / {total} checks</span>
              <button onClick={resetAll} className="flex items-center gap-1 text-xs text-text-muted hover:text-text-primary transition-colors">
                <RotateCcw size={11}/>Reset
              </button>
            </div>
            <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: pct === 100 ? "#10B981" : MODULE_COLOR }}/>
            </div>
            {pct === 100 && (
              <p className="text-xs font-semibold mt-2" style={{ color: "#10B981" }}>✓ All checks passed. Ready to post.</p>
            )}
          </div>

          {checklist.map(section => (
            <div key={section.title} className="glass-card rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                <span>{section.emoji}</span>
                <p className="text-xs font-black uppercase tracking-wider text-text-muted">{section.title}</p>
              </div>
              <div className="divide-y divide-border/60">
                {section.checks.map(item => (
                  <button key={item.id} onClick={() => toggle(item.id)}
                    className="w-full flex items-start gap-3 px-4 py-3.5 text-left hover:bg-surface-2/50 transition-colors">
                    <div className="flex-shrink-0 mt-0.5">
                      {checked[item.id]
                        ? <CheckSquare size={16} style={{ color: MODULE_COLOR }}/>
                        : <Square size={16} className="text-text-muted"/>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-relaxed ${checked[item.id] ? "line-through text-text-muted" : "text-text-primary"}`}>
                        {item.text}
                      </p>
                      {item.note && (
                        <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed">{item.note}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Best Times */}
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <Clock size={14} style={{ color: MODULE_COLOR }}/>
              <p className="text-xs font-black uppercase tracking-wider text-text-muted">Best Times to Post</p>
            </div>
            <div className="p-4">
              <p className="text-xs font-semibold text-text-muted mb-3">{PLATFORMS.find(p => p.id === platform)?.label} · {MARKETS.find(m => m.id === market)?.label}</p>
              {bestTimes.map((t, i) => (
                <div key={i} className="flex items-center gap-2 mb-2 last:mb-0">
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: MODULE_COLOR }}/>
                  <span className="text-xs text-text-primary font-semibold">{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Platform specs */}
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <Smartphone size={14} style={{ color: MODULE_COLOR }}/>
              <p className="text-xs font-black uppercase tracking-wider text-text-muted">Platform Specs</p>
            </div>
            <div className="p-4 space-y-2.5 text-xs text-text-muted">
              {platform === "instagram" && (
                <>
                  <p><span className="font-semibold text-text-primary">Reels:</span> 9:16, up to 90s, 1080×1920</p>
                  <p><span className="font-semibold text-text-primary">Feed:</span> 1:1 or 4:5, min 1080px</p>
                  <p><span className="font-semibold text-text-primary">Story:</span> 9:16, 1080×1920</p>
                  <p><span className="font-semibold text-text-primary">Hashtags:</span> 5–10 (hidden in comment works)</p>
                  <p><span className="font-semibold text-text-primary">Caption:</span> Up to 2,200 chars; first 125 visible</p>
                </>
              )}
              {platform === "tiktok" && (
                <>
                  <p><span className="font-semibold text-text-primary">Video:</span> 9:16, 15s–10min, 1080×1920</p>
                  <p><span className="font-semibold text-text-primary">Caption:</span> Up to 2,200 chars with hashtags</p>
                  <p><span className="font-semibold text-text-primary">Hashtags:</span> 3–5 (avoid overloading)</p>
                  <p><span className="font-semibold text-text-primary">Hook:</span> First 3s is critical for completion rate</p>
                </>
              )}
              {platform === "youtube-shorts" && (
                <>
                  <p><span className="font-semibold text-text-primary">Video:</span> 9:16, under 60s</p>
                  <p><span className="font-semibold text-text-primary">Title:</span> Up to 100 chars; first 70 visible</p>
                  <p><span className="font-semibold text-text-primary">Description:</span> First 100 chars shown below video</p>
                  <p><span className="font-semibold text-text-primary">Hashtag:</span> Add #Shorts to title or description</p>
                </>
              )}
              {platform === "twitter-x" && (
                <>
                  <p><span className="font-semibold text-text-primary">Text:</span> 280 chars (1000 with subscription)</p>
                  <p><span className="font-semibold text-text-primary">Images:</span> Up to 4; 1200×675 for 16:9</p>
                  <p><span className="font-semibold text-text-primary">Video:</span> Up to 2min 20s, 1080p</p>
                  <p><span className="font-semibold text-text-primary">Hashtags:</span> 1–2 max for engagement</p>
                </>
              )}
              {(platform === "audiomack" || platform === "boomplay") && (
                <>
                  <p><span className="font-semibold text-text-primary">Audio:</span> MP3 or WAV, max 50MB per track</p>
                  <p><span className="font-semibold text-text-primary">Artwork:</span> 1:1 square, min 1000×1000px</p>
                  <p><span className="font-semibold text-text-primary">Tags:</span> Genre, mood, and artist tags important for discovery</p>
                  <p><span className="font-semibold text-text-primary">Description:</span> Include lyrics snippet for search indexing</p>
                </>
              )}
              {platform === "facebook" && (
                <>
                  <p><span className="font-semibold text-text-primary">Video:</span> Up to 240 min; 16:9 or 9:16</p>
                  <p><span className="font-semibold text-text-primary">Reels:</span> 9:16, under 90s</p>
                  <p><span className="font-semibold text-text-primary">Caption:</span> Up to 63,206 chars</p>
                  <p><span className="font-semibold text-text-primary">Hashtags:</span> 3–5 recommended</p>
                </>
              )}
            </div>
          </div>

          {/* Market note */}
          <div className="glass-card rounded-xl p-4" style={{ borderColor: `${MODULE_COLOR}20`, backgroundColor: `${MODULE_COLOR}04` }}>
            <p className="text-xs font-black uppercase tracking-wider mb-2" style={{ color: MODULE_COLOR }}>
              <Globe size={11} className="inline mr-1"/>{MARKETS.find(m => m.id === market)?.label} note
            </p>
            {market === "africa" && (
              <p className="text-xs text-text-muted leading-relaxed">WhatsApp is a publishing surface across Africa — forward-able captions matter. Audiomack and Boomplay are first-class DSPs here. Mobile-data-aware: keep video file sizes lean where possible.</p>
            )}
            {market === "us-uk-eu" && (
              <p className="text-xs text-text-muted leading-relaxed">Instagram Reels and TikTok weighted equally. SoundCloud still relevant in EU. Spotify editorial pitch reminders: submit 7 days before release, every time.</p>
            )}
            {market === "asia" && (
              <p className="text-xs text-text-muted leading-relaxed">In China: Douyin and RedNote (Xiaohongshu) instead of TikTok. In Japan: Twitter/X and LINE are partial publishing surfaces for short-form. K-pop fancam upload routines warrant separate scheduling.</p>
            )}
            {market === "latin" && (
              <p className="text-xs text-text-muted leading-relaxed">WhatsApp is the primary sharing surface — reshare-ability should be built into every caption. YouTube video premieres are a strong convention in this market. Strong TikTok presence with dance/movement components.</p>
            )}
          </div>

          {/* ── AI Caption Writer ─────────────────────────── */}
          <div className="glass-card rounded-xl overflow-hidden">
            <button
              className="w-full flex items-center gap-2 px-4 py-3 border-b border-border hover:bg-surface-2/40 transition-colors"
              onClick={() => setCaptionOpen(o => !o)}
            >
              <Sparkles size={14} style={{ color: MODULE_COLOR }}/>
              <p className="flex-1 text-left text-xs font-black uppercase tracking-wider text-text-muted">AI Caption Writer</p>
              {captionOpen ? <ChevronUp size={13} className="text-text-muted"/> : <ChevronDown size={13} className="text-text-muted"/>}
            </button>
            {captionOpen && (
              <div className="p-4 space-y-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-text-muted block mb-1">What&apos;s this post about?</label>
                  <textarea
                    value={captionDesc}
                    onChange={e => setCaptionDesc(e.target.value)}
                    placeholder="e.g. Music video teaser for new single, showing studio vibes"
                    rows={2}
                    className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-brand resize-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-text-muted block mb-1">Tone (optional)</label>
                  <input
                    value={captionTone}
                    onChange={e => setCaptionTone(e.target.value)}
                    placeholder="e.g. Hype, vulnerable, witty…"
                    className="w-full bg-transparent border-b border-border text-xs text-text-primary placeholder:text-text-muted/50 focus:outline-none py-1"
                  />
                </div>
                <button
                  onClick={generateCaptions}
                  disabled={captionLoading || !captionDesc.trim()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: MODULE_COLOR }}
                >
                  {captionLoading
                    ? <><Loader2 size={12} className="animate-spin"/> Writing…</>
                    : <><Sparkles size={12}/> Generate 3 Captions</>}
                </button>

                {captionError && (
                  <p className="text-xs text-red-400">{captionError}</p>
                )}

                {captions.length > 0 && (
                  <div className="space-y-3 pt-1">
                    {captions.map((c, i) => (
                      <div key={i} className="bg-surface-2/50 rounded-lg p-3">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: MODULE_COLOR }}>{c.tone}</span>
                          <button
                            onClick={() => copyCaption(i, c)}
                            className="flex items-center gap-1 text-[10px] font-semibold text-text-muted hover:text-text-primary transition-colors flex-shrink-0"
                          >
                            {copiedIdx === i ? <Check size={10} style={{ color: "#10B981" }}/> : <Copy size={10}/>}
                            {copiedIdx === i ? "Copied" : "Copy"}
                          </button>
                        </div>
                        <p className="text-xs text-text-primary leading-relaxed mb-2">{c.caption}</p>
                        <p className="text-[10px] text-text-muted">{c.hashtags.map(h => `#${h}`).join(" ")}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── First Comment Template ────────────────────── */}
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <span className="text-sm">💬</span>
              <p className="flex-1 text-xs font-black uppercase tracking-wider text-text-muted">First Comment Template</p>
              <button
                onClick={copyFirstComment}
                className="flex items-center gap-1 text-[10px] font-bold text-text-muted hover:text-text-primary transition-colors"
              >
                {firstCommentCopied ? <Check size={11} style={{ color: "#10B981" }}/> : <Copy size={11}/>}
                {firstCommentCopied ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="p-4">
              <p className="text-xs text-text-muted leading-relaxed mb-2">Post this as your first comment immediately after publishing:</p>
              <div className="bg-surface-2/60 rounded-lg p-3">
                <p className="text-xs text-text-primary leading-relaxed whitespace-pre-line">{FIRST_COMMENT[platform]}</p>
              </div>
              <p className="text-[10px] text-text-muted mt-2">Replace [bracketed text] with your real links and details before posting.</p>
            </div>
          </div>

          {/* ── Cross-Platform Schedule ───────────────────── */}
          <div className="glass-card rounded-xl overflow-hidden">
            <button
              className="w-full flex items-center gap-2 px-4 py-3 border-b border-border hover:bg-surface-2/40 transition-colors"
              onClick={() => setCrossPlatOpen(o => !o)}
            >
              <CalendarClock size={14} style={{ color: MODULE_COLOR }}/>
              <p className="flex-1 text-left text-xs font-black uppercase tracking-wider text-text-muted">Cross-Platform Schedule</p>
              {crossPlatOpen ? <ChevronUp size={13} className="text-text-muted"/> : <ChevronDown size={13} className="text-text-muted"/>}
            </button>
            {crossPlatOpen && (
              <div className="p-4 space-y-2">
                <p className="text-xs text-text-muted mb-3">
                  After posting on <strong className="text-text-primary">{PLATFORMS.find(p => p.id === platform)?.label}</strong>, distribute here:
                </p>
                {(CROSS_PLATFORM[platform] ?? []).map((entry, i) => (
                  <div key={i} className="flex items-start gap-3 py-2 border-b border-border/60 last:border-0">
                    <span className="text-sm flex-shrink-0">{entry.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap mb-0.5">
                        <p className="text-xs font-bold text-text-primary">{entry.platform}</p>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ color: MODULE_COLOR, backgroundColor: `${MODULE_COLOR}15` }}>{entry.delay}</span>
                      </div>
                      <p className="text-[11px] text-text-muted leading-relaxed">{entry.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
