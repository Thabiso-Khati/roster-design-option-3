"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Loader2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n/hooks";
import { useFocusTrap } from "@/lib/hooks/use-focus-trap";
import { PLATFORMS, type PlatformDef } from "@/lib/scoring/platforms";
import type { Platform } from "@/lib/scoring/types";
import { PlatformLogo } from "../platform-logos";
import { LinkedAccountPanel } from "./linked-account-panel";
import type { LiveArtist } from "./types";

export function EditStatsModal({
  artist,
  onSaved,
  onClose,
}: {
  artist: LiveArtist;
  onSaved: () => void;
  onClose: () => void;
}) {
  const [activePlatform, setActivePlatform] = useState<Platform>(PLATFORMS[0].key);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedSummary, setSavedSummary] = useState<string | null>(null);

  const { t } = useTranslation();
  const dialogRef = useFocusTrap(true);

  function setField(platform: Platform, metric: string, raw: string) {
    const key = `${platform}.${metric}`;
    setValues((prev) => ({ ...prev, [key]: raw.replace(/[^\d,\s]/g, "") }));
    if (savedSummary) setSavedSummary(null);
  }

  function getField(platform: Platform, metric: string): string {
    return values[`${platform}.${metric}`] ?? "";
  }

  const parseMetric = (raw: string): number | null => {
    const cleaned = raw.replace(/[, _]/g, "").trim();
    if (!cleaned) return null;
    const n = Number(cleaned);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
  };

  function groupFilled(): Record<string, Record<string, number>> {
    const out: Record<string, Record<string, number>> = {};
    for (const platform of PLATFORMS) {
      const platformValues: Record<string, number> = {};
      for (const field of [...platform.reach, ...platform.engagement]) {
        const raw = getField(platform.key, field.key);
        const parsed = parseMetric(raw);
        if (parsed !== null) platformValues[field.key] = parsed;
      }
      if (Object.keys(platformValues).length > 0) out[platform.key] = platformValues;
    }
    return out;
  }

  const filled = groupFilled();
  const filledPlatformCount = Object.keys(filled).length;

  const filledPerPlatform = (platform: Platform): number =>
    filled[platform] ? Object.keys(filled[platform]).length : 0;

  async function save() {
    setLoading(true);
    setError(null);
    setSavedSummary(null);

    const grouped = groupFilled();
    const platformKeys = Object.keys(grouped);
    if (platformKeys.length === 0) {
      setError("Enter at least one number on any platform.");
      setLoading(false);
      return;
    }

    const results = await Promise.all(
      platformKeys.map(async (platform) => {
        try {
          const res = await fetch(`/api/artists/${artist.id}/platform-metrics`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ platform, source: "manual", metrics: grouped[platform] }),
          });
          const json = await res.json();
          if (!res.ok) return { platform, ok: false, error: json.error || `Failed (${res.status})` };
          return { platform, ok: true, count: (json.inserted ?? []).length };
        } catch (e) {
          return { platform, ok: false, error: e instanceof Error ? e.message : "Network error" };
        }
      })
    );

    const failed = results.filter((r) => !r.ok);
    const succeeded = results.filter((r) => r.ok);

    if (succeeded.length > 0) {
      const summary = succeeded.map((s) => `${s.platform} (${s.count})`).join(", ");
      setSavedSummary(`Saved snapshots for ${summary}.`);
      setValues((prev) => {
        const next = { ...prev };
        for (const r of succeeded) {
          for (const key of Object.keys(grouped[r.platform])) {
            delete next[`${r.platform}.${key}`];
          }
        }
        return next;
      });
    }

    if (failed.length > 0) {
      setError(`Failed for: ${failed.map((f) => `${f.platform} — ${f.error}`).join("; ")}`);
    }

    setLoading(false);
    if (failed.length === 0) onSaved();
  }

  const activeDef: PlatformDef =
    PLATFORMS.find((p) => p.key === activePlatform) ?? PLATFORMS[0];

  const numericField = (
    field: { key: string; label: string; hint?: string; placeholder?: string },
    autoFocus = false
  ) => (
    <div>
      <label className="text-[11px] uppercase tracking-wide text-text-muted font-medium block mb-1">
        {field.label}
      </label>
      <input
        autoFocus={autoFocus}
        inputMode="numeric"
        value={getField(activePlatform, field.key)}
        onChange={(e) => setField(activePlatform, field.key, e.target.value)}
        placeholder={field.placeholder}
        className="w-full bg-surface/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted/60 focus:border-brand outline-none tabular-nums"
      />
      {field.hint && (
        <p className="text-[10px] text-text-muted/60 mt-0.5 leading-relaxed">{field.hint}</p>
      )}
    </div>
  );

  const modal = (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        ref={dialogRef as React.RefObject<HTMLDivElement>}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-stats-title"
        className="glass-card rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between px-6 pt-6 pb-3 flex-shrink-0">
          <div>
            <h3 id="edit-stats-title" className="text-lg font-semibold">{t("roster.updateStats")}</h3>
            <p className="text-xs text-text-muted mt-0.5 truncate">
              {artist.name} — pick a platform tab and fill in what you have
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close — update stats"
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className="px-6 pb-2 flex-shrink-0 overflow-x-auto">
          <div className="flex items-center gap-1 border-b border-white/5" role="tablist" aria-label="Select platform">
            {PLATFORMS.map((p) => {
              const active = p.key === activePlatform;
              const count = filledPerPlatform(p.key);
              return (
                <button
                  key={p.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActivePlatform(p.key)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                    active
                      ? "border-brand text-brand"
                      : "border-transparent text-text-muted hover:text-text-primary"
                  }`}
                  title={p.blurb}
                >
                  <PlatformLogo platform={p.key} size={14} branded={active} />
                  <span>{p.label}</span>
                  {count > 0 && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full tabular-nums ${
                      active ? "bg-brand/20 text-brand" : "bg-white/5 text-text-muted"
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-6 py-4 overflow-y-auto flex-1">
          <p className="text-[11px] text-text-muted/80 mb-3 leading-relaxed">{activeDef.blurb}</p>

          {(activePlatform === "youtube" || activePlatform === "audiomack" || activePlatform === "tiktok") && (
            <LinkedAccountPanel
              artistId={artist.id}
              artistName={artist.name}
              kind={activePlatform}
              initialValue={
                activePlatform === "youtube"
                  ? artist.youtubeChannelId
                  : activePlatform === "audiomack"
                  ? artist.audiomackHandle
                  : artist.tiktokOpenId
              }
            />
          )}

          {activeDef.reach.length > 0 && (
            <>
              <p className="text-[10px] uppercase tracking-wider text-text-muted/60 font-medium mb-2">
                {t("roster.reachSignals")}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 mb-5">
                {activeDef.reach.map((f, i) => <div key={f.key}>{numericField(f, i === 0)}</div>)}
              </div>
            </>
          )}

          {activeDef.engagement.length > 0 && (
            <>
              <p className="text-[10px] uppercase tracking-wider text-text-muted/60 font-medium mb-2">
                {t("roster.engagementSignals")}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                {activeDef.engagement.map((f) => <div key={f.key}>{numericField(f)}</div>)}
              </div>
            </>
          )}

          {activeDef.reach.length === 0 && activeDef.engagement.length === 0 && (
            <p className="text-xs text-text-muted">No fields configured for this platform yet.</p>
          )}

          <p className="mt-5 text-[11px] text-text-muted/80 leading-relaxed">
            Each save creates a new time-stamped snapshot. Previous numbers stay on record so trend +
            momentum keep working. You can fill in fields across multiple platforms before hitting
            save — they all submit together.
          </p>

          {savedSummary && (
            <div className="mt-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2 text-xs text-emerald-300">
              {savedSummary}
            </div>
          )}
          {error && (
            <div className="mt-3 bg-error/10 border border-error/20 rounded-lg px-3 py-2 text-xs text-error">
              {error}
            </div>
          )}
        </div>

        <footer className="flex items-center justify-between gap-2 px-6 py-4 flex-shrink-0 border-t border-white/5 bg-surface/30">
          <span className="text-[11px] text-text-muted">
            {filledPlatformCount === 0
              ? t("roster.noValuesYet")
              : filledPlatformCount === 1
                ? t("roster.platformReady")
                : t("roster.platformsReadyN", { n: String(filledPlatformCount) })}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-text-muted hover:text-text-primary transition-colors"
            >
              {t("action.close")}
            </button>
            <button
              onClick={save}
              disabled={loading || filledPlatformCount === 0}
              className="px-4 py-2 text-sm font-medium text-background bg-brand hover:bg-brand-light transition-colors rounded-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading && <Loader2 size={12} className="animate-spin" />}
              {loading ? t("status.saving") : t("roster.saveSnapshots")}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
