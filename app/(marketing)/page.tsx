"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Play, CheckCircle2, BookOpen, Video, Calendar, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MODULES, TIERS } from "@/lib/constants";
import { TierCard, BillingToggle } from "@/components/marketing/tier-card";
import { HeroAnimation } from "@/components/marketing/hero-animation";
import { ModuleCarousel } from "@/components/marketing/module-carousel";
import { ModuleIcon } from "@/components/icons/module-icons";

// ── PAYMENT METHOD LOGOS ──────────────────────────────────────
// Using SVG icon files from /public/logos/ for pixel-accurate brand rendering.

// All logos are inline SVG JSX — no external file loads, no CSP issues,
// no browser quirks. The outer svg element is the size anchor.

function MtnLogo() {
  return (
    <svg viewBox="0 0 80 80" width={40} height={40} className="rounded-lg select-none flex-shrink-0" aria-label="MTN MoMo">
      <rect width="80" height="80" rx="14" fill="#1B3769"/>
      <path d="M0 68 L80 68 L80 66 Q80 80 66 80 L14 80 Q0 80 0 66 Z" fill="#F5A000"/>
      <circle cx="40" cy="20" r="9" fill="#F5A000"/>
      <path d="M40 31 L18 56 L40 48 L62 56 Z" fill="#F5A000"/>
      <text x="40" y="63" fontFamily="Arial Black, Arial, sans-serif" fontWeight="900" fontSize="13" fill="#FFFFFF" textAnchor="middle" dominantBaseline="middle">MoMo</text>
      <text x="40" y="74" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="7" fill="#1B3769" textAnchor="middle" dominantBaseline="middle" letterSpacing="0.5">from MTN</text>
    </svg>
  );
}

function MPesaLogo() {
  return (
    <svg viewBox="0 0 218 80" width={72} height={40} className="rounded-md select-none flex-shrink-0" aria-label="M-Pesa">
      <rect width="218" height="80" fill="#ffffff" rx="6"/>
      <text x="7" y="62" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="56" fill="#4DB848" textLength="44" lengthAdjust="spacingAndGlyphs">m</text>
      <rect x="53" y="7" width="34" height="65" rx="7" fill="none" stroke="#8B9268" strokeWidth="3"/>
      <rect x="57" y="16" width="26" height="46" rx="2" fill="#f8f8f8"/>
      <path d="M 58 51 C 62 43 67 33 74 25 L 80 31 C 73 38 69 48 67 54 C 65 59 62 63 60 63 C 58 63 57 60 58 51 Z" fill="#D0021B"/>
      <text x="90" y="62" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="56" fill="#4DB848" textLength="120" lengthAdjust="spacingAndGlyphs">pesa</text>
    </svg>
  );
}

function AirtelLogo() {
  return (
    <svg viewBox="0 0 80 80" width={40} height={40} className="rounded-lg select-none flex-shrink-0" aria-label="Airtel Money">
      <rect width="80" height="80" rx="14" fill="#ED1C24"/>
      <path d="M 10 55 C 8 48 9 38 16 29 C 23 20 34 16 46 17 C 56 18 63 23 62 30 C 61 37 54 42 46 45 C 38 48 28 50 22 53 C 17 56 11 59 10 55 Z" fill="white"/>
      <path d="M 28 19 C 38 15 54 16 62 22 C 68 27 68 34 62 39 C 56 44 46 46 38 45 C 30 44 22 40 20 34 C 18 28 22 21 28 19 Z" fill="white" opacity="0.3"/>
      <text x="40" y="64" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="12" fill="white" textAnchor="middle" dominantBaseline="middle">airtel</text>
      <text x="40" y="74" fontFamily="Arial, sans-serif" fontWeight="300" fontSize="7.5" fill="rgba(255,255,255,0.9)" textAnchor="middle" dominantBaseline="middle" letterSpacing="1.5">money</text>
    </svg>
  );
}

function VisaLogo() {
  return (
    <svg viewBox="0 0 180 100" width={72} height={40} className="rounded-md select-none flex-shrink-0" aria-label="Visa">
      <rect width="180" height="100" rx="7" fill="#1565C0"/>
      <rect x="4" y="4" width="172" height="92" rx="4" fill="white"/>
      <rect x="4" y="4" width="172" height="27" rx="4" fill="#1565C0"/>
      <rect x="4" y="20" width="172" height="11" fill="#1565C0"/>
      <rect x="4" y="71" width="172" height="25" rx="4" fill="#F9A800"/>
      <rect x="4" y="71" width="172" height="9" fill="#F9A800"/>
      <text x="89" y="67" fontFamily="Times New Roman, Times, serif" fontWeight="900" fontSize="46" fill="#1565C0" textAnchor="middle">VISA</text>
      <text x="156" y="38" fontFamily="Arial, sans-serif" fontSize="11" fill="#1565C0" textAnchor="middle">®</text>
    </svg>
  );
}

function MastercardLogo() {
  return (
    <div
      aria-label="Mastercard"
      className="flex items-center justify-center rounded-md px-2 select-none"
      style={{ backgroundColor: "#252525", minWidth: 60, height: 40 }}
    >
      {/* Overlapping circles — shape-based, no text, always renders correctly */}
      <svg width="36" height="22" viewBox="0 0 36 22" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="13" cy="11" r="10" fill="#EB001B"/>
        <circle cx="23" cy="11" r="10" fill="#F79E1B"/>
        <path d="M18 3.13A10 10 0 0 1 21.9 11 10 10 0 0 1 18 18.87 10 10 0 0 1 14.1 11 10 10 0 0 1 18 3.13Z" fill="#FF5F00"/>
      </svg>
    </div>
  );
}

function BankTransferLogo() {
  return (
    <div
      aria-label="Bank EFT"
      className="flex items-center justify-center gap-2 rounded-md px-3 select-none"
      style={{ backgroundColor: "#1E293B", minWidth: 72, height: 40 }}
    >
      {/* Mini bar-chart icon */}
      <svg width="20" height="14" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="0"  y="8"  width="4" height="6" rx="1" fill="#64748B"/>
        <rect x="6"  y="5"  width="4" height="9" rx="1" fill="#64748B"/>
        <rect x="12" y="1"  width="4" height="13" rx="1" fill="#C9A84C"/>
      </svg>
      <span className="font-bold text-xs text-slate-400 whitespace-nowrap leading-none tracking-wider">
        EFT
      </span>
    </div>
  );
}

// ── HERO ──────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="hero-bg relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(201,168,76,1) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Single flex-col wrapper keeps everything stacked and centred */}
      <div className="relative z-10 flex flex-col items-center w-full">

        {/* Text + CTAs — constrained width */}
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight mb-6 text-gold">
            Grow Your Superstar Roster.
          </h1>
          <p className="text-lg sm:text-xl text-text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
            Everything you need to manage your artists like a professional;
            contracts, tour planning, release strategy, royalties, and direct
            access to the people who&apos;ve already done it.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
            <Link href="/auth/signup">
              <Button size="lg" className="w-full sm:w-auto">
                Start Today
                <ArrowRight size={18} className="ml-2" />
              </Button>
            </Link>
            <Link href="/#platform">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                <Play size={16} className="mr-2" />
                See What&apos;s Inside
              </Button>
            </Link>
          </div>
        </div>

        {/* Hero animation — matches platform section width */}
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6">
          <HeroAnimation />
        </div>

        {/* Payment methods + social proof */}
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 text-center mt-10">
          <div className="mb-10">
            <p className="text-xs text-text-muted uppercase tracking-widest mb-4 font-semibold">
              Pay the way you already do
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <MtnLogo />
              <MPesaLogo />
              <AirtelLogo />
              <VisaLogo />
              <MastercardLogo />
              <BankTransferLogo />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-text-muted">
            {[
              { icon: <BookOpen size={14} />, text: "50+ guides & templates" },
              { icon: <Video size={14} />, text: "Expert masterclasses" },
              { icon: <Calendar size={14} />, text: "1-on-1 expert sessions" },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-1.5">
                <span className="text-brand">{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}

// ── PLATFORM MODULES ──────────────────────────────────────────
const STRIP_MODULE_IDS = ["onboarding", "live", "royalties", "marketing"];

function PlatformSection() {
  const rest = MODULES.filter((m) => !STRIP_MODULE_IDS.includes(m.id));

  return (
    <section id="platform" className="py-28 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-xs font-semibold uppercase tracking-widest text-brand">
            The Toolkit
          </span>
          <h2 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight text-gold">
            One platform. Every part of the business.
          </h2>
          <p className="mt-4 text-text-muted max-w-lg mx-auto leading-relaxed">
            Stop stitching together spreadsheets and guesswork.
            ROSTER gives you the tools, templates, and structure to run your artists like a professional — from day one.
          </p>
        </div>

        {/* Animated module carousel — cycles all 15 modules, 4 at a time */}
        <ModuleCarousel />

        {/* "Also included" strip */}
        <div className="glass-card rounded-2xl px-6 py-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-4">
            Also included — {rest.length} more modules
          </p>
          <div className="flex flex-wrap gap-2">
            {rest.map((mod) => (
              <Link
                key={mod.id}
                href="/auth/signup"
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-text-muted hover:text-text-primary border border-border hover:border-border-secondary transition-all"
              >
                <ModuleIcon id={mod.id} size={13} style={{ color: mod.color }} />
                {mod.title}
              </Link>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-border flex items-center justify-between flex-wrap gap-3">
            <p className="text-sm text-text-muted">
              All 15 modules unlocked on every paid plan.
            </p>
            <Link href="/auth/signup">
              <Button size="sm" variant="outline">
                See full toolkit
                <ArrowRight size={13} className="ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}

// ── MASTERCLASSES ─────────────────────────────────────────────
function MasterclassSection() {
  const classes = [
    { title: "Negotiating Your First Record Deal", instructor: "Music Attorney", duration: "47 min", category: "Deals" },
    { title: "Tour Budgeting from Scratch", instructor: "Tour Manager", duration: "62 min", category: "Touring" },
    { title: "Growing an Artist Brand from Nothing", instructor: "Creative Director", duration: "38 min", category: "Marketing" },
    { title: "Where Your Royalties Actually Come From", instructor: "Music Rights Expert", duration: "55 min", category: "Money" },
  ];

  return (
    <section id="masterclasses" className="py-24 bg-surface">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <span className="text-xs font-semibold uppercase tracking-widest text-brand">
            Masterclasses
          </span>
          <h2 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight text-gold">
            Learn from people who actually did it.
          </h2>
          <p className="mt-4 text-text-muted max-w-xl mx-auto">
            Real sessions from working professionals. No theory, no fluff.
            Just what works, from people still in the game.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {classes.map((cls) => (
            <div
              key={cls.title}
              className="module-card bg-background rounded-2xl overflow-hidden border border-border group"
            >
              <div className="relative h-40 bg-surface-2 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-brand/20 border border-brand/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play size={20} className="text-brand ml-1" />
                </div>
                <div className="absolute top-3 left-3 bg-background/80 rounded-full px-2 py-0.5 text-xs font-medium text-brand">
                  {cls.category}
                </div>
                <div className="absolute bottom-3 right-3 bg-background/80 rounded-full px-2 py-0.5 text-xs text-text-muted">
                  {cls.duration}
                </div>
              </div>
              <div className="p-4">
                <h4 className="font-semibold text-sm text-text-primary leading-snug mb-1">
                  {cls.title}
                </h4>
                <p className="text-xs text-text-muted">{cls.instructor}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <p className="text-text-muted text-sm mb-4">
            Full library unlocked with your subscription.
          </p>
          <Link href="/auth/signup">
            <Button variant="outline">
              Watch the Classes
              <ArrowRight size={15} className="ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── EXPERT BOOKING ────────────────────────────────────────────
function ExpertSection() {
  const experts = [
    { name: "Music Attorney", specialty: "Contracts & Deals", sessions: "120+ sessions" },
    { name: "Tour Manager", specialty: "Live Touring", sessions: "80+ sessions" },
    { name: "Marketing Director", specialty: "Digital & Radio", sessions: "95+ sessions" },
  ];

  return (
    <section id="experts" className="py-24 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-xs font-semibold uppercase tracking-widest text-brand">
            Book an Expert
          </span>
          <h2 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight text-gold">
            Talk to someone who can actually help.
          </h2>
          <p className="mt-4 text-text-muted max-w-xl mx-auto">
            Book a 1-on-1 with a working industry professional. Ask the
            questions you can&apos;t Google. Get answers you can actually use.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          {experts.map((exp) => (
            <div key={exp.name} className="module-card glass-card rounded-2xl p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-surface-2 border-2 border-brand/30 mx-auto mb-4 flex items-center justify-center text-2xl">
                👤
              </div>
              <h4 className="font-bold text-text-primary">{exp.name}</h4>
              <p className="text-sm text-brand mt-1">{exp.specialty}</p>
              <p className="text-xs text-text-muted mt-3 bg-surface rounded-full px-3 py-1 inline-block">
                {exp.sessions}
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                {["30 min", "60 min", "120 min"].map((d) => (
                  <span key={d} className="text-xs border border-border rounded-full px-2.5 py-0.5 text-text-muted">
                    {d}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* WhatsApp hint */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-sm text-text-muted bg-surface border border-border rounded-full px-5 py-2.5">
            <span className="text-base">💬</span>
            Sessions confirmed by WhatsApp. No email back-and-forth
          </div>
        </div>
      </div>
    </section>
  );
}

// ── PRICING ───────────────────────────────────────────────────
function PricingSection() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="py-24 bg-surface">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <span className="text-xs font-semibold uppercase tracking-widest text-brand">
            Pricing
          </span>
          <h2 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight text-gold">
            Pricing that grows with you.
          </h2>
          <p className="mt-4 text-text-muted">
            Start free. Upgrade when your roster does. Cancel anytime.
          </p>
          <div className="mt-8">
            <BillingToggle annual={annual} onChange={setAnnual} />
          </div>
          {annual && (
            <p className="text-xs text-success mt-3 flex items-center justify-center gap-1.5">
              <Zap size={11} />
              Annual billing saves you up to R9,998/year
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-4">
          {TIERS.map((tier) => (
            <TierCard key={tier.id} tier={tier} annual={annual} />
          ))}
        </div>

        <p className="text-center text-xs text-text-muted mt-4">
          Enterprise billing available by invoice.{" "}
          <a href="mailto:support@rosterapp.ai" className="text-brand underline">
            Contact us
          </a>{" "}
          to discuss your roster.
        </p>
      </div>
    </section>
  );
}

// ── PAGE ──────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <>
      <Hero />
      <PlatformSection />
      <MasterclassSection />
      <ExpertSection />
      <PricingSection />
    </>
  );
}
