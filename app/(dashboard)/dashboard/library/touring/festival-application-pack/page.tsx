"use client";
import { Check } from "lucide-react";
import { ResourcePage, useLocalState } from "@/components/library/module-shell";
import Link from "next/link";
import { SaveButton } from "@/components/ui/save-button";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";

const COLOR = "#F59E0B";
const STORAGE_KEY = "roster_festival_app_pack_v1";

interface Item { id: string; label: string; rule: string; href?: string; }
interface Section { name: string; items: Item[]; }

const SECTIONS: Section[] = [
  {
    name: "Music materials",
    items: [
      { id: "studio-mp3", label: "3–5 highest-streaming tracks (320kbps MP3 + WAV)", rule: "Festivals shortlist on first 30 sec — sequence the strongest first" },
      { id: "live-recordings", label: "2× live recordings (audio or full-show video)", rule: "Live performance evidence is the single biggest signal" },
      { id: "stems", label: "Stems for 1× track (in case of broadcast use)", rule: "BBC, SABC, regional festivals" },
    ],
  },
  {
    name: "Visual materials",
    items: [
      { id: "press-photos", label: "3× hi-res press photos (300 DPI, 3000×2000+, JPG + RAW)", rule: "Horizontal + vertical orientations", href: "/dashboard/library/marketing/one-sheet" },
      { id: "live-photos", label: "5× live performance photos (recent, no logos in frame)", rule: "" },
      { id: "music-videos", label: "Recent music videos (links to Vevo / YouTube + downloadable masters on request)", rule: "" },
      { id: "logo", label: "Artist logo / lockup in PNG (transparent) + vector (SVG/AI)", rule: "" },
    ],
  },
  {
    name: "Documents",
    items: [
      { id: "epk", label: "EPK (one-sheet PDF)", rule: "", href: "/dashboard/library/marketing/one-sheet" },
      { id: "bio", label: "3 bios — 50 word, 100 word, 250 word", rule: "Different copy for stage screen vs. festival programme" },
      { id: "rider-tech", label: "Performance / technical rider", rule: "", href: "/dashboard/library/touring/performance-rider" },
      { id: "rider-hosp", label: "Hospitality rider", rule: "", href: "/dashboard/library/touring/hospitality-rider" },
      { id: "stage-plot", label: "Stage plot + input list + patch sheet", rule: "", href: "/dashboard/library/touring/stage-plot" },
      { id: "set-list", label: "Sample set list (length-customised options: 30 / 45 / 60 / 75 min)", rule: "", href: "/dashboard/library/touring/set-list" },
      { id: "video-reel", label: "3-min sizzle reel (live cuts + best video moments)", rule: "Most festivals make first cut on this alone" },
    ],
  },
  {
    name: "Logistics",
    items: [
      { id: "fee-quote", label: "Performance fee + buyout options (with sound/light included or excluded)", rule: "" },
      { id: "availability", label: "Availability matrix — confirmed dates / holds / hard blocks", rule: "" },
      { id: "travel-cost", label: "Travel costs estimate (flights, ground, hotel for full party)", rule: "Often a separate budget line" },
      { id: "visa-status", label: "Visa status of the travelling party for likely festival territories", rule: "", href: "/dashboard/library/touring/visa-travel-checklist" },
      { id: "carnet", label: "ATA Carnet status for international gear (if needed)", rule: "" },
      { id: "insurance", label: "Public liability insurance certificate (festivals require)", rule: "" },
    ],
  },
  {
    name: "Press & momentum proof",
    items: [
      { id: "press-clips", label: "Recent press features / reviews (links + PDF clippings)", rule: "" },
      { id: "streaming-stats", label: "Verified streaming stats (Spotify monthly listeners, YT views, Audiomack MAU)", rule: "Pull from Artist Audience Report; never invent numbers" },
      { id: "tour-history", label: "Recent tour history with crowd sizes (verifiable)", rule: "Only verified — cancellations / no-shows kill bookings" },
      { id: "playlists", label: "Notable playlist placements (with playlist URL + size)", rule: "" },
      { id: "agent", label: "Booking agent / management contact", rule: "Festival programmer goes through here, not direct" },
    ],
  },
  {
    name: "Submission process",
    items: [
      { id: "deadline", label: "Submission deadline tracked + 7-day pre-deadline reminder set", rule: "" },
      { id: "format", label: "Submission format confirmed (Sonicbids / Submithub / direct email / festival portal)", rule: "" },
      { id: "follow-up", label: "Follow-up cadence: 4-week, 8-week, 12-week", rule: "Most festivals don't reply on first round" },
      { id: "contracts", label: "Contract template ready for offer-acceptance turnaround (48 hr typical)", rule: "" },
    ],
  },
];

export default function FestivalApplicationPackPage() {
  const [state, setState] = useLocalState<Record<string, boolean>>(STORAGE_KEY, {});
  useToolRestore("festival-application-pack", STORAGE_KEY, setState);
  const all = SECTIONS.flatMap((s) => s.items);
  const done = all.filter((i) => state[i.id]).length;
  const total = all.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <ResourcePage
      parentHref="/dashboard/library/touring"
      parentLabel="Back to Live, Touring & Festivals"
      color={COLOR}
      tag="Live · Festival Pack"
      title="Festival Application Pack"
      intro="The 30-item bundle that goes with every festival pitch. Build it once, use it everywhere. Update twice a year."
      next={{ href: "/dashboard/library/touring/visa-travel-checklist", label: "Visa & Travel Checklist" }}
    
      toolbar={<><SaveButton toolSlug="festival-application-pack" storageKey={STORAGE_KEY} title={`Festival Application Pack — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} /></>}>
      <div className="glass-card rounded-2xl p-6 mb-6" style={{ borderColor: `${COLOR}40` }}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-bold text-text-primary">{done} / {total} ready</p>
          <p className="text-2xl font-black" style={{ color: COLOR }}>{pct}%</p>
        </div>
        <div className="w-full bg-surface-2 rounded-full h-2 overflow-hidden">
          <div className="h-full transition-all" style={{ width: `${pct}%`, backgroundColor: COLOR }} />
        </div>
      </div>
      {SECTIONS.map((sec) => (
        <section key={sec.name} className="glass-card rounded-2xl p-6 mb-4">
          <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>{sec.name}</p>
          <div className="space-y-2">
            {sec.items.map((it) => {
              const ok = !!state[it.id];
              return (
                <button key={it.id} onClick={() => setState({ ...state, [it.id]: !ok })} className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-surface-2 text-left transition-colors">
                  <span className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: ok ? COLOR : "transparent", border: `1px solid ${ok ? COLOR : "var(--border)"}` }}>
                    {ok ? <Check size={12} color="white" /> : null}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm ${ok ? "text-text-muted line-through" : "text-text-primary"}`}>{it.label}</p>
                    {it.rule && <p className="text-[11px] text-text-muted mt-0.5">{it.rule}</p>}
                    {it.href && <Link href={it.href} className="text-[11px] mt-0.5 inline-block" style={{ color: COLOR }}>→ Open</Link>}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </ResourcePage>
  );
}
