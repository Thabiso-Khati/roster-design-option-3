"use client";
import { useState } from "react";
import { Heart, Mail, MessageCircle, Sparkles, Calendar, Users } from "lucide-react";
import { ModuleShell, ModuleTabs, ResourceCard, Disclaimer, ResourceItem } from "@/components/library/module-shell";

const COLOR = "#EF4444";
type Tab = "tools" | "templates";

const TOOLS: ResourceItem[] = [
  { href: "/dashboard/fan-crm", icon: Users, color: COLOR, title: "Fan CRM", desc: "Your full fan database — contacts, WhatsApp campaigns, opt-in links, and broadcast history in one place.", tag: "App" },
  { href: "/dashboard/tools/fan-signup", icon: Heart, color: COLOR, title: "Fan Signup", desc: "Capture fan emails and SMS opt-ins at shows. Pairs with broadcast templates.", tag: "Existing" },
  { href: "/dashboard/library/fan-crm/email-marketing-calendar", icon: Calendar, color: COLOR, title: "Email Marketing Calendar", desc: "12-week email cadence — pre-launch hype, drop day, post-launch nurture, tour announcements.", tag: "Calendar" },
  { href: "/dashboard/library/fan-crm/sms-whatsapp-templates", icon: MessageCircle, color: COLOR, title: "SMS / WhatsApp Broadcast Templates", desc: "Africa's-Talking-ready templates for tour announcements, presales, drops, and merch drops.", tag: "Templates" },
  { href: "/dashboard/library/fan-crm/ai-whatsapp-drafter", icon: Sparkles, color: COLOR, title: "AI WhatsApp Drafter", desc: "Draft a WhatsApp message in your voice — for fan groups, presale alerts, follow-ups. No fabricated numbers.", tag: "AI" },
];

export default function FanCrmPage() {
  const [tab, setTab] = useState<Tab>("tools");
  const tabs = [{ id: "tools" as const, label: "Tools" }, { id: "templates" as const, label: "Templates" }];
  const lists = { tools: TOOLS, templates: [] as ResourceItem[] };

  return (
    <div className="animate-fade-in max-w-3xl">
      <ModuleShell color={COLOR} icon={<Heart size={28} style={{ color: COLOR }}/>} subtitle="Own the Audience" title="Fan, CRM and Audience"
        description="First-party data is the next moat. Build the email list, the WhatsApp broadcasts, the VIP tiers, and the survey loop."
        meta={<><span style={{ color: COLOR }} className="font-semibold">{TOOLS.length} tools</span></>}
>
        <ModuleTabs tabs={tabs} active={tab} onChange={setTab}/>
        {lists[tab].length === 0 ? <div className="glass-card rounded-2xl p-12 text-center text-text-muted text-sm">Coming soon.</div> :
          <div className="space-y-3">{lists[tab].map((item, i) => <ResourceCard key={item.href} item={item} delay={i * 40}/>)}</div>}
        {tab === "tools" && <Disclaimer kind="save"/>}
      </ModuleShell>
    </div>
  );
}
