"use client";
// ============================================================
// ROSTER — Campaign Builder — Campaign Plan View
// Renders the AI-generated plan in a rich, actionable layout:
//  • Headline + campaign window
//  • Budget summary + allocation breakdown (table + visual)
//  • Timeline (week-by-week arc)
//  • Owned media integrations (WhatsApp CRM, email, social)
//  • Key insight + risk flags
// ============================================================

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ChevronLeft, Loader2, AlertCircle, TrendingUp, Ticket,
  Radio, ShoppingBag, MessageCircle, Users, Calendar,
  Lightbulb, AlertTriangle, Check, Clock, Zap,
  BarChart3, Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────
interface BudgetLine {
  channel: string;
  category: string;
  spend_zar: number;
  pct_of_budget: number;
  what_it_buys: string;
  timing_label: string;
  peak_week: number;
  rate_context: string;
  is_owned: boolean;
}

interface OwnedMedia {
  channel: string;
  asset_description: string;
  action: string;
  est_opens_or_reach: number;
  messaging_plan: string;
  cost_zar: number;
}

interface TimelineWeek {
  week: number;
  label: string;
  activities: string[];
}

interface Plan {
  headline: string;
  campaign_window: { total_weeks: number; pre_release_weeks: number; post_release_weeks: number };
  budget_summary: { total_zar: number; paid_total_zar: number; owned_savings_zar: number };
  budget_allocation: BudgetLine[];
  owned_media: OwnedMedia[];
  timeline: TimelineWeek[];
  key_insight: string;
  risk_flags: string[];
}

interface Campaign {
  id: string;
  title: string;
  goal: string;
  budget_zar: number;
  markets: string[];
  status: string;
  story: string | null;
  assets_in_hand: string | null;
  creative_vision: string | null;
  plan: Plan | null;
  context_snapshot: Record<string, unknown>;
  created_at: string;
}

// ── Constants ──────────────────────────────────────────────────
const GOAL_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  streams:   { label: "Streams",   icon: TrendingUp,  color: "#1DB954" },
  tickets:   { label: "Tickets",   icon: Ticket,      color: "#E05C5C" },
  awareness: { label: "Awareness", icon: Radio,       color: "#4B9FE1" },
  merch:     { label: "Merch",     icon: ShoppingBag, color: "#C9A84C" },
};

const CATEGORY_COLORS: Record<string, string> = {
  paid_social: "#4B9FE1",
  radio:       "#E05C5C",
  ooh:         "#9B59B6",
  pr:          "#F39C12",
  influencer:  "#1ABC9C",
  dsp:         "#1DB954",
  playlist:    "#27AE60",
  content:     "#E67E22",
};

const MARKET_NAMES: Record<string, string> = {
  ZA: "South Africa", NG: "Nigeria", KE: "Kenya",
  GH: "Ghana", UK: "United Kingdom", US: "United States",
};

// ── Component ──────────────────────────────────────────────────
export default function CampaignPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/campaign-builder/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.campaign) setCampaign(d.campaign);
        else setError("Campaign not found");
      })
      .catch(() => setError("Failed to load campaign"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-text-muted">
        <Loader2 size={22} className="animate-spin mr-2" /> Loading campaign…
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="max-w-xl mx-auto mt-20">
        <div className="glass-card rounded-xl p-6 flex items-center gap-3 text-error">
          <AlertCircle size={20} />
          <p className="text-sm">{error ?? "Campaign not found"}</p>
        </div>
        <Link href="/dashboard/campaign-builder" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary mt-4 transition-colors">
          <ChevronLeft size={14} /> Back to campaigns
        </Link>
      </div>
    );
  }

  const plan = campaign.plan as Plan | null;
  const goal = GOAL_META[campaign.goal] ?? GOAL_META.streams;
  const GoalIcon = goal.icon;

  // ── Still generating ──────────────────────────────────────
  if (campaign.status === "generating" || !plan) {
    return (
      <div className="max-w-xl mx-auto animate-fade-in">
        <Link href="/dashboard/campaign-builder" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary mb-6 transition-colors">
          <ChevronLeft size={14} /> Campaign Builder
        </Link>
        <div className="glass-card rounded-2xl p-10 text-center" style={{ borderColor: "#C9A84C25" }}>
          <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{ backgroundColor: "#C9A84C15" }}>
            <Loader2 size={28} className="animate-spin" style={{ color: "#C9A84C" }} />
          </div>
          <h2 className="text-xl font-black text-text-primary mb-2">Generating your plan…</h2>
          <p className="text-sm text-text-muted">The AI is working on your campaign. Refresh in a few seconds.</p>
        </div>
      </div>
    );
  }

  // ── Timeline helpers ───────────────────────────────────────
  const sortedTimeline = [...(plan.timeline ?? [])].sort((a, b) => a.week - b.week);

  // ── Render plan ────────────────────────────────────────────
  return (
    <div className="animate-fade-in max-w-4xl">
      {/* Back */}
      <Link href="/dashboard/campaign-builder" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary mb-6 transition-colors">
        <ChevronLeft size={14} /> Campaign Builder
      </Link>

      {/* ── Hero header ─────────────────────────────────────── */}
      <div className="glass-card rounded-2xl p-6 mb-6" style={{ borderColor: "#C9A84C25" }}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
               style={{ backgroundColor: `${goal.color}15` }}>
            <GoalIcon size={22} style={{ color: goal.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: "#C9A84C" }}>
              Campaign Plan
            </p>
            <h1 className="text-2xl font-black text-text-primary leading-tight">{campaign.title}</h1>
            <div className="flex items-center gap-3 mt-2 text-xs text-text-muted flex-wrap">
              <span style={{ color: goal.color }} className="font-semibold">{goal.label}</span>
              <span>R{campaign.budget_zar.toLocaleString()} ZAR</span>
              <span>{campaign.markets.map(m => MARKET_NAMES[m] ?? m).join(", ")}</span>
              <span className="flex items-center gap-1">
                <Clock size={11} />
                {new Date(campaign.created_at).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}
              </span>
            </div>
          </div>
        </div>

        {/* AI Headline */}
        <div className="mt-5 pt-5 border-t border-border/40">
          <p className="text-sm font-bold text-text-primary leading-relaxed italic">"{plan.headline}"</p>
        </div>
      </div>

      {/* ── Campaign window + Budget summary ────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <Calendar size={12} className="text-text-muted" />
            <p className="text-xs text-text-muted">Total window</p>
          </div>
          <p className="text-xl font-black text-text-primary">{plan.campaign_window.total_weeks}<span className="text-sm font-medium text-text-muted ml-1">wks</span></p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <BarChart3 size={12} className="text-text-muted" />
            <p className="text-xs text-text-muted">Paid spend</p>
          </div>
          <p className="text-xl font-black text-text-primary">R{plan.budget_summary.paid_total_zar.toLocaleString()}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <MessageCircle size={12} className="text-text-muted" />
            <p className="text-xs text-text-muted">Owned value</p>
          </div>
          <p className="text-xl font-black" style={{ color: "#1DB954" }}>R{plan.budget_summary.owned_savings_zar.toLocaleString()}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <Globe size={12} className="text-text-muted" />
            <p className="text-xs text-text-muted">Markets</p>
          </div>
          <p className="text-xl font-black text-text-primary">{campaign.markets.length}</p>
        </div>
      </div>

      {/* ── Budget allocation ────────────────────────────────── */}
      <div className="glass-card rounded-2xl p-6 mb-6">
        <h2 className="text-base font-black text-text-primary mb-4">Budget allocation</h2>

        {/* Visual bars */}
        <div className="flex h-3 rounded-full overflow-hidden mb-4 gap-0.5">
          {plan.budget_allocation
            .filter(l => !l.is_owned)
            .sort((a, b) => b.spend_zar - a.spend_zar)
            .map((line, i) => {
              const color = CATEGORY_COLORS[line.category] ?? "#C9A84C";
              return (
                <div
                  key={i}
                  title={`${line.channel}: R${line.spend_zar.toLocaleString()} (${line.pct_of_budget}%)`}
                  className="h-full transition-all"
                  style={{ width: `${line.pct_of_budget}%`, backgroundColor: color }}
                />
              );
            })}
        </div>

        {/* Table */}
        <div className="space-y-2">
          {plan.budget_allocation.map((line, i) => {
            const color = line.is_owned ? "#1DB954" : (CATEGORY_COLORS[line.category] ?? "#C9A84C");
            return (
              <div key={i} className="grid grid-cols-[1fr_auto] gap-4 py-3 border-b border-border/30 last:border-0">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-sm font-semibold text-text-primary">{line.channel}</span>
                    {line.is_owned && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide"
                            style={{ backgroundColor: "#1DB95420", color: "#1DB954" }}>Free</span>
                    )}
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-medium text-text-muted bg-surface-2">
                      {line.timing_label}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted pl-4 leading-snug">{line.what_it_buys}</p>
                  <p className="text-[10px] text-text-muted/70 pl-4 mt-0.5 italic">{line.rate_context}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-text-primary">
                    {line.is_owned ? "—" : `R${line.spend_zar.toLocaleString()}`}
                  </p>
                  {!line.is_owned && (
                    <p className="text-xs text-text-muted">{line.pct_of_budget}%</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Total */}
        <div className="flex justify-between items-center pt-3 border-t border-border mt-2">
          <span className="text-sm font-bold text-text-primary">Total paid</span>
          <span className="text-base font-black text-text-primary">R{plan.budget_summary.paid_total_zar.toLocaleString()}</span>
        </div>
      </div>

      {/* ── Owned Media ──────────────────────────────────────── */}
      {plan.owned_media?.length > 0 && (
        <div className="glass-card rounded-2xl p-6 mb-6" style={{ borderColor: "#1DB95420" }}>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-base font-black text-text-primary">Owned media</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: "#1DB95420", color: "#1DB954" }}>Zero cost</span>
          </div>
          <div className="space-y-4">
            {plan.owned_media.map((m, i) => (
              <div key={i} className="glass-card rounded-xl p-4" style={{ borderColor: "#1DB95420" }}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <MessageCircle size={14} style={{ color: "#1DB954" }} />
                    <span className="text-sm font-bold text-text-primary">{m.channel}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-text-muted">Est. reach</p>
                    <p className="text-sm font-bold" style={{ color: "#1DB954" }}>{m.est_opens_or_reach.toLocaleString()}</p>
                  </div>
                </div>
                <p className="text-xs text-text-muted mb-1"><span className="font-medium text-text-primary">What you have:</span> {m.asset_description}</p>
                <p className="text-xs text-text-muted mb-1"><span className="font-medium text-text-primary">Action:</span> {m.action}</p>
                <p className="text-xs text-text-muted"><span className="font-medium text-text-primary">Message plan:</span> {m.messaging_plan}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Timeline ──────────────────────────────────────────── */}
      <div className="glass-card rounded-2xl p-6 mb-6">
        <h2 className="text-base font-black text-text-primary mb-5">Campaign timeline</h2>
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[18px] top-0 bottom-0 w-px bg-border/50" />

          <div className="space-y-5">
            {sortedTimeline.map((week, i) => {
              const isRelease = week.week === 0;
              const isPast    = week.week < 0;
              return (
                <div key={i} className="flex items-start gap-4">
                  {/* Node */}
                  <div className={cn(
                    "w-9 h-9 rounded-full border-2 flex items-center justify-center flex-shrink-0 z-10",
                    isRelease
                      ? "border-brand bg-brand"
                      : "border-border bg-surface"
                  )}>
                    {isRelease
                      ? <Zap size={14} className="text-black" />
                      : <span className="text-[10px] font-bold text-text-muted">{week.week > 0 ? `+${week.week}` : week.week}</span>
                    }
                  </div>
                  {/* Content */}
                  <div className="flex-1 pb-1">
                    <p className={cn(
                      "text-sm font-bold mb-1.5",
                      isRelease ? "text-brand" : "text-text-primary"
                    )}>
                      {isRelease ? "🎵 Release day — " : ""}{week.label}
                    </p>
                    <ul className="space-y-1">
                      {week.activities.map((act, j) => (
                        <li key={j} className="flex items-start gap-2 text-xs text-text-muted">
                          <Check size={11} className="flex-shrink-0 mt-0.5" style={{ color: isRelease ? "#C9A84C" : "var(--text-muted)" }} />
                          {act}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Key insight + Risk flags ──────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* Key insight */}
        <div className="glass-card rounded-2xl p-5" style={{ borderColor: "#C9A84C25", backgroundColor: "#C9A84C06" }}>
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb size={16} style={{ color: "#C9A84C" }} />
            <h3 className="text-sm font-black text-text-primary">Key insight</h3>
          </div>
          <p className="text-sm text-text-muted leading-relaxed">{plan.key_insight}</p>
        </div>

        {/* Risk flags */}
        {plan.risk_flags?.length > 0 && (
          <div className="glass-card rounded-2xl p-5" style={{ borderColor: "#E05C5C25", backgroundColor: "#E05C5C06" }}>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={16} className="text-error" />
              <h3 className="text-sm font-black text-text-primary">Risk flags</h3>
            </div>
            <ul className="space-y-2">
              {plan.risk_flags.map((flag, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-text-muted">
                  <div className="w-1.5 h-1.5 rounded-full bg-error flex-shrink-0 mt-1.5" />
                  {flag}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ── Your story (collapsible context) ─────────────────── */}
      {(campaign.story || campaign.assets_in_hand || campaign.creative_vision) && (
        <details className="glass-card rounded-2xl p-5 mb-6 group">
          <summary className="flex items-center gap-2 cursor-pointer text-sm font-bold text-text-primary list-none">
            <Users size={15} className="text-text-muted" />
            Your story (used to generate this plan)
            <ChevronLeft size={14} className="ml-auto text-text-muted group-open:rotate-90 transition-transform" />
          </summary>
          <div className="mt-4 space-y-3 text-xs text-text-muted">
            {campaign.story && (
              <div>
                <p className="font-semibold text-text-primary mb-1">What this release is about</p>
                <p className="leading-relaxed">{campaign.story}</p>
              </div>
            )}
            {campaign.assets_in_hand && (
              <div>
                <p className="font-semibold text-text-primary mb-1">Assets in hand</p>
                <p className="leading-relaxed">{campaign.assets_in_hand}</p>
              </div>
            )}
            {campaign.creative_vision && (
              <div>
                <p className="font-semibold text-text-primary mb-1">Creative vision</p>
                <p className="leading-relaxed">{campaign.creative_vision}</p>
              </div>
            )}
          </div>
        </details>
      )}

      {/* ── Footer actions ────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-10">
        <Link href="/dashboard/campaign-builder" className="text-sm text-text-muted hover:text-text-primary transition-colors">
          ← All campaigns
        </Link>
        <Link
          href="/dashboard/campaign-builder/new"
          className="text-sm font-semibold transition-colors"
          style={{ color: "#C9A84C" }}
        >
          Build another →
        </Link>
      </div>
    </div>
  );
}
