"use client";
import { useState } from "react";
import { Copy, Check, RotateCcw } from "lucide-react";
import { ResourcePage, inputClass, labelClass, useLocalState } from "@/components/library/module-shell";
import { SaveButton } from "@/components/ui/save-button";
import { ExportButton } from "@/components/ui/export-button";

const COLOR = "#8B5CF6";
const STORAGE_KEY = "roster_pre_save_v1";

interface State {
  artist: string; song: string; releaseDate: string;
  spotifyURI: string; appleURL: string; deezerURL: string; tidalURL: string;
  audiomackURL: string; boomplayURL: string; youtubeMusicURL: string;
  artworkURL: string; primaryColor: string; ctaText: string;
  socialProof: string;
  smartLinkProvider: "linkfire" | "feature.fm" | "smartlink" | "custom";
  smartLinkURL: string;
}

const empty: State = {
  artist: "", song: "", releaseDate: "",
  spotifyURI: "", appleURL: "", deezerURL: "", tidalURL: "",
  audiomackURL: "", boomplayURL: "", youtubeMusicURL: "",
  artworkURL: "", primaryColor: "#8B5CF6", ctaText: "Pre-save now",
  socialProof: "Joining the [N] who pre-saved this already.",
  smartLinkProvider: "linkfire", smartLinkURL: "",
};

const buildIGCopy = (s: State) => `🚨 [Pre-save] [${s.artist}] — [${s.song}] drops [${s.releaseDate}]\n\nSet your alarm. Pre-save link in bio.\n\n#${s.artist.replace(/\s/g, "")} #${s.song.replace(/\s/g, "")} #PreSave #NewMusic #AmaPiano #Afrobeats`;

const buildXCopy = (s: State) => `New: ${s.artist} — "${s.song}", out ${s.releaseDate}. Pre-save: ${s.smartLinkURL || "[link]"}`;

const buildWACopy = (s: State) => `${s.artist} drops "${s.song}" on ${s.releaseDate}.\nPre-save: ${s.smartLinkURL || "[link]"}\n\nIt'll land in your library the second it's out.`;

export default function PreSaveBuilderPage() {
  const handleExportPDF = () => { window.print(); };
  const [s, setS] = useLocalState<State>(STORAGE_KEY, empty);
  const set = (k: keyof State) => (v: string) => setS({ ...s, [k]: v });
  const [copied, setCopied] = useState<string | null>(null);
  const cp = async (t: string, key: string) => { try { await navigator.clipboard.writeText(t); setCopied(key); setTimeout(() => setCopied(null), 1500); } catch {} };

  const F = ({ label, k, placeholder, type }: { label: string; k: keyof State; placeholder?: string; type?: string }) => (
    <div>
      <label className={labelClass}>{label}</label>
      <input type={type ?? "text"} className={inputClass} value={s[k] as string} onChange={(e) => set(k)(e.target.value)} placeholder={placeholder}/>
    </div>
  );

  return (
    <ResourcePage
      parentHref="/dashboard/library/marketing"
      parentLabel="Back to Marketing"
      color={COLOR}
      tag="Marketing · Pre-Save"
      title="Pre-Save Campaign Builder"
      intro="Configure the smart-link, the platform URLs, and the supporting copy. Generate IG / X / WhatsApp copy in one place."
      toolbar={
        <button onClick={() => setS(empty)} className="text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1"><RotateCcw size={13}/> Reset</button>
      }
      next={{ href: "/dashboard/library/marketing/ai-social-captions", label: "AI Social Captions" }}
    >
      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Release</p>
        <div className="grid grid-cols-2 gap-4">
          <F label="Artist" k="artist"/>
          <F label="Song" k="song"/>
          <F label="Release date" k="releaseDate" placeholder="2026-06-14"/>
          <F label="Artwork URL" k="artworkURL" placeholder="3000×3000 image"/>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Smart link</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Provider</label>
            <select className={inputClass} value={s.smartLinkProvider} onChange={(e) => set("smartLinkProvider")(e.target.value)}>
              <option value="linkfire">Linkfire</option>
              <option value="feature.fm">Feature.fm</option>
              <option value="smartlink">Spotify SmartLink</option>
              <option value="custom">Custom (Africori / your-domain)</option>
            </select>
          </div>
          <F label="Smart link URL" k="smartLinkURL" placeholder="https://artist.lnk.to/song"/>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Platform URLs</p>
        <div className="grid grid-cols-2 gap-4">
          <F label="Spotify URI / URL" k="spotifyURI" placeholder="spotify:album:..."/>
          <F label="Apple Music URL" k="appleURL"/>
          <F label="Deezer URL" k="deezerURL"/>
          <F label="Tidal URL" k="tidalURL"/>
          <F label="Audiomack URL" k="audiomackURL"/>
          <F label="Boomplay URL" k="boomplayURL"/>
          <F label="YouTube Music URL" k="youtubeMusicURL"/>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Social copy</p>
        <div className="space-y-3">
          {[
            { id: "ig", label: "Instagram caption (with hashtags)", text: buildIGCopy(s) },
            { id: "x", label: "X / Twitter (under 280)", text: buildXCopy(s) },
            { id: "wa", label: "WhatsApp broadcast", text: buildWACopy(s) },
          ].map((b) => (
            <div key={b.id} className="bg-surface-2 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-semibold text-text-muted uppercase">{b.label}</p>
                <button onClick={() => cp(b.text, b.id)} className="text-xs font-semibold inline-flex items-center gap-1" style={{ color: COLOR }}>
                  {copied === b.id ? <Check size={12}/> : <Copy size={12}/>} {copied === b.id ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="text-sm text-text-primary whitespace-pre-wrap">{b.text}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="glass-card rounded-2xl p-5 flex items-start gap-3" style={{ borderColor: "rgba(139,92,246,0.20)", backgroundColor: "rgba(139,92,246,0.05)" }}>
        <p className="text-xs text-text-muted leading-relaxed">
          Native ROSTER smart-link service is on the roadmap (replaces the Linkfire / Feature.fm tax). Until then this builder configures the campaign and exports the copy you need across channels.
        </p>
      </div>
    </ResourcePage>
  );
}
