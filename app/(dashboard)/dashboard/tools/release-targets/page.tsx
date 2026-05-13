"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus, Trash2, RotateCcw } from "lucide-react";
import { SaveButton } from "@/components/ui/save-button";
import { ExportButton } from "@/components/ui/export-button";

const STORAGE_KEY = "roster_release_targets_v1";
const COLOR = "#F59E0B";

type Tab = "streaming" | "radio" | "playlists" | "media" | "demographics";

const inputBase = "bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none border-b border-transparent focus:border-brand w-full py-0.5";
const selectBase = "bg-surface-2 border border-border rounded-lg px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-brand w-full";

function ProgressBar({ target, current, color }: { target: number; current: number; color: string }) {
  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const barColor = pct >= 100 ? "#10B981" : pct >= 50 ? "#F59E0B" : "#EF4444";
  return (
    <div className="w-full">
      <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden mb-0.5">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: barColor }}/>
      </div>
      <span className="text-[10px]" style={{ color: barColor }}>{pct.toFixed(0)}%</span>
    </div>
  );
}

export default function ReleaseTargetsPage() {
  const handleExportPDF = () => { window.print(); };
  const [data, setData] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<Tab>("streaming");
  const [mediaRows, setMediaRows] = useState([
    "Rolling Stone SA", "Channel24 / News24 Entertainment", "IOL Entertainment",
    "The Music Thread", "Juice Media", "Trompet", "Drum Magazine", "Isolezwe", "Podcast",
  ]);

  useEffect(() => {
    type Saved = { data?: Record<string, string>; mediaRows?: string[] };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const d: Saved = JSON.parse(raw);
        if (d.data) setData(d.data);
        if (d.mediaRows) setMediaRows(d.mediaRows);
        return;
      }
    } catch {}
    fetch(`/api/tools/save?slug=release-targets`)
      .then(r => r.json())
      .then(({ snapshot }) => {
        if (!snapshot?.data) return;
        const d = snapshot.data as Saved;
        if (d.data) setData(d.data);
        if (d.mediaRows) setMediaRows(d.mediaRows);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {}
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const save = useCallback((newData: Record<string, string>, newMedia: string[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ data: newData, mediaRows: newMedia }));
  }, []);

  const set = useCallback((key: string, val: string) => {
    setData(d => {
      const next = { ...d, [key]: val };
      save(next, mediaRows);
      return next;
    });
  }, [mediaRows, save]);

  const v = (key: string) => data[key] || "";
  const n = (key: string) => parseFloat(data[key] || "0") || 0;

  const addMediaRow = () => {
    const newRows = [...mediaRows, "New Outlet"];
    setMediaRows(newRows);
    save(data, newRows);
  };

  const removeMediaRow = (i: number) => {
    const newRows = mediaRows.filter((_, idx) => idx !== i);
    setMediaRows(newRows);
    save(data, newRows);
  };

  const TABS: { id: Tab; label: string }[] = [
    { id: "streaming", label: "Streaming" },
    { id: "radio", label: "Radio & TV" },
    { id: "playlists", label: "Playlists" },
    { id: "media", label: "Media & Press" },
    { id: "demographics", label: "Demographics" },
  ];

  const STREAMING_ROWS = [
    { label: "Spotify Monthly Listeners", key: "sp_listeners", color: "#10B981" },
    { label: "Spotify Streams", key: "sp_streams", color: "#10B981" },
    { label: "Spotify Followers", key: "sp_followers", color: "#10B981" },
    { label: "Apple Music Streams", key: "am_streams", color: "#EC4899" },
    { label: "Boomplay Streams", key: "bp_streams", color: "#F59E0B" },
    { label: "YouTube Views", key: "yt_views", color: "#EF4444" },
    { label: "YouTube Subscribers", key: "yt_subs", color: "#EF4444" },
    { label: "Audiomack Plays", key: "ac_plays", color: "#8B5CF6" },
    { label: "TikTok Audio Uses", key: "tt_uses", color: "#06B6D4" },
    { label: "TikTok Video Views", key: "tt_views", color: "#06B6D4" },
  ];

  const RADIO_ROWS = [
    { label: "5FM", format: "National Commercial" },
    { label: "Metro FM", format: "National Commercial" },
    { label: "Kaya 959", format: "National Commercial" },
    { label: "YFM", format: "National Commercial" },
    { label: "SABC Ukhozi FM", format: "Public / Zulu" },
    { label: "SABC Motsweding FM", format: "Public / Tswana" },
    { label: "SABC Umhlobo Wenene", format: "Public / Xhosa" },
    { label: "Community Radio", format: "Community", editable: true },
    { label: "Nigeria Station", format: "West Africa", editable: true },
    { label: "Kenya Station", format: "East Africa", editable: true },
    { label: "Ghana Station", format: "West Africa", editable: true },
    { label: "Channel O", format: "Music TV" },
    { label: "MTV Base Africa", format: "Music TV" },
    { label: "Other", format: "", editable: true },
  ];

  const PLAYLIST_ROWS = [
    { platform: "Spotify", name: "New Music Friday SA", key: "pl_sp_nmf" },
    { platform: "Spotify", name: "Afrobeats Wild", key: "pl_sp_ab" },
    { platform: "Spotify", name: "Fresh Finds Africa", key: "pl_sp_ff" },
    { platform: "Spotify", name: "Amapiano Hits", key: "pl_sp_amp" },
    { platform: "Apple Music", name: "Africa Now", key: "pl_am_africa" },
    { platform: "Apple Music", name: "Best of the Week", key: "pl_am_bow" },
    { platform: "Boomplay", name: "Trending SA", key: "pl_bp_trending" },
    { platform: "Boomplay", name: "New & Hot", key: "pl_bp_hot" },
    { platform: "Audiomack", name: "Trending SA", key: "pl_ac_trending" },
    { platform: "YouTube Music", name: "Afrobeats Mix", key: "pl_yt_afro" },
    { platform: "Custom", name: "", key: "pl_custom1", customName: true },
    { platform: "Custom", name: "", key: "pl_custom2", customName: true },
  ];

  const PITCH_STATUSES = ["Not submitted", "Submitted", "Accepted", "Rejected"];
  const MEDIA_STATUSES = ["Not pitched", "Pitched", "Feature confirmed", "Published", "Declined"];
  const RADIO_STATUSES = ["Not pitched", "Pitched", "In rotation", "Rejected"];
  const MEDIA_TYPES = ["Online review", "Interview", "Feature", "Podcast", "Print", "Social mention"];

  const acceptedPlaylists = PLAYLIST_ROWS.filter(p => v(`${p.key}_status`) === "Accepted").length;
  const publishedMedia = mediaRows.filter((_, i) => v(`media_${i}_status`) === "Published" || v(`media_${i}_status`) === "Feature confirmed").length;

  return (
    <div className="animate-fade-in max-w-4xl">
      <div className="flex items-center gap-2 text-xs text-text-muted mb-6">
          <SaveButton toolSlug="release-targets" storageKey={STORAGE_KEY} title={`Release Targets — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
            <ExportButton onPDF={handleExportPDF} />

        <Link href="/dashboard/library" className="hover:text-text-primary transition-colors">Toolkit</Link>
        <ChevronRight size={12}/>
        <Link href="/dashboard/library/recording" className="hover:text-text-primary transition-colors">Releasing Music</Link>
        <ChevronRight size={12}/>
        <span className="text-text-primary">Release Targets</span>
      </div>

      <div className="glass-card rounded-2xl p-7 mb-8" style={{ borderColor: `${COLOR}25` }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: COLOR }}>5 Sheets · Live Tool · Auto-Saved</p>
        <h1 className="text-2xl font-black text-text-primary mb-1">Release Targets</h1>
        <p className="text-sm font-semibold mb-1" style={{ color: COLOR }}>Set and track targets for your release campaign across 5 key areas.</p>
        <p className="text-sm text-text-muted">Streaming goals, radio & TV airplay, editorial playlists, media & press, and audience demographics.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 mb-6 border-b border-border overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-3 text-sm font-semibold transition-all border-b-2 -mb-px whitespace-nowrap ${
              tab === t.id ? "border-brand text-brand" : "border-transparent text-text-muted hover:text-text-primary"
            }`}>{t.label}</button>
        ))}
      </div>

      {/* Streaming Tab */}
      {tab === "streaming" && (
        <div className="space-y-4">
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border" style={{ backgroundColor: "#10B98110" }}>
              <p className="text-xs font-black uppercase tracking-wider" style={{ color: "#10B981" }}>Streaming & Audience Targets</p>
            </div>
            <div className="grid grid-cols-12 px-5 py-2 border-b border-border text-[10px] font-black uppercase tracking-wider text-text-muted">
              <span className="col-span-4">Metric</span>
              <span className="col-span-2 text-right">Target</span>
              <span className="col-span-2 text-right">Current</span>
              <span className="col-span-2 text-center">Progress</span>
              <span className="col-span-2">Notes</span>
            </div>
            {STREAMING_ROWS.map((row, i) => (
              <div key={row.key} className={`grid grid-cols-12 px-5 py-2.5 border-b border-border last:border-0 items-center ${i % 2 === 1 ? "bg-surface-2" : ""}`}>
                <span className="col-span-4 text-sm font-semibold" style={{ color: row.color }}>{row.label}</span>
                <div className="col-span-2 px-1">
                  <input type="number" value={v(`${row.key}_target`)} onChange={e => set(`${row.key}_target`, e.target.value)}
                    placeholder="0" min="0" className={inputBase + " text-right"}/>
                </div>
                <div className="col-span-2 px-1">
                  <input type="number" value={v(`${row.key}_current`)} onChange={e => set(`${row.key}_current`, e.target.value)}
                    placeholder="0" min="0" className={inputBase + " text-right"}/>
                </div>
                <div className="col-span-2 px-2">
                  <ProgressBar target={n(`${row.key}_target`)} current={n(`${row.key}_current`)} color={row.color}/>
                </div>
                <div className="col-span-2 px-1">
                  <input type="text" value={v(`${row.key}_notes`)} onChange={e => set(`${row.key}_notes`, e.target.value)}
                    placeholder="Notes" className={inputBase}/>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-text-muted">Update current figures weekly from Spotify for Artists, Boomplay Artist Hub, and YouTube Studio during your active release window.</p>
        </div>
      )}

      {/* Radio & TV Tab */}
      {tab === "radio" && (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border" style={{ backgroundColor: "#EF444410" }}>
            <p className="text-xs font-black uppercase tracking-wider" style={{ color: "#EF4444" }}>Radio & TV Airplay</p>
          </div>
          <div className="grid grid-cols-12 px-5 py-2 border-b border-border text-[10px] font-black uppercase tracking-wider text-text-muted">
            <span className="col-span-3">Station / Channel</span>
            <span className="col-span-2">Format</span>
            <span className="col-span-2 text-right">Target/Wk</span>
            <span className="col-span-2 text-right">Current/Wk</span>
            <span className="col-span-3">Status</span>
          </div>
          {RADIO_ROWS.map((row, i) => (
            <div key={i} className={`grid grid-cols-12 px-5 py-2.5 border-b border-border last:border-0 items-center ${i % 2 === 1 ? "bg-surface-2" : ""}`}>
              <div className="col-span-3 pr-2">
                {row.editable ? (
                  <input type="text" value={v(`radio_${i}_name`) || row.label} onChange={e => set(`radio_${i}_name`, e.target.value)}
                    placeholder={row.label} className={inputBase}/>
                ) : (
                  <span className="text-sm text-text-primary">{row.label}</span>
                )}
              </div>
              <span className="col-span-2 text-xs text-text-muted">{row.format}</span>
              <div className="col-span-2 px-1">
                <input type="number" value={v(`radio_${i}_target`)} onChange={e => set(`radio_${i}_target`, e.target.value)}
                  placeholder="0" min="0" className={inputBase + " text-right"}/>
              </div>
              <div className="col-span-2 px-1">
                <input type="number" value={v(`radio_${i}_current`)} onChange={e => set(`radio_${i}_current`, e.target.value)}
                  placeholder="0" min="0" className={inputBase + " text-right"}/>
              </div>
              <div className="col-span-3 pl-2">
                <select value={v(`radio_${i}_status`)} onChange={e => set(`radio_${i}_status`, e.target.value)} className={selectBase}>
                  <option value="">Status</option>
                  {RADIO_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Playlists Tab */}
      {tab === "playlists" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-muted">{acceptedPlaylists} of {PLAYLIST_ROWS.length} pitches accepted</p>
          </div>
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border" style={{ backgroundColor: "#8B5CF610" }}>
              <p className="text-xs font-black uppercase tracking-wider" style={{ color: "#8B5CF6" }}>Editorial Playlist Pitching</p>
            </div>
            <div className="grid grid-cols-12 px-5 py-2 border-b border-border text-[10px] font-black uppercase tracking-wider text-text-muted">
              <span className="col-span-2">Platform</span>
              <span className="col-span-3">Playlist</span>
              <span className="col-span-2">Pitch Date</span>
              <span className="col-span-3">Status</span>
              <span className="col-span-2">Followers</span>
            </div>
            {PLAYLIST_ROWS.map((row, i) => (
              <div key={row.key} className={`grid grid-cols-12 px-5 py-2.5 border-b border-border last:border-0 items-center ${i % 2 === 1 ? "bg-surface-2" : ""}`}>
                <span className="col-span-2 text-xs font-semibold" style={{ color: "#8B5CF6" }}>{row.platform}</span>
                <div className="col-span-3 pr-2">
                  {"customName" in row ? (
                    <input type="text" value={v(`${row.key}_name`)} onChange={e => set(`${row.key}_name`, e.target.value)}
                      placeholder="Playlist name" className={inputBase}/>
                  ) : (
                    <span className="text-sm text-text-muted">{row.name}</span>
                  )}
                </div>
                <div className="col-span-2 pr-2">
                  <input type="date" value={v(`${row.key}_date`)} onChange={e => set(`${row.key}_date`, e.target.value)}
                    className="bg-transparent text-xs text-text-primary focus:outline-none border-b border-transparent focus:border-brand w-full py-0.5"/>
                </div>
                <div className="col-span-3 pr-2">
                  <select value={v(`${row.key}_status`)} onChange={e => set(`${row.key}_status`, e.target.value)} className={selectBase}>
                    <option value="">Status</option>
                    {PITCH_STATUSES.map(s => <option key={s} value={s} style={{ color: s === "Accepted" ? "#10B981" : s === "Rejected" ? "#EF4444" : undefined }}>{s}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <input type="number" value={v(`${row.key}_followers`)} onChange={e => set(`${row.key}_followers`, e.target.value)}
                    placeholder=", " min="0" className={inputBase + " text-right"}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Media & Press Tab */}
      {tab === "media" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-muted">{publishedMedia} features published / confirmed</p>
            <button onClick={addMediaRow}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-80"
              style={{ backgroundColor: "#EC489920", color: "#EC4899", border: "1px solid #EC489930" }}>
              <Plus size={12}/>Add Outlet
            </button>
          </div>
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border" style={{ backgroundColor: "#EC489910" }}>
              <p className="text-xs font-black uppercase tracking-wider" style={{ color: "#EC4899" }}>Media & Press Coverage</p>
            </div>
            <div className="grid grid-cols-12 px-5 py-2 border-b border-border text-[10px] font-black uppercase tracking-wider text-text-muted">
              <span className="col-span-3">Outlet</span>
              <span className="col-span-2">Type</span>
              <span className="col-span-2">Pitch Date</span>
              <span className="col-span-3">Status</span>
              <span className="col-span-2">Notes / Link</span>
            </div>
            {mediaRows.map((outlet, i) => (
              <div key={i} className={`grid grid-cols-12 px-5 py-2.5 border-b border-border last:border-0 items-center ${i % 2 === 1 ? "bg-surface-2" : ""}`}>
                <div className="col-span-3 pr-2 flex items-center gap-1">
                  <input type="text" value={v(`media_${i}_name`) || outlet} onChange={e => set(`media_${i}_name`, e.target.value)}
                    placeholder={outlet} className={inputBase + " flex-1"}/>
                  {mediaRows.length > 1 && (
                    <button onClick={() => removeMediaRow(i)} className="p-0.5 text-text-muted hover:text-red-400 transition-colors flex-shrink-0">
                      <Trash2 size={10}/>
                    </button>
                  )}
                </div>
                <div className="col-span-2 pr-2">
                  <select value={v(`media_${i}_type`)} onChange={e => set(`media_${i}_type`, e.target.value)} className={selectBase}>
                    <option value="">Type</option>
                    {MEDIA_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="col-span-2 pr-2">
                  <input type="date" value={v(`media_${i}_date`)} onChange={e => set(`media_${i}_date`, e.target.value)}
                    className="bg-transparent text-xs text-text-primary focus:outline-none border-b border-transparent focus:border-brand w-full py-0.5"/>
                </div>
                <div className="col-span-3 pr-2">
                  <select value={v(`media_${i}_status`)} onChange={e => set(`media_${i}_status`, e.target.value)} className={selectBase}>
                    <option value="">Status</option>
                    {MEDIA_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <input type="text" value={v(`media_${i}_notes`)} onChange={e => set(`media_${i}_notes`, e.target.value)}
                    placeholder="URL or notes" className={inputBase}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Demographics Tab */}
      {tab === "demographics" && (
        <div className="space-y-5">
          <div className="glass-card rounded-xl p-5">
            <p className="text-xs font-black uppercase tracking-wider mb-4" style={{ color: "#06B6D4" }}>Target Audience Planning</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Primary Age Range", key: "demo_age_primary", options: ["13–17", "18–24", "25–34", "35–44", "45+"] },
                { label: "Secondary Age Range", key: "demo_age_secondary", options: ["13–17", "18–24", "25–34", "35–44", "45+"] },
                { label: "Primary Gender", key: "demo_gender", options: ["Male-skewing", "Female-skewing", "Balanced"] },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-semibold uppercase tracking-wider mb-1 block" style={{ color: "#06B6D4" }}>{f.label}</label>
                  <select value={v(f.key)} onChange={e => set(f.key, e.target.value)}
                    className="bg-transparent border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand w-full">
                    <option value="">Select</option>
                    {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              {[
                { label: "Primary Country / Market", key: "demo_country_primary" },
                { label: "Secondary Markets", key: "demo_markets_secondary" },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-semibold uppercase tracking-wider mb-1 block" style={{ color: "#06B6D4" }}>{f.label}</label>
                  <input type="text" value={v(f.key)} onChange={e => set(f.key, e.target.value)}
                    placeholder="e.g. South Africa, Nigeria, Kenya"
                    className="bg-transparent border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand w-full"/>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-xl p-5">
            <p className="text-xs font-black uppercase tracking-wider mb-4" style={{ color: "#8B5CF6" }}>Current Listener Profile (from Analytics)</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Spotify Top City", key: "actual_spotify_city" },
                { label: "Spotify Top Country", key: "actual_spotify_country" },
                { label: "Audience Gender Split", key: "actual_gender_split", ph: "e.g. 60% female / 40% male" },
                { label: "Top Age Group", key: "actual_age_group", ph: "e.g. 18–24" },
                { label: "Boomplay Top Country", key: "actual_boomplay_country" },
                { label: "YouTube Top Country", key: "actual_youtube_country" },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-semibold uppercase tracking-wider mb-1 block" style={{ color: "#8B5CF6" }}>{f.label}</label>
                  <input type="text" value={v(f.key)} onChange={e => set(f.key, e.target.value)}
                    placeholder={"ph" in f ? f.ph : "e.g. Johannesburg"}
                    className="bg-transparent border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand w-full"/>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-xl p-5">
            <p className="text-xs font-black uppercase tracking-wider mb-3" style={{ color: "#F59E0B" }}>Campaign Notes</p>
            <textarea rows={4} value={v("demo_notes")} onChange={e => set("demo_notes", e.target.value)}
              placeholder="Update this section with data from your Spotify for Artists, Boomplay Artist Hub, and YouTube Studio dashboards weekly during your active release window."
              className="bg-transparent border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand w-full"/>
          </div>
        </div>
      )}

      <div className="glass-card rounded-xl p-4 my-8 flex items-start gap-3" style={{ borderColor: "rgba(201,168,76,0.15)", backgroundColor: "rgba(201,168,76,0.04)" }}>
        <span className="text-base flex-shrink-0">💾</span>
        <p className="text-xs text-text-muted leading-relaxed"><span className="font-semibold text-brand">Auto-saved to this device for 90 days.</span> Update weekly from your streaming dashboards during your active release window.</p>
      </div>

      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <Link href="/dashboard/library/recording" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors">
          <ChevronLeft size={15}/>Back to Releasing Music
        </Link>
        <button onClick={() => {
          if (confirm("Reset all targets? This cannot be undone.")) {
            setData({});
            setMediaRows(["Rolling Stone SA", "Channel24 / News24 Entertainment", "IOL Entertainment", "The Music Thread", "Juice Media", "Trompet", "Drum Magazine", "Isolezwe", "Podcast"]);
            localStorage.removeItem(STORAGE_KEY);
          }
        }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-text-muted hover:text-text-primary border border-border hover:border-text-muted transition-all">
          <RotateCcw size={12}/>Reset targets
        </button>
      </div>
    </div>
  );
}
