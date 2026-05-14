"use client";
import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loginAction } from "./actions";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result   = await loginAction(formData);

    // loginAction redirects on success — only reaches here on error.
    if (result?.error) {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-black text-text-primary">Welcome back</h1>
        <p className="text-text-muted mt-2 text-sm">Sign in to your ROSTER account</p>
      </div>

      <div className="glass-card rounded-2xl p-8">
        <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-5">
          <div>
            <label htmlFor="login-email" className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              Email address
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              required
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
                name="password"
                type={showPassword ? "text" : "password"}
                required
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
            <div role="alert" className="bg-error/10 border border-error/20 rounded-lg px-4 py-3 text-sm text-error">
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
