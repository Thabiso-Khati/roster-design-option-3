"use client";
import { Printer, RotateCcw } from "lucide-react";
import { SaveButton } from "@/components/ui/save-button";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";
import {
  ResourcePage,
  inputClass,
  labelClass,
  useLocalState,
} from "@/components/library/module-shell";

const COLOR = "#22D3EE";
const STORAGE_KEY = "roster_sync_pitch_one_sheet_v1";

interface State {
  songTitle: string;
  artist: string;
  duration: string;
  bpm: string;
  key: string;
  genre: string;
  mood: string;
  instrumentation: string;
  vocalStyle: string;
  lyricsTheme: string;
  comparable: string;
  isrc: string;
  iswc: string;
  masterOwner: string;
  publisher: string;
  prosOfWriters: string;
  splitsConfirmed: string;
  samplesCleared: string;
  oneStop: string;
  territory: string;
  fee: string;
  contact: string;
}

const empty: State = {
  songTitle: "",
  artist: "",
  duration: "",
  bpm: "",
  key: "",
  genre: "",
  mood: "",
  instrumentation: "",
  vocalStyle: "",
  lyricsTheme: "",
  comparable: "",
  isrc: "",
  iswc: "",
  masterOwner: "",
  publisher: "",
  prosOfWriters: "",
  splitsConfirmed: "Yes",
  samplesCleared: "Yes",
  oneStop: "Yes",
  territory: "Worldwide",
  fee: "",
  contact: "",
};

const Field = ({
  label,
  value,
  onChange,
  placeholder,
  full = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  full?: boolean;
}) => (
  <div className={full ? "col-span-2" : ""}>
    <label className={labelClass}>{label}</label>
    <input
      className={inputClass}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

export default function SyncPitchOneSheetPage() {
  const [s, setS] = useLocalState<State>(STORAGE_KEY, empty);
  useToolRestore("sync-pitch-one-sheet", STORAGE_KEY, setS);
  const set = (k: keyof State) => (v: string) => setS({ ...s, [k]: v });

  return (
    <ResourcePage
      parentHref="/dashboard/library/sync"
      parentLabel="Back to Sync"
      color={COLOR}
      tag="Sync · Per song"
      title="Sync Pitch One-Sheet"
      intro="The atomic unit of sync. One sheet per song. Send this to every music supervisor — they want a sub-30-second read."
      toolbar={<><SaveButton toolSlug="sync-pitch-one-sheet" storageKey={STORAGE_KEY} title={`Sync Pitch One Sheet — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
          
        <>
          <button
            onClick={() => setS(empty)}
            className="text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1"
          >
            <RotateCcw size={13} /> Reset
          </button>
          <button
            onClick={() => window.print()}
            className="text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1"
          >
            <Printer size={13} /> Print / PDF
          </button>
        </>
            </>
      }
    >
      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>
          Identity
        </p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Song Title" value={s.songTitle} onChange={set("songTitle")} placeholder="Track name" />
          <Field label="Artist" value={s.artist} onChange={set("artist")} placeholder="Performer" />
          <Field label="Duration" value={s.duration} onChange={set("duration")} placeholder="3:42" />
          <Field label="Genre" value={s.genre} onChange={set("genre")} placeholder="Afrobeats / Amapiano / etc." />
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>
          Sound Profile
        </p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="BPM" value={s.bpm} onChange={set("bpm")} placeholder="120" />
          <Field label="Key" value={s.key} onChange={set("key")} placeholder="A minor" />
          <Field label="Mood" value={s.mood} onChange={set("mood")} placeholder="Hopeful · driving · cinematic" full />
          <Field label="Instrumentation" value={s.instrumentation} onChange={set("instrumentation")} placeholder="Log drums, marimba, choir, 808" full />
          <Field label="Vocal Style" value={s.vocalStyle} onChange={set("vocalStyle")} placeholder="Female lead · isiZulu · gospel-tinged" />
          <Field label="Comparable Artists" value={s.comparable} onChange={set("comparable")} placeholder="Sounds like — for music supervisors" />
          <div className="col-span-2">
            <label className={labelClass}>Lyrics Theme</label>
            <textarea
              className={inputClass}
              value={s.lyricsTheme}
              onChange={(e) => setS({ ...s, lyricsTheme: e.target.value })}
              placeholder="Two sentences. Themes that translate across cultures: love, struggle, triumph, place."
              rows={3}
            />
          </div>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>
          Rights & Clearance
        </p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="ISRC" value={s.isrc} onChange={set("isrc")} placeholder="ZA-XXX-25-00001" />
          <Field label="ISWC" value={s.iswc} onChange={set("iswc")} placeholder="T-000.000.001-0" />
          <Field label="Master Owner" value={s.masterOwner} onChange={set("masterOwner")} placeholder="Label or artist's loan-out company" full />
          <Field label="Publisher(s)" value={s.publisher} onChange={set("publisher")} placeholder="Comma-separated, with shares" full />
          <Field label="Writer PROs" value={s.prosOfWriters} onChange={set("prosOfWriters")} placeholder="SAMRO, COSON, ASCAP, etc." full />
          <div>
            <label className={labelClass}>Splits Confirmed</label>
            <select
              className={inputClass}
              value={s.splitsConfirmed}
              onChange={(e) => setS({ ...s, splitsConfirmed: e.target.value })}
            >
              <option>Yes — written</option>
              <option>Verbal only</option>
              <option>Disputed</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Samples / Interpolations Cleared</label>
            <select
              className={inputClass}
              value={s.samplesCleared}
              onChange={(e) => setS({ ...s, samplesCleared: e.target.value })}
            >
              <option>Yes</option>
              <option>No samples</option>
              <option>In progress</option>
              <option>No</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>One-Stop Clearance</label>
            <select
              className={inputClass}
              value={s.oneStop}
              onChange={(e) => setS({ ...s, oneStop: e.target.value })}
            >
              <option>Yes — master + comp under one party</option>
              <option>No — separate signoffs needed</option>
            </select>
          </div>
          <Field label="Territory Available" value={s.territory} onChange={set("territory")} />
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>
          Commercial
        </p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Quote Range / Floor" value={s.fee} onChange={set("fee")} placeholder="USD / ZAR / EUR — see Quote Calculator" full />
          <Field label="Sync Contact" value={s.contact} onChange={set("contact")} placeholder="Name + email + phone" full />
        </div>
      </section>
    </ResourcePage>
  );
}
