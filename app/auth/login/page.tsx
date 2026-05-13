"use client";
import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        // Map common Supabase error codes to friendly messages
        if (authError.message.toLowerCase().includes("email not confirmed")) {
          setError("Please confirm your email address first — check your inbox for the confirmation link.");
        } else if (authError.message.toLowerCase().includes("invalid login")) {
          setError("Incorrect email or password. Please try again.");
        } else {
          setError(authError.message);
        }
        setLoading(false);
        return;
      }

      // Guard: session can be null even with no error (e.g. Supabase email
      // confirmation is required, or the token could not be stored).
      if (!data.session) {
        setError(
          "Sign-in succeeded but no session was established. " +
          "Check that your email is confirmed, or try clearing your browser cookies and logging in again."
        );
        setLoading(false);
        return;
      }

      // Hard redirect so the browser sends all freshly-set session cookies
      // in the very first request to /dashboard. router.push() can race the
      // cookie commit and cause the proxy to see user === null.
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-black text-text-primary">Welcome back</h1>
        <p className="text-text-muted mt-2 text-sm">Sign in to your ROSTER account</p>
      </div>

      <div className="glass-card rounded-2xl p-8">
        <form onSubmit={(e) => { void handleLogin(e); }} className="space-y-5">
          <div>
            <label htmlFor="login-email" className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              Email address
            </label>
            <input
              id="login-email"
              type="email" required value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-surface-2 border border-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-muted transition-all outline-none focus:border-brand"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="login-password" className="text-xs font-semibold text-text-muted uppercase tracking-wider">Password</label>
              <Link href="/auth/reset-password" className="text-xs text-brand hover:opacity-80 transition-colors">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"} required value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-surface-2 border border-border rounded-lg px-4 py-3 pr-11 text-sm text-text-primary placeholder:text-text-muted transition-all outline-none focus:border-brand"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors">
                {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
          </div>

          {error && (
            <div
              data-testid="login-error"
              role="alert"
              className="bg-error/10 border border-error/20 rounded-lg px-4 py-3 text-sm text-error"
            >
              {error}
            </div>
          )}

          <Button type="submit" loading={loading} size="lg" className="w-full mt-2">
            Sign In
          </Button>
        </form>
      </div>

      <p className="text-center text-sm text-text-muted mt-6">
        Don&apos;t have an account?{" "}
        <Link href="/auth/signup" className="text-brand hover:opacity-80 font-medium transition-colors">
          Create one
        </Link>
      </p>
    </div>
  );
}
