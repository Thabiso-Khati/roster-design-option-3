"use client";

// ============================================================
// ROSTER — Shared TierCard + BillingToggle
// Used on both /pricing and the landing page pricing section
// ============================================================

import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";
import type { Tier } from "@/lib/constants";

// ── Billing toggle ────────────────────────────────────────────

export function BillingToggle({
  annual,
  onChange,
}: {
  annual: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="inline-flex items-center gap-3 bg-surface border border-border rounded-full px-1.5 py-1.5">
      <button
        onClick={() => onChange(false)}
        className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
          !annual
            ? "bg-surface-2 text-text-primary shadow"
            : "text-text-muted hover:text-text-primary"
        }`}
      >
        Monthly
      </button>
      <button
        onClick={() => onChange(true)}
        className={`px-5 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
          annual
            ? "bg-surface-2 text-text-primary shadow"
            : "text-text-muted hover:text-text-primary"
        }`}
      >
        Annual
        <span className="text-[10px] font-black uppercase tracking-wide bg-gold-gradient text-background px-2 py-0.5 rounded-full">
          2 months free
        </span>
      </button>
    </div>
  );
}

// ── Tier card ─────────────────────────────────────────────────

export function TierCard({ tier, annual }: { tier: Tier; annual: boolean }) {
  const price  = annual ? tier.annualMonthly : tier.monthlyPrice;
  const isFree = tier.id === "free";

  const href = isFree
    ? "/auth/signup"
    : `/auth/signup?plan=${tier.id}&billing=${annual ? "annual" : "monthly"}`;

  return (
    <div
      className={`relative flex flex-col rounded-2xl p-7 transition-all ${
        tier.highlight
          ? "border border-brand/50 bg-gradient-to-b from-brand/8 to-transparent gold-glow"
          : "glass-card border border-border"
      }`}
    >
      {/* Badge */}
      {tier.badge && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <span
            className={`text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full ${
              tier.highlight
                ? "bg-gold-gradient text-background"
                : "bg-surface-2 border border-border text-brand"
            }`}
          >
            {tier.badge}
          </span>
        </div>
      )}

      {/* Name + tagline */}
      <div className="mb-6">
        <p className={`text-xs font-black uppercase tracking-widest mb-1 ${tier.highlight ? "text-brand" : "text-text-muted"}`}>
          {tier.name}
        </p>
        <p className="text-xs text-text-muted leading-snug">{tier.tagline}</p>
      </div>

      {/* Price */}
      <div className="mb-2">
        {isFree ? (
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black text-text-primary">Free</span>
          </div>
        ) : (
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black text-text-primary">
              R{price.toLocaleString("en-ZA")}
            </span>
            <span className="text-text-muted text-sm">/mo</span>
          </div>
        )}
        {annual && !isFree && (
          <p className="text-xs text-text-muted mt-1">
            Billed R{tier.annualPrice.toLocaleString("en-ZA")}/yr · save R{tier.annualSavings.toLocaleString("en-ZA")}
          </p>
        )}
        {!annual && !isFree && (
          <p className="text-xs text-text-muted mt-1">Billed monthly · cancel anytime</p>
        )}
        {isFree && (
          <p className="text-xs text-text-muted mt-1">No card required</p>
        )}
      </div>

      {/* Limits summary chips */}
      {!isFree && (
        <div className="flex flex-wrap gap-2 my-4">
          <span className="text-[11px] font-semibold bg-surface-2 border border-border rounded-full px-3 py-1 text-text-muted">
            {tier.artists} artists
          </span>
          <span className="text-[11px] font-semibold bg-surface-2 border border-border rounded-full px-3 py-1 text-text-muted">
            {tier.seats} {tier.seats === 1 ? "seat" : "seats"}
          </span>
          <span className="text-[11px] font-semibold bg-surface-2 border border-border rounded-full px-3 py-1 text-text-muted">
            {tier.documents === -1 ? "∞ docs" : `${tier.documents} docs`}
          </span>
        </div>
      )}

      {/* CTA */}
      <Link href={href} className={`block mb-2 ${!tier.badge ? "mt-2" : ""}`}>
        <button
          className={`w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            tier.highlight
              ? "bg-gold-gradient text-background hover:brightness-110"
              : isFree
              ? "border border-border text-text-muted hover:text-text-primary hover:border-brand/40 hover:bg-brand/5"
              : "border border-brand/40 text-brand hover:bg-brand/10 hover:border-brand"
          }`}
        >
          {tier.cta}
          {tier.highlight && <ArrowRight size={14} />}
        </button>
      </Link>

      {/* Divider */}
      <div className="border-t border-border mb-5" />

      {/* Features */}
      <ul className="space-y-3 flex-1">
        {tier.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5">
            <CheckCircle2
              size={14}
              className={`flex-shrink-0 mt-0.5 ${tier.highlight ? "text-brand" : "text-text-muted"}`}
            />
            <span className="text-xs text-text-muted leading-snug">{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
