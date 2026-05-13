"use client";

import { useState } from "react";
import { ExternalLink, Pencil, RefreshCw, Loader2, Link2, Link2Off } from "lucide-react";
import { useTranslation } from "@/lib/i18n/hooks";

export type HandleKind = "audiomack" | "youtube" | "tiktok";

// ── Manual-handle platforms (Audiomack, YouTube) ─────────────

const HANDLE_META: Record<
  "audiomack" | "youtube",
  {
    shortName: string;
    label: string;
    apiField: "audiomack_handle" | "youtube_channel_id";
    artistField: "audiomackHandle" | "youtubeChannelId";
    hint: string;
    publicUrl: (handle: string) => string;
  }
> = {
  youtube: {
    shortName: "YouTube",
    label: "YouTube channel ID (UC…)",
    apiField: "youtube_channel_id",
    artistField: "youtubeChannelId",
    hint: "Looks like UC… — find it in the channel URL or under the channel's About → Share Channel.",
    publicUrl: (h) => `https://www.youtube.com/channel/${encodeURIComponent(h)}`,
  },
  audiomack: {
    shortName: "Audiomack",
    label: "Audiomack URL slug",
    apiField: "audiomack_handle",
    artistField: "audiomackHandle",
    hint: "The bit after audiomack.com/ — e.g. de-mthuda for audiomack.com/de-mthuda.",
    publicUrl: (h) => `https://audiomack.com/${encodeURIComponent(h)}`,
  },
};

// ── TikTok OAuth panel ────────────────────────────────────────

function TikTokPanel({
  artistId,
  artistName,
  initialConnected,
}: {
  artistId: string;
  artistName: string;
  initialConnected: boolean;
}) {
  const [connected, setConnected]     = useState(initialConnected);
  const [disconnecting, setDisconnecting] = useState(false);
  const [msg, setMsg]                 = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  function connect() {
    // Redirect to OAuth initiation endpoint
    window.location.href = `/api/tiktok/connect?artistId=${encodeURIComponent(artistId)}`;
  }

  async function disconnect() {
    setDisconnecting(true);
    setMsg(null);
    try {
      const res = await fetch("/api/tiktok/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artistId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `Disconnect failed (${res.status})`);
      setConnected(false);
      setMsg({ kind: "ok", text: "TikTok disconnected." });
    } catch (e) {
      setMsg({ kind: "err", text: e instanceof Error ? e.message : "Disconnect failed" });
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <div className="mb-5 rounded-lg border border-white/5 bg-surface/40 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-wider text-text-muted/70 font-medium mb-1">
            Linked TikTok account
          </p>
          {connected ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                Connected
              </span>
              <a
                href={`https://www.tiktok.com/@${artistName}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-brand hover:text-brand-light"
              >
                View profile <ExternalLink size={10} />
              </a>
            </div>
          ) : (
            <p className="text-xs text-text-muted">
              Not connected — click &quot;Connect TikTok&quot; to authorise via OAuth.
            </p>
          )}
          <p className="text-[10px] text-text-muted/60 mt-1 leading-snug">
            {connected
              ? "Stats (followers, monthly plays) are pulled every night."
              : "Requires a TikTok Developer app approval. Connect once and stats sync automatically."}
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {connected ? (
            <button
              type="button"
              onClick={disconnect}
              disabled={disconnecting}
              className="text-[11px] px-2 py-1 rounded-md text-error/80 hover:text-error hover:bg-error/10 disabled:opacity-40 inline-flex items-center gap-1"
            >
              {disconnecting ? (
                <Loader2 size={10} className="animate-spin" />
              ) : (
                <Link2Off size={10} aria-hidden="true" />
              )}
              Disconnect
            </button>
          ) : (
            <button
              type="button"
              onClick={connect}
              className="text-[11px] px-2 py-1 rounded-md bg-brand/15 text-brand hover:bg-brand/25 inline-flex items-center gap-1"
            >
              <Link2 size={10} aria-hidden="true" />
              Connect TikTok
            </button>
          )}
        </div>
      </div>
      {msg && (
        <p className={`text-[11px] mt-2 ${msg.kind === "ok" ? "text-emerald-400" : "text-error"}`}>
          {msg.text}
        </p>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────

export function LinkedAccountPanel({
  artistId,
  artistName,
  kind,
  initialValue,
}: {
  artistId: string;
  artistName: string;
  kind: HandleKind;
  initialValue: string | null | undefined;
}) {
  const { t } = useTranslation();

  // TikTok uses OAuth — render the dedicated panel
  if (kind === "tiktok") {
    return (
      <TikTokPanel
        artistId={artistId}
        artistName={artistName}
        initialConnected={!!initialValue}
      />
    );
  }

  // Audiomack / YouTube — manual handle entry
  const meta = HANDLE_META[kind];
  const [current, setCurrent] = useState<string | null>(initialValue ?? null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [refetching, setRefetching] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  function startEdit() {
    setDraft(current ?? "");
    setEditing(true);
    setMsg(null);
  }
  function cancelEdit() {
    setEditing(false);
    setMsg(null);
  }

  async function save() {
    setSaving(true);
    setMsg(null);
    const trimmed = draft.trim();
    try {
      const res = await fetch(`/api/artists/${artistId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [meta.apiField]: trimmed.length === 0 ? null : trimmed,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `Save failed (${res.status})`);
      setCurrent(trimmed.length === 0 ? null : trimmed);
      setEditing(false);
      setMsg({ kind: "ok", text: "Saved." });
    } catch (e) {
      setMsg({ kind: "err", text: e instanceof Error ? e.message : "Save failed" });
    } finally {
      setSaving(false);
    }
  }

  async function refetch() {
    setRefetching(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/artists/${artistId}/refetch`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `Refetch failed (${res.status})`);
      const written = json.metricsWritten ?? 0;
      const fail = (json.failures ?? []).find(
        (f: { platform: string }) => f.platform === kind
      );
      if (fail) throw new Error(fail.error || `${meta.shortName} fetch failed`);
      setMsg({
        kind: "ok",
        text: `Re-fetched. ${written} metric${written === 1 ? "" : "s"} written across all platforms — close & re-open to see fresh numbers.`,
      });
    } catch (e) {
      setMsg({ kind: "err", text: e instanceof Error ? e.message : "Refetch failed" });
    } finally {
      setRefetching(false);
    }
  }

  return (
    <div className="mb-5 rounded-lg border border-white/5 bg-surface/40 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-wider text-text-muted/70 font-medium mb-1">
            Linked {meta.shortName} account
          </p>
          {!editing ? (
            current ? (
              <div className="flex items-center gap-2 flex-wrap">
                <code className="text-xs text-text-primary bg-white/5 rounded px-1.5 py-0.5 truncate max-w-[220px]">
                  {current}
                </code>
                <a
                  href={meta.publicUrl(current)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-brand hover:text-brand-light"
                  title={`Open ${artistName} on ${meta.shortName} in a new tab`}
                >
                  View <ExternalLink size={10} />
                </a>
              </div>
            ) : (
              <p className="text-xs text-text-muted">
                Not linked yet — fetcher will try to auto-resolve from the artist name.
              </p>
            )
          ) : (
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={meta.label}
              className="w-full bg-surface/60 border border-white/10 rounded-md px-2 py-1.5 text-xs text-text-primary placeholder:text-text-muted/50 focus:border-brand outline-none"
            />
          )}
          {!editing && (
            <p className="text-[10px] text-text-muted/60 mt-1 leading-snug">
              {meta.hint}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {editing ? (
            <>
              <button
                type="button"
                onClick={cancelEdit}
                disabled={saving}
                className="text-[11px] px-2 py-1 text-text-muted hover:text-text-primary disabled:opacity-40"
              >
                {t("action.cancel")}
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="text-[11px] px-2 py-1 rounded-md bg-brand/15 text-brand hover:bg-brand/25 disabled:opacity-40 inline-flex items-center gap-1"
              >
                {saving && <Loader2 size={10} className="animate-spin" />}
                {t("action.save")}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={startEdit}
                className="text-[11px] px-2 py-1 text-text-muted hover:text-text-primary inline-flex items-center gap-1"
              >
                <Pencil size={10} aria-hidden="true" />
                {current ? t("action.edit") : t("action.linkAccount")}
              </button>
              {current && (
                <button
                  type="button"
                  onClick={refetch}
                  disabled={refetching}
                  className="text-[11px] px-2 py-1 rounded-md bg-white/5 text-text-primary hover:bg-white/10 disabled:opacity-40 inline-flex items-center gap-1"
                  title="Re-pull stats now (don't wait for nightly cron)"
                >
                  {refetching ? (
                    <Loader2 size={10} className="animate-spin" />
                  ) : (
                    <RefreshCw size={10} aria-hidden="true" />
                  )}
                  {t("action.refetch")}
                </button>
              )}
            </>
          )}
        </div>
      </div>
      {msg && (
        <p className={`text-[11px] mt-2 ${msg.kind === "ok" ? "text-emerald-400" : "text-error"}`}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
