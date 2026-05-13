"use client";
import { useMemo } from "react";
import { ResourcePage, inputClass, labelClass, useLocalState } from "@/components/library/module-shell";
import { RotateCcw } from "lucide-react";
import { SaveButton } from "@/components/ui/save-button";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";

const COLOR = "#FB923C";
const STORAGE_KEY = "roster_drop_capacity_v1";

interface State {
  fanlistSize: number;
  conversionRate: number; // % of list expected to buy
  averageOrderValue: number; // R
  bundleRatio: number; // % of orders bundled
  bundleAOVUplift: number; // %
  expectedSocialReach: number;
  socialConversionRate: number; // %
  unitsPerOrder: number; // avg
  costPerUnitR: number;
  unitMarginPctOverride: number;
  printLeadTimeDays: number;
  shippingLeadTimeDays: number;
  dropDate: string;
}

const empty: State = {
  fanlistSize: 5000,
  conversionRate: 5,
  averageOrderValue: 450,
  bundleRatio: 30,
  bundleAOVUplift: 35,
  expectedSocialReach: 50000,
  socialConversionRate: 0.5,
  unitsPerOrder: 1.4,
  costPerUnitR: 180,
  unitMarginPctOverride: 0,
  printLeadTimeDays: 14,
  shippingLeadTimeDays: 7,
  dropDate: "",
};

export default function DropCapacityPlannerPage() {
  const [s, setS] = useLocalState<State>(STORAGE_KEY, empty);
  useToolRestore("drop-capacity-planner", STORAGE_KEY, setS);
  const num = (k: keyof State) => (v: string) => setS({ ...s, [k]: Number(v) || 0 });
  const set = (k: keyof State) => (v: string) => setS({ ...s, [k]: v });

  const calc = useMemo(() => {
    const baseListOrders = (s.fanlistSize * s.conversionRate) / 100;
    const socialOrders = (s.expectedSocialReach * s.socialConversionRate) / 100;
    const totalOrders = baseListOrders + socialOrders;
    const bundleAOV = s.averageOrderValue * (1 + s.bundleAOVUplift / 100);
    const blendedAOV = (s.averageOrderValue * (100 - s.bundleRatio) + bundleAOV * s.bundleRatio) / 100;
    const totalRevenue = totalOrders * blendedAOV;
    const totalUnits = totalOrders * s.unitsPerOrder;
    const totalCOGS = totalUnits * s.costPerUnitR;
    const grossMargin = totalRevenue - totalCOGS;
    const marginPct = totalRevenue > 0 ? (grossMargin / totalRevenue) * 100 : 0;
    return { baseListOrders, socialOrders, totalOrders, blendedAOV, totalRevenue, totalUnits, totalCOGS, grossMargin, marginPct };
  }, [s]);

  const fmt = (n: number) => `R${Math.round(n).toLocaleString()}`;
  const pct = (n: number) => `${n.toFixed(1)}%`;

  const N = ({ label, k, step = 1, hint }: { label: string; k: keyof State; step?: number; hint?: string }) => (
    <div>
      <label className={labelClass}>{label}</label>
      <input type="number" step={step} className={inputClass} value={s[k] as number} onChange={(e) => num(k)(e.target.value)}/>
      {hint && <p className="text-[10px] text-text-muted mt-1">{hint}</p>}
    </div>
  );

  return (
    <ResourcePage
      parentHref="/dashboard/library/merchandise"
      parentLabel="Back to Merchandise"
      color={COLOR}
      tag="Merch · Capacity"
      title="Drop Capacity Planner"
      intro="How many units to print, what revenue to expect, what margin you'll see. Models conversion from fan list + social reach × AOV × bundle uplift."
      toolbar={<><SaveButton toolSlug="drop-capacity-planner" storageKey={STORAGE_KEY} title={`Drop Capacity Planner — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
          <button onClick={() => setS(empty)} className="text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1"><RotateCcw size={13}/> Reset</button>          </>
          }
      next={{ href: "/dashboard/library/merchandise/bandcamp-day-strategy", label: "Bandcamp Day Strategy" }}
    >
      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Audience</p>
        <div className="grid grid-cols-2 gap-4">
          <N label="Fan list size" k="fanlistSize"/>
          <N label="Conversion rate %" k="conversionRate" step={0.1} hint="3-7% typical for engaged D2C list"/>
          <N label="Expected social reach" k="expectedSocialReach"/>
          <N label="Social conversion %" k="socialConversionRate" step={0.1} hint="0.3-1% typical for cold social → checkout"/>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Order economics</p>
        <div className="grid grid-cols-2 gap-4">
          <N label="Average Order Value (R)" k="averageOrderValue"/>
          <N label="Bundle ratio %" k="bundleRatio" hint="% of orders that include bundle products"/>
          <N label="Bundle AOV uplift %" k="bundleAOVUplift" hint="Bundles add 30-50% to AOV"/>
          <N label="Avg units per order" k="unitsPerOrder" step={0.1}/>
          <N label="Cost per unit (R)" k="costPerUnitR" hint="Manufacturing + shipping per unit"/>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Lead time</p>
        <div className="grid grid-cols-2 gap-4">
          <N label="Print lead time (days)" k="printLeadTimeDays" hint="Production → ready-to-ship"/>
          <N label="Shipping lead time (days)" k="shippingLeadTimeDays"/>
          <div>
            <label className={labelClass}>Drop date</label>
            <input type="date" className={inputClass} value={s.dropDate} onChange={(e) => set("dropDate")(e.target.value)}/>
          </div>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6" style={{ borderColor: `${COLOR}40` }}>
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Forecast</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-3 rounded-lg bg-surface-2">
            <p className="text-xs text-text-muted mb-1">Orders (list + social)</p>
            <p className="font-bold text-lg text-text-primary">{Math.round(calc.totalOrders).toLocaleString()}</p>
            <p className="text-[10px] text-text-muted">{Math.round(calc.baseListOrders)} + {Math.round(calc.socialOrders)}</p>
          </div>
          <div className="p-3 rounded-lg bg-surface-2">
            <p className="text-xs text-text-muted mb-1">Blended AOV</p>
            <p className="font-bold text-lg text-text-primary">{fmt(calc.blendedAOV)}</p>
          </div>
          <div className="p-3 rounded-lg bg-surface-2">
            <p className="text-xs text-text-muted mb-1">Total units to print</p>
            <p className="font-bold text-lg" style={{ color: COLOR }}>{Math.round(calc.totalUnits).toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-lg bg-surface-2">
            <p className="text-xs text-text-muted mb-1">Revenue</p>
            <p className="font-black text-xl" style={{ color: COLOR }}>{fmt(calc.totalRevenue)}</p>
          </div>
          <div className="p-3 rounded-lg bg-surface-2">
            <p className="text-xs text-text-muted mb-1">COGS</p>
            <p className="font-bold text-lg text-text-primary">−{fmt(calc.totalCOGS)}</p>
          </div>
          <div className="p-3 rounded-lg bg-surface-2 col-span-3">
            <p className="text-xs text-text-muted mb-1">Gross margin</p>
            <p className="font-black text-2xl" style={{ color: COLOR }}>{fmt(calc.grossMargin)} <span className="text-sm">({pct(calc.marginPct)})</span></p>
          </div>
        </div>

        <div className="mt-4 p-3 rounded-lg bg-surface-2">
          <p className="text-xs text-text-muted leading-relaxed">
            <span className="font-semibold text-text-primary">Print plan.</span> Print {Math.round(calc.totalUnits * 1.15).toLocaleString()} units (15% buffer for sizing variance + restocks). Order date: at least <span className="font-semibold text-text-primary">{s.printLeadTimeDays + s.shippingLeadTimeDays} days</span> before drop date.
          </p>
        </div>
      </section>

      <div className="glass-card rounded-2xl p-5 mt-6 flex items-start gap-3" style={{ borderColor: `${COLOR}20`, backgroundColor: `${COLOR}08` }}>
        <p className="text-xs text-text-muted leading-relaxed">
          <span className="font-semibold text-text-primary">Caveats.</span> Conversion rates are heuristics — back-test against your actual past drops in Tour Merch Settlement / Annual P&L. First drops typically run lower than these estimates; established artist drops can run 2-3× higher. Always plan with downside scenario in addition to base case.
        </p>
      </div>
    </ResourcePage>
  );
}
