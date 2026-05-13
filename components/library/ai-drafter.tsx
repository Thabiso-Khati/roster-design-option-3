"use client";
/**
 * Compact AI drafter component used by Sync, PR, and CRM modules.
 * Wraps a textarea form + /api/ai call + result panel. Inherits the
 * budget enforcement and no-fabrication rules from the server.
 */
import { useState, useEffect } from "react";
import { Sparkles, Loader2, Copy, Check, RefreshCw } from "lucide-react";
import { SaveButton } from "@/components/ui/save-button";
import type { ArtistContext } from "@/lib/artist-context";
import { loadFullContext } from "@/lib/artist-context";
import { ResourcePage, inputClass, labelClass } from "@/components/library/module-shell";
import { useTranslation } from "@/lib/i18n/hooks";

export interface AIDrafterField {
  key: string;
  label: string;
  placeholder?: string;
  multiline?: boolean;
}

interface Props {
  parentHref: string;
  parentLabel: string;
  color: string;
  tag: string;
  title: string;
  intro: string;
  tool: string;
  /** Slug used for Workspace save, e.g. "ai-social-captions" */
  toolSlug?: string;
  fields: AIDrafterField[];
  artistContextDefaults?: Partial<ArtistContext>;
  next?: { href: string; label: string };
}

export function AIDrafter({
  parentHref,
  parentLabel,
  color,
  tag,
  title,
  intro,
  tool,
  toolSlug,
  fields,
  artistContextDefaults = {},
  next,
}: Props) {
  const { t } = useTranslation();
  const [params, setParams] = useState<Record<string, string>>({});
  const [ctx, setCtx] = useState<Partial<ArtistContext>>(artistContextDefaults);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Auto-seed artist context from Brand Book (localStorage) on first mount.
  // Stored values fill any empty fields; caller's artistContextDefaults take
  // precedence if they already provided a value.
  useEffect(() => {
    const stored = loadFullContext();
    if (!stored) return;
    setCtx((prev) => {
      // Build a merged object: stored values as the base, then layer prev on top
      // so any non-empty explicit defaults the caller passed are preserved.
      const merged: Partial<ArtistContext> = {
        artistName:       stored.artistName       || "",
        genre:            stored.genre            || "",
        market:           stored.market           || "",
        recentRelease:    stored.recentRelease    || "",
        streamingNumbers: stored.streamingNumbers || "",
      };
      // Caller-provided defaults win over stored values for non-empty fields
      (Object.keys(prev) as (keyof ArtistContext)[]).forEach((k) => {
        const v = prev[k];
        if (v !== undefined && v !== null && v !== "") {
          (merged as Record<string, unknown>)[k] = v;
        }
      });
      return merged;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function generate() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool, artistContext: ctx, params }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json?.code === "BUDGET_EXHAUSTED") {
          setError(t("library.aiBudgetExhausted").replace("{resetAt}", json.resetAt ?? "next month"));
        } else {
          setError(json?.error ?? t("library.draftFailed"));
        }
        return;
      }
      setDraft(json.result || "");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  const ctxKeys: { k: keyof ArtistContext; label: string; placeholder: string }[] = [
    { k: "artistName",      label: t("library.ctxArtistName"),    placeholder: "e.g. Tyla" },
    { k: "genre",           label: t("library.ctxGenre"),         placeholder: "Amapiano / Afrobeats / R&B" },
    { k: "market",          label: t("library.ctxMarket"),        placeholder: "South Africa / Nigeria" },
    { k: "recentRelease",   label: t("library.ctxRecentRelease"), placeholder: "Single / EP / album title" },
    { k: "streamingNumbers",label: t("library.ctxStreaming"),     placeholder: "Leave blank if not on hand" },
  ];

  return (
    <ResourcePage parentHref={parentHref} parentLabel={parentLabel} color={color} tag={tag} title={title} intro={intro} next={next}>
      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color }}>{t("library.artistContext")}</p>
        <div className="grid grid-cols-2 gap-4">
          {ctxKeys.map((c) => (
            <div key={c.k} className={c.k === "recentRelease" || c.k === "streamingNumbers" ? "col-span-2" : ""}>
              <label className={labelClass}>{c.label}</label>
              <input
                className={inputClass}
                placeholder={c.placeholder}
                value={(ctx as Record<string, string>)[c.k as string] ?? ""}
                onChange={(e) => setCtx({ ...ctx, [c.k]: e.target.value })}
              />
            </div>
          ))}
        </div>
        <p className="text-[11px] text-text-muted mt-3 leading-relaxed">
          {t("library.aiContextNote")}
        </p>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color }}>{t("library.brief")}</p>
        <div className="grid grid-cols-1 gap-4">
          {fields.map((f) => (
            <div key={f.key}>
              <label className={labelClass}>{f.label}</label>
              {f.multiline ? (
                <textarea
                  className={inputClass}
                  rows={3}
                  placeholder={f.placeholder}
                  value={params[f.key] ?? ""}
                  onChange={(e) => setParams({ ...params, [f.key]: e.target.value })}
                />
              ) : (
                <input
                  className={inputClass}
                  placeholder={f.placeholder}
                  value={params[f.key] ?? ""}
                  onChange={(e) => setParams({ ...params, [f.key]: e.target.value })}
                />
              )}
            </div>
          ))}
        </div>

        <button
          onClick={generate}
          disabled={loading || !ctx.artistName}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm disabled:opacity-50"
          style={{ backgroundColor: color, color: "white" }}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          {loading ? t("library.drafting") : draft ? t("library.redraft") : t("library.draftWithAI")}
        </button>

        {error && <p className="text-xs text-red-400 mt-3">{error}</p>}
      </section>

      {draft && (
        <section className="glass-card rounded-2xl p-6" style={{ borderColor: `${color}40` }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-black uppercase tracking-widest" style={{ color }}>{t("library.draft")}</p>
            <div className="flex items-center gap-2">
              <button onClick={generate} className="text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1">
                <RefreshCw size={12} /> {t("library.regenerate")}
              </button>
              <button onClick={copy} className="text-xs font-semibold inline-flex items-center gap-1 px-3 py-1.5 rounded-lg" style={{ backgroundColor: `${color}15`, color }}>
                {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? t("action.copy") : t("action.copy")}
              </button>
              {toolSlug && (
                <SaveButton
                  toolSlug={toolSlug}
                  getData={() => ({ draft, params, ctx, tool })}
                  title={`${title} — ${new Date().toLocaleDateString("en-ZA", { month: "short", year: "numeric" })}`}
                  className="text-xs px-3 py-1.5"
                />
              )}
            </div>
          </div>
          <textarea
            className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand whitespace-pre-wrap"
            rows={Math.min(20, Math.max(8, draft.split("\n").length + 2))}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <p className="text-[11px] text-text-muted mt-3 leading-relaxed">
            {t("library.aiEditNote")}
          </p>
        </section>
      )}
    </ResourcePage>
  );
}
