"use client";
import { useState } from "react";
import { FileText, ClipboardList, Mail, Search, Calculator, Sparkles } from "lucide-react";
import {
  ModuleShell,
  ModuleTabs,
  ResourceCard,
  Disclaimer,
  ResourceItem,
} from "@/components/library/module-shell";

const COLOR = "#22D3EE";
type Tab = "guides" | "forms" | "tools";

const GUIDES: ResourceItem[] = [
  {
    href: "/dashboard/library/sync/guide-how-sync-works",
    icon: FileText,
    color: COLOR,
    title: "How Sync Licensing Actually Works",
    desc: "The full sync chain — from a song hitting a music supervisor's inbox to a quote, an MFN, a license, a cue sheet, and the back-end PRO collection that follows broadcast. African artist's guide.",
    tag: "Guide",
  },
];

const FORMS: ResourceItem[] = [
  {
    href: "/dashboard/library/sync/sync-pitch-one-sheet",
    icon: FileText,
    color: COLOR,
    title: "Sync Pitch One-Sheet",
    desc: "The atomic unit of sync. One sheet per song — mood, BPM, instrumentation, key, lyrics theme, clearance status. The artefact you send to every music supervisor.",
    tag: "Per song",
  },
  {
    href: "/dashboard/library/sync/sync-license-agreement",
    icon: FileText,
    color: COLOR,
    title: "Sync License Agreement",
    desc: "Master and composition sync license template covering term, territory, media, exclusivity, MFN, credit, and warranties. SA + NG signature blocks.",
    tag: "Contract",
  },
  {
    href: "/dashboard/library/sync/sync-quote-letter",
    icon: Mail,
    color: COLOR,
    title: "Sync Quote Letter",
    desc: "Templated response to a sync request — sets out the fee, scope, MFN status and timeline. Sends back faster than email and locks negotiation language.",
    tag: "Template",
  },
];

const TOOLS: ResourceItem[] = [
  {
    href: "/dashboard/library/sync/sync-pitch-tracker",
    icon: ClipboardList,
    color: COLOR,
    title: "Sync Pitch Tracker",
    desc: "Track every pitch by song, music supervisor, project, status, fee quote, and outcome. The pipeline view of your sync operation.",
    tag: "Tracker",
  },
  {
    href: "/dashboard/library/sync/music-supervisor-directory",
    icon: Search,
    color: COLOR,
    title: "Music Supervisor Directory",
    desc: "Curated directory of music supervisors and ad agencies across South Africa, Nigeria, UK, US — with current shows, agency, and outreach status.",
    tag: "Directory",
  },
  {
    href: "/dashboard/library/sync/sync-quote-calculator",
    icon: Calculator,
    color: COLOR,
    title: "Sync Quote Calculator",
    desc: "Compute a quote from rights × term × territory × media × exclusivity. Anchored to the African + global benchmarks. Always start from a number, never a feeling.",
    tag: "Calculator",
  },
  {
    href: "/dashboard/library/sync/ai-sync-pitch-drafter",
    icon: Sparkles,
    color: COLOR,
    title: "AI Sync Pitch Drafter",
    desc: "Draft a personalised sync pitch email to a music supervisor in three seconds. Uses the song's metadata + project brief to ground the pitch, no fabricated stats.",
    tag: "AI",
  },
];

export default function SyncModulePage() {
  const [tab, setTab] = useState<Tab>("forms");
  const tabs = [
    { id: "guides" as const, label: "Sync Guides" },
    { id: "forms" as const, label: "Forms & Templates" },
    { id: "tools" as const, label: "Work Tools" },
  ];

  const lists = { guides: GUIDES, forms: FORMS, tools: TOOLS };

  return (
    <div className="animate-fade-in max-w-3xl">
      <ModuleShell
        color={COLOR}
        icon="🎞️"
        subtitle="Songs in Pictures"
        title="Sync Licensing"
        description="Music supervisor outreach, sync license agreements, MFN comparators, quote letters — the highest-margin licensing lever for catalogue artists."
        meta={
          <>
            <span style={{ color: COLOR }} className="font-semibold">{GUIDES.length} guide</span>
            <span>·</span>
            <span style={{ color: COLOR }} className="font-semibold">{FORMS.length} forms & templates</span>
            <span>·</span>
            <span style={{ color: COLOR }} className="font-semibold">{TOOLS.length} work tools</span>
          </>
        }
      >
        <ModuleTabs tabs={tabs} active={tab} onChange={setTab} />
        <div className="space-y-3">
          {lists[tab].map((item, i) => (
            <ResourceCard key={item.href} item={item} delay={i * 40} />
          ))}
        </div>
        {tab === "forms" && <Disclaimer kind="legal" />}
        {tab === "tools" && <Disclaimer kind="save" />}
      </ModuleShell>
    </div>
  );
}
