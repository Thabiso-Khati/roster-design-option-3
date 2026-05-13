// ============================================================
// ROSTER — Expert Claim Form (client)
// ------------------------------------------------------------
// Three states based on current auth:
//   1. Signed in with MATCHING email → "Claim Now" button.
//      On click, POSTs to /api/experts/claim to bind the expert
//      row to the user, then redirects to /dashboard/expert.
//   2. Signed in with DIFFERENT email → "Sign out & retry" —
//      because claim is gated on email match.
//   3. Not signed in → Magic-link form, email pre-filled &
//      locked to the target email. After send, user checks
//      inbox and clicks; Supabase redirects through the
//      existing /api/auth/callback with next= back to this
//      page, which then detects the session and auto-claims.
// ============================================================

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Check, Loader2, LogOut, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  token: string;
  targetEmail: string;
  signedInEmail: string | null;
}

export function ClaimForm({ token, targetEmail, signedInEmail }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [autoClaimed, setAutoClaimed] = useState(false);

  const emailMatches = signedInEmail && signedInEmail === targetEmail;
  const emailMismatch = signedInEmail && signedInEmail !== targetEmail;

  // Auto-claim on mount if already signed in with matching email.
  // Covers both (a) expert was already signed in when they clicked the
  // link, and (b) user returned from the magic-link callback and now
  // has a session.
  useEffect(() => {
    if (!emailMatches || autoClaimed) return;
    setAutoClaimed(true);
    void handleClaim();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emailMatches]);

  async function handleClaim() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/experts/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Could not claim account.");
        setLoading(false);
        return;
      }
      router.push("/dashboard/expert?welcome=1");
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  async function handleSendMagicLink() {
    setLoading(true);
    setError(null);
    try {
      // After user clicks the magic link in their inbox, Supabase
      // redirects them through /api/auth/callback which exchanges
      // the code and bounces to `next`. We pass `next` as this
      // claim page (with token intact) so the auto-claim effect
      // above fires on return.
      const next = encodeURIComponent(`/experts/claim?token=${token}`);
      const redirectTo = `${window.location.origin}/api/auth/callback?next=${next}`;

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: targetEmail,
        options: { emailRedirectTo: redirectTo },
      });

      if (otpError) {
        setError(otpError.message);
        setLoading(false);
        return;
      }
      setOtpSent(true);
      setLoading(false);
    } catch {
      setError("Could not send the sign-in email. Try again.");
      setLoading(false);
    }
  }

  async function handleSignOut() {
    setLoading(true);
    await supabase.auth.signOut();
    // Reload so the server component picks up the signed-out state.
    window.location.reload();
  }

  // ── Render ────────────────────────────────────────────────

  if (emailMatches) {
    return (
      <div className="space-y-3">
        <div className="bg-success/5 border border-success/20 rounded-xl p-4 flex items-start gap-3">
          <Check size={18} className="text-success flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-success mb-0.5">
              Signed in as {signedInEmail}
            </p>
            <p className="text-xs text-text-muted">
              {loading ? "Linking your account…" : "Ready to claim."}
            </p>
          </div>
        </div>
        {error && (
          <div className="bg-error/5 border border-error/20 rounded-lg px-3 py-2 text-xs text-error flex items-start gap-2">
            <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        <button
          type="button"
          onClick={handleClaim}
          disabled={loading}
          className="w-full bg-brand hover:bg-brand-light disabled:opacity-50 transition-colors text-background font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          {loading ? "Claiming…" : "Claim expert account"}
        </button>
      </div>
    );
  }

  if (emailMismatch) {
    return (
      <div className="space-y-3">
        <div className="bg-warning/5 border border-warning/20 rounded-xl p-4">
          <p className="text-sm font-semibold text-warning mb-1">Wrong account</p>
          <p className="text-xs text-text-muted">
            You&apos;re signed in as <span className="text-text-primary">{signedInEmail}</span>,
            but this link is for <span className="text-text-primary">{targetEmail}</span>.
            Sign out and continue with the right address.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={loading}
          className="w-full bg-surface-2 hover:bg-surface border border-border transition-colors text-text-primary font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
        >
          <LogOut size={14} />
          Sign out & continue
        </button>
      </div>
    );
  }

  // Not signed in — magic link flow
  if (otpSent) {
    return (
      <div className="bg-success/5 border border-success/20 rounded-xl p-5 text-center">
        <div className="w-10 h-10 rounded-full bg-success/10 border border-success/20 flex items-center justify-center mx-auto mb-3">
          <Mail size={16} className="text-success" />
        </div>
        <p className="text-sm font-semibold text-text-primary mb-1">Check your inbox</p>
        <p className="text-xs text-text-muted">
          We sent a sign-in link to{" "}
          <span className="text-text-primary">{targetEmail}</span>. Click it to continue
          — you&apos;ll land back here and your account will finish claiming automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="bg-surface-2 border border-border rounded-xl px-4 py-3 flex items-center gap-2.5">
        <Mail size={15} className="text-text-muted flex-shrink-0" />
        <span className="text-sm text-text-primary flex-1 truncate">{targetEmail}</span>
      </div>
      {error && (
        <div className="bg-error/5 border border-error/20 rounded-lg px-3 py-2 text-xs text-error flex items-start gap-2">
          <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      <button
        type="button"
        onClick={handleSendMagicLink}
        disabled={loading}
        className="w-full bg-brand hover:bg-brand-light disabled:opacity-50 transition-colors text-background font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Mail size={15} />}
        {loading ? "Sending…" : "Email me a sign-in link"}
      </button>
      <p className="text-center text-xs text-text-muted">
        We&apos;ll email a one-tap sign-in link. No password needed.
      </p>
    </div>
  );
}
