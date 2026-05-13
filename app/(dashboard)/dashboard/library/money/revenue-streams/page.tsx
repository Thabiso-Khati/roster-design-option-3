"use client";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Printer } from "lucide-react";
import { useLocale } from "@/context/locale-context";
import { getCountryResources } from "@/lib/country-resources";

const COLOR = "#EC4899";

const CATEGORIES = [
  {
    id: "live",
    title: "Live Performance & Events",
    color: "#EC4899",
    streams: [
      { num: 1, name: "Live Performance Fees", how: "Flat guarantees or revenue-share agreements negotiated with promoters, venues, or corporates for headline or support slots.", context: "Rates vary widely, township venues to Sun Arena. Negotiate minimum guarantees upfront. Secure payment in writing before the event date." },
      { num: 2, name: "Festival Appearance Fees", how: "Payment for performing at music festivals, often the highest single-event income for mid-to-major artists.", context: "Oppikoppi, Cape Town International Jazz, Splashy Fen, Afropunk JHB. SADC regional festivals (Zimbabwe, Botswana, Namibia) are growing markets." },
      { num: 3, name: "Corporate & Private Events", how: "Bookings for brand launches, year-end functions, weddings, and private events, often the most consistent high-value live income stream.", context: "South African corporates spend significantly on entertainment. Rates can exceed those of public concerts. Build relationships with event agencies." },
      { num: 4, name: "VIP Packages & Experiences", how: "Premium fan experiences, backstage access, artist meet-and-greets, private listening sessions, sold alongside event tickets.", context: "Underutilised in SA but growing. Bundle with Quicket or Webtickets. Pair with merchandise to increase per-head spend." },
      { num: 5, name: "Ticket Sales (Artist Share)", how: "Where the artist promotes their own show, net ticket revenue after venue and ticketing fees is a direct income stream.", context: "Quicket and Webtickets are the dominant platforms in SA. Factor in 5–8% platform fees when setting ticket prices." },
    ],
  },
  {
    id: "recorded",
    title: "Recorded Music & Distribution",
    color: "#8B5CF6",
    streams: [
      { num: 6, name: "Streaming Royalties", how: "Per-stream payments from Spotify, Apple Music, YouTube Music, TIDAL, Amazon Music, and other platforms, paid monthly via your distributor.", context: "African-focused platforms, Boomplay, Audiomack, Mdundo, are rapidly growing. Boomplay has over 100 million users across the continent. Prioritise these alongside global DSPs." },
      { num: 7, name: "Physical Album & CD Sales", how: "Revenue from selling physical CDs at shows, in retail stores, or through online orders.", context: "Physical formats remain culturally relevant in certain SA markets. Target retail through Checkers and independent record shops. At-show merch table sales are often more profitable." },
      { num: 8, name: "Digital Download Sales", how: "One-time purchase downloads from platforms such as Bandcamp, which still supports individual track and album sales.", context: "Bandcamp remains the most artist-friendly download platform globally. Fans in markets with limited data often prefer one-off downloads over ongoing subscriptions." },
      { num: 9, name: "Off-Stage Merchandise Music Sales", how: "Selling physical or digital music directly to fans at performances, no platform fees, immediate payment.", context: "Accept Yoco, SnapScan, and cash. Bundle CDs with T-shirts for higher average transaction value. Keep float money available for cash buyers at every show." },
    ],
  },
  {
    id: "royalties",
    title: "Royalties & Licensing",
    color: "#F59E0B",
    streams: [
      { num: 10, name: "Public Performance Royalties", how: "Collected when your compositions are played publicly — on radio, television, in restaurants, clubs, airports, and other public venues.", context: "COUNTRY_PERFORMANCE" },
      { num: 11, name: "Mechanical Royalties", how: "Paid when your composition is reproduced — on streaming platforms, physical CDs, downloads, or other formats.", context: "COUNTRY_MECHANICAL" },
      { num: 12, name: "Neighbouring Rights", how: "Paid to performing artists and record producers when their recordings are broadcast or played publicly, separate from compositional royalties.", context: "COUNTRY_NEIGHBOURING" },
      { num: 13, name: "Sync Licensing Fees", how: "One-off fees paid when your music is licensed for use in film, television, advertising, video games, or online content.", context: "SA film and advertising industries are active sync licensors. African streaming content (Netflix Africa, Showmax, Canal+) is creating new sync opportunities." },
      { num: 14, name: "Commissioned Compositions", how: "Fees for creating original music to brief, film scores, jingles, brand anthems, documentary soundtracks.", context: "SABC, e.tv, Showmax, and SA ad agencies regularly commission original music. Retain publishing rights unless offered a significant buy-out premium." },
    ],
  },
  {
    id: "digital",
    title: "Digital Content & Platform Income",
    color: "#06B6D4",
    streams: [
      { num: 15, name: "YouTube / Content ID Revenue", how: "Ad revenue shared with creators through the YouTube Partner Programme. Content ID also catches and monetises third-party use of your recordings.", context: "Claim and register your music with a Content ID provider through your distributor. Monetise all official and unofficial uses of your recordings on YouTube across Africa." },
      { num: 16, name: "Podcast Sponsorships & Licensing", how: "Licensing your music as intro or background music for podcasts, or being paid to appear as a guest or sponsor.", context: "The South African podcast market is growing rapidly. Music-focused podcasts, sports and lifestyle shows regularly seek licensed music. Negotiate per-use or blanket licence fees." },
      { num: 17, name: "Social Media Creator Fund & Brand Deals", how: "Platform creator funds (TikTok, Meta) and paid partnerships where a brand pays you to feature their product in your content.", context: "TikTok Creator Fund is available to qualifying SA creators. Authenticity matters, audience trust is the asset brands are paying for." },
    ],
  },
  {
    id: "brand",
    title: "Brand, Sponsorship & Commercial",
    color: "#10B981",
    streams: [
      { num: 18, name: "Brand Endorsements", how: "Ongoing contractual relationships with brands, the brand pays you (in money or products) to publicly associate with them.", context: "SA brands such as SAB, MTN, Vodacom, Distell and sportswear labels regularly partner with musicians. Negotiate exclusivity clauses carefully." },
      { num: 19, name: "Sponsorships (Tour or Project)", how: "A brand or organisation funds a specific tour, album, or campaign in exchange for naming rights, branding, and promotional exposure.", context: "SADC tours are increasingly attractive to Pan-African brands. Prepare a detailed sponsorship deck with audience demographics." },
      { num: 20, name: "Merchandising Licensing", how: "Licensing your name, likeness, or brand to a manufacturer who produces and sells branded products, you receive a royalty per unit sold.", context: "Underutilised by most SA independent artists. If you have a strong visual brand, approach clothing manufacturers or fashion designers for licensing opportunities." },
    ],
  },
  {
    id: "other",
    title: "Education, Services & Other",
    color: "#C9A84C",
    streams: [
      { num: 21, name: "Music Production Services", how: "Fees earned from producing tracks, beats, or full projects for other artists or organisations.", context: "SA has a thriving production community. Set clear terms: flat fee vs. royalty split vs. both. Ensure producer agreements are signed before work begins." },
      { num: 22, name: "Session Performance Fees", how: "Payment for performing as a musician, vocalist, or instrumentalist on another artist's recording or live show.", context: "Negotiate upfront for both the recording session fee and any performance or royalty entitlement. SAMPRA registration covers your neighbouring rights even on session recordings." },
      { num: 23, name: "Workshops, Masterclasses & Teaching", how: "Income from teaching your craft, online or in-person workshops, school visits, university masterclasses, or one-on-one coaching.", context: "Government arts programmes (DSAC, NAC) regularly fund artist-in-schools initiatives. Online platforms (Teachable, Thinkific) allow digital course creation." },
      { num: 24, name: "Speaking Engagements", how: "Fees for speaking at conferences, industry events, brand activations, or educational institutions.", context: "Music industry events (Music In Africa Conference, South African Music Conference) book artist speakers. Define your talking points around your journey and expertise." },
      { num: 25, name: "Grants & Funding", how: "Non-repayable financial support from government bodies, foundations, or non-profit organisations for creative projects.", context: "Refer to the Grant Funding Guide in this module for a full list of active programmes including NAC, SAMRO Foundation, NLC, British Council, and Music In Africa Foundation." },
      { num: 26, name: "Crowdfunding & Fan Subscriptions", how: "Directly funded by your audience via platforms such as Patreon, Kickstarter, BackaBuddy, or WhatsApp community subscription models.", context: "BackaBuddy is the leading SA crowdfunding platform. WhatsApp-based fan clubs with monthly subscription tiers are increasingly popular in African markets." },
      { num: 27, name: "Publishing Advances", how: "An upfront payment from a music publisher in exchange for the publisher collecting and administering your compositional royalties.", context: "Weigh the advance against the term and percentage split carefully. Short terms (2–3 years) with partial catalogue deals are preferable for independent artists." },
      { num: 28, name: "Record Label Advances & Support", how: "Upfront funding from a record label for recording and promotion, recouped from your future royalties.", context: "Advances in the SA market are generally smaller than international counterparts. Scrutinise recoupment terms, understand what \"net receipts\" means in your specific contract." },
    ],
  },
];

function resolveContext(raw: string, res: ReturnType<typeof getCountryResources>): string {
  if (raw === "COUNTRY_PERFORMANCE") {
    return `Register with ${res.performanceRights.name} (${res.performanceRights.abbr}${res.performanceRights.url ? " — " + res.performanceRights.url : ""}) as a composer or publisher. ${res.performanceRights.note}`;
  }
  if (raw === "COUNTRY_MECHANICAL") {
    const m = res.mechanicalRights;
    if (!m) return `${res.performanceRights.abbr} handles mechanical rights in ${res.country} alongside performance rights — one registration covers both streams.`;
    if (m.abbr === res.performanceRights.abbr) return `${m.abbr} handles mechanical rights in ${res.country} alongside performance rights. ${m.note}`;
    return `Register with ${m.name} (${m.abbr}${m.url ? " — " + m.url : ""}) for mechanical rights in ${res.country}. ${m.note}`;
  }
  if (raw === "COUNTRY_NEIGHBOURING") {
    const n = res.neighbouringRights;
    if (!n) return `Neighbouring rights collection is developing in ${res.country}. Register with AIRCO (African Independent Rights Collection Organisation) for international neighbouring rights collection across Africa.`;
    return `Register as a performer with ${n.name} (${n.abbr}) in ${res.country}. ${n.note}`;
  }
  return raw;
}

export default function RevenueStreamsPage() {
  const { country } = useLocale();
  const res = getCountryResources(country);
  return (
    <div className="animate-fade-in max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-text-muted mb-6">
        <Link href="/dashboard/library" className="hover:text-text-primary transition-colors">Toolkit</Link>
        <ChevronRight size={12}/>
        <Link href="/dashboard/library/money" className="hover:text-text-primary transition-colors">Money Matters</Link>
        <ChevronRight size={12}/>
        <span className="text-text-primary">Revenue Streams</span>
      </div>

      {/* Header */}
      <div className="glass-card rounded-2xl p-7 mb-8" style={{ borderColor: "#EC489925" }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: COLOR }}>{res.flag} {res.country} · Pan-African · 2026</p>
            <h1 className="text-2xl font-black text-text-primary mb-2">Revenue Streams for Artists & Music Businesses</h1>
            <p className="text-sm text-text-muted leading-relaxed max-w-xl">
              Every meaningful income stream available to artists, music producers, managers, and music businesses operating in South Africa and across Africa&apos;s emerging markets.
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {CATEGORIES.map(c => (
                <span key={c.id} className="text-[10px] font-bold uppercase px-2 py-0.5 rounded"
                  style={{ color: c.color, backgroundColor: `${c.color}15` }}>{c.streams.length} streams</span>
              ))}
            </div>
          </div>
          <button type="button" onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold flex-shrink-0 transition-all hover:opacity-80" style={{ backgroundColor: `${COLOR}20`, color: COLOR, border: `1px solid ${COLOR}30` }}><Printer size={15}/><span className="hidden sm:inline">Save as PDF</span></button>
        </div>
      </div>

      {/* Intro note */}
      <div className="glass-card rounded-xl p-5 mb-8" style={{ borderColor: "rgba(201,168,76,0.2)", backgroundColor: "rgba(201,168,76,0.04)" }}>
        <p className="text-xs font-bold text-brand uppercase tracking-widest mb-2">How to use this guide</p>
        <p className="text-sm text-text-muted leading-relaxed">
          The modern African music economy is layered, combining live performance, multi-platform streaming, regional touring, brand partnerships, sync deals, rights registrations, and direct fan monetisation. Use this guide alongside the <Link href="/dashboard/library/money/royalties" className="text-brand hover:underline font-semibold">Royalties 101</Link> and <Link href="/dashboard/library/money/grant-funding" className="text-brand hover:underline font-semibold">Grant Funding</Link> guides in this module.
        </p>
      </div>

      {/* Revenue stream categories */}
      <div className="space-y-8 mb-10">
        {CATEGORIES.map(cat => (
          <div key={cat.id}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-5 rounded-full" style={{ backgroundColor: cat.color }}/>
              <h2 className="text-base font-black text-text-primary">{cat.title}</h2>
            </div>
            <div className="space-y-2">
              {cat.streams.map(s => (
                <div key={s.num} className="glass-card rounded-xl overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-border flex items-center gap-3"
                    style={{ backgroundColor: `${cat.color}08` }}>
                    <span className="text-xs font-black w-6 flex-shrink-0" style={{ color: cat.color }}>{s.num}</span>
                    <p className="text-xs font-black uppercase tracking-wider" style={{ color: cat.color }}>{s.name}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
                    <div className="px-4 py-3">
                      <p className="text-[10px] font-black uppercase tracking-wider text-text-muted mb-1.5">How it works</p>
                      <p className="text-sm text-text-primary leading-relaxed">{s.how}</p>
                    </div>
                    <div className="px-4 py-3">
                      <p className="text-[10px] font-black uppercase tracking-wider text-text-muted mb-1.5">{res.flag} {res.country} & African Market Context</p>
                      <p className="text-sm text-text-muted leading-relaxed">{resolveContext(s.context, res)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="glass-card rounded-xl p-4 mb-8 flex items-start gap-3" style={{ borderColor: "rgba(239,68,68,0.15)", backgroundColor: "rgba(239,68,68,0.04)" }}>
        <span className="text-sm flex-shrink-0">⚠️</span>
        <p className="text-xs text-text-muted leading-relaxed">This guide provides general information only. Income streams, royalty rates, and platform terms change frequently. All information should be independently verified with a qualified music lawyer, accountant, or industry professional. Nothing in this document constitutes financial or legal advice.</p>
      </div>

      <Link href="/dashboard/library/money" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors">
        <ChevronLeft size={15}/>Back to Money Matters
      </Link>
    </div>
  );
}
