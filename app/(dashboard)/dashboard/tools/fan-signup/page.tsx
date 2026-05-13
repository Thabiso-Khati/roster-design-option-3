"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus, Trash2, RotateCcw } from "lucide-react";
import { SaveButton } from "@/components/ui/save-button";
import { ExportButton } from "@/components/ui/export-button";

const STORAGE_KEY = "roster_fan_signup_v1";
const COLOR = "#10B981";

const SA_PROVINCES = ["Gauteng", "Western Cape", "KwaZulu-Natal", "Eastern Cape", "Limpopo", "Mpumalanga", "North West", "Free State", "Northern Cape", "Outside SA"];
const SOURCES = ["Merch table", "Door / entry", "Social media (Instagram)", "Social media (TikTok)", "Social media (Facebook)", "Paper sheet", "QR code", "WhatsApp broadcast", "Friend referral", "Other"];

interface FanEntry {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  city: string;
  province: string;
  show: string;
  source: string;
  consent: boolean;
}

interface ShowSummary {
  id: string;
  showName: string;
  city: string;
  date: string;
  count: string;
  notes: string;
}

const uid = () => Math.random().toString(36).slice(2, 9);
type ActiveTab = "capture" | "shows";

export default function FanSignupPage() {
  const handleExportPDF = () => { window.print(); };
  const [tab, setTab] = useState<ActiveTab>("capture");
  const [fans, setFans] = useState<FanEntry[]>([]);
  const [shows, setShows] = useState<ShowSummary[]>([]);
  const [filterShow, setFilterShow] = useState("");

  useEffect(() => {
    type Saved = { fans?: FanEntry[]; shows?: ShowSummary[] };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const d: Saved = JSON.parse(raw);
        if (d.fans) setFans(d.fans);
        if (d.shows) setShows(d.shows);
        return;
      }
    } catch {}
    fetch(`/api/tools/save?slug=fan-signup`)
      .then(r => r.json())
      .then(({ snapshot }) => {
        if (!snapshot?.data) return;
        const d = snapshot.data as Saved;
        if (d.fans) setFans(d.fans);
        if (d.shows) setShows(d.shows);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {}
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const save = useCallback((f: FanEntry[], s: ShowSummary[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ fans: f, shows: s }));
  }, []);

  const addFan = () => {
    const entry: FanEntry = { id: uid(), name: "", email: "", whatsapp: "", city: "", province: "", show: "", source: "Merch table", consent: false };
    setFans(prev => { const next = [...prev, entry]; save(next, shows); return next; });
  };

  const updateFan = (id: string, key: keyof FanEntry, val: string | boolean) => {
    setFans(prev => { const next = prev.map(f => f.id === id ? { ...f, [key]: val } : f); save(next, shows); return next; });
  };

  const removeFan = (id: string) => {
    setFans(prev => { const next = prev.filter(f => f.id !== id); save(next, shows); return next; });
  };

  const addShow = () => {
    const entry: ShowSummary = { id: uid(), showName: "", city: "", date: "", count: "", notes: "" };
    setShows(prev => { const next = [...prev, entry]; save(fans, next); return next; });
  };

  const updateShow = (id: string, key: keyof ShowSummary, val: string) => {
    setShows(prev => { const next = prev.map(s => s.id === id ? { ...s, [key]: val } : s); save(fans, next); return next; });
  };

  const removeShow = (id: string) => {
    setShows(prev => { const next = prev.filter(s => s.id !== id); save(fans, next); return next; });
  };

  const filteredFans = filterShow ? fans.filter(f => f.show === filterShow) : fans;
  const consentCount = fans.filter(f => f.consent).length;
  const uniqueShows = Array.from(new Set(fans.map(f => f.show).filter(Boolean)));

  const inputCls = "bg-transparent text-xs text-text-primary placeholder:text-text-muted focus:outline-none border-b border-transparent focus:border-brand w-full py-0.5";

  return (
    <div className="animate-fade-in max-w-6xl">
      <div className="flex items-center gap-2 text-xs text-text-muted mb-6">
          <SaveButton toolSlug="fan-signup" storageKey={STORAGE_KEY} title={`Fan Signup — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
            <ExportButton onPDF={handleExportPDF} />

        <Link href="/dashboard/library" className="hover:text-text-primary transition-colors">Toolkit</Link>
        <ChevronRight size={12}/>
        <Link href="/dashboard/library/touring" className="hover:text-text-primary transition-colors">Live: Bookings & Tours</Link>
        <ChevronRight size={12}/>
        <span className="text-text-primary">Fan Sign-Up & Data Capture</span>
      </div>

      <div className="glass-card rounded-2xl p-7 mb-6" style={{ borderColor: `${COLOR}25` }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: COLOR }}>POPIA Ready · Live Tool · Auto-Saved</p>
        <h1 className="text-2xl font-black text-text-primary mb-1">Fan Sign-Up & Data Capture</h1>
        <p className="text-sm font-semibold mb-1" style={{ color: COLOR }}>Capture fan details at every show. Build your list from the ground up.</p>
        <p className="text-sm text-text-muted">Log names, emails, WhatsApp numbers, city, and source. POPIA consent checkbox on every entry. Track sign-ups by show. City-segmented data for targeted outreach.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: COLOR }}>Total Fans</p>
          <p className="text-2xl font-black text-text-primary">{fans.length}</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-xs font-black uppercase tracking-wider mb-1 text-text-muted">POPIA Confirmed</p>
          <p className="text-2xl font-black text-text-primary">{consentCount}</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-xs font-black uppercase tracking-wider mb-1 text-text-muted">With Email</p>
          <p className="text-2xl font-black text-text-primary">{fans.filter(f => f.email).length}</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-xs font-black uppercase tracking-wider mb-1 text-text-muted">With WhatsApp</p>
          <p className="text-2xl font-black text-text-primary">{fans.filter(f => f.whatsapp).length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 mb-5 border-b border-border">
        {([["capture", "Data Capture"], ["shows", "Show Summary"]] as [ActiveTab, string][]).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 -mb-px ${tab === id ? "border-brand text-brand" : "border-transparent text-text-muted hover:text-text-primary"}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === "capture" && (
        <>
          {/* Filter */}
          {uniqueShows.length > 0 && (
            <div className="flex items-center gap-3 mb-4">
              <label className="text-xs text-text-muted">Filter by show:</label>
              <select value={filterShow} onChange={e => setFilterShow(e.target.value)}
                className="bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-brand">
                <option value="">All shows ({fans.length})</option>
                {uniqueShows.map(s => <option key={s} value={s}>{s} ({fans.filter(f => f.show === s).length})</option>)}
              </select>
            </div>
          )}

          <div className="glass-card rounded-xl overflow-hidden mb-5">
            <div className="overflow-x-auto">
              <table className="w-full text-xs" style={{ minWidth: 950 }}>
                <thead>
                  <tr className="border-b border-border bg-surface-2">
                    <th className="px-2 py-2.5 text-center font-black uppercase tracking-wider text-text-muted text-[10px]">#</th>
                    {["Full Name", "Email Address", "WhatsApp Number", "City / Town", "Province", "Show / Event", "Source", "POPIA ✓", ""].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left font-black uppercase tracking-wider text-text-muted text-[10px] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredFans.map((fan, i) => (
                    <tr key={fan.id} className={`border-b border-border last:border-0 group ${i % 2 === 1 ? "bg-surface-2/40" : ""}`}>
                      <td className="px-2 py-2 text-center text-text-muted">{fans.indexOf(fan) + 1}</td>
                      <td className="px-3 py-2" style={{ minWidth: 130 }}>
                        <input type="text" value={fan.name} onChange={e => updateFan(fan.id, "name", e.target.value)}
                          placeholder="Full name" className={inputCls}/>
                      </td>
                      <td className="px-3 py-2" style={{ minWidth: 160 }}>
                        <input type="email" value={fan.email} onChange={e => updateFan(fan.id, "email", e.target.value)}
                          placeholder="email@address.com" className={inputCls}/>
                      </td>
                      <td className="px-3 py-2" style={{ minWidth: 120 }}>
                        <input type="text" value={fan.whatsapp} onChange={e => updateFan(fan.id, "whatsapp", e.target.value)}
                          placeholder="+27 XX XXX XXXX" className={inputCls}/>
                      </td>
                      <td className="px-3 py-2" style={{ minWidth: 90 }}>
                        <input type="text" value={fan.city} onChange={e => updateFan(fan.id, "city", e.target.value)}
                          placeholder="City" className={inputCls}/>
                      </td>
                      <td className="px-3 py-2" style={{ minWidth: 110 }}>
                        <select value={fan.province} onChange={e => updateFan(fan.id, "province", e.target.value)}
                          className="bg-transparent text-xs text-text-primary focus:outline-none py-0.5 cursor-pointer w-full">
                          <option value="">Select...</option>
                          {SA_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2" style={{ minWidth: 130 }}>
                        <input type="text" value={fan.show} onChange={e => updateFan(fan.id, "show", e.target.value)}
                          placeholder="Show / event name" className={inputCls}/>
                      </td>
                      <td className="px-3 py-2" style={{ minWidth: 100 }}>
                        <select value={fan.source} onChange={e => updateFan(fan.id, "source", e.target.value)}
                          className="bg-transparent text-xs text-text-primary focus:outline-none py-0.5 cursor-pointer">
                          {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input type="checkbox" checked={fan.consent} onChange={e => updateFan(fan.id, "consent", e.target.checked)}
                          className="cursor-pointer accent-brand"/>
                      </td>
                      <td className="px-2 py-2">
                        <button onClick={() => removeFan(fan.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded text-text-muted hover:text-red-400 transition-all">
                          <Trash2 size={12}/>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredFans.length === 0 && (
                    <tr>
                      <td colSpan={10} className="px-5 py-8 text-center text-sm text-text-muted">
                        No fans captured yet. Click "Add fan" to start.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-border">
              <button onClick={addFan} className="flex items-center gap-1.5 text-xs font-semibold transition-colors" style={{ color: COLOR }}>
                <Plus size={13}/>Add fan
              </button>
            </div>
          </div>

          {/* POPIA notice */}
          <div className="glass-card rounded-xl p-4 mb-6 flex items-start gap-3" style={{ borderColor: "rgba(239,68,68,0.15)", backgroundColor: "rgba(239,68,68,0.04)" }}>
            <span className="text-sm flex-shrink-0">🔒</span>
            <p className="text-xs text-text-muted leading-relaxed"><span className="font-semibold text-red-400">POPIA Notice:</span> The Protection of Personal Information Act (Act 4 of 2013) requires explicit consent before adding any fan to any list. Only rows with the POPIA consent box checked may be used for marketing communications. Store this data securely and ensure fans can opt out easily.</p>
          </div>
        </>
      )}

      {tab === "shows" && (
        <div className="glass-card rounded-xl overflow-hidden mb-6">
          <div className="px-5 py-3 border-b border-border" style={{ backgroundColor: `${COLOR}08` }}>
            <p className="text-xs font-black uppercase tracking-wider" style={{ color: COLOR }}>Show-by-Show Fan Acquisition Summary</p>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-surface-2">
                {["Show / Event Name", "City", "Date", "Fans Signed Up", "POPIA Confirmed", "Notes", ""].map(h => (
                  <th key={h} className="px-5 py-2.5 text-left font-black uppercase tracking-wider text-text-muted text-[10px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shows.map((show, i) => (
                <tr key={show.id} className={`border-b border-border last:border-0 group ${i % 2 === 1 ? "bg-surface-2" : ""}`}>
                  <td className="px-5 py-2">
                    <input type="text" value={show.showName} onChange={e => updateShow(show.id, "showName", e.target.value)}
                      placeholder="Show / event name" className="bg-transparent text-xs text-text-primary placeholder:text-text-muted focus:outline-none border-b border-transparent focus:border-brand py-0.5" style={{ width: 160 }}/>
                  </td>
                  <td className="px-5 py-2">
                    <input type="text" value={show.city} onChange={e => updateShow(show.id, "city", e.target.value)}
                      placeholder="City" className="bg-transparent text-xs text-text-primary placeholder:text-text-muted focus:outline-none border-b border-transparent focus:border-brand py-0.5" style={{ width: 80 }}/>
                  </td>
                  <td className="px-5 py-2">
                    <input type="text" value={show.date} onChange={e => updateShow(show.id, "date", e.target.value)}
                      placeholder="dd/mm/yyyy" className="bg-transparent text-xs text-text-primary placeholder:text-text-muted focus:outline-none border-b border-transparent focus:border-brand py-0.5" style={{ width: 85 }}/>
                  </td>
                  <td className="px-5 py-2">
                    <input type="number" value={show.count} onChange={e => updateShow(show.id, "count", e.target.value)}
                      placeholder="0" min="0" className="bg-transparent text-xs text-text-primary placeholder:text-text-muted focus:outline-none border-b border-transparent focus:border-brand py-0.5 text-right" style={{ width: 60 }}/>
                  </td>
                  <td className="px-5 py-2 text-text-muted">
                    {show.showName ? fans.filter(f => f.show === show.showName && f.consent).length : ", "}
                  </td>
                  <td className="px-5 py-2">
                    <input type="text" value={show.notes} onChange={e => updateShow(show.id, "notes", e.target.value)}
                      placeholder="Notes..." className="bg-transparent text-xs text-text-primary placeholder:text-text-muted focus:outline-none border-b border-transparent focus:border-brand py-0.5" style={{ minWidth: 140 }}/>
                  </td>
                  <td className="px-3 py-2">
                    <button onClick={() => removeShow(show.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded text-text-muted hover:text-red-400 transition-all">
                      <Trash2 size={12}/>
                    </button>
                  </td>
                </tr>
              ))}
              {shows.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-sm text-text-muted">No shows logged yet. Click "Add show" to start.</td></tr>
              )}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-border">
            <button onClick={addShow} className="flex items-center gap-1.5 text-xs font-semibold transition-colors" style={{ color: COLOR }}>
              <Plus size={13}/>Add show
            </button>
          </div>
        </div>
      )}

      <div className="glass-card rounded-xl p-4 mb-8 flex items-start gap-3" style={{ borderColor: "rgba(201,168,76,0.15)", backgroundColor: "rgba(201,168,76,0.04)" }}>
        <span className="text-base flex-shrink-0">💾</span>
        <p className="text-xs text-text-muted leading-relaxed"><span className="font-semibold text-brand">Auto-saved to this device for 90 days.</span> Transfer paper sign-up sheets to this tool after every show. Only contact fans who have given POPIA consent.</p>
      </div>

      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <Link href="/dashboard/library/touring" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors">
          <ChevronLeft size={15}/>Back to Live: Bookings & Tours
        </Link>
        <button onClick={() => { if (confirm("Reset all fan sign-up data?")) { setFans([]); setShows([]); localStorage.removeItem(STORAGE_KEY); } }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-text-muted hover:text-text-primary border border-border hover:border-text-muted transition-all">
          <RotateCcw size={12}/>Reset data
        </button>
      </div>
    </div>
  );
}
