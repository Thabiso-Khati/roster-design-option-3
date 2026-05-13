"use client";
import { useState, useEffect, useCallback } from "react";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Printer, RotateCcw } from "lucide-react";
import { useLocale } from "@/context/locale-context";
import { getCountryResources } from "@/lib/country-resources";
import { SaveButton } from "@/components/ui/save-button";
import { ExportButton } from "@/components/ui/export-button";

const STORAGE_KEY = "roster_sample_clearance_v1";
const COLOR = "#EF4444";

const inputClass = "bg-transparent border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand w-full";
const labelClass = "text-xs font-semibold uppercase tracking-wider mb-1 block";

function YesNoToggle({ value, onChange, color }: { value: string; onChange: (v: string) => void; color: string }) {
  return (
    <div className="flex gap-2 mt-2">
      {["yes", "no"].map(opt => (
        <button key={opt} onClick={() => onChange(opt)}
          className="px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all"
          style={{
            backgroundColor: value === opt ? color : "transparent",
            color: value === opt ? "white" : color,
            border: `1px solid ${color}40`,
          }}>
          {opt.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export default function SampleClearancePage() {
  const handleExportPDF = () => { window.print(); };
  const { country } = useLocale();
  const res = getCountryResources(country);
  const proAbbr = res.performanceRights.abbr;
  const mechAbbr = res.mechanicalRights?.abbr ?? proAbbr;
  const currency = res.currency ?? "ZAR";

  const [data, setData] = useState<Record<string, string>>({});

  useToolRestore("sample-clearance", STORAGE_KEY, setData);

  const set = useCallback((key: string, val: string) => {
    setData(d => {
      const next = { ...d, [key]: val };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const v = (key: string) => data[key] || "";

  const anyYes = v("master_sample") === "yes" || v("composition_sample") === "yes" || v("traditional_sample") === "yes";

  const handleReset = () => {
    if (confirm("Clear all form data? This cannot be undone.")) {
      setData({});
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const CLEARANCE_STATUSES = [
    "Not yet started",
    "In progress, awaiting response",
    "Partial clearance obtained",
    "Fully cleared",
    "Clearance refused, do not use",
  ];

  return (
    <div className="animate-fade-in max-w-3xl">
      <div className="flex items-center gap-2 text-xs text-text-muted mb-6">
          <SaveButton toolSlug="sample-clearance" storageKey={STORAGE_KEY} title={`Sample Clearance — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
            <ExportButton onPDF={handleExportPDF} />

        <Link href="/dashboard/library" className="hover:text-text-primary transition-colors">Toolkit</Link>
        <ChevronRight size={12}/>
        <Link href="/dashboard/library/recording" className="hover:text-text-primary transition-colors">Releasing Music</Link>
        <ChevronRight size={12}/>
        <span className="text-text-primary">Sample Clearance Form</span>
      </div>

      {/* Important Notice */}
      <div className="glass-card rounded-xl p-4 mb-6 flex items-start gap-3" style={{ borderColor: "rgba(239,68,68,0.25)", backgroundColor: "rgba(239,68,68,0.06)" }}>
        <span className="text-sm flex-shrink-0">⚠️</span>
        <p className="text-xs text-text-muted leading-relaxed">
          <span className="font-bold text-red-400">Sampling copyrighted material without clearance</span> is an infringement of the applicable Copyright Act and may expose you to civil and criminal liability. A separate form must be completed for EACH sample used. Submit completed forms to your label, distributor or publisher BEFORE release. {mechAbbr} administers mechanical rights; {proAbbr} administers performing rights in {country}.
        </p>
      </div>

      <div className="glass-card rounded-2xl p-7 mb-8" style={{ borderColor: `${COLOR}25` }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: COLOR }}>One Form Per Sample · Required Before Release · 2026</p>
            <h1 className="text-2xl font-black text-text-primary mb-1">Sample Clearance Form</h1>
            <p className="text-sm font-semibold mb-2" style={{ color: COLOR }}>Complete one form per sample used · Required before distribution.</p>
            <p className="text-sm text-text-muted leading-relaxed max-w-xl">
              Documents the master recording sample, musical composition sample, and traditional/indigenous material for {mechAbbr} and {proAbbr} compliance. Complete before you distribute anything.
            </p>
          </div>
          
        </div>
      </div>

      {/* Section 1: Track Information */}
      <div className="glass-card rounded-xl p-5 mb-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-5 rounded-full" style={{ backgroundColor: COLOR }}/>
          <h2 className="text-base font-black text-text-primary">Section 1, Track Information</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { k: "artist_name", label: "Artist / Act Name", ph: "Performing artist or act name" },
            { k: "working_title", label: "Working Song Title", ph: "Title at time of recording" },
            { k: "final_title", label: "Final Release Title", ph: "If different from working title" },
            { k: "project", label: "Project / Album / EP", ph: "Name of the project" },
            { k: "producer_name", label: "Producer Name", ph: "Lead producer(s)" },
            { k: "label_distributor", label: "Label / Distributor", ph: "e.g. TuneCore, DistroKid, Universal" },
            { k: "isrc", label: "ISRC Code (if assigned)", ph: "Format: ZA-XXX-26-00000" },
          ].map(f => (
            <div key={f.k}>
              <label className={labelClass} style={{ color: COLOR }}>{f.label}</label>
              <input type="text" value={v(f.k)} onChange={e => set(f.k, e.target.value)} placeholder={f.ph} className={inputClass}/>
            </div>
          ))}
          <div>
            <label className={labelClass} style={{ color: COLOR }}>Planned Release Date</label>
            <input type="date" value={v("release_date")} onChange={e => set("release_date", e.target.value)} className={inputClass}/>
          </div>
        </div>
      </div>

      {/* Section 2: Sample Declaration */}
      <div className="glass-card rounded-xl p-5 mb-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-5 rounded-full" style={{ backgroundColor: "#F59E0B" }}/>
          <h2 className="text-base font-black text-text-primary">Section 2, Sample Declaration</h2>
        </div>
        <div className="space-y-5">
          {[
            {
              key: "master_sample",
              label: "Master Recording Sample",
              desc: "Did you use any portion of a previously recorded sound recording (master) owned by a 3rd party? This includes drum loops, vocal chops, instrumental phrases, or any audio lifted from existing recordings.",
              color: "#F59E0B",
            },
            {
              key: "composition_sample",
              label: "Musical Composition Sample",
              desc: "Did you use any portion of a musical composition (melody, harmony, lyrics) owned by a 3rd party, even if re-recorded? This includes interpolations and re-sung melodies.",
              color: "#EF4444",
            },
            {
              key: "traditional_sample",
              label: "Traditional / Indigenous Material",
              desc: "Does the track incorporate traditional African music, folklore, chants, rhythms, or material that may be subject to community ownership or heritage protections under SA law?",
              color: "#8B5CF6",
            },
          ].map(q => (
            <div key={q.key} className="p-4 rounded-lg" style={{ backgroundColor: `${q.color}08`, border: `1px solid ${q.color}20` }}>
              <p className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: q.color }}>{q.label}</p>
              <p className="text-sm text-text-muted leading-relaxed mb-1">{q.desc}</p>
              <YesNoToggle value={v(q.key)} onChange={val => set(q.key, val)} color={q.color}/>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Sample Details (shown if any YES) */}
      {anyYes && (
        <>
          <div className="glass-card rounded-xl p-5 mb-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-5 rounded-full" style={{ backgroundColor: COLOR }}/>
              <h2 className="text-base font-black text-text-primary">Section 3, Sample Details</h2>
            </div>
            <p className="text-xs text-text-muted mb-4">Complete for each YES answer above. If multiple samples are used, complete a separate form per sample.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { k: "sample_title", label: "Sample Title", ph: "Title of the sampled work" },
                { k: "sample_artist", label: "Sample Artist / Performer", ph: "Original performing artist" },
                { k: "sample_album", label: "Sample Album / Project", ph: "Album or project the sample is from" },
                { k: "sample_year", label: "Sample Year", ph: "Year of original release" },
                { k: "sample_length", label: "Sample Length", ph: "e.g. 4 bars, approx 8 seconds" },
                { k: "sample_location", label: "Sample Location in Your Track", ph: "e.g. Throughout, every chorus" },
                { k: "sample_isrc", label: "ISRC of Sampled Recording", ph: "If known" },
              ].map(f => (
                <div key={f.k}>
                  <label className={labelClass} style={{ color: COLOR }}>{f.label}</label>
                  <input type="text" value={v(f.k)} onChange={e => set(f.k, e.target.value)} placeholder={f.ph} className={inputClass}/>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <label className={labelClass} style={{ color: COLOR }}>Sample Description</label>
              <textarea rows={2} value={v("sample_desc")} onChange={e => set("sample_desc", e.target.value)}
                placeholder="Describe the sample: e.g. 4-bar bass loop from intro, vocal hook from chorus" className={inputClass}/>
            </div>
          </div>

          {/* Section 3B: Rights Holder */}
          <div className="glass-card rounded-xl p-5 mb-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-5 rounded-full" style={{ backgroundColor: "#8B5CF6" }}/>
              <h2 className="text-base font-black text-text-primary">Section 3B, Rights Holder Information</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { k: "master_owner", label: "Master Rights Owner (Label)", ph: "Label or entity owning the sampled master" },
                { k: "master_contact", label: "Master Licensing Contact", ph: "Name, email or phone" },
                { k: "composition_owner", label: "Composition Rights Owner", ph: "Publisher(s) or songwriter(s)" },
                { k: "publisher_contact", label: "Publisher Licensing Contact", ph: "Name, email or phone" },
                { k: "sample_writers", label: "Sample Writers / Composers", ph: "All credited writers of the sampled work" },
                { k: "sample_publishers", label: "Sample Publisher(s)", ph: "Publishing company(ies)" },
                { k: "copyright_year", label: "Copyright Year", ph: "Year of copyright registration" },
              ].map(f => (
                <div key={f.k}>
                  <label className={labelClass} style={{ color: "#8B5CF6" }}>{f.label}</label>
                  <input type="text" value={v(f.k)} onChange={e => set(f.k, e.target.value)} placeholder={f.ph} className={inputClass}/>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <label className={labelClass} style={{ color: "#8B5CF6" }}>Writer Splits (%)</label>
              <textarea rows={2} value={v("writer_splits")} onChange={e => set("writer_splits", e.target.value)}
                placeholder="e.g. 50% Writer A, 30% Writer B, 20% Writer C" className={inputClass}/>
            </div>
          </div>
        </>
      )}

      {/* Section 4: Clearance Status */}
      <div className="glass-card rounded-xl p-5 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-5 rounded-full" style={{ backgroundColor: "#10B981" }}/>
          <h2 className="text-base font-black text-text-primary">Section 4, Clearance Status</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelClass} style={{ color: "#10B981" }}>Clearance Status</label>
            <select value={v("clearance_status")} onChange={e => set("clearance_status", e.target.value)} className={inputClass}>
              <option value="">Select status</option>
              {CLEARANCE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass} style={{ color: "#10B981" }}>Date Clearance First Requested</label>
            <input type="date" value={v("clearance_date")} onChange={e => set("clearance_date", e.target.value)} className={inputClass}/>
          </div>
          <div>
            <label className={labelClass} style={{ color: "#10B981" }}>Clearance Fee Agreed ({currency})</label>
            <input type="number" value={v("clearance_fee")} onChange={e => set("clearance_fee", e.target.value)} placeholder="e.g. 15000" className={inputClass}/>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          <div>
            <label className={labelClass} style={{ color: "#10B981" }}>Royalty Arrangement</label>
            <textarea rows={2} value={v("royalty_arrangement")} onChange={e => set("royalty_arrangement", e.target.value)}
              placeholder="e.g. 5% of net receipts to master owner, 3% to publisher on all mechanical income" className={inputClass}/>
          </div>
          <div>
            <label className={labelClass} style={{ color: "#10B981" }}>Notes</label>
            <textarea rows={3} value={v("notes")} onChange={e => set("notes", e.target.value)}
              placeholder="Any additional notes regarding this clearance..." className={inputClass}/>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <p className="text-xs text-text-muted">💾 Your form is saved automatically to this device.</p>
        <button onClick={handleReset}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-text-muted hover:text-text-primary border border-border hover:border-text-muted transition-all">
          <RotateCcw size={12}/>Clear form
        </button>
      </div>

      <Link href="/dashboard/library/recording" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors">
        <ChevronLeft size={15}/>Back to Releasing Music
      </Link>
    </div>
  );
}
