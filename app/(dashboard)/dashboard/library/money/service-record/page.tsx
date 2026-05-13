"use client";
import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus, Trash2, Printer } from "lucide-react";
import { useLocale } from "@/context/locale-context";
import { getCountryResources } from "@/lib/country-resources";

const COLOR = "#EC4899";

const SERVICE_CATEGORIES = [
  "Administration", "Artist Development", "Booking / Engagement", "Brand Partnership",
  "Composition", "Consultation", "Content Creation", "Contract Drafting",
  "Distribution", "Event Management", "Financial Review", "Grant Application",
  "Legal Advice", "Licensing / Sync", "Live Performance", "Marketing Campaign",
  "Media Liaison", "Meetings", "Mentorship / Coaching", "Networking",
  "Negotiation", "Phone / Video Call", "Pitching", "Press / PR",
  "Production Oversight", "Radio Plugging", "Recording Session", "Reporting",
  "Research", "Rights Registration", "Social Media Management", "Sponsorship",
  "Streaming Optimisation", "Studio Booking", "Tour Planning", "Travel",
];

interface Entry {
  id: string;
  date: string;
  client: string;
  serviceType: string;
  duration: string;
  notes: string;
}

const EMPTY_ENTRY = (): Entry => ({
  id: `entry-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  date: "",
  client: "",
  serviceType: "",
  duration: "",
  notes: "",
});

export default function ServiceRecordPage() {
  const { country } = useLocale();
  const res = getCountryResources(country);
  const taxAbbr = res.taxAuthorityAbbr ?? "your tax authority";
  const [practitioner, setPractitioner] = useState({ name: "", company: "", role: "", email: "", client: "", project: "" });
  const [entries, setEntries] = useState<Entry[]>([EMPTY_ENTRY(), EMPTY_ENTRY(), EMPTY_ENTRY()]);
  const printRef = useRef<HTMLDivElement>(null);

  const addEntry = useCallback(() => setEntries(prev => [...prev, EMPTY_ENTRY()]), []);

  const removeEntry = useCallback((id: string) =>
    setEntries(prev => prev.length > 1 ? prev.filter(e => e.id !== id) : prev), []);

  const updateEntry = useCallback((id: string, field: keyof Entry, value: string) =>
    setEntries(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e)), []);

  const filledCount = entries.filter(e => e.date || e.client || e.serviceType).length;

  return (
    <div className="animate-fade-in max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-text-muted mb-6">
        <Link href="/dashboard/library" className="hover:text-text-primary transition-colors">Toolkit</Link>
        <ChevronRight size={12}/>
        <Link href="/dashboard/library/money" className="hover:text-text-primary transition-colors">Money Matters</Link>
        <ChevronRight size={12}/>
        <span className="text-text-primary">Service Record</span>
      </div>

      {/* Header */}
      <div className="glass-card rounded-2xl p-7 mb-8" style={{ borderColor: "#EC489925" }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: COLOR }}>{res.flag} {country} · African Music Market · 2026</p>
            <h1 className="text-2xl font-black text-text-primary mb-2">Service Record</h1>
            <p className="text-sm text-text-muted leading-relaxed max-w-xl">
              Log every service you deliver. Accurate service records protect you in disputes, support invoicing, strengthen grant applications, and provide evidence for {taxAbbr} tax submissions. Complete every field for each entry.
            </p>
          </div>
          <button type="button" onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold flex-shrink-0 transition-all hover:opacity-80" style={{ backgroundColor: `${COLOR}20`, color: COLOR, border: `1px solid ${COLOR}30` }}><Printer size={15}/><span className="hidden sm:inline">Save as PDF</span></button>
        </div>
      </div>

      {/* Practitioner details */}
      <div className="glass-card rounded-xl p-5 mb-6" style={{ borderColor: "rgba(236,72,153,0.2)" }}>
        <p className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Practitioner Details</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { key: "name", label: "Practitioner Name" },
            { key: "company", label: "Company / Entity" },
            { key: "role", label: "Role / Discipline" },
            { key: "email", label: "Email Address" },
            { key: "client", label: "Client Name" },
            { key: "project", label: "Project / Campaign" },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs font-semibold text-text-muted mb-1">{f.label}</label>
              <input
                type="text"
                value={practitioner[f.key as keyof typeof practitioner]}
                onChange={e => setPractitioner(prev => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={`Enter ${f.label.toLowerCase()}`}
                className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:ring-0 transition-all"
                style={{ outline: "none" }}
                onFocus={e => e.target.style.boxShadow = "0 0 0 2px rgba(236,72,153,0.3)"}
                onBlur={e => e.target.style.boxShadow = "none"}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-text-muted"><span className="font-semibold text-text-primary">{filledCount}</span> entries logged · <span className="font-semibold text-text-primary">{entries.length}</span> rows total</p>
        <button onClick={addEntry}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-80"
          style={{ backgroundColor: "#EC489920", color: "#EC4899", border: "1px solid #EC489930" }}>
          <Plus size={15}/>Add Row
        </button>
      </div>

      {/* Service log table */}
      <div className="glass-card rounded-xl overflow-hidden mb-6">
        {/* Header */}
        <div className="grid gap-0 border-b border-border" style={{ gridTemplateColumns: "120px 140px 180px 100px 1fr 40px", backgroundColor: `${COLOR}10` }}>
          {["Date", "Client", "Service Type", "Duration / Qty", "Description / Notes", ""].map((h, i) => (
            <div key={i} className="px-3 py-2.5">
              <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: COLOR }}>{h}</p>
            </div>
          ))}
        </div>

        {/* Rows */}
        <div className="divide-y divide-border">
          {entries.map((entry, idx) => (
            <div key={entry.id} className={`grid gap-0 ${idx % 2 === 1 ? "bg-surface/30" : ""}`}
              style={{ gridTemplateColumns: "120px 140px 180px 100px 1fr 40px" }}>
              {/* Date */}
              <div className="px-2 py-2">
                <input type="date" value={entry.date}
                  onChange={e => updateEntry(entry.id, "date", e.target.value)}
                  className="w-full bg-transparent text-xs text-text-primary focus:outline-none"
                  style={{ colorScheme: "dark" }}/>
              </div>
              {/* Client */}
              <div className="px-2 py-2">
                <input type="text" value={entry.client} placeholder="Client name"
                  onChange={e => updateEntry(entry.id, "client", e.target.value)}
                  className="w-full bg-transparent text-xs text-text-primary placeholder:text-text-muted/50 focus:outline-none"/>
              </div>
              {/* Service Type */}
              <div className="px-2 py-2">
                <select value={entry.serviceType}
                  onChange={e => updateEntry(entry.id, "serviceType", e.target.value)}
                  className="w-full bg-transparent text-xs text-text-primary focus:outline-none cursor-pointer">
                  <option value="">Select type...</option>
                  {SERVICE_CATEGORIES.map(c => <option key={c} value={c} className="bg-surface">{c}</option>)}
                </select>
              </div>
              {/* Duration */}
              <div className="px-2 py-2">
                <input type="text" value={entry.duration} placeholder="e.g. 2hrs"
                  onChange={e => updateEntry(entry.id, "duration", e.target.value)}
                  className="w-full bg-transparent text-xs text-text-primary placeholder:text-text-muted/50 focus:outline-none"/>
              </div>
              {/* Notes */}
              <div className="px-2 py-2">
                <input type="text" value={entry.notes} placeholder="Describe the service delivered..."
                  onChange={e => updateEntry(entry.id, "notes", e.target.value)}
                  className="w-full bg-transparent text-xs text-text-primary placeholder:text-text-muted/50 focus:outline-none"/>
              </div>
              {/* Delete */}
              <div className="flex items-center justify-center">
                <button onClick={() => removeEntry(entry.id)}
                  className="p-1.5 rounded text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-all">
                  <Trash2 size={13}/>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add row footer */}
        <div className="border-t border-border">
          <button onClick={addEntry}
            className="w-full flex items-center justify-center gap-2 py-3 text-xs font-semibold text-text-muted hover:text-brand hover:bg-brand/5 transition-all">
            <Plus size={13}/>Add row
          </button>
        </div>
      </div>

      {/* Service category reference */}
      <div className="glass-card rounded-xl p-5 mb-8">
        <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: COLOR }}>Service Category Reference</p>
        <p className="text-xs text-text-muted mb-3">Select the most applicable type for each entry. Expand or adapt these categories to suit your discipline.</p>
        <div className="flex flex-wrap gap-1.5">
          {SERVICE_CATEGORIES.map(cat => (
            <span key={cat} className="text-[10px] font-semibold px-2 py-0.5 rounded"
              style={{ color: COLOR, backgroundColor: `${COLOR}12`, border: `1px solid ${COLOR}20` }}>
              {cat}
            </span>
          ))}
        </div>
      </div>

      {/* Save note */}
      <div className="glass-card rounded-xl p-4 mb-8 flex items-start gap-3" style={{ borderColor: "rgba(201,168,76,0.15)", backgroundColor: "rgba(201,168,76,0.04)" }}>
        <span className="text-base flex-shrink-0">💾</span>
        <p className="text-xs text-text-muted leading-relaxed">
          <span className="font-semibold text-brand">Save your record regularly.</span> Click <span className="font-semibold text-brand">Save as PDF</span> to download the original template. Your entries on this page are stored in your browser, export or screenshot regularly to keep a permanent record for {taxAbbr}, legal, and grant purposes.
        </p>
      </div>

      <Link href="/dashboard/library/money" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors">
        <ChevronLeft size={15}/>Back to Money Matters
      </Link>
    </div>
  );
}
