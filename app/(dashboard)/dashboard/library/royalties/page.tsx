"use client";
import { useState } from "react";
import { Calculator, FileText, ClipboardList, BarChart3 } from "lucide-react";
import { ModuleShell, ModuleTabs, ResourceCard, Disclaimer, ResourceItem } from "@/components/library/module-shell";

const COLOR = "#EAB308";
type Tab = "guides" | "tools";

const TOOLS: ResourceItem[] = [
  { href: "/dashboard/library/royalties/royalty-statement-reconciliation", icon: Calculator, color: COLOR, title: "Royalty Statement Reconciliation", desc: "Compare what the label / distributor reported vs. what your tracker said you earned. Closes the gap. Most artists are missing money here.", tag: "Reconciliation" },
  { href: "/dashboard/library/royalties/streaming-income-reconciliation", icon: BarChart3, color: COLOR, title: "Streaming Income Reconciliation", desc: "Per-platform per-track stream count × per-stream rate × territory mix. Compare to distributor pay-out. Catches the under-payment.", tag: "Reconciliation" },
  { href: "/dashboard/library/royalties/recoupable-cost-tracker", icon: ClipboardList, color: COLOR, title: "Recoupable Cost Tracker", desc: "What's recoupable from the advance, what isn't. Critical when an artist signs a label deal — prevents disputes about line items.", tag: "Tracker" },
  { href: "/dashboard/library/royalties/advance-recoupment-tracker", icon: BarChart3, color: COLOR, title: "Advance Recoupment Tracker", desc: "Burn-down on the label advance. How many streams / how much sync income to recoupment.", tag: "Tracker" },
];

export default function RoyaltiesPage() {
  const [tab, setTab] = useState<Tab>("tools");
  const tabs = [{ id: "guides" as const, label: "Guides" }, { id: "tools" as const, label: "Reconciliation Tools" }];
  const lists = { guides: [] as ResourceItem[], tools: TOOLS };

  return (
    <div className="animate-fade-in max-w-3xl">
      <ModuleShell color={COLOR} icon="💰" subtitle="Collect What's Owed" title="Royalties"
        description="Statement reconciliation, advance recoupment, registration trackers across PRO/MRO/neighbouring rights. The money you earned but haven't been paid."
        meta={<><span style={{ color: COLOR }} className="font-semibold">{TOOLS.length} reconciliation tools</span></>}>
        <ModuleTabs tabs={tabs} active={tab} onChange={setTab}/>
        {lists[tab].length === 0 ? <div className="glass-card rounded-2xl p-12 text-center text-text-muted text-sm">Coming soon.</div> :
          <div className="space-y-3">{lists[tab].map((item, i) => <ResourceCard key={item.href} item={item} delay={i * 40}/>)}</div>}
        {tab === "tools" && <Disclaimer kind="save"/>}
      </ModuleShell>
    </div>
  );
}
