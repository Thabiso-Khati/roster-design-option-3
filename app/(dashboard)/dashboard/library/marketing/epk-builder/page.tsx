"use client";
import { Printer, RotateCcw, Plus, Trash2 } from "lucide-react";
import { ResourcePage, inputClass, labelClass, useLocalState } from "@/components/library/module-shell";
import { SaveButton } from "@/components/ui/save-button";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";
import { ExportButton } from "@/components/ui/export-button";

const COLOR = "#8B5CF6";
const STORAGE_KEY = "roster_epk_v1";

interface Link { label: string; url: string; }

interface State {
  artist: string; tagline: string; genre: string; market: string; basedIn: string;
  bio50: string; bio100: string; bio250: string;
  liveLinks: Link[]; pressLinks: Link[]; videoLinks: Link[]; streamLinks: Link[]; socialLinks: Link[];
  recentReleases: string;
  pressQuotes: string;
  achievements: string;
  managerName: string; managerEmail: string; managerPhone: string;
  bookingName: string; bookingEmail: string;
  pressName: string; pressEmail: string;
  syncName: string; syncEmail: string;
}

const empty: State = {
  artist: "", tagline: "", genre: "", market: "South Africa", basedIn: "",
  bio50: "", bio100: "", bio250: "",
  liveLinks: [{ label: "Live show video", url: "" }],
  pressLinks: [{ label: "", url: "" }],
  videoLinks: [{ label: "Latest music video", url: "" }],
  streamLinks: [{ label: "Spotify", url: "" }, { label: "Apple Music", url: "" }, { label: "Audiomack", url: "" }, { label: "Boomplay", url: "" }, { label: "YouTube", url: "" }],
  socialLinks: [{ label: "Instagram", url: "" }, { label: "TikTok", url: "" }, { label: "X / Twitter", url: "" }],
  recentReleases: "",
  pressQuotes: "",
  achievements: "",
  managerName: "", managerEmail: "", managerPhone: "",
  bookingName: "", bookingEmail: "",
  pressName: "", pressEmail: "",
  syncName: "", syncEmail: "",
};

export default function EPKBuilderPage() {
  const handleExportPDF = () => { window.print(); };
  const [s, setS] = useLocalState<State>(STORAGE_KEY, empty);
  useToolRestore<State>("epk-builder", STORAGE_KEY, setS);
  const set = (k: keyof State) => (v: string) => setS({ ...s, [k]: v });
  const setLinks = (k: "liveLinks" | "pressLinks" | "videoLinks" | "streamLinks" | "socialLinks", links: Link[]) => setS({ ...s, [k]: links });

  const LinkSection = ({ name, k }: { name: string; k: "liveLinks" | "pressLinks" | "videoLinks" | "streamLinks" | "socialLinks" }) => (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: COLOR }}>{name}</p>
        <button onClick={() => setLinks(k, [...s[k], { label: "", url: "" }])} className="text-xs font-semibold inline-flex items-center gap-1" style={{ color: COLOR }}><Plus size={12}/> Add</button>
      </div>
      <div className="space-y-2">
        {s[k].map((l, i) => (
          <div key={i} className="grid grid-cols-3 gap-2">
            <input className={inputClass} placeholder="Label" value={l.label} onChange={(e) => setLinks(k, s[k].map((x, ix) => ix === i ? { ...x, label: e.target.value } : x))}/>
            <input className={`${inputClass} col-span-2`} placeholder="https://" value={l.url} onChange={(e) => setLinks(k, s[k].map((x, ix) => ix === i ? { ...x, url: e.target.value } : x))}/>
            <button onClick={() => setLinks(k, s[k].filter((_, ix) => ix !== i))} className="col-span-3 text-xs text-red-400 hover:text-red-300 inline-flex items-center gap-1"><Trash2 size={11}/></button>
          </div>
        ))}
      </div>
    </div>
  );

  const F = ({ label, k, rows, placeholder }: { label: string; k: keyof State; rows?: number; placeholder?: string }) => (
    <div>
      <label className={labelClass}>{label}</label>
      {rows ? <textarea className={inputClass} rows={rows} value={s[k] as string} onChange={(e) => set(k)(e.target.value)} placeholder={placeholder}/>
            : <input className={inputClass} value={s[k] as string} onChange={(e) => set(k)(e.target.value)} placeholder={placeholder}/>}
    </div>
  );

  return (
    <ResourcePage
      parentHref="/dashboard/library/marketing"
      parentLabel="Back to Marketing"
      color={COLOR}
      tag="Marketing · EPK"
      title="EPK Builder (Electronic Press Kit)"
      intro="Industry-standard EPK — the deeper alternative to the One-Sheet. Use for festival pitches, label A&R, agent outreach, brand deals."
      toolbar={
        <>
          <button onClick={() => setS(empty)} className="text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1"><RotateCcw size={13}/> Reset</button>
          <SaveButton toolSlug="epk-builder" storageKey={STORAGE_KEY} title={`Epk Builder — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
            <ExportButton onPDF={handleExportPDF} />
        </>
      }
      next={{ href: "/dashboard/library/marketing/pre-save-builder", label: "Pre-Save Campaign Builder" }}
    >
      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Cover</p>
        <div className="grid grid-cols-2 gap-4">
          <F label="Artist" k="artist"/>
          <F label="Tagline / one-line bio" k="tagline" placeholder="The amapiano vocalist who turned a Pretoria choir into a TikTok empire."/>
          <F label="Genre" k="genre"/>
          <F label="Primary market" k="market"/>
          <F label="Based in" k="basedIn" placeholder="Johannesburg / Lagos / etc."/>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Bios (3 lengths)</p>
        <div className="space-y-4">
          <F label="50-word bio (stage screen)" k="bio50" rows={2}/>
          <F label="100-word bio (festival programme)" k="bio100" rows={3}/>
          <F label="250-word bio (full press)" k="bio250" rows={6}/>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Highlights</p>
        <div className="space-y-4">
          <F label="Recent releases (titles + dates)" k="recentReleases" rows={3}/>
          <F label="Press quotes (max 5, with publication)" k="pressQuotes" rows={4}/>
          <F label="Achievements (charts, awards, milestones)" k="achievements" rows={3}/>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Links</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <LinkSection name="Streaming" k="streamLinks"/>
          <LinkSection name="Music videos" k="videoLinks"/>
          <LinkSection name="Live performances" k="liveLinks"/>
          <LinkSection name="Press features" k="pressLinks"/>
          <LinkSection name="Socials" k="socialLinks"/>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Contacts</p>
        <div className="grid grid-cols-2 gap-4">
          <F label="Manager name" k="managerName"/>
          <F label="Manager email" k="managerEmail"/>
          <F label="Manager phone" k="managerPhone"/>
          <div></div>
          <F label="Booking agent" k="bookingName"/>
          <F label="Booking email" k="bookingEmail"/>
          <F label="Press / PR contact" k="pressName"/>
          <F label="Press email" k="pressEmail"/>
          <F label="Sync contact" k="syncName"/>
          <F label="Sync email" k="syncEmail"/>
        </div>
      </section>
    </ResourcePage>
  );
}
