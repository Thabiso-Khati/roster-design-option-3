"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Printer, Plus, Trash2, RotateCcw } from "lucide-react";
import { useLocale } from "@/context/locale-context";
import { getCountryResources } from "@/lib/country-resources";
import { SaveButton } from "@/components/ui/save-button";
import { ExportButton } from "@/components/ui/export-button";

const STORAGE_KEY = "roster_lyric_sheet_v1";
const COLOR = "#EC4899";

const inputClass = "bg-transparent border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand w-full";
const labelClass = "text-xs font-semibold uppercase tracking-wider mb-1 block";

const DEFAULT_SECTIONS = [
  { label: "Verse 1", lyrics: "" },
  { label: "Pre-Chorus", lyrics: "" },
  { label: "Chorus", lyrics: "" },
  { label: "Verse 2", lyrics: "" },
  { label: "Pre-Chorus", lyrics: "" },
  { label: "Bridge", lyrics: "" },
  { label: "Chorus (Outro)", lyrics: "" },
];

const PROS_BASE = ["SAMRO", "ONDA", "COSON", "MCSK", "GHAMRO", "UPRS", "BSDA", "Other"];

export default function LyricSheetPage() {
  const handleExportPDF = () => { window.print(); };
  const { country } = useLocale();
  const res = getCountryResources(country);
  const proAbbr = res.performanceRights.abbr;
  const mechAbbr = res.mechanicalRights?.abbr ?? proAbbr;
  // Ensure user's PRO appears first in the dropdown
  const PROS = [proAbbr, ...PROS_BASE.filter(p => p !== proAbbr)];

  const [data, setData] = useState<Record<string, string>>({});
  const [sections, setSections] = useState(DEFAULT_SECTIONS);

  useEffect(() => {
    type Saved = { data?: Record<string, string>; sections?: typeof DEFAULT_SECTIONS };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const d: Saved = JSON.parse(raw);
        if (d.data) setData(d.data);
        if (d.sections) setSections(d.sections);
        return;
      }
    } catch {}
    fetch(`/api/tools/save?slug=lyric-sheet`)
      .then(r => r.json())
      .then(({ snapshot }) => {
        if (!snapshot?.data) return;
        const d = snapshot.data as Saved;
        if (d.data) setData(d.data);
        if (d.sections) setSections(d.sections);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {}
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const save = useCallback((newData: Record<string, string>, newSections: typeof DEFAULT_SECTIONS) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ data: newData, sections: newSections }));
  }, []);

  const set = useCallback((key: string, val: string) => {
    setData(d => {
      const next = { ...d, [key]: val };
      save(next, sections);
      return next;
    });
  }, [sections, save]);

  const updateSection = useCallback((index: number, field: "label" | "lyrics", val: string) => {
    setSections(prev => {
      const next = prev.map((s, i) => i === index ? { ...s, [field]: val } : s);
      save(data, next);
      return next;
    });
  }, [data, save]);

  const addSection = useCallback(() => {
    setSections(prev => {
      const next = [...prev, { label: "New Section", lyrics: "" }];
      save(data, next);
      return next;
    });
  }, [data, save]);

  const removeSection = useCallback((index: number) => {
    setSections(prev => {
      const next = prev.filter((_, i) => i !== index);
      save(data, next);
      return next;
    });
  }, [data, save]);

  const v = (key: string) => data[key] || "";

  const handleReset = () => {
    if (confirm("Clear all lyrics and form data? This cannot be undone.")) {
      setData({});
      setSections(DEFAULT_SECTIONS);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <div className="animate-fade-in max-w-3xl">
      <div className="flex items-center gap-2 text-xs text-text-muted mb-6">
          <SaveButton toolSlug="lyric-sheet" storageKey={STORAGE_KEY} title={`Lyric Sheet — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
            <ExportButton onPDF={handleExportPDF} />

        <Link href="/dashboard/library" className="hover:text-text-primary transition-colors">Toolkit</Link>
        <ChevronRight size={12}/>
        <Link href="/dashboard/library/recording" className="hover:text-text-primary transition-colors">Releasing Music</Link>
        <ChevronRight size={12}/>
        <span className="text-text-primary">Lyric Sheet Template</span>
      </div>

      <div className="glass-card rounded-2xl p-7 mb-8" style={{ borderColor: `${COLOR}25` }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: COLOR }}>{res.flag} {res.country} · Template · Auto-Saved · 2026</p>
            <h1 className="text-2xl font-black text-text-primary mb-1">Lyric Sheet Template</h1>
            <p className="text-sm font-semibold mb-2" style={{ color: COLOR }}>Formatted for {proAbbr}{mechAbbr !== proAbbr ? ` / ${mechAbbr}` : ""} registration and sync licensing submissions.</p>
            <p className="text-sm text-text-muted leading-relaxed max-w-xl">
              Submit a completed lyric sheet with every {proAbbr} registration and every sync pitch. Include every co-writer's full legal name, not just stage names.
            </p>
          </div>
          
        </div>
      </div>

      {/* Song Information */}
      <div className="glass-card rounded-xl p-5 mb-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-5 rounded-full" style={{ backgroundColor: COLOR }}/>
          <h2 className="text-base font-black text-text-primary">Song Information</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div className="sm:col-span-2">
            <label className={labelClass} style={{ color: COLOR }}>Song Title</label>
            <input type="text" value={v("song_title")} onChange={e => set("song_title", e.target.value)}
              placeholder="Song Title" className="bg-transparent border border-border rounded-lg px-3 py-2 text-lg font-black text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand w-full"/>
          </div>
          <div>
            <label className={labelClass} style={{ color: COLOR }}>Copyright Year</label>
            <input type="number" value={v("copyright_year")} onChange={e => set("copyright_year", e.target.value)}
              placeholder="2026" className={inputClass}/>
          </div>
        </div>

        <p className="text-xs font-black uppercase tracking-wider mb-3" style={{ color: COLOR }}>Songwriters</p>
        <p className="text-xs text-text-muted mb-4">PRO = Performing Rights Organisation. {res.country} writers register with {proAbbr}. List each co-writer's PRO affiliation accurately.</p>

        {[1, 2, 3].map(n => (
          <div key={n} className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-3 p-3 rounded-lg" style={{ backgroundColor: `${COLOR}05`, border: `1px solid ${COLOR}15` }}>
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider mb-1 block" style={{ color: COLOR }}>Songwriter {n}</label>
              <input type="text" value={v(`writer${n}_name`)} onChange={e => set(`writer${n}_name`, e.target.value)}
                placeholder="Full legal name" className={inputClass}/>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider mb-1 block" style={{ color: COLOR }}>Publishing</label>
              <input type="text" value={v(`writer${n}_publishing`)} onChange={e => set(`writer${n}_publishing`, e.target.value)}
                placeholder="Publisher name" className={inputClass}/>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider mb-1 block" style={{ color: COLOR }}>PRO</label>
              <select value={v(`writer${n}_pro`)} onChange={e => set(`writer${n}_pro`, e.target.value)} className={inputClass}>
                <option value="">Select PRO</option>
                {PROS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider mb-1 block" style={{ color: COLOR }}>Contact</label>
              <input type="text" value={v(`writer${n}_contact`)} onChange={e => set(`writer${n}_contact`, e.target.value)}
                placeholder="Email or phone" className={inputClass}/>
            </div>
          </div>
        ))}
      </div>

      {/* Lyrics */}
      <div className="glass-card rounded-xl p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-5 rounded-full" style={{ backgroundColor: "#10B981" }}/>
            <h2 className="text-base font-black text-text-primary">Lyrics</h2>
          </div>
          <button onClick={addSection}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-80"
            style={{ backgroundColor: "#10B98120", color: "#10B981", border: "1px solid #10B98130" }}>
            <Plus size={12}/>Add Section
          </button>
        </div>

        <p className="text-xs text-text-muted mb-5">For songs with lyrics in multiple languages, indicate the language in the section label, e.g. "Verse 1, Zulu".</p>

        <div className="space-y-5">
          {sections.map((section, i) => (
            <div key={i}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: "#10B981" }}/>
                <input type="text" value={section.label} onChange={e => updateSection(i, "label", e.target.value)}
                  className="bg-transparent text-xs font-black uppercase tracking-wider text-text-primary focus:outline-none border-b border-transparent focus:border-brand flex-1 py-0.5"
                  style={{ color: "#10B981" }}/>
                {sections.length > 1 && (
                  <button onClick={() => removeSection(i)} className="p-1 text-text-muted hover:text-red-400 transition-colors rounded">
                    <Trash2 size={12}/>
                  </button>
                )}
              </div>
              <textarea rows={5} value={section.lyrics} onChange={e => updateSection(i, "lyrics", e.target.value)}
                placeholder="Lyrics..."
                className="bg-transparent border border-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand w-full leading-relaxed font-mono resize-y"/>
              {i < sections.length - 1 && <div className="border-t border-border mt-5"/>}
            </div>
          ))}
        </div>
      </div>

      {/* How to Use */}
      <div className="glass-card rounded-xl p-5 mb-8" style={{ borderColor: "#C9A84C20", backgroundColor: "#C9A84C04" }}>
        <p className="text-xs font-black uppercase tracking-wider mb-3" style={{ color: "#C9A84C" }}>How to Use This Template</p>
        <div className="space-y-2">
          {[
            "Replace all placeholder text with your actual lyrics.",
            "Include every writer's full legal name, not just stage names.",
            "For songs with lyrics in multiple languages, indicate the language in square brackets in the section label, e.g. [Verse 1, Zulu].",
            `Submit a completed lyric sheet with every ${proAbbr} registration and every sync pitch.`,
            "Keep a clean digital copy of the finalised lyric sheet in your release archive.",
          ].map((tip, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-[10px] font-black flex-shrink-0 mt-0.5" style={{ color: "#C9A84C" }}>{i + 1}.</span>
              <p className="text-sm text-text-muted leading-relaxed">{tip}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <p className="text-xs text-text-muted">💾 Your lyrics are saved automatically to this device.</p>
        <button onClick={handleReset}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-text-muted hover:text-text-primary border border-border hover:border-text-muted transition-all">
          <RotateCcw size={12}/>Clear all
        </button>
      </div>

      <Link href="/dashboard/library/recording" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors">
        <ChevronLeft size={15}/>Back to Releasing Music
      </Link>
    </div>
  );
}
