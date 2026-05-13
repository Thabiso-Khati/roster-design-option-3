"use client";
import { useMemo, useState } from "react";
import { Calculator, ExternalLink, AlertCircle, Check } from "lucide-react";
import { ResourcePage, inputClass, labelClass } from "@/components/library/module-shell";
import { useLocale } from "@/context/locale-context";
import { VAT_THRESHOLDS, VAT_COUNTRIES, type VatThreshold } from "@/lib/vat-thresholds";

const COLOR = "#EC4899";

function formatLocal(amount: number, t: VatThreshold) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(amount);
}

export default function VatDecisionPage() {
  const { country: home } = useLocale();
  const initialCountry = VAT_THRESHOLDS[home] ? home : "South Africa";
  const [country, setCountry] = useState<string>(initialCountry);
  const [turnover, setTurnover] = useState<string>("");

  const t = VAT_THRESHOLDS[country];
  const turnoverNum = Number(turnover) || 0;

  const status = useMemo(() => {
    if (turnoverNum === 0) return null;
    const ratio = turnoverNum / t.thresholdLocal;
    if (ratio >= 1) return "compulsory";
    if (ratio >= 0.75) return "approaching";
    if (ratio >= 0.4) return "approaching-mid";
    return "below";
  }, [turnoverNum, t.thresholdLocal]);

  const remainingHeadroom = Math.max(0, t.thresholdLocal - turnoverNum);
  const overshoot = Math.max(0, turnoverNum - t.thresholdLocal);
  const percentOfThreshold = t.thresholdLocal === 0 ? 0 : Math.min(100, (turnoverNum / t.thresholdLocal) * 100);

  return (
    <ResourcePage
      parentHref="/dashboard/library/money"
      parentLabel="Back to Finance and Tax"
      color={COLOR}
      tag="Finance · VAT Decision"
      title="VAT Registration Decision Tool"
      intro="Above this turnover, you must register for VAT (or its local equivalent). Pick a country, enter your trailing-12-month turnover in local currency, and see whether you're compulsory, approaching, or clear. Covers all 15 IFPI key African markets."
      next={{ href: "/dashboard/library/money/banking-forex", label: "Banking & Forex Quick-Cards" }}
    >
      {/* Selectors */}
      <div className="glass-card rounded-2xl p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Country / jurisdiction</label>
            <select className={inputClass} value={country} onChange={(e) => setCountry(e.target.value)}>
              {VAT_COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Your trailing 12-month turnover ({t.currency})</label>
            <input
              type="number"
              className={inputClass}
              placeholder={`e.g. ${formatLocal(t.thresholdLocal * 0.6, t)}`}
              value={turnover}
              onChange={(e) => setTurnover(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Decision card */}
      {turnoverNum > 0 ? (
        <DecisionCard
          status={status!}
          country={country}
          turnover={turnoverNum}
          threshold={t}
          headroom={remainingHeadroom}
          overshoot={overshoot}
          percent={percentOfThreshold}
        />
      ) : (
        <div className="glass-card rounded-2xl p-8 text-center mb-6">
          <Calculator size={28} className="mx-auto mb-3 opacity-40" style={{ color: COLOR }} />
          <p className="font-bold text-text-primary mb-1">Enter your turnover above</p>
          <p className="text-sm text-text-muted">Use {t.country}'s definition of taxable turnover (period: {t.period.toLowerCase()}).</p>
        </div>
      )}

      {/* Country info card */}
      <div className="glass-card rounded-2xl p-5 mb-6" style={{ borderColor: `${COLOR}25` }}>
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: COLOR }}>{t.country}</p>
            <p className="font-bold text-text-primary">{t.taxName} — {t.rate}% standard rate</p>
          </div>
          <a
            href={t.authorityUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold inline-flex items-center gap-1 text-text-muted hover:text-text-primary"
          >
            <ExternalLink size={12} /> {t.authority}
          </a>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <Fact label="Compulsory threshold"     value={t.thresholdLocalLabel} />
          <Fact label="Look-back period"          value={t.period} />
          <Fact label="Voluntary registration"    value={t.voluntaryFrom ?? "Not available"} />
          <Fact label="Filing cadence"            value={t.cadence} />
        </div>

        <p className="text-xs text-text-muted leading-relaxed">{t.notes}</p>
      </div>

      {/* Decision logic explainer */}
      <div className="glass-card rounded-2xl p-5 mb-6">
        <p className="font-bold text-sm text-text-primary mb-3">How the decision works</p>
        <div className="space-y-2 text-xs text-text-muted leading-relaxed">
          <p><span className="font-semibold text-text-primary">1. Add up taxable turnover</span> across the {t.period.toLowerCase()} — gross of expenses, net of any zero-rated / exempt income.</p>
          <p><span className="font-semibold text-text-primary">2. Compare to threshold.</span> If equal to or above {t.thresholdLocalLabel}, you must register within the deadline (typically 21–30 days).</p>
          <p><span className="font-semibold text-text-primary">3. Don't wait until you cross.</span> Most authorities backdate registration to the date you crossed and assess penalties on missed VAT during the gap.</p>
          {t.voluntaryFrom && (
            <p><span className="font-semibold text-text-primary">4. Voluntary registration</span> ({t.voluntaryFrom}) is worth considering when most clients are also VAT-registered (you reclaim input VAT) or when it adds credibility for B2B work.</p>
          )}
        </div>
      </div>

      {/* Pros / cons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="glass-card rounded-2xl p-5" style={{ borderColor: "rgba(16,185,129,0.20)", backgroundColor: "rgba(16,185,129,0.04)" }}>
          <p className="font-bold text-sm text-text-primary mb-3 flex items-center gap-2">
            <Check size={14} style={{ color: "#10B981" }} /> Why register
          </p>
          <ul className="space-y-1.5 text-xs text-text-muted leading-relaxed list-disc pl-4">
            <li>Reclaim input VAT on tour expenses, studio time, gear purchases.</li>
            <li>Required for most enterprise / brand / sync deals over the threshold.</li>
            <li>Enables proper invoicing for B2B clients who'll claim back VAT.</li>
            <li>Brand legitimacy — VAT-registered = recognised business.</li>
          </ul>
        </div>
        <div className="glass-card rounded-2xl p-5" style={{ borderColor: "rgba(239,68,68,0.20)", backgroundColor: "rgba(239,68,68,0.04)" }}>
          <p className="font-bold text-sm text-text-primary mb-3 flex items-center gap-2">
            <AlertCircle size={14} className="text-red-400" /> What it costs
          </p>
          <ul className="space-y-1.5 text-xs text-text-muted leading-relaxed list-disc pl-4">
            <li>Adds {t.rate}% to your prices — fans / direct-to-consumer pricing matters.</li>
            <li>Strict {t.cadence.toLowerCase()} filing cadence with penalties for late returns.</li>
            <li>Bookkeeping must be VAT-compliant — invoices, tax invoices, credit notes.</li>
            <li>VAT inspection risk grows with revenue — keep records 5+ years.</li>
          </ul>
        </div>
      </div>

      <div
        className="glass-card rounded-2xl p-5 flex items-start gap-3"
        style={{ borderColor: "rgba(236,72,153,0.20)", backgroundColor: "rgba(236,72,153,0.04)" }}
      >
        <span className="text-base flex-shrink-0">⚠️</span>
        <p className="text-xs text-text-muted leading-relaxed">
          Thresholds and rates change. This tool is a planning aid, not tax advice. Always confirm with the relevant revenue authority ({t.authority}) and a qualified tax practitioner licensed in {t.country} before registering or invoicing with VAT.
        </p>
      </div>
    </ResourcePage>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-0.5">{label}</p>
      <p className="text-sm font-bold text-text-primary leading-tight">{value}</p>
    </div>
  );
}

function DecisionCard({
  status, country, threshold, headroom, overshoot, percent,
}: {
  status: "compulsory" | "approaching" | "approaching-mid" | "below";
  country: string;
  turnover: number;
  threshold: VatThreshold;
  headroom: number;
  overshoot: number;
  percent: number;
}) {
  const palette = {
    compulsory:        { color: "#EF4444", light: "rgba(239,68,68,0.10)",  border: "rgba(239,68,68,0.40)",  label: "REGISTER NOW", body: `Your trailing-12-month turnover is over the ${threshold.thresholdLocalLabel} threshold by ${formatLocal(overshoot, threshold)} ${threshold.currency}. ${threshold.authority} requires registration. File the application immediately to avoid backdating + penalties.` },
    "approaching":     { color: "#F59E0B", light: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.40)", label: "REGISTER SOON", body: `You're within ${formatLocal(headroom, threshold)} ${threshold.currency} of the ${threshold.thresholdLocalLabel} threshold. Most managers register at this point so they can charge / reclaim VAT cleanly when they cross. Don't wait until the day after.` },
    "approaching-mid": { color: "#3B82F6", light: "rgba(59,130,246,0.10)", border: "rgba(59,130,246,0.40)", label: "MONITOR",       body: `You're at about ${percent.toFixed(0)}% of the threshold. Track turnover monthly. Plan to register if growth continues at this pace.` },
    "below":           { color: "#10B981", light: "rgba(16,185,129,0.10)", border: "rgba(16,185,129,0.40)", label: "BELOW THRESHOLD", body: `You're at ${percent.toFixed(0)}% of the ${threshold.thresholdLocalLabel} threshold. ${threshold.voluntaryFrom ? `Voluntary registration available from ${threshold.voluntaryFrom} — consider if your clients are mostly VAT-registered businesses.` : "No registration required. Re-check this quarterly."}` },
  };

  const p = palette[status];

  return (
    <div
      className="glass-card rounded-2xl p-6 mb-6"
      style={{ borderColor: p.border, backgroundColor: p.light }}
    >
      <div className="flex items-center gap-3 mb-3">
        <span
          className="text-[10px] font-black uppercase px-2.5 py-1 rounded"
          style={{ color: p.color, backgroundColor: `${p.color}20` }}
        >
          {p.label}
        </span>
        <span className="text-sm font-bold text-text-primary">{country}</span>
      </div>
      <p className="text-sm text-text-primary leading-relaxed mb-4">{p.body}</p>

      <div className="h-2 rounded-full overflow-hidden bg-surface-2">
        <div
          className="h-full transition-all"
          style={{ width: `${percent}%`, backgroundColor: p.color }}
        />
      </div>
      <div className="flex items-center justify-between mt-1.5 text-[11px] text-text-muted">
        <span>0 {threshold.currency}</span>
        <span className="font-semibold" style={{ color: p.color }}>{percent.toFixed(0)}% of threshold</span>
        <span>{threshold.thresholdLocalLabel}</span>
      </div>
    </div>
  );
}
