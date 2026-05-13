"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, RotateCcw, Download } from "lucide-react";
import { SaveButton } from "@/components/ui/save-button";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";
import { useLocale } from "@/context/locale-context";
import { getCountryResources } from "@/lib/country-resources";

const STORAGE_KEY = "roster_lyric_sheet_pub_v1";
const COLOR = "#06B6D4";

const SECTIONS = [
  { key: "verse1", label: "Verse 1" },
  { key: "prechorus1", label: "Pre-Chorus" },
  { key: "chorus1", label: "Chorus" },
  { key: "verse2", label: "Verse 2" },
  { key: "prechorus2", label: "Pre-Chorus (Repeat)" },
  { key: "chorus2", label: "Chorus (Repeat)" },
  { key: "bridge", label: "Bridge" },
  { key: "outro", label: "Outro / Tag" },
];

export default function LyricSheetPage() {
  const { country } = useLocale();
  const res = getCountryResources(country);
  const proAbbr  = res.performanceRights.abbr;
  const mechAbbr = res.mechanicalRights?.abbr ?? proAbbr;

  const [data, setData] = useState<Record<string, string>>({});
  useToolRestore<Record<string, string>>("lyric-sheet", STORAGE_KEY, setData);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setData(JSON.parse(saved));
    } catch {}
  }, []);

  const set = useCallback((key: string, val: string) => {
    setData(d => {
      const next = { ...d, [key]: val };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const v = (key: string) => data[key] || "";

  const inputBase = "bg-transparent border-b border-border focus:border-brand text-sm text-text-primary placeholder:text-text-muted focus:outline-none w-full py-1 transition-colors";
  const labelCls = "text-[10px] font-black uppercase tracking-wider text-text-muted block mb-1";

  const handleReset = () => {
    if (confirm("Clear all lyric sheet fields? This cannot be undone.")) {
      setData({});
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const handlePrint = () => window.print();

  return (
    <div className="animate-fade-in max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-text-muted mb-6">
        <Link href="/dashboard/library" className="hover:text-text-primary transition-colors">Toolkit</Link>
        <ChevronRight size={12}/>
        <Link href="/dashboard/library/publishing" className="hover:text-text-primary transition-colors">Publishing & Songwriting</Link>
        <ChevronRight size={12}/>
        <span className="text-text-primary">Song Lyric Sheet</span>
      </div>

      {/* Header */}
      <div className="glass-card rounded-2xl p-7 mb-6" style={{ borderColor: `${COLOR}25` }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: COLOR }}>{res.flag} {res.country} · Publishing · Fillable · Auto-Saved</p>
            <h1 className="text-2xl font-black text-text-primary mb-1">Song Lyric Sheet</h1>
            <p className="text-sm font-semibold mb-2" style={{ color: COLOR }}>{proAbbr} Registration · DSP Metadata · Sync Licensing</p>
            <p className="text-sm text-text-muted">Master lyrics record for every song. One completed sheet per track, required for {proAbbr} registration, DSP metadata submission, and sync licensing packages. Auto-saved to this device.</p>
          </div>
          <div className="flex flex-col gap-2 flex-shrink-0">
            <SaveButton toolSlug="lyric-sheet" storageKey={STORAGE_KEY} title={`Lyric Sheet — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
            <button onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all hover:opacity-80"
              style={{ backgroundColor: `${COLOR}20`, color: COLOR }}>
              <Download size={13}/>PDF
            </button>
            <button onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all hover:opacity-80 text-text-muted hover:text-red-400"
              style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
              <RotateCcw size={13}/>Reset
            </button>
          </div>
        </div>
      </div>

      {/* Legal notice */}
      <div className="glass-card rounded-xl p-4 mb-6 flex items-start gap-3" style={{ borderColor: "rgba(239,68,68,0.15)", backgroundColor: "rgba(239,68,68,0.04)" }}>
        <span className="text-sm flex-shrink-0">⚠️</span>
        <p className="text-xs text-text-muted leading-relaxed">This document is for internal record-keeping. Always complete official registration directly with {proAbbr}{mechAbbr !== proAbbr ? `, ${mechAbbr},` : ""} or the relevant PRO. Consult a qualified music attorney for licensing matters.</p>
      </div>

      {/* ─── SECTION 1: Song Identity ─── */}
      <div className="glass-card rounded-xl p-6 mb-4">
        <p className="text-xs font-black uppercase tracking-wider mb-4" style={{ color: COLOR }}>01 · Song Identity</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-5">
          <div className="col-span-2">
            <label className={labelCls}>Song Title</label>
            <input className={inputBase} placeholder="Official release title" value={v("title")} onChange={e => set("title", e.target.value)}/>
          </div>
          <div>
            <label className={labelCls}>Subtitle / Version</label>
            <input className={inputBase} placeholder="e.g. Acoustic Mix, Radio Edit" value={v("subtitle")} onChange={e => set("subtitle", e.target.value)}/>
          </div>
          <div>
            <label className={labelCls}>Copyright Year</label>
            <input className={inputBase} placeholder="e.g. 2025" value={v("copyright_year")} onChange={e => set("copyright_year", e.target.value)}/>
          </div>
          <div>
            <label className={labelCls}>Catalogue Number</label>
            <input className={inputBase} placeholder="Internal or label catalogue #" value={v("catalogue_num")} onChange={e => set("catalogue_num", e.target.value)}/>
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select className={inputBase} value={v("status")} onChange={e => set("status", e.target.value)}>
              <option value="">, Select, </option>
              <option>Demo</option>
              <option>Final Master</option>
              <option>Released</option>
              <option>Unreleased / Vault</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─── SECTION 2: Musical Properties ─── */}
      <div className="glass-card rounded-xl p-6 mb-4">
        <p className="text-xs font-black uppercase tracking-wider mb-4" style={{ color: COLOR }}>02 · Musical Properties</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-5 gap-y-5">
          <div>
            <label className={labelCls}>BPM</label>
            <input className={inputBase} placeholder="e.g. 120" value={v("bpm")} onChange={e => set("bpm", e.target.value)}/>
          </div>
          <div>
            <label className={labelCls}>Key</label>
            <input className={inputBase} placeholder="e.g. A Minor" value={v("key")} onChange={e => set("key", e.target.value)}/>
          </div>
          <div>
            <label className={labelCls}>Time Signature</label>
            <input className={inputBase} placeholder="e.g. 4/4" value={v("time_sig")} onChange={e => set("time_sig", e.target.value)}/>
          </div>
          <div>
            <label className={labelCls}>Primary Genre</label>
            <input className={inputBase} placeholder="e.g. Afrobeats" value={v("genre")} onChange={e => set("genre", e.target.value)}/>
          </div>
          <div>
            <label className={labelCls}>Mood / Feel</label>
            <input className={inputBase} placeholder="e.g. Uplifting, Dark" value={v("mood")} onChange={e => set("mood", e.target.value)}/>
          </div>
          <div>
            <label className={labelCls}>Language(s)</label>
            <input className={inputBase} placeholder="e.g. English, Zulu" value={v("language")} onChange={e => set("language", e.target.value)}/>
          </div>
          <div>
            <label className={labelCls}>Session / Recording Date</label>
            <input className={inputBase} placeholder="DD/MM/YYYY" value={v("session_date")} onChange={e => set("session_date", e.target.value)}/>
          </div>
          <div>
            <label className={labelCls}>Studio</label>
            <input className={inputBase} placeholder="Studio name" value={v("studio")} onChange={e => set("studio", e.target.value)}/>
          </div>
          <div>
            <label className={labelCls}>Produced By</label>
            <input className={inputBase} placeholder="Producer name" value={v("produced_by")} onChange={e => set("produced_by", e.target.value)}/>
          </div>
        </div>
      </div>

      {/* ─── SECTION 3: Songwriters & Rights Holders ─── */}
      <div className="glass-card rounded-xl p-6 mb-4">
        <p className="text-xs font-black uppercase tracking-wider mb-4" style={{ color: COLOR }}>03 · Songwriters & Rights Holders</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4 font-black text-text-muted uppercase tracking-wider w-6">#</th>
                <th className="text-left py-2 pr-4 font-black text-text-muted uppercase tracking-wider">Songwriter / Legal Name</th>
                <th className="text-left py-2 pr-4 font-black text-text-muted uppercase tracking-wider">PRO & CAE/IPI #</th>
                <th className="text-left py-2 pr-4 font-black text-text-muted uppercase tracking-wider">Publisher / Admin</th>
                <th className="text-left py-2 font-black text-text-muted uppercase tracking-wider">Contact / Email</th>
              </tr>
            </thead>
            <tbody>
              {[1,2,3].map(i => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-3 pr-4 font-bold" style={{ color: COLOR }}>{i}</td>
                  <td className="py-3 pr-4"><input className={inputBase} placeholder="Full legal name" value={v(`sw${i}_name`)} onChange={e => set(`sw${i}_name`, e.target.value)}/></td>
                  <td className="py-3 pr-4"><input className={inputBase} placeholder={`e.g. ${proAbbr} · 123456789`} value={v(`sw${i}_pro`)} onChange={e => set(`sw${i}_pro`, e.target.value)}/></td>
                  <td className="py-3 pr-4"><input className={inputBase} placeholder="Publisher name" value={v(`sw${i}_publisher`)} onChange={e => set(`sw${i}_publisher`, e.target.value)}/></td>
                  <td className="py-3"><input className={inputBase} placeholder="email@example.com" value={v(`sw${i}_contact`)} onChange={e => set(`sw${i}_contact`, e.target.value)}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── SECTION 4: Lyrics ─── */}
      <div className="glass-card rounded-xl p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-black uppercase tracking-wider" style={{ color: COLOR }}>04 · Lyrics</p>
          <p className="text-xs text-text-muted">Each section auto-saves as you type</p>
        </div>
        <div className="space-y-5">
          {SECTIONS.map(s => (
            <div key={s.key}>
              <label className={labelCls}>{s.label}</label>
              <textarea
                className="bg-transparent border border-border focus:border-brand rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none w-full p-3 transition-colors resize-none leading-relaxed"
                rows={4}
                placeholder={`Enter ${s.label} lyrics here…`}
                value={v(s.key)}
                onChange={e => set(s.key, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ─── SECTION 5: Translation / Transliteration Notes ─── */}
      <div className="glass-card rounded-xl p-6 mb-4">
        <p className="text-xs font-black uppercase tracking-wider mb-4" style={{ color: COLOR }}>05 · Translation / Transliteration Notes</p>
        <p className="text-xs text-text-muted mb-3">For multilingual songs, include phonetic guides, meaning notes, or word-for-word translations for sync clearance teams and DSP metadata editors.</p>
        <textarea
          className="bg-transparent border border-border focus:border-brand rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none w-full p-3 transition-colors resize-none leading-relaxed"
          rows={5}
          placeholder="e.g. 'Thula' (Zulu) = 'Be quiet / Be still', Chorus line 2 phonetic: 'Too-lah'…"
          value={v("translation_notes")}
          onChange={e => set("translation_notes", e.target.value)}
        />
      </div>

      {/* ─── SECTION 6: Digital Asset & Registration Reference ─── */}
      <div className="glass-card rounded-xl p-6 mb-4">
        <p className="text-xs font-black uppercase tracking-wider mb-4" style={{ color: COLOR }}>06 · Digital Asset & Registration Reference</p>
        <div className="space-y-4">
          {[
            { key: "isrc", label: "ISRC", placeholder: "e.g. ZA-ABC-25-00001" },
            { key: "youtube_content_id", label: "YouTube Content ID", placeholder: "Asset ID from YouTube Studio" },
            { key: "tiktok_sound_id", label: "TikTok Sound ID", placeholder: "Sound ID from TikTok Creator tools" },
            { key: "boomplay_id", label: "Boomplay / Audiomack ID", placeholder: "Track or asset ID" },
            { key: "samro_reg", label: `${proAbbr} Registration #`, placeholder: "Work number after registration" },
            { key: "iswc", label: "ISWC", placeholder: "e.g. T-123.456.789-C" },
            { key: "capasso_reg", label: `${mechAbbr !== proAbbr ? mechAbbr : "Mechanical Rights"} Registration #`, placeholder: "If registered separately" },
          ].map(f => (
            <div key={f.key} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <label className={labelCls + " col-span-1 mb-0"}>{f.label}</label>
              <div className="sm:col-span-2">
                <input className={inputBase} placeholder={f.placeholder} value={v(f.key)} onChange={e => set(f.key, e.target.value)}/>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── SECTION 7: Additional Notes ─── */}
      <div className="glass-card rounded-xl p-6 mb-8">
        <p className="text-xs font-black uppercase tracking-wider mb-3" style={{ color: COLOR }}>07 · Additional Notes</p>
        <textarea
          className="bg-transparent border border-border focus:border-brand rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none w-full p-3 transition-colors resize-none leading-relaxed"
          rows={4}
          placeholder="Sample clearances, alternate titles, publisher notes, version history…"
          value={v("additional_notes")}
          onChange={e => set("additional_notes", e.target.value)}
        />
      </div>

      {/* Auto-save indicator */}
      <div className="glass-card rounded-xl p-4 mb-6 flex items-start gap-3" style={{ borderColor: `${COLOR}20`, backgroundColor: `${COLOR}06` }}>
        <span className="text-base flex-shrink-0">💾</span>
        <p className="text-xs text-text-muted leading-relaxed"><span className="font-semibold text-brand">Auto-saved to this device.</span> Use the PDF button at the top to download a copy. One lyric sheet per song, keep your catalogue organised.</p>
      </div>

      {/* ── Bottom navigation bar ── */}
      <div className="flex items-center justify-between mt-10 pt-6 border-t border-border flex-wrap gap-3">
        <Link
          href="/dashboard/library/publishing"
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors"
        >
          <ChevronLeft size={15} />
          Back to Publishing &amp; Songwriting
        </Link>
        <Link
          href="/dashboard/library/publishing/co-writing-splits"
          className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-all"
          style={{ backgroundColor: `${COLOR}15`, color: COLOR }}
        >
          Next: Co-Writing Splits Agreement
          <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
}
