"use client";
import { useState, useEffect, useCallback } from "react";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Printer, RotateCcw } from "lucide-react";
import { useLocale } from "@/context/locale-context";
import { getCountryResources } from "@/lib/country-resources";
import { SaveButton } from "@/components/ui/save-button";
import { ExportButton } from "@/components/ui/export-button";

const STORAGE_KEY = "roster_session_song_form_v1";
const COLOR = "#06B6D4";

const inputClass = "bg-transparent border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand w-full";
const labelClass = "text-xs font-semibold uppercase tracking-wider mb-1 block";

const GENRES = ["Afropop", "Amapiano", "Maskandi", "Afrobeats", "Hip-Hop / Rap", "R&B / Soul", "Gospel", "Jazz", "Kwaito", "Bongo Flava", "Highlife", "Gengetone", "Dancehall / Reggae", "Electronic", "Other"];
const EXPLICIT_OPTIONS = ["Clean", "Explicit", "Edited version available"];
const TERRITORIES = ["Global", "South Africa only", "Africa only", "Custom"];

export default function SessionSongFormPage() {
  const handleExportPDF = () => { window.print(); };
  const { country } = useLocale();
  const res = getCountryResources(country);
  const proAbbr = res.performanceRights.abbr;
  const mechAbbr = res.mechanicalRights?.abbr ?? proAbbr;
  const nrAbbr = res.neighbouringRights?.abbr ?? proAbbr;
  const isrcPrefix = res.isrcPrefix ?? country.slice(0, 2).toUpperCase();

  const [data, setData] = useState<Record<string, string>>({});

  useToolRestore("session-song-form", STORAGE_KEY, setData);

  const set = useCallback((key: string, val: string) => {
    setData(d => {
      const next = { ...d, [key]: val };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const v = (key: string) => data[key] || "";

  // Writer splits total
  const totalSplits = [1, 2, 3, 4].reduce((sum, n) => sum + (parseFloat(v(`writer${n}_split`)) || 0), 0);
  const splitsOk = totalSplits === 100;

  const handleReset = () => {
    if (confirm("Clear all form data? This cannot be undone.")) {
      setData({});
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const STUDIO_ROLES = [
    { key: "lead_producer", label: "Lead Producer" },
    { key: "co_producer", label: "Co-Producer / Assistant Producer" },
    { key: "mix_engineer", label: "Mixing Engineer" },
    { key: "master_engineer", label: "Mastering Engineer" },
    { key: "recording_engineer", label: "Recording / Tracking Engineer" },
    { key: "assistant_engineer", label: "Assistant Engineer" },
    { key: "anr", label: "A&R Representative" },
    { key: "creative_director", label: "Creative Director" },
  ];

  const INSTRUMENTS = [
    { key: "drums", label: "Drums / Percussion" },
    { key: "bass", label: "Bass Guitar" },
    { key: "lead_guitar", label: "Lead Guitar" },
    { key: "rhythm_guitar", label: "Rhythm Guitar" },
    { key: "keys", label: "Keyboards / Piano" },
    { key: "synths", label: "Synthesisers" },
    { key: "horns", label: "Horns / Brass" },
    { key: "strings", label: "Strings" },
    { key: "bg_vocals", label: "Background Vocals" },
    { key: "samplers", label: "Samplers / Pads" },
    { key: "other_inst", label: "Other" },
  ];

  return (
    <div className="animate-fade-in max-w-3xl">
      <div className="flex items-center gap-2 text-xs text-text-muted mb-6">
          <SaveButton toolSlug="session-song-form" storageKey={STORAGE_KEY} title={`Session Song Form — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
            <ExportButton onPDF={handleExportPDF} />

        <Link href="/dashboard/library" className="hover:text-text-primary transition-colors">Toolkit</Link>
        <ChevronRight size={12}/>
        <Link href="/dashboard/library/recording" className="hover:text-text-primary transition-colors">Releasing Music</Link>
        <ChevronRight size={12}/>
        <span className="text-text-primary">Session / Song Form</span>
      </div>

      <div className="glass-card rounded-2xl p-7 mb-8" style={{ borderColor: `${COLOR}25` }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: COLOR }}>{res.flag} {res.country} · One Form Per Track · 2026</p>
            <h1 className="text-2xl font-black text-text-primary mb-1">Session / Song Form</h1>
            <p className="text-sm font-semibold mb-2" style={{ color: COLOR }}>Documents all creative and technical participants for a single track.</p>
            <p className="text-sm text-text-muted leading-relaxed max-w-xl">
              The primary source of information for ISRC registration, {proAbbr}{mechAbbr !== proAbbr ? ` / ${mechAbbr}` : ""}{nrAbbr !== proAbbr && nrAbbr !== mechAbbr ? ` / ${nrAbbr}` : ""} royalty splits, distributor metadata, liner notes, and contractual disputes. ISRC prefix for {res.country}: <span className="font-semibold" style={{ color: COLOR }}>{isrcPrefix}</span>. Complete one form per recording and retain originals.
            </p>
          </div>
          
        </div>
      </div>

      {/* Section 1: Track & Project Information */}
      <div className="glass-card rounded-xl p-5 mb-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-5 rounded-full" style={{ backgroundColor: COLOR }}/>
          <h2 className="text-base font-black text-text-primary">Section 1, Track & Project Information</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { k: "artist_name", label: "Artist / Act Name", ph: "Performing artist or act (as on release)" },
            { k: "working_title", label: "Working Song Title", ph: "Working title at time of recording" },
            { k: "final_title", label: "Final Release Title", ph: "Leave blank if same as working title" },
            { k: "project", label: "Project / Album / EP", ph: "Name of album, EP, or single project" },
            { k: "label_distributor", label: "Label / Distributor", ph: "e.g. Universal Music Africa, TuneCore" },
            { k: "isrc", label: "ISRC Code", ph: `Format: ${isrcPrefix}-XXX-26-00000` },
            { k: "languages", label: "Language(s)", ph: "e.g. isiZulu, English, French" },
            { k: "duration", label: "Duration (mm:ss)", ph: "Final mix duration" },
          ].map(f => (
            <div key={f.k}>
              <label className={labelClass} style={{ color: COLOR }}>{f.label}</label>
              <input type="text" value={v(f.k)} onChange={e => set(f.k, e.target.value)} placeholder={f.ph} className={inputClass}/>
            </div>
          ))}
          <div>
            <label className={labelClass} style={{ color: COLOR }}>Genre</label>
            <select value={v("genre")} onChange={e => set("genre", e.target.value)} className={inputClass}>
              <option value="">Select genre</option>
              {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass} style={{ color: COLOR }}>Explicit Content</label>
            <select value={v("explicit")} onChange={e => set("explicit", e.target.value)} className={inputClass}>
              <option value="">Select</option>
              {EXPLICIT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Section 2: Session Details */}
      <div className="glass-card rounded-xl p-5 mb-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-5 rounded-full" style={{ backgroundColor: "#8B5CF6" }}/>
          <h2 className="text-base font-black text-text-primary">Section 2, Session Details</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { k: "studio_name", label: "Studio / Recording Venue", ph: "Name of studio or venue" },
            { k: "studio_address", label: "Physical Address", ph: "Full street address" },
            { k: "studio_city", label: "City / Town", ph: "e.g. Johannesburg, Cape Town, Lagos" },
            { k: "studio_country", label: "Country", ph: "e.g. South Africa, Nigeria, Kenya" },
            { k: "mix_master_location", label: "Mix / Master Location", ph: "Studio or location for mixing/mastering" },
            { k: "daw_format", label: "DAW / Format", ph: "e.g. Pro Tools, Ableton, 24-bit / 48kHz" },
          ].map(f => (
            <div key={f.k}>
              <label className={labelClass} style={{ color: "#8B5CF6" }}>{f.label}</label>
              <input type="text" value={v(f.k)} onChange={e => set(f.k, e.target.value)} placeholder={f.ph} className={inputClass}/>
            </div>
          ))}
          {[
            { k: "session_start", label: "Session Start Date" },
            { k: "session_end", label: "Session End Date" },
            { k: "mix_master_date", label: "Mix / Master Date" },
          ].map(f => (
            <div key={f.k}>
              <label className={labelClass} style={{ color: "#8B5CF6" }}>{f.label}</label>
              <input type="date" value={v(f.k)} onChange={e => set(f.k, e.target.value)} className={inputClass}/>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Studio Personnel */}
      <div className="glass-card rounded-xl p-5 mb-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-5 rounded-full" style={{ backgroundColor: "#10B981" }}/>
          <h2 className="text-base font-black text-text-primary">Section 3, Studio Personnel</h2>
        </div>
        <div className="rounded-lg overflow-hidden border border-border">
          <div className="grid grid-cols-12 px-4 py-2 border-b border-border bg-surface-2 text-[10px] font-black uppercase tracking-wider text-text-muted">
            <span className="col-span-4">Role</span>
            <span className="col-span-4">Full Name(s)</span>
            <span className="col-span-4">Contact / Details</span>
          </div>
          {STUDIO_ROLES.map((role, i) => (
            <div key={role.key} className={`grid grid-cols-12 px-4 py-2.5 border-b border-border last:border-0 items-center ${i % 2 === 1 ? "bg-surface-2" : ""}`}>
              <span className="col-span-4 text-xs font-semibold text-text-muted">{role.label}</span>
              <div className="col-span-4 pr-3">
                <input type="text" value={v(`${role.key}_name`)} onChange={e => set(`${role.key}_name`, e.target.value)}
                  placeholder="Full name" className="bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none border-b border-transparent focus:border-brand w-full py-0.5"/>
              </div>
              <div className="col-span-4">
                <input type="text" value={v(`${role.key}_contact`)} onChange={e => set(`${role.key}_contact`, e.target.value)}
                  placeholder="Contact" className="bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none border-b border-transparent focus:border-brand w-full py-0.5"/>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 4: Featured Artists & Vocalists */}
      <div className="glass-card rounded-xl p-5 mb-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-5 rounded-full" style={{ backgroundColor: "#EC4899" }}/>
          <h2 className="text-base font-black text-text-primary">Section 4, Featured Artists & Vocalists</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { k: "lead_vocalists", label: "Lead Vocalist(s)", ph: "Full artist name(s), include stage and legal name" },
            { k: "featured_artists", label: "Featured Artist(s)", ph: "Any credited feature artists" },
            { k: "bg_vocalists", label: "Background Vocalists", ph: "All background / choir / harmony vocalists" },
            { k: "spoken_word", label: "Spoken Word / Rap Features", ph: "Any rap verse or spoken word contributors" },
          ].map(f => (
            <div key={f.k}>
              <label className={labelClass} style={{ color: "#EC4899" }}>{f.label}</label>
              <input type="text" value={v(f.k)} onChange={e => set(f.k, e.target.value)} placeholder={f.ph} className={inputClass}/>
            </div>
          ))}
        </div>
      </div>

      {/* Section 5: Session Musicians */}
      <div className="glass-card rounded-xl p-5 mb-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-5 rounded-full" style={{ backgroundColor: "#F59E0B" }}/>
          <h2 className="text-base font-black text-text-primary">Section 5, Session Musicians & Instrument Credits</h2>
        </div>
        <div className="rounded-lg overflow-hidden border border-border">
          <div className="grid grid-cols-12 px-4 py-2 border-b border-border bg-surface-2 text-[10px] font-black uppercase tracking-wider text-text-muted">
            <span className="col-span-4">Instrument / Part</span>
            <span className="col-span-4">Player Name(s)</span>
            <span className="col-span-4">Union / Agreement Notes</span>
          </div>
          {INSTRUMENTS.map((inst, i) => (
            <div key={inst.key} className={`grid grid-cols-12 px-4 py-2.5 border-b border-border last:border-0 items-center ${i % 2 === 1 ? "bg-surface-2" : ""}`}>
              <span className="col-span-4 text-xs font-semibold text-text-muted">{inst.label}</span>
              <div className="col-span-4 pr-3">
                <input type="text" value={v(`${inst.key}_player`)} onChange={e => set(`${inst.key}_player`, e.target.value)}
                  placeholder="Player name" className="bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none border-b border-transparent focus:border-brand w-full py-0.5"/>
              </div>
              <div className="col-span-4">
                <input type="text" value={v(`${inst.key}_notes`)} onChange={e => set(`${inst.key}_notes`, e.target.value)}
                  placeholder="Notes" className="bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none border-b border-transparent focus:border-brand w-full py-0.5"/>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 6: Songwriters & Splits */}
      <div className="glass-card rounded-xl p-5 mb-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-5 rounded-full" style={{ backgroundColor: "#8B5CF6" }}/>
          <h2 className="text-base font-black text-text-primary">Section 6, Songwriters, Publishers & Splits</h2>
        </div>
        <div className="rounded-lg overflow-hidden border border-border mb-3">
          <div className="grid grid-cols-12 px-4 py-2 border-b border-border bg-surface-2 text-[10px] font-black uppercase tracking-wider text-text-muted">
            <span className="col-span-4">Writer / Composer Full Name</span>
            <span className="col-span-2">Split %</span>
            <span className="col-span-3">{proAbbr} #</span>
            <span className="col-span-3">Publisher / PRO</span>
          </div>
          {[1, 2, 3, 4].map((n, i) => (
            <div key={n} className={`grid grid-cols-12 px-4 py-2.5 border-b border-border last:border-0 items-center ${i % 2 === 1 ? "bg-surface-2" : ""}`}>
              <div className="col-span-4 pr-2">
                <input type="text" value={v(`writer${n}_name`)} onChange={e => set(`writer${n}_name`, e.target.value)}
                  placeholder="Full legal name" className="bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none border-b border-transparent focus:border-brand w-full py-0.5"/>
              </div>
              <div className="col-span-2 pr-2">
                <input type="number" value={v(`writer${n}_split`)} onChange={e => set(`writer${n}_split`, e.target.value)}
                  placeholder="0" min="0" max="100" className="bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none border-b border-transparent focus:border-brand w-full py-0.5 text-right"/>
              </div>
              <div className="col-span-3 pr-2">
                <input type="text" value={v(`writer${n}_samro`)} onChange={e => set(`writer${n}_samro`, e.target.value)}
                  placeholder={`${proAbbr} #`} className="bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none border-b border-transparent focus:border-brand w-full py-0.5"/>
              </div>
              <div className="col-span-3">
                <input type="text" value={v(`writer${n}_publisher`)} onChange={e => set(`writer${n}_publisher`, e.target.value)}
                  placeholder="Publisher / PRO" className="bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none border-b border-transparent focus:border-brand w-full py-0.5"/>
              </div>
            </div>
          ))}
        </div>
        <div className={`flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-black ${splitsOk ? "text-green-400" : "text-amber-400"}`}
          style={{ backgroundColor: splitsOk ? "#10B98110" : "#F59E0B10" }}>
          <span>Total Splits</span>
          <span>{totalSplits.toFixed(0)}% {splitsOk ? "✓ Balanced" : ", Must equal 100%"}</span>
        </div>
      </div>

      {/* Section 7: SAMRO / CAPASSO */}
      <div className="glass-card rounded-xl p-5 mb-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-5 rounded-full" style={{ backgroundColor: "#C9A84C" }}/>
          <h2 className="text-base font-black text-text-primary">Section 7, {proAbbr}{mechAbbr !== proAbbr ? ` / ${mechAbbr}` : ""}{nrAbbr !== proAbbr && nrAbbr !== mechAbbr ? ` / ${nrAbbr}` : ""} Registration</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { k: "samro_ref", label: `${proAbbr} Work Reference Number`, ph: `${proAbbr} registration reference` },
            { k: "capasso_ref", label: `${mechAbbr} Registration Reference`, ph: `${mechAbbr} reference number` },
            { k: "sampra_ref", label: `${nrAbbr} Master Registration Reference`, ph: `${nrAbbr} reference number` },
          ].map(f => (
            <div key={f.k}>
              <label className={labelClass} style={{ color: "#C9A84C" }}>{f.label}</label>
              <input type="text" value={v(f.k)} onChange={e => set(f.k, e.target.value)} placeholder={f.ph} className={inputClass}/>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <label className={labelClass} style={{ color: "#C9A84C" }}>Notes</label>
          <textarea rows={2} value={v("registration_notes")} onChange={e => set("registration_notes", e.target.value)}
            placeholder="Any additional notes regarding registrations..." className={inputClass}/>
        </div>
      </div>

      {/* Section 8: Distributor Metadata */}
      <div className="glass-card rounded-xl p-5 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-5 rounded-full" style={{ backgroundColor: COLOR }}/>
          <h2 className="text-base font-black text-text-primary">Section 8, Distributor Metadata</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} style={{ color: COLOR }}>Distributor Platform</label>
            <input type="text" value={v("distributor")} onChange={e => set("distributor", e.target.value)} placeholder="e.g. DistroKid, TuneCore, Amuse" className={inputClass}/>
          </div>
          <div>
            <label className={labelClass} style={{ color: COLOR }}>Release Date</label>
            <input type="date" value={v("release_date")} onChange={e => set("release_date", e.target.value)} className={inputClass}/>
          </div>
          <div>
            <label className={labelClass} style={{ color: COLOR }}>UPC</label>
            <input type="text" value={v("upc")} onChange={e => set("upc", e.target.value)} placeholder="Release UPC" className={inputClass}/>
          </div>
          <div>
            <label className={labelClass} style={{ color: COLOR }}>Explicit Tag Applied</label>
            <select value={v("explicit_tag")} onChange={e => set("explicit_tag", e.target.value)} className={inputClass}>
              <option value="">Select</option>
              <option>Yes</option>
              <option>No</option>
              <option>Edited version</option>
            </select>
          </div>
          <div>
            <label className={labelClass} style={{ color: COLOR }}>Territory</label>
            <select value={v("territory")} onChange={e => set("territory", e.target.value)} className={inputClass}>
              <option value="">Select</option>
              {TERRITORIES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          {v("territory") === "Custom" && (
            <div>
              <label className={labelClass} style={{ color: COLOR }}>Custom Territory Details</label>
              <input type="text" value={v("territory_custom")} onChange={e => set("territory_custom", e.target.value)} placeholder="List specific territories" className={inputClass}/>
            </div>
          )}
        </div>
        <div className="mt-4 p-3 rounded-lg text-xs text-text-muted" style={{ backgroundColor: `${COLOR}08`, border: `1px solid ${COLOR}15` }}>
          Complete one form per recording. Retain originals. All fields for ISRC, songwriter names, and splits should be completed before distribution submission.
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
