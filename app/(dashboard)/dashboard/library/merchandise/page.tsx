"use client";
import { useState } from "react";
import { ShoppingBag, BarChart3, ClipboardList, Truck, Zap, Settings, Layers } from "lucide-react";
import { ModuleShell, ModuleTabs, ResourceCard, Disclaimer, ResourceItem } from "@/components/library/module-shell";

const COLOR = "#FB923C";
type Tab = "tools" | "strategy";

const TOOLS: ResourceItem[] = [
  { href: "/dashboard/library/merchandise/tour-merch-inventory", icon: ClipboardList, color: COLOR, title: "Tour Merch Inventory", desc: "Per-show stock-on-hand, sold, returned, opening / closing counts — by SKU. Use with tour table merch sales.", tag: "Inventory" },
  { href: "/dashboard/library/merchandise/tour-merch-settlement", icon: BarChart3, color: COLOR, title: "Tour Merch Settlement", desc: "Per-show settlement vs. venue's typical 75/25 cut, plus net to artist.", tag: "Settlement" },
  { href: "/dashboard/library/merchandise/drop-capacity-planner", icon: Layers, color: COLOR, title: "Drop Capacity Planner", desc: "How many units to print, what revenue to expect, what margin you'll see. Models conversion × AOV × bundle uplift.", tag: "Calculator" },
  { href: "/dashboard/tools/merch-revenue", icon: BarChart3, color: COLOR, title: "Merch Revenue", desc: "Track merchandise sales by item, channel, and tour.", tag: "Existing" },
  { href: "/dashboard/tools/merch-sales", icon: ClipboardList, color: COLOR, title: "Merch Sales (tour-table ledger)", desc: "Daily merch ledger for tour table.", tag: "Existing" },
  { href: "/dashboard/tools/shipping-matrix", icon: Truck, color: COLOR, title: "Shipping Matrix", desc: "Merch shipping cost tables across RSA, SADC, West / East Africa, international.", tag: "Existing" },
];

const STRATEGY: ResourceItem[] = [
  { href: "/dashboard/library/merchandise/bandcamp-day-strategy", icon: Zap, color: COLOR, title: "Bandcamp Day Strategy", desc: "First Friday monthly — Bandcamp waives revenue cut for 24h. T-14 / T-7 / T-1 / day-of campaign blueprint.", tag: "Playbook" },
  { href: "/dashboard/library/merchandise/shopify-setup", icon: Settings, color: COLOR, title: "Shopify Setup Checklist", desc: "Complete D2C merch infrastructure on Shopify. SA + NG payment rails (Paystack + Flutterwave). 30-item launch checklist.", tag: "Checklist" },
];

export default function MerchandisePage() {
  const [tab, setTab] = useState<Tab>("tools");
  const tabs = [
    { id: "tools" as const, label: "Tools" },
    { id: "strategy" as const, label: "Strategy" },
  ];
  const lists: Record<Tab, ResourceItem[]> = { tools: TOOLS, strategy: STRATEGY };
  const total = TOOLS.length + STRATEGY.length;

  return (
    <div className="animate-fade-in max-w-3xl">
      <ModuleShell color={COLOR} icon={<ShoppingBag size={28} style={{ color: COLOR }}/>} subtitle="Direct to Fans" title="Merchandise and D2C"
        description="Inventory + settlement, drop capacity, Bandcamp Day strategy, Shopify setup. The most profitable revenue stream when run right."
        meta={<>
          <span style={{ color: COLOR }} className="font-semibold">{TOOLS.length} tools</span>
          <span>·</span>
          <span style={{ color: COLOR }} className="font-semibold">{STRATEGY.length} strategy docs</span>
        </>}>
        <ModuleTabs tabs={tabs} active={tab} onChange={setTab}/>
        <div className="space-y-3">{lists[tab].map((item, i) => <ResourceCard key={item.href} item={item} delay={i * 40}/>)}</div>
        <Disclaimer kind="save"/>
        <p className="text-[11px] text-text-muted leading-relaxed mt-4">{total} merch / D2C artefacts shipped.</p>
      </ModuleShell>
    </div>
  );
}
