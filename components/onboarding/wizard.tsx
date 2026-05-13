"use client";

// ============================================================
// ROSTER — Onboarding Wizard
// ------------------------------------------------------------
// 5-step first-run experience:
//   1. Welcome + role selection
//   2. Add your first artist
//   3. Connect Spotify (education + optional link)
//   4. Choose plan (or confirm existing subscription)
//   5. Done — "Your ROSTER is ready"
// ============================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  ChevronLeft,
  Users,
  Music2,
  Radio,
  Building2,
  Mic2,
  CheckCircle2,
  Loader2,
  Sparkles,
  ArrowRight,
  SkipForward,
} from "lucide-react";
import { TIERS } from "@/lib/constants";
import type { TierId } from "@/lib/constants";
import { GROUPED_COUNTRIES } from "@/lib/locale";

// ─── Types ───────────────────────────────────────────────────

type Role = "manager" | "artist" | "label" | "agency";

interface WizardState {
  role: Role | null;
  artistName: string;
  artistGenre: string;
  artistCountry: string;
  artistCreatedId: string | null;
  spotifyId: string;
  selectedPlan: "free" | "monthly" | "annual";
}

interface WizardProps {
  userName: string;
  currentTier: TierId;
  userEmail: string;
  userId: string;
}

// ─── Role definitions ─────────────────────────────────────────

const ROLES: { id: Role; label: string; icon: React.FC<{ size?: number; className?: string }>; description: string }[] = [
  {
    id: "manager",
    label: "Manager",
    icon: Users,
    description: "I manage artists and build their careers",
  },
  {
    id: "artist",
    label: "Artist",
    icon: Mic2,
    description: "I'm an artist managing my own career",
  },
  {
    id: "label",
    label: "Label",
    icon: Music2,
    description: "I run a record label or imprint",
  },
  {
    id: "agency",
    label: "Agency",
    icon: Building2,
    description: "I run a management company or agency",
  },
];

// ─── Progress bar ─────────────────────────────────────────────

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
            i < step ? "bg-brand" : i === step - 1 ? "bg-brand" : "bg-white/10"
          }`}
        />
      ))}
    </div>
  );
}

// ─── Step 1: Welcome + Role ───────────────────────────────────

function StepWelcome({
  name,
  role,
  onRoleSelect,
}: {
  name: string;
  role: Role | null;
  onRoleSelect: (r: Role) => void;
}) {
  return (
    <div className="animate-fade-in">
      <div className="mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-brand">
          Step 1 of 5
        </span>
      </div>
      <h1 className="text-2xl font-black text-text-primary mb-2">
        Welcome to ROSTER{name ? `, ${name.split(" ")[0]}` : ""}! 👋
      </h1>
      <p className="text-sm text-text-muted mb-8 leading-relaxed">
        The all-in-one platform for music management. Let's get you set up in
        about 2 minutes. First — what's your role?
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ROLES.map((r) => {
          const Icon = r.icon;
          const selected = role === r.id;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => onRoleSelect(r.id)}
              className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                selected
                  ? "border-brand bg-brand/10 ring-1 ring-brand/30"
                  : "border-white/10 bg-surface/40 hover:border-white/20 hover:bg-surface/60"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  selected ? "bg-brand/20 text-brand" : "bg-white/5 text-text-muted"
                }`}
              >
                <Icon size={18} />
              </div>
              <div>
                <p
                  className={`text-sm font-semibold mb-0.5 ${
                    selected ? "text-brand" : "text-text-primary"
                  }`}
                >
                  {r.label}
                </p>
                <p className="text-xs text-text-muted leading-snug">
                  {r.description}
                </p>
              </div>
              {selected && (
                <CheckCircle2
                  size={16}
                  className="text-brand ml-auto flex-shrink-0 mt-0.5"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 2: Add First Artist ─────────────────────────────────

function StepAddArtist({
  state,
  onChange,
  adding,
  added,
}: {
  state: WizardState;
  onChange: (patch: Partial<WizardState>) => void;
  adding: boolean;
  added: boolean;
}) {
  return (
    <div className="animate-fade-in">
      <div className="mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-brand">
          Step 2 of 5
        </span>
      </div>
      <h2 className="text-2xl font-black text-text-primary mb-2">
        Add your first artist
      </h2>
      <p className="text-sm text-text-muted mb-6 leading-relaxed">
        Your Roster is where you track every artist's stats, trends, and
        momentum. Start with one — you can always add more later.
      </p>

      {added ? (
        <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
          <CheckCircle2 size={20} className="text-emerald-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-300">
              {state.artistName} added to your ROSTER!
            </p>
            <p className="text-xs text-emerald-400/70 mt-0.5">
              You can update their stats and link streaming platforms from the
              dashboard.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="text-[11px] uppercase tracking-wide text-text-muted font-medium block mb-1.5">
              Artist name <span className="text-brand">*</span>
            </label>
            <input
              autoFocus
              value={state.artistName}
              onChange={(e) => onChange({ artistName: e.target.value })}
              placeholder="e.g. De Mthuda"
              className="w-full bg-surface/60 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted/50 focus:border-brand outline-none"
              disabled={adding}
            />
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wide text-text-muted font-medium block mb-1.5">
              Genre
            </label>
            <input
              value={state.artistGenre}
              onChange={(e) => onChange({ artistGenre: e.target.value })}
              placeholder="e.g. Amapiano, Afrobeats, Hip-Hop"
              className="w-full bg-surface/60 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted/50 focus:border-brand outline-none"
              disabled={adding}
            />
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wide text-text-muted font-medium block mb-1.5">
              Country
            </label>
            <select
              value={state.artistCountry}
              onChange={(e) => onChange({ artistCountry: e.target.value })}
              className="w-full bg-surface/60 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-text-primary focus:border-brand outline-none"
              disabled={adding}
            >
              {GROUPED_COUNTRIES.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.countries.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step 3: Connect Spotify ──────────────────────────────────

function StepSpotify({
  state,
  onChange,
  artistWasAdded,
}: {
  state: WizardState;
  onChange: (patch: Partial<WizardState>) => void;
  artistWasAdded: boolean;
}) {
  return (
    <div className="animate-fade-in">
      <div className="mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-brand">
          Step 3 of 5
        </span>
      </div>
      <h2 className="text-2xl font-black text-text-primary mb-2">
        Connect Spotify
      </h2>
      <p className="text-sm text-text-muted mb-6 leading-relaxed">
        ROSTER can automatically pull monthly listeners, followers, and
        popularity scores from Spotify — keeping your stats fresh without
        manual entry.
      </p>

      {/* How it works */}
      <div className="bg-surface/40 border border-white/5 rounded-xl p-4 mb-6 space-y-3">
        {[
          {
            icon: Radio,
            title: "Auto-sync stats",
            body: "Nightly cron pulls fresh Spotify data for every linked artist.",
          },
          {
            icon: Sparkles,
            title: "Trend & momentum scoring",
            body: "ROSTER scores reach + momentum the moment new data arrives.",
          },
          {
            icon: CheckCircle2,
            title: "Always accurate",
            body: "Manual entry still works — Spotify just saves you the effort.",
          },
        ].map(({ icon: Icon, title, body }) => (
          <div key={title} className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-brand/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Icon size={13} className="text-brand" />
            </div>
            <div>
              <p className="text-xs font-semibold text-text-primary">{title}</p>
              <p className="text-[11px] text-text-muted leading-snug mt-0.5">
                {body}
              </p>
            </div>
          </div>
        ))}
      </div>

      {artistWasAdded && (
        <div>
          <label className="text-[11px] uppercase tracking-wide text-text-muted font-medium block mb-1.5">
            Spotify artist URL or ID for{" "}
            <span className="text-text-primary">{state.artistName}</span>
            <span className="text-text-muted/60 ml-1">(optional)</span>
          </label>
          <input
            autoFocus
            value={state.spotifyId}
            onChange={(e) => onChange({ spotifyId: e.target.value })}
            placeholder="https://open.spotify.com/artist/… or artist ID"
            className="w-full bg-surface/60 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted/50 focus:border-brand outline-none"
          />
          <p className="text-[10px] text-text-muted/60 mt-1 leading-relaxed">
            Find it in Spotify → Share → Copy Link. You can also set this later
            in Update Stats → the artist's tab.
          </p>
        </div>
      )}

      {!artistWasAdded && (
        <p className="text-xs text-text-muted/70 italic">
          Add an artist in the previous step to link their Spotify here. You can
          always connect it later from the dashboard.
        </p>
      )}
    </div>
  );
}

// ─── Step 4: Choose Plan ──────────────────────────────────────

function StepPlan({
  currentTier,
  selected,
  onSelect,
}: {
  currentTier: TierId;
  selected: "free" | "monthly" | "annual";
  onSelect: (p: "free" | "monthly" | "annual") => void;
}) {
  const isPaid = currentTier !== "free";
  const displayTiers = TIERS.filter((t) =>
    ["free", "pro"].includes(t.id)
  );

  if (isPaid) {
    const currentTierDef = TIERS.find((t) => t.id === currentTier);
    return (
      <div className="animate-fade-in">
        <div className="mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand">
            Step 4 of 5
          </span>
        </div>
        <h2 className="text-2xl font-black text-text-primary mb-2">
          Your plan
        </h2>
        <p className="text-sm text-text-muted mb-6 leading-relaxed">
          You're already set up — here's what's included.
        </p>
        <div className="border border-brand/30 bg-brand/5 rounded-xl p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-lg font-black text-brand">
                {currentTierDef?.name ?? currentTier}
              </p>
              <p className="text-xs text-text-muted mt-0.5">
                {currentTierDef?.tagline}
              </p>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider bg-brand/20 text-brand px-2 py-1 rounded-full">
              Active
            </span>
          </div>
          <ul className="space-y-1.5">
            {(currentTierDef?.features ?? []).map((f) => (
              <li key={f} className="flex items-center gap-2 text-xs text-text-muted">
                <CheckCircle2 size={11} className="text-brand flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-brand">
          Step 4 of 5
        </span>
      </div>
      <h2 className="text-2xl font-black text-text-primary mb-2">
        Choose your plan
      </h2>
      <p className="text-sm text-text-muted mb-6 leading-relaxed">
        Start free and upgrade anytime. Pro unlocks your full ROSTER.
      </p>

      <div className="space-y-3">
        {displayTiers.map((tier) => {
          const isMonthlySelected = tier.id === "pro" && selected === "monthly";
          const isAnnualSelected = tier.id === "pro" && selected === "annual";
          const isFreeSelected = tier.id === "free" && selected === "free";
          const isSelected = isFreeSelected || isMonthlySelected || isAnnualSelected;

          return (
            <div
              key={tier.id}
              className={`rounded-xl border p-4 transition-all ${
                isSelected
                  ? "border-brand bg-brand/5 ring-1 ring-brand/20"
                  : "border-white/10 bg-surface/40"
              } ${tier.highlight ? "relative" : ""}`}
            >
              {tier.badge && (
                <span className="absolute -top-2.5 left-4 text-[10px] font-bold uppercase tracking-wider bg-brand text-background px-2 py-0.5 rounded-full">
                  {tier.badge}
                </span>
              )}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-text-primary">{tier.name}</p>
                  <p className="text-xs text-text-muted mt-0.5">{tier.tagline}</p>
                </div>
                {tier.id === "free" ? (
                  <p className="text-lg font-black text-text-primary">Free</p>
                ) : (
                  <div className="text-right">
                    <p className="text-lg font-black text-text-primary">
                      R{tier.monthlyPrice}
                      <span className="text-xs text-text-muted font-normal">
                        /mo
                      </span>
                    </p>
                    <p className="text-[10px] text-text-muted">
                      or R{tier.annualMonthly}/mo billed annually
                    </p>
                  </div>
                )}
              </div>

              {tier.id === "free" ? (
                <button
                  type="button"
                  onClick={() => onSelect("free")}
                  className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                    isFreeSelected
                      ? "bg-brand text-background"
                      : "bg-white/5 text-text-muted hover:bg-white/10 hover:text-text-primary"
                  }`}
                >
                  {isFreeSelected ? "Selected" : "Start Free"}
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onSelect("monthly")}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isMonthlySelected
                        ? "bg-brand text-background"
                        : "bg-white/5 text-text-muted hover:bg-white/10 hover:text-text-primary"
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelect("annual")}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isAnnualSelected
                        ? "bg-brand text-background"
                        : "bg-white/5 text-text-muted hover:bg-white/10 hover:text-text-primary"
                    }`}
                  >
                    Annual
                    <span className="ml-1 text-[9px] text-emerald-400">
                      Save 17%
                    </span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-text-muted/60 mt-3 text-center">
        Paid plans billed via Paystack. Cancel anytime.
      </p>
    </div>
  );
}

// ─── Step 5: Done ─────────────────────────────────────────────

function StepDone({ name, role }: { name: string; role: Role | null }) {
  const roleLabel = ROLES.find((r) => r.id === role)?.label ?? "manager";

  return (
    <div className="animate-fade-in text-center">
      <div className="mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-brand">
          Step 5 of 5
        </span>
      </div>

      <div className="w-16 h-16 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center mx-auto mb-5">
        <Sparkles size={28} className="text-brand" />
      </div>

      <h2 className="text-2xl font-black text-text-primary mb-2">
        Your ROSTER is ready!
      </h2>
      <p className="text-sm text-text-muted mb-8 leading-relaxed">
        Welcome{name ? `, ${name.split(" ")[0]}` : ""}. You're set up as a{" "}
        <span className="text-text-primary font-medium">{roleLabel}</span>.
        Here's what you can do first:
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left mb-8">
        {[
          {
            icon: Users,
            title: "Build your roster",
            body: "Add artists and track their stats, trends, and momentum.",
          },
          {
            icon: Music2,
            title: "Manage releases",
            body: "Log upcoming drops, track rollout tasks, and stay ahead.",
          },
          {
            icon: Sparkles,
            title: "Ask ROSTER AI",
            body: "Get strategy, captions, and insights powered by your data.",
          },
        ].map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="bg-surface/40 border border-white/5 rounded-xl p-4"
          >
            <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center mb-3">
              <Icon size={15} className="text-brand" />
            </div>
            <p className="text-xs font-semibold text-text-primary mb-1">
              {title}
            </p>
            <p className="text-[11px] text-text-muted leading-snug">{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Wizard ──────────────────────────────────────────────

export function OnboardingWizard({
  userName,
  currentTier,
  userEmail,
  userId,
}: WizardProps) {
  const router = useRouter();
  const TOTAL_STEPS = 5;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [state, setState] = useState<WizardState>({
    role: null,
    artistName: "",
    artistGenre: "",
    artistCountry: "South Africa",
    artistCreatedId: null,
    spotifyId: "",
    selectedPlan: currentTier !== "free" ? "monthly" : "free",
  });

  // Track whether an artist was actually created in step 2
  const [artistAdded, setArtistAdded] = useState(false);
  const [addingArtist, setAddingArtist] = useState(false);

  function patch(update: Partial<WizardState>) {
    setState((prev) => ({ ...prev, ...update }));
    if (error) setError(null);
  }

  // ── Validation per step ─────────────────────────────────────

  function canProceed(): boolean {
    if (step === 1) return state.role !== null;
    return true; // steps 2–4 are all optional / skippable
  }

  // ── Step 2: add artist to DB ────────────────────────────────

  async function handleAddArtist(): Promise<boolean> {
    if (!state.artistName.trim()) return true; // nothing entered → skip
    if (artistAdded) return true; // already done

    setAddingArtist(true);
    try {
      const res = await fetch("/api/artists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          manualName: state.artistName.trim(),
          manualGenre: state.artistGenre.trim() || undefined,
          country: state.artistCountry,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to add artist — you can add them from the dashboard.");
        return false;
      }
      patch({ artistCreatedId: json.id ?? null });
      setArtistAdded(true);
      return true;
    } catch {
      // Non-blocking: log and continue
      setError("Artist could not be saved — you can add them from the dashboard.");
      return false;
    } finally {
      setAddingArtist(false);
    }
  }

  // ── Step 3: update artist's Spotify ID ─────────────────────

  async function handleLinkSpotify() {
    if (!state.artistCreatedId || !state.spotifyId.trim()) return;
    // Fire-and-forget — not blocking the wizard
    fetch(`/api/artists/${state.artistCreatedId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spotify_url: state.spotifyId.trim() }),
    }).catch(() => {/* non-fatal */});
  }

  // ── Final: mark onboarding complete ────────────────────────

  async function handleComplete() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: state.role }),
      });
      if (!res.ok) {
        const json = await res.json();
        setError(json.error ?? "Something went wrong. Please try again.");
        return;
      }

      // If Pro/Agency selected and not already subscribed → Paystack
      if (
        currentTier === "free" &&
        (state.selectedPlan === "monthly" || state.selectedPlan === "annual")
      ) {
        const initRes = await fetch("/api/paystack/initialize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: userEmail,
            name: userName,
            plan: state.selectedPlan,
            userId,
          }),
        });
        const initJson = await initRes.json();
        if (initRes.ok && initJson.paymentLink) {
          window.location.href = initJson.paymentLink;
          return;
        }
        // Payment init failed — still go to dashboard (non-fatal)
      }

      window.location.href = "/dashboard";
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Next handler ────────────────────────────────────────────

  async function handleNext() {
    setError(null);

    if (step === 2) {
      const ok = await handleAddArtist();
      if (!ok) return; // artist add failed — don't advance
    }

    if (step === 3) {
      handleLinkSpotify(); // fire-and-forget
    }

    if (step === TOTAL_STEPS) {
      await handleComplete();
      return;
    }

    setStep((s) => s + 1);
  }

  function handleBack() {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  }

  function handleSkip() {
    setError(null);
    if (step === TOTAL_STEPS) {
      handleComplete();
      return;
    }
    setStep((s) => s + 1);
  }

  // ── Render ──────────────────────────────────────────────────

  const isLastStep = step === TOTAL_STEPS;
  const isPaid = currentTier !== "free";

  const nextLabel = isLastStep
    ? loading
      ? "Setting up…"
      : state.selectedPlan !== "free" && !isPaid
        ? "Continue to Payment →"
        : "Go to Dashboard →"
    : step === 2 && !state.artistName.trim()
      ? "Skip"
      : "Continue";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <p className="text-xl font-black tracking-tight text-text-primary">
            ROSTER
          </p>
        </div>

        {/* Card */}
        <div className="glass-card rounded-2xl p-6 sm:p-8">
          <ProgressBar step={step} total={TOTAL_STEPS} />

          {/* Step content */}
          {step === 1 && (
            <StepWelcome
              name={userName}
              role={state.role}
              onRoleSelect={(r) => patch({ role: r })}
            />
          )}
          {step === 2 && (
            <StepAddArtist
              state={state}
              onChange={patch}
              adding={addingArtist}
              added={artistAdded}
            />
          )}
          {step === 3 && (
            <StepSpotify
              state={state}
              onChange={patch}
              artistWasAdded={artistAdded}
            />
          )}
          {step === 4 && (
            <StepPlan
              currentTier={currentTier}
              selected={state.selectedPlan}
              onSelect={(p) => patch({ selectedPlan: p })}
            />
          )}
          {step === 5 && (
            <StepDone name={userName} role={state.role} />
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 bg-error/10 border border-error/20 rounded-lg px-3 py-2 text-xs text-error">
              {error}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
            {/* Back */}
            <button
              type="button"
              onClick={handleBack}
              disabled={step === 1 || loading}
              className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors disabled:opacity-0 disabled:pointer-events-none"
            >
              <ChevronLeft size={16} />
              Back
            </button>

            <div className="flex items-center gap-2">
              {/* Skip — available on steps 2, 3 when there's content to skip */}
              {(step === 2 || step === 3) && !isLastStep && (
                <button
                  type="button"
                  onClick={handleSkip}
                  disabled={loading}
                  className="flex items-center gap-1 text-xs text-text-muted hover:text-text-primary transition-colors"
                >
                  <SkipForward size={12} />
                  Skip
                </button>
              )}

              {/* Next / Finish */}
              <button
                type="button"
                onClick={handleNext}
                disabled={!canProceed() || loading || addingArtist}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-background bg-brand hover:bg-brand-light transition-colors rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {(loading || addingArtist) && (
                  <Loader2 size={14} className="animate-spin" />
                )}
                {nextLabel}
                {!loading && !addingArtist && !isLastStep && (
                  <ChevronRight size={15} />
                )}
                {!loading && !addingArtist && isLastStep && (
                  <ArrowRight size={15} />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-[11px] text-text-muted/50 mt-4">
          You can change anything from Settings at any time.
        </p>
      </div>
    </div>
  );
}
