"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ChevronDown, Printer } from "lucide-react";
import { useLocale } from "@/context/locale-context";
import { getCountryResources } from "@/lib/country-resources";

const COLOR = "#8B5CF6";

const SECTIONS = [
  {
    id: "what",
    title: "What Distribution Actually Means",
    color: "#8B5CF6",
    content: `Distribution is the process of moving your music from the recording studio to the listener, whether that journey happens through a mobile data connection in Nairobi, a brick-and-mortar record shop in Cape Town, or a download in Lagos. At its core, distribution means placing your music where your audience already is, and making sure it arrives correctly labelled, properly registered, and ready to generate income.

The person ultimately responsible for distribution depends on where you sit in the industry. Major labels typically operate their own distribution infrastructure or own distribution companies outright. Independent labels partner with third-party distributors. If you are releasing independently without a label, you become your own distributor by default, though you will still work with distribution platforms and services to reach stores.

One important number: if you partner with a distribution company (rather than a self-service platform), expect to share between 15% and 40% of your sales revenue with them. Always have a South African entertainment lawyer review any distribution contract before signing.`,
    bullets: [],
  },
  {
    id: "delivers",
    title: "What a Distributor Delivers",
    color: "#10B981",
    content: "Whether you are doing it yourself through a platform or working with a company, a functional distribution arrangement covers:",
    bullets: [
      "Manufacturing costs for physical product (CDs, vinyl, cassettes)",
      "Coordinating shipping and logistics for physical stock",
      "Managing your release schedule across territories",
      "Supporting advertising and marketing campaigns",
      "Pitching product to retail buyers and digital store curators",
      "Delivering digital audio files to streaming and download stores",
      "Tracking and reporting units sold, streamed, returned, and in inventory",
      "Collecting and remitting royalties to rights holders",
      "Maintaining inventory records",
    ],
  },
  {
    id: "digital",
    title: "Digital Distribution",
    color: "#06B6D4",
    content: `Digital distribution is the process of delivering your audio files, metadata, and artwork to digital service providers (DSPs), Spotify, Apple Music, Boomplay, Audiomack, Deezer, TIDAL, YouTube Music, Amazon Music, and others. Once delivered and approved, your music becomes available to listeners globally.

For African artists, the key DSPs to prioritise are: Boomplay (100M+ users across Africa), Audiomack (strong in Nigeria, Ghana, Kenya), Spotify (strong SA user base), Apple Music (iOS-heavy SA market), and YouTube Music.

Self-service digital distribution platforms (DistroKid, TuneCore, Amuse, CD Baby) allow you to distribute without a traditional label deal. Most charge a flat annual fee or take a percentage of royalties. These platforms automatically generate ISRCs if you do not have your own. Always confirm metadata, artist name spelling, featured artists, composer credits, is correct before submission.`,
    bullets: [],
  },
  {
    id: "africa",
    title: "African Market Distribution",
    color: "#F59E0B",
    content: "The African music market has distinct distribution dynamics that differ significantly from Western markets:",
    bullets: [
      "Boomplay dominates East and West Africa with over 100 million users. It operates differently from Spotify, it has its own editorial team and requires direct relationship management for major African markets.",
      "Audiomack has deep roots in Nigeria and Ghana, and is growing rapidly in Kenya and Tanzania. It offers free uploads directly on its platform.",
      "Mdundo focuses specifically on East Africa and has significant penetration in Tanzania and Kenya.",
      "JOOX and Telkom Music are key platforms in the South African market with a strong subscriber base.",
      "Physical distribution remains culturally relevant in many African markets. Checkers, Musica (where available), and independent record shops are still viable retail channels in South Africa.",
      "Mobile carrier partnerships (MTN Music, Vodacom Music) distribute to large subscriber bases in markets with limited smartphone penetration.",
    ],
  },
  {
    id: "contract",
    title: "Distribution Contract, What to Watch For",
    color: "#EF4444",
    content: "Before signing any distribution agreement, have a South African entertainment attorney review these key terms:",
    bullets: [
      "Revenue share percentage, what percentage the distributor retains from gross sales versus what they take from net receipts.",
      "Territory, confirm whether the deal covers South Africa only, pan-African, or global.",
      "Term, short-term deals (1–2 years) are preferable for emerging artists. Be cautious of long-term agreements that are difficult to exit.",
      "Ownership, confirm that you retain ownership of your master recordings throughout the term of the agreement and after.",
      "Data access, ensure the contract grants you access to streaming and sales analytics, not just quarterly statements.",
      "Reversion rights, what happens to your catalogue if the distributor closes, is acquired, or you fail to meet minimum sales thresholds.",
      "Physical returns, who bears the cost of unsold physical stock returned from retailers.",
      "Advances, if an advance is offered, understand the recoupment terms before accepting.",
    ],
  },
  {
    id: "physical",
    title: "Physical Distribution in South Africa",
    color: "#C9A84C",
    content: `Physical distribution in South Africa operates through a small number of major distributors and an independent retail sector. The dominant physical distribution companies include the major label distribution arms (Sony Music Entertainment Africa, Universal Music Africa, Warner Music Africa) and independent physical distributors.

Key considerations for independent artists pursuing physical distribution:
• Consignment vs. buy-in, most retail will take physical stock on consignment (you only get paid for what sells). Confirm return terms.
• Minimum print run, most pressing plants require a minimum of 500–1,000 units for a CD run. 300 units is achievable for vinyl, but at a higher per-unit cost.
• GS1 South Africa barcodes, every physical product requires a UPC barcode registered through GS1 South Africa (gs1.org.za). Registration is required per product configuration.
• Lead times, allow 6–8 weeks for CD replication and 12–16 weeks for vinyl pressing (most vinyl is pressed outside South Africa).`,
    bullets: [],
  },
];

function DistSection({ s, defaultOpen = false }: { s: typeof SECTIONS[0]; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-surface-2 transition-colors">
        <span className="font-bold text-text-primary">{s.title}</span>
        <ChevronDown size={16} className={`flex-shrink-0 text-text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}/>
      </button>
      {open && (
        <div className="border-t border-border px-5 py-4">
          <p className="text-sm text-text-muted leading-relaxed mb-3 whitespace-pre-line">{s.content}</p>
          {s.bullets.length > 0 && (
            <div className="space-y-2">
              {s.bullets.map((b, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-[10px] font-black flex-shrink-0 mt-0.5" style={{ color: s.color }}>→</span>
                  <p className="text-sm text-text-muted leading-relaxed">{b}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function DistributionPage() {
  const { country } = useLocale();
  const res = getCountryResources(country);
  const lawyerNote = res.lawyerNote ?? "qualified entertainment attorney";
  const proAbbr = res.performanceRights.abbr;
  const isrcPrefix = res.isrcPrefix ?? country.slice(0, 2).toUpperCase();
  const topDSPs = res.keyDSPs.slice(0, 3).join(", ");

  // Localise SECTIONS — swap SA-specific phrases
  const localeSections = useMemo(() => {
    const replacements: [RegExp, string][] = [
      [/South African entertainment lawyer/g, lawyerNote],
      [/South African entertainment attorney/g, lawyerNote],
      [/qualified South African entertainment attorney/g, `a ${lawyerNote}`],
      [/\bSAMRO\b/g, proAbbr],
      [/GS1 South Africa barcodes[^.]*\./g, `Every physical product requires a UPC barcode — register through GS1 (gs1.org) before manufacture.`],
      [/Physical distribution in South Africa operates through[^]*?(?=\n\nKey considerations|$)/g, `Physical distribution in ${country} varies by market. Consignment terms, lead times for pressing, and retail access all differ. Work with a local distribution consultant or physical distribution partner familiar with ${country}.\n\nKey considerations for physical distribution:`],
    ];
    const apply = (s: string) => replacements.reduce((acc, [re, rep]) => acc.replace(re, rep), s);
    return SECTIONS.map(s => ({ ...s, content: apply(s.content), bullets: s.bullets.map(apply) }));
  }, [country, lawyerNote, proAbbr]);

  return (
    <div className="animate-fade-in max-w-3xl">
      <div className="flex items-center gap-2 text-xs text-text-muted mb-6">
        <Link href="/dashboard/library" className="hover:text-text-primary transition-colors">Toolkit</Link>
        <ChevronRight size={12}/>
        <Link href="/dashboard/library/recording" className="hover:text-text-primary transition-colors">Releasing Music</Link>
        <ChevronRight size={12}/>
        <span className="text-text-primary">Music Distribution</span>
      </div>

      <div className="glass-card rounded-2xl p-7 mb-8" style={{ borderColor: "#8B5CF625" }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: COLOR }}>{res.flag} {res.country} · Africa · Global · 2026</p>
            <h1 className="text-2xl font-black text-text-primary mb-1">Music Distribution</h1>
            <p className="text-sm font-semibold mb-2" style={{ color: COLOR }}>Get your music to listeners. Get paid for it.</p>
            <p className="text-sm text-text-muted leading-relaxed max-w-xl">
              A practical guide to distributing your music across {res.country}, the continent, and globally. Priority platforms: {topDSPs}. Rights registration: {proAbbr}. ISRC prefix: {isrcPrefix}.
            </p>
          </div>
          <button type="button" onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold flex-shrink-0 transition-all hover:opacity-80" style={{ backgroundColor: `${COLOR}20`, color: COLOR, border: `1px solid ${COLOR}30` }}><Printer size={15}/><span className="hidden sm:inline">Save as PDF</span></button>
        </div>
      </div>

      <div className="space-y-3 mb-8">
        {localeSections.map((s, i) => <DistSection key={s.id} s={s} defaultOpen={i === 0}/>)}
      </div>

      <div className="glass-card rounded-xl p-4 mb-8 flex items-start gap-3" style={{ borderColor: "rgba(239,68,68,0.15)", backgroundColor: "rgba(239,68,68,0.04)" }}>
        <span className="text-sm flex-shrink-0">⚠️</span>
        <p className="text-xs text-text-muted leading-relaxed">Distribution terms, platform rates, and market conditions change frequently. Always have a qualified South African entertainment attorney review any distribution agreement before signing. Nothing in this document constitutes legal or financial advice.</p>
      </div>

      <Link href="/dashboard/library/recording" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors">
        <ChevronLeft size={15}/>Back to Releasing Music
      </Link>
    </div>
  );
}
