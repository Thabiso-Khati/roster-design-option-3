"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";
import Link from "next/link";
import { ChevronLeft, ChevronDown, RotateCcw, Copy, Check } from "lucide-react";
import { useLocale } from "@/context/locale-context";
import { getCountryResources } from "@/lib/country-resources";
import { SaveButton } from "@/components/ui/save-button";
import { ExportButton } from "@/components/ui/export-button";

const STORAGE_KEY = "roster_song_metadata_v1";
const COLOR = "#06B6D4";

const SONGS = [1,2,3,4,5,6,7];

const SECTIONS: { id: string; label: string; color: string; fields: { key: string; label: string; placeholder?: string; type?: string; options?: string[] }[] }[] = [
  {
    id: "s01",
    label: "01 · Release & Product Information",
    color: "#06B6D4",
    fields: [
      { key: "artist_name", label: "Artist / Stage Name", placeholder: "As registered on DSPs" },
      { key: "track_title", label: "Track Title", placeholder: "Official release title" },
      { key: "version_mix", label: "Version / Mix", placeholder: "e.g. Radio Edit, Acoustic" },
      { key: "product_format", label: "Product Format", type: "select", options: ["Single","EP","Album","Compilation","Mixtape"] },
      { key: "ean_upc", label: "EAN / UPC", placeholder: "13-digit barcode" },
      { key: "catalogue_num", label: "Catalogue Number", placeholder: "Label cat. #" },
      { key: "release_date", label: "Release Date", placeholder: "DD/MM/YYYY" },
      { key: "label_name", label: "Label Name", placeholder: "Record label or 'Self-Released'" },
      { key: "distributor", label: "Distributor", placeholder: "e.g. DistroKid, TuneCore, Africori" },
      { key: "explicit", label: "Explicit Content", type: "select", options: ["Clean","Explicit","N/A"] },
    ]
  },
  {
    id: "s02",
    label: "02 · Track Technical Data",
    color: "#8B5CF6",
    fields: [
      { key: "isrc", label: "ISRC", placeholder: "e.g. ZA-ABC-25-00001" },
      { key: "disc_num", label: "Disc #", placeholder: "1" },
      { key: "track_num", label: "Track #", placeholder: "e.g. 3" },
      { key: "duration", label: "Duration", placeholder: "mm:ss" },
      { key: "bpm", label: "BPM", placeholder: "e.g. 120" },
      { key: "key", label: "Key", placeholder: "e.g. A Minor" },
      { key: "time_sig", label: "Time Signature", placeholder: "e.g. 4/4" },
      { key: "primary_genre", label: "Primary Genre", placeholder: "e.g. Afrobeats" },
      { key: "secondary_genre", label: "Secondary Genre", placeholder: "e.g. Afropop" },
      { key: "languages", label: "Language(s)", placeholder: "e.g. English, Zulu" },
      { key: "lyrics_lang_code", label: "Lyrics Language Code", placeholder: "e.g. en, zu, fr" },
    ]
  },
  {
    id: "s03",
    label: "03 · Recording Details",
    color: "#10B981",
    fields: [
      { key: "recording_date", label: "Recording Date", placeholder: "DD/MM/YYYY" },
      { key: "studio", label: "Studio", placeholder: "Studio name" },
      { key: "city", label: "City", placeholder: "City of recording" },
      { key: "country", label: "Country", placeholder: "Country of recording" },
      { key: "first_release_date", label: "First Release Date", placeholder: "DD/MM/YYYY" },
      { key: "first_release_country", label: "First Country of Release", placeholder: "e.g. South Africa" },
      { key: "p_line", label: "P-Line (℗)", placeholder: "e.g. ℗ 2025 Artist Name" },
      { key: "c_line", label: "C-Line (©)", placeholder: "e.g. © 2025 Publisher Name" },
    ]
  },
  {
    id: "s04",
    label: "04 · Master Rights & Collection",
    color: "#F59E0B",
    fields: [
      { key: "master_owner", label: "Master Owner", placeholder: "Individual / company name" },
      { key: "master_pct", label: "Master Ownership %", placeholder: "e.g. 100%" },
      { key: "collection_designee", label: "Collection Designee", placeholder: "Who collects neighbouring rights" },
      { key: "collection_rights_pct", label: "Collection Rights %", placeholder: "%" },
      { key: "territory", label: "Territory", placeholder: "e.g. World, Africa, ZA" },
      { key: "rights_begin", label: "Rights Begin Date", placeholder: "DD/MM/YYYY" },
      { key: "rights_end", label: "Rights End Date", placeholder: "DD/MM/YYYY or Perpetual" },
      { key: "neighbouring_rights_body", label: "Neighbouring Rights Body", placeholder: "e.g. SAMPRA, PPL, SoundExchange" },
      { key: "sampra_num", label: "SAMPRA #", placeholder: "Registration number" },
    ]
  },
  {
    id: "s05",
    label: "05 · Composition, Publishing & PRO",
    color: "#EC4899",
    fields: [
      { key: "composer1", label: "Composer 1", placeholder: "Full legal name" },
      { key: "composer2", label: "Composer 2", placeholder: "Full legal name" },
      { key: "composer3", label: "Composer 3", placeholder: "Full legal name" },
      { key: "lyricist1", label: "Lyricist 1", placeholder: "Full legal name" },
      { key: "lyricist2", label: "Lyricist 2", placeholder: "Full legal name" },
      { key: "lyricist3", label: "Lyricist 3", placeholder: "Full legal name" },
      { key: "producer_beatmaker", label: "Producer / Beatmaker", placeholder: "Name" },
      { key: "publisher_admin", label: "Publisher / Admin", placeholder: "Publishing company" },
      { key: "samro_work_num", label: "SAMRO Work #", placeholder: "After SAMRO registration" },
      { key: "cae_ipi_nums", label: "CAE/IPI Numbers", placeholder: "Comma-separated for all writers" },
      { key: "iswc", label: "ISWC", placeholder: "e.g. T-123.456.789-C" },
      { key: "sample_clearances", label: "Sample Clearances", placeholder: "Cleared / Pending / N/A" },
    ]
  },
  {
    id: "s06",
    label: "06 · DSP Asset References",
    color: "#EF4444",
    fields: [
      { key: "spotify_uri", label: "Spotify URI / Track ID", placeholder: "spotify:track:..." },
      { key: "apple_music_id", label: "Apple Music ID", placeholder: "Track ID" },
      { key: "boomplay_id", label: "Boomplay Track ID", placeholder: "Boomplay track #" },
      { key: "audiomack", label: "Audiomack", placeholder: "Audiomack track URL or ID" },
      { key: "youtube_music_id", label: "YouTube Music ID", placeholder: "Video / track ID" },
      { key: "youtube_content_id", label: "YouTube Content ID", placeholder: "Asset ID" },
      { key: "tiktok_sound_id", label: "TikTok Sound ID", placeholder: "Sound ID" },
      { key: "instagram_reels_id", label: "Instagram / Reels ID", placeholder: "Audio ID" },
      { key: "deezer", label: "Deezer Track ID", placeholder: "Deezer ID" },
      { key: "amazon_music", label: "Amazon Music ASIN", placeholder: "ASIN" },
      { key: "mdundo_other", label: "Mdundo / Other Platform", placeholder: "ID or URL" },
    ]
  },
  {
    id: "s07",
    label: "07 · Production Credits",
    color: "#C9A84C",
    fields: [
      { key: "produced_by", label: "Produced By", placeholder: "Producer name(s)" },
      { key: "co_produced_by", label: "Co-Produced By", placeholder: "Co-producer name(s)" },
      { key: "mixed_by", label: "Mixed By", placeholder: "Mixing engineer" },
      { key: "mastered_by", label: "Mastered By", placeholder: "Mastering engineer" },
      { key: "mixing_studio", label: "Mixing Studio", placeholder: "Studio name" },
      { key: "mastering_studio", label: "Mastering Studio", placeholder: "Studio name" },
      { key: "featured_artists", label: "Featured Artist(s)", placeholder: "As credited on DSPs" },
      { key: "session_musicians", label: "Session Musicians", placeholder: "Name · instrument" },
      { key: "choir_bvs", label: "Choir / BVs", placeholder: "Names" },
    ]
  },
  {
    id: "s08",
    label: "08 · Additional Notes",
    color: "#6B7280",
    fields: [
      { key: "notes", label: "Notes", placeholder: "Any additional information, version history, sync pitching notes, or special instructions for this track…" },
    ]
  },
];

function SectionBlock({ section, songIdx, v, set }: {
  section: typeof SECTIONS[0];
  songIdx: number;
  v: (k: string) => string;
  set: (k: string, val: string) => void;
}) {
  const [open, setOpen] = useState(songIdx === 0);
  const hasData = section.fields.some(f => v(`s${songIdx}_${section.id}_${f.key}`));

  return (
    <div className="glass-card rounded-xl overflow-hidden mb-2">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-5 py-3.5 text-left group"
      >
        <div className="flex-1 flex items-center gap-2 min-w-0">

          <p className="font-bold text-sm text-text-primary group-hover:text-brand transition-colors truncate">{section.label}</p>
          {hasData && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: section.color }}/>}
        </div>
        <ChevronDown size={15} className={`text-text-muted transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`}/>
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-border pt-4">
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            {section.fields.map(f => {
              const fKey = `s${songIdx}_${section.id}_${f.key}`;
              const labelCls = "text-[10px] font-black uppercase tracking-wider block mb-1";
              const inputBase = "bg-transparent border-b border-border focus:border-brand text-sm text-text-primary placeholder:text-text-muted focus:outline-none w-full py-1 transition-colors";
              const isNotes = f.key === "notes";
              return (
                <div key={f.key} className={isNotes ? "col-span-2" : ""}>
                  <label className={labelCls} style={{ color: section.color }}>{f.label}</label>
                  {isNotes ? (
                    <textarea
                      className="bg-transparent border border-border focus:border-brand rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none w-full p-3 transition-colors resize-none leading-relaxed"
                      rows={4}
                      placeholder={f.placeholder}
                      value={v(fKey)}
                      onChange={e => set(fKey, e.target.value)}
                    />
                  ) : f.type === "select" && f.options ? (
                    <select className={inputBase} value={v(fKey)} onChange={e => set(fKey, e.target.value)}>
                      <option value="">, Select, </option>
                      {f.options.map(o => <option key={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input
                      className={inputBase}
                      placeholder={f.placeholder}
                      value={v(fKey)}
                      onChange={e => set(fKey, e.target.value)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SongMetadataPage() {
  const handleExportPDF = () => { window.print(); };
  const { country } = useLocale();
  const res = getCountryResources(country);
  const proAbbr = res.performanceRights.abbr;
  const nrAbbr = res.neighbouringRights?.abbr ?? proAbbr;

  const localizedSections = useMemo(() => SECTIONS.map(sec => ({
    ...sec,
    fields: sec.fields.map(f => {
      if (f.key === "sampra_num") return { ...f, label: `${nrAbbr} #`, placeholder: "Registration number" };
      if (f.key === "samro_work_num") return { ...f, label: `${proAbbr} Work #`, placeholder: `After ${proAbbr} registration` };
      if (f.key === "neighbouring_rights_body") return { ...f, placeholder: `e.g. ${nrAbbr}, PPL, SoundExchange` };
      return f;
    }),
  })), [proAbbr, nrAbbr]);

  const [data, setData] = useState<Record<string, string>>({});
  const [activeSong, setActiveSong] = useState(0);
  const [copied, setCopied] = useState(false);

  useToolRestore("song-metadata", STORAGE_KEY, setData);

  const set = useCallback((key: string, val: string) => {
    setData(d => {
      const next = { ...d, [key]: val };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const v = (key: string) => data[key] || "";

  const handleResetSong = () => {
    const songTitle = v(`s${activeSong}_s01_track_title`) || `Song ${activeSong + 1}`;
    if (confirm(`Clear all data for "${songTitle}"? This cannot be undone.`)) {
      setData(d => {
        const next = { ...d };
        Object.keys(next).filter(k => k.startsWith(`s${activeSong}_`)).forEach(k => delete next[k]);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    }
  };

  const handleResetAll = () => {
    if (confirm("Clear ALL data for all 7 songs? This cannot be undone.")) {
      setData({});
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const handleCopyISRC = () => {
    const isrc = v(`s${activeSong}_s02_isrc`);
    if (isrc) {
      navigator.clipboard.writeText(isrc).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const songLabel = (i: number) => {
    const title = v(`s${i}_s01_track_title`);
    return title ? (title.length > 14 ? title.slice(0, 14) + "…" : title) : `Song ${i + 1}`;
  };

  const songHasData = (i: number) => Object.keys(data).some(k => k.startsWith(`s${i}_`));

  // Completion stats for active song
  const totalFields = localizedSections.reduce((sum, s) => sum + s.fields.length, 0);
  const filledFields = localizedSections.reduce((sum, s) =>
    sum + s.fields.filter(f => v(`s${activeSong}_${s.id}_${f.key}`)).length, 0);
  const pct = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;

  return (
    <div className="animate-fade-in max-w-4xl">
      <Link href="/dashboard/library/publishing" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary mb-6 transition-colors">
        <ChevronLeft size={15}/>Back to Publishing
      </Link>

      {/* Header */}
      <div className="glass-card rounded-2xl p-7 mb-6" style={{ borderColor: `${COLOR}25` }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: COLOR }}>Live Tool · Auto-Saved</p>
            <h1 className="text-2xl font-black text-text-primary mb-1">Song Master Metadata Record</h1>
            <p className="text-sm font-semibold mb-2" style={{ color: COLOR }}>Full catalogue & rights documentation for up to 7 songs.</p>
            <p className="text-sm text-text-muted">Complete release info, ISRC, technical data, recording details, master rights, PRO registration, DSP asset IDs, and production credits, all in one place, per song.</p>
          </div>
          <div className="flex flex-col gap-2 flex-shrink-0">
            <SaveButton toolSlug="song-metadata" storageKey={STORAGE_KEY} title={`Song Metadata`} />
            <ExportButton onPDF={handleExportPDF} />
            <button onClick={handleResetSong}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all hover:opacity-80 text-amber-400 hover:text-red-400"
              style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
              <RotateCcw size={13}/>Clear Song
            </button>
            <button onClick={handleResetAll}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all hover:opacity-80 text-text-muted hover:text-red-400"
              style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
              <RotateCcw size={13}/>Reset All
            </button>
          </div>
        </div>
      </div>

      {/* Song Tabs */}
      <div className="flex gap-0 mb-6 border-b border-border overflow-x-auto">
        {SONGS.map((_, i) => {
          const hasData = songHasData(i);
          const isActive = activeSong === i;
          return (
            <button
              key={i}
              onClick={() => setActiveSong(i)}
              className={`px-4 py-3 text-xs font-bold transition-all border-b-2 -mb-px whitespace-nowrap flex items-center gap-1.5 ${
                isActive ? "border-brand text-brand" : "border-transparent text-text-muted hover:text-text-primary"
              }`}
            >
              {songLabel(i)}
              {hasData && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: isActive ? COLOR : "#6B7280" }}/>}
            </button>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="glass-card rounded-xl p-4 mb-5 flex items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-bold text-text-primary">{songLabel(activeSong)}</p>
            <p className="text-xs font-black" style={{ color: pct >= 80 ? "#10B981" : pct >= 40 ? COLOR : "#6B7280" }}>{pct}% complete</p>
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-300"
              style={{ width: `${pct}%`, backgroundColor: pct >= 80 ? "#10B981" : pct >= 40 ? COLOR : "#6B7280" }}/>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-xs text-text-muted">{filledFields} / {totalFields} fields</p>
          {v(`s${activeSong}_s02_isrc`) && (
            <button onClick={handleCopyISRC}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-80"
              style={{ backgroundColor: `${COLOR}15`, color: COLOR }}>
              {copied ? <Check size={11}/> : <Copy size={11}/>}
              ISRC
            </button>
          )}
        </div>
      </div>

      {/* Sections */}
      <div>
        {localizedSections.map(section => (
          <SectionBlock
            key={`${activeSong}_${section.id}`}
            section={section}
            songIdx={activeSong}
            v={v}
            set={set}
          />
        ))}
      </div>

      {/* Auto-save notice */}
      <div className="glass-card rounded-xl p-4 mt-4 mb-8 flex items-start gap-3" style={{ borderColor: "rgba(201,168,76,0.15)", backgroundColor: "rgba(201,168,76,0.04)" }}>
        <span className="text-base flex-shrink-0">💾</span>
        <p className="text-xs text-text-muted leading-relaxed">
          <span className="font-semibold text-brand">Auto-saved to this device for 90 days.</span> Data is stored in your browser, screenshot or export your records regularly. One record covers up to 7 songs in your catalogue.
        </p>
      </div>
    </div>
  );
}
