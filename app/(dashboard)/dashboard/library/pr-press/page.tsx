"use client";
import { useState } from "react";
import { FileText, Sparkles, Newspaper, Mail, AlertTriangle, MessageSquareQuote, Trophy } from "lucide-react";
import { ModuleShell, ModuleTabs, ResourceCard, Disclaimer, ResourceItem } from "@/components/library/module-shell";

const COLOR = "#F472B6";
type Tab = "press" | "crisis" | "awards";

const PRESS: ResourceItem[] = [
  { href: "/dashboard/library/pr-press/press-release-templates", icon: FileText, color: COLOR, title: "Press Release Templates", desc: "4 variants — single drop, tour announcement, signing, award. Fillable headers and quote blocks.", tag: "4 variants" },
  { href: "/dashboard/library/pr-press/ai-press-release-drafter", icon: Sparkles, color: COLOR, title: "AI Press Release Drafter", desc: "AI-drafted press release in your voice with verified-numbers-only rule. Edit before issuing.", tag: "AI" },
  { href: "/dashboard/library/pr-press/quotes-library", icon: MessageSquareQuote, color: COLOR, title: "Quotes Library", desc: "Pre-approved quotes per topic — origin, music, live, industry, brand, awards, crisis. Saves the 'what should I say' loop.", tag: "Reference" },
  { href: "/dashboard/tools/pitching-scripts", icon: Mail, color: COLOR, title: "Pitching Scripts (existing)", desc: "AI-powered email drafter for press, playlists, sync, A&R.", tag: "Existing" },
];

const CRISIS: ResourceItem[] = [
  { href: "/dashboard/library/pr-press/crisis-comms-playbook", icon: AlertTriangle, color: COLOR, title: "Crisis Comms Playbook", desc: "5-phase response framework — first hour, initial response, sustained, recovery, audit. Read in calm. Use in chaos.", tag: "Playbook" },
  { href: "/dashboard/library/pr-press/apology-templates", icon: FileText, color: COLOR, title: "Apology Statement Templates", desc: "6 pre-drafted apology statements by severity — clarification, missed show, social misstep, public behaviour, allegations, team-member.", tag: "Templates" },
];

const AWARDS: ResourceItem[] = [
  { href: "/dashboard/library/pr-press/awards-tracker", icon: Trophy, color: COLOR, title: "Awards Submission Tracker", desc: "SAMA, Headies, AFRIMA, Grammy, BET, MOBO and more — by award × year × category × status.", tag: "Tracker" },
  { href: "/dashboard/library/pr-press/awards-bio-pack", icon: FileText, color: COLOR, title: "Awards Bio + EPK Pack", desc: "Bios at 4 lengths + audio/video specs + press quotes + verified streaming stats. Build once per cycle.", tag: "Pack" },
];

export default function PrPressPage() {
  const [tab, setTab] = useState<Tab>("press");
  const tabs = [
    { id: "press" as const, label: "Press" },
    { id: "crisis" as const, label: "Crisis Comms" },
    { id: "awards" as const, label: "Awards" },
  ];
  const lists: Record<Tab, ResourceItem[]> = { press: PRESS, crisis: CRISIS, awards: AWARDS };
  const total = PRESS.length + CRISIS.length + AWARDS.length;

  return (
    <div className="animate-fade-in max-w-3xl">
      <ModuleShell color={COLOR} icon={<Newspaper size={28} style={{ color: COLOR }}/>} subtitle="Tell Your Story" title="PR, Press and Awards"
        description="Press releases, quotes library, crisis comms playbook, apology templates, awards submission tracker, awards bio pack. Every campaign earns its own narrative; every crisis has a 5-phase plan."
        meta={<>
          <span style={{ color: COLOR }} className="font-semibold">{PRESS.length} press</span>
          <span>·</span>
          <span style={{ color: COLOR }} className="font-semibold">{CRISIS.length} crisis</span>
          <span>·</span>
          <span style={{ color: COLOR }} className="font-semibold">{AWARDS.length} awards</span>
        </>}>
        <ModuleTabs tabs={tabs} active={tab} onChange={setTab}/>
        <div className="space-y-3">{lists[tab].map((item, i) => <ResourceCard key={item.href} item={item} delay={i * 40}/>)}</div>
        <Disclaimer kind="save"/>
        <p className="text-[11px] text-text-muted leading-relaxed mt-4">{total} PR / press / awards artefacts shipped.</p>
      </ModuleShell>
    </div>
  );
}
