"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus, Trash2, RotateCcw } from "lucide-react";
import { SaveButton } from "@/components/ui/save-button";
import { ExportButton } from "@/components/ui/export-button";

const STORAGE_KEY = "roster_tour_itinerary_v1";
const COLOR = "#10B981";

type RowType = "travel" | "show" | "accom" | "rest" | "promo" | "other";

interface Row {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  type: RowType;
  activity: string;
  depart: string;
  arrive: string;
  venue: string;
  km: string;
  notes: string;
}

const ROW_TYPES: { id: RowType; label: string; color: string; emoji: string }[] = [
  { id: "travel", label: "Travel", color: "#3B82F6", emoji: "🔵" },
  { id: "show", label: "Show", color: "#EF4444", emoji: "🔴" },
  { id: "accom", label: "Accommodation", color: "#6B7280", emoji: "⬜" },
  { id: "promo", label: "Promo / Media", color: "#8B5CF6", emoji: "🟣" },
  { id: "rest", label: "Rest Day", color: "#10B981", emoji: "🟢" },
  { id: "other", label: "Other", color: "#F59E0B", emoji: "🟡" },
];

const uid = () => Math.random().toString(36).slice(2, 9);

const defaultRows = (): Row[] => [
  { id: uid(), date: "", startTime: "07:00", endTime: "14:00", type: "travel", activity: "Drive to venue city", depart: "", arrive: "", venue: "", km: "", notes: "" },
  { id: uid(), date: "", startTime: "15:00", endTime: "", type: "accom", activity: "Check in", depart: "", arrive: "", venue: "", km: "", notes: "" },
  { id: uid(), date: "", startTime: "16:00", endTime: "17:30", type: "show", activity: "Load-in & Soundcheck", depart: "", arrive: "", venue: "", km: "", notes: "" },
  { id: uid(), date: "", startTime: "20:00", endTime: "21:30", type: "show", activity: "Performance", depart: "", arrive: "", venue: "", km: "", notes: "" },
];

interface StoredState { rows: Row[]; tourName: string; artist: string }

export default function TourItineraryPage() {
  const handleExportPDF = () => { window.print(); };
  const [rows, setRows] = useState<Row[]>(defaultRows());
  const [tourName, setTourName] = useState("");
  const [artist, setArtist] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const d: StoredState = JSON.parse(raw);
        if (d.rows) setRows(d.rows);
        if (d.tourName) setTourName(d.tourName);
        if (d.artist) setArtist(d.artist);
        return;
      }
    } catch {}
    fetch(`/api/tools/save?slug=tour-itinerary`)
      .then(r => r.json())
      .then(({ snapshot }) => {
        if (!snapshot?.data) return;
        const d = snapshot.data as StoredState;
        if (d.rows) setRows(d.rows);
        if (d.tourName) setTourName(d.tourName);
        if (d.artist) setArtist(d.artist);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {}
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const save = useCallback((r: Row[], t: string, a: string) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ rows: r, tourName: t, artist: a }));
  }, []);

  const updateRow = (id: string, key: keyof Row, val: string) => {
    setRows(prev => {
      const next = prev.map(r => r.id === id ? { ...r, [key]: val } : r);
      save(next, tourName, artist);
      return next;
    });
  };

  const addRow = () => {
    setRows(prev => {
      const next = [...prev, { id: uid(), date: "", startTime: "", endTime: "", type: "other" as RowType, activity: "", depart: "", arrive: "", venue: "", km: "", notes: "" }];
      save(next, tourName, artist);
      return next;
    });
  };

  const removeRow = (id: string) => {
    setRows(prev => {
      const next = prev.filter(r => r.id !== id);
      save(next, tourName, artist);
      return next;
    });
  };

  const handleReset = () => {
    if (confirm("Reset the entire itinerary? This cannot be undone.")) {
      const r = defaultRows();
      setRows(r);
      setTourName("");
      setArtist("");
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const getTypeInfo = (type: RowType) => ROW_TYPES.find(t => t.id === type) || ROW_TYPES[5];

  const inputCls = "bg-transparent text-xs text-text-primary placeholder:text-text-muted focus:outline-none border-b border-transparent focus:border-brand w-full py-0.5";

  const showCounts = ROW_TYPES.map(t => ({ ...t, count: rows.filter(r => r.type === t.id).length })).filter(t => t.count > 0);

  return (
    <div className="animate-fade-in max-w-5xl">
      <div className="flex items-center gap-2 text-xs text-text-muted mb-6">
          <SaveButton toolSlug="tour-itinerary" storageKey={STORAGE_KEY} title={`Tour Itinerary — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
            <ExportButton onPDF={handleExportPDF} />

        <Link href="/dashboard/library" className="hover:text-text-primary transition-colors">Toolkit</Link>
        <ChevronRight size={12}/>
        <Link href="/dashboard/library/touring" className="hover:text-text-primary transition-colors">Live: Bookings & Tours</Link>
        <ChevronRight size={12}/>
        <span className="text-text-primary">Tour Itinerary</span>
      </div>

      <div className="glass-card rounded-2xl p-7 mb-6" style={{ borderColor: `${COLOR}25` }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: COLOR }}>Live Tool · Auto-Saved · Colour-Coded</p>
        <h1 className="text-2xl font-black text-text-primary mb-1">Tour Itinerary</h1>
        <p className="text-sm font-semibold mb-1" style={{ color: COLOR }}>Day-by-day schedule for your whole team, travel, shows, and everything in between.</p>
        <p className="text-sm text-text-muted">Add rows, set the type, fill in times and locations. Colour-coded by row type. Share with crew via screenshot or PDF.</p>
      </div>

      {/* Tour header inputs */}
      <div className="glass-card rounded-xl p-5 mb-5" style={{ borderColor: `${COLOR}20` }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-text-muted block mb-1">Tour Name</label>
            <input type="text" value={tourName} onChange={e => { setTourName(e.target.value); save(rows, e.target.value, artist); }}
              placeholder="e.g. Summer Run 2026" className="bg-transparent border-b border-border focus:border-brand text-sm text-text-primary placeholder:text-text-muted focus:outline-none w-full py-1"/>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-text-muted block mb-1">Artist</label>
            <input type="text" value={artist} onChange={e => { setArtist(e.target.value); save(rows, tourName, e.target.value); }}
              placeholder="Artist name" className="bg-transparent border-b border-border focus:border-brand text-sm text-text-primary placeholder:text-text-muted focus:outline-none w-full py-1"/>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mb-5">
        {ROW_TYPES.map(t => (
          <div key={t.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs"
            style={{ backgroundColor: `${t.color}12`, border: `1px solid ${t.color}25` }}>
            <span>{t.emoji}</span>
            <span className="font-semibold" style={{ color: t.color }}>{t.label}</span>
          </div>
        ))}
      </div>

      {/* Stats row */}
      {showCounts.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {showCounts.map(t => (
            <div key={t.id} className="px-2.5 py-1 rounded text-[10px] font-black"
              style={{ color: t.color, backgroundColor: `${t.color}15` }}>
              {t.count} {t.label}{t.count !== 1 ? "s" : ""}
            </div>
          ))}
          <div className="px-2.5 py-1 rounded text-[10px] font-black text-text-muted bg-surface-2">
            {rows.length} total rows
          </div>
        </div>
      )}

      {/* Itinerary table */}
      <div className="glass-card rounded-xl overflow-hidden mb-5">
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[800px]">
            <thead>
              <tr className="border-b border-border bg-surface-2">
                {["Date", "Start", "End", "Type", "Activity / Item", "Depart From", "Arrive At", "Venue", "KMs", "Notes", ""].map((h, i) => (
                  <th key={i} className="px-3 py-2.5 text-left font-black uppercase tracking-wider text-text-muted text-[10px] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const typeInfo = getTypeInfo(row.type);
                return (
                  <tr key={row.id} className="border-b border-border last:border-0 group"
                    style={{ backgroundColor: i % 2 === 1 ? "rgba(255,255,255,0.01)" : "transparent" }}>
                    <td className="px-3 py-2" style={{ borderLeft: `3px solid ${typeInfo.color}` }}>
                      <input type="text" value={row.date} onChange={e => updateRow(row.id, "date", e.target.value)}
                        placeholder="dd/mm" className={inputCls} style={{ width: 60 }}/>
                    </td>
                    <td className="px-3 py-2">
                      <input type="text" value={row.startTime} onChange={e => updateRow(row.id, "startTime", e.target.value)}
                        placeholder="00:00" className={inputCls} style={{ width: 50 }}/>
                    </td>
                    <td className="px-3 py-2">
                      <input type="text" value={row.endTime} onChange={e => updateRow(row.id, "endTime", e.target.value)}
                        placeholder="00:00" className={inputCls} style={{ width: 50 }}/>
                    </td>
                    <td className="px-3 py-2">
                      <select value={row.type} onChange={e => updateRow(row.id, "type", e.target.value)}
                        className="bg-transparent text-xs focus:outline-none py-0.5 cursor-pointer"
                        style={{ color: typeInfo.color }}>
                        {ROW_TYPES.map(t => <option key={t.id} value={t.id}>{t.emoji} {t.label}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input type="text" value={row.activity} onChange={e => updateRow(row.id, "activity", e.target.value)}
                        placeholder="Activity..." className={inputCls} style={{ minWidth: 140 }}/>
                    </td>
                    <td className="px-3 py-2">
                      <input type="text" value={row.depart} onChange={e => updateRow(row.id, "depart", e.target.value)}
                        placeholder="City / place" className={inputCls} style={{ width: 90 }}/>
                    </td>
                    <td className="px-3 py-2">
                      <input type="text" value={row.arrive} onChange={e => updateRow(row.id, "arrive", e.target.value)}
                        placeholder="City / place" className={inputCls} style={{ width: 90 }}/>
                    </td>
                    <td className="px-3 py-2">
                      <input type="text" value={row.venue} onChange={e => updateRow(row.id, "venue", e.target.value)}
                        placeholder="Venue name" className={inputCls} style={{ width: 100 }}/>
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" value={row.km} onChange={e => updateRow(row.id, "km", e.target.value)}
                        placeholder="0" min="0" className={inputCls} style={{ width: 50 }}/>
                    </td>
                    <td className="px-3 py-2">
                      <input type="text" value={row.notes} onChange={e => updateRow(row.id, "notes", e.target.value)}
                        placeholder="Notes..." className={inputCls} style={{ minWidth: 120 }}/>
                    </td>
                    <td className="px-2 py-2">
                      <button onClick={() => removeRow(row.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded text-text-muted hover:text-red-400 transition-all">
                        <Trash2 size={12}/>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-border">
          <button onClick={addRow}
            className="flex items-center gap-1.5 text-xs font-semibold transition-colors"
            style={{ color: COLOR }}>
            <Plus size={13}/>Add row
          </button>
        </div>
      </div>

      <div className="glass-card rounded-xl p-4 mb-8 flex items-start gap-3" style={{ borderColor: "rgba(201,168,76,0.15)", backgroundColor: "rgba(201,168,76,0.04)" }}>
        <span className="text-base flex-shrink-0">💾</span>
        <p className="text-xs text-text-muted leading-relaxed"><span className="font-semibold text-brand">Auto-saved to this device for 90 days.</span> Distribute to crew via screenshot or screengrab. Always keep a printed backup, mobile data is unreliable on the road.</p>
      </div>

      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <Link href="/dashboard/library/touring" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors">
          <ChevronLeft size={15}/>Back to Live: Bookings & Tours
        </Link>
        <button onClick={handleReset}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-text-muted hover:text-text-primary border border-border hover:border-text-muted transition-all">
          <RotateCcw size={12}/>Reset itinerary
        </button>
      </div>
    </div>
  );
}
