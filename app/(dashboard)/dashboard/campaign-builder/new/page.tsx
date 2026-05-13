"use client";
// ============================================================
// ROSTER — Campaign Builder — New Campaign Wizard
// Step 1: Context review (pre-loaded from ROSTER data)
// Step 2: Campaign declaration (title, goal, budget, markets)
// Step 3: Your story (story, assets, creative vision)
// Step 4: Generating → Plan view
// ============================================================

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, ChevronRight, Loader2, AlertCircle,
  TrendingUp, Ticket, Radio, ShoppingBag, Check,
  Users, MessageCircle, Music, Calendar, Zap,
  Megaphone, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────
interface ArtistContext {
  artist_name: string | null;
  monthly_listeners: number;
  followers: number;
  compass_score: number;
  momentum: "up" | "flat" | "down";
  reach_tier: "micro" | "emerging" | "established";
  fan_crm_count: number;
  wa_count: number;
  release_date: string | null;
  release_title: string | null;
  days_to_release: number | null;
}

type Goal = "streams" | "tickets" | "awareness" | "merch";
type Market = "ZA" | "NG" | "KE" | "GH" | "UK" | "US";

// ── Constants ──────────────────────────────────────────────────
const GOALS: { value: Goal; label: string; desc: string; icon: React.ElementType; color: string }[] = [
  { value: "streams",   label: "Streams",   icon: TrendingUp,  color: "#1DB954", desc: "DSP growth, playlists, algorithmic push" },
  { value: "tickets",   label: "Tickets",   icon: Ticket,      color: "#E05C5C", desc: "Drive attendance to a show or tour" },
  { value: "awareness", label: "Awareness", icon: Radio,       color: "#4B9FE1", desc: "Press, editorial, broader discovery" },
  { value: "merch",     label: "Merch",     icon: ShoppingBag, color: "#C9A84C", desc: "E-commerce conversions for product launch" },
];

const MARKETS: { value: Market; label: string; region: string }[] = [
  { value: "ZA", label: "South Africa", region: "Southern Africa" },
  { value: "NG", label: "Nigeria",      region: "West Africa" },
  { value: "KE", label: "Kenya",        region: "East Africa" },
  { value: "GH", label: "Ghana",        region: "West Africa" },
  { value: "UK", label: "United Kingdom", region: "Diaspora" },
  { value: "US", label: "United States",  region: "Diaspora" },
];

const BUDGET_PRESETS = [1000, 2500, 5000, 10000, 25000];

const MOMENTUM_LABELS: Record<string, string> = {
  up: "↑ Growing", flat: "→ Stable", down: "↓ Declining",
};
const TIER_LABELS: Record<string, string> = {
  micro: "Micro (under 10k)", emerging: "Emerging (10k–100k)", established: "Established (100k+)",
};

// ── Component ─────────────────────────────────────────────────
export default function NewCampaignPage() {
  const router = useRouter();
  const [step, setStep]   = useState(1);
  const [ctx, setCtx]     = useState<ArtistContext | null>(null);
  const [artists, setArtists] = useState<{ id: string; name: string }[]>([]);
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);
  const [ctxLoading, setCtxLoading] = useState(true);

  // Step 2 fields
  const [title, setTitle]           = useState("");
  const [goal, setGoal]             = useState<Goal | "">("");
  const [budgetRaw, setBudgetRaw]   = useState("");
  const [markets, setMarkets]       = useState<Market[]>([]);

  // Step 3 fields
  const [story, setStory]               = useState("");
  const [assetsInHand, setAssetsInHand] = useState("");
  const [creativeVision, setCreativeVision] = useState("");

  // Step 4
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError]     = useState<string | null>(null);
  const [campaignId, setCampaignId] = useState<string | null>(null);

  // ── Load context ───────────────────────────────────────────
  useEffect(() => {
    const url = selectedArtistId
      ? `/api/campaign-builder/context?artistId=${selectedArtistId}`
      : "/api/campaign-builder/context";
    setCtxLoading(true);
    fetch(url)
      .then(r => r.json())
      .then(d => {
        if (d.artists) setArtists(d.artists);
        if (d.context) {
          setCtx(d.context);
          if (!selectedArtistId && d.context.artist_id) setSelectedArtistId(d.context.artist_id);
        }
      })
      .catch(() => {})
      .finally(() => setCtxLoading(false));
  }, [selectedArtistId]);

  // Auto-set title when context loads and we have a release
  useEffect(() => {
    if (ctx?.release_title && !title) {
      setTitle(`${ctx.release_title} — ${new Date().toLocaleDateString("en-ZA", { month: "long", year: "numeric" })}`);
    }
  }, [ctx]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived ───────────────────────────────────────────────
  const budget = parseInt(budgetRaw.replace(/\D/g, ""), 10) || 0;

  const step2Valid = title.trim().length > 0 && goal !== "" && budget >= 500 && markets.length > 0;
  const step3Valid = true; // story fields are optional

  function toggleMarket(m: Market) {
    setMarkets(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  }

  // ── Generate campaign ──────────────────────────────────────
  async function generateCampaign() {
    setGenerating(true);
    setGenError(null);
    setStep(4);
    try {
      const res = await fetch("/api/campaign-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title:            title.trim(),
          goal,
          budget_zar:       budget,
          markets,
          story:            story.trim() || null,
          assets_in_hand:   assetsInHand.trim() || null,
          creative_vision:  creativeVision.trim() || null,
          context_snapshot: ctx ?? undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setCampaignId(data.campaign.id);
      // Redirect to the plan view
      router.push(`/dashboard/campaign-builder/${data.campaign.id}`);
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "Something went wrong");
      setGenerating(false);
    }
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      {/* Back link */}
      <Link
        href="/dashboard/campaign-builder"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary mb-6 transition-colors"
      >
        <ChevronLeft size={15} /> Campaign Builder
      </Link>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all",
              step > s  ? "bg-brand text-black"          :
              step === s ? "bg-brand text-black ring-2 ring-brand/30" :
                           "bg-surface-2 text-text-muted"
            )}>
              {step > s ? <Check size={13} /> : s}
            </div>
            {s < 3 && <div className={cn("h-px flex-1 w-10 transition-all", step > s ? "bg-brand" : "bg-border")} />}
          </div>
        ))}
        <span className="text-xs text-text-muted ml-2">
          {step === 1 ? "Your context" : step === 2 ? "Campaign details" : step === 3 ? "Your story" : "Generating…"}
        </span>
      </div>

      {/* ── STEP 1 — Context Review ────────────────────────── */}
      {step === 1 && (
        <div>
          <div className="glass-card rounded-2xl p-6 mb-7" style={{ borderColor: "#C9A84C25" }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#C9A84C15" }}>
                <Zap size={18} style={{ color: "#C9A84C" }} />
              </div>
              <div>
                <h1 className="text-xl font-black text-text-primary">Your ROSTER context</h1>
                <p className="text-xs text-text-muted mt-0.5">This data pre-loads from your dashboard to personalise the plan.</p>
              </div>
            </div>

            {/* Artist selector — only shown when user has multiple artists */}
            {artists.length >= 1 && (
              <div className="mb-4">
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Select artist</label>
                <select
                  value={selectedArtistId ?? ""}
                  onChange={e => setSelectedArtistId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-sm text-text-primary focus:outline-none focus:border-brand/50 transition-colors"
                >
                  {artists.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
            )}

            {ctxLoading ? (
              <div className="flex items-center gap-2 text-text-muted py-4">
                <Loader2 size={16} className="animate-spin" /> Loading your data…
              </div>
            ) : ctx ? (
              <div className="grid grid-cols-2 gap-3">
                {/* Artist */}
                <div className="glass-card rounded-xl p-4 col-span-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Music size={14} className="text-text-muted" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Artist</span>
                  </div>
                  <p className="text-lg font-bold text-text-primary">{ctx.artist_name ?? "Unknown — link your Spotify first"}</p>
                </div>

                {/* Listeners + Followers */}
                <div className="glass-card rounded-xl p-4">
                  <p className="text-xs text-text-muted mb-1">Monthly listeners</p>
                  <p className="text-xl font-black text-text-primary">{ctx.monthly_listeners.toLocaleString()}</p>
                  <p className="text-xs text-text-muted mt-1">{TIER_LABELS[ctx.reach_tier]}</p>
                </div>
                <div className="glass-card rounded-xl p-4">
                  <p className="text-xs text-text-muted mb-1">Compass score</p>
                  <p className="text-xl font-black text-text-primary">{ctx.compass_score}<span className="text-sm text-text-muted">/100</span></p>
                  <p className="text-xs mt-1" style={{ color: ctx.momentum === "up" ? "#1DB954" : ctx.momentum === "down" ? "#E05C5C" : "var(--text-muted)" }}>
                    {MOMENTUM_LABELS[ctx.momentum]}
                  </p>
                </div>

                {/* Fan CRM */}
                <div className="glass-card rounded-xl p-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Users size={12} className="text-text-muted" />
                    <p className="text-xs text-text-muted">Fan CRM</p>
                  </div>
                  <p className="text-xl font-black text-text-primary">{ctx.fan_crm_count.toLocaleString()}</p>
                  <p className="text-xs text-text-muted mt-1">{ctx.wa_count} with WhatsApp</p>
                </div>

                {/* Release */}
                <div className="glass-card rounded-xl p-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Calendar size={12} className="text-text-muted" />
                    <p className="text-xs text-text-muted">Upcoming release</p>
                  </div>
                  {ctx.release_title ? (
                    <>
                      <p className="text-sm font-bold text-text-primary truncate">"{ctx.release_title}"</p>
                      <p className="text-xs text-text-muted mt-1">in {ctx.days_to_release} days</p>
                    </>
                  ) : (
                    <p className="text-sm text-text-muted italic">None planned yet</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-text-muted text-sm">
                <AlertCircle size={15} />
                Could not load context. You can still build a campaign.
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all"
              style={{ backgroundColor: "#C9A84C", color: "#000" }}
            >
              Continue <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2 — Campaign Declaration ─────────────────── */}
      {step === 2 && (
        <div>
          <div className="glass-card rounded-2xl p-6 mb-6" style={{ borderColor: "#C9A84C25" }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#C9A84C15" }}>
                <Megaphone size={18} style={{ color: "#C9A84C" }} />
              </div>
              <div>
                <h1 className="text-xl font-black text-text-primary">Campaign details</h1>
                <p className="text-xs text-text-muted mt-0.5">Define what you want to achieve and with what resources.</p>
              </div>
            </div>

            {/* Title */}
            <div className="mb-5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Campaign title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Midnight Rain EP — June 2026"
                className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand/50 transition-colors"
              />
            </div>

            {/* Goal */}
            <div className="mb-5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Primary goal</label>
              <div className="grid grid-cols-2 gap-2">
                {GOALS.map(g => {
                  const Icon = g.icon;
                  const active = goal === g.value;
                  return (
                    <button
                      key={g.value}
                      onClick={() => setGoal(g.value)}
                      className={cn(
                        "flex items-start gap-3 p-4 rounded-xl border text-left transition-all",
                        active ? "border-brand/50 bg-brand/5" : "border-border hover:border-border/80 hover:bg-surface-2/40"
                      )}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                           style={{ backgroundColor: `${g.color}15` }}>
                        <Icon size={16} style={{ color: g.color }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text-primary">{g.label}</p>
                        <p className="text-xs text-text-muted mt-0.5 leading-snug">{g.desc}</p>
                      </div>
                      {active && (
                        <Check size={14} className="ml-auto flex-shrink-0 mt-1" style={{ color: "#C9A84C" }} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Budget */}
            <div className="mb-5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                Total budget (ZAR)
              </label>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-text-muted font-medium">R</span>
                <input
                  type="text"
                  value={budgetRaw}
                  onChange={e => setBudgetRaw(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="5000"
                  className="flex-1 px-4 py-3 rounded-xl border border-border bg-surface text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand/50 transition-colors"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {BUDGET_PRESETS.map(p => (
                  <button
                    key={p}
                    onClick={() => setBudgetRaw(String(p))}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                      budget === p ? "border-brand/50 text-brand bg-brand/5" : "border-border text-text-muted hover:border-border/80"
                    )}
                  >
                    R{p.toLocaleString()}
                  </button>
                ))}
              </div>
              {budget > 0 && budget < 500 && (
                <p className="text-xs text-error mt-2">Minimum budget is R500</p>
              )}
            </div>

            {/* Markets */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Target markets</label>
              <div className="grid grid-cols-3 gap-2">
                {MARKETS.map(m => {
                  const active = markets.includes(m.value);
                  return (
                    <button
                      key={m.value}
                      onClick={() => toggleMarket(m.value)}
                      className={cn(
                        "flex flex-col items-start px-3 py-2.5 rounded-xl border text-left transition-all",
                        active ? "border-brand/50 bg-brand/5" : "border-border hover:border-border/80 hover:bg-surface-2/40"
                      )}
                    >
                      <span className={cn("text-sm font-semibold", active ? "text-brand" : "text-text-primary")}>{m.value}</span>
                      <span className="text-[10px] text-text-muted mt-0.5">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-text-muted hover:text-text-primary transition-colors">
              <ChevronLeft size={15} /> Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!step2Valid}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all",
                step2Valid
                  ? "opacity-100 cursor-pointer"
                  : "opacity-40 cursor-not-allowed"
              )}
              style={{ backgroundColor: "#C9A84C", color: "#000" }}
            >
              Continue <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3 — Your Story ────────────────────────────── */}
      {step === 3 && (
        <div>
          <div className="glass-card rounded-2xl p-6 mb-6" style={{ borderColor: "#C9A84C25" }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#C9A84C15" }}>
                <Sparkles size={18} style={{ color: "#C9A84C" }} />
              </div>
              <div>
                <h1 className="text-xl font-black text-text-primary">Your story</h1>
                <p className="text-xs text-text-muted mt-0.5">This is what creates texture. ✦ ROSTER AI builds from your voice, not generic templates.</p>
              </div>
            </div>

            <div className="mt-5 glass-card rounded-xl p-4 mb-6" style={{ borderColor: "#C9A84C20", backgroundColor: "#C9A84C06" }}>
              <p className="text-xs text-text-muted leading-relaxed">
                <span className="font-semibold" style={{ color: "#C9A84C" }}>Why this matters:</span>{" "}
                Your context data (listeners, score, budget) gives ✦ ROSTER AI the skeleton. Your story gives it the soul.
                The more you share, the more the plan will feel like yours — not like something off a shelf.
                All fields are optional, but every sentence you write makes the output sharper.
              </p>
            </div>

            {/* Story */}
            <div className="mb-5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
                What is this release about?
              </label>
              <p className="text-xs text-text-muted mb-2">The story behind the music. What does it mean to you? Who is it for?</p>
              <textarea
                value={story}
                onChange={e => setStory(e.target.value)}
                rows={4}
                placeholder="e.g. This EP is about leaving home at 19 and finding yourself in a new city. Three of the tracks were recorded in a single session during load-shedding with just a phone and a Bluetooth speaker…"
                className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand/50 transition-colors resize-none"
              />
            </div>

            {/* Assets in hand */}
            <div className="mb-5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
                What do you already have in motion?
              </label>
              <p className="text-xs text-text-muted mb-2">Content created, press coverage booked, influencer conversations started, radio plugger briefed, etc.</p>
              <textarea
                value={assetsInHand}
                onChange={e => setAssetsInHand(e.target.value)}
                rows={3}
                placeholder="e.g. I have a 90-second visual already shot. I've spoken to two SA music blogs. My WhatsApp list has been quiet for 3 months so there's pent-up engagement…"
                className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand/50 transition-colors resize-none"
              />
            </div>

            {/* Creative vision */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
                Your campaign ideas and creative vision
              </label>
              <p className="text-xs text-text-muted mb-2">Any specific ideas for how you want to push this? Concepts, aesthetics, angles you've been thinking about.</p>
              <textarea
                value={creativeVision}
                onChange={e => setCreativeVision(e.target.value)}
                rows={3}
                placeholder="e.g. I want to lean into the 'African noir' visual aesthetic. I'm thinking a slow-burn TikTok reveal series — 4 clips leading up to release day. I'd love to get one mid-tier SA influencer in the lifestyle space…"
                className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand/50 transition-colors resize-none"
              />
            </div>
          </div>

          {/* Summary before generate */}
          <div className="glass-card rounded-xl p-4 mb-5 text-xs text-text-muted space-y-1">
            <p className="font-semibold text-text-primary text-sm mb-2">Ready to generate</p>
            <p><span className="font-medium text-text-primary">{title}</span></p>
            <p>Goal: <span className="text-text-primary">{GOALS.find(g => g.value === goal)?.label}</span> · Budget: <span className="text-text-primary">R{budget.toLocaleString()}</span></p>
            <p>Markets: <span className="text-text-primary">{markets.join(", ")}</span></p>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(2)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-text-muted hover:text-text-primary transition-colors">
              <ChevronLeft size={15} /> Back
            </button>
            <button
              onClick={generateCampaign}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all"
              style={{ backgroundColor: "#C9A84C", color: "#000" }}
            >
              <Sparkles size={16} />
              Generate campaign plan
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 4 — Generating ────────────────────────────── */}
      {step === 4 && (
        <div className="glass-card rounded-2xl p-10 text-center" style={{ borderColor: "#C9A84C25" }}>
          {generating && (
            <>
              <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center"
                   style={{ backgroundColor: "#C9A84C15" }}>
                <Loader2 size={28} className="animate-spin" style={{ color: "#C9A84C" }} />
              </div>
              <h2 className="text-xl font-black text-text-primary mb-2">Building your plan…</h2>
              <p className="text-sm text-text-muted max-w-xs mx-auto">
                ✦ ROSTER AI is crafting a personalised campaign strategy for your release. This takes about 10–20 seconds.
              </p>
              <div className="mt-6 space-y-2 text-left max-w-xs mx-auto">
                {[
                  "Reading your artist context",
                  "Allocating budget to channels",
                  "Mapping market rates and channels",
                  "Building your campaign timeline",
                  "Integrating your story",
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-text-muted">
                    <div className="w-4 h-4 rounded-full border border-border/50 flex items-center justify-center flex-shrink-0"
                         style={{ borderColor: "#C9A84C40" }}>
                      <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: "#C9A84C", animationDelay: `${i * 200}ms` }} />
                    </div>
                    {step}
                  </div>
                ))}
              </div>
            </>
          )}

          {genError && (
            <>
              <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center bg-error/10">
                <AlertCircle size={28} className="text-error" />
              </div>
              <h2 className="text-xl font-black text-text-primary mb-2">Generation failed</h2>
              <p className="text-sm text-error mb-6">{genError}</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => { setStep(3); setGenError(null); }}
                  className="px-5 py-2.5 rounded-xl border border-border text-sm font-medium text-text-muted hover:text-text-primary transition-colors"
                >
                  Go back
                </button>
                <button
                  onClick={generateCampaign}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold"
                  style={{ backgroundColor: "#C9A84C", color: "#000" }}
                >
                  Try again
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
