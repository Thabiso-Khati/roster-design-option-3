"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ChevronDown, Printer } from "lucide-react";
import { useLocale } from "@/context/locale-context";
import { getCountryResources } from "@/lib/country-resources";

const COLOR = "#10B981";

const PHASES = [
  {
    id: "writing",
    num: "1",
    title: "Writing & Recording",
    color: "#10B981",
    what: "This is where the raw material is created. For an album, this phase involves a dedicated period of writing, demoing, arranging, and recording. For an artist releasing regular singles, the model most suited to the current South African and African streaming landscape, writing and recording become a near-permanent background process, running alongside everything else.",
    key: [
      "Book studio time in advance and confirm your producer agreement in writing before sessions begin.",
      "Set a realistic recording budget in ZAR and track actual spend against it throughout the process.",
      "Archive all stems, session files, and master recordings, both locally and in cloud storage.",
      "Register compositions with SAMRO and CAPASSO before the release, not after.",
      "Decide early whether this material will be released as a single, an EP, or a full album, that decision shapes everything that follows.",
      "Where you are recording material in African languages (Zulu, Yoruba, Twi, Swahili, French, etc.), consider the linguistic distribution of your intended audience.",
    ],
  },
  {
    id: "prerelease",
    num: "2",
    title: "Pre-Release Preparation",
    color: "#8B5CF6",
    what: "Pre-release preparation is the phase that most independent artists underestimate. The period between completing your recording and actually releasing it is not dead time, it is where your release is built. A minimum of six to eight weeks of pre-release preparation is recommended for a single; twelve to sixteen weeks for an EP or album.",
    key: [
      "Submit your release to your digital distributor early, DistroKid, TuneCore, Amuse, CD Baby, or local partners need time to deliver to stores.",
      "Submit a Spotify for Artists editorial pitch at least seven days before your release date, this is non-negotiable.",
      "Pitch Boomplay editorial at least three weeks in advance for African market placement.",
      "Prepare all visual assets: cover artwork (3000×3000 px, RGB), social media templates, press photos, and a music video or lyric video.",
      "Write and distribute your press release two to four weeks before release day.",
      "Brief your radio plugger with audio files, one-sheet, and artist biography.",
      "Assign ISRC codes to every track and confirm UPC for the release package.",
      "Complete your Label Copy document before distribution submission.",
    ],
  },
  {
    id: "release",
    num: "3",
    title: "Release & Active Promotion",
    color: "#EC4899",
    what: "Release day is not an endpoint, it is the beginning of your active promotional window. For a single, this window typically runs four to six weeks. For an album, six to twelve weeks. The quality of work you put into this phase determines how far the music travels beyond your existing audience.",
    key: [
      "Music videos and lyric videos to drive YouTube growth and sync licensing opportunities.",
      "Fan engagement, responding to comments, sharing fan content, hosting digital listening parties or Q&As.",
      "Audio quality settings on Boomplay and Spotify are often set to low or medium by African listeners on data bundles, your mastering needs to translate well at compressed bitrates.",
      "The first 30 seconds of your track are critical for Spotify royalty attribution and playlist retention metrics, structure your intros accordingly.",
      "YouTube remains the most widely used music platform across much of sub-Saharan Africa, particularly in areas with limited Spotify or Apple Music penetration.",
      "TikTok audio usage drives significant streaming conversions in South Africa, Nigeria, and Kenya, a moment in your track that becomes a TikTok sound can extend a campaign's life by weeks.",
    ],
  },
  {
    id: "touring",
    num: "4",
    title: "Touring",
    color: "#F59E0B",
    what: "Touring remains one of the most powerful ways to deepen an audience's relationship with your music and to generate sustainable income. For most artists, live performance is the primary revenue driver, not streaming, not sync, and not merchandise on its own.",
    key: [
      "Load shedding affects venues across South Africa and power outages are common across much of the continent, always confirm generator backup and technical contingency plans when advancing shows.",
      "Cross-border touring in the SADC region (Zimbabwe, Mozambique, Botswana, Namibia, Zambia) requires logistical planning around visas, carnets, and equipment movement.",
      "West African touring (Nigeria, Ghana, Côte d'Ivoire, Senegal) requires early relationships with established local promoters, attempting to tour without local knowledge is high-risk.",
      "East African touring (Kenya, Tanzania, Uganda) is growing in viability for South African artists, particularly in Afrobeats-adjacent genres.",
      "Ticketing in South Africa is managed primarily through Quicket and Howler. For other African markets, ticketing infrastructure varies significantly.",
      "SAMRO live performance royalties are payable for music performed at commercial venues, ensure the promoter is aware of their SAMRO licensing obligations.",
    ],
  },
];

function PhaseAccordion({ phase, defaultOpen = false }: { phase: typeof PHASES[0]; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div id={`phase-${phase.id}`} className="glass-card rounded-xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-surface-2 transition-colors">
        <div className="flex items-center gap-3">
          <span className="text-sm font-black w-6 flex-shrink-0" style={{ color: phase.color }}>{phase.num}</span>
          <span className="font-bold text-text-primary">{phase.title}</span>
        </div>
        <ChevronDown size={16} className={`flex-shrink-0 text-text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}/>
      </button>
      {open && (
        <div className="border-t border-border divide-y divide-border">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-0">
            <div className="px-5 py-3 sm:col-span-1" style={{ backgroundColor: `${phase.color}06` }}>
              <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: phase.color }}>What it involves</p>
            </div>
            <div className="px-5 py-3 sm:col-span-3">
              <p className="text-sm text-text-muted leading-relaxed">{phase.what}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-0">
            <div className="px-5 py-3 sm:col-span-1" style={{ backgroundColor: `${phase.color}06` }}>
              <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: phase.color }}>Key actions</p>
            </div>
            <div className="px-5 py-3 sm:col-span-3 space-y-1.5">
              {phase.key.map((k, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-[10px] font-black flex-shrink-0 mt-0.5" style={{ color: phase.color }}>→</span>
                  <p className="text-sm text-text-muted leading-relaxed">{k}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ArtistCyclePage() {
  const { country, currency } = useLocale();
  const res = getCountryResources(country);
  const proAbbr = res.performanceRights.abbr;
  const mechAbbr = res.mechanicalRights?.abbr ?? proAbbr;
  const ticketPlatforms = country === "Algeria"
    ? "local ticketing platforms and event promotion channels relevant to your market"
    : "Quicket and Howler";
  const loadshedNote = country === "Algeria"
    ? "Power outages and infrastructure disruptions can affect venues — always confirm generator backup and technical contingency plans when advancing shows."
    : "Load shedding affects venues across South Africa and power outages are common across much of the continent — always confirm generator backup and technical contingency plans when advancing shows.";

  const localePhases = useMemo(() => {
    const replacements: [RegExp, string][] = [
      [/Set a realistic recording budget in ZAR/g, `Set a realistic recording budget in ${currency}`],
      [/\bZAR\b/g, currency],
      [/Register compositions with SAMRO and CAPASSO/g, `Register compositions with ${proAbbr}${mechAbbr !== proAbbr ? ` and ${mechAbbr}` : ""}`],
      [/\bSAMRO\b/g, proAbbr],
      [/Ticketing in South Africa is managed primarily through Quicket and Howler\. For other African markets, ticketing infrastructure varies significantly\./g,
        `Ticketing infrastructure varies by market. In your region, research ${ticketPlatforms} and confirm your chosen platform's payment rails and fee structures before announcing a show.`],
      [/Load shedding affects venues across South Africa and power outages are common across much of the continent/g, loadshedNote.replace(/ — .*/, "")],
      [/South African and African streaming landscape/g, `${country} and African streaming landscape`],
      [/\bSouth Africa\b/g, country],
    ];
    const apply = (s: string) => replacements.reduce((acc, [re, rep]) => acc.replace(re, rep), s);
    return PHASES.map(p => ({ ...p, what: apply(p.what), key: p.key.map(apply) }));
  }, [country, currency, proAbbr, mechAbbr, ticketPlatforms, loadshedNote]);

  return (
    <div className="animate-fade-in max-w-3xl">
      <div className="flex items-center gap-2 text-xs text-text-muted mb-6">
        <Link href="/dashboard/library" className="hover:text-text-primary transition-colors">Toolkit</Link>
        <ChevronRight size={12}/>
        <Link href="/dashboard/library/recording" className="hover:text-text-primary transition-colors">Releasing Music</Link>
        <ChevronRight size={12}/>
        <span className="text-text-primary">The Artist Cycle</span>
      </div>

      <div className="glass-card rounded-2xl p-7 mb-8" style={{ borderColor: "#10B98125" }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: COLOR }}>{res.flag} {res.country} & African Context · 2026</p>
            <h1 className="text-2xl font-black text-text-primary mb-1">The Artist Cycle</h1>
            <p className="text-sm font-semibold mb-2" style={{ color: COLOR }}>The operational reality of building a music career.</p>
            <p className="text-sm text-text-muted leading-relaxed max-w-xl">
              Every recording artist operates within a recurring cycle: writing and recording, pre-release preparation, release and active promotion, and touring. Understanding it means you can plan, budget, and communicate more effectively with every member of your team. A full album cycle typically spans 12 to 18 months, singles are compressed to six to eight weeks. The cycle is not theory. It is discipline.
            </p>
          </div>
          <button type="button" onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold flex-shrink-0 transition-all hover:opacity-80" style={{ backgroundColor: `${COLOR}20`, color: COLOR, border: `1px solid ${COLOR}30` }}><Printer size={15}/><span className="hidden sm:inline">Save as PDF</span></button>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-4">
          {PHASES.map(p => (
            <span key={p.id} className="text-[10px] font-bold uppercase px-2 py-0.5 rounded"
              style={{ color: p.color, backgroundColor: `${p.color}15` }}>Phase {p.num}: {p.title}</span>
          ))}
        </div>
      </div>

      {/* Intro: The cycle */}
      <div className="glass-card rounded-xl p-5 mb-8" style={{ borderColor: "rgba(201,168,76,0.2)", backgroundColor: "rgba(201,168,76,0.04)" }}>
        <p className="text-xs font-bold text-brand uppercase tracking-widest mb-2">Audience Engagement Is Not a Campaign</p>
        <p className="text-sm text-text-muted leading-relaxed">
          One of the most important things the cycle teaches is that audience engagement is constant. Artists who only communicate with their fans during release windows and go quiet between releases build nothing of lasting value. The most successful artists are always one cycle ahead, recording while promoting, planning while touring, and maintaining audience connection while doing all of it. <span className="font-semibold text-text-primary">The goal is not to execute a cycle perfectly once. The goal is to build the discipline, the team, and the systems that allow you to run the cycle consistently, sustainably, and with increasing quality and reach each time around.</span>
        </p>
      </div>

      {/* The 4 phases */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-5 rounded-full" style={{ backgroundColor: COLOR }}/>
          <h2 className="text-base font-black text-text-primary">The 4 Phases, {res.country} & African Context</h2>
        </div>
        <div className="space-y-3">
          {localePhases.map((phase, i) => <PhaseAccordion key={phase.id} phase={phase} defaultOpen={i === 0}/>)}
        </div>
      </div>

      {/* Streaming-First note */}
      <div className="glass-card rounded-xl p-5 mb-8">
        <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: COLOR }}>The Streaming-First Reality for African Artists</p>
        <p className="text-sm text-text-muted leading-relaxed mb-3">
          In Western markets, album release campaigns are built around physical retail windows and radio chart eligibility. In {res.country} and across Africa, the dominant consumption model is mobile streaming, often on data-constrained connections, often via free tiers.
        </p>
        <div className="space-y-2">
          {[
            "Audio quality settings on Boomplay and Spotify are often set to low or medium by African listeners on data bundles, your mastering needs to translate at compressed bitrates.",
            "The first 30 seconds of your track are critical for Spotify royalty attribution and playlist retention metrics, structure your intros accordingly.",
            "YouTube remains the most widely used music platform across much of sub-Saharan Africa, do not neglect your YouTube presence.",
            `TikTok audio usage drives significant streaming conversions in ${res.country} and across African markets, a viral TikTok sound can extend a campaign's life by weeks.`,
          ].map((note, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-[10px] font-black flex-shrink-0 mt-0.5" style={{ color: COLOR }}>→</span>
              <p className="text-sm text-text-muted leading-relaxed">{note}</p>
            </div>
          ))}
        </div>
      </div>

      <Link href="/dashboard/library/recording" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors">
        <ChevronLeft size={15}/>Back to Releasing Music
      </Link>
    </div>
  );
}
