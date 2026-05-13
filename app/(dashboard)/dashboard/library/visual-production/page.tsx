"use client";
import { useState } from "react";
import { FileText, ClipboardList, BarChart3, Calendar, Image as ImageIcon, UserCheck, MapPin, Video, Camera, Aperture, Shirt, Database, Palette } from "lucide-react";
import { ModuleShell, ModuleTabs, ResourceCard, Disclaimer, ResourceItem } from "@/components/library/module-shell";

const COLOR = "#A855F7";
type Tab = "guides" | "forms" | "tools";

const FORMS: ResourceItem[] = [
  { href: "/dashboard/library/visual-production/director-agreement", icon: FileText, color: COLOR, title: "Director Agreement (Music Video)", desc: "Engagement, deliverables, IP assignment, credit, indemnity. SA + NG governing law options.", tag: "Contract" },
  { href: "/dashboard/library/visual-production/photographer-agreement", icon: Camera, color: COLOR, title: "Photographer Agreement", desc: "Press, cover, music-video stills, live photography. Full IP assignment to commissioner.", tag: "Contract" },
  { href: "/dashboard/library/visual-production/dp-agreement", icon: Aperture, color: COLOR, title: "DP / Cinematographer Agreement", desc: "Director of Photography for music video, BTS, branded content. Raw footage handover.", tag: "Contract" },
  { href: "/dashboard/library/visual-production/stylist-agreement", icon: Shirt, color: COLOR, title: "Stylist / Wardrobe Agreement", desc: "Editorial, press, music-video, live wardrobe. Garment sourcing, returns, alterations.", tag: "Contract" },
  { href: "/dashboard/library/visual-production/image-likeness-release", icon: UserCheck, color: COLOR, title: "Image & Likeness Release", desc: "Artist or talent grants of name, image, likeness and biographical use, in perpetuity, world.", tag: "Release" },
  { href: "/dashboard/library/visual-production/talent-release", icon: UserCheck, color: COLOR, title: "Talent / Extras Release", desc: "Standard release for non-principal cast and extras appearing in the music video.", tag: "Release" },
  { href: "/dashboard/library/visual-production/location-release", icon: MapPin, color: COLOR, title: "Location Release", desc: "Property owner permission for filming on a location with insurance and indemnity terms.", tag: "Release" },
];

const TOOLS: ResourceItem[] = [
  { href: "/dashboard/library/visual-production/music-video-treatment", icon: FileText, color: COLOR, title: "Music Video Treatment", desc: "Director's vision document — concept, look, story arc, references, key shots.", tag: "Per video" },
  { href: "/dashboard/library/visual-production/music-video-brief", icon: ClipboardList, color: COLOR, title: "Music Video Production Brief", desc: "Artist + label brief to a director / production house. Deliverables, deadlines, budget envelope.", tag: "Per video" },
  { href: "/dashboard/library/visual-production/music-video-budget", icon: BarChart3, color: COLOR, title: "Music Video Budget", desc: "Crew, equipment, locations, talent, post-production. ZAR / NGN with VAT.", tag: "Calculator" },
  { href: "/dashboard/library/visual-production/music-video-call-sheet", icon: Calendar, color: COLOR, title: "Music Video Call Sheet", desc: "Industry-standard daily call sheet — crew, talent, locations, safety.", tag: "Per shoot day" },
  { href: "/dashboard/library/visual-production/cover-art-brief", icon: Palette, color: COLOR, title: "Cover Art Brief", desc: "Designer brief — concept, refs, palette, type, technical specs, rights, approvers.", tag: "Brief" },
  { href: "/dashboard/library/visual-production/cover-art-qc", icon: ImageIcon, color: COLOR, title: "Cover Art QC Checklist", desc: "3000×3000, RGB, no logos / URLs / explicit symbols. Prevents DSP rejection.", tag: "Checklist" },
  { href: "/dashboard/library/visual-production/vendor-database", icon: Database, color: COLOR, title: "Vendor Database", desc: "Your private rolodex — every photographer, DP, designer, editor, stylist you've worked with.", tag: "Database" },
];

export default function VisualProductionPage() {
  const [tab, setTab] = useState<Tab>("tools");
  const tabs = [
    { id: "guides" as const, label: "Guides" },
    { id: "forms" as const, label: "Forms & Releases" },
    { id: "tools" as const, label: "Production Tools" },
  ];
  const lists: Record<Tab, ResourceItem[]> = { guides: [], forms: FORMS, tools: TOOLS };

  return (
    <div className="animate-fade-in max-w-3xl">
      <ModuleShell
        color={COLOR}
        icon={<Video size={28} style={{ color: COLOR }} />}
        subtitle="Look the Part"
        title="Visual Production and Operation"
        description="Music videos, photography, design and the operations that ship them — treatments, briefs, budgets, call sheets, contracts, releases, and cover-art QC."
        meta={
          <>
            <span style={{ color: COLOR }} className="font-semibold">{FORMS.length} forms & releases</span>
            <span>·</span>
            <span style={{ color: COLOR }} className="font-semibold">{TOOLS.length} production tools</span>
          </>
        }
      >
        <ModuleTabs tabs={tabs} active={tab} onChange={setTab} />
        {lists[tab].length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center text-text-muted text-sm">Coming soon.</div>
        ) : (
          <div className="space-y-3">
            {lists[tab].map((item, i) => (
              <ResourceCard key={item.href} item={item} delay={i * 40} />
            ))}
          </div>
        )}
        {tab === "forms" && <Disclaimer kind="legal" />}
        {tab === "tools" && <Disclaimer kind="save" />}
      </ModuleShell>
    </div>
  );
}
