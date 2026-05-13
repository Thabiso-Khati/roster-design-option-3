"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { X, Loader2, Users, Plus } from "lucide-react";
import { useTranslation } from "@/lib/i18n/hooks";
import { useFocusTrap } from "@/lib/hooks/use-focus-trap";
import { formatCompactNumber } from "@/lib/mock/dashboard-data";
import { GROUPED_COUNTRIES } from "@/lib/locale";
import type { LiveArtist } from "./types";

interface SpotifySearchResult {
  id: string;
  name: string;
  followers: number;
  popularity: number;
  genres: string[];
  imageUrl: string | null;
  externalUrl: string;
}

function looksLikeSpotifyRef(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("spotify:")) return true;
  if (trimmed.includes("open.spotify.com/")) return true;
  if (/^[a-zA-Z0-9]{22}$/.test(trimmed)) return true;
  return false;
}

export function AddArtistModal({
  configured,
  onAdded,
  onClose,
}: {
  configured: boolean;
  onAdded: (a: LiveArtist) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<"spotify" | "manual">("spotify");
  const [url, setUrl] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualGenre, setManualGenre] = useState("");
  const [countries, setCountries] = useState<string[]>([]);
  const [manualFollowers, setManualFollowers] = useState<string>("");
  const [manualMonthlyListeners, setManualMonthlyListeners] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dialogRef = useFocusTrap(true);

  const primaryCountry = countries[0] ?? "";
  const secondaryCountry = countries[1] ?? "";

  function setPrimaryCountry(c: string) {
    setCountries((prev) => {
      if (!c) return prev.slice(1);
      const second = prev[1] && prev[1] !== c ? [prev[1]] : [];
      return [c, ...second];
    });
  }
  function setSecondaryCountry(c: string) {
    setCountries((prev) => {
      if (!prev[0]) return prev;
      if (!c) return [prev[0]];
      if (c === prev[0]) return [prev[0]];
      return [prev[0], c];
    });
  }

  const [results, setResults] = useState<SpotifySearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [picked, setPicked] = useState<SpotifySearchResult | null>(null);

  useEffect(() => {
    const trimmed = url.trim();
    if (!trimmed || trimmed.length < 2 || looksLikeSpotifyRef(trimmed)) {
      setResults([]);
      setSearching(false);
      setSearchError(null);
      return;
    }
    if (picked && trimmed === picked.externalUrl) return;

    let cancelled = false;
    setSearching(true);
    setSearchError(null);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/spotify/search?q=${encodeURIComponent(trimmed)}&limit=8`,
          { cache: "no-store" }
        );
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setResults([]);
          setSearchError(
            json?.code === "SPOTIFY_NOT_CONNECTED"
              ? "Connect Spotify in Settings to search by name."
              : json?.error || `Search failed (${res.status})`
          );
        } else {
          setResults((json.artists ?? []) as SpotifySearchResult[]);
        }
      } catch (e) {
        if (cancelled) return;
        setSearchError(e instanceof Error ? e.message : "Search failed");
        setResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [url, picked]);

  function pickResult(r: SpotifySearchResult) {
    setPicked(r);
    setUrl(r.externalUrl);
    setResults([]);
  }

  function clearPick() {
    setPicked(null);
    setUrl("");
  }

  async function submit() {
    setLoading(true);
    setError(null);

    if (!configured) {
      setError("Database isn't configured yet. Add SUPABASE_URL and SUPABASE_ANON_KEY to .env to start saving artists.");
      setLoading(false);
      return;
    }
    if (mode === "spotify" && !url.trim()) {
      setError("Pick an artist from the list, or switch to Add manually.");
      setLoading(false);
      return;
    }
    if (mode === "manual" && !manualName.trim()) {
      setError("Enter the artist's name.");
      setLoading(false);
      return;
    }
    if (countries.length === 0) {
      setError("Pick at least one country.");
      setLoading(false);
      return;
    }

    const parseMetric = (raw: string): number | null => {
      const cleaned = raw.replace(/[, _]/g, "").trim();
      if (!cleaned) return null;
      const n = Number(cleaned);
      return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
    };

    const parsedFollowers = parseMetric(manualFollowers);
    const parsedMonthly = parseMetric(manualMonthlyListeners);

    const body =
      mode === "spotify"
        ? {
            spotifyUrl: url,
            countries,
            country: countries[0],
            ...(parsedFollowers !== null && { manualFollowers: parsedFollowers }),
            ...(parsedMonthly !== null && { manualMonthlyListeners: parsedMonthly }),
          }
        : {
            manualName: manualName.trim(),
            ...(manualGenre.trim() && { manualGenre: manualGenre.trim() }),
            countries,
            country: countries[0],
            ...(parsedFollowers !== null && { manualFollowers: parsedFollowers }),
            ...(parsedMonthly !== null && { manualMonthlyListeners: parsedMonthly }),
          };

    try {
      const res = await fetch("/api/artists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json?.code === "ARTIST_LIMIT_REACHED") {
          // Surface the limit message + an inline upgrade link
          setError(json.error + " — upgrade in Settings → Billing.");
        } else {
          throw new Error(json.error || `Failed (${res.status})`);
        }
        return;
      }
      onAdded(json.artist);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const modal = (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        ref={dialogRef as React.RefObject<HTMLDivElement>}
        className="glass-card rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between px-6 pt-6 pb-3 flex-shrink-0">
          <h3 id="add-artist-title" className="text-lg font-semibold">
            {t("roster.addArtistTitle")}
          </h3>
          <button
            onClick={onClose}
            aria-label={t("action.close")}
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className="px-6 pb-3 overflow-y-auto flex-1">
          {/* Mode tabs */}
          <div className="flex items-center gap-1 p-1 bg-surface/50 border border-white/5 rounded-lg mb-4 text-xs">
            <button
              type="button"
              onClick={() => setMode("spotify")}
              className={`flex-1 px-3 py-1.5 rounded-md transition-colors font-medium ${
                mode === "spotify" ? "bg-brand/15 text-brand" : "text-text-muted hover:text-text-primary"
              }`}
            >
              {t("roster.spotifySearchTab")}
            </button>
            <button
              type="button"
              onClick={() => setMode("manual")}
              className={`flex-1 px-3 py-1.5 rounded-md transition-colors font-medium ${
                mode === "manual" ? "bg-brand/15 text-brand" : "text-text-muted hover:text-text-primary"
              }`}
            >
              {t("roster.addManuallyTab")}
            </button>
          </div>

          <p className="text-xs text-text-muted mb-4 leading-relaxed">
            {mode === "spotify" ? t("roster.spotifyModeHint") : t("roster.manualModeHint")}
          </p>

          <div className="space-y-4">
            {/* Spotify mode */}
            {mode === "spotify" && (
              <div>
                <label className="text-xs uppercase tracking-wider text-text-muted font-medium block mb-1.5">
                  {t("roster.artistOrLink")}
                </label>
                {picked ? (
                  <div className="flex items-center gap-3 bg-brand/5 border border-brand/30 rounded-lg p-2.5">
                    <div className="w-10 h-10 rounded-lg bg-surface overflow-hidden flex-shrink-0">
                      {picked.imageUrl ? (
                        <Image src={picked.imageUrl} alt={picked.name} width={40} height={40} className="w-full h-full object-cover" unoptimized />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-text-muted/40">
                          <Users size={14} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">{picked.name}</p>
                      <p className="text-[11px] text-text-muted truncate">
                        {picked.followers > 0
                          ? `${formatCompactNumber(picked.followers)} ${t("roster.followers").toLowerCase()}`
                          : t("roster.followersUnavailable")}
                        {picked.genres[0] ? ` · ${picked.genres[0]}` : ""}
                      </p>
                    </div>
                    <button
                      onClick={clearPick}
                      aria-label="Clear selection — pick a different artist"
                      className="text-text-muted hover:text-text-primary transition-colors p-1"
                    >
                      <X size={14} aria-hidden="true" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <input
                        autoFocus
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="e.g. De Mthuda"
                        className="w-full bg-surface/60 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted/60 focus:border-brand outline-none pr-9"
                      />
                      {searching && (
                        <Loader2 size={14} className="animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-text-muted" />
                      )}
                    </div>
                    {results.length > 0 && (
                      <div className="mt-2 max-h-72 overflow-y-auto rounded-lg border border-white/10 bg-surface/80 backdrop-blur divide-y divide-white/5">
                        {results.map((r) => (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => pickResult(r)}
                            className="w-full flex items-center gap-3 p-2.5 hover:bg-white/[0.03] text-left transition-colors"
                          >
                            <div className="w-9 h-9 rounded-lg bg-surface overflow-hidden flex-shrink-0">
                              {r.imageUrl ? (
                                <Image src={r.imageUrl} alt={r.name} width={36} height={36} className="w-full h-full object-cover" unoptimized />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-text-muted/40">
                                  <Users size={12} />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-text-primary truncate">{r.name}</p>
                              <p className="text-[11px] text-text-muted truncate">
                                {r.followers > 0
                                  ? `${formatCompactNumber(r.followers)} ${t("roster.followers").toLowerCase()}`
                                  : t("roster.followersUnavailable")}
                                {r.genres[0] ? ` · ${r.genres[0]}` : ""}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {searchError && (
                      <p className="mt-2 text-[11px] text-error/90 leading-relaxed">{searchError}</p>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Manual mode */}
            {mode === "manual" && (
              <>
                <div>
                  <label className="text-xs uppercase tracking-wider text-text-muted font-medium block mb-1.5">
                    {t("roster.artistNameLabel")}
                  </label>
                  <input
                    autoFocus
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="e.g. PJ Star"
                    className="w-full bg-surface/60 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted/60 focus:border-brand outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-text-muted font-medium block mb-1.5">
                    Genre <span className="lowercase text-text-muted/60 normal-case tracking-normal">(optional)</span>
                  </label>
                  <input
                    value={manualGenre}
                    onChange={(e) => setManualGenre(e.target.value)}
                    placeholder="e.g. Amapiano · Afrobeats"
                    className="w-full bg-surface/60 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted/60 focus:border-brand outline-none"
                  />
                </div>
              </>
            )}

            {/* Country selectors */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
              <label className="text-[11px] uppercase tracking-wide text-text-muted font-medium self-end">
                {t("roster.primaryCountry")}
              </label>
              <label className="text-[11px] uppercase tracking-wide text-text-muted font-medium self-end">
                {t("roster.secondaryCountry")}{" "}
                <span className="lowercase text-text-muted/60 normal-case tracking-normal">(optional)</span>
              </label>
              <select
                value={primaryCountry}
                onChange={(e) => setPrimaryCountry(e.target.value)}
                className="w-full bg-surface/60 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-text-primary focus:border-brand outline-none"
              >
                <option value="">Select a country…</option>
                {GROUPED_COUNTRIES.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.countries.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <select
                value={secondaryCountry}
                onChange={(e) => setSecondaryCountry(e.target.value)}
                disabled={!primaryCountry}
                className="w-full bg-surface/60 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-text-primary focus:border-brand outline-none disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <option value="">— None —</option>
                {GROUPED_COUNTRIES.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.countries.filter((c) => c !== primaryCountry).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            {countries.length > 1 && (
              <p className="text-[11px] text-text-muted/80 -mt-2 leading-relaxed">
                The secondary country is tracked for royalty splits and PRO routing — primary stays as{" "}
                <strong>{countries[0]}</strong>.
              </p>
            )}

            {/* Metric overrides */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
              <label className="text-[11px] uppercase tracking-wide text-text-muted font-medium self-end">
                {t("roster.listeners")}
              </label>
              <label className="text-[11px] uppercase tracking-wide text-text-muted font-medium self-end">
                {t("roster.followers")}
              </label>
              <input
                inputMode="numeric"
                value={manualMonthlyListeners}
                onChange={(e) => setManualMonthlyListeners(e.target.value.replace(/[^\d,\s]/g, ""))}
                placeholder="e.g. 1,240,000"
                className="w-full bg-surface/60 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted/60 focus:border-brand outline-none"
              />
              <input
                inputMode="numeric"
                value={manualFollowers}
                onChange={(e) => setManualFollowers(e.target.value.replace(/[^\d,\s]/g, ""))}
                placeholder="e.g. 125,430"
                className="w-full bg-surface/60 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted/60 focus:border-brand outline-none"
              />
            </div>
            <p className="text-[11px] text-text-muted/80 -mt-2 leading-relaxed">
              Both optional — Spotify&apos;s API hides these for dev apps until extended quota is approved.
            </p>
          </div>

          {error && (
            <div className="mt-4 bg-error/10 border border-error/20 rounded-lg px-3 py-2 text-xs text-error">
              {error}
            </div>
          )}
        </div>

        <footer className="flex items-center justify-end gap-2 px-6 py-4 flex-shrink-0 border-t border-white/5 bg-surface/30">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-text-muted hover:text-text-primary transition-colors"
          >
            {t("action.cancel")}
          </button>
          <button
            onClick={submit}
            disabled={
              loading ||
              countries.length === 0 ||
              (mode === "spotify" && !url.trim()) ||
              (mode === "manual" && !manualName.trim())
            }
            className="px-4 py-2 text-sm font-medium text-background bg-brand hover:bg-brand-light transition-colors rounded-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && <Loader2 size={12} className="animate-spin" />}
            {loading
              ? mode === "spotify" ? t("roster.lookingUp") : t("status.saving")
              : t("roster.addArtist")}
          </button>
        </footer>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
