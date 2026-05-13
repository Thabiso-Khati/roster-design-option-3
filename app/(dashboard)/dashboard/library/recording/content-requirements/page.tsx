"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ChevronDown, Printer } from "lucide-react";
import { useLocale } from "@/context/locale-context";
import { getCountryResources } from "@/lib/country-resources";

const COLOR = "#F59E0B";

const MARKETS = [
  {
    id: "why",
    title: "Why Local Content Requirements Matter",
    color: "#F59E0B",
    defaultOpen: false,
    content: `Every African country with a functioning broadcasting regulator has some form of local content requirement, a rule that obliges radio and television broadcasters to air a minimum percentage of locally produced music. These regulations exist to protect and develop national music industries, preserve cultural heritage, and create economic opportunities for local artists and producers.

For African artists, understanding these requirements is not just an academic exercise. It is a commercial strategy. When you know that a Ghanaian radio station is legally obligated to fill 60% of its music airtime with Ghanaian music, you understand why qualifying as local content in that market is a significant competitive advantage, and why local creative partnerships can unlock airplay that international artists cannot access on the same terms.

Local content frameworks also shape where music funding and development support flows. Broadcasters in many African markets must contribute to local music development funds as a condition of their licence. Artists who understand these systems are better positioned to access those resources.`,
    bullets: [],
    extra: null,
  },
  {
    id: "sa",
    title: "South Africa, The ICASA Framework",
    color: "#10B981",
    defaultOpen: true,
    content: `In South Africa, local music content on broadcast radio is regulated by ICASA, the Independent Communications Authority of South Africa. ICASA operates under the Electronic Communications Act and the Broadcasting Act, and sets the content conditions that commercial and public broadcasters must comply with to maintain their broadcast licences.`,
    bullets: [],
    extra: {
      quotas: [
        { label: "Commercial radio stations", detail: "Minimum 20% South African music. Many stations exceed this floor voluntarily, particularly for Afrobeats-adjacent, gospel, kwaito, and Amapiano formats." },
        { label: "SABC public radio stations", detail: "Minimum 40% South African music. Stations such as Ukhozi FM, Umhlobo Wenene, and Motsweding FM often exceed this figure." },
        { label: "Community radio stations", detail: "Minimum 40% South African music with local community relevance, music should reflect the local community's culture and language where possible." },
        { label: "SABC television", detail: "Minimum 55% South African television content across the schedule, governing music video airtime on SABC 1 and 2." },
      ],
      saelo: [
        { letter: "S", criterion: "Sound / Recording", desc: "The master recording was made wholly or substantially in South Africa" },
        { letter: "A", criterion: "Artist / Performer", desc: "The recording is performed principally by a South African artist or group" },
        { letter: "E", criterion: "Expression / Composition", desc: "The music and/or lyrics are written or composed by a South African" },
        { letter: "L", criterion: "Language / Identity", desc: "The work is performed in a South African language or substantially reflects South African cultural identity" },
      ],
      funding: "The SABC's local content mandate creates a pipeline for South African music. Ukhozi FM alone reaches more than seven million listeners weekly, SABC airplay represents mass market exposure that paid advertising on streaming platforms cannot replicate. The SABC also runs music competitions and talent development initiatives under its public mandate.",
    },
  },
  {
    id: "waf",
    title: "Nigeria, Kenya, Ghana & East Africa",
    color: "#8B5CF6",
    defaultOpen: false,
    content: "",
    bullets: [],
    extra: {
      markets: [
        {
          name: "Nigeria, National Broadcasting Commission (NBC)",
          color: "#8B5CF6",
          radio: "Minimum 40% local Nigerian music content on licensed radio stations.",
          tv: "Minimum 80% locally produced content across licensed television schedules — one of the highest TV quotas on the continent.",
          royalties: "COSON (Copyright Society of Nigeria) + MCSN (mechanical)",
          note: "Co-productions with Nigerian artists improve qualification under NBC guidelines. A collaboration with a Nigerian producer or featured artist is a market access strategy, not just a creative decision. Register with both COSON and MCSN — royalties unclaimed in Nigeria are not automatically distributed internationally.",
        },
        {
          name: "Kenya, Communications Authority of Kenya (CA)",
          color: "#10B981",
          radio: "Minimum 40% local Kenyan music content across the broadcast week.",
          tv: "Minimum 40% locally produced content. The CA actively monitors compliance and has issued fines to stations found below quota.",
          royalties: "MCSK (Music Copyright Society of Kenya)",
          note: "If your music is receiving radio airplay in Kenya, ensure your publisher or your SAMRO registration triggers reciprocal collection through the CISAC network. For direct access to Kenyan royalties, register directly with MCSK.",
        },
        {
          name: "Ghana, National Communications Authority (NCA)",
          color: "#F59E0B",
          radio: "Minimum 20–25% Ghanaian music content on licensed commercial radio stations.",
          tv: "Minimum 30% locally produced content across licensed television schedules.",
          royalties: "GHAMRO (Ghana Music Rights Organisation)",
          note: "The NCA quota ensures consistent playlist slots for qualifying Ghanaian releases. Community and regional stations often apply higher local content thresholds — strong entry point for independent artists.",
        },
        {
          name: "Tanzania, TCRA",
          color: "#06B6D4",
          radio: "Minimum 40% local Tanzanian content on licensed radio stations.",
          tv: "Minimum 40% locally produced content across licensed television schedules.",
          royalties: "COSOTA (Copyright Society of Tanzania) + TAMRA (neighbouring rights)",
          note: "Tanzania's music scene is dominated by Bongo Flava — Swahili-language hip-hop and Afropop. Swahili-language recordings carry the strongest local content qualification and reach the widest regional audience across the East African Swahili-speaking belt.",
        },
        {
          name: "Uganda, Uganda Communications Commission (UCC)",
          color: "#EC4899",
          radio: "Minimum 30% local Ugandan content on licensed radio stations.",
          tv: "Minimum 30% locally produced content across licensed television schedules.",
          royalties: "UPRS (Uganda Performing Rights Society) + URIA (neighbouring rights)",
          note: "Uganda's commercial music scene is centred on Kampala. Afrobeats, Afropop, and Luganda-language urban music dominate playlist rotation. Registering with UPRS and ensuring all recordings carry ISRC codes is essential for collecting broadcast royalties.",
        },
        {
          name: "Zimbabwe, Broadcasting Authority of Zimbabwe (BAZ)",
          color: "#10B981",
          radio: "Minimum 75% local Zimbabwean music content on all licensed radio stations — one of the highest radio local content quotas on the continent.",
          tv: "Minimum 75% locally produced content across licensed television schedules.",
          royalties: "ZIMURA (Zimbabwe Music Rights Association) — handles performance, mechanical, and neighbouring rights",
          note: "Zimbabwe's 75% radio quota guarantees substantial playlist space for qualifying Zimbabwean releases. Afrobeats, urban grooves, and Zimdancehall dominate commercial radio. Register with ZIMURA and attach ISRC codes to all releases to capture broadcast royalties from BAZ-mandated airplay.",
        },
      ],
    },
  },
  {
    id: "franco",
    title: "Francophone West Africa",
    color: "#EC4899",
    defaultOpen: false,
    content: "",
    bullets: [],
    extra: {
      markets: [
        {
          name: "Côte d'Ivoire, HACA",
          color: "#EC4899",
          radio: "Minimum 40% Ivorian content, with additional quotas for Francophone African content.",
          tv: "40% local content.",
          royalties: "BURIDA (Bureau Ivoirien du Droit d'Auteur)",
          note: "Language is a significant factor, French-language or Nouchi-inflected content significantly outperforms English-only recordings. Co-productions with Ivorian, Senegalese, or Cameroonian artists are the most effective market entry strategy for South African artists targeting Francophone West Africa.",
        },
        {
          name: "Cameroon, CNC",
          color: "#F59E0B",
          radio: "Minimum 30% Cameroonian music content. Guidance encourages higher local proportions in practice.",
          tv: "30%+",
          royalties: "SOCAM (Société Camerounaise des Droits d'Auteurs et Droits Voisins)",
          note: "Bilingual market (French and English). English-language South African music has a partial linguistic advantage, but French-language or Cameroonian-artist collaborations unlock broader market access.",
        },
        {
          name: "Senegal, CNRA",
          color: "#8B5CF6",
          radio: "Minimum 25% local Senegalese music content on licensed radio stations.",
          tv: "Minimum 40% locally produced content across licensed television schedules.",
          royalties: "BSDA (Bureau Sénégalais du Droit d'Auteur)",
          note: "Dakar is West Africa's leading cultural hub — the birthplace of mbalax and sabar. CNRA qualification opens doors across the broader francophone West African broadcast market. French-language press kits are essential.",
        },
        {
          name: "DRC, ARPTC",
          color: "#C9A84C",
          radio: "Varies, broadcast regulation is fragmented and less consistently enforced than in other markets listed here.",
          tv: "Varies.",
          royalties: "SONECA",
          note: "The DRC has historically produced some of Africa's most influential music, rumba, soukous, and ndombolo, and remains a culturally significant market. Local partnership is required to navigate effectively.",
        },
      ],
    },
  },
  {
    id: "strategy",
    title: "Cross-Border Strategy & Funding",
    color: "#06B6D4",
    defaultOpen: false,
    content: "If you are releasing music into multiple African markets simultaneously, the most effective approach to maximising local content qualification is to build collaborations strategically rather than releasing the same recording everywhere and hoping it qualifies.",
    bullets: [
      "Co-produce with an artist from your primary target market, a joint recording typically qualifies as local content in both artists' home markets",
      "Record at least part of the track in the target country, production origin is a qualifying criterion in most African regulatory frameworks",
      "Feature a vocalist or rapper from the target market, even a featured vocal can shift a recording's local qualification status",
      "Release language-specific versions, Swahili for East Africa, French for Francophone markets, English for South African and West African English-speaking markets",
      "Build long-term creative relationships with producers in Nigeria, Kenya, Ghana, and Côte d'Ivoire, the commercial and regulatory benefits compound over time",
    ],
    extra: {
      funding: [
        { name: "NAC (National Arts Council of SA)", desc: "Funds South African artists and projects demonstrating cultural relevance and community impact. Local content qualification strengthens funding applications." },
        { name: "SAMRO SENA", desc: "Funds South African music projects. Eligibility requires SAMRO membership and SA content qualification." },
        { name: "NFVF (National Film and Video Foundation)", desc: "Funds music video production for South African artists. Qualifying music videos must meet local content criteria." },
        { name: "NBC CDF (Nigeria)", desc: "The NBC collects broadcaster revenue into a Content Development Fund accessible through NBC-affiliated programmes." },
        { name: "Brand Kenya / Kenya Creative Economy", desc: "Kenyan government-linked funds support local music production and export for artists qualifying under CA local content frameworks." },
      ],
    },
  },
];

const TABLE_ROWS = [
  { country: "South Africa", regulator: "ICASA", radio: "20% commercial / 40% SABC & community", tv: "55% (SABC)", society: "SAMRO / SAMPRA / CAPASSO" },
  { country: "Nigeria", regulator: "NBC", radio: "40%", tv: "80%", society: "COSON / MCSN" },
  { country: "Kenya", regulator: "CA of Kenya", radio: "40%", tv: "40%", society: "MCSK" },
  { country: "Ghana", regulator: "NCA", radio: "20–25%", tv: "30%", society: "GHAMRO" },
  { country: "Tanzania", regulator: "TCRA", radio: "40%", tv: "40%", society: "COSOTA / TAMRA" },
  { country: "Uganda", regulator: "UCC", radio: "30%", tv: "30%", society: "UPRS / URIA" },
  { country: "Côte d'Ivoire", regulator: "CNT", radio: "25%", tv: "40%", society: "BURIDA" },
  { country: "Cameroon", regulator: "CNC", radio: "30%+", tv: "30%+", society: "SOCAM" },
  { country: "Senegal", regulator: "CNRA", radio: "25%", tv: "40%", society: "BSDA" },
  { country: "DRC", regulator: "ARPTC", radio: "Varies", tv: "Varies", society: "SONECA" },
  { country: "Morocco", regulator: "HACA", radio: "40% Arabic/Amazigh", tv: "50%", society: "BMDA" },
  { country: "Algeria", regulator: "ARAV", radio: "60%", tv: "60%", society: "ONDA" },
  { country: "Angola", regulator: "INACOM", radio: "30%", tv: "30%", society: "SADIA" },
  { country: "Ethiopia", regulator: "EBA", radio: "60%", tv: "60%", society: "ECRIP" },
  { country: "Egypt", regulator: "NTRA", radio: "40% Arabic/local", tv: "40%", society: "ECAD / EMPA" },
  { country: "Zimbabwe", regulator: "BAZ", radio: "75%", tv: "75%", society: "ZIMURA" },
];

function Section({ s, forceOpen }: { s: typeof MARKETS[0]; forceOpen?: boolean }) {
  const [open, setOpen] = useState(forceOpen ?? s.defaultOpen);
  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-surface-2 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }}/>
          <span className="font-bold text-text-primary">{s.title}</span>
        </div>
        <ChevronDown size={16} className={`flex-shrink-0 text-text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}/>
      </button>
      {open && (
        <div className="border-t border-border px-5 py-5 space-y-4">
          {s.content && <p className="text-sm text-text-muted leading-relaxed">{s.content}</p>}

          {/* SA-specific extras */}
          {s.extra && "quotas" in s.extra && s.extra.quotas && (
            <div className="space-y-3">
              <p className="text-xs font-black uppercase tracking-wider" style={{ color: s.color }}>Local Music Content Quotas</p>
              {s.extra.quotas.map((q: { label: string; detail: string }) => (
                <div key={q.label} className="flex gap-3 p-3 rounded-lg" style={{ backgroundColor: `${s.color}08`, border: `1px solid ${s.color}20` }}>
                  <div className="w-1 h-full min-h-[20px] rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: s.color }}/>
                  <div>
                    <p className="text-xs font-black mb-0.5" style={{ color: s.color }}>{q.label}</p>
                    <p className="text-sm text-text-muted leading-relaxed">{q.detail}</p>
                  </div>
                </div>
              ))}
              {s.extra.saelo && (
                <div className="mt-4">
                  <p className="text-xs font-black uppercase tracking-wider mb-3" style={{ color: s.color }}>The SAELO Framework, Self-Assessment Tool</p>
                  <p className="text-sm text-text-muted mb-3">Meeting at least two of these four criteria strongly positions a recording as South African content:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {s.extra.saelo.map((item: { letter: string; criterion: string; desc: string }) => (
                      <div key={item.letter} className="flex gap-3 p-3 rounded-lg" style={{ backgroundColor: `${s.color}08`, border: `1px solid ${s.color}15` }}>
                        <span className="text-xl font-black w-8 flex-shrink-0" style={{ color: s.color }}>{item.letter}</span>
                        <div>
                          <p className="text-xs font-bold mb-0.5 text-text-primary">{item.criterion}</p>
                          <p className="text-xs text-text-muted leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {s.extra.funding && (
                <div className="mt-3 p-4 rounded-lg" style={{ backgroundColor: `${s.color}06`, border: `1px solid ${s.color}15` }}>
                  <p className="text-xs font-black uppercase tracking-wider mb-2" style={{ color: s.color }}>SABC & Broadcast Funding</p>
                  <p className="text-sm text-text-muted leading-relaxed">{s.extra.funding}</p>
                </div>
              )}
            </div>
          )}

          {/* Multi-market extras */}
          {s.extra && "markets" in s.extra && s.extra.markets && (
            <div className="space-y-4">
              {s.extra.markets.map((m: { name: string; color: string; radio: string; tv: string; royalties: string; note: string }) => (
                <div key={m.name} className="rounded-xl overflow-hidden border border-border">
                  <div className="px-4 py-2.5" style={{ backgroundColor: `${m.color}10` }}>
                    <p className="text-xs font-black uppercase tracking-wider" style={{ color: m.color }}>{m.name}</p>
                  </div>
                  <div className="px-4 py-3 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-xs font-semibold text-text-muted">Radio: </span>
                        <span className="text-text-primary">{m.radio}</span>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-text-muted">TV: </span>
                        <span className="text-text-primary">{m.tv}</span>
                      </div>
                    </div>
                    <div className="text-sm">
                      <span className="text-xs font-semibold text-text-muted">Royalties: </span>
                      <span className="text-text-primary">{m.royalties}</span>
                    </div>
                    <p className="text-xs text-text-muted leading-relaxed italic border-t border-border pt-2 mt-2">{m.note}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Bullets */}
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

          {/* Funding list for strategy section */}
          {s.extra && "funding" in s.extra && Array.isArray(s.extra.funding) && (
            <div className="mt-4">
              <p className="text-xs font-black uppercase tracking-wider mb-3" style={{ color: s.color }}>Funding Tied to Local Content Status</p>
              <div className="space-y-2">
                {s.extra.funding.map((f: { name: string; desc: string }) => (
                  <div key={f.name} className="flex gap-3 p-3 rounded-lg" style={{ backgroundColor: `${s.color}06`, border: `1px solid ${s.color}15` }}>
                    <span className="text-[10px] font-black flex-shrink-0 mt-0.5" style={{ color: s.color }}>→</span>
                    <div>
                      <p className="text-xs font-bold text-text-primary mb-0.5">{f.name}</p>
                      <p className="text-xs text-text-muted leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ContentRequirementsPage() {
  const { country } = useLocale();
  const res = getCountryResources(country);
  const br = res.broadcastRegulator;
  const isSA = country === "South Africa";

  // Build a dynamic accordion section for any country that has broadcastRegulator data.
  // SA already has its own hardcoded section inside MARKETS, so we skip it here.
  const USER_COUNTRY_SECTION = useMemo(() => {
    if (!br || isSA) return null;

    // qualCriteria strings are formatted as "Criterion — description text"
    const parsedCriteria = br.qualCriteria.map(c => {
      const dashIdx = c.indexOf(" — ");
      if (dashIdx === -1) return { letter: c.charAt(0), criterion: c, desc: "" };
      const criterion = c.slice(0, dashIdx);
      return { letter: criterion.charAt(0), criterion, desc: c.slice(dashIdx + 3) };
    });

    return {
      id: country.toLowerCase().replace(/\s+/g, "-"),
      title: `${country} — ${br.abbr} Framework`,
      color: "#06B6D4",
      defaultOpen: false,
      content: `In ${country}, broadcast content is regulated by ${br.name} (${br.abbr}). Broadcasters must maintain a minimum of ${br.radioQuota} on radio and ${br.tvQuota} on television to satisfy their licence conditions.`,
      bullets: [],
      extra: {
        quotas: [
          { label: "Commercial radio stations", detail: `${br.radioQuota}. Qualifying ${res.localContentLabel ?? country} music faces significantly less competition than international releases.` },
          { label: "Television / music video programming", detail: `${br.tvQuota} across licensed television schedules. Music video channels apply the quota to their broadcast schedule.` },
          { label: "Community and regional stations", detail: `Regional stations carry similar local content requirements — they are an accessible entry point for independent artists building their airplay track record.` },
        ],
        saelo: parsedCriteria,
        funding: br.fundingNote,
      },
    } as typeof MARKETS[0];
  }, [country, br, isSA, res.localContentLabel]);

  // Build dynamic table rows — move user's home country to the top when present
  const dynamicTableRows = useMemo(() => {
    const userRow = TABLE_ROWS.find(r => r.country === country);
    if (!userRow) return TABLE_ROWS;
    return [userRow, ...TABLE_ROWS.filter(r => r.country !== country)];
  }, [country]);

  // Build ordered market sections — put user's home section first for non-SA users
  const orderedMarkets = useMemo(() => {
    if (isSA || !USER_COUNTRY_SECTION) return [...MARKETS];
    // Non-SA user with broadcastRegulator data: show their section first; suppress the SA section
    return [USER_COUNTRY_SECTION, ...MARKETS.filter(s => s.id !== "sa")];
  }, [isSA, USER_COUNTRY_SECTION]);

  return (
    <div className="animate-fade-in max-w-3xl">
      <div className="flex items-center gap-2 text-xs text-text-muted mb-6">
        <Link href="/dashboard/library" className="hover:text-text-primary transition-colors">Toolkit</Link>
        <ChevronRight size={12}/>
        <Link href="/dashboard/library/recording" className="hover:text-text-primary transition-colors">Releasing Music</Link>
        <ChevronRight size={12}/>
        <span className="text-text-primary">Music Content Requirements</span>
      </div>

      <div className="glass-card rounded-2xl p-7 mb-8" style={{ borderColor: `${COLOR}25` }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: COLOR }}>
              {res.flag} {res.country} · 2026
            </p>
            <h1 className="text-2xl font-black text-text-primary mb-1">Music Content Requirements</h1>
            <p className="text-sm font-semibold mb-2" style={{ color: COLOR }}>Local content quotas, broadcast regulations, and certification frameworks.</p>
            <p className="text-sm text-text-muted leading-relaxed max-w-xl">
              Every country with a functioning broadcasting regulator has local content requirements. Understanding them is a commercial strategy — qualifying means airplay, royalties, and funding access that foreign artists cannot access on the same terms.
            </p>
            {br && (
              <div className="mt-3 flex items-center gap-3 flex-wrap">
                <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ color: COLOR, backgroundColor: `${COLOR}15`, border: `1px solid ${COLOR}30` }}>
                  {br.abbr} · Radio {br.radioQuota}
                </span>
                <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ color: COLOR, backgroundColor: `${COLOR}15`, border: `1px solid ${COLOR}30` }}>
                  TV {br.tvQuota}
                </span>
              </div>
            )}
          </div>
          <button type="button" onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold flex-shrink-0 transition-all hover:opacity-80" style={{ backgroundColor: `${COLOR}20`, color: COLOR, border: `1px solid ${COLOR}30` }}><Printer size={15}/><span className="hidden sm:inline">Save as PDF</span></button>
        </div>
      </div>

      {/* Your market — ARAV/ICASA quick-reference card */}
      {br && (
        <div className="glass-card rounded-2xl p-6 mb-8" style={{ borderColor: `${COLOR}20`, backgroundColor: `${COLOR}06` }}>
          <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: COLOR }}>
            {res.flag} Your Market — {br.name} ({br.abbr})
          </p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-xl p-3" style={{ backgroundColor: `${COLOR}10` }}>
              <p className="text-[10px] font-black uppercase tracking-wider text-text-muted mb-1">Radio Quota</p>
              <p className="text-sm font-black" style={{ color: COLOR }}>{br.radioQuota}</p>
            </div>
            <div className="rounded-xl p-3" style={{ backgroundColor: `${COLOR}10` }}>
              <p className="text-[10px] font-black uppercase tracking-wider text-text-muted mb-1">TV Quota</p>
              <p className="text-sm font-black" style={{ color: COLOR }}>{br.tvQuota}</p>
            </div>
          </div>
          <p className="text-xs font-black uppercase tracking-wider text-text-muted mb-2">How to Qualify as Local Content</p>
          <div className="space-y-1.5 mb-4">
            {br.qualCriteria.map((c, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-[10px] font-black flex-shrink-0 mt-0.5" style={{ color: COLOR }}>→</span>
                <p className="text-xs text-text-muted leading-relaxed">{c}</p>
              </div>
            ))}
          </div>
          <p className="text-xs font-black uppercase tracking-wider text-text-muted mb-2">Key Stations</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {br.keyStations.map((s, i) => (
              <span key={i} className="text-xs px-2.5 py-1 rounded-lg text-text-muted" style={{ backgroundColor: `${COLOR}10`, border: `1px solid ${COLOR}20` }}>{s}</span>
            ))}
          </div>
          <p className="text-xs text-text-muted italic leading-relaxed border-t border-border pt-3">{br.fundingNote}</p>
        </div>
      )}

      {/* Reference Table */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-5 rounded-full" style={{ backgroundColor: COLOR }}/>
          <h2 className="text-base font-black text-text-primary">Summary Reference — Local Content Quotas by Market</h2>
        </div>
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border" style={{ backgroundColor: `${COLOR}08` }}>
            <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: COLOR }}>All figures reflect regulatory minimums. Many broadcasters exceed these in practice.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-2.5 font-black text-text-muted uppercase tracking-wider">Country</th>
                  <th className="text-left px-4 py-2.5 font-black text-text-muted uppercase tracking-wider">Regulator</th>
                  <th className="text-left px-4 py-2.5 font-black text-text-muted uppercase tracking-wider">Radio</th>
                  <th className="text-left px-4 py-2.5 font-black text-text-muted uppercase tracking-wider">TV</th>
                  <th className="text-left px-4 py-2.5 font-black text-text-muted uppercase tracking-wider">Society</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {dynamicTableRows.map((row, i) => (
                  <tr key={row.country} className={`${i % 2 === 0 ? "" : "bg-surface-2"} ${row.country === country ? "bg-brand/5" : ""}`}>
                    <td className={`px-4 py-2.5 font-bold ${row.country === country ? "text-brand" : "text-text-primary"}`}>
                      {row.country === country && <span className="mr-1">{res.flag}</span>}{row.country}
                    </td>
                    <td className="px-4 py-2.5 text-text-muted">{row.regulator}</td>
                    <td className="px-4 py-2.5 font-semibold" style={{ color: COLOR }}>{row.radio}</td>
                    <td className="px-4 py-2.5 text-text-muted">{row.tv}</td>
                    <td className="px-4 py-2.5 text-text-muted">{row.society}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Market Sections */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-5 rounded-full" style={{ backgroundColor: COLOR }}/>
          <h2 className="text-base font-black text-text-primary">Market Guides</h2>
        </div>
        <div className="space-y-3">
          {orderedMarkets.map((s, i) => (
            <Section key={s.id} s={s} forceOpen={i === 0 ? true : undefined}/>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="glass-card rounded-xl p-4 mb-8 flex items-start gap-3" style={{ borderColor: "rgba(239,68,68,0.15)", backgroundColor: "rgba(239,68,68,0.04)" }}>
        <span className="text-sm flex-shrink-0">⚠️</span>
        <p className="text-xs text-text-muted leading-relaxed">Regulations are subject to change. Always verify current requirements with the relevant national broadcasting regulator or your local legal counsel before making content or licensing decisions. Nothing in this document constitutes legal or financial advice.</p>
      </div>

      <Link href="/dashboard/library/recording" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors">
        <ChevronLeft size={15}/>Back to Releasing Music
      </Link>
    </div>
  );
}
