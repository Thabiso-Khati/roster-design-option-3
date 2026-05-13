"use client";
import { Check } from "lucide-react";
import { ResourcePage, useLocalState } from "@/components/library/module-shell";
import { SaveButton } from "@/components/ui/save-button";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";

const COLOR = "#FB923C";
const STORAGE_KEY = "roster_bandcamp_day_v1";

interface Item { id: string; label: string; rule: string; }
interface Section { name: string; items: Item[]; }

const SECTIONS: Section[] = [
  {
    name: "What Bandcamp Day is",
    items: [
      { id: "wb-1", label: "First Friday of every month, Bandcamp waives revenue share for 24 hours", rule: "Artist receives ~93% of every dollar (vs ~82% standard) — meaningful uplift on D2C revenue" },
      { id: "wb-2", label: "Audience is intentional buyers — not casual streamers", rule: "Average Bandcamp Day spend per buyer 2-3x typical day; opportunity for catalogue + merch revenue" },
      { id: "wb-3", label: "Underused by African artists — clear opportunity for niche / cult fanbases", rule: "" },
    ],
  },
  {
    name: "T-14: Setup",
    items: [
      { id: "s14-1", label: "Bandcamp page artist profile + bio updated", rule: "Polished header image (recent press shot)" },
      { id: "s14-2", label: "Discography fully uploaded with high-quality WAV/FLAC + cover art", rule: "Lossless preferred; sells better" },
      { id: "s14-3", label: "Merch SKUs uploaded with photos + sizes + shipping rates", rule: "ZA-domestic + international shipping rates set" },
      { id: "s14-4", label: "Bundle products created (album + tee, EP + vinyl)", rule: "Bundles bump average order value 30-50%" },
      { id: "s14-5", label: "Discount tiers prepped (sale codes ready to activate on the day)", rule: "10-15% off for fan-list subscribers; 20% for Patreon-tier" },
    ],
  },
  {
    name: "T-7: Audience prep",
    items: [
      { id: "a7-1", label: "Email to fan list: 'Bandcamp Day is next Friday — here's what's new'", rule: "Subject line: 'Friday, Bandcamp waives the cut'" },
      { id: "a7-2", label: "Social tease: behind-the-scenes from the catalogue work", rule: "IG carousel + TikTok + X — frame as a fan-supported moment" },
      { id: "a7-3", label: "Discord / WhatsApp VIP tier sneak peek", rule: "Drop the discount codes 24h early" },
      { id: "a7-4", label: "Identify 1-2 unreleased / rare items for the day", rule: "Demo, alternate version, exclusive merch — raises conversion" },
    ],
  },
  {
    name: "T-1: Launch prep",
    items: [
      { id: "l1-1", label: "Reminder email scheduled for 6am local on Bandcamp Day", rule: "Subject: 'It's today — 24 hours only'" },
      { id: "l1-2", label: "Social post pre-scheduled for 8am, 12pm, 6pm, 9pm", rule: "Different angle each post: catalogue / fan-favourite / new release / final push" },
      { id: "l1-3", label: "Bandcamp DM ready for buyer follow-ups", rule: "Personal thank-you DMs 2-4h after purchase build long-term loyalty" },
      { id: "l1-4", label: "Stock + fulfilment confirmed — no overselling", rule: "Set inventory caps in Bandcamp where applicable" },
    ],
  },
  {
    name: "Day-of execution",
    items: [
      { id: "d-1", label: "6am: send launch email + first social post", rule: "" },
      { id: "d-2", label: "12pm: mid-day check — what's selling? promote that on socials", rule: "Real-time data should drive the second wave of posts" },
      { id: "d-3", label: "6pm: '6 hours left' reminder email + social", rule: "Urgency drives final-day conversions" },
      { id: "d-4", label: "9pm: '3 hours left' final push", rule: "Often 30-50% of day's revenue lands in the final 3 hours" },
      { id: "d-5", label: "Throughout: respond to comments + DMs personally", rule: "Bandcamp Day rewards human engagement" },
    ],
  },
  {
    name: "Day-after / Recovery",
    items: [
      { id: "r-1", label: "Thank-you email to all buyers within 48h", rule: "Reinforces relationship; drives repeat" },
      { id: "r-2", label: "Fulfilment timeline communicated", rule: "Underpromise; overdeliver — affects review sentiment" },
      { id: "r-3", label: "Sales debrief: total revenue, catalogue split, geographic mix", rule: "Track in Tour Merch Settlement / Annual P&L" },
      { id: "r-4", label: "Update mailing list — segment buyers vs non-buyers", rule: "Bandcamp Day buyers are highest-value segment" },
    ],
  },
];

export default function BandcampDayStrategyPage() {
  const [state, setState] = useLocalState<Record<string, boolean>>(STORAGE_KEY, {});
  useToolRestore("bandcamp-day-strategy", STORAGE_KEY, setState);
  const all = SECTIONS.flatMap((s) => s.items);
  const done = all.filter((i) => state[i.id]).length;
  const total = all.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <ResourcePage
      parentHref="/dashboard/library/merchandise"
      parentLabel="Back to Merchandise"
      color={COLOR}
      tag="Merch · Strategy"
      title="Bandcamp Day Strategy"
      intro="First Friday of every month, Bandcamp waives its revenue cut for 24 hours. The campaign blueprint to maximise D2C revenue."
      next={{ href: "/dashboard/library/merchandise/shopify-setup", label: "Shopify Setup Checklist" }}
    
      toolbar={<><SaveButton toolSlug="bandcamp-day-strategy" storageKey={STORAGE_KEY} title={`Bandcamp Day Strategy — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} /></>}>
      <div className="glass-card rounded-2xl p-6 mb-6" style={{ borderColor: `${COLOR}40` }}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-bold text-text-primary">{done} / {total} steps</p>
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
                <button key={it.id} onClick={() => setState({ ...state, [it.id]: !ok })}
                  className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-surface-2 text-left transition-colors">
                  <span className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: ok ? COLOR : "transparent", border: `1px solid ${ok ? COLOR : "var(--border)"}` }}>
                    {ok ? <Check size={12} color="white" /> : null}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm ${ok ? "text-text-muted line-through" : "text-text-primary"}`}>{it.label}</p>
                    <p className="text-[11px] text-text-muted mt-0.5">{it.rule}</p>
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
