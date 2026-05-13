"use client";
import { useState, useEffect } from "react";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";
import Link from "next/link";
import { SaveButton } from "@/components/ui/save-button";
import { ExportButton } from "@/components/ui/export-button";
import {
  ChevronLeft, ChevronRight, Sparkles, Check, RotateCcw, Download, Music, Mic2, Zap,
  Heart, Globe, Star, Flame, Moon, Save, Loader2, CheckCircle2, Megaphone,
  CalendarDays, Hash, FileText, TrendingUp, ArrowRight,
} from "lucide-react";

const MODULE_COLOR = "#8B5CF6";
const STORAGE_KEY = "roster_brand_book_v1";

// ── Types ──────────────────────────────────────────────────────────────────────
interface BrandBook {
  artistName: string;
  market: string;
  archetype: string;
  archetypeRef: string;
  subGenre: string;
  vibe: string[];
  audienceWho: string;
  audienceLoves: string;
  audienceRejects: string;
  toneOfVoice: string[];
  colorPalette: string[];
  visualAesthetic: string;
  moodWords: string[];
  captionStyle: string;
  completed: boolean;
}

const DEFAULT_BRAND_BOOK: BrandBook = {
  artistName: "",
  market: "",
  archetype: "",
  archetypeRef: "",
  subGenre: "",
  vibe: [],
  audienceWho: "",
  audienceLoves: "",
  audienceRejects: "",
  toneOfVoice: [],
  colorPalette: [],
  visualAesthetic: "",
  moodWords: [],
  captionStyle: "",
  completed: false,
};

// ── Archetype Library ──────────────────────────────────────────────────────────
const ARCHETYPES = [
  {
    id: "the-auteur",
    label: "The Auteur",
    desc: "Dark, cinematic, deeply personal. Every release is a statement.",
    icon: Moon,
    refs: ["Billie Eilish", "The Weeknd", "Frank Ocean", "Tems", "Sampa the Great"],
  },
  {
    id: "the-pop-architect",
    label: "The Pop Architect",
    desc: "Anthemic, hook-first, built for scale. Warm but precise.",
    icon: Star,
    refs: ["Taylor Swift", "Dua Lipa", "Tyla", "NewJeans", "Karol G"],
  },
  {
    id: "the-street-poet",
    label: "The Street Poet",
    desc: "Raw, lived-in, community-first. Truth over polish.",
    icon: Mic2,
    refs: ["Kendrick Lamar", "Nasty C", "Asake", "Central Cee", "Bad Bunny"],
  },
  {
    id: "the-sonic-innovator",
    label: "The Sonic Innovator",
    desc: "Genre-fluid, production-led, always ahead of the curve.",
    icon: Zap,
    refs: ["Burna Boy", "Stromae", "Ado", "Rosalía", "Rema"],
  },
  {
    id: "the-performer",
    label: "The Performer",
    desc: "Magnetic live presence, dance-forward, emotional spectacle.",
    icon: Flame,
    refs: ["Beyoncé", "BTS", "Sho Madjozi", "IU", "Shakira"],
  },
  {
    id: "the-confessionalist",
    label: "The Confessionalist",
    desc: "Vulnerable, intimate, bedroom-close. Fans feel like friends.",
    icon: Heart,
    refs: ["Phoebe Bridgers", "SZA", "Fujii Kaze", "Kali Uchis", "Lana Del Rey"],
  },
  {
    id: "the-cultural-diplomat",
    label: "The Cultural Diplomat",
    desc: "Cross-cultural, multilingual, bridging worlds deliberately.",
    icon: Globe,
    refs: ["Maluma", "Anitta", "Wizkid", "Yemi Alade", "Awich"],
  },
  {
    id: "the-scene-maker",
    label: "The Scene-Maker",
    desc: "Movement-builder, community anchor, genre-definer for a scene.",
    icon: Music,
    refs: ["DJ Maphorisa", "Drake", "Tyler the Creator", "Skepta", "Aespa"],
  },
];

const MARKETS = [
  "South Africa", "Nigeria", "Kenya", "Ghana", "Tanzania", "Uganda", "Zimbabwe",
  "Ethiopia", "Egypt", "Morocco", "Côte d'Ivoire", "Cameroon", "Angola", "Senegal",
  "United States", "United Kingdom", "France", "Germany", "Spain", "Brazil",
  "Mexico", "Colombia", "Japan", "South Korea", "China", "Australia", "India",
];

const SUB_GENRES = [
  "Amapiano", "Afrobeats", "Gqom", "Afro-Soul", "Afro-House", "SA Hip Hop",
  "Afrochamps", "Gospel Contemporary", "Afro-Pop", "Kwaito",
  "Pop", "Indie Pop", "Bedroom Pop", "Hyperpop", "R&B / Soul",
  "Hip Hop / Rap", "Drill", "Trap", "UK Garage", "Neo-Soul",
  "K-Pop", "J-Pop", "J-Rock", "City Pop", "C-Pop",
  "Latin Pop", "Reggaeton", "Latin Trap", "Corridos Tumbados", "Funk Carioca",
  "Electronic / House", "Techno", "Lo-Fi", "Alternative", "Indie Rock",
];

const VIBES = [
  "Aspirational", "Grounded", "Luxe", "Raw", "Playful", "Mysterious",
  "Spiritual", "Political", "Romantic", "Nostalgic", "Futuristic", "Community",
  "Rebellious", "Elegant", "Cinematic", "Energetic", "Melancholic", "Euphoric",
];

const TONE_OPTIONS = [
  "Conversational & warm", "Sharp & witty", "Poetic & abstract",
  "Minimal & cool", "Passionate & direct", "Playful & irreverent",
  "Authoritative & confident", "Vulnerable & open", "Spiritual & reflective",
  "Multilingual / code-switching",
];

const COLOR_PALETTES = [
  { id: "midnight", label: "Midnight", colors: ["#0A0A0F", "#1A1A2E", "#C9A84C"], desc: "Deep blacks, midnight blue, gold accents" },
  { id: "earth", label: "Earth & Rust", colors: ["#8B4513", "#D2691E", "#F5DEB3"], desc: "Terracotta, warm browns, cream" },
  { id: "neon", label: "Neon City", colors: ["#FF006E", "#8B5CF6", "#06B6D4"], desc: "Electric pink, purple, cyan" },
  { id: "monochrome", label: "Monochrome", colors: ["#FFFFFF", "#888888", "#111111"], desc: "Pure black, white, grey" },
  { id: "nature", label: "Nature & Green", colors: ["#14532D", "#4ADE80", "#FEF9C3"], desc: "Forest green, lime, warm yellow" },
  { id: "ocean", label: "Ocean Deep", colors: ["#0C4A6E", "#0EA5E9", "#F0F9FF"], desc: "Navy, sky blue, ice white" },
  { id: "warm", label: "Warm Gold", colors: ["#92400E", "#F59E0B", "#FFFBEB"], desc: "Amber, gold, warm cream" },
  { id: "rose", label: "Rose & Blush", colors: ["#9F1239", "#FB7185", "#FFF1F2"], desc: "Deep rose, blush pink, ivory" },
];

const VISUAL_AESTHETICS = [
  "Cinematic & film-grain", "Clean & editorial", "Street & documentary",
  "Dreamy & surreal", "Luxe & high-fashion", "Raw & DIY",
  "Retro & vintage", "Futuristic & digital", "Natural & organic",
  "Minimal & architectural",
];

const MOOD_WORDS_POOL = [
  "Urgent", "Timeless", "Sacred", "Hungry", "Tender", "Defiant",
  "Luminous", "Gritty", "Expansive", "Intimate", "Magnetic", "Quiet",
  "Electric", "Warm", "Cold", "Bold", "Subtle", "Ancestral",
];

const CAPTION_STYLES = [
  { id: "short", label: "Short & punchy", desc: "1–3 lines max. Hook first, nothing extra." },
  { id: "story", label: "Story-first", desc: "3–8 lines. Context, emotion, then the ask." },
  { id: "poetic", label: "Poetic / lyrical", desc: "Reads like lyrics or spoken word. Imagery over information." },
  { id: "direct", label: "Direct & factual", desc: "Announce, inform, done. No fluff." },
  { id: "conversational", label: "Conversational", desc: "Feels like a text from a friend. Lowercase, casual." },
  { id: "bilingual", label: "Bilingual / multilingual", desc: "Switches between languages naturally. Community-first." },
];

// ── Steps ──────────────────────────────────────────────────────────────────────
const STEPS = [
  { id: 0, label: "Artist & Market" },
  { id: 1, label: "Archetype" },
  { id: 2, label: "Sound & Vibe" },
  { id: 3, label: "Audience" },
  { id: 4, label: "Voice & Tone" },
  { id: 5, label: "Visual Identity" },
  { id: 6, label: "Brand Book" },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
function toggle<T>(arr: T[], val: T, max: number): T[] {
  if (arr.includes(val)) return arr.filter(v => v !== val);
  if (arr.length >= max) return arr;
  return [...arr, val];
}

function Pill({ label, active, onClick, color = MODULE_COLOR }: { label: string; active: boolean; onClick: () => void; color?: string }) {
  return (
    <button onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
        active
          ? "text-white border-transparent"
          : "text-text-muted border-border hover:border-brand/30 hover:text-text-primary"
      }`}
      style={active ? { backgroundColor: color, borderColor: color } : {}}>
      {label}
    </button>
  );
}

// ── Contextual next-step tools (archetype-aware) ─────────────────────────────
function getNextSteps(book: BrandBook) {
  // Always-on: Campaign Builder is the universal entry point after brand
  const tools: { href: string; icon: React.ElementType; color: string; title: string; why: string }[] = [
    {
      href: "/dashboard/campaign-builder",
      icon: Megaphone, color: "#C9A84C",
      title: "Campaign Builder",
      why: "Turn your brand identity into a full campaign plan — budget, channels, timeline, African market rates — in 20 seconds.",
    },
    {
      href: "/dashboard/tools/content-calendar",
      icon: CalendarDays, color: "#06B6D4",
      title: "Content Calendar",
      why: "12-month social strategy scaffolded around your release cycle and cultural moments in your market.",
    },
    {
      href: "/dashboard/library/marketing/ai-social-captions",
      icon: Hash, color: "#8B5CF6",
      title: "AI Social Captions",
      why: `Captions written in your ${book.captionStyle ? `"${book.captionStyle}" style` : "voice"} — not a generic template.`,
    },
    {
      href: "/dashboard/tools/viral-hooks",
      icon: Zap, color: "#F59E0B",
      title: "Viral Hooks Engine",
      why: "Platform hooks adapted to your archetype, genre, and tone so your content stops the scroll.",
    },
    {
      href: "/dashboard/library/marketing/epk-builder",
      icon: FileText, color: "#8B5CF6",
      title: "EPK Builder",
      why: "Your Brand Book is now ready to seed a full Electronic Press Kit for media, labels, and agents.",
    },
  ];

  // Reorder based on archetype: street poets → hooks first; performers → content first
  if (["the-performer", "the-pop-architect"].includes(book.archetype)) {
    // Move content calendar to top
    const cc = tools.splice(1, 1)[0];
    tools.unshift(cc);
  }
  if (["the-auteur", "the-confessionalist"].includes(book.archetype)) {
    // Move captions up (tone-first artists care about voice)
    const cap = tools.splice(2, 1)[0];
    tools.splice(1, 0, cap);
  }

  return tools.slice(0, 4); // show 4
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function BrandStudioPage() {
  const handleExportPDF = () => { window.print(); };
  const [step, setStep] = useState(0);
  const [book, setBook] = useState<BrandBook>(DEFAULT_BRAND_BOOK);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Persist to localStorage
  useToolRestore("brand-studio", STORAGE_KEY, setBook);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(book)); } catch {}
  }, [book]);

  async function saveToRoster() {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/brand-book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(book),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Save failed");
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Could not save — check your connection.");
    } finally {
      setSaving(false);
    }
  }

  const upd = (patch: Partial<BrandBook>) => setBook(b => ({ ...b, ...patch }));

  const canNext = () => {
    if (step === 0) return book.artistName.trim().length > 0 && book.market.length > 0;
    if (step === 1) return book.archetype.length > 0;
    if (step === 2) return book.subGenre.length > 0 && book.vibe.length > 0;
    if (step === 3) return book.audienceWho.trim().length > 0;
    if (step === 4) return book.toneOfVoice.length > 0 && book.captionStyle.length > 0;
    if (step === 5) return book.colorPalette.length > 0 && book.visualAesthetic.length > 0;
    return true;
  };

  const next = () => {
    if (step === 5) upd({ completed: true });
    if (step < 6) setStep(s => s + 1);
  };

  const reset = () => {
    setBook(DEFAULT_BRAND_BOOK);
    setStep(0);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  const selectedArchetype = ARCHETYPES.find(a => a.id === book.archetype);

  return (
    <div className="animate-fade-in max-w-3xl">
      <Link href="/dashboard/library/marketing" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary mb-6 transition-colors">
        <ChevronLeft size={15}/>Back to Marketing
      </Link>

      {/* Header */}
      <div className="glass-card rounded-2xl p-6 mb-7" style={{ borderColor: "#8B5CF625" }}>
        <div className="flex items-center gap-4">
          <SaveButton toolSlug="brand-studio" storageKey={STORAGE_KEY} title={`Brand Studio — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
            <ExportButton onPDF={handleExportPDF} />

          <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#8B5CF615" }}>
            <Sparkles size={26} style={{ color: MODULE_COLOR }}/>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: MODULE_COLOR }}>Brand Studio</p>
            <h1 className="text-2xl font-black text-text-primary">Brand Book Builder</h1>
            <p className="text-sm text-text-muted mt-0.5">A 15–25 minute identity session. Complete it once. Every other tool reads from it.</p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {STEPS.map((s, i) => (
            <button key={s.id} onClick={() => i <= step ? setStep(i) : undefined}
              className={`text-[10px] font-bold uppercase tracking-wide transition-colors ${
                i === step ? "text-brand" : i < step ? "text-text-muted cursor-pointer hover:text-text-primary" : "text-text-muted/40 cursor-default"
              }`}>
              {s.label}
            </button>
          ))}
        </div>
        <div className="h-1 bg-surface-2 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${(step / 6) * 100}%`, backgroundColor: MODULE_COLOR }}/>
        </div>
      </div>

      {/* ── Step 0: Artist & Market ── */}
      {step === 0 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-black text-text-primary mb-1">Let&apos;s start with who you are.</h2>
            <p className="text-sm text-text-muted">Your Brand Book is built around your market. Every archetype, reference, and recommendation localises to where you operate.</p>
          </div>
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-text-muted mb-2 block">Artist / Project Name</label>
            <input
              value={book.artistName}
              onChange={e => upd({ artistName: e.target.value })}
              placeholder="e.g. Lihle, DJ Maphorisa, Tems..."
              className="w-full glass-card rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted/50 outline-none focus:border-brand/40 transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-text-muted mb-2 block">Primary Market</label>
            <div className="flex flex-wrap gap-2">
              {MARKETS.map(m => (
                <Pill key={m} label={m} active={book.market === m} onClick={() => upd({ market: m })}/>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Step 1: Archetype ── */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-black text-text-primary mb-1">What is your creative identity?</h2>
            <p className="text-sm text-text-muted">Pick the archetype that best fits where you are right now — not where you want to be in five years. You can refine this later.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ARCHETYPES.map(a => {
              const Icon = a.icon;
              const active = book.archetype === a.id;
              return (
                <button key={a.id} onClick={() => upd({ archetype: a.id, archetypeRef: "" })}
                  className={`glass-card rounded-xl p-4 text-left transition-all border-2 ${
                    active ? "border-brand" : "border-transparent hover:border-brand/20"
                  }`}>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: active ? `${MODULE_COLOR}20` : "rgba(255,255,255,0.05)" }}>
                      <Icon size={18} style={{ color: active ? MODULE_COLOR : "var(--text-muted)" }}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-text-primary mb-0.5">{a.label}</p>
                      <p className="text-xs text-text-muted leading-relaxed">{a.desc}</p>
                    </div>
                    {active && <Check size={15} style={{ color: MODULE_COLOR }} className="flex-shrink-0 mt-1"/>}
                  </div>
                </button>
              );
            })}
          </div>

          {book.archetype && selectedArchetype && (
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-text-muted mb-2 block">
                Which artist feels like the closest reference for you? (optional)
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedArchetype.refs.map(r => (
                  <Pill key={r} label={r} active={book.archetypeRef === r} onClick={() => upd({ archetypeRef: book.archetypeRef === r ? "" : r })}/>
                ))}
                <Pill label="None of these" active={book.archetypeRef === "none"} onClick={() => upd({ archetypeRef: "none" })}/>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Step 2: Sound & Vibe ── */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-black text-text-primary mb-1">Sound and vibe.</h2>
            <p className="text-sm text-text-muted">Your sub-genre tells collaborators, journalists, and algorithms what world your music lives in. Your vibes tell them how it feels.</p>
          </div>
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-text-muted mb-2 block">Sub-Genre</label>
            <div className="flex flex-wrap gap-2">
              {SUB_GENRES.map(g => (
                <Pill key={g} label={g} active={book.subGenre === g} onClick={() => upd({ subGenre: book.subGenre === g ? "" : g })}/>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-text-muted mb-2 block">
              Vibe words <span className="font-normal opacity-60">(pick up to 4)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {VIBES.map(v => (
                <Pill key={v} label={v} active={book.vibe.includes(v)}
                  onClick={() => upd({ vibe: toggle(book.vibe, v, 4) })}/>
              ))}
            </div>
            {book.vibe.length >= 4 && (
              <p className="text-xs text-text-muted mt-2 opacity-60">Maximum 4 selected.</p>
            )}
          </div>
        </div>
      )}

      {/* ── Step 3: Audience ── */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-black text-text-primary mb-1">Who is your music for?</h2>
            <p className="text-sm text-text-muted">Be specific. A clear audience definition makes every marketing decision faster and every piece of content land harder.</p>
          </div>
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-text-muted mb-2 block">
              Describe your core listener <span className="font-normal opacity-60">(age, life stage, what they do on a Friday night...)</span>
            </label>
            <textarea
              value={book.audienceWho}
              onChange={e => upd({ audienceWho: e.target.value })}
              rows={3}
              placeholder="e.g. 22–30, urban professionals, they go from work drinks to a rooftop set. They follow fashion more than charts..."
              className="w-full glass-card rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted/50 outline-none focus:border-brand/40 transition-colors resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-text-muted mb-2 block">
              What else do they love? <span className="font-normal opacity-60">(artists, brands, shows, sports, movements...)</span>
            </label>
            <textarea
              value={book.audienceLoves}
              onChange={e => upd({ audienceLoves: e.target.value })}
              rows={2}
              placeholder="e.g. Burna Boy, Nike, Jordan Peele films, astrology, thrift culture, NBA..."
              className="w-full glass-card rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted/50 outline-none focus:border-brand/40 transition-colors resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-text-muted mb-2 block">
              What do they reject? <span className="font-normal opacity-60">(what turns them off immediately)</span>
            </label>
            <textarea
              value={book.audienceRejects}
              onChange={e => upd({ audienceRejects: e.target.value })}
              rows={2}
              placeholder="e.g. Inauthenticity, anything that feels like it's trying too hard, corporate energy..."
              className="w-full glass-card rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted/50 outline-none focus:border-brand/40 transition-colors resize-none"
            />
          </div>
        </div>
      )}

      {/* ── Step 4: Voice & Tone ── */}
      {step === 4 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-black text-text-primary mb-1">How do you speak?</h2>
            <p className="text-sm text-text-muted">Your tone of voice is as identifiable as your sound. This drives caption templates, pitch language, and how every tool writes for you.</p>
          </div>
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-text-muted mb-2 block">
              Tone of voice <span className="font-normal opacity-60">(pick up to 3)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {TONE_OPTIONS.map(t => (
                <Pill key={t} label={t} active={book.toneOfVoice.includes(t)}
                  onClick={() => upd({ toneOfVoice: toggle(book.toneOfVoice, t, 3) })}/>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-text-muted mb-2 block">Caption style</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CAPTION_STYLES.map(s => {
                const active = book.captionStyle === s.id;
                return (
                  <button key={s.id} onClick={() => upd({ captionStyle: s.id })}
                    className={`glass-card rounded-xl p-4 text-left transition-all border-2 ${active ? "border-brand" : "border-transparent hover:border-brand/20"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-sm text-text-primary mb-0.5">{s.label}</p>
                        <p className="text-xs text-text-muted leading-relaxed">{s.desc}</p>
                      </div>
                      {active && <Check size={14} style={{ color: MODULE_COLOR }} className="flex-shrink-0 mt-0.5"/>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Step 5: Visual Identity ── */}
      {step === 5 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-black text-text-primary mb-1">Visual direction.</h2>
            <p className="text-sm text-text-muted">Your colour palette and visual aesthetic guide photographers, video directors, thumbnail design, and every piece of branded content.</p>
          </div>
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-text-muted mb-3 block">Colour palette</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {COLOR_PALETTES.map(p => {
                const active = book.colorPalette[0] === p.id;
                return (
                  <button key={p.id} onClick={() => upd({ colorPalette: [p.id] })}
                    className={`glass-card rounded-xl p-3 text-left transition-all border-2 ${active ? "border-brand" : "border-transparent hover:border-brand/20"}`}>
                    <div className="flex gap-1 mb-2">
                      {p.colors.map(c => (
                        <div key={c} className="w-5 h-5 rounded-full border border-white/10" style={{ backgroundColor: c }}/>
                      ))}
                    </div>
                    <p className="text-xs font-bold text-text-primary">{p.label}</p>
                    <p className="text-[10px] text-text-muted mt-0.5 leading-tight">{p.desc}</p>
                    {active && <Check size={12} style={{ color: MODULE_COLOR }} className="mt-1"/>}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-text-muted mb-2 block">Visual aesthetic</label>
            <div className="flex flex-wrap gap-2">
              {VISUAL_AESTHETICS.map(v => (
                <Pill key={v} label={v} active={book.visualAesthetic === v} onClick={() => upd({ visualAesthetic: book.visualAesthetic === v ? "" : v })}/>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-text-muted mb-2 block">
              Mood words <span className="font-normal opacity-60">(pick up to 5 — what should your visuals make people feel?)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {MOOD_WORDS_POOL.map(w => (
                <Pill key={w} label={w} active={book.moodWords.includes(w)}
                  onClick={() => upd({ moodWords: toggle(book.moodWords, w, 5) })}/>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Step 6: Brand Book Output ── */}
      {step === 6 && (
        <div className="space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-text-primary mb-1">Your Brand Book.</h2>
              <p className="text-sm text-text-muted">Save this. Share it with your stylist, photographer, director, manager, and label. Every Roster tool now reads from this profile.</p>
            </div>
            <button onClick={reset} className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors flex-shrink-0">
              <RotateCcw size={13}/>Reset
            </button>
          </div>

          {/* Brand Book Card */}
          <div className="glass-card rounded-2xl overflow-hidden" style={{ borderColor: `${MODULE_COLOR}30` }}>
            {/* Header band */}
            <div className="px-6 py-5" style={{ backgroundColor: `${MODULE_COLOR}12`, borderBottom: `1px solid ${MODULE_COLOR}20` }}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: MODULE_COLOR }}>Artist Brand Book · {new Date().getFullYear()}</p>
                  <h3 className="text-2xl font-black text-text-primary">{book.artistName || "—"}</h3>
                  <p className="text-sm text-text-muted mt-0.5">{book.market} · {book.subGenre}</p>
                </div>
                {book.colorPalette[0] && (
                  <div className="flex gap-1.5 flex-shrink-0">
                    {(COLOR_PALETTES.find(p => p.id === book.colorPalette[0])?.colors ?? []).map(c => (
                      <div key={c} className="w-7 h-7 rounded-full border border-white/10" style={{ backgroundColor: c }}/>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Archetype */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1.5">Archetype</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-text-primary">{selectedArchetype?.label ?? "—"}</span>
                  {book.archetypeRef && book.archetypeRef !== "none" && (
                    <span className="text-xs text-text-muted">· Reference: {book.archetypeRef}</span>
                  )}
                </div>
                {selectedArchetype && (
                  <p className="text-xs text-text-muted mt-0.5">{selectedArchetype.desc}</p>
                )}
              </div>

              {/* Vibe */}
              {book.vibe.length > 0 && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1.5">Vibe</p>
                  <div className="flex flex-wrap gap-1.5">
                    {book.vibe.map(v => (
                      <span key={v} className="text-xs font-semibold px-2 py-0.5 rounded" style={{ color: MODULE_COLOR, backgroundColor: `${MODULE_COLOR}15` }}>{v}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Audience */}
              {book.audienceWho && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1.5">Core Listener</p>
                  <p className="text-sm text-text-primary leading-relaxed">{book.audienceWho}</p>
                  {book.audienceLoves && (
                    <p className="text-xs text-text-muted mt-1"><span className="font-semibold">Loves:</span> {book.audienceLoves}</p>
                  )}
                  {book.audienceRejects && (
                    <p className="text-xs text-text-muted mt-0.5"><span className="font-semibold">Rejects:</span> {book.audienceRejects}</p>
                  )}
                </div>
              )}

              {/* Tone & Caption */}
              {(book.toneOfVoice.length > 0 || book.captionStyle) && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1.5">Voice & Tone</p>
                  {book.toneOfVoice.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-1.5">
                      {book.toneOfVoice.map(t => (
                        <span key={t} className="text-xs font-semibold px-2 py-0.5 rounded" style={{ color: MODULE_COLOR, backgroundColor: `${MODULE_COLOR}15` }}>{t}</span>
                      ))}
                    </div>
                  )}
                  {book.captionStyle && (
                    <p className="text-xs text-text-muted">Caption style: <span className="font-semibold text-text-primary">{CAPTION_STYLES.find(s => s.id === book.captionStyle)?.label}</span></p>
                  )}
                </div>
              )}

              {/* Visual */}
              {(book.colorPalette.length > 0 || book.visualAesthetic || book.moodWords.length > 0) && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1.5">Visual Identity</p>
                  {book.colorPalette[0] && (
                    <p className="text-xs text-text-muted mb-1">Palette: <span className="font-semibold text-text-primary">{COLOR_PALETTES.find(p => p.id === book.colorPalette[0])?.label}</span> — {COLOR_PALETTES.find(p => p.id === book.colorPalette[0])?.desc}</p>
                  )}
                  {book.visualAesthetic && (
                    <p className="text-xs text-text-muted mb-1">Aesthetic: <span className="font-semibold text-text-primary">{book.visualAesthetic}</span></p>
                  )}
                  {book.moodWords.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {book.moodWords.map(w => (
                        <span key={w} className="text-xs font-semibold px-2 py-0.5 rounded" style={{ color: MODULE_COLOR, backgroundColor: `${MODULE_COLOR}15` }}>{w}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Save / Export actions */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Save to ROSTER */}
            <button
              onClick={saveToRoster}
              disabled={saving || saved}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{ backgroundColor: MODULE_COLOR, color: "#fff", opacity: saving ? 0.7 : 1 }}>
              {saving ? <Loader2 size={15} className="animate-spin" /> : saved ? <CheckCircle2 size={15} /> : <Save size={15} />}
              {saving ? "Saving…" : saved ? "Saved to ROSTER" : "Save to ROSTER"}
            </button>
            {/* PDF export */}
            
          </div>
          {saveError && (
            <p className="text-xs text-error">{saveError}</p>
          )}
          {saved && (
            <p className="text-xs" style={{ color: "#1DB954" }}>
              ✓ Brand Book saved. You can access all saved brand books from the Brand Studio tab.
            </p>
          )}

          {/* ── What ROSTER now recommends ──────────────────────── */}
          <div className="pt-2">
            <div className="mb-4">
              <p className="text-xs font-black uppercase tracking-wider mb-0.5" style={{ color: MODULE_COLOR }}>
                Your Brand Book is active — here's what to build next
              </p>
              <p className="text-xs text-text-muted">
                ROSTER has read your profile. These tools are now personalised to <span className="font-semibold text-text-primary">{book.artistName || "you"}</span> — not a generic template.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {getNextSteps(book).map((tool, i) => {
                const Icon = tool.icon;
                const isPrimary = i === 0;
                return (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    className="glass-card rounded-xl p-4 flex items-start gap-3 group transition-all hover:border-brand/30"
                    style={isPrimary ? { borderColor: `${tool.color}40`, backgroundColor: `${tool.color}06` } : {}}
                  >
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                         style={{ backgroundColor: `${tool.color}15` }}>
                      <Icon size={17} style={{ color: tool.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <p className="text-sm font-bold text-text-primary group-hover:text-brand transition-colors">{tool.title}</p>
                        {isPrimary && (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded"
                                style={{ color: tool.color, backgroundColor: `${tool.color}20` }}>Start here</span>
                        )}
                      </div>
                      <p className="text-xs text-text-muted leading-snug">{tool.why}</p>
                    </div>
                    <ArrowRight size={14} className="text-text-muted group-hover:text-brand group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-0.5" />
                  </Link>
                );
              })}
            </div>

            <div className="mt-4 glass-card rounded-xl p-4 flex items-start gap-3"
                 style={{ borderColor: `${MODULE_COLOR}15`, backgroundColor: `${MODULE_COLOR}04` }}>
              <Sparkles size={14} style={{ color: MODULE_COLOR }} className="flex-shrink-0 mt-0.5" />
              <p className="text-xs text-text-muted leading-relaxed">
                <span className="font-semibold text-text-primary">Every tool above reads from your Brand Book.</span>{" "}
                The Viral Hooks Engine, Pitching Scripts, Content Calendar, AI Captions, and YouTube Growth Module
                now use your archetype, tone, and visual direction — so output sounds like {book.artistName || "you"}, not a template.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      {step < 6 && (
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-border">
          <button onClick={() => setStep(s => s - 1)} disabled={step === 0}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              step === 0 ? "opacity-30 cursor-not-allowed" : "hover:bg-surface-2"
            } text-text-muted`}>
            <ChevronLeft size={16}/>Back
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">{step + 1} of {STEPS.length}</span>
          </div>
          <button onClick={next} disabled={!canNext()}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              canNext()
                ? "text-white hover:opacity-90"
                : "opacity-30 cursor-not-allowed text-text-muted bg-surface-2"
            }`}
            style={canNext() ? { backgroundColor: MODULE_COLOR } : {}}>
            {step === 5 ? "Generate Brand Book" : "Continue"}
            <ChevronRight size={16}/>
          </button>
        </div>
      )}
    </div>
  );
}
