"use client";
import { Plus, Trash2, RotateCcw } from "lucide-react";
import { ResourcePage, inputClass, labelClass, useLocalState } from "@/components/library/module-shell";
import { SaveButton } from "@/components/ui/save-button";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";

const COLOR = "#FB923C";
const STORAGE_KEY = "roster_tour_merch_settlement_v1";

interface Show {
  id: string;
  date: string; venue: string; city: string;
  grossSold: number;
  venueCutPct: number;
  cardFeesPct: number;
  cogs: number;
  sellerFee: number;
  comps: number;
  notes: string;
}

const newShow = (): Show => ({
  id: Math.random().toString(36).slice(2, 8),
  date: "", venue: "", city: "",
  grossSold: 0, venueCutPct: 25, cardFeesPct: 2.9, cogs: 0, sellerFee: 0, comps: 0, notes: "",
});

export default function TourMerchSettlementPage() {
  const [shows, setShows] = useLocalState<Show[]>(STORAGE_KEY, []);
  useToolRestore("tour-merch-settlement", STORAGE_KEY, setShows);
  const update = (id: string, p: Partial<Show>) => setShows(shows.map((s) => (s.id === id ? { ...s, ...p } : s)));
  const remove = (id: string) => setShows(shows.filter((s) => s.id !== id));

  const calc = (s: Show) => {
    const venue = (s.grossSold * s.venueCutPct) / 100;
    const card = (s.grossSold * s.cardFeesPct) / 100;
    const net = s.grossSold - venue - card - s.cogs - s.sellerFee;
    return { venue, card, net };
  };

  const totals = shows.reduce(
    (acc, s) => {
      const c = calc(s);
      return { gross: acc.gross + s.grossSold, venue: acc.venue + c.venue, card: acc.card + c.card, cogs: acc.cogs + s.cogs, fees: acc.fees + s.sellerFee, net: acc.net + c.net };
    },
    { gross: 0, venue: 0, card: 0, cogs: 0, fees: 0, net: 0 }
  );

  const fmt = (n: number) => `R${Math.round(n).toLocaleString()}`;

  return (
    <ResourcePage
      parentHref="/dashboard/library/merchandise"
      parentLabel="Back to Merchandise"
      color={COLOR}
      tag="Merch · Settlement"
      title="Tour Merch Settlement"
      intro="Per-show settlement vs. venue's typical 75/25 cut, less card fees, COGS and seller fees. Catches the gap between sold and net to artist."
      toolbar={<><SaveButton toolSlug="tour-merch-settlement" storageKey={STORAGE_KEY} title={`Tour Merch Settlement — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
          
        <>
          <button onClick={() => setShows([...shows, newShow()])} className="text-xs font-semibold inline-flex items-center gap-1 px-3 py-1.5 rounded-lg" style={{ backgroundColor: `${COLOR}15`, color: COLOR }}><Plus size={13}/> Add show</button>
          <button onClick={() => setShows([])} className="text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1"><RotateCcw size={13}/> Clear</button>
        </>
            </>
      }
      next={{ href: "/dashboard/library/merchandise/drop-capacity-planner", label: "Drop Capacity Planner" }}
    >
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <div className="glass-card rounded-xl p-3 text-center"><p className="text-xs text-text-muted mb-1">Shows</p><p className="font-bold">{shows.length}</p></div>
        <div className="glass-card rounded-xl p-3 text-center"><p className="text-xs text-text-muted mb-1">Gross sold</p><p className="font-bold">{fmt(totals.gross)}</p></div>
        <div className="glass-card rounded-xl p-3 text-center"><p className="text-xs text-text-muted mb-1">Venue cut</p><p className="font-bold">−{fmt(totals.venue)}</p></div>
        <div className="glass-card rounded-xl p-3 text-center"><p className="text-xs text-text-muted mb-1">COGS + fees</p><p className="font-bold">−{fmt(totals.cogs + totals.card + totals.fees)}</p></div>
        <div className="glass-card rounded-xl p-3 text-center" style={{ borderColor: `${COLOR}40` }}><p className="text-xs text-text-muted mb-1">Net to artist</p><p className="font-black text-lg" style={{ color: COLOR }}>{fmt(totals.net)}</p></div>
      </div>

      {shows.length === 0 && <div className="glass-card rounded-2xl p-12 text-center text-text-muted text-sm">Add a show to start.</div>}

      <div className="space-y-3">
        {shows.map((s) => {
          const c = calc(s);
          return (
            <div key={s.id} className="glass-card rounded-2xl p-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-2">
                <div><label className={labelClass}>Date</label><input type="date" className={inputClass} value={s.date} onChange={(e) => update(s.id, { date: e.target.value })}/></div>
                <div><label className={labelClass}>Venue</label><input className={inputClass} value={s.venue} onChange={(e) => update(s.id, { venue: e.target.value })}/></div>
                <div><label className={labelClass}>City</label><input className={inputClass} value={s.city} onChange={(e) => update(s.id, { city: e.target.value })}/></div>
                <div><label className={labelClass}>Gross sold (incl. tax)</label><input type="number" className={inputClass} value={s.grossSold} onChange={(e) => update(s.id, { grossSold: Number(e.target.value) || 0 })}/></div>
                <div><label className={labelClass}>Venue cut %</label><input type="number" className={inputClass} value={s.venueCutPct} onChange={(e) => update(s.id, { venueCutPct: Number(e.target.value) || 0 })}/></div>
                <div><label className={labelClass}>Card fees %</label><input type="number" step="0.1" className={inputClass} value={s.cardFeesPct} onChange={(e) => update(s.id, { cardFeesPct: Number(e.target.value) || 0 })}/></div>
                <div><label className={labelClass}>COGS for show</label><input type="number" className={inputClass} value={s.cogs} onChange={(e) => update(s.id, { cogs: Number(e.target.value) || 0 })}/></div>
                <div><label className={labelClass}>Seller fee</label><input type="number" className={inputClass} value={s.sellerFee} onChange={(e) => update(s.id, { sellerFee: Number(e.target.value) || 0 })}/></div>
                <div className="col-span-2 sm:col-span-4 text-xs text-text-muted">
                  Venue cut: <span className="font-bold text-text-primary">{fmt(c.venue)}</span> · Card: <span className="font-bold text-text-primary">{fmt(c.card)}</span> · <span className="font-bold" style={{ color: COLOR }}>Net to artist: {fmt(c.net)}</span>
                </div>
                <div className="col-span-2 sm:col-span-4">
                  <label className={labelClass}>Notes</label>
                  <textarea className={inputClass} rows={2} value={s.notes} onChange={(e) => update(s.id, { notes: e.target.value })} placeholder="Bundle deals, comps, disputes"/>
                </div>
              </div>
              <button onClick={() => remove(s.id)} className="text-xs text-red-400 hover:text-red-300 inline-flex items-center gap-1"><Trash2 size={12}/> Remove</button>
            </div>
          );
        })}
      </div>
    </ResourcePage>
  );
}
