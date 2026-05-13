"use client";
import { useState } from "react";
import { Disc3, FileText, ClipboardList, BarChart3, Search, ListChecks, Volume2, Activity } from "lucide-react";
import { ModuleShell, ModuleTabs, ResourceCard, Disclaimer, ResourceItem } from "@/components/library/module-shell";

const COLOR = "#0EA5E9";
type Tab = "guides" | "tools";

const GUIDES: ResourceItem[] = [
  { href: "/dashboard/library/recording/distribution", icon: Disc3, color: COLOR, title: "Music Distribution Guide", desc: "Distributor selection, DDEX delivery, royalty pay-out economics, African distribution landscape.", tag: "Guide" },
  { href: "/dashboard/library/recording/isrc-upc", icon: FileText, color: COLOR, title: "ISRC & UPC Codes", desc: "How they connect recordings to royalty collection, streaming analytics, anti-piracy monitoring.", tag: "Guide" },
];

const TOOLS: ResourceItem[] = [
  { href: "/dashboard/library/distribution/distributor-comparison", icon: Search, color: COLOR, title: "Distributor Comparison Matrix", desc: "12 distributors compared — payout, upfront cost, African focus, sync inclusion. Decide before you upload.", tag: "Matrix" },
  { href: "/dashboard/library/distribution/dsp-comparison", icon: Search, color: COLOR, title: "DSP Comparison Matrix", desc: "11 DSPs — per-stream rate, reach, African market share, editorial route. Where to push, where to skip.", tag: "Matrix" },
  { href: "/dashboard/library/distribution/audio-qc", icon: Volume2, color: COLOR, title: "Audio QC Tool", desc: "Browser-based pre-flight: peak, RMS, true-peak estimate, LUFS proxy. Catches the obvious red flags.", tag: "QC" },
  { href: "/dashboard/library/distribution/pre-release-metadata-qc", icon: ListChecks, color: COLOR, title: "Pre-Release Metadata QC", desc: "Final pre-flight before delivery — track + release metadata, artwork, credits, lyrics, sample clearance.", tag: "Checklist" },
  { href: "/dashboard/library/distribution/pitch-audit", icon: Activity, color: COLOR, title: "Pitch Audit Report", desc: "Did the release land? Audit pitches against actual placements 14-28 days post-release.", tag: "Audit" },
  { href: "/dashboard/tools/dsp-pitching", icon: ClipboardList, color: COLOR, title: "DSP Pitching", desc: "Per-DSP editorial pitch tracker — Spotify, Apple Music, Audiomack, Boomplay, Deezer, Tidal, Mdundo.", tag: "Tracker" },
  { href: "/dashboard/library/recording/release-checklist", icon: ClipboardList, color: COLOR, title: "Release Checklist", desc: "Mastering, metadata, artwork, distribution, pitching, promotion — interactive.", tag: "Checklist" },
  { href: "/dashboard/library/recording/master-delivery-specs", icon: BarChart3, color: COLOR, title: "Master Delivery Specs", desc: "Pre-flight checks before files leave your distributor portal — LUFS, peak, MFiT, stems, metadata.", tag: "Specs" },
  { href: "/dashboard/library/visual-production/cover-art-qc", icon: ClipboardList, color: COLOR, title: "Cover Art QC", desc: "3000×3000, RGB, no logos / URLs. Prevents DSP rejection before delivery.", tag: "Checklist" },
];

export default function DistributionPage() {
  const [tab, setTab] = useState<Tab>("tools");
  const tabs = [{ id: "guides" as const, label: "Guides" }, { id: "tools" as const, label: "Tools" }];
  const lists = { guides: GUIDES, tools: TOOLS };

  return (
    <div className="animate-fade-in max-w-3xl">
      <ModuleShell color={COLOR} icon="💿" subtitle="Get It Out" title="Distribution and DSPs"
        description="Pick the right distributor, deliver clean metadata, hit every QC mark, pitch every editor, and audit what landed where."
        meta={<><span style={{ color: COLOR }} className="font-semibold">{GUIDES.length} guides</span><span>·</span><span style={{ color: COLOR }} className="font-semibold">{TOOLS.length} tools</span></>}>
        <ModuleTabs tabs={tabs} active={tab} onChange={setTab}/>
        <div className="space-y-3">{lists[tab].map((item, i) => <ResourceCard key={item.href} item={item} delay={i * 40}/>)}</div>
        {tab === "tools" && <Disclaimer kind="save"/>}
      </ModuleShell>
    </div>
  );
}
