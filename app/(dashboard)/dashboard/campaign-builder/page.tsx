"use client";
// ============================================================
// ROSTER — Campaign Builder — List page
// Shows the artist's saved campaigns + entry point for new ones
// ============================================================

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Megaphone, Plus, ChevronRight, Clock, CheckCircle2,
  Loader2, AlertCircle, Trash2, TrendingUp, Ticket,
  Radio, ShoppingBag,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Campaign {
  id: string;
  title: string;
  goal: string;
  budget_zar: number;
  markets: string[];
  status: string;
  created_at: string;
  release_title: string | null;
  days_to_release: string | null;
}

const GOAL_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  streams:   { label: "Streams",   icon: TrendingUp,  color: "#1DB954" },
  tickets:   { label: "Tickets",   icon: Ticket,      color: "#E05C5C" },
  awareness: { label: "Awareness", icon: Radio,       color: "#4B9FE1" },
  merch:     { label: "Merch",     icon: ShoppingBag, color: "#C9A84C" },
};

const STATUS_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  draft:      { label: "Draft",      icon: Clock,        color: "var(--text-muted)" },
  generating: { label: "Generating", icon: Loader2,      color: "#C9A84C" },
  ready:      { label: "Ready",      icon: CheckCircle2, color: "#1DB954" },
  active:     { label: "Active",     icon: CheckCircle2, color: "#4B9FE1" },
  completed:  { label: "Completed",  icon: CheckCircle2, color: "var(--text-muted)" },
};

const MARKET_NAMES: Record<string, string> = {
  ZA: "SA", NG: "NG", KE: "KE", GH: "GH", UK: "UK", US: "US",
};

export default function CampaignBuilderPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [deleting, setDeleting]   = useState<string | null>(null);

  async function loadCampaigns() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/campaign-builder");
      if (!res.ok) throw new Error("Failed to load campaigns");
      const { campaigns: data } = await res.json();
      setCampaigns(data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadCampaigns(); }, []);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await fetch(`/api/campaign-builder/${id}`, { method: "DELETE" });
      setCampaigns(prev => prev.filter(c => c.id !== id));
    } catch {
      // silent fail — campaign remains
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="animate-fade-in max-w-4xl">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="glass-card rounded-2xl p-6 mb-7" style={{ borderColor: "#C9A84C25" }}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                 style={{ backgroundColor: "#C9A84C15" }}>
              <Megaphone size={26} style={{ color: "#C9A84C" }} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: "#C9A84C" }}>
                AI Marketing
              </p>
              <h1 className="text-2xl font-black text-text-primary">Campaign Builder</h1>
              <p className="text-sm text-text-muted mt-0.5 max-w-md">
                Tell us your goal, budget, and story. We'll generate a personalised African market campaign plan in seconds.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/campaign-builder/new"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap"
            style={{ backgroundColor: "#C9A84C", color: "#000" }}
          >
            <Plus size={16} />
            New Campaign
          </Link>
        </div>
      </div>

      {/* ── List ───────────────────────────────────────────── */}
      {loading && (
        <div className="flex items-center justify-center py-20 text-text-muted">
          <Loader2 size={22} className="animate-spin mr-2" />
          Loading campaigns…
        </div>
      )}

      {error && (
        <div className="glass-card rounded-xl p-5 flex items-center gap-3 text-error border-error/20">
          <AlertCircle size={18} />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {!loading && !error && campaigns.length === 0 && (
        <div className="glass-card rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
               style={{ backgroundColor: "#C9A84C10" }}>
            <Megaphone size={28} style={{ color: "#C9A84C50" }} />
          </div>
          <h2 className="text-lg font-bold text-text-primary mb-2">No campaigns yet</h2>
          <p className="text-sm text-text-muted mb-6 max-w-xs mx-auto">
            Build your first AI-generated campaign plan — tailored to your release, budget, and African markets.
          </p>
          <Link
            href="/dashboard/campaign-builder/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ backgroundColor: "#C9A84C", color: "#000" }}
          >
            <Plus size={16} />
            Build your first campaign
          </Link>
        </div>
      )}

      {!loading && !error && campaigns.length > 0 && (
        <div className="space-y-3">
          {campaigns.map(campaign => {
            const goal   = GOAL_META[campaign.goal]   ?? GOAL_META.streams;
            const status = STATUS_META[campaign.status] ?? STATUS_META.draft;
            const GoalIcon   = goal.icon;
            const StatusIcon = status.icon;

            return (
              <div key={campaign.id} className="glass-card rounded-xl overflow-hidden group">
                <Link
                  href={`/dashboard/campaign-builder/${campaign.id}`}
                  className="flex items-center gap-4 p-5 hover:bg-surface-2/40 transition-all"
                >
                  {/* Goal icon */}
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                       style={{ backgroundColor: `${goal.color}15` }}>
                    <GoalIcon size={18} style={{ color: goal.color }} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-text-primary truncate">
                        {campaign.title}
                      </span>
                      {/* Status pill */}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                            style={{ backgroundColor: `${status.color}18`, color: status.color }}>
                        <StatusIcon size={10} className={campaign.status === "generating" ? "animate-spin" : ""} />
                        {status.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-text-muted flex-wrap">
                      <span style={{ color: goal.color }} className="font-medium">{goal.label}</span>
                      <span>R{campaign.budget_zar.toLocaleString()}</span>
                      <span>{campaign.markets.map(m => MARKET_NAMES[m] ?? m).join(" · ")}</span>
                      {campaign.release_title && (
                        <span className="truncate max-w-[160px]">
                          "{campaign.release_title}"
                          {campaign.days_to_release ? ` · ${campaign.days_to_release}d` : ""}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Date + arrow */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-text-muted hidden sm:block">
                      {new Date(campaign.created_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    <ChevronRight size={16} className="text-text-muted group-hover:text-text-primary transition-colors" />
                  </div>
                </Link>

                {/* Delete button — visible on hover */}
                <div className="border-t border-border/40 px-5 py-2.5 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleDelete(campaign.id, campaign.title)}
                    disabled={deleting === campaign.id}
                    className="flex items-center gap-1.5 text-xs text-text-muted hover:text-error transition-colors"
                  >
                    {deleting === campaign.id
                      ? <Loader2 size={12} className="animate-spin" />
                      : <Trash2 size={12} />}
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
