"use client";
import { Printer, RotateCcw } from "lucide-react";
import { ResourcePage, inputClass, labelClass, useLocalState } from "@/components/library/module-shell";
import { useLocale } from "@/context/locale-context";
import { SaveButton } from "@/components/ui/save-button";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";

const COLOR = "#F59E0B";
const STORAGE_KEY = "roster_show_settlement_v1";

interface State {
  artist: string; venue: string; promoter: string; date: string; capacity: number;
  ticketGADoor: number; ticketGAAdvance: number; ticketVIPDoor: number; ticketVIPAdvance: number;
  comps: number; ticketsSoldGA: number; ticketsSoldVIP: number;
  guaranteeAmount: number;
  splitPctArtist: number;
  expRent: number; expSound: number; expLight: number; expSecurity: number; expMarketing: number;
  expCatering: number; expHotel: number; expBackline: number; expOther: number;
  withholdingTaxPct: number;
  notes: string;
}

const empty: State = {
  artist: "", venue: "", promoter: "", date: "", capacity: 1000,
  ticketGADoor: 350, ticketGAAdvance: 250, ticketVIPDoor: 800, ticketVIPAdvance: 600,
  comps: 50, ticketsSoldGA: 0, ticketsSoldVIP: 0,
  guaranteeAmount: 0,
  splitPctArtist: 85,
  expRent: 0, expSound: 0, expLight: 0, expSecurity: 0, expMarketing: 0,
  expCatering: 0, expHotel: 0, expBackline: 0, expOther: 0,
  withholdingTaxPct: 0,
  notes: "",
};

export default function ShowSettlementSheetPage() {
  const { sym } = useLocale();
  const [s, setS] = useLocalState<State>(STORAGE_KEY, empty);
  useToolRestore("show-settlement-sheet", STORAGE_KEY, setS);
  const num = (k: keyof State) => (v: string) => setS({ ...s, [k]: Number(v) || 0 });
  const txt = (k: keyof State) => (v: string) => setS({ ...s, [k]: v });

  // Gross (assume advance + door blend ~70/30)
  const gaRev = s.ticketsSoldGA * (s.ticketGAAdvance * 0.7 + s.ticketGADoor * 0.3);
  const vipRev = s.ticketsSoldVIP * (s.ticketVIPAdvance * 0.7 + s.ticketVIPDoor * 0.3);
  const grossBoxOffice = gaRev + vipRev;

  const totalExpenses = s.expRent + s.expSound + s.expLight + s.expSecurity + s.expMarketing + s.expCatering + s.expHotel + s.expBackline + s.expOther;
  const netBoxOffice = grossBoxOffice - totalExpenses;
  const overGuarantee = Math.max(0, netBoxOffice - s.guaranteeAmount);
  const artistShare = s.guaranteeAmount + (overGuarantee * s.splitPctArtist) / 100;
  const promoterShare = totalExpenses + (overGuarantee * (100 - s.splitPctArtist)) / 100;
  const wht = (artistShare * s.withholdingTaxPct) / 100;
  const artistNet = artistShare - wht;

  const fmt = (n: number) => `${sym}${Math.round(n).toLocaleString()}`;

  const NumF = ({ label, k, hint }: { label: string; k: keyof State; hint?: string }) => (
    <div>
      <label className={labelClass}>{label}</label>
      <input type="number" className={inputClass} value={s[k] as number} onChange={(e) => num(k)(e.target.value)} />
      {hint && <p className="text-[10px] text-text-muted mt-1">{hint}</p>}
    </div>
  );

  const TxtF = ({ label, k }: { label: string; k: keyof State }) => (
    <div>
      <label className={labelClass}>{label}</label>
      <input className={inputClass} value={s[k] as string} onChange={(e) => txt(k)(e.target.value)} />
    </div>
  );

  return (
    <ResourcePage
      parentHref="/dashboard/library/touring"
      parentLabel="Back to Live, Touring & Festivals"
      color={COLOR}
      tag="Live · Settlement"
      title="Show Settlement Sheet"
      intro="Post-show financial reconciliation. Run with the promoter on settlement night before signing off. Catches the difference between the show that sold out and the show you got paid for."
      toolbar={<><SaveButton toolSlug="show-settlement-sheet" storageKey={STORAGE_KEY} title={`Show Settlement Sheet — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
          
        <>
          <button onClick={() => setS(empty)} className="text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1"><RotateCcw size={13}/> Reset</button>
          <button onClick={() => window.print()} className="text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1"><Printer size={13}/> Print / PDF</button>
        </>
            </>
      }
      next={{ href: "/dashboard/library/touring/tour-settlement-master", label: "Tour Settlement Master" }}
    >
      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Show</p>
        <div className="grid grid-cols-2 gap-4">
          <TxtF label="Artist" k="artist"/><TxtF label="Venue" k="venue"/>
          <TxtF label="Promoter" k="promoter"/><TxtF label="Date" k="date"/>
          <NumF label="Capacity" k="capacity"/><NumF label="Comps" k="comps"/>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Tickets</p>
        <div className="grid grid-cols-2 gap-4">
          <NumF label="GA price (advance)" k="ticketGAAdvance"/><NumF label="GA price (door)" k="ticketGADoor"/>
          <NumF label="VIP price (advance)" k="ticketVIPAdvance"/><NumF label="VIP price (door)" k="ticketVIPDoor"/>
          <NumF label="GA tickets sold" k="ticketsSoldGA"/><NumF label="VIP tickets sold" k="ticketsSoldVIP"/>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Deal</p>
        <div className="grid grid-cols-2 gap-4">
          <NumF label="Guarantee" k="guaranteeAmount" hint="Floor — paid before splits"/>
          <NumF label="Artist split %" k="splitPctArtist" hint="% of overage to artist"/>
          <NumF label="Withholding tax %" k="withholdingTaxPct" hint="Country-specific (UK, US, etc.)"/>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Promoter Expenses (verified at settlement)</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <NumF label="Venue rent" k="expRent"/><NumF label="Sound" k="expSound"/><NumF label="Lighting" k="expLight"/>
          <NumF label="Security" k="expSecurity"/><NumF label="Marketing" k="expMarketing"/><NumF label="Catering" k="expCatering"/>
          <NumF label="Hotels" k="expHotel"/><NumF label="Backline" k="expBackline"/><NumF label="Other" k="expOther"/>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6" style={{ borderColor: `${COLOR}40` }}>
        <p className="text-[11px] font-black uppercase tracking-widest mb-3" style={{ color: COLOR }}>Settlement</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-text-muted">Gross box office</span><span className="font-semibold">{fmt(grossBoxOffice)}</span></div>
          <div className="flex justify-between"><span className="text-text-muted">Less promoter expenses</span><span className="font-semibold">−{fmt(totalExpenses)}</span></div>
          <div className="flex justify-between border-t border-border pt-2"><span className="text-text-muted">Net box office</span><span className="font-semibold">{fmt(netBoxOffice)}</span></div>
          <div className="flex justify-between"><span className="text-text-muted">Less guarantee floor</span><span className="font-semibold">−{fmt(s.guaranteeAmount)}</span></div>
          <div className="flex justify-between"><span className="text-text-muted">Overage</span><span className="font-semibold">{fmt(overGuarantee)}</span></div>
          <div className="flex justify-between"><span className="text-text-muted">Artist share of overage ({s.splitPctArtist}%)</span><span className="font-semibold">{fmt((overGuarantee * s.splitPctArtist) / 100)}</span></div>
          <div className="flex justify-between border-t border-border pt-2"><span className="text-text-muted">Artist gross before WHT</span><span className="font-bold">{fmt(artistShare)}</span></div>
          <div className="flex justify-between"><span className="text-text-muted">Withholding tax ({s.withholdingTaxPct}%)</span><span className="font-semibold">−{fmt(wht)}</span></div>
          <div className="flex justify-between text-lg pt-3 mt-3 border-t border-border" style={{ color: COLOR }}>
            <span className="font-black">Artist net payable</span><span className="font-black">{fmt(artistNet)}</span>
          </div>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-3" style={{ color: COLOR }}>Settlement notes</p>
        <textarea className={inputClass} rows={3} value={s.notes} onChange={(e) => txt("notes")(e.target.value)} placeholder="Disputed line items, promoter agreement points, side letters"/>
      </section>
    </ResourcePage>
  );
}
