"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Eye, EyeOff, KeyRound, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [sessionReady, setSessionReady] = useState(false);

  // Supabase sends the user back with a token in the URL hash.
  // onAuthStateChange fires a PASSWORD_RECOVERY event which sets the session.
  useEffect(() => {
    const supabase = createClient();

    // Check if we already have a valid session (e.g. page refresh)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setSessionReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
    } else {
      setDone(true);
      setLoading(false);
      // Redirect to dashboard after a short delay
      setTimeout(() => router.push("/dashboard"), 2500);
    }
  };

  // Success state
  if (done) {
    return (
      <div className="animate-fade-in text-center">
        <div className="w-16 h-16 rounded-full bg-success/15 border border-success/30 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={28} className="text-success" />
        </div>
        <h2 className="text-2xl font-black text-text-primary mb-3">
          Password updated
        </h2>
        <p className="text-text-muted text-sm max-w-xs mx-auto">
          Your password has been changed. Redirecting you to your dashboard…
        </p>
      </div>
    );
  }

  // Session not established yet (waiting for Supabase to process the token)
  if (!sessionReady) {
    return (
      <div className="animate-fade-in text-center">
        <div className="animate-pulse text-text-muted text-sm py-12">
          Verifying reset link…
        </div>
        <p className="text-xs text-text-muted mt-4">
          If nothing happens,{" "}
          <Link href="/auth/reset-password" className="text-brand hover:text-brand-light font-medium transition-colors">
            request a new link
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-full bg-brand/10 flex items-center justify-center mx-auto mb-5">
          <KeyRound size={22} className="text-brand" />
        </div>
        <h1 className="text-2xl font-black text-text-primary">
          Choose a new password
        </h1>
        <p className="text-text-muted mt-2 text-sm">
          Make it strong — at least 8 characters.
        </p>
      </div>

      <div className="glass-card rounded-2xl p-8">
        <form onSubmit={handleUpdate} className="space-y-5">
          {/* New password */}
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              New password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="w-full bg-surface-2 border border-border rounded-lg px-4 py-3 pr-11 text-sm text-text-primary placeholder:text-text-muted transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm password */}
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              Confirm new password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your new password"
                className="w-full bg-surface-2 border border-border rounded-lg px-4 py-3 pr-11 text-sm text-text-primary placeholder:text-text-muted transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Password strength hint */}
          {password.length > 0 && (
            <div className="flex gap-1.5 mt-1">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-all ${
                    password.length >= 12 ? "bg-success" :
                    password.length >= 10 && i < 3 ? "bg-warning" :
                    password.length >= 8 && i < 2 ? "bg-brand" :
                    i < 1 ? "bg-error" : "bg-surface-2"
                  }`}
                />
              ))}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 bg-error/10 border border-error/20 rounded-lg px-4 py-3 text-sm text-error">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <Button type="submit" loading={loading} size="lg" className="w-full">
            Set New Password
          </Button>
        </form>
      </div>

      <p className="text-center text-sm text-text-muted mt-6">
        Remembered it?{" "}
        <Link
          href="/auth/login"
          className="text-brand hover:text-brand-light font-medium transition-colors"
        >
          Back to Sign In
        </Link>
      </p>
    </div>
  );
}
