"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ArrowRight, ClipboardList, FileText, Mic } from "lucide-react";
import { useLocale } from "@/context/locale-context";
import { getCountryResources } from "@/lib/country-resources";

const MODULE_COLOR = "#C9A84C";

type Tab = "checklist" | "agreement" | "team" | "ar" | "performance";

const TABS: { id: Tab; label: string }[] = [
  { id: "checklist",   label: "Onboarding Checklist" },
  { id: "agreement",   label: "Management Agreement" },
  { id: "team",        label: "Team & Service Providers" },
  { id: "ar",          label: "A&R Intake" },
  { id: "performance", label: "Performance & Goals" },
];

/** Clause count by country — dedicated agreements have their own clause sets. */
const CLAUSE_COUNT: Record<string, string> = {
  Algeria: "21 clauses + First Schedule",
  Nigeria: "21 clauses + First Schedule",
  Kenya: "21 clauses + First Schedule",
  Ghana: "21 clauses + First Schedule",
  Tanzania: "21 clauses + First Schedule",
  Uganda: "21 clauses + First Schedule",
  Zimbabwe: "21 clauses + First Schedule",
  Ethiopia: "21 clauses + First Schedule",
  Egypt: "21 clauses + First Schedule",
  Morocco: "21 clauses + First Schedule",
  "Côte d'Ivoire": "21 clauses + First Schedule",
  Cameroon: "21 clauses + First Schedule",
  Angola: "21 clauses + First Schedule",
  Senegal: "21 clauses + First Schedule",
};
const DEFAULT_CLAUSE_COUNT = "13 clauses + First Schedule";

/** Countries with fully dedicated agreement files (not the SA base + loc()). */
const DEDICATED_AGREEMENT_COUNTRIES = new Set(["Algeria", "Nigeria", "Kenya", "Ghana", "Tanzania", "Uganda", "Zimbabwe", "Ethiopia", "Egypt", "Morocco", "Côte d'Ivoire", "Cameroon", "Angola", "Senegal"]);

export default function StartupModulePage() {
  const [tab, setTab] = useState<Tab>("checklist");
  const { country } = useLocale();
  const res = getCountryResources(country);
  const clauseCount = CLAUSE_COUNT[country] ?? DEFAULT_CLAUSE_COUNT;
  const isAlgeria = country === "Algeria";
  const isKenya = country === "Kenya";
  const isGhana = country === "Ghana";
  const isTanzania = country === "Tanzania";
  const isUganda = country === "Uganda";
  const isZimbabwe = country === "Zimbabwe";
  const isEthiopia = country === "Ethiopia";
  const isEgypt = country === "Egypt";
  const isMorocco = country === "Morocco";
  const isCoteDIvoire = country === "Côte d'Ivoire";
  const isCameroon = country === "Cameroon";
  const isAngola = country === "Angola";
  const isSenegal = country === "Senegal";
  const isDedicated = DEDICATED_AGREEMENT_COUNTRIES.has(country);

  return (
    <div className="animate-fade-in max-w-4xl">
      <Link href="/dashboard/library" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary mb-6 transition-colors">
        <ChevronLeft size={15}/>Back to Toolkit
      </Link>

      {/* Module header */}
      <div className="glass-card rounded-2xl p-6 mb-7" style={{ borderColor: "#C9A84C25" }}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#C9A84C15" }}>
            <Mic size={26} style={{ color: MODULE_COLOR }}/>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: MODULE_COLOR }}>Your First Move</p>
            <h1 className="text-2xl font-black text-text-primary">Onboarding New Artists</h1>
            <p className="text-sm text-text-muted mt-0.5">The agreement, the checklist, and the full process, done right from day one.</p>
            <div className="flex items-center gap-4 mt-3 text-xs text-text-muted flex-wrap">
              <span style={{ color: MODULE_COLOR }} className="font-semibold">2 forms & templates</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs — horizontally scrollable on mobile */}
      <div className="mb-8 border-b border-border overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-0 min-w-max">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 -mb-px whitespace-nowrap ${
                tab === t.id
                  ? "border-brand text-brand"
                  : "border-transparent text-text-muted hover:text-text-primary"
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Checklist tab ── */}
      {tab === "checklist" && (
        <div>
          <p className="text-sm text-text-muted mb-5">Your complete artist onboarding system, 9 sections covering every step from first meeting to first release. Click to work through it here on ROSTER.</p>
          <Link href="/dashboard/library/startup/checklist"
            className="glass-card rounded-xl p-5 flex items-center gap-4 group hover:border-brand/30 transition-all block">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#C9A84C15" }}>
              <ClipboardList size={22} style={{ color: MODULE_COLOR }}/>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-text-primary group-hover:text-brand transition-colors mb-0.5">Artist Onboarding Checklist</p>
              <p className="text-xs text-text-muted leading-relaxed">Assessment · Digital Setup · Legal & Rights · Assets · Financials · Release Prep · Team Records · Calendar · First 30 Days</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ color: MODULE_COLOR, backgroundColor: `${MODULE_COLOR}15` }}>2026 Edition</span>
                <span className="text-xs text-text-muted">9 sections · 80+ items</span>
              </div>
            </div>
            <ArrowRight size={18} className="text-text-muted group-hover:text-brand group-hover:translate-x-0.5 transition-all flex-shrink-0"/>
          </Link>
        </div>
      )}

      {/* ── Agreement tab ── */}
      {tab === "agreement" && (
        <div>
          <p className="text-sm text-text-muted mb-5">
            {isAlgeria
              ? "A full exclusive management agreement drafted under Algerian law (Law No. 03-05 of July 19, 2003), 21 clauses covering every aspect of the manager-artist relationship. Read it here on ROSTER."
              : country === "Nigeria"
              ? "A full exclusive management agreement drafted under the Nigerian Copyright Act 2022, 21 clauses covering every aspect of the manager-artist relationship. Read it here on ROSTER."
              : isKenya
              ? "A full exclusive management agreement drafted under the Kenyan Copyright Act (Cap 130) of 2001, 21 clauses covering every aspect of the manager-artist relationship. Read it here on ROSTER."
              : isGhana
              ? "A full exclusive management agreement drafted under the Ghana Copyright Act 2005 (Act 690), 21 clauses covering every aspect of the manager-artist relationship. Read it here on ROSTER."
              : isTanzania
              ? "A full exclusive management agreement drafted under the Tanzania Copyright and Neighbouring Rights Act 1999, 21 clauses covering every aspect of the manager-artist relationship. Read it here on ROSTER."
              : isUganda
              ? "A full exclusive management agreement drafted under the Uganda Copyright and Neighbouring Rights Act 2006, 21 clauses covering every aspect of the manager-artist relationship. Read it here on ROSTER."
              : isZimbabwe
              ? "A full exclusive management agreement drafted under the Zimbabwe Copyright and Neighbouring Rights Act (Chapter 26:05), 21 clauses covering every aspect of the manager-artist relationship. Read it here on ROSTER."
              : isEthiopia
              ? "A full exclusive management agreement drafted under the Ethiopian Copyright and Neighbouring Rights Protection Proclamation No. 410/2004, 21 clauses covering every aspect of the manager-artist relationship. Read it here on ROSTER."
              : isEgypt
              ? "A full exclusive management agreement drafted under Egypt's Law No. 82 of 2002 on the Protection of Intellectual Property Rights, 21 clauses covering every aspect of the manager-artist relationship. Read it here on ROSTER."
              : isMorocco
              ? "A full exclusive management agreement drafted under Morocco's Law No. 2-00 on Copyright and Related Rights (2000, amended 2006), 21 clauses covering every aspect of the manager-artist relationship. Read it here on ROSTER."
              : isCoteDIvoire
              ? "A full exclusive management agreement drafted under Côte d'Ivoire's Law No. 2016-555 on Literary and Artistic Property, 21 clauses covering every aspect of the manager-artist relationship. Read it here on ROSTER."
              : isCameroon
              ? "A full exclusive management agreement drafted under Cameroon's Law No. 2000/011 of December 19, 2000 on Copyright and Neighbouring Rights, 21 clauses covering every aspect of the manager-artist relationship. Read it here on ROSTER."
              : isAngola
              ? "A full exclusive management agreement drafted under Angola's Law No. 15/90 on Copyright (as revised), 21 clauses covering every aspect of the manager-artist relationship. Read it here on ROSTER."
              : isSenegal
              ? "A full exclusive management agreement drafted under Senegal's Law No. 2008-09 of January 25, 2008 on Copyright and Related Rights, 21 clauses covering every aspect of the manager-artist relationship. Read it here on ROSTER."
              : `A full exclusive management agreement covering every aspect of the manager-artist relationship, localised for ${country}. Read it here on ROSTER.`
            }
          </p>
          <Link href="/dashboard/library/startup/agreement"
            className="glass-card rounded-xl p-5 flex items-center gap-4 group hover:border-brand/30 transition-all block">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#C9A84C15" }}>
              <FileText size={22} style={{ color: MODULE_COLOR }}/>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-text-primary group-hover:text-brand transition-colors mb-0.5">Exclusive Artist Management Agreement</p>
              <p className="text-xs text-text-muted leading-relaxed">
                {isAlgeria
                  ? "Definitions · Appointment · Rights · Fees · Digital Platforms · International · Term · Termination · First Schedule"
                  : "Appointment · Rights · Fees · Digital Platforms · International Operations · Term · Termination · First Schedule"
                }
              </p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ color: MODULE_COLOR, backgroundColor: `${MODULE_COLOR}15` }}>
                  {res.flag} {country} · 2026
                </span>
                <span className="text-xs text-text-muted">{clauseCount}</span>
              </div>
            </div>
            <ArrowRight size={18} className="text-text-muted group-hover:text-brand group-hover:translate-x-0.5 transition-all flex-shrink-0"/>
          </Link>

          <div className="mt-5 glass-card rounded-xl p-4 flex items-start gap-3" style={{ borderColor: "rgba(201,168,76,0.15)", backgroundColor: "rgba(201,168,76,0.04)" }}>
            <span className="text-base flex-shrink-0">⚠️</span>
            <p className="text-xs text-text-muted leading-relaxed">
              <span className="font-semibold text-brand">Legal note.</span> This is a template for reference and education. Before signing any management agreement, both parties should seek independent legal advice from a qualified {res.lawyerNote ?? `${country} entertainment lawyer`}.
            </p>
          </div>
        </div>
      )}

      {/* ── Team & Service Providers tab ── */}
      {tab === "team" && (
        <div>
          <p className="text-sm text-text-muted mb-5">The deal-stack for the rest of the artist's professional team — booking agents, service providers, contractors. SA + NG governing law options.</p>
          <div className="space-y-3">
            {[
              { href: "/dashboard/library/startup/booking-agency-agreement", title: "Booking Agency Agreement", desc: "Exclusive (or non-exclusive) appointment of a booking agent. Commission, sunset, MFN, conflicts.", tag: "Contract" },
              { href: "/dashboard/library/startup/service-provider-onboarding", title: "Service Provider Onboarding", desc: "Universal intake form — passport, banking, tax, insurance, NDA, contract reference. Use for every supplier.", tag: "Form" },
              { href: "/dashboard/library/startup/independent-contractor-agreement", title: "Independent Contractor Agreement", desc: "Universal contractor template — producers, photographers, designers, drivers, security.", tag: "Contract" },
            ].map((item) => (
              <Link key={item.href} href={item.href} className="glass-card rounded-xl p-5 flex items-center gap-4 group hover:border-brand/30 transition-all">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#C9A84C15" }}>
                  <FileText size={22} style={{ color: MODULE_COLOR }}/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-text-primary group-hover:text-brand transition-colors mb-0.5">{item.title}</p>
                  <p className="text-xs text-text-muted leading-relaxed">{item.desc}</p>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded mt-2 inline-block" style={{ color: MODULE_COLOR, backgroundColor: `${MODULE_COLOR}15` }}>{item.tag}</span>
                </div>
                <ArrowRight size={18} className="text-text-muted group-hover:text-brand group-hover:translate-x-0.5 transition-all flex-shrink-0"/>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── A&R Intake tab ── */}
      {tab === "ar" && (
        <div>
          <p className="text-sm text-text-muted mb-5">The structured A&R workflow — pipeline visibility from discovery to signing, plus the scorecard that makes sign / develop / pass calls defensible.</p>
          <div className="space-y-3">
            {[
              { href: "/dashboard/library/startup/ar-pipeline", title: "A&R Pipeline Board", desc: "Track every prospect through 9 stages: Discovery → First listen → Showcase → Scorecard pass → LOI → Signed.", tag: "Tracker" },
              { href: "/dashboard/library/startup/artist-scorecard", title: "Artist Evaluation Scorecard", desc: "8-dimension scoring — vocal, songwriting, live, work ethic, culture fit, visual, audience, differentiation. Auto-recommendation.", tag: "Scorecard" },
              { href: "/dashboard/library/startup/songwriter-camp", title: "Songwriter Camp Programmer", desc: "Plan and document a multi-day songwriter / producer camp. Schedule rooms, log writers + splits, set hospitality. Pair with the One-Way NDA.", tag: "Programmer" },
              { href: "/dashboard/library/startup/songwriter-camp-hold-letter", title: "Songwriter Camp Hold Letter", desc: "Pre-NDA hold-and-pay letter that locks a songwriter's dates while you finalise the full camp paperwork. Per-diem, kill fee, splits placeholder, governing law.", tag: "Hold letter" },
            ].map((item) => (
              <Link key={item.href} href={item.href} className="glass-card rounded-xl p-5 flex items-center gap-4 group hover:border-brand/30 transition-all">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#C9A84C15" }}>
                  <FileText size={22} style={{ color: MODULE_COLOR }}/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-text-primary group-hover:text-brand transition-colors mb-0.5">{item.title}</p>
                  <p className="text-xs text-text-muted leading-relaxed">{item.desc}</p>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded mt-2 inline-block" style={{ color: MODULE_COLOR, backgroundColor: `${MODULE_COLOR}15` }}>{item.tag}</span>
                </div>
                <ArrowRight size={18} className="text-text-muted group-hover:text-brand group-hover:translate-x-0.5 transition-all flex-shrink-0"/>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Performance & Goals tab ── */}
      {tab === "performance" && (
        <div>
          <p className="text-sm text-text-muted mb-5">Set artist goals, benchmark against competitors, and track chart performance + certifications. Three live tools that turn the scoring engine into action plans.</p>
          <div className="space-y-3">
            {[
              { href: "/dashboard/library/startup/goal-setter", title: "Artist Goal-Setter", desc: "SMART goals per artist (Spotify monthly listeners, YouTube subs, tour revenue, etc.). Auto progress bar with expected-vs-actual tracking.", tag: "SMART tracker" },
              { href: "/dashboard/library/startup/competitor-set", title: "Competitor Set Tracker", desc: "Define a 3–5 artist comparator set per artist. Side-by-side Reach / Momentum / Engagement scoring with composite rank.", tag: "Comparator" },
              { href: "/dashboard/library/startup/chart-performance", title: "Chart-Performance Tracker", desc: "Manual entry layer for chart positions (Spotify / Apple / Boomplay / TurnTable / Billboard) plus RIAA / RiSA / BPI certifications.", tag: "Chart history" },
            ].map((item) => (
              <Link key={item.href} href={item.href} className="glass-card rounded-xl p-5 flex items-center gap-4 group hover:border-brand/30 transition-all">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#C9A84C15" }}>
                  <FileText size={22} style={{ color: MODULE_COLOR }}/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-text-primary group-hover:text-brand transition-colors mb-0.5">{item.title}</p>
                  <p className="text-xs text-text-muted leading-relaxed">{item.desc}</p>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded mt-2 inline-block" style={{ color: MODULE_COLOR, backgroundColor: `${MODULE_COLOR}15` }}>{item.tag}</span>
                </div>
                <ArrowRight size={18} className="text-text-muted group-hover:text-brand group-hover:translate-x-0.5 transition-all flex-shrink-0"/>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
