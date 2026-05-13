"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ChevronDown, Printer, ExternalLink } from "lucide-react";
import { useLocale } from "@/context/locale-context";
import { getCountryResources, hasCountryData } from "@/lib/country-resources";

const COLOR = "#10B981";

const REGIONS = [
  {
    id: "sa",
    flag: "🇿🇦",
    title: "South Africa",
    color: "#10B981",
    grants: [
      { name: "NAC Annual Project Funding", org: "National Arts Council of South Africa (NAC)", amount: "Up to R350,000 per project", who: "South African citizens (individual practitioners) or registered SA entities active in music, dance, theatre, literature, craft, visual arts, or multidisciplinary arts.", how: "Register and apply online at nac.praxisgms.co.za. Applications for the 2026/2027 cycle closed March 2026, watch nac.org.za for the next cycle announcement.", website: "www.nac.org.za", status: "ACTIVE", statusNote: "Annual cycle. Next cycle opens mid-2026." },
      { name: "Presidential Employment Stimulus Programme (PESP), Arts & Culture", org: "National Arts Council (NAC) via Department of Sport, Arts and Culture (DSAC)", amount: "Variable, project-based employment and stipend funding", who: "Individual art practitioners and registered arts organisations in music, dance, craft, literature, visual arts, multidisciplinary arts, and musical theatre.", how: "Download guidelines from nac.org.za or dsac.gov.za. Applications submitted via the NAC online portal.", website: "www.nac.org.za | www.dsac.gov.za", status: "ACTIVE", statusNote: "PESP 6 cycle confirmed for 2025/2026 financial year." },
      { name: "SAMRO Music Creation Support Fund (MCSF)", org: "South African Music Rights Organisation (SAMRO)", amount: "Micro-grants up to R25,000", who: "SAMRO Full and Associate members who are composers, for the creation of new musical works.", how: "Apply through SAMRO directly. Contact SAMRO Foundation: samrofoundation@samro.org.za or +27 (0)11 712 8417.", website: "www.samro.org.za/csi/the-samro-music-creation-support-fund", status: "ACTIVE", statusNote: "Rolling applications. SAMRO membership required." },
      { name: "SAMRO Foundation Bursary Programme", org: "SAMRO Foundation", amount: "R11,000 per academic year (tuition fees)", who: "Music students from second year onwards pursuing a diploma or degree at a recognised SA higher education institution (excludes first-year and doctoral students, and private colleges such as AFDA and City Varsity).", how: "Complete the application form at samrofoundation.org.za/samro-musicBursaries.php. Contact: anriette.chorn@samro.org.za.", website: "www.samrofoundation.org.za", status: "ACTIVE", statusNote: "Annual intake." },
      { name: "National Lotteries Commission (NLC), Arts, Culture & National Heritage Fund", org: "National Lotteries Commission (NLC)", amount: "Variable, project-specific. Organisations may apply for significant sums where impact and reach is demonstrated.", who: "Non-profit entities working for the public good in arts, culture, and heritage. Registered NPOs or PBOs required.", how: "Download the Arts-Culture-and-National-Heritage-Guidelines and Application Manual from nlcsa.org.za. Submit online via the NLC funding portal.", website: "www.nlcsa.org.za", status: "ACTIVE", statusNote: "Ongoing. Multiple funding windows per year." },
      { name: "SAMRO Music Business Skills Programme (Bursary)", org: "South African Music Rights Organisation (SAMRO)", amount: "Bursary towards approved music business and industry skills training", who: "SAMRO Full and Associate members seeking to develop music business competencies.", how: "Apply through SAMRO. Contact SAMRO Foundation for the current application window.", website: "www.samro.org.za", status: "ACTIVE", statusNote: "Periodic intake. Contact SAMRO Foundation for current availability." },
    ],
  },
  {
    id: "pan",
    flag: "🌍",
    title: "Pan-African & Multi-Country Programmes",
    color: "#C9A84C",
    grants: [
      { name: "Music In Africa Foundation, Sound Connects Fund", org: "Music In Africa Foundation (MIAF)", amount: "Grant and capacity-building support, amounts vary per project", who: "Creative and cultural industry organisations in SADC countries: Angola, Botswana, eSwatini, Lesotho, Malawi, Mozambique, Namibia, Zambia, and Zimbabwe.", how: "Apply via musicinafrica.net. Monitor the MIAF funding directory and open calls regularly.", website: "www.musicinafrica.net/directory-categories/funding", status: "ACTIVE", statusNote: "SADC-focused. Check musicinafrica.net for current call status." },
      { name: "British Council, Biennials Connect Grants", org: "British Council Sub-Saharan Africa", amount: "Grants for travel, artwork production, networking, and professional development", who: "Artists involved in biennial or festival exhibitions in eligible SSA countries: South Africa, Nigeria, Kenya, Ghana, Tanzania, Uganda, Rwanda, Zambia, Zimbabwe, Senegal, Ethiopia.", how: "Apply via arts.britishcouncil.org. Projects must begin by February 2026 and conclude no later than February 2027.", website: "arts.britishcouncil.org | britishcouncil.org.za", status: "ACTIVE", statusNote: "2025/2026 cycle. Check britishcouncil.org for next open call." },
      { name: "British Council, Festival Connect Fund", org: "British Council Sub-Saharan Africa", amount: "Up to £15,000 per project (three tiers: £5,000 / £10,000 / £15,000)", who: "Festivals based in SSA (Uganda, Kenya, Nigeria, Ghana, Rwanda, South Africa, Tanzania, Zambia, Zimbabwe, Malawi) with collaborative proposals involving a UK partner festival.", how: "Apply via britishcouncil.org. Proposals must promote cultural exchange, mobility, and community impact.", website: "www.britishcouncil.org/east-africa-arts/opportunities", status: "ACTIVE", statusNote: "Festival Connect Fund 2025 closed June 2025. Watch for 2026 cycle." },
      { name: "Africa No Filter, Project Grants", org: "Africa No Filter (ANF)", amount: "Variable, project grants for narrative change and creative storytelling", who: "African artists, cultural practitioners, and media organisations working to challenge and shift stereotypical narratives about Africa through arts, culture, and media.", how: "Apply via africanofilter.org/our-grants. ANF runs multiple grant cycles per year targeting different creative disciplines.", website: "www.africanofilter.org", status: "ACTIVE", statusNote: "Multiple cycles per year. Check website for current open calls." },
      { name: "Goethe-Institut, International Co-production Fund", org: "Goethe-Institut (German Cultural Institute)", amount: "€15,000 to €30,000 per co-production", who: "Artists and cultural organisations creating new or developing existing productions in music, theatre, dance, and performance of high artistic standard with public impact. Must involve a German partner.", how: "Apply via goethe.de. Monitor for subsequent rounds after current cycle.", website: "www.goethe.de", status: "ACTIVE", statusNote: "Bi-annual cycles. Next call expected late 2026." },
    ],
  },
];

function GrantCard({ g, color }: { g: typeof REGIONS[0]["grants"][0]; color: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-surface-2 transition-colors">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <p className="font-bold text-text-primary text-sm">{g.name}</p>
            <span className="text-[10px] font-black px-2 py-0.5 rounded" style={{ color: "#10B981", backgroundColor: "rgba(16,185,129,0.12)" }}>● {g.status}</span>
          </div>
          <p className="text-xs text-text-muted">{g.org} · <span className="font-semibold" style={{ color }}>{g.amount}</span></p>
        </div>
        <ChevronDown size={16} className={`flex-shrink-0 text-text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}/>
      </button>
      {open && (
        <div className="border-t border-border divide-y divide-border">
          {[
            { label: "Who Can Apply", value: g.who },
            { label: "How to Apply", value: g.how },
            { label: "Website", value: g.website },
            { label: "Status (2026)", value: g.statusNote },
          ].map(row => (
            <div key={row.label} className="grid grid-cols-1 sm:grid-cols-4 px-5 py-3 gap-2">
              <p className="text-[10px] font-black uppercase tracking-wider sm:col-span-1 mt-0.5" style={{ color }}>{row.label}</p>
              <p className="text-sm text-text-muted leading-relaxed sm:col-span-3">{row.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function GrantFundingPage() {
  const { country } = useLocale();
  const res = getCountryResources(country);
  const isNonSA = hasCountryData(country) && country !== "South Africa";
  return (
    <div className="animate-fade-in max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-text-muted mb-6">
        <Link href="/dashboard/library" className="hover:text-text-primary transition-colors">Toolkit</Link>
        <ChevronRight size={12}/>
        <Link href="/dashboard/library/money" className="hover:text-text-primary transition-colors">Money Matters</Link>
        <ChevronRight size={12}/>
        <span className="text-text-primary">Grant & Funding Guide</span>
      </div>

      {/* Header */}
      <div className="glass-card rounded-2xl p-7 mb-8" style={{ borderColor: "#10B98125" }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: COLOR }}>{res.flag} {res.country} · Pan-African · 2026</p>
            <h1 className="text-2xl font-black text-text-primary mb-2">Grant & Funding Guide for African Music Artists</h1>
            <p className="text-sm text-text-muted leading-relaxed max-w-xl">
              Every verified, currently active funding programme available to musicians, producers, music managers, and music organisations across South Africa and key African markets as of 2026. Every entry has been checked for current status.
            </p>
            <p className="text-xs text-text-muted mt-3 italic">Always verify deadlines directly with the funding body, windows open and close rapidly.</p>
          </div>
          <button type="button" onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold flex-shrink-0 transition-all hover:opacity-80" style={{ backgroundColor: `${COLOR}20`, color: COLOR, border: `1px solid ${COLOR}30` }}><Printer size={15}/><span className="hidden sm:inline">Save as PDF</span></button>
        </div>
      </div>

      {/* Country-specific grants block (non-SA users) */}
      {isNonSA && res.grants.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-5 rounded-full" style={{ backgroundColor: COLOR }}/>
            <h2 className="text-base font-black text-text-primary">
              <span className="mr-2">{res.flag}</span>{res.country} — Local Funding & Grants
            </h2>
          </div>
          <div className="space-y-3">
            {res.grants.map(g => (
              <div key={g.name} className="glass-card rounded-xl p-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-text-primary text-sm mb-0.5">{g.name}</p>
                  <p className="text-sm text-text-muted leading-relaxed">{g.note}</p>
                </div>
                {g.url && (
                  <a href={g.url} target="_blank" rel="noopener noreferrer"
                    className="flex-shrink-0 flex items-center gap-1 text-xs font-semibold mt-0.5 hover:opacity-70 transition-opacity"
                    style={{ color: COLOR }}>
                    Visit <ExternalLink size={10}/>
                  </a>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-text-muted mt-3 italic">These are starting points — {res.country} funding landscape is evolving. Check government ministry websites and Music In Africa for updated calls.</p>
        </div>
      )}

      {/* Regions */}
      <div className="space-y-10 mb-10">
        {REGIONS.map(region => (
          <div key={region.id}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-5 rounded-full" style={{ backgroundColor: region.color }}/>
              <h2 className="text-base font-black text-text-primary">
                <span className="mr-2">{region.flag}</span>{region.title}
              </h2>
              <span className="text-xs text-text-muted">{region.grants.length} programme{region.grants.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="space-y-3">
              {region.grants.map(g => <GrantCard key={g.name} g={g} color={region.color}/>)}
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-xl p-4 mb-8 flex items-start gap-3" style={{ borderColor: "rgba(239,68,68,0.15)", backgroundColor: "rgba(239,68,68,0.04)" }}>
        <span className="text-sm flex-shrink-0">⚠️</span>
        <p className="text-xs text-text-muted leading-relaxed">This guide provides general information only. Grant availability, amounts, and application windows change frequently. All information should be independently verified directly with the relevant funding body before submitting an application. Nothing in this document constitutes financial or legal advice.</p>
      </div>

      <Link href="/dashboard/library/money" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors">
        <ChevronLeft size={15}/>Back to Money Matters
      </Link>
    </div>
  );
}
