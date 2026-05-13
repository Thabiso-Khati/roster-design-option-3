"use client";
import { useMemo } from "react";
import { Plus, Trash2, Globe, Receipt, FileDown } from "lucide-react";
import {
  ResourcePage,
  inputClass,
  labelClass,
  useLocalState,
} from "@/components/library/module-shell";
import { useLocale } from "@/context/locale-context";
import { SaveButton } from "@/components/ui/save-button";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";

const COLOR = "#EC4899";

// ── Reference WHT rates by country (statutory rate on foreign performer income) ─
// Rates are typical statutory withholding on entertainer / performance fees.
// DTA rates may be lower — always check the relevant treaty.
const STATUTORY_WHT: Record<string, { rate: number; authority: string; notes: string }> = {
  "United States":   { rate: 30, authority: "IRS Form 1042-S",    notes: "30% on US-source performance fees. Reduce to 0% for treaty-resident artists via Form 8233 + ITIN. SA / NG / GH have no DTA reduction; UK / France / Italy / Australia do." },
  "United Kingdom":  { rate: 20, authority: "HMRC FEU",            notes: "20% under Foreign Entertainers Unit. Reducible-rate certificate for 'tour profit' calculation; net basis available where expenses can be evidenced." },
  "France":          { rate: 15, authority: "DGFIP",               notes: "15% (or treaty rate). DTA applies for SA, UK, US, Canada, Senegal, Côte d'Ivoire, Cameroon, Algeria, Tunisia." },
  "Germany":         { rate: 15, authority: "BZSt",                notes: "15.825% incl. solidarity surcharge. Refund applications via ELSTER under DTA where applicable." },
  "Italy":           { rate: 30, authority: "Agenzia delle Entrate", notes: "30% on artist performance fees. DTA reduction available." },
  "Spain":           { rate: 24, authority: "AEAT",                notes: "24% (19% for EU/EEA residents). DTA reduction varies." },
  "Netherlands":     { rate: 20, authority: "Belastingdienst",     notes: "20% — but exemption for residents of countries with DTA (most African + Anglo markets)." },
  "Belgium":         { rate: 18, authority: "FPS Finance",         notes: "18% on artist fees. DTA reduces or exempts in many cases." },
  "Australia":       { rate: 30, authority: "ATO",                 notes: "30% standard, or treaty rate. SA / NG / KE / UK have DTAs reducing to 0–15%." },
  "Canada":          { rate: 15, authority: "CRA Regulation 105",  notes: "15% on Canadian-source performance income; waiver via R105 application possible." },
  "Japan":           { rate: 20, authority: "NTA",                 notes: "20.42% incl. surtax. DTA reduces (e.g. UK 20%, US 0% for short tours)." },
  "South Africa":    { rate: 15, authority: "SARS",                notes: "15% on foreign entertainers performing in SA. Promoter remits via WTI." },
  "Nigeria":         { rate: 10, authority: "FIRS",                notes: "10% on royalties / non-resident performance. Reciprocal DTA reclaim via UK, France, China." },
  "Ghana":           { rate: 20, authority: "GRA",                 notes: "20% withholding on Ghana-source performance for non-residents. DTA reclaim where treaty (UK, France, Italy)." },
  "Kenya":           { rate: 20, authority: "KRA",                 notes: "20% WHT on Kenya-source performance income. DTA reclaim where treaty (UK, France, India, etc.)." },
  "Egypt":           { rate: 20, authority: "ETA",                 notes: "20% WHT on performance income. DTA relief possible." },
  "Morocco":         { rate: 10, authority: "DGI",                 notes: "10% WHT on performance fees." },
  "Tanzania":        { rate: 15, authority: "TRA",                 notes: "15% WHT on Tanzania-source performance income." },
  "Senegal":         { rate: 20, authority: "DGID",                notes: "20% WHT on Senegal-source performance income." },
  "Uganda":          { rate: 15, authority: "URA",                 notes: "15% WHT on Uganda-source performance income." },
  "Zimbabwe":        { rate: 15, authority: "ZIMRA",               notes: "15% WHT on Zimbabwe-source entertainment income." },
  "Côte d'Ivoire":   { rate: 25, authority: "DGI",                 notes: "25% WHT on performance fees. Reduced under France / UEMOA treaties." },
  "Cameroon":        { rate: 15, authority: "DGI",                 notes: "15% WHT on Cameroon-source performance income." },
  "Algeria":         { rate: 24, authority: "DGI",                 notes: "24% WHT on royalties / artist fees." },
  "Angola":          { rate: 10, authority: "AGT",                 notes: "10% WHT on Angola-source performance income." },
  "Ethiopia":        { rate: 10, authority: "MOR",                 notes: "10% WHT on Ethiopia-source performance income." },
};

const REFERENCE_COUNTRIES = Object.keys(STATUTORY_WHT).sort();

interface ShowRow {
  id: string;
  date: string;
  venue: string;
  country: string;
  grossFee: number;
  withheldRate: number;
  withheldAmount: number;
  reclaimStatus: "Pending" | "DTA filed" | "Refund received" | "Not eligible";
  certNumber: string;
  notes: string;
}

const blankRow = (): ShowRow => ({
  id: crypto.randomUUID(),
  date: "",
  venue: "",
  country: "United Kingdom",
  grossFee: 0,
  withheldRate: 20,
  withheldAmount: 0,
  reclaimStatus: "Pending",
  certNumber: "",
  notes: "",
});

const STATUS_COLORS: Record<ShowRow["reclaimStatus"], string> = {
  "Pending":          "#F59E0B",
  "DTA filed":        "#3B82F6",
  "Refund received":  "#10B981",
  "Not eligible":     "#94A3B8",
};

export default function WhtTrackerPage() {
  const { country: home, sym, fmt } = useLocale();
  const [rows, setRows] = useLocalState<ShowRow[]>("roster_wht_tracker_v1", []);
  useToolRestore("wht-tracker", "roster_wht_tracker_v1", setRows);

  const totals = useMemo(() => {
    const grossFee = rows.reduce((a, r) => a + (r.grossFee || 0), 0);
    const withheld = rows.reduce((a, r) => a + (r.withheldAmount || 0), 0);
    const reclaimed = rows.filter((r) => r.reclaimStatus === "Refund received")
                          .reduce((a, r) => a + (r.withheldAmount || 0), 0);
    const outstanding = rows
      .filter((r) => r.reclaimStatus === "Pending" || r.reclaimStatus === "DTA filed")
      .reduce((a, r) => a + (r.withheldAmount || 0), 0);
    return { grossFee, withheld, reclaimed, outstanding };
  }, [rows]);

  function addRow() {
    setRows((prev) => [blankRow(), ...prev]);
  }

  function updateRow(id: string, patch: Partial<ShowRow>) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const next = { ...r, ...patch };
        // Auto-recompute withheld amount if fee or rate changed
        if (patch.grossFee !== undefined || patch.withheldRate !== undefined) {
          next.withheldAmount = Math.round((next.grossFee * next.withheldRate) / 100);
        }
        // Auto-fill rate when country changes
        if (patch.country !== undefined) {
          const ref = STATUTORY_WHT[patch.country];
          if (ref) {
            next.withheldRate = ref.rate;
            next.withheldAmount = Math.round((next.grossFee * ref.rate) / 100);
          }
        }
        return next;
      }),
    );
  }

  function removeRow(id: string) {
    if (!confirm("Delete this show entry?")) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  function exportCsv() {
    const headers = ["Date", "Venue", "Country", `Gross fee (${sym})`, "WHT %", `WHT amount (${sym})`, "Reclaim status", "DTA cert #", "Notes"];
    const lines = [
      headers.join(","),
      ...rows.map((r) => [
        r.date,
        `"${r.venue.replace(/"/g, '""')}"`,
        r.country,
        r.grossFee,
        r.withheldRate,
        r.withheldAmount,
        r.reclaimStatus,
        `"${r.certNumber.replace(/"/g, '""')}"`,
        `"${r.notes.replace(/"/g, '""')}"`,
      ].join(",")),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `wht-tracker-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <ResourcePage
      parentHref="/dashboard/library/money"
      parentLabel="Back to Finance and Tax"
      color={COLOR}
      tag={`Finance · WHT Tracker (${home})`}
      title="Withholding Tax Tracker"
      intro="Capture every show where foreign WHT was deducted at source. Track gross fee, withholding rate, DTA reclaim status, and certificate numbers. Tax-authority-ready export. Use alongside the Tax Calendar to forecast your tour-profit position."
      toolbar={<><SaveButton toolSlug="wht-tracker" storageKey={"roster_wht_tracker_v1"} title={`Withholding Tax Tracker — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
          
        <>
          <button
            onClick={addRow}
            className="text-sm font-semibold inline-flex items-center gap-1.5 px-4 py-2 rounded-lg"
            style={{ backgroundColor: COLOR, color: "white" }}
          >
            <Plus size={14} /> Add show
          </button>
          {rows.length > 0 && (
            <button
              onClick={exportCsv}
              className="text-sm font-semibold inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border text-text-primary hover:bg-surface-2"
            >
              <FileDown size={14} /> Export CSV
            </button>
          )}
        </>
            </>
      }
      next={{ href: "/dashboard/library/money/vat-decision", label: "VAT Decision Tool" }}
    >
      {/* Totals strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <SummaryCard label="Gross fees"      value={fmt(totals.grossFee)}      color={COLOR} />
        <SummaryCard label="Withheld total"  value={fmt(totals.withheld)}      color="#EF4444" />
        <SummaryCard label="Reclaimed"       value={fmt(totals.reclaimed)}     color="#10B981" />
        <SummaryCard label="Outstanding"     value={fmt(totals.outstanding)}   color="#F59E0B" />
      </div>

      {rows.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Receipt size={28} className="mx-auto mb-3 opacity-40" style={{ color: COLOR }} />
          <p className="font-bold text-text-primary mb-1">No shows logged yet</p>
          <p className="text-sm text-text-muted mb-4">Add a show to start tracking foreign WHT and DTA reclaims.</p>
          <button
            onClick={addRow}
            className="text-sm font-semibold inline-flex items-center gap-1.5 px-4 py-2 rounded-lg"
            style={{ backgroundColor: COLOR, color: "white" }}
          >
            <Plus size={14} /> Add first show
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => {
            const ref = STATUTORY_WHT[r.country];
            const netToArtist = r.grossFee - r.withheldAmount;
            return (
              <div key={r.id} className="glass-card rounded-2xl p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <Globe size={16} style={{ color: COLOR }} />
                    <p className="font-bold text-sm text-text-primary">
                      {r.venue || "(unnamed venue)"}
                      {r.country && <span className="text-text-muted font-normal"> · {r.country}</span>}
                    </p>
                    <span
                      className="text-[10px] font-black uppercase px-2 py-0.5 rounded"
                      style={{
                        color: STATUS_COLORS[r.reclaimStatus],
                        backgroundColor: `${STATUS_COLORS[r.reclaimStatus]}15`,
                      }}
                    >
                      {r.reclaimStatus}
                    </span>
                  </div>
                  <button
                    onClick={() => removeRow(r.id)}
                    className="text-xs text-red-400 hover:text-red-300 inline-flex items-center gap-1"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className={labelClass}>Show date</label>
                    <input type="date" className={inputClass} value={r.date} onChange={(e) => updateRow(r.id, { date: e.target.value })} />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelClass}>Venue / festival</label>
                    <input className={inputClass} placeholder="O2 Arena · Coachella · The Apollo" value={r.venue} onChange={(e) => updateRow(r.id, { venue: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClass}>Source country</label>
                    <select className={inputClass} value={r.country} onChange={(e) => updateRow(r.id, { country: e.target.value })}>
                      {REFERENCE_COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Gross fee ({sym})</label>
                    <input type="number" className={inputClass} value={r.grossFee || ""} onChange={(e) => updateRow(r.id, { grossFee: Number(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <label className={labelClass}>WHT rate (%)</label>
                    <input type="number" step="0.01" className={inputClass} value={r.withheldRate || ""} onChange={(e) => updateRow(r.id, { withheldRate: Number(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <label className={labelClass}>WHT amount ({sym}) — auto</label>
                    <input className={inputClass} value={r.withheldAmount.toLocaleString()} readOnly style={{ opacity: 0.7 }} />
                  </div>
                  <div>
                    <label className={labelClass}>Net to artist ({sym})</label>
                    <input className={inputClass} value={netToArtist.toLocaleString()} readOnly style={{ opacity: 0.7 }} />
                  </div>
                  <div>
                    <label className={labelClass}>Reclaim status</label>
                    <select className={inputClass} value={r.reclaimStatus} onChange={(e) => updateRow(r.id, { reclaimStatus: e.target.value as ShowRow["reclaimStatus"] })}>
                      <option>Pending</option>
                      <option>DTA filed</option>
                      <option>Refund received</option>
                      <option>Not eligible</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>DTA / cert #</label>
                    <input className={inputClass} placeholder="HMRC ref / IRS cert / etc." value={r.certNumber} onChange={(e) => updateRow(r.id, { certNumber: e.target.value })} />
                  </div>
                  <div className="md:col-span-3">
                    <label className={labelClass}>Notes</label>
                    <input className={inputClass} placeholder="Promoter, agent rate, refund route, etc." value={r.notes} onChange={(e) => updateRow(r.id, { notes: e.target.value })} />
                  </div>
                </div>

                {ref && (
                  <div className="text-[11px] text-text-muted leading-relaxed border-t border-border pt-3 mt-1">
                    <span className="font-semibold text-text-primary">{r.country} — statutory rate {ref.rate}%</span>
                    {" · "}
                    <span>Authority: {ref.authority}</span>
                    {" · "}
                    <span>{ref.notes}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div
        className="glass-card rounded-2xl p-5 mt-6 flex items-start gap-3"
        style={{ borderColor: "rgba(236,72,153,0.20)", backgroundColor: "rgba(236,72,153,0.04)" }}
      >
        <span className="text-base flex-shrink-0">⚠️</span>
        <p className="text-xs text-text-muted leading-relaxed">
          Statutory WHT rates change. The reference rates above are typical 2025/2026 numbers — always confirm with the source-country revenue authority and your DTA-aware tax adviser before filing reclaims. Keep promoter contracts, signed cert copies, and gross/net statements together with each entry. Most reclaims have a strict deadline (HMRC: 4 years; IRS: 3 years; SARS DTA: 3 years).
        </p>
      </div>
    </ResourcePage>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="glass-card rounded-xl p-4">
      <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color }}>{label}</p>
      <p className="text-lg font-black text-text-primary">{value}</p>
    </div>
  );
}
