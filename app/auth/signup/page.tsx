"use client";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { TIERS, type TierId } from "@/lib/constants";

// ─── Helpers ──────────────────────────────────────────────────

function getTierFromParams(plan: string | null, billing: string | null) {
  const tierId = (["pro", "agency", "enterprise", "free"].includes(plan || "")
    ? plan
    : "pro") as TierId;
  const billingCadence = (billing === "annual" ? "annual" : "monthly") as "monthly" | "annual";
  const tier = TIERS.find((t) => t.id === tierId) ?? TIERS.find((t) => t.id === "pro")!;
  return { tier, billing: billingCadence };
}

// ─── Page ─────────────────────────────────────────────────────

export default function SignupPage() {
  const searchParams   = useSearchParams();
  const rawPlan        = searchParams.get("plan");
  const rawBilling     = searchParams.get("billing");
  const errorParam     = searchParams.get("error");

  const { tier: initialTier, billing: initialBilling } = getTierFromParams(rawPlan, rawBilling);

  const [selectedTier, setSelectedTier] = useState(initialTier);
  const [billing, setBilling]           = useState<"monthly" | "annual">(initialBilling);
  const [name, setName]                 = useState("");
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(getErrorMessage(errorParam));
  const [step, setStep]                 = useState<"details" | "verify">("details");

  const isFree  = selectedTier.id === "free";
  const price   = billing === "annual" ? selectedTier.annualMonthly : selectedTier.monthlyPrice;
  const savings = billing === "annual" ? selectedTier.annualSavings : 0;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!isFree && password.length < 8) {
      setError("Password must be at least 8 characters.");
      setLoading(false);
      return;
    }

    const supabase = createClient();

    // 1. Create auth user
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          tier_id:   selectedTier.id,
          billing,
        },
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      if (isFree) {
        // Free tier — no payment needed, go straight to verify/onboarding
        setStep("verify");
        setLoading(false);
        return;
      }

      // 2. Paid tiers — initiate Paystack payment
      try {
        const res = await fetch("/api/paystack/initialize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            name,
            tierId:  selectedTier.id,
            billing,
            userId:  data.user.id,
          }),
        });

        const json = await res.json();

        if (json.paymentLink) {
          window.location.href = json.paymentLink;
          return;
        }

        // Payment init failed — still let them verify email
        setError("Payment initialisation failed. Verify your email first, then contact support.");
      } catch {
        setError("Could not reach payment provider. Please try again.");
      }
    }

    setLoading(false);
    setStep("verify");
  };

  // ── Verify step ────────────────────────────────────────────

  if (step === "verify") {
    return (
      <div className="animate-fade-in text-center">
        <div className="w-16 h-16 rounded-full bg-success/15 border border-success/30 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={28} className="text-success" />
        </div>
        <h2 className="text-2xl font-black text-text-primary mb-3">
          {isFree ? "Account created." : "Check your email."}
        </h2>
        <p className="text-text-muted text-sm max-w-xs mx-auto">
          {isFree
            ? <>Welcome to ROSTER Free. <Link href="/auth/login" className="text-brand underline">Sign in</Link> to get started.</>
            : <>We&apos;ve sent a confirmation link to{" "}
                <strong className="text-text-primary">{email}</strong>.
                Click it to verify your account, then complete your subscription.</>
          }
        </p>
        {!isFree && (
          <Link href="/auth/login" className="inline-block mt-8">
            <Button variant="outline">Back to Sign In</Button>
          </Link>
        )}
      </div>
    );
  }

  // ── Main form ──────────────────────────────────────────────

  return (
    <div className="animate-fade-in">

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-black text-text-primary">
          {isFree ? "Get started for free." : "Start managing like a major."}
        </h1>
        <p className="text-text-muted mt-2 text-sm">
          {isFree
            ? "No card required. Access Learn and two tools forever."
            : "Create your ROSTER account — cancel anytime."}
        </p>
      </div>

      {/* Plan summary (paid only) */}
      {!isFree && (
        <div className="glass-card rounded-xl p-4 mb-6">
          {/* Tier selector */}
          <div className="flex gap-1.5 mb-4">
            {TIERS.filter((t) => t.id !== "free").map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTier(t)}
                className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedTier.id === t.id
                    ? "bg-brand text-background"
                    : "text-text-muted hover:text-text-primary border border-border"
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>

          {/* Billing toggle */}
          <div className="flex rounded-lg bg-surface border border-border p-0.5 mb-4">
            {(["monthly", "annual"] as const).map((b) => (
              <button
                key={b}
                onClick={() => setBilling(b)}
                className={`flex-1 rounded-md py-2 text-xs font-semibold transition-all ${
                  billing === b
                    ? "bg-gold-gradient text-background"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                {b === "monthly" ? "Monthly" : "Annual · 2 months free"}
              </button>
            ))}
          </div>

          {/* Price display */}
          <div className="flex items-baseline justify-between">
            <span className="text-text-muted text-xs">{selectedTier.name}</span>
            <div className="text-right">
              <span className="text-2xl font-black text-text-primary">
                R{price.toLocaleString("en-ZA")}
              </span>
              <span className="text-text-muted text-xs ml-1">/mo</span>
              {billing === "annual" && savings > 0 && (
                <p className="text-[11px] text-success mt-0.5">
                  Save R{savings.toLocaleString("en-ZA")}/yr
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="glass-card rounded-2xl p-8">
        <form onSubmit={handleSignup} className="space-y-5">

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              Full name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full bg-surface-2 border border-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-muted transition-all"
            />
          </div>

          {/* Email */}
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

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              Password
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
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-error/10 border border-error/20 rounded-lg px-4 py-3 text-sm text-error">
              {error}
            </div>
          )}

          <Button
            type="submit"
            loading={loading}
            size="lg"
            className="w-full mt-2"
          >
            {isFree
              ? "Create Free Account →"
              : `Continue to Payment · R${price.toLocaleString("en-ZA")}/mo →`}
          </Button>

          <p className="text-center text-xs text-text-muted pt-1">
            By signing up you agree to our{" "}
            <Link href="/terms" className="text-brand underline">Terms</Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-brand underline">Privacy Policy</Link>.
          </p>
        </form>
      </div>

      <p className="text-center text-sm text-text-muted mt-6">
        Already have an account?{" "}
        <Link
          href="/auth/login"
          className="text-brand hover:text-brand-light font-medium transition-colors"
        >
          Sign in
        </Link>
      </p>

      <div className="text-center mt-4">
        <Link
          href="/#pricing"
          className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-brand transition-colors"
        >
          <ArrowLeft size={12} />
          Compare all plans
        </Link>
      </div>
    </div>
  );
}

// ── Error message helper ───────────────────────────────────────

function getErrorMessage(code: string | null): string {
  switch (code) {
    case "expired":              return "Your subscription has expired. Renew below to restore full access.";
    case "payment_failed":       return "Payment could not be completed. Please try again.";
    case "verification_failed":  return "Payment verification failed. Contact support if you were charged.";
    case "activation_failed":    return "Subscription activation failed. Contact support@rosterapp.ai.";
    case "subscription_missing": return "We couldn't find your subscription record. Contact support.";
    default:                     return "";
  }
}
