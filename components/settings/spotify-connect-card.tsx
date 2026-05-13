"use client";
import { useEffect, useState } from "react";
import { Music, Check, AlertCircle, Loader2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n/hooks";

interface SpotifyStatus {
  connected: boolean;
  displayName: string | null;
  spotifyUserId: string | null;
  connectedAt: string | null;
}

export function SpotifyConnectCard() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<SpotifyStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [flash, setFlash] = useState<
    | { kind: "success"; msg: string }
    | { kind: "error"; msg: string }
    | null
  >(null);

  async function loadStatus() {
    try {
      const res = await fetch("/api/spotify/status", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load status");
      const data = (await res.json()) as SpotifyStatus;
      setStatus(data);
    } catch (e) {
      console.error("[SpotifyConnectCard] status error:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStatus();

    const url = new URL(window.location.href);
    const flag = url.searchParams.get("spotify");
    if (flag) {
      if (flag === "connected") {
        setFlash({ kind: "success", msg: t("settings.spotifyConnected") });
      } else if (flag === "denied") {
        setFlash({ kind: "error", msg: t("settings.spotifyDenied") });
      } else if (flag === "state_mismatch") {
        setFlash({ kind: "error", msg: t("settings.spotifyStateMismatch") });
      } else {
        setFlash({ kind: "error", msg: t("settings.spotifyError") });
      }
      url.searchParams.delete("spotify");
      window.history.replaceState({}, "", url.toString());
      setTimeout(() => setFlash(null), 6000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleConnect() {
    window.location.href = "/api/spotify/auth";
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      const res = await fetch("/api/spotify/disconnect", { method: "POST" });
      if (!res.ok) throw new Error("Disconnect failed");
      await loadStatus();
      setFlash({ kind: "success", msg: t("settings.spotifyDisconnected") });
      setTimeout(() => setFlash(null), 4000);
    } catch (e) {
      console.error("[SpotifyConnectCard] disconnect error:", e);
      setFlash({ kind: "error", msg: t("settings.spotifyDisconnectError") });
    } finally {
      setDisconnecting(false);
    }
  }

  const connectedName = status?.displayName ?? status?.spotifyUserId ?? "";

  return (
    <div className="glass-card rounded-2xl p-7">
      <h2 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-4">
        {t("settings.integrations")}
      </h2>

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-[#1DB954]/10 border border-[#1DB954]/30 flex items-center justify-center shrink-0">
            <Music size={16} className="text-[#1DB954]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">Spotify</p>
            <p className="text-xs text-text-muted mt-0.5">
              {loading
                ? t("settings.checkingConnection")
                : status?.connected
                  ? `${t("settings.connectedAs")} ${connectedName}`
                  : t("settings.spotifyDesc")}
            </p>
          </div>
        </div>

        {loading ? (
          <Loader2 size={16} className="animate-spin text-text-muted mt-1" />
        ) : status?.connected ? (
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="text-xs font-semibold text-text-muted hover:text-error border border-border hover:border-error/40 rounded-lg px-3 py-2 transition-colors whitespace-nowrap disabled:opacity-50"
          >
            {disconnecting ? t("settings.disconnecting") : t("action.disconnect")}
          </button>
        ) : (
          <button
            onClick={handleConnect}
            className="text-xs font-bold text-white bg-[#1DB954] hover:bg-[#1ed760] rounded-lg px-4 py-2 transition-colors whitespace-nowrap"
          >
            {t("action.connect")}
          </button>
        )}
      </div>

      {flash && (
        <div
          className={`mt-4 flex items-center gap-2 rounded-lg px-4 py-3 text-sm border ${
            flash.kind === "success"
              ? "bg-success/10 border-success/20 text-success"
              : "bg-error/10 border-error/20 text-error"
          }`}
        >
          {flash.kind === "success" ? <Check size={14} /> : <AlertCircle size={14} />}
          {flash.msg}
        </div>
      )}
    </div>
  );
}
