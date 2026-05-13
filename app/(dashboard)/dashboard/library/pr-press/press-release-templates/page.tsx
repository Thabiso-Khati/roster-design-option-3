"use client";
import { useState } from "react";
import { Copy, Check, RotateCcw } from "lucide-react";
import { ResourcePage, inputClass, labelClass, useLocalState } from "@/components/library/module-shell";
import { SaveButton } from "@/components/ui/save-button";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";

const COLOR = "#F472B6";
const STORAGE_KEY = "roster_press_release_v1";

type Variant = "single-drop" | "tour-announce" | "signing" | "award";

interface State {
  variant: Variant;
  embargo: string; city: string; date: string;
  artist: string; managerName: string; pressName: string; pressEmail: string;
  // common
  headline: string; lede: string; quote: string; quoteAttrib: string;
  // single-drop
  songTitle: string; releaseDate: string; releaseFormat: string; producer: string; featuring: string;
  // tour
  tourName: string; tourDates: string; ticketLink: string;
  // signing
  newPartner: string; partnerType: string; dealHighlight: string;
  // award
  awardName: string; awardCategory: string; awardOrg: string;
  // outro
  bodyDetail: string; about: string;
}

const seed = (variant: Variant): State => ({
  variant, embargo: "FOR IMMEDIATE RELEASE", city: "JOHANNESBURG", date: new Date().toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" }),
  artist: "", managerName: "", pressName: "", pressEmail: "",
  headline: "", lede: "", quote: "", quoteAttrib: "",
  songTitle: "", releaseDate: "", releaseFormat: "single", producer: "", featuring: "",
  tourName: "", tourDates: "", ticketLink: "",
  newPartner: "", partnerType: "label", dealHighlight: "",
  awardName: "", awardCategory: "", awardOrg: "",
  bodyDetail: "", about: "",
});

const buildSingleDrop = (s: State) => `${s.embargo}

${s.artist.toUpperCase()} RELEASES NEW ${s.releaseFormat.toUpperCase()} "${s.songTitle.toUpperCase()}"
${s.headline}

${s.city}, ${s.date} — ${s.lede}

${s.bodyDetail}

${s.featuring ? `"${s.songTitle}" features ${s.featuring}. ` : ""}${s.producer ? `Produced by ${s.producer}. ` : ""}Out now on all major streaming platforms.

"${s.quote}"
— ${s.quoteAttrib}

ABOUT ${s.artist.toUpperCase()}
${s.about}

PRESS CONTACT
${s.pressName} · ${s.pressEmail}

###`;

const buildTour = (s: State) => `${s.embargo}

${s.artist.toUpperCase()} ANNOUNCES ${s.tourName.toUpperCase()}
${s.headline}

${s.city}, ${s.date} — ${s.lede}

Tour dates:
${s.tourDates}

${s.bodyDetail}

Tickets: ${s.ticketLink}

"${s.quote}"
— ${s.quoteAttrib}

ABOUT ${s.artist.toUpperCase()}
${s.about}

PRESS CONTACT
${s.pressName} · ${s.pressEmail}

###`;

const buildSigning = (s: State) => `${s.embargo}

${s.artist.toUpperCase()} SIGNS WITH ${s.newPartner.toUpperCase()}
${s.headline}

${s.city}, ${s.date} — ${s.lede}

${s.bodyDetail}

The deal ${s.dealHighlight}.

"${s.quote}"
— ${s.quoteAttrib}

ABOUT ${s.artist.toUpperCase()}
${s.about}

PRESS CONTACT
${s.pressName} · ${s.pressEmail}

###`;

const buildAward = (s: State) => `${s.embargo}

${s.artist.toUpperCase()} ${s.headline.toUpperCase().includes("WINS") ? "" : "WINS"} ${s.awardName.toUpperCase()}
${s.headline}

${s.city}, ${s.date} — ${s.lede}

${s.bodyDetail}

The award was conferred by ${s.awardOrg} in the ${s.awardCategory} category.

"${s.quote}"
— ${s.quoteAttrib}

ABOUT ${s.artist.toUpperCase()}
${s.about}

PRESS CONTACT
${s.pressName} · ${s.pressEmail}

###`;

const build = (s: State) => {
  switch (s.variant) {
    case "tour-announce": return buildTour(s);
    case "signing": return buildSigning(s);
    case "award": return buildAward(s);
    default: return buildSingleDrop(s);
  }
};

export default function PressReleaseTemplatesPage() {
  const [s, setS] = useLocalState<State>(STORAGE_KEY, seed("single-drop"));
  useToolRestore("press-release-templates", STORAGE_KEY, setS);
  const set = (k: keyof State) => (v: string) => setS({ ...s, [k]: v });
  const [copied, setCopied] = useState(false);
  const text = build(s);
  const copy = async () => { try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {} };

  const F = ({ label, k, rows, placeholder }: { label: string; k: keyof State; rows?: number; placeholder?: string }) => (
    <div>
      <label className={labelClass}>{label}</label>
      {rows ? <textarea className={inputClass} rows={rows} value={s[k] as string} onChange={(e) => set(k)(e.target.value)} placeholder={placeholder}/>
            : <input className={inputClass} value={s[k] as string} onChange={(e) => set(k)(e.target.value)} placeholder={placeholder}/>}
    </div>
  );

  return (
    <ResourcePage
      parentHref="/dashboard/library/pr-press"
      parentLabel="Back to PR, Press and Awards"
      color={COLOR}
      tag="PR · Templates"
      title="Press Release Templates"
      intro="Four variants — single drop, tour announcement, signing, award. Fill the fields, copy the release."
      toolbar={<><SaveButton toolSlug="press-release-templates" storageKey={STORAGE_KEY} title={`Press Release Templates — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
          
        <>
          <button onClick={() => setS(seed(s.variant))} className="text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1"><RotateCcw size={13}/> Reset</button>
          <button onClick={copy} className="text-xs font-semibold inline-flex items-center gap-1 px-3 py-1.5 rounded-lg" style={{ backgroundColor: `${COLOR}15`, color: COLOR }}>{copied ? <Check size={12}/> : <Copy size={12}/>} {copied ? "Copied" : "Copy"}</button>
        </>
            </>
      }
    >
      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Variant</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(["single-drop", "tour-announce", "signing", "award"] as Variant[]).map((v) => (
            <button key={v} onClick={() => setS({ ...s, variant: v })} className={`px-3 py-2 rounded-lg text-xs font-semibold ${s.variant === v ? "border" : "bg-surface-2 hover:bg-surface-3"}`} style={s.variant === v ? { borderColor: COLOR, color: COLOR, backgroundColor: `${COLOR}15` } : {}}>
              {v.replace("-", " ")}
            </button>
          ))}
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Common</p>
        <div className="grid grid-cols-2 gap-4">
          <F label="Embargo" k="embargo"/><F label="City (dateline)" k="city"/><F label="Date" k="date"/>
          <F label="Artist" k="artist"/>
          <F label="Headline" k="headline" placeholder="Sub-headline (max 12 words)"/>
          <F label="Press contact name" k="pressName"/>
          <F label="Press contact email" k="pressEmail"/>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Story</p>
        <div className="space-y-4">
          <F label="Lede (one sentence — who, what, when, why-it-matters)" k="lede" rows={2}/>
          {s.variant === "single-drop" && <>
            <div className="grid grid-cols-2 gap-4">
              <F label="Song title" k="songTitle"/><F label="Release date" k="releaseDate"/>
              <F label="Format (single / EP / album)" k="releaseFormat"/><F label="Producer(s)" k="producer"/>
              <F label="Featuring (if any)" k="featuring"/>
            </div>
          </>}
          {s.variant === "tour-announce" && <>
            <F label="Tour name" k="tourName"/>
            <F label="Tour dates (one per line: City — Venue — Date)" k="tourDates" rows={6}/>
            <F label="Ticket link" k="ticketLink"/>
          </>}
          {s.variant === "signing" && <>
            <F label="New partner (label / publisher / agency)" k="newPartner"/>
            <F label="Partner type" k="partnerType"/>
            <F label="Deal highlight (covers North America, etc.)" k="dealHighlight"/>
          </>}
          {s.variant === "award" && <>
            <F label="Award name" k="awardName"/>
            <F label="Category" k="awardCategory"/>
            <F label="Awarding org (SAMA / Headies / AFRIMA / etc.)" k="awardOrg"/>
          </>}
          <F label="Body detail (2-3 paragraphs)" k="bodyDetail" rows={5}/>
          <F label="Quote" k="quote" rows={3}/>
          <F label="Quote attribution" k="quoteAttrib" placeholder="Artist name / Manager name"/>
          <F label="About paragraph (60-90 words)" k="about" rows={4}/>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-3" style={{ color: COLOR }}>Preview</p>
        <pre className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap font-sans">{text}</pre>
      </section>
    </ResourcePage>
  );
}
