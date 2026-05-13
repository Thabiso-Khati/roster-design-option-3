"use client";
import { useState } from "react";
import { FileText, Shield, ClipboardList, Lock, Library } from "lucide-react";
import { ModuleShell, ModuleTabs, ResourceCard, Disclaimer, ResourceItem } from "@/components/library/module-shell";
import { CONTRACT_REGISTRY } from "@/lib/contracts/registry";

const COLOR = "#64748B";
type Tab = "library" | "templates" | "trackers" | "compliance";

const LIBRARY_ITEMS: ResourceItem[] = [
  {
    href: "/dashboard/library/legal/contract-library",
    icon: Library,
    color: COLOR,
    title: "Contract Library",
    desc: `Every signable agreement on ROSTER, in one place — ${CONTRACT_REGISTRY.length} contracts across Recording, Publishing, Sync, Touring, Marketing, and more. Each is e-signature ready with editable Term, Option, and percentage fields.`,
    tag: `${CONTRACT_REGISTRY.length} contracts`,
  },
];

const TEMPLATES: ResourceItem[] = [
  { href: "/dashboard/library/legal/nda-mutual", icon: FileText, color: COLOR, title: "NDA — Mutual", desc: "Mutual non-disclosure between two parties exchanging confidential information (e.g. label and artist evaluating a deal).", tag: "NDA" },
  { href: "/dashboard/library/legal/nda-one-way", icon: FileText, color: COLOR, title: "NDA — One-Way", desc: "One-way non-disclosure (artist discloses to a producer / contractor evaluating a session).", tag: "NDA" },
  { href: "/dashboard/library/legal/data-processing-agreement", icon: FileText, color: COLOR, title: "Data Processing Agreement (DPA)", desc: "Required by POPIA / NDPA whenever you engage a third party that processes personal data on your behalf.", tag: "DPA" },
];

const TRACKERS: ResourceItem[] = [
  { href: "/dashboard/library/legal/trademark-tracker", icon: ClipboardList, color: COLOR, title: "Trademark Application Tracker", desc: "Track every TM application — artist name, logo, tour name, merch wordmark — across every jurisdiction. Renewal dates surfaced.", tag: "Tracker" },
  { href: "/dashboard/library/legal/copyright-tracker", icon: ClipboardList, color: COLOR, title: "Copyright Registration Tracker", desc: "Formal copyright registrations across every work. US LOC critical for statutory damages on US distribution.", tag: "Tracker" },
];

const COMPLIANCE: ResourceItem[] = [
  { href: "/dashboard/library/legal/popia-gdpr-template", icon: Lock, color: COLOR, title: "Privacy Policy Template (POPIA / NDPA)", desc: "Privacy policy template for an artist's website / fan list / ticketing operation. SA + NG variants via the locale switcher.", tag: "Template" },
];

export default function LegalPage() {
  const [tab, setTab] = useState<Tab>("library");
  const tabs = [
    { id: "library" as const,    label: "Contract Library" },
    { id: "templates" as const,  label: "Templates" },
    { id: "trackers" as const,   label: "Trackers" },
    { id: "compliance" as const, label: "Compliance" },
  ];
  const lists: Record<Tab, ResourceItem[]> = {
    library: LIBRARY_ITEMS,
    templates: TEMPLATES,
    trackers: TRACKERS,
    compliance: COMPLIANCE,
  };
  const total = TEMPLATES.length + TRACKERS.length + COMPLIANCE.length + LIBRARY_ITEMS.length;

  return (
    <div className="animate-fade-in max-w-3xl">
      <ModuleShell color={COLOR} icon={<Shield size={28} style={{ color: COLOR }}/>} subtitle="Cover Yourself" title="Legal and Compliance"
        description="NDAs, releases, trademark and copyright trackers, POPIA / NDPA compliance, data processing agreements. The legal stack outside specific deal types."
        meta={<>
          <span style={{ color: COLOR }} className="font-semibold">{CONTRACT_REGISTRY.length} contracts</span>
          <span>·</span>
          <span style={{ color: COLOR }} className="font-semibold">{TEMPLATES.length} templates</span>
          <span>·</span>
          <span style={{ color: COLOR }} className="font-semibold">{TRACKERS.length} trackers</span>
          <span>·</span>
          <span style={{ color: COLOR }} className="font-semibold">{COMPLIANCE.length} compliance</span>
        </>}>
        <ModuleTabs tabs={tabs} active={tab} onChange={setTab}/>
        <div className="space-y-3">{lists[tab].map((item, i) => <ResourceCard key={item.href} item={item} delay={i * 40}/>)}</div>
        <Disclaimer kind="legal"/>
        <p className="text-[11px] text-text-muted leading-relaxed mt-4">More coming: cease-and-desist, DMCA, force-majeure clause library, e-signature workflow. Total {total} legal artefacts shipped.</p>
      </ModuleShell>
    </div>
  );
}
