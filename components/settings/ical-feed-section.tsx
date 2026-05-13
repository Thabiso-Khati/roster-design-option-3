"use client";

import { useState, useEffect } from "react";
import { CalendarDays, Copy, Check, RefreshCw, ExternalLink, Loader2 } from "lucide-react";

export function ICalFeedSection() {
  const [token,       setToken]       = useState<string | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [copied,      setCopied]      = useState(false);
  const [regenerating,setRegenerating]= useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const appUrl = typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.host}`
    : (process.env.NEXT_PUBLIC_APP_URL ?? "");

  const feedUrl = token ? `${appUrl}/api/calendar/feed/${token}` : "";

  // ── Load token ──────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        const { data } = await supabase
          .from("profiles")
          .select("ical_token")
          .eq("id", session.user.id)
          .single();

        if (data) setToken((data as { ical_token?: string }).ical_token ?? null);
      } catch { /* soft fail */ } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  // ── Copy ─────────────────────────────────────────────────────

  function copyUrl() {
    if (!feedUrl) return;
    navigator.clipboard.writeText(feedUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // ── Regenerate ───────────────────────────────────────────────

  async function regenerate() {
    if (!token) return;
    setRegenerating(true);
    setShowConfirm(false);
    try {
      const res  = await fetch(`/api/calendar/feed/${token}`, { method: "PATCH" });
      const json = await res.json() as { ical_token?: string };
      if (json.ical_token) setToken(json.ical_token);
    } catch { /* soft fail */ } finally {
      setRegenerating(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────

  return (
    <div className="glass-card rounded-2xl p-7 mt-6">
      <h2 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-1">
        Calendar Feed
      </h2>
      <p className="text-xs text-text-muted mb-5">
        Subscribe to your ROSTER calendar in Google Calendar, Apple Calendar, or Outlook.
        Your feed updates automatically whenever you add or change events.
      </p>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-text-muted py-2">
          <Loader2 size={14} className="animate-spin" /> Loading feed URL…
        </div>
      ) : !token ? (
        <p className="text-sm text-text-muted">
          Could not load your feed URL. Try refreshing the page.
        </p>
      ) : (
        <>
          {/* Feed URL */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 flex items-center bg-surface-2 border border-border rounded-lg overflow-hidden">
              <div className="p-3 border-r border-border text-text-muted">
                <CalendarDays size={14} />
              </div>
              <input
                readOnly
                value={feedUrl}
                className="flex-1 bg-transparent px-3 py-2.5 text-xs text-text-muted font-mono truncate focus:outline-none"
                onFocus={e => e.target.select()}
              />
            </div>
            <button
              onClick={copyUrl}
              title="Copy feed URL"
              className="p-2.5 rounded-lg bg-surface-2 border border-border text-text-muted hover:text-text-primary transition-all flex-shrink-0"
            >
              {copied ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
            </button>
          </div>

          {/* Instructions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            {[
              {
                name: "Google Calendar",
                steps: 'Open Google Calendar → Other calendars → "+" → From URL → paste above',
                href:  "https://calendar.google.com/calendar/r/settings/addbyurl",
              },
              {
                name: "Apple Calendar",
                steps: 'File → New Calendar Subscription → paste above → Subscribe',
                href:  null,
              },
              {
                name: "Outlook",
                steps: 'Add calendar → Subscribe from web → paste above → Import',
                href:  "https://outlook.live.com/calendar/0/addfromweb",
              },
            ].map(app => (
              <div
                key={app.name}
                className="bg-surface-2 border border-border rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-text-primary">{app.name}</p>
                  {app.href && (
                    <a
                      href={app.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-text-muted hover:text-brand transition-colors"
                    >
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed">{app.steps}</p>
              </div>
            ))}
          </div>

          {/* Regenerate */}
          <div className="flex items-center justify-between pt-4 border-t border-white/5">
            <p className="text-xs text-text-muted">
              Regenerating creates a new URL and revokes all existing subscriptions.
            </p>
            {showConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted">Are you sure?</span>
                <button
                  onClick={regenerate}
                  disabled={regenerating}
                  className="text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors"
                >
                  {regenerating ? <Loader2 size={13} className="animate-spin" /> : "Yes, regenerate"}
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="text-xs text-text-muted hover:text-text-primary transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirm(true)}
                className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors"
              >
                <RefreshCw size={12} />
                Regenerate URL
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
