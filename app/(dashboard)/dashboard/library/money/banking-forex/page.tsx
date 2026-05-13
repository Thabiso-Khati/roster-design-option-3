"use client";
import { useState } from "react";
import { Banknote, ArrowDownToLine, ArrowUpFromLine, Globe2, Smartphone, AlertCircle, ExternalLink } from "lucide-react";
import { ResourcePage } from "@/components/library/module-shell";
import { useLocale } from "@/context/locale-context";

const COLOR = "#EC4899";

interface BankCard {
  name: string;
  type: "Big bank" | "Digital bank" | "Forex specialist" | "Mobile money";
  use: string;
  pros: string[];
  cons: string[];
  fees: string;
  url?: string;
}

interface CountryGuide {
  code: string;
  country: string;
  currency: string;
  authorityNote: string;
  receiveOptions: BankCard[];
  payoutOptions: BankCard[];
  forexNotes: string[];
  mobileMoney: BankCard[];
  swiftRoute: string;
  mostCommonError: string;
}

const SA: CountryGuide = {
  code: "SA",
  country: "South Africa",
  currency: "ZAR",
  authorityNote: "All forex is regulated by the SA Reserve Bank (SARB). Inflows / outflows above ZAR 100k typically require a Balance of Payments (BoP) reporting code from your bank. Above ZAR 1m / year for individuals: SARS Tax Compliance Status (TCS PIN) required.",
  receiveOptions: [
    {
      name: "Standard Bank — Business Account",
      type: "Big bank",
      use: "Receive USD / GBP / EUR via SWIFT into a foreign-currency-account (CFC), or auto-convert to ZAR.",
      pros: ["Strong foreign-currency support", "Trade desk for spot conversions", "Industry-recognised sender bank"],
      cons: ["Monthly fees high (R250–500+)", "FX margins 1.5–3% over interbank", "Slow onboarding"],
      fees: "Monthly account fee + per-transaction SWIFT fee (R150–500) + FX margin",
      url: "https://www.standardbank.co.za/southafrica/business",
    },
    {
      name: "FNB — Business Account + Global Account",
      type: "Big bank",
      use: "ZAR business account paired with USD / GBP / EUR sub-accounts.",
      pros: ["Solid app + online banking", "Inflows under ZAR 1m simpler", "Tap-and-go for in-person sales"],
      cons: ["Same SARB rules as everyone", "FX margins 1.5–3%", "Compliance docs requested often"],
      fees: "R250–500/mo bundle + R150 SWIFT receive + FX margin",
      url: "https://www.fnb.co.za/business-banking/",
    },
    {
      name: "Capitec Business",
      type: "Big bank",
      use: "Lower-fee local ZAR receiving; less optimal for high-volume forex.",
      pros: ["Cheapest monthly fees", "Strong local QR / instant EFT", "Easy onboarding for sole props"],
      cons: ["Limited foreign currency support", "Forex routed through partner banks", "Not ideal for sync / royalty USD inflows"],
      fees: "R50/mo + R5–10 per local txn",
      url: "https://www.capitecbank.co.za/business/",
    },
    {
      name: "Wise (Multi-currency Account)",
      type: "Forex specialist",
      use: "Receive USD / GBP / EUR / AUD with local account details (US ACH, UK sort code, EU IBAN, AU BSB) — then transfer into ZAR.",
      pros: ["Mid-market FX rate (no margin)", "Local account details = no SWIFT fees from sender", "5–30× cheaper on USD→ZAR than banks"],
      cons: ["Cannot hold ZAR-balance for receiving (yet)", "Each USD→ZAR transfer triggers BoP / SARB rules", "Limit on how much you can convert annually under Single Discretionary Allowance"],
      fees: "Free to receive · 0.4–0.7% margin on conversion · no monthly fees",
      url: "https://wise.com",
    },
    {
      name: "Stripe Atlas / PayPal Business",
      type: "Forex specialist",
      use: "Mostly for D2C / merch / digital sales — receive card payments globally, payout to ZAR account.",
      pros: ["Auto-handles cards from anywhere", "Standard for online merch storefronts"],
      cons: ["3–4% txn fee + 1–3% FX", "Stripe is harder for SA-incorporated entities", "Held funds during chargeback disputes"],
      fees: "2.9% + R2 per txn (Stripe) · ~5% combined for cross-border (PayPal)",
      url: "https://stripe.com",
    },
  ],
  payoutOptions: [
    {
      name: "FNB / Standard Bank International Banking",
      type: "Big bank",
      use: "Pay producers / collaborators / vendors abroad in USD / GBP / EUR.",
      pros: ["Reliable", "BoP code handled by bank"],
      cons: ["FX margin 1.5–3%", "SWIFT fee R150–500"],
      fees: "R150–500 per outbound + 1.5–3% FX",
    },
    {
      name: "Wise",
      type: "Forex specialist",
      use: "Outbound USD / GBP / EUR / etc. payments at mid-market rate.",
      pros: ["Mid-market FX (0.4–0.7% margin)", "Cheaper than any SA bank for outbound", "Same-day or next-day delivery"],
      cons: ["Single Discretionary Allowance ZAR 1m / yr cap (individuals)", "Foreign Investment Allowance (ZAR 10m) needs SARS TCS PIN"],
      fees: "0.4–0.7% margin · no SWIFT fee",
      url: "https://wise.com",
    },
  ],
  forexNotes: [
    "BoP codes: 'Foreign Service Income' (210) — most music revenue. 'Royalties' (412) — publishing / sync.",
    "Single Discretionary Allowance: ZAR 1m / individual / calendar year — no TCS required.",
    "Foreign Investment Allowance: ZAR 10m / individual / yr — TCS PIN from SARS required.",
    "Companies: foreign currency holdings via CFC account require SARB approval over thresholds.",
    "Always declare foreign income to SARS — use IT3(b) interest cert + own records of FX rate on receipt date.",
  ],
  mobileMoney: [
    { name: "PayShap (instant ZAR)", type: "Mobile money", use: "Domestic instant settlement using cellphone number.", pros: ["Free / R5", "Instant", "Works across all major SA banks"], cons: ["ZAR only — domestic"], fees: "Free–R5" },
    { name: "SnapScan / Yoco / Zapper", type: "Mobile money", use: "In-person merch / ticket sales QR.", pros: ["No card terminal needed", "Instant settlement", "Cheap for small txns"], cons: ["~2.5–3% per txn", "Domestic only"], fees: "2.5–3% per txn" },
  ],
  swiftRoute: "International senders: BIC of receiving bank + IBAN-equivalent account number. SA is not on IBAN system — provide BIC + account number + branch code.",
  mostCommonError: "Sender doesn't include the BoP code or includes a wrong one — bank holds funds for 5–10 working days while compliance contacts you. Always tell senders to include 'royalty payment' or 'service fee' in reference field.",
};

const NG: CountryGuide = {
  code: "NG",
  country: "Nigeria",
  currency: "NGN",
  authorityNote: "All forex is regulated by the Central Bank of Nigeria (CBN). Domiciliary (USD/GBP/EUR) accounts are mandatory for receiving foreign currency. CBN occasionally restricts FX access — track current windows: Investors & Exporters (I&E), official, parallel.",
  receiveOptions: [
    {
      name: "Access Bank — Domiciliary Account",
      type: "Big bank",
      use: "Receive USD / GBP / EUR via SWIFT. Hold in foreign currency or convert to NGN at I&E rate.",
      pros: ["Largest SWIFT correspondent network in Nigeria", "Strong online banking", "Common destination for label / publisher payments"],
      cons: ["KYC heavy (BVN, NIN, utility, etc.)", "FX margins through CBN windows", "FC withdrawals capped per branch"],
      fees: "Account opening + monthly maintenance + SWIFT receive ($25–50) + FX margin",
      url: "https://www.accessbankplc.com/",
    },
    {
      name: "GTBank (Guaranty Trust) — Domiciliary",
      type: "Big bank",
      use: "Same role as Access. Strong tech.",
      pros: ["Best mobile app of NG banks", "Cards work cleanly internationally", "Common for music industry payouts"],
      cons: ["FX windows volatile", "International cards capped USD limits", "Long onboarding"],
      fees: "Similar to Access (~$25–50 SWIFT + FX margin)",
      url: "https://www.gtbank.com/",
    },
    {
      name: "Zenith Bank — Domiciliary",
      type: "Big bank",
      use: "Major SWIFT bank, often used by labels for outbound payments to artists.",
      pros: ["Reliable for labels remitting to Nigerian artists", "Strong for high-value transfers"],
      cons: ["Slower onboarding", "Less consumer-friendly app"],
      fees: "Similar to Access / GT",
      url: "https://www.zenithbank.com/",
    },
    {
      name: "Wise (Multi-currency Account, partial NG support)",
      type: "Forex specialist",
      use: "Outbound from Wise to NGN bank account. Inbound NGN→Wise NOT directly supported, but USD inbound to Wise → manual transfer to NG dom account works.",
      pros: ["Mid-market FX for outbound", "Useful for paying foreign producers / vendors"],
      cons: ["NGN inbound limited", "Requires non-NG residency for some flows"],
      fees: "0.4–0.7% margin",
      url: "https://wise.com",
    },
    {
      name: "Flutterwave — Send / Receive",
      type: "Forex specialist",
      use: "Receive USD via Flutterwave virtual account, payout to NGN. Common for D2C merch + digital products.",
      pros: ["NG-built — handles CBN constraints", "Payment links + checkout", "Multi-currency virtual accounts"],
      cons: ["Higher fees than Wise", "FX rate often slightly worse than I&E", "KYC heavy for high volume"],
      fees: "1.4–3.8% per txn",
      url: "https://flutterwave.com/",
    },
    {
      name: "Paystack — Receive",
      type: "Forex specialist",
      use: "Card / bank transfer settlement to NGN. Stripe-owned, stable.",
      pros: ["Best dev integration", "Reliable for online merch / subscriptions", "Fast NGN settlement"],
      cons: ["NGN-first — international card support varies", "Cross-border fees stack up"],
      fees: "1.5% + ₦100 (cap ₦2,000) NG cards · 3.9% + ₦100 international",
      url: "https://paystack.com/",
    },
  ],
  payoutOptions: [
    {
      name: "Domiciliary account → SWIFT outbound",
      type: "Big bank",
      use: "Pay foreign producers / vendors via your bank's wire desk.",
      pros: ["Standard route", "Documented BoP-equivalent (Form A / Form M for trade)"],
      cons: ["Slow (3–5 days)", "Expensive ($25–50 + FX margin)", "CBN limit applied"],
      fees: "$25–50 + 2–4% FX",
    },
    {
      name: "Wise (outbound)",
      type: "Forex specialist",
      use: "Cheapest for outbound USD / GBP / EUR.",
      pros: ["Mid-market rate", "Same-day", "No CBN bottleneck once funded"],
      cons: ["Funding from NGN side requires bank wire to USD account first"],
      fees: "0.4–0.7% margin",
    },
  ],
  forexNotes: [
    "Form A (cash transfers) / Form M (imports of goods) — required for most outbound foreign payments.",
    "I&E (Investors & Exporters) window: market-determined NGN rate for most legitimate flows. Use this rate when budgeting.",
    "CBN occasionally suspends or limits FC card payments. Track CBN circulars before relying on USD card spend abroad.",
    "Personal Travel Allowance (PTA): USD 4,000 / quarter for personal trips — not enough for tour expenses.",
    "Business Travel Allowance (BTA): USD 5,000 / quarter for business — same constraint.",
    "Royalty payments to Nigerian residents from abroad: the foreign payer often deducts WHT — verify DTA position with FIRS.",
  ],
  mobileMoney: [
    { name: "OPay / PalmPay / Kuda", type: "Mobile money", use: "Domestic NGN instant settlement; popular for street merch / event sales.", pros: ["Instant settlement", "Wide adoption — most fans have at least one", "Free or near-free domestic"], cons: ["NGN only", "Not for international flow"], fees: "Free–₦50 per txn", url: "https://opayweb.com/" },
    { name: "Bank USSD (*###)", type: "Mobile money", use: "Bank-to-bank transfer via USSD code on any phone. Doesn't need data.", pros: ["Works on feature phones", "No app required", "Standard across all NG banks"], cons: ["Slower than apps", "Less secure than authenticated app"], fees: "₦10–50 per txn" },
  ],
  swiftRoute: "International senders: SWIFT BIC of dom account bank + 10-digit account number + 'For credit to [account name]'. Always confirm beneficiary name spelling — CBN compliance bounces mismatched names.",
  mostCommonError: "Beneficiary account name on SWIFT differs from CBN-registered name (BVN). Bank holds funds, contacts compliance, requires letter from sender. Add 5–10 days to receipt.",
};

const GUIDES: Record<string, CountryGuide> = {
  "South Africa": SA,
  "Nigeria": NG,
};

export default function BankingForexPage() {
  const { country } = useLocale();
  const initial = GUIDES[country] ? country : "South Africa";
  const [selected, setSelected] = useState<string>(initial);
  const guide = GUIDES[selected];

  return (
    <ResourcePage
      parentHref="/dashboard/library/money"
      parentLabel="Back to Finance and Tax"
      color={COLOR}
      tag="Finance · Banking & Forex"
      title="Banking & Forex Quick-Cards"
      intro="Per-country one-pagers covering bank account types, forex receive options, common SWIFT routes, and mobile money rails. Currently shipping for South Africa and Nigeria — the two most-used markets for music industry inbound forex. Other markets land in subsequent sprints."
      next={{ href: "/dashboard/library/money/service-record", label: "Service Record" }}
    >
      {/* Country switcher */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {Object.keys(GUIDES).map((c) => (
          <button
            key={c}
            onClick={() => setSelected(c)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
              selected === c
                ? "border-brand text-text-primary"
                : "border-border text-text-muted hover:text-text-primary"
            }`}
            style={selected === c ? { borderColor: COLOR, backgroundColor: `${COLOR}15` } : undefined}
          >
            {c} ({GUIDES[c].currency})
          </button>
        ))}
      </div>

      {/* Authority note */}
      <div className="glass-card rounded-2xl p-5 mb-6" style={{ borderColor: `${COLOR}25`, backgroundColor: `${COLOR}06` }}>
        <div className="flex items-start gap-3">
          <Globe2 size={18} className="flex-shrink-0 mt-0.5" style={{ color: COLOR }} />
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: COLOR }}>{guide.country} · Forex authority</p>
            <p className="text-sm text-text-primary leading-relaxed">{guide.authorityNote}</p>
          </div>
        </div>
      </div>

      {/* Receive options */}
      <Section icon={<ArrowDownToLine size={18} style={{ color: COLOR }} />} title={`Receiving foreign currency in ${guide.country}`}>
        {guide.receiveOptions.map((b) => <BankCardView key={b.name} card={b} />)}
      </Section>

      {/* Payout options */}
      <Section icon={<ArrowUpFromLine size={18} style={{ color: COLOR }} />} title={`Paying foreign vendors / collaborators from ${guide.country}`}>
        {guide.payoutOptions.map((b) => <BankCardView key={b.name} card={b} />)}
      </Section>

      {/* Forex rules */}
      <Section icon={<AlertCircle size={18} style={{ color: COLOR }} />} title={`${guide.country} forex rules to know`}>
        <div className="glass-card rounded-2xl p-5">
          <ul className="space-y-2 text-sm text-text-muted leading-relaxed list-disc pl-4">
            {guide.forexNotes.map((n, i) => <li key={i}>{n}</li>)}
          </ul>
        </div>
      </Section>

      {/* Mobile money */}
      <Section icon={<Smartphone size={18} style={{ color: COLOR }} />} title={`${guide.country} mobile money / instant rails`}>
        {guide.mobileMoney.map((b) => <BankCardView key={b.name} card={b} />)}
      </Section>

      {/* SWIFT route + most common error */}
      <Section icon={<Banknote size={18} style={{ color: COLOR }} />} title="Cross-border practicalities">
        <div className="glass-card rounded-2xl p-5 mb-3">
          <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: COLOR }}>SWIFT routing — what to give the sender</p>
          <p className="text-sm text-text-primary leading-relaxed">{guide.swiftRoute}</p>
        </div>
        <div className="glass-card rounded-2xl p-5" style={{ borderColor: "rgba(239,68,68,0.20)", backgroundColor: "rgba(239,68,68,0.04)" }}>
          <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-red-400">Most common error</p>
          <p className="text-sm text-text-primary leading-relaxed">{guide.mostCommonError}</p>
        </div>
      </Section>

      <div
        className="glass-card rounded-2xl p-5 mt-6 flex items-start gap-3"
        style={{ borderColor: "rgba(236,72,153,0.20)", backgroundColor: "rgba(236,72,153,0.04)" }}
      >
        <span className="text-base flex-shrink-0">⚠️</span>
        <p className="text-xs text-text-muted leading-relaxed">
          Bank fees, FX margins, and CBN / SARB rules change frequently. This page is a starting framework — confirm current rates and rules with the institution and your bookkeeper before moving large sums. We do not have a commercial relationship with any of the banks or services listed; mentions are for orientation only.
        </p>
      </div>
    </ResourcePage>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <p className="font-bold text-text-primary text-sm">{title}</p>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function BankCardView({ card }: { card: BankCard }) {
  const typeColors: Record<BankCard["type"], string> = {
    "Big bank":         "#3B82F6",
    "Digital bank":     "#8B5CF6",
    "Forex specialist": "#10B981",
    "Mobile money":     "#F59E0B",
  };
  const c = typeColors[card.type];
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
        <div>
          <p className="font-bold text-sm text-text-primary">{card.name}</p>
          <p className="text-xs text-text-muted mt-0.5">{card.use}</p>
        </div>
        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded" style={{ color: c, backgroundColor: `${c}15` }}>{card.type}</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
        <div>
          <p className="text-[10px] font-black uppercase text-text-muted mb-1.5">Pros</p>
          <ul className="space-y-1 text-xs text-text-muted leading-relaxed list-disc pl-4">
            {card.pros.map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase text-text-muted mb-1.5">Watchouts</p>
          <ul className="space-y-1 text-xs text-text-muted leading-relaxed list-disc pl-4">
            {card.cons.map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </div>
      </div>
      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border flex-wrap">
        <span className="text-[11px] text-text-muted"><span className="font-semibold text-text-primary">Fees:</span> {card.fees}</span>
        {card.url && (
          <a href={card.url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-text-muted hover:text-text-primary inline-flex items-center gap-1">
            <ExternalLink size={11} /> Visit
          </a>
        )}
      </div>
    </div>
  );
}
