"use client";

/**
 * ArtistsWidget — shell / orchestrator.
 *
 * Sub-components live in ./artists/:
 *   types.ts                 — LiveArtist interface + isSupabaseConfigured()
 *   artist-row.tsx           — ArtistRow
 *   empty-state.tsx          — EmptyState
 *   add-artist-modal.tsx     — AddArtistModal (Spotify typeahead + manual mode)
 *   linked-account-panel.tsx — LinkedAccountPanel (YouTube / Audiomack handles)
 *   edit-stats-modal.tsx     — EditStatsModal (per-platform metric entry)
 */

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "@/lib/i18n/hooks";
import { Plus, Users, RefreshCw, Loader2 } from "lucide-react";
import { MOCK_ARTISTS, type MockArtist } from "@/lib/mock/dashboard-data";

import { type LiveArtist, isSupabaseConfigured } from "./artists/types";
import { ArtistRow } from "./artists/artist-row";
import { EmptyState } from "./artists/empty-state";
import { AddArtistModal } from "./artists/add-artist-modal";
import { EditStatsModal } from "./artists/edit-stats-modal";

export function ArtistsWidget() {
  const { t } = useTranslation();
  const configured = isSupabaseConfigured();
  const [artists, setArtists] = useState<LiveArtist[]>([]);
  const [loading, setLoading] = useState(configured);
  const [syncing, setSyncing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editingArtist, setEditingArtist] = useState<LiveArtist | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Open the Add Artist modal when ?addArtist=true is in the URL.
  // window.location.search is used directly (not useSearchParams) because
  // useSearchParams() may return empty during the initial hydration cycle
  // in Next.js App Router dev mode.
  useEffect(() => {
    const search = window.location.search;
    if (new URLSearchParams(search).get("addArtist") === "true") {
      setShowAdd(true);
    }
  }, []);

  // Preview-mode fallback when Supabase isn't configured
  const mockAsLive: LiveArtist[] = MOCK_ARTISTS.map((m) => {
    const mockReach = Math.min(
      100,
      Math.round((Math.log10(m.followers + 1) / 7) * 100)
    );
    return {
      id: m.id,
      name: m.name,
      genre: m.genre,
      country: m.country,
      countryFlag: m.countryFlag,
      countries: m.country ? [m.country] : [],
      countryFlags: m.countryFlag ? [m.countryFlag] : [],
      spotifyId: "",
      spotifyUrl: "#",
      imageUrl: null,
      followers: m.followers,
      popularity: 0,
      monthlyListeners: null,
      monthlyActiveListeners: null,
      newActiveListeners: null,
      superListeners: null,
      trend: m.trend,
      trendPct: m.trendPct,
      lastSyncedAt: null,
      reach: mockReach,
      momentum: m.trend === "up" ? m.trendPct : m.trend === "down" ? -m.trendPct : 0,
      engagement: 0,
    };
  });

  const fetchArtists = useCallback(async () => {
    if (!configured) {
      setArtists(mockAsLive);
      return;
    }
    try {
      const res = await fetch("/api/artists", { cache: "no-store" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed (${res.status})`);
      }
      const json = await res.json();
      setArtists(json.artists ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load artists");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configured]);

  useEffect(() => { fetchArtists(); }, [fetchArtists]);

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/artists/sync", { method: "POST" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        if (json?.code === "SPOTIFY_NOT_CONNECTED") {
          if (confirm(t("roster.syncNow") + " — " + t("settings.title") + "?")) {
            window.location.href = "/dashboard/settings";
          }
          return;
        }
        alert(json?.error ?? `Sync failed (${res.status})`);
        return;
      }
      await fetchArtists();
    } finally {
      setSyncing(false);
    }
  }

  async function handleDelete(id: string) {
    const prev = artists;
    setArtists((xs) => xs.filter((a) => a.id !== id));
    const res = await fetch(`/api/artists/${id}`, { method: "DELETE" });
    if (!res.ok) setArtists(prev);
  }

  function handleAdded(a: LiveArtist) {
    setArtists((prev) => [...prev, a]);
    setShowAdd(false);
  }

  async function handleEdited() {
    setEditingArtist(null);
    await fetchArtists();
  }

  return (
    <div className="glass-card rounded-2xl p-6 h-full flex flex-col">
      <header className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-text-muted font-medium mb-1">
            <Users size={12} />
            {t("nav.roster")}
          </div>
          <h2 className="text-lg font-semibold text-text-primary">
            {t("roster.title")}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {configured && artists.length > 0 && (
            <button
              onClick={handleSync}
              disabled={syncing}
              title={t("roster.syncNow")}
              className="flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-brand transition-colors px-2.5 py-1.5 rounded-lg border border-white/5 hover:border-brand/30 hover:bg-brand/5 disabled:opacity-50"
            >
              <RefreshCw size={12} className={syncing ? "animate-spin" : ""} aria-hidden="true" />
              {syncing ? t("roster.syncing") : t("roster.syncNow")}
            </button>
          )}
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-brand hover:text-brand-light transition-colors px-3 py-1.5 rounded-lg border border-brand/20 hover:border-brand/40 hover:bg-brand/5"
          >
            <Plus size={14} aria-hidden="true" />
            {t("action.add")}
          </button>
        </div>
      </header>

      <div className="flex-1 min-h-[120px]">
        {loading && (
          <div className="flex items-center justify-center py-8 text-text-muted text-sm">
            <Loader2 size={14} className="animate-spin mr-2" />
            {t("roster.loadingArtists")}
          </div>
        )}

        {!loading && error && (
          <div className="bg-error/10 border border-error/20 rounded-lg px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        {!loading && !error && artists.length === 0 && (
          <EmptyState onAdd={() => setShowAdd(true)} />
        )}

        {!loading && !error && artists.length > 0 && (
          <div
            className="hidden lg:grid items-center gap-4 px-3 pb-2 border-b border-white/5 text-[10px] uppercase tracking-wider text-text-muted/60 font-medium"
            style={{ gridTemplateColumns: "40px minmax(0,1fr) 7rem 4.5rem 4.5rem 4.5rem 4rem" }}
          >
            <span />
            <span>Artist</span>
            <span className="text-right" title="Most recent monthly listeners — public Spotify number">Listeners</span>
            <span className="text-right" title="ROSTER Reach — 0-100">Reach</span>
            <span className="text-right" title="ROSTER Momentum — signed -100..+100">Momentum</span>
            <span className="text-right" title="ROSTER Engagement — 0-100">Engagement</span>
            <span />
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-1">
            {artists.map((a) => (
              <ArtistRow
                key={a.id}
                artist={a}
                onDelete={handleDelete}
                onEdit={() => setEditingArtist(a)}
              />
            ))}
          </div>
        )}
      </div>

      <footer className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
        <span className="text-xs text-text-muted">
          {t("roster.slotsUsed", { n: String(artists.length) })}
        </span>
        <a href="/dashboard" className="text-xs text-text-muted hover:text-brand transition-colors">
          View all →
        </a>
      </footer>

      {showAdd && (
        <AddArtistModal
          configured={configured}
          onAdded={handleAdded}
          onClose={() => setShowAdd(false)}
        />
      )}

      {editingArtist && (
        <EditStatsModal
          artist={editingArtist}
          onSaved={handleEdited}
          onClose={() => setEditingArtist(null)}
        />
      )}
    </div>
  );
}

export type { MockArtist };
