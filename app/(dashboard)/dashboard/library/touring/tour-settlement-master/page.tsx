"use client";
import { Plus, Trash2, RotateCcw } from "lucide-react";
import { ResourcePage, inputClass, labelClass, useLocalState } from "@/components/library/module-shell";
import { useLocale } from "@/context/locale-context";
import { SaveButton } from "@/components/ui/save-button";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";

const COLOR = "#F59E0B";
const STORAGE_KEY = "roster_tour_settlement_master_v1";

interface Show {
  id: string;
  date: string;
  city: string;
  venue: string;
  capacity: number;
  ticketsSold: number;
  guarantee: number;
  overage: number;
  expensesPaidByPromoter: number;
  artistGross: number;
  withholding: number;
  artistNet: number;
  notes: string;
}

const newShow = (): Show => ({
  id: Math.random().toString(36).slice(2, 8),
  date: "", city: "", venue: "", capacity: 0, ticketsSold: 0,
  guarantee: 0, overage: 0, expensesPaidByPromoter: 0,
  artistGross: 0, withholding: 0, artistNet: 0, notes: "",
});

export default function TourSettlementMasterPage() {
  const { sym } = useLocale();
  const [shows, setShows] = useLocalState<Show[]>(STORAGE_KEY, []);
  useToolRestore("tour-settlement-master", STORAGE_KEY, setShows);
  const update = (id: string, patch: Partial<Show>) =>
    setShows(shows.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const remove = (id: string) => setShows(shows.filter((s) => s.id !== id));

  const totals = shows.reduce(
    (acc, s) => ({
      capacity: acc.capacity + s.capacity,
      sold: acc.sold + s.ticketsSold,
      guarantee: acc.guarantee + s.guarantee,
      overage: acc.overage + s.overage,
      expenses: acc.expenses + s.expensesPaidByPromoter,
      gross: acc.gross + s.artistGross,
      withholding: acc.withholding + s.withholding,
      net: acc.net + s.artistNet,
    }),
    { capacity: 0, sold: 0, guarantee: 0, overage: 0, expenses: 0, gross: 0, withholding: 0, net: 0 }
  );

  const fmt = (n: number) => `${sym}${Math.round(n).toLocaleString()}`;
  const utilPct = totals.capacity ? Math.round((totals.sold / totals.capacity) * 100) : 0;

  return (
    <ResourcePage
      parentHref="/dashboard/library/touring"
      parentLabel="Back to Live, Touring & Festivals"
      color={COLOR}
      tag="Live · Tour Roll-Up"
      title="Tour Settlement Master Sheet"
      intro="Multi-show roll-up — capacity utilisation, tour gross, withholding tax, net to artist. Use Show Settlement Sheet for individual shows; this aggregates."
      toolbar={<><SaveButton toolSlug="tour-settlement-master" storageKey={STORAGE_KEY} title={`Tour Settlement Master — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
          
        <>
          <button onClick={() => setShows([...shows, newShow()])} className="text-xs font-semibold inline-flex items-center gap-1 px-3 py-1.5 rounded-lg" style={{ backgroundColor: `${COLOR}15`, color: COLOR }}>
            <Plus size={13}/> Add show
          </button>
          <button onClick={() => setShows([])} className="text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1"><RotateCcw size={13}/> Clear</button>
        </>
            </>
      }
    >
      <div className="glass-card rounded-2xl p-6 mb-6" style={{ borderColor: `${COLOR}40` }}>
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Tour totals</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div><p className="text-text-muted text-xs mb-1">Shows</p><p className="font-bold text-text-primary text-lg">{shows.length}</p></div>
          <div><p className="text-text-muted text-xs mb-1">Tickets sold</p><p className="font-bold text-text-primary text-lg">{totals.sold.toLocaleString()} <span className="text-xs text-text-muted font-normal">({utilPct}%)</span></p></div>
          <div><p className="text-text-muted text-xs mb-1">Total guarantees</p><p className="font-bold text-text-primary">{fmt(totals.guarantee)}</p></div>
          <div><p className="text-text-muted text-xs mb-1">Total overage</p><p className="font-bold text-text-primary">{fmt(totals.overage)}</p></div>
          <div><p className="text-text-muted text-xs mb-1">Artist gross</p><p className="font-bold text-text-primary">{fmt(totals.gross)}</p></div>
          <div><p className="text-text-muted text-xs mb-1">WHT total</p><p className="font-bold text-text-primary">−{fmt(totals.withholding)}</p></div>
          <div><p className="text-text-muted text-xs mb-1" style={{ color: COLOR }}>Artist net</p><p className="font-black text-2xl" style={{ color: COLOR }}>{fmt(totals.net)}</p></div>
        </div>
      </div>

      {shows.length === 0 && (
        <div className="glass-card rounded-2xl p-12 text-center text-text-muted text-sm">No shows yet. Click <span className="font-semibold text-brand">Add show</span> to start.</div>
      )}

      <div className="space-y-3">
        {shows.map((s) => (
          <div key={s.id} className="glass-card rounded-2xl p-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              <div><label className={labelClass}>Date</label><input type="date" className={inputClass} value={s.date} onChange={(e) => update(s.id, { date: e.target.value })}/></div>
              <div><label className={labelClass}>City</label><input className={inputClass} value={s.city} onChange={(e) => update(s.id, { city: e.target.value })}/></div>
              <div><label className={labelClass}>Venue</label><input className={inputClass} value={s.venue} onChange={(e) => update(s.id, { venue: e.target.value })}/></div>
              <div><label className={labelClass}>Capacity</label><input type="number" className={inputClass} value={s.capacity} onChange={(e) => update(s.id, { capacity: Number(e.target.value) || 0 })}/></div>
              <div><label className={labelClass}>Tickets sold</label><input type="number" className={inputClass} value={s.ticketsSold} onChange={(e) => update(s.id, { ticketsSold: Number(e.target.value) || 0 })}/></div>
              <div><label className={labelClass}>Guarantee</label><input type="number" className={inputClass} value={s.guarantee} onChange={(e) => update(s.id, { guarantee: Number(e.target.value) || 0 })}/></div>
              <div><label className={labelClass}>Overage</label><input type="number" className={inputClass} value={s.overage} onChange={(e) => update(s.id, { overage: Number(e.target.value) || 0 })}/></div>
              <div><label className={labelClass}>Promoter expenses</label><input type="number" className={inputClass} value={s.expensesPaidByPromoter} onChange={(e) => update(s.id, { expensesPaidByPromoter: Number(e.target.value) || 0 })}/></div>
              <div><label className={labelClass}>Artist gross</label><input type="number" className={inputClass} value={s.artistGross} onChange={(e) => update(s.id, { artistGross: Number(e.target.value) || 0 })}/></div>
              <div><label className={labelClass}>WHT</label><input type="number" className={inputClass} value={s.withholding} onChange={(e) => update(s.id, { withholding: Number(e.target.value) || 0 })}/></div>
              <div><label className={labelClass}>Artist net</label><input type="number" className={inputClass} value={s.artistNet} onChange={(e) => update(s.id, { artistNet: Number(e.target.value) || 0 })}/></div>
              <div></div>
              <div className="col-span-4">
                <label className={labelClass}>Notes</label>
                <textarea className={inputClass} rows={2} value={s.notes} onChange={(e) => update(s.id, { notes: e.target.value })}/>
              </div>
            </div>
            <button onClick={() => remove(s.id)} className="text-xs text-red-400 hover:text-red-300 inline-flex items-center gap-1"><Trash2 size={12}/> Remove</button>
          </div>
        ))}
      </div>
    </ResourcePage>
  );
}
