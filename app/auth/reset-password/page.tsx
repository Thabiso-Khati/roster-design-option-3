"use client";
import { useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${window.location.origin}/auth/update-password`,
      }
    );

    if (resetError) {
      setError(resetError.message);
    } else {
      setSent(true);
    }

    setLoading(false);
  };

  if (sent) {
    return (
      <div className="animate-fade-in text-center">
        <div className="w-16 h-16 rounded-full bg-success/15 border border-success/30 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={28} className="text-success" />
        </div>
        <h2 className="text-2xl font-black text-text-primary mb-3">
          Reset email sent
        </h2>
        <p className="text-text-muted text-sm max-w-xs mx-auto">
          Check your inbox at{" "}
          <strong className="text-text-primary">{email}</strong> for the
          password reset link.
        </p>
        <Link href="/auth/login" className="inline-block mt-8">
          <Button variant="outline">Back to Sign In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-black text-text-primary">
          Reset your password
        </h1>
        <p className="text-text-muted mt-2 text-sm">
          Enter your email and we&apos;ll send a reset link.
        </p>
      </div>

      <div className="glass-card rounded-2xl p-8">
        <form onSubmit={handleReset} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              Email address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-surface-2 border border-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-muted transition-all"
            />
          </div>
          {error && (
            <div className="bg-error/10 border border-error/20 rounded-lg px-4 py-3 text-sm text-error">
              {error}
            </div>
          )}
          <Button type="submit" loading={loading} size="lg" className="w-full">
            Send Reset Link
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
