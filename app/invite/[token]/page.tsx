"use client";

// ============================================================
// ROSTER — /invite/[token]
// ------------------------------------------------------------
// Public accept-invite page. Handles both magic-link tokens
// (from email) and manual invite codes.
//
// Flow:
//  1. If the user is not logged in → prompt them to sign in /
//     create an account. After auth, they'll land back here.
//  2. If logged in → call POST /api/team/invite/accept with
//     the token from the URL, then redirect to /dashboard.
// ============================================================

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, AlertCircle, Loader2, Users } from "lucide-react";

type State = "loading" | "accepting" | "success" | "error" | "needs-auth";

export default function InvitePage() {
  const params    = useParams<{ token: string }>();
  const router    = useRouter();
  const token     = params.token;

  const [state,   setState]   = useState<State>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setState("error");
      setMessage("Invalid invite link.");
      return;
    }

    let cancelled = false;

    async function run() {
      // Check auth state
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        if (!cancelled) setState("needs-auth");
        return;
      }

      if (!cancelled) setState("accepting");

      try {
        const res  = await fetch("/api/team/invite/accept", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ token }),
        });
        const json = await res.json();

        if (!cancelled) {
          if (res.ok) {
            setState("success");
            // Redirect to dashboard after a short pause
            setTimeout(() => router.replace("/dashboard"), 2000);
          } else {
            setState("error");
            setMessage(json.error ?? "Failed to accept invite.");
          }
        }
      } catch {
        if (!cancelled) {
          setState("error");
          setMessage("Network error. Please try again.");
        }
      }
    }

    run();
    return () => { cancelled = true; };
  }, [token, router]);

  const handleSignIn = () => {
    // Preserve the invite token in the redirect URL so after auth
    // the user lands back on this page
    router.push(`/auth/login?redirectTo=/invite/${token}`);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="glass-card rounded-2xl w-full max-w-md p-8 animate-fade-in">

        {/* Logo mark */}
        <div className="flex items-center justify-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center">
            <Users size={22} className="text-brand" />
          </div>
        </div>

        {state === "loading" && (
          <div className="text-center">
            <Loader2 size={24} className="animate-spin text-brand mx-auto mb-4" />
            <p className="text-sm text-text-muted">Checking invite…</p>
          </div>
        )}

        {state === "needs-auth" && (
          <div className="text-center">
            <h1 className="text-xl font-black text-text-primary mb-2">
              You've been invited to ROSTER
            </h1>
            <p className="text-sm text-text-muted mb-6 leading-relaxed">
              Sign in or create a free account to accept this invitation and
              join your team's workspace.
            </p>
            <button
              onClick={handleSignIn}
              className="w-full py-3 px-4 bg-brand hover:bg-brand-light text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Sign in to accept
            </button>
          </div>
        )}

        {state === "accepting" && (
          <div className="text-center">
            <Loader2 size={24} className="animate-spin text-brand mx-auto mb-4" />
            <p className="text-sm text-text-muted">Accepting your invite…</p>
          </div>
        )}

        {state === "success" && (
          <div className="text-center">
            <CheckCircle2 size={32} className="text-emerald-400 mx-auto mb-4" />
            <h1 className="text-xl font-black text-text-primary mb-2">
              You're in!
            </h1>
            <p className="text-sm text-text-muted">
              Redirecting you to the workspace…
            </p>
          </div>
        )}

        {state === "error" && (
          <div className="text-center">
            <AlertCircle size={32} className="text-error mx-auto mb-4" />
            <h1 className="text-xl font-black text-text-primary mb-2">
              Invite failed
            </h1>
            <p className="text-sm text-text-muted mb-6">
              {message || "Something went wrong. Please try again or ask the workspace owner to re-send the invite."}
            </p>
            <button
              onClick={() => router.push("/")}
              className="text-sm text-brand underline"
            >
              Go to homepage
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
