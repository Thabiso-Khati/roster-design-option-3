"use client";
import { useState } from "react";
import { CheckCircle2, Zap } from "lucide-react";
import { TIERS } from "@/lib/constants";
import { TierCard, BillingToggle } from "@/components/marketing/tier-card";

// ─── Comparison table ─────────────────────────────────────────
const COMPARE_ROWS: { label: string; values: (string | boolean)[] }[] = [
  {
    label: "Artists managed",
    values: ["—", "2", "5", "20"],
  },
  {
    label: "User seats",
    values: ["1", "1", "3", "10"],
  },
  {
    label: "Tool access",
    values: ["2 tools", "All tools", "All tools", "All tools"],
  },
  {
    label: "Saved documents",
    values: ["None", "50", "Unlimited", "Unlimited"],
  },
  {
    label: "Documents carry over on renewal",
    values: [false, false, false, true],
  },
  {
    label: "Masterclasses",
    values: [false, true, true, true],
  },
  {
    label: "Expert booking",
    values: [false, true, true, true],
  },
  {
    label: "Support",
    values: ["Community", "Email", "Priority email", "Dedicated AM"],
  },
  {
    label: "Response SLA",
    values: ["—", "48 hrs", "24 hrs", "4 hrs"],
  },
  {
    label: "Private onboarding session",
    values: [false, false, false, true],
  },
  {
    label: "Quarterly business review",
    values: [false, false, false, true],
  },
  {
    label: "Invoice billing",
    values: [false, false, false, true],
  },
  {
    label: "Annual contract",
    values: [false, false, "Optional", "Preferred"],
  },
];

function CompareTable() {
  return (
    <div className="mt-20 overflow-x-auto">
      <h2 className="text-2xl font-black text-text-primary text-center mb-8">
        Full comparison
      </h2>
      <table className="w-full min-w-[640px]">
        <thead>
          <tr>
            <th className="text-left text-xs font-bold text-text-muted uppercase tracking-widest pb-4 w-[35%]">
              Feature
            </th>
            {TIERS.map((t) => (
              <th
                key={t.id}
                className={`text-center text-xs font-black uppercase tracking-widest pb-4 ${
                  t.highlight ? "text-brand" : "text-text-muted"
                }`}
              >
                {t.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {COMPARE_ROWS.map((row, i) => (
            <tr
              key={row.label}
              className={i % 2 === 0 ? "bg-surface/40" : ""}
            >
              <td className="py-3 px-3 text-sm text-text-muted rounded-l-lg">
                {row.label}
              </td>
              {row.values.map((val, j) => (
                <td
                  key={j}
                  className={`py-3 px-3 text-center text-sm rounded-r-lg ${
                    TIERS[j]?.highlight ? "text-brand font-semibold" : "text-text-muted"
                  }`}
                >
                  {typeof val === "boolean" ? (
                    val ? (
                      <CheckCircle2 size={15} className="inline text-success" />
                    ) : (
                      <span className="text-text-muted opacity-30">—</span>
                    )
                  ) : (
                    val
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────
const FAQS = [
  {
    q: "What counts as a saved document?",
    a: "Each tool you save data to counts as one document. If you fill in the Tour Budget tool and save it, that's one document. Editing it later doesn't count again — only the first save per tool counts toward your limit.",
  },
  {
    q: "What happens when a Pro user hits 50 documents?",
    a: "The Save button turns into an Upgrade button. Your existing 50 documents stay untouched and fully accessible — nothing is deleted. You just can't save new tools until you upgrade or clear space.",
  },
  {
    q: "What is a 'seat'?",
    a: "A seat is a separate user account that can log in to your subscription. Pro includes 1 seat (you). Agency includes 3 — so you plus two team members. Enterprise includes 10.",
  },
  {
    q: "Can I upgrade or downgrade at any time?",
    a: "Yes. Upgrades are instant. Downgrades take effect at the end of your current billing period.",
  },
  {
    q: "What does 'documents carry over' mean for Enterprise?",
    a: "For all other paid tiers, if you don't renew, your saved documents eventually become inaccessible. Enterprise subscribers who renew keep everything — documents roll into the new year automatically.",
  },
  {
    q: "How does Enterprise onboarding work?",
    a: "After signing up, we schedule a 2-hour private session with your team. We walk through every module relevant to your roster, set up your documents, and make sure your whole team is confident using the platform.",
  },
  {
    q: "Is there a free trial?",
    a: "Free tier gives you permanent access to Learn and two work tools — no trial expiry. If you want full access, start with Monthly Pro and cancel if it's not for you.",
  },
  {
    q: "What currencies and payment methods are supported?",
    a: "Payments are processed in ZAR via Paystack. Paystack supports card payments, bank transfers, and mobile money (MTN MoMo, M-Pesa, Airtel Money) across South Africa and 30+ African countries.",
  },
];

// ─── Page ─────────────────────────────────────────────────────
export default function PricingPage() {
  const [annual, setAnnual] = useState(false);

  return (
    <div className="pt-28 pb-24 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-xs font-semibold uppercase tracking-widest text-brand inline-block mb-4">
            Pricing
          </span>
          <h1 className="text-5xl sm:text-6xl font-black tracking-tight mb-5">
            Pricing that grows{" "}
            <span className="text-gold">with you.</span>
          </h1>
          <p className="text-text-muted text-lg max-w-xl mx-auto mb-8">
            Start free. Upgrade when your roster does.
          </p>
          <BillingToggle annual={annual} onChange={setAnnual} />
          {annual && (
            <p className="text-xs text-success mt-3 flex items-center justify-center gap-1.5">
              <Zap size={11} />
              Annual billing saves you up to R9,998/year
            </p>
          )}
        </div>

        {/* Tier cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-4">
          {TIERS.map((tier) => (
            <TierCard key={tier.id} tier={tier} annual={annual} />
          ))}
        </div>

        {/* Enterprise note */}
        <p className="text-center text-xs text-text-muted mt-4">
          Enterprise billing available by invoice.{" "}
          <a href="mailto:support@rosterapp.ai" className="text-brand underline">
            Contact us
          </a>{" "}
          to discuss your roster.
        </p>

        {/* Comparison table */}
        <CompareTable />

        {/* FAQ */}
        <div className="mt-20 max-w-2xl mx-auto">
          <h2 className="text-2xl font-black text-text-primary text-center mb-8">
            Common questions
          </h2>
          <div className="space-y-3">
            {FAQS.map(({ q, a }) => (
              <details key={q} className="glass-card rounded-xl group">
                <summary className="px-5 py-4 text-sm font-semibold text-text-primary cursor-pointer list-none flex items-center justify-between select-none">
                  {q}
                  <span className="text-brand text-lg leading-none group-open:rotate-45 transition-transform inline-block ml-4 flex-shrink-0">
                    +
                  </span>
                </summary>
                <p className="px-5 pb-5 text-sm text-text-muted leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </div>

        {/* Bottom note */}
        <p className="text-center text-xs text-text-muted mt-12">
          All prices in South African Rand (ZAR). Payments processed securely via Paystack.
          Nigeria and Kenya pricing coming soon.
        </p>

      </div>
    </div>
  );
}
