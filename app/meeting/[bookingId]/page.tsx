// ============================================================
// ROSTER — /meeting/[bookingId]
// ------------------------------------------------------------
// The actual video meeting page for a booked expert session.
// Privacy-first framing is front-and-centre: pre-join screen
// tells users "Nothing from this call is recorded or stored."
//
// Flow:
//   1. On mount, POST /api/bookings/:id/meeting/token to get a
//      Daily meeting token. Handle 402/410/425/503 with clear
//      user-facing messages.
//   2. Show pre-join screen with camera/mic preview + privacy
//      notice, "Join" button enters the room.
//   3. Render Daily's prebuilt iframe (DailyIframe.createFrame).
//   4. On leave, redirect back to the booking detail page.
// ============================================================

"use client";

import { useEffect, useRef, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Video,
  ShieldCheck,
  Loader2,
  AlertCircle,
  Clock,
} from "lucide-react";
import type DailyIframe from "@daily-co/daily-js";
import type { DailyCall } from "@daily-co/daily-js";

interface TokenResponse {
  token: string;
  roomUrl: string;
  role: "expert" | "user";
  displayName: string;
}

type Phase = "loading" | "prejoin" | "in-call" | "error" | "ended";

export default function MeetingPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = use(params);
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("loading");
  const [tokenData, setTokenData] = useState<TokenResponse | null>(null);
  const [error, setError] = useState<{ message: string; opensAt?: string } | null>(
    null
  );

  // Ref to the Daily call object so we can clean up on unmount
  const callRef = useRef<DailyCall | null>(null);
  const frameContainerRef = useRef<HTMLDivElement | null>(null);

  // ── 1. Fetch the token on mount ──────────────────────────
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`/api/bookings/${bookingId}/meeting/token`, {
          method: "POST",
        });
        const json = await res.json();

        if (cancelled) return;

        if (!res.ok) {
          setError({
            message: json.error || `Failed (${res.status})`,
            opensAt: json.opensAt,
          });
          setPhase(res.status === 410 ? "ended" : "error");
          return;
        }

        setTokenData(json);
        setPhase("prejoin");
      } catch (e) {
        if (cancelled) return;
        setError({
          message: e instanceof Error ? e.message : "Could not reach server",
        });
        setPhase("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  // ── 2. Join the room when user clicks Join ───────────────
  //
  // NOTE: we flip phase to "in-call" FIRST so the iframe container
  // div gets mounted and `frameContainerRef.current` becomes non-null.
  // The actual Daily wiring happens in the useEffect below, once the
  // ref is attached. Doing the Daily init inline here would race the
  // re-render and always find `frameContainerRef.current === null`.
  function joinCall() {
    if (!tokenData) return;
    setPhase("in-call");
  }

  // ── 2b. Attach Daily once the iframe container is mounted ───
  useEffect(() => {
    if (phase !== "in-call") return;
    if (!tokenData) return;
    if (!frameContainerRef.current) return;
    if (callRef.current) return; // already attached, don't double-init

    let cancelled = false;

    (async () => {
      try {
        // Dynamic import so the Daily bundle isn't pulled into pages
        // that don't need it.
        const DailyIframeModule = (await import("@daily-co/daily-js")).default;

        if (cancelled || !frameContainerRef.current) return;

        const call = DailyIframeModule.createFrame(frameContainerRef.current, {
          iframeStyle: {
            position: "absolute",
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
            border: "0",
            borderRadius: "0",
          },
          showLeaveButton: true,
          showFullscreenButton: true,
          // Brand the Daily prebuilt UI to match ROSTER
          theme: {
            colors: {
              accent: "#a78bfa",
              accentText: "#0a0a0f",
              background: "#0a0a0f",
              backgroundAccent: "#1a1a24",
              baseText: "#f5f5f7",
              border: "#2a2a38",
              mainAreaBg: "#0a0a0f",
              mainAreaBgAccent: "#14141e",
              mainAreaText: "#f5f5f7",
              supportiveText: "#9ca3af",
            },
          },
        });

        callRef.current = call;

        call.on("left-meeting", () => {
          setPhase("ended");
          setTimeout(() => router.push(`/dashboard/bookings`), 1500);
        });

        await call.join({
          url: tokenData.roomUrl,
          token: tokenData.token,
          userName: tokenData.displayName,
        });
      } catch (e) {
        if (cancelled) return;
        setError({
          message: e instanceof Error ? e.message : "Could not join meeting",
        });
        setPhase("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [phase, tokenData, router]);

  // ── Clean up Daily on unmount ────────────────────────────
  useEffect(() => {
    return () => {
      if (callRef.current) {
        callRef.current.destroy().catch(() => {});
        callRef.current = null;
      }
    };
  }, []);

  // ── Render by phase ──────────────────────────────────────
  if (phase === "loading") {
    return (
      <MeetingShell>
        <div className="flex flex-col items-center justify-center py-20 text-text-muted">
          <Loader2 size={24} className="animate-spin mb-3 text-brand" />
          <p className="text-sm">Preparing your session…</p>
        </div>
      </MeetingShell>
    );
  }

  if (phase === "error") {
    return (
      <MeetingShell>
        <div className="max-w-md mx-auto text-center py-12">
          <div className="w-12 h-12 rounded-full bg-error/10 border border-error/20 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={20} className="text-error" />
          </div>
          <h2 className="text-lg font-semibold mb-2">Couldn&apos;t join the session</h2>
          <p className="text-sm text-text-muted mb-6">{error?.message}</p>
          {error?.opensAt && (
            <p className="text-xs text-text-muted/70 mb-6">
              Opens at{" "}
              <span className="text-text-primary">
                {new Date(error.opensAt).toLocaleString()}
              </span>
            </p>
          )}
          <Link
            href={`/dashboard/bookings`}
            className="inline-flex items-center gap-2 text-sm text-brand hover:text-brand-light transition-colors"
          >
            <ArrowLeft size={14} /> Back to booking
          </Link>
        </div>
      </MeetingShell>
    );
  }

  if (phase === "ended") {
    return (
      <MeetingShell>
        <div className="max-w-md mx-auto text-center py-12">
          <div className="w-12 h-12 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center mx-auto mb-4">
            <Clock size={20} className="text-brand" />
          </div>
          <h2 className="text-lg font-semibold mb-2">Session ended</h2>
          <p className="text-sm text-text-muted mb-6">
            Redirecting you back to your booking…
          </p>
        </div>
      </MeetingShell>
    );
  }

  if (phase === "prejoin" && tokenData) {
    return (
      <MeetingShell>
        <PreJoin
          displayName={tokenData.displayName}
          role={tokenData.role}
          onJoin={joinCall}
          onBack={() => router.push(`/dashboard/bookings`)}
        />
      </MeetingShell>
    );
  }

  // phase === "in-call" — full-bleed Daily iframe container
  return (
    <div className="fixed inset-0 bg-background">
      <div ref={frameContainerRef} className="relative w-full h-full" />
    </div>
  );
}

// ─── Layout shell (used for loading / error / prejoin states) ──
function MeetingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-text-primary flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">{children}</div>
    </div>
  );
}

// ─── Pre-join screen ────────────────────────────────────────
function PreJoin({
  displayName,
  role,
  onJoin,
  onBack,
}: {
  displayName: string;
  role: "expert" | "user";
  onJoin: () => void;
  onBack: () => void;
}) {
  return (
    <div className="glass-card rounded-2xl p-8">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors mb-6"
      >
        <ArrowLeft size={12} /> Back to booking
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center">
          <Video size={18} className="text-brand" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Ready to join</h1>
          <p className="text-sm text-text-muted">
            Joining as <span className="text-text-primary">{displayName}</span>
            {role === "expert" && " (Expert)"}
          </p>
        </div>
      </div>

      {/* Privacy notice — the headline promise */}
      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <ShieldCheck
            size={18}
            className="text-emerald-400 flex-shrink-0 mt-0.5"
          />
          <div>
            <p className="text-sm font-semibold text-emerald-300 mb-1">
              Your session is completely private
            </p>
            <p className="text-xs text-text-muted leading-relaxed">
              Nothing from this call is recorded, transcribed, or stored. ROSTER
              only logs operational data — when you joined, when you left, and
              call quality — to enforce our no-show policy and keep the platform
              reliable. Take your own notes during the session.
            </p>
          </div>
        </div>
      </div>

      {/* Pre-call checklist */}
      <div className="space-y-2 mb-8 text-xs text-text-muted">
        <p className="font-medium text-text-primary/80 uppercase tracking-wide text-[10px] mb-2">
          Before you join
        </p>
        <div className="flex items-start gap-2">
          <span className="text-brand mt-0.5">•</span>
          <span>Use headphones to avoid echo</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-brand mt-0.5">•</span>
          <span>Find a quiet, well-lit spot</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-brand mt-0.5">•</span>
          <span>
            You can leave and rejoin anytime during the scheduled session window
          </span>
        </div>
      </div>

      <button
        onClick={onJoin}
        className="w-full bg-brand hover:bg-brand-light transition-colors text-background font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
      >
        <Video size={16} />
        Join session
      </button>
    </div>
  );
}
