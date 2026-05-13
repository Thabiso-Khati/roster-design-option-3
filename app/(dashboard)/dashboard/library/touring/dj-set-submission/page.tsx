"use client";
import { Printer, RotateCcw } from "lucide-react";
import { ResourcePage, inputClass, labelClass, useLocalState } from "@/components/library/module-shell";
import { SaveButton } from "@/components/ui/save-button";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";

const COLOR = "#F59E0B";
const STORAGE_KEY = "roster_dj_set_submission_v1";

interface State {
  djName: string; act: string; managerEmail: string; agentEmail: string;
  show: string; venue: string; date: string; setLength: string; setStart: string;
  djBoothLayout: string; cdjs: string; mixer: string; monitorWedges: string; monitorSettings: string;
  micChannels: string; talkback: string;
  usbBackup: string; cableNeeds: string;
  setStyle: string; energyArc: string; bpmRange: string; doNotPlay: string; mustPlay: string;
  visualSync: string; lightingNotes: string; lightingPreset: string;
  hostMc: string; introText: string; outroText: string;
  notes: string;
}

const empty: State = {
  djName: "", act: "Solo DJ", managerEmail: "", agentEmail: "",
  show: "", venue: "", date: "", setLength: "75 min", setStart: "",
  djBoothLayout: "Standard 2-deck DJ booth, 1m × 1.5m raised platform",
  cdjs: "Pioneer CDJ-3000 ×2 + DJM-V10 OR DJM-A9 (latest firmware)",
  mixer: "Pioneer DJM-V10 / DJM-A9 (latest firmware)",
  monitorWedges: "2× wedges, eye-level on booth",
  monitorSettings: "Booth monitor on independent feed; pre-fader cue on headphones",
  micChannels: "1× SM58 (cabled) on dedicated mixer channel",
  talkback: "Talkback to FOH from booth",
  usbBackup: "USB ×2 minimum (one playback, one backup); rekordbox library locked, FAT32",
  cableNeeds: "RCA / Pro DJ Link Ethernet preconfigured",
  setStyle: "Amapiano peak / Afrobeats crossover / House / etc.",
  energyArc: "Open at 110 BPM building to 122 BPM peak at the 45-min mark, settle to 116 BPM in last 10 min",
  bpmRange: "108–124 BPM",
  doNotPlay: "No tracks from acts on the same lineup. No cleared / explicit on broadcast festival.",
  mustPlay: "Latest single in last 15 min of the set",
  visualSync: "Visuals in pixel sync with track ID where possible. Liaise with VJ pre-show.",
  lightingNotes: "Build with the drop. Strobes at first peak, lasers from peak onwards.",
  lightingPreset: "Programmer to design preset live. No fixed cues.",
  hostMc: "MC announcement template attached: '[Festival] welcomes [DJ] to the stage…'",
  introText: "30-sec intro pre-cued — supplied separately",
  outroText: "ID drop (artist tag) on last track outro",
  notes: "DJ travelling with own headphones (Pioneer HDJ-X10) + USBs.",
};

const F = ({ label, value, onChange, rows }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) => (
  <div>
    <label className={labelClass}>{label}</label>
    {rows ? <textarea className={inputClass} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
          : <input className={inputClass} value={value} onChange={(e) => onChange(e.target.value)} />}
  </div>
);

export default function DJSetSubmissionPage() {
  const [s, setS] = useLocalState<State>(STORAGE_KEY, empty);
  useToolRestore("dj-set-submission", STORAGE_KEY, setS);
  const set = (k: keyof State) => (v: string) => setS({ ...s, [k]: v });

  return (
    <ResourcePage
      parentHref="/dashboard/library/touring"
      parentLabel="Back to Live, Touring & Festivals"
      color={COLOR}
      tag="Live · DJ Advance"
      title="DJ Set Submission"
      intro="DJ-specific advance — booth layout, deck spec, energy arc, do-not-play list, lighting brief. Different needs from a band rider."
      toolbar={<><SaveButton toolSlug="dj-set-submission" storageKey={STORAGE_KEY} title={`DJ Set Submission — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
          
        <>
          <button onClick={() => setS(empty)} className="text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1"><RotateCcw size={13}/> Reset</button>
          <button onClick={() => window.print()} className="text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1"><Printer size={13}/> Print / PDF</button>
        </>
            </>
      }
      next={{ href: "/dashboard/library/touring/personnel-record", label: "Tour Personnel Record" }}
    >
      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Identity</p>
        <div className="grid grid-cols-2 gap-4">
          <F label="DJ name" value={s.djName} onChange={set("djName")} />
          <F label="Act" value={s.act} onChange={set("act")} />
          <F label="Manager email" value={s.managerEmail} onChange={set("managerEmail")} />
          <F label="Agent email" value={s.agentEmail} onChange={set("agentEmail")} />
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Show</p>
        <div className="grid grid-cols-2 gap-4">
          <F label="Show / event" value={s.show} onChange={set("show")} />
          <F label="Venue" value={s.venue} onChange={set("venue")} />
          <F label="Date" value={s.date} onChange={set("date")} />
          <F label="Set length" value={s.setLength} onChange={set("setLength")} />
          <F label="Set start time" value={s.setStart} onChange={set("setStart")} />
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>DJ Booth & Tech</p>
        <div className="space-y-4">
          <F label="Booth layout" value={s.djBoothLayout} onChange={set("djBoothLayout")} />
          <F label="CDJs / decks" value={s.cdjs} onChange={set("cdjs")} />
          <F label="Mixer" value={s.mixer} onChange={set("mixer")} />
          <F label="Monitor wedges" value={s.monitorWedges} onChange={set("monitorWedges")} />
          <F label="Monitor settings" value={s.monitorSettings} onChange={set("monitorSettings")} rows={2}/>
          <F label="Mic channels" value={s.micChannels} onChange={set("micChannels")} />
          <F label="Talkback" value={s.talkback} onChange={set("talkback")} />
          <F label="USB / format" value={s.usbBackup} onChange={set("usbBackup")} />
          <F label="Cable needs" value={s.cableNeeds} onChange={set("cableNeeds")} />
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Set</p>
        <div className="space-y-4">
          <F label="Style / genre" value={s.setStyle} onChange={set("setStyle")} />
          <F label="Energy arc" value={s.energyArc} onChange={set("energyArc")} rows={2}/>
          <F label="BPM range" value={s.bpmRange} onChange={set("bpmRange")} />
          <F label="Do not play" value={s.doNotPlay} onChange={set("doNotPlay")} rows={2}/>
          <F label="Must play" value={s.mustPlay} onChange={set("mustPlay")} />
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Visuals & Lighting</p>
        <div className="space-y-4">
          <F label="Visual sync notes" value={s.visualSync} onChange={set("visualSync")} rows={2}/>
          <F label="Lighting notes" value={s.lightingNotes} onChange={set("lightingNotes")} rows={2}/>
          <F label="Lighting preset" value={s.lightingPreset} onChange={set("lightingPreset")} />
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Show Theatre</p>
        <div className="space-y-4">
          <F label="Host / MC" value={s.hostMc} onChange={set("hostMc")} />
          <F label="Intro text / track" value={s.introText} onChange={set("introText")} />
          <F label="Outro text / track" value={s.outroText} onChange={set("outroText")} />
          <F label="Notes" value={s.notes} onChange={set("notes")} rows={2}/>
        </div>
      </section>
    </ResourcePage>
  );
}
