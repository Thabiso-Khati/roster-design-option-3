"use client";
import { Copy, Check, RotateCcw } from "lucide-react";
import { useState } from "react";
import { SaveButton } from "@/components/ui/save-button";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";
import {
  ResourcePage,
  inputClass,
  labelClass,
  useLocalState,
} from "@/components/library/module-shell";

const COLOR = "#22D3EE";
const STORAGE_KEY = "roster_sync_quote_letter_v1";

interface State {
  recipient: string;
  project: string;
  song: string;
  artist: string;
  useType: string;
  duration: string;
  territory: string;
  media: string;
  term: string;
  exclusivity: string;
  feeMaster: string;
  feeComp: string;
  mfn: string;
  expiry: string;
  contact: string;
}

const empty: State = {
  recipient: "",
  project: "",
  song: "",
  artist: "",
  useType: "Featured background, scripted scene",
  duration: "Full song / 60 seconds",
  territory: "Worldwide",
  media: "All Media in perpetuity",
  term: "Perpetuity",
  exclusivity: "Non-exclusive",
  feeMaster: "USD 8,000",
  feeComp: "USD 8,000",
  mfn: "MFN with all licensed tracks for this Production",
  expiry: "30 days",
  contact: "",
};

const buildLetter = (s: State) => `Dear ${s.recipient || "[Music Supervisor]"},

Thank you for your interest in "${s.song || "[Song]"}" performed by ${s.artist || "[Artist]"} for "${s.project || "[Project]"}".

We are pleased to offer the following on a non-binding basis, subject to formal license agreement and full and final clearance of all underlying rights:

  • Use:         ${s.useType}
  • Duration:    ${s.duration}
  • Territory:   ${s.territory}
  • Media:       ${s.media}
  • Term:        ${s.term}
  • Exclusivity: ${s.exclusivity}

Licence fees:

  • Master:      ${s.feeMaster}
  • Composition: ${s.feeComp}

MFN status: ${s.mfn}.

This quote is valid for ${s.expiry} from the date of this letter. Please confirm acceptance in writing, after which we will issue the formal license agreement and Schedule A.

Public performance income shall be collected through the relevant performing rights organisations on the cue sheet. Credit shall be afforded substantially as: "[Song] performed by [Artist], written by [Writer(s)], courtesy of [Master Owner]."

We look forward to hearing from you.

Kind regards,

${s.contact || "[Your name + title + label / publisher]"}`;

export default function SyncQuoteLetterPage() {
  const [s, setS] = useLocalState<State>(STORAGE_KEY, empty);
  useToolRestore("sync-quote-letter", STORAGE_KEY, setS);
  const set = (k: keyof State) => (v: string) => setS({ ...s, [k]: v });
  const [copied, setCopied] = useState(false);

  const letter = buildLetter(s);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(letter);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <ResourcePage
      parentHref="/dashboard/library/sync"
      parentLabel="Back to Sync"
      color={COLOR}
      tag="Sync · Template"
      title="Sync Quote Letter"
      intro="Lock the quote in writing before negotiation drift. Fill the fields, copy the letter, send."
      toolbar={<><SaveButton toolSlug="sync-quote-letter" storageKey={STORAGE_KEY} title={`Sync Quote Letter — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
          
        <>
          <button
            onClick={() => setS(empty)}
            className="text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1"
          >
            <RotateCcw size={13} /> Reset
          </button>
          <button
            onClick={copy}
            className="text-xs font-semibold inline-flex items-center gap-1 px-3 py-1.5 rounded-lg"
            style={{ backgroundColor: `${COLOR}15`, color: COLOR }}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? "Copied" : "Copy letter"}
          </button>
        </>
            </>
      }
      next={{ href: "/dashboard/library/sync/sync-pitch-tracker", label: "Sync Pitch Tracker" }}
    >
      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>
          Inputs
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Recipient</label>
            <input className={inputClass} value={s.recipient} onChange={(e) => set("recipient")(e.target.value)} placeholder="Music supervisor name" />
          </div>
          <div>
            <label className={labelClass}>Project</label>
            <input className={inputClass} value={s.project} onChange={(e) => set("project")(e.target.value)} placeholder="Show / film / ad" />
          </div>
          <div>
            <label className={labelClass}>Song</label>
            <input className={inputClass} value={s.song} onChange={(e) => set("song")(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Artist</label>
            <input className={inputClass} value={s.artist} onChange={(e) => set("artist")(e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className={labelClass}>Use type</label>
            <input className={inputClass} value={s.useType} onChange={(e) => set("useType")(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Duration of use</label>
            <input className={inputClass} value={s.duration} onChange={(e) => set("duration")(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Territory</label>
            <input className={inputClass} value={s.territory} onChange={(e) => set("territory")(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Media</label>
            <input className={inputClass} value={s.media} onChange={(e) => set("media")(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Term</label>
            <input className={inputClass} value={s.term} onChange={(e) => set("term")(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Exclusivity</label>
            <input className={inputClass} value={s.exclusivity} onChange={(e) => set("exclusivity")(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>MFN clause</label>
            <input className={inputClass} value={s.mfn} onChange={(e) => set("mfn")(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Master fee</label>
            <input className={inputClass} value={s.feeMaster} onChange={(e) => set("feeMaster")(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Composition fee</label>
            <input className={inputClass} value={s.feeComp} onChange={(e) => set("feeComp")(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Quote validity</label>
            <input className={inputClass} value={s.expiry} onChange={(e) => set("expiry")(e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className={labelClass}>Your sign-off</label>
            <input className={inputClass} value={s.contact} onChange={(e) => set("contact")(e.target.value)} placeholder="Your name + title + label / publisher + email" />
          </div>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-3" style={{ color: COLOR }}>
          Letter preview
        </p>
        <pre className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap font-sans">{letter}</pre>
      </section>
    </ResourcePage>
  );
}
