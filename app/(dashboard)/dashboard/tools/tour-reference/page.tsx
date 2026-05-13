"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus, Trash2, RotateCcw } from "lucide-react";
import { useLocale } from "@/context/locale-context";
import { SaveButton } from "@/components/ui/save-button";
import { ExportButton } from "@/components/ui/export-button";

const STORAGE_KEY = "roster_tour_reference_v1";
const COLOR = "#8B5CF6";

interface ShowNote {
  id: string;
  date: string;
  day: string;
  city: string;
  province: string;
  venue: string;
  showTime: string;
  capacity: string;
  attendance: string;
  fee: string;
  merchRev: string;
  notes: string;
}

interface VenueRef {
  id: string;
  city: string;
  venue: string;
  capacity: string;
  booker: string;
  contact: string;
  idealDay: string;
  lastPlayed: string;
  lastAttendance: string;
  notes: string;
}

const uid = () => Math.random().toString(36).slice(2, 9);
type ActiveTab = "notes" | "venues";

const DEFAULT_VENUES: VenueRef[] = [
  { id: uid(), city: "Johannesburg", venue: "45 on Empire, Braamfontein", capacity: "350", booker: "Venue Booker", contact: "+27 11 000 0000", idealDay: "Fri/Sat", lastPlayed: "", lastAttendance: "", notes: "" },
  { id: uid(), city: "Cape Town", venue: "Assembly, Salt River", capacity: "450", booker: "Venue Booker", contact: "+27 21 000 0000", idealDay: "Wed/Thu/Fri", lastPlayed: "", lastAttendance: "", notes: "" },
  { id: uid(), city: "Durban", venue: "Bat Centre, Waterfront", capacity: "200", booker: "Venue Booker", contact: "+27 31 000 0000", idealDay: "Fri/Sat", lastPlayed: "", lastAttendance: "", notes: "" },
  { id: uid(), city: "Pretoria", venue: "The Rabbit Hole, Brooklyn", capacity: "150", booker: "Venue Booker", contact: "+27 12 000 0000", idealDay: "Thu/Fri", lastPlayed: "", lastAttendance: "", notes: "" },
  { id: uid(), city: "Port Elizabeth", venue: "Friendly Stranger, Central", capacity: "120", booker: "Venue Booker", contact: "+27 41 000 0000", idealDay: "Fri/Sat", lastPlayed: "", lastAttendance: "", notes: "" },
  { id: uid(), city: "East London", venue: "The Grain, Quigney", capacity: "180", booker: "Venue Booker", contact: "+27 43 000 0000", idealDay: "Fri/Sat", lastPlayed: "", lastAttendance: "", notes: "" },
  { id: uid(), city: "Bloemfontein", venue: "Mystic Boer, Westdene", capacity: "200", booker: "Venue Booker", contact: "+27 51 000 0000", idealDay: "Fri/Sat", lastPlayed: "", lastAttendance: "", notes: "" },
  { id: uid(), city: "Stellenbosch", venue: "De Akker, Dorp St", capacity: "120", booker: "Venue Booker", contact: "+27 21 000 0001", idealDay: "Thu/Fri", lastPlayed: "", lastAttendance: "", notes: "" },
];

export default function TourReferencePage() {
  const handleExportPDF = () => { window.print(); };
  const { fmt, currency } = useLocale();
  const [tab, setTab] = useState<ActiveTab>("notes");
  const [notes, setNotes] = useState<ShowNote[]>([]);
  const [venues, setVenues] = useState<VenueRef[]>(DEFAULT_VENUES);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const p = JSON.parse(saved);
        if (p.notes) setNotes(p.notes);
        if (p.venues) setVenues(p.venues);
      }
    } catch {}


  fetch('/api/tools/save?slug=tour-reference')
    .then(r => r.json())
    .then(({ snapshot }) => {
      if (!snapshot?.data) return;
      const d = snapshot.data as { notes?: ShowNote[]; venues?: VenueRef[] };
      if (d.notes) setNotes(d.notes);
      if (d.venues) setVenues(d.venues);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot.data)); } catch { /* quota */ }
    })
    .catch(() => {});
  }, []);

  const save = useCallback((n: ShowNote[], v: VenueRef[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ notes: n, venues: v }));
  }, []);

  const addNote = () => {
    const entry: ShowNote = { id: uid(), date: "", day: "", city: "", province: "", venue: "", showTime: "", capacity: "", attendance: "", fee: "", merchRev: "", notes: "" };
    setNotes(prev => { const next = [...prev, entry]; save(next, venues); return next; });
  };

  const updateNote = (id: string, key: keyof ShowNote, val: string) => {
    setNotes(prev => { const next = prev.map(n => n.id === id ? { ...n, [key]: val } : n); save(next, venues); return next; });
  };

  const removeNote = (id: string) => {
    setNotes(prev => { const next = prev.filter(n => n.id !== id); save(next, venues); return next; });
  };

  const addVenue = () => {
    const entry: VenueRef = { id: uid(), city: "", venue: "", capacity: "", booker: "", contact: "", idealDay: "", lastPlayed: "", lastAttendance: "", notes: "" };
    setVenues(prev => { const next = [...prev, entry]; save(notes, next); return next; });
  };

  const updateVenue = (id: string, key: keyof VenueRef, val: string) => {
    setVenues(prev => { const next = prev.map(v => v.id === id ? { ...v, [key]: val } : v); save(notes, next); return next; });
  };

  const removeVenue = (id: string) => {
    setVenues(prev => { const next = prev.filter(v => v.id !== id); save(notes, next); return next; });
  };

  // Stats
  const totalShows = notes.length;
  const totalFee = notes.reduce((sum, n) => sum + (parseFloat(n.fee) || 0), 0);
  const totalMerch = notes.reduce((sum, n) => sum + (parseFloat(n.merchRev) || 0), 0);
  const totalAttendance = notes.reduce((sum, n) => sum + (parseFloat(n.attendance) || 0), 0);
  const avgAttendance = totalShows > 0 ? Math.round(totalAttendance / totalShows) : 0;

  const inputCls = "bg-transparent text-xs text-text-primary placeholder:text-text-muted focus:outline-none border-b border-transparent focus:border-brand w-full py-0.5";

  return (
    <div className="animate-fade-in max-w-6xl">
      <div className="flex items-center gap-2 text-xs text-text-muted mb-6">
          <SaveButton toolSlug="tour-reference" storageKey={STORAGE_KEY} title={`Tour Reference — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
            <ExportButton onPDF={handleExportPDF} />

        <Link href="/dashboard/library" className="hover:text-text-primary transition-colors">Toolkit</Link>
        <ChevronRight size={12}/>
        <Link href="/dashboard/library/touring" className="hover:text-text-primary transition-colors">Live: Bookings & Tours</Link>
        <ChevronRight size={12}/>
        <span className="text-text-primary">Tour Reference Notes</span>
      </div>

      <div className="glass-card rounded-2xl p-7 mb-6" style={{ borderColor: `${COLOR}25` }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: COLOR }}>Show Notes · SA Venues · Live Tool · Auto-Saved</p>
        <h1 className="text-2xl font-black text-text-primary mb-1">Tour Reference Notes</h1>
        <p className="text-sm font-semibold mb-1" style={{ color: COLOR }}>Show-by-show stats and a quick-reference card for every venue.</p>
        <p className="text-sm text-text-muted">Log show details after every night, date, city, venue, attendance, fee, merch. The Venue Quick Reference comes pre-populated with major South African venues. Update contacts and notes as you build relationships.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: COLOR }}>Shows Logged</p>
          <p className="text-2xl font-black text-text-primary">{totalShows}</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-xs font-black uppercase tracking-wider mb-1 text-text-muted">Total Fees ({currency})</p>
          <p className="text-lg font-black text-text-primary">{fmt(totalFee)}</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-xs font-black uppercase tracking-wider mb-1 text-text-muted">Total Merch ({currency})</p>
          <p className="text-lg font-black text-text-primary">{fmt(totalMerch)}</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-xs font-black uppercase tracking-wider mb-1 text-text-muted">Avg Attendance</p>
          <p className="text-2xl font-black text-text-primary">{avgAttendance > 0 ? avgAttendance : ", "}</p>
        </div>
      </div>

      {/* Combined income summary */}
      {(totalFee > 0 || totalMerch > 0) && (
        <div className="glass-card rounded-xl p-4 mb-5 flex items-center justify-between" style={{ borderColor: `${COLOR}20`, backgroundColor: `${COLOR}05` }}>
          <p className="text-xs font-black uppercase tracking-wider" style={{ color: COLOR }}>Total Tour Income</p>
          <p className="text-xl font-black" style={{ color: COLOR }}>{fmt(totalFee + totalMerch)}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-0 mb-5 border-b border-border">
        {([["notes", "Show Notes"], ["venues", "Venue Quick Reference"]] as [ActiveTab, string][]).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 -mb-px ${tab === id ? "border-brand text-brand" : "border-transparent text-text-muted hover:text-text-primary"}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === "notes" && (
        <div className="glass-card rounded-xl overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-xs" style={{ minWidth: 1100 }}>
              <thead>
                <tr className="border-b border-border bg-surface-2">
                  {["Date", "Day", "City", "Province / Country", "Venue Name", "Show Time", "Capacity", "Attendance", `Fee (${currency})`, `Merch Rev (${currency})`, "Notes", ""].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left font-black uppercase tracking-wider text-text-muted text-[10px] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {notes.map((note, i) => {
                  const attendance = parseFloat(note.attendance) || 0;
                  const capacity = parseFloat(note.capacity) || 0;
                  const fillRate = capacity > 0 ? Math.round((attendance / capacity) * 100) : null;
                  return (
                    <tr key={note.id} className={`border-b border-border last:border-0 group ${i % 2 === 1 ? "bg-surface-2/40" : ""}`}>
                      <td className="px-3 py-2">
                        <input type="text" value={note.date} onChange={e => updateNote(note.id, "date", e.target.value)}
                          placeholder="dd/mm/yy" className={inputCls} style={{ width: 65 }}/>
                      </td>
                      <td className="px-3 py-2">
                        <input type="text" value={note.day} onChange={e => updateNote(note.id, "day", e.target.value)}
                          placeholder="Mon" className={inputCls} style={{ width: 35 }}/>
                      </td>
                      <td className="px-3 py-2">
                        <input type="text" value={note.city} onChange={e => updateNote(note.id, "city", e.target.value)}
                          placeholder="City" className={inputCls} style={{ width: 80 }}/>
                      </td>
                      <td className="px-3 py-2">
                        <input type="text" value={note.province} onChange={e => updateNote(note.id, "province", e.target.value)}
                          placeholder="Province" className={inputCls} style={{ width: 80 }}/>
                      </td>
                      <td className="px-3 py-2">
                        <input type="text" value={note.venue} onChange={e => updateNote(note.id, "venue", e.target.value)}
                          placeholder="Venue name" className={inputCls} style={{ minWidth: 130 }}/>
                      </td>
                      <td className="px-3 py-2">
                        <input type="text" value={note.showTime} onChange={e => updateNote(note.id, "showTime", e.target.value)}
                          placeholder="21:00" className={inputCls} style={{ width: 50 }}/>
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" value={note.capacity} onChange={e => updateNote(note.id, "capacity", e.target.value)}
                          placeholder="0" min="0" className={inputCls + " text-right"} style={{ width: 55 }}/>
                      </td>
                      <td className="px-3 py-2">
                        <div>
                          <input type="number" value={note.attendance} onChange={e => updateNote(note.id, "attendance", e.target.value)}
                            placeholder="0" min="0" className={inputCls + " text-right"} style={{ width: 55 }}/>
                          {fillRate !== null && (
                            <p className="text-[10px] text-right mt-0.5" style={{ color: fillRate >= 80 ? "#10B981" : fillRate >= 50 ? "#F59E0B" : "#EF4444" }}>
                              {fillRate}%
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" value={note.fee} onChange={e => updateNote(note.id, "fee", e.target.value)}
                          placeholder="0" min="0" className={inputCls + " text-right"} style={{ width: 70 }}/>
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" value={note.merchRev} onChange={e => updateNote(note.id, "merchRev", e.target.value)}
                          placeholder="0" min="0" className={inputCls + " text-right"} style={{ width: 70 }}/>
                      </td>
                      <td className="px-3 py-2">
                        <input type="text" value={note.notes} onChange={e => updateNote(note.id, "notes", e.target.value)}
                          placeholder="Notes..." className={inputCls} style={{ minWidth: 120 }}/>
                      </td>
                      <td className="px-2 py-2">
                        <button onClick={() => removeNote(note.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded text-text-muted hover:text-red-400 transition-all">
                          <Trash2 size={12}/>
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {notes.length === 0 && (
                  <tr><td colSpan={12} className="px-5 py-8 text-center text-sm text-text-muted">No shows logged yet. Click "Add show" to start tracking.</td></tr>
                )}
                {notes.length > 0 && (
                  <tr className="border-t-2 border-border bg-surface-2">
                    <td colSpan={7} className="px-3 py-3">
                      <span className="text-xs font-black uppercase tracking-wider" style={{ color: COLOR }}>Tour Totals</span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className="text-xs font-black text-text-primary">{totalAttendance.toLocaleString()}</span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className="text-xs font-black" style={{ color: COLOR }}>{fmt(totalFee)}</span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className="text-xs font-black text-text-primary">{fmt(totalMerch)}</span>
                    </td>
                    <td colSpan={2}/>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-border">
            <button onClick={addNote} className="flex items-center gap-1.5 text-xs font-semibold transition-colors" style={{ color: COLOR }}>
              <Plus size={13}/>Add show
            </button>
          </div>
        </div>
      )}

      {tab === "venues" && (
        <div className="glass-card rounded-xl overflow-hidden mb-6">
          <div className="px-5 py-3 border-b border-border" style={{ backgroundColor: `${COLOR}08` }}>
            <p className="text-xs font-black uppercase tracking-wider" style={{ color: COLOR }}>Venue Quick Reference</p>
            <p className="text-xs text-text-muted mt-0.5">Pre-populated with major South African venues. Update contacts and notes as you build relationships.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs" style={{ minWidth: 1050 }}>
              <thead>
                <tr className="border-b border-border bg-surface-2">
                  {["City", "Venue Name", "Capacity", "Booker Name", "Booker Contact", "Ideal Show Day", "Last Played", "Last Attendance", "Notes", ""].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left font-black uppercase tracking-wider text-text-muted text-[10px] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {venues.map((venue, i) => (
                  <tr key={venue.id} className={`border-b border-border last:border-0 group ${i % 2 === 1 ? "bg-surface-2/40" : ""}`}>
                    <td className="px-3 py-2">
                      <input type="text" value={venue.city} onChange={e => updateVenue(venue.id, "city", e.target.value)}
                        placeholder="City" className={inputCls} style={{ width: 80 }}/>
                    </td>
                    <td className="px-3 py-2">
                      <input type="text" value={venue.venue} onChange={e => updateVenue(venue.id, "venue", e.target.value)}
                        placeholder="Venue name" className={inputCls} style={{ minWidth: 160 }}/>
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" value={venue.capacity} onChange={e => updateVenue(venue.id, "capacity", e.target.value)}
                        placeholder="0" min="0" className={inputCls + " text-right"} style={{ width: 55 }}/>
                    </td>
                    <td className="px-3 py-2">
                      <input type="text" value={venue.booker} onChange={e => updateVenue(venue.id, "booker", e.target.value)}
                        placeholder="Name" className={inputCls} style={{ width: 100 }}/>
                    </td>
                    <td className="px-3 py-2">
                      <input type="text" value={venue.contact} onChange={e => updateVenue(venue.id, "contact", e.target.value)}
                        placeholder="+27 XX XXX XXXX" className={inputCls} style={{ width: 120 }}/>
                    </td>
                    <td className="px-3 py-2">
                      <input type="text" value={venue.idealDay} onChange={e => updateVenue(venue.id, "idealDay", e.target.value)}
                        placeholder="Fri/Sat" className={inputCls} style={{ width: 70 }}/>
                    </td>
                    <td className="px-3 py-2">
                      <input type="text" value={venue.lastPlayed} onChange={e => updateVenue(venue.id, "lastPlayed", e.target.value)}
                        placeholder="dd/mm/yy" className={inputCls} style={{ width: 65 }}/>
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" value={venue.lastAttendance} onChange={e => updateVenue(venue.id, "lastAttendance", e.target.value)}
                        placeholder="0" min="0" className={inputCls + " text-right"} style={{ width: 60 }}/>
                    </td>
                    <td className="px-3 py-2">
                      <input type="text" value={venue.notes} onChange={e => updateVenue(venue.id, "notes", e.target.value)}
                        placeholder="Notes..." className={inputCls} style={{ minWidth: 130 }}/>
                    </td>
                    <td className="px-2 py-2">
                      <button onClick={() => removeVenue(venue.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded text-text-muted hover:text-red-400 transition-all">
                        <Trash2 size={12}/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-border">
            <button onClick={addVenue} className="flex items-center gap-1.5 text-xs font-semibold transition-colors" style={{ color: COLOR }}>
              <Plus size={13}/>Add venue
            </button>
          </div>
        </div>
      )}

      <div className="glass-card rounded-xl p-4 mb-8 flex items-start gap-3" style={{ borderColor: "rgba(201,168,76,0.15)", backgroundColor: "rgba(201,168,76,0.04)" }}>
        <span className="text-base flex-shrink-0">💾</span>
        <p className="text-xs text-text-muted leading-relaxed"><span className="font-semibold text-brand">Auto-saved to this device for 90 days.</span> Log show notes after every night while the details are fresh. Update venue contacts as you build relationships, this database compounds in value over time.</p>
      </div>

      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <Link href="/dashboard/library/touring" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors">
          <ChevronLeft size={15}/>Back to Live: Bookings & Tours
        </Link>
        <button onClick={() => { if (confirm("Reset all tour reference data? Venue quick reference will return to defaults.")) { setNotes([]); setVenues(DEFAULT_VENUES); localStorage.removeItem(STORAGE_KEY); } }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-text-muted hover:text-text-primary border border-border hover:border-text-muted transition-all">
          <RotateCcw size={12}/>Reset notes
        </button>
      </div>
    </div>
  );
}
