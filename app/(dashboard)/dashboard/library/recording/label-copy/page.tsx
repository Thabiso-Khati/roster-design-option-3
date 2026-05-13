"use client";
import { useState, useEffect, useCallback } from "react";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Printer, RotateCcw } from "lucide-react";
import { useLocale } from "@/context/locale-context";
import { getCountryResources } from "@/lib/country-resources";
import { SaveButton } from "@/components/ui/save-button";
import { ExportButton } from "@/components/ui/export-button";

const STORAGE_KEY = "roster_label_copy_v1";
const COLOR = "#8B5CF6";

const inputClass = "bg-transparent border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand w-full";
const labelClass = "text-xs font-semibold uppercase tracking-wider mb-1 block";
const sectionHeader = (color: string) => `flex items-center gap-3 mb-4`;

export default function LabelCopyPage() {
  const handleExportPDF = () => { window.print(); };
  const { country } = useLocale();
  const res = getCountryResources(country);
  const proAbbr = res.performanceRights.abbr;
  const nrAbbr = res.neighbouringRights?.abbr ?? proAbbr;
  const isrcPrefix = res.isrcPrefix ?? country.slice(0, 2).toUpperCase();

  const [data, setData] = useState<Record<string, string>>({});

  useToolRestore("label-copy", STORAGE_KEY, setData);

  const set = useCallback((key: string, val: string) => {
    setData(d => {
      const next = { ...d, [key]: val };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const v = (key: string) => data[key] || "";

  const handleReset = () => {
    if (confirm("Clear all form data? This cannot be undone.")) {
      setData({});
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const LANGUAGES = ["English", "isiZulu", "isiXhosa", "Setswana", "Sepedi", "Sesotho", "Tshivenda", "Xitsonga", "Afrikaans", "Swahili", "French", "Portuguese", "Yoruba", "Hausa", "Igbo", "Other"];
  const TRACKS = Array.from({ length: 10 }, (_, i) => i + 1);

  return (
    <div className="animate-fade-in max-w-3xl">
      <div className="flex items-center gap-2 text-xs text-text-muted mb-6">
          <SaveButton toolSlug="label-copy" storageKey={STORAGE_KEY} title={`Label Copy — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
            <ExportButton onPDF={handleExportPDF} />

        <Link href="/dashboard/library" className="hover:text-text-primary transition-colors">Toolkit</Link>
        <ChevronRight size={12}/>
        <Link href="/dashboard/library/recording" className="hover:text-text-primary transition-colors">Releasing Music</Link>
        <ChevronRight size={12}/>
        <span className="text-text-primary">Label Copy Template</span>
      </div>

      <div className="glass-card rounded-2xl p-7 mb-8" style={{ borderColor: `${COLOR}25` }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: COLOR }}>{res.flag} {res.country} · Fillable · Auto-Saved · 2026</p>
            <h1 className="text-2xl font-black text-text-primary mb-1">Label Copy Template</h1>
            <p className="text-sm font-semibold mb-2" style={{ color: COLOR }}>Complete metadata for every release, required by every distributor.</p>
            <p className="text-sm text-text-muted leading-relaxed max-w-xl">
              Complete this document before submission to your distributor, streaming platforms, and collecting societies. ISRC prefix for {res.country}: <span className="font-semibold text-text-primary">{isrcPrefix}</span>. Rights registration: <span className="font-semibold text-text-primary">{proAbbr}</span>. Every field must be accurate, errors here propagate across all digital storefronts and affect royalty tracking.
            </p>
          </div>
          
        </div>
      </div>

      {/* Release Information */}
      <div className="glass-card rounded-xl p-5 mb-5">
        <div className={sectionHeader(COLOR)}>
          <div className="w-1 h-5 rounded-full" style={{ backgroundColor: COLOR }}/>
          <h2 className="text-base font-black text-text-primary">Release Information</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { k: "artist_name", label: "Artist / Act Name", ph: "e.g. Tyla" },
            { k: "release_title", label: "Album / EP / Single Title", ph: "e.g. Water (The Album)" },
            { k: "catalogue_number", label: "Catalogue Number", ph: "e.g. REC-2026-001" },
            { k: "label_imprint", label: "Record Label / Imprint", ph: "e.g. Epic Records Africa" },
            { k: "genre_primary", label: "Genre (Primary)", ph: "e.g. Afropop" },
            { k: "genre_secondary", label: "Genre (Secondary)", ph: "e.g. R&B" },
            { k: "country_recording", label: "Country of Recording", ph: "e.g. South Africa" },
          ].map(f => (
            <div key={f.k}>
              <label className={labelClass} style={{ color: COLOR }}>{f.label}</label>
              <input type="text" value={v(f.k)} onChange={e => set(f.k, e.target.value)} placeholder={f.ph} className={inputClass}/>
            </div>
          ))}
          <div>
            <label className={labelClass} style={{ color: COLOR }}>Release Date (Street Date)</label>
            <input type="date" value={v("release_date")} onChange={e => set("release_date", e.target.value)} className={inputClass}/>
          </div>
          <div>
            <label className={labelClass} style={{ color: COLOR }}>Language of Lyrics</label>
            <select value={v("language")} onChange={e => set("language", e.target.value)} className={inputClass}>
              <option value="">Select language</option>
              {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Digital Release Schedule */}
      <div className="glass-card rounded-xl p-5 mb-5">
        <div className={sectionHeader("#06B6D4")}>
          <div className="w-1 h-5 rounded-full" style={{ backgroundColor: "#06B6D4" }}/>
          <h2 className="text-base font-black text-text-primary">Digital Release Schedule</h2>
        </div>
        <p className="text-xs text-text-muted mb-4">Align this with your distributor and confirm pre-save or pre-order dates on Spotify, Apple Music, Boomplay, and AudioMack at minimum.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className={labelClass} style={{ color: "#06B6D4" }}>Pre-save / Pre-order Launch Date</label>
            <input type="date" value={v("presave_date")} onChange={e => set("presave_date", e.target.value)} className={inputClass}/>
          </div>
        </div>
        {[1, 2, 3].map(n => (
          <div key={n} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
            <div>
              <label className={labelClass} style={{ color: "#06B6D4" }}>Single {n} Release Date</label>
              <input type="date" value={v(`single${n}_date`)} onChange={e => set(`single${n}_date`, e.target.value)} className={inputClass}/>
            </div>
            <div>
              <label className={labelClass} style={{ color: "#06B6D4" }}>Single {n} Platform Exclusivity</label>
              <input type="text" value={v(`single${n}_exclusivity`)} onChange={e => set(`single${n}_exclusivity`, e.target.value)} placeholder="e.g. Apple Music exclusive 7 days" className={inputClass}/>
            </div>
          </div>
        ))}
      </div>

      {/* UPC Codes */}
      <div className="glass-card rounded-xl p-5 mb-5">
        <div className={sectionHeader("#10B981")}>
          <div className="w-1 h-5 rounded-full" style={{ backgroundColor: "#10B981" }}/>
          <h2 className="text-base font-black text-text-primary">UPC / Barcode Codes</h2>
        </div>
        <p className="text-xs text-text-muted mb-4">One UPC is required per product configuration. Your distributor will generate these automatically upon submission if you do not hold your own.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { k: "upc_physical", label: "Physical CD / Vinyl UPC", ph: "e.g. 012345678901" },
            { k: "upc_digital", label: "Standard Digital UPC", ph: "e.g. 012345678901" },
            { k: "upc_hires", label: "Hi-Res / Mastered-for-Streaming UPC", ph: "e.g. 012345678901" },
          ].map(f => (
            <div key={f.k}>
              <label className={labelClass} style={{ color: "#10B981" }}>{f.label}</label>
              <input type="text" value={v(f.k)} onChange={e => set(f.k, e.target.value)} placeholder={f.ph} className={inputClass}/>
            </div>
          ))}
        </div>
      </div>

      {/* Track Listing */}
      <div className="glass-card rounded-xl p-5 mb-5">
        <div className={sectionHeader("#F59E0B")}>
          <div className="w-1 h-5 rounded-full" style={{ backgroundColor: "#F59E0B" }}/>
          <h2 className="text-base font-black text-text-primary">Track Listing & ISRC Codes</h2>
        </div>
        <p className="text-xs text-text-muted mb-4">Each individual track requires its own ISRC code. Once assigned, an ISRC is permanent, never reuse a code across different recordings.</p>
        <div className="rounded-lg overflow-hidden border border-border">
          <div className="grid grid-cols-12 px-3 py-2 border-b border-border bg-surface-2 text-[10px] font-black uppercase tracking-wider text-text-muted">
            <span className="col-span-1">#</span>
            <span className="col-span-5">Track Title</span>
            <span className="col-span-2">Duration</span>
            <span className="col-span-4">ISRC Code</span>
          </div>
          {TRACKS.map(n => (
            <div key={n} className="grid grid-cols-12 px-3 py-2 border-b border-border last:border-0 items-center gap-1">
              <span className="col-span-1 text-xs font-black" style={{ color: "#F59E0B" }}>{n}</span>
              <div className="col-span-5 pr-2">
                <input type="text" value={v(`track${n}_title`)} onChange={e => set(`track${n}_title`, e.target.value)}
                  placeholder="Song Title" className="bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none w-full border-b border-border focus:border-brand py-1"/>
              </div>
              <div className="col-span-2 pr-2">
                <input type="text" value={v(`track${n}_duration`)} onChange={e => set(`track${n}_duration`, e.target.value)}
                  placeholder="0:00" className="bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none w-full border-b border-border focus:border-brand py-1"/>
              </div>
              <div className="col-span-4">
                <input type="text" value={v(`track${n}_isrc`)} onChange={e => set(`track${n}_isrc`, e.target.value)}
                  placeholder={`${isrcPrefix}-XXX-26-00000`} className="bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none w-full border-b border-border focus:border-brand py-1"/>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Publishing & Songwriting */}
      <div className="glass-card rounded-xl p-5 mb-5">
        <div className={sectionHeader("#EC4899")}>
          <div className="w-1 h-5 rounded-full" style={{ backgroundColor: "#EC4899" }}/>
          <h2 className="text-base font-black text-text-primary">Publishing & Songwriting Credits</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className={labelClass} style={{ color: "#EC4899" }}>All compositions written by</label>
            <input type="text" value={v("writer_primary")} onChange={e => set("writer_primary", e.target.value)} placeholder="Full legal name" className={inputClass}/>
          </div>
          <div>
            <label className={labelClass} style={{ color: "#EC4899" }}>© Copyright Year</label>
            <input type="number" value={v("copyright_year")} onChange={e => set("copyright_year", e.target.value)} placeholder="2026" className={inputClass}/>
          </div>
          <div>
            <label className={labelClass} style={{ color: "#EC4899" }}>Publishing Company (if applicable)</label>
            <input type="text" value={v("publishing_company")} onChange={e => set("publishing_company", e.target.value)} placeholder="e.g. Rhythm House Publishing" className={inputClass}/>
          </div>
        </div>
        <div>
          <label className={labelClass} style={{ color: "#EC4899" }}>Exceptions (track # / co-writer / PRO)</label>
          <textarea rows={3} value={v("writer_exceptions")} onChange={e => set("writer_exceptions", e.target.value)}
            placeholder={`e.g. Track 3: Co-written with Artist A (${proAbbr}), Track 7: Co-written with Artist B (${proAbbr})`} className={inputClass}/>
        </div>
      </div>

      {/* Production Credits */}
      <div className="glass-card rounded-xl p-5 mb-5">
        <div className={sectionHeader("#C9A84C")}>
          <div className="w-1 h-5 rounded-full" style={{ backgroundColor: "#C9A84C" }}/>
          <h2 className="text-base font-black text-text-primary">Production Credits</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { k: "produced_by", label: "Produced by", ph: "Producer name(s)" },
            { k: "recorded_by", label: "Recorded by (Engineer)", ph: "Engineer name" },
            { k: "studio_name", label: "Studio Name & City", ph: "e.g. Electric Avenue Studios, Johannesburg" },
            { k: "additional_locations", label: "Additional Recording Locations", ph: "e.g. home studio, Lagos" },
            { k: "mixed_by", label: "Mixed by", ph: "Mixing engineer name" },
            { k: "mastered_by", label: "Mastered by", ph: "Mastering engineer name" },
          ].map(f => (
            <div key={f.k}>
              <label className={labelClass} style={{ color: "#C9A84C" }}>{f.label}</label>
              <input type="text" value={v(f.k)} onChange={e => set(f.k, e.target.value)} placeholder={f.ph} className={inputClass}/>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <label className={labelClass} style={{ color: "#C9A84C" }}>Exceptions (track # / producer)</label>
          <textarea rows={2} value={v("producer_exceptions")} onChange={e => set("producer_exceptions", e.target.value)}
            placeholder="e.g. Track 4: Produced by Eearz, Track 8: Produced by Rexxie" className={inputClass}/>
        </div>
      </div>

      {/* Musicians */}
      <div className="glass-card rounded-xl p-5 mb-5">
        <div className={sectionHeader(COLOR)}>
          <div className="w-1 h-5 rounded-full" style={{ backgroundColor: COLOR }}/>
          <h2 className="text-base font-black text-text-primary">Musicians & Performers</h2>
        </div>
        <p className="text-xs text-text-muted mb-4">List every musician who performed on the record. For session musicians registered with {nrAbbr}, include their membership details for neighbouring rights accuracy.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { k: "lead_vocals", label: "Lead Vocals" },
            { k: "bg_vocals", label: "Background Vocals" },
            { k: "featured_vocals", label: "Featured Vocals (track # / name)" },
            { k: "acoustic_guitar", label: "Acoustic Guitar" },
            { k: "electric_guitar", label: "Electric Guitar" },
            { k: "bass_guitar", label: "Bass Guitar" },
            { k: "drums", label: "Drums" },
            { k: "percussion_programming", label: "Percussion & Programming" },
            { k: "keys_piano", label: "Keys / Piano" },
            { k: "organ", label: "Organ" },
            { k: "synthesiser", label: "Synthesiser" },
            { k: "strings", label: "Strings" },
            { k: "brass", label: "Brass (Saxophone, Trumpet, etc.)" },
            { k: "traditional_instruments", label: "Traditional Instruments (mbira, kora, djembe)" },
            { k: "dj_turntables", label: "DJ / Turntables" },
            { k: "live_loops", label: "Live Loops / Sampling" },
          ].map(f => (
            <div key={f.k}>
              <label className={labelClass} style={{ color: COLOR }}>{f.label}</label>
              <input type="text" value={v(f.k)} onChange={e => set(f.k, e.target.value)} placeholder="Name(s)" className={inputClass}/>
            </div>
          ))}
        </div>
      </div>

      {/* Courtesy Lines */}
      <div className="glass-card rounded-xl p-5 mb-5">
        <div className={sectionHeader("#EF4444")}>
          <div className="w-1 h-5 rounded-full" style={{ backgroundColor: "#EF4444" }}/>
          <h2 className="text-base font-black text-text-primary">Featured Artist Courtesy Lines</h2>
        </div>
        <p className="text-xs text-text-muted mb-4">If any featured artist is signed to another label or has a separate management agreement, a courtesy line is legally required. Confirm wording with their representative before submission.</p>
        <div className="space-y-3">
          {[1, 2, 3].map(n => (
            <div key={n}>
              <label className={labelClass} style={{ color: "#EF4444" }}>Featured Artist {n} Appears Courtesy of</label>
              <input type="text" value={v(`courtesy${n}`)} onChange={e => set(`courtesy${n}`, e.target.value)} placeholder="Label or management company name" className={inputClass}/>
            </div>
          ))}
        </div>
      </div>

      {/* Creative & Business Team */}
      <div className="glass-card rounded-xl p-5 mb-5">
        <div className={sectionHeader("#10B981")}>
          <div className="w-1 h-5 rounded-full" style={{ backgroundColor: "#10B981" }}/>
          <h2 className="text-base font-black text-text-primary">Creative & Business Team</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { k: "anr", label: "A&R", ph: "Name" },
            { k: "management", label: "Management", ph: "Name / Company" },
            { k: "booking_agent", label: "Booking Agent", ph: "Name / Agency" },
            { k: "publicist", label: "Publicist", ph: "Name / Company" },
            { k: "artwork_design", label: "Album Artwork / Design", ph: "Name / Studio" },
            { k: "photography", label: "Photography", ph: "Photographer name" },
          ].map(f => (
            <div key={f.k}>
              <label className={labelClass} style={{ color: "#10B981" }}>{f.label}</label>
              <input type="text" value={v(f.k)} onChange={e => set(f.k, e.target.value)} placeholder={f.ph} className={inputClass}/>
            </div>
          ))}
        </div>
      </div>

      {/* Liner Notes */}
      <div className="glass-card rounded-xl p-5 mb-8">
        <div className={sectionHeader("#C9A84C")}>
          <div className="w-1 h-5 rounded-full" style={{ backgroundColor: "#C9A84C" }}/>
          <h2 className="text-base font-black text-text-primary">Artist Statement / Liner Notes</h2>
        </div>
        <p className="text-xs text-text-muted mb-3">A brief personal message from the artist for the album liner notes or digital booklet (200 words max recommended).</p>
        <textarea rows={6} value={v("liner_notes")} onChange={e => set("liner_notes", e.target.value)}
          placeholder="Write your personal message, thank yous, and dedication here..." className={inputClass}/>
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
