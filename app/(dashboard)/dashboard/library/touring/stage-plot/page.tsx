"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";

const COLOR = "#06B6D4";

function Accordion({ title, tag, children }: { title: string; tag?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass-card rounded-xl overflow-hidden mb-3">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left group">
        <div className="flex items-center gap-3">
          <p className="font-bold text-sm text-text-primary group-hover:text-brand transition-colors">{title}</p>
          {tag && <span className="text-[10px] font-black px-2 py-0.5 rounded hidden sm:inline" style={{ color: COLOR, backgroundColor: `${COLOR}15` }}>{tag}</span>}
        </div>
        <ChevronDown size={16} className={`text-text-muted transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`}/>
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-border pt-4 text-sm text-text-muted leading-relaxed space-y-3">
          {children}
        </div>
      )}
    </div>
  );
}

const EXAMPLE_INPUT_LIST = [
  { ch: 1, source: "Kick drum", mic: "House / Beta 52A", stand: "Short boom", monitor: "Mix 1 (drums)" },
  { ch: 2, source: "Snare drum", mic: "House / SM57", stand: "Short boom", monitor: "Mix 1 (drums)" },
  { ch: 3, source: "Hi-hat", mic: "House / SM81", stand: "Short boom", monitor: "Mix 1 (drums)" },
  { ch: 4, source: "Rack tom", mic: "House / SM57", stand: "Clip mount", monitor: "Mix 1 (drums)" },
  { ch: 5, source: "Floor tom", mic: "House / SM57", stand: "Clip mount", monitor: "Mix 1 (drums)" },
  { ch: 6, source: "Overhead L", mic: "House / KSM32", stand: "Tall boom", monitor: "Mix 1 (drums)" },
  { ch: 7, source: "Overhead R", mic: "House / KSM32", stand: "Tall boom", monitor: "Mix 1 (drums)" },
  { ch: 8, source: "Bass guitar", mic: "DI, direct out XLR", stand: "No stand", monitor: "Mix 2 (bass & keys)" },
  { ch: 9, source: "Electric guitar", mic: "House / SM57", stand: "Short boom", monitor: "Mix 3 (guitars)" },
  { ch: 10, source: "Keys L", mic: "Artist DI, 1/4\"", stand: "No stand", monitor: "Mix 2 (bass & keys)" },
  { ch: 11, source: "Keys R", mic: "Artist DI, 1/4\"", stand: "No stand", monitor: "Mix 2 (bass & keys)" },
  { ch: 12, source: "Lead vocal", mic: "Artist / Beta 58A", stand: "Tall straight", monitor: "All mixes" },
  { ch: 13, source: "BV / guitar vocal", mic: "House / SM58", stand: "Tall boom", monitor: "Mix 3 (guitars)" },
  { ch: 14, source: "BV / drum vocal", mic: "House / SM58", stand: "Tall boom", monitor: "Mix 1 (drums)" },
];

export default function StagePlotPage() {
  return (
    <div className="animate-fade-in max-w-3xl">
      <div className="flex items-center gap-2 text-xs text-text-muted mb-6">
        <Link href="/dashboard/library" className="hover:text-text-primary transition-colors">Toolkit</Link>
        <ChevronRight size={12}/>
        <Link href="/dashboard/library/touring" className="hover:text-text-primary transition-colors">Live: Bookings & Tours</Link>
        <ChevronRight size={12}/>
        <span className="text-text-primary">Stage Plot & Technical Input List</span>
      </div>

      <div className="glass-card rounded-2xl p-7 mb-8" style={{ borderColor: `${COLOR}25` }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: COLOR }}>Technical Documents · 2026 Edition</p>
        <h1 className="text-2xl font-black text-text-primary mb-1">Stage Plot & Technical Input List</h1>
        <p className="text-sm font-semibold mb-1" style={{ color: COLOR }}>The primary technical communication between your act and every venue.</p>
        <p className="text-sm text-text-muted">Your stage plot and input list answer two questions that every production person needs answered before you arrive: where does everything go, and what does it need to be connected to? Getting these documents right, and sending them early, is one of the clearest signals of professionalism available to an independent act.</p>
      </div>

      <Accordion title="What a Stage Plot Communicates" tag="Stage plot">
        <p>A stage plot is a top-down diagram of your stage setup. It maps the physical position of every performer, instrument, amplifier, monitor, microphone stand, and significant piece of equipment. Its purpose is to allow a production team to set up and cable a stage in your absence, and to identify logistical issues before load-in, not during it.</p>
        <div className="space-y-2 mt-2">
          {[
            { title: "It does not need to be a designed graphic", body: "A clear hand-drawn diagram, photographed and sent as a JPEG or PDF, communicates everything it needs to. Legibility matters; aesthetics do not." },
            { title: "Proportionality helps", body: "A rough sense of scale, where the drum kit sits relative to the stage edge, where the vocalist stands relative to the speakers, prevents placement errors on the day." },
            { title: "Label everything", body: "Every position on the plot must correspond to something on your input list. Use consistent naming between both documents so the engineer can cross-reference instantly." },
            { title: "Monitor positions are essential", body: "Specify where each wedge monitor should be placed and who it serves. Monitor mixes are built from this information, leaving it out causes delays and mix problems during soundcheck." },
            { title: "Digital tools are available", body: "Free and low-cost tools such as Stage Plot Pro and similar web-based applications can produce clean, professional diagrams. At a minimum, an editable PDF works well." },
          ].map(item => (
            <div key={item.title} className="pl-3 border-l-2" style={{ borderColor: `${COLOR}40` }}>
              <p className="font-semibold text-text-primary text-xs mb-1">{item.title}</p>
              <p>{item.body}</p>
            </div>
          ))}
        </div>
      </Accordion>

      <Accordion title="What an Input List Communicates" tag="Input list">
        <p>The input list is the technical specification of every signal that your performance requires. It is what the engineer uses to assign channels on the mixing console, confirm microphone availability, and plan the patch. It must match your stage plot exactly, if something is on the plot, it is on the input list, and vice versa.</p>
        <p>For each channel, provide:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
          {[
            { title: "Channel number", body: "In the order you want them patched on the desk." },
            { title: "Source name", body: "What is producing the signal, e.g., kick drum, lead vocal, acoustic guitar DI." },
            { title: "Microphone or DI type", body: "If you are supplying your own, e.g., Shure SM58, Beta 52, DI box." },
            { title: "Stand requirement", body: "Short boom, tall straight, clip mount, no stand." },
            { title: "Monitor send", body: "Which monitor mix does this source need to feed, use mix numbers consistently." },
          ].map(item => (
            <div key={item.title} className="rounded-lg p-3" style={{ backgroundColor: `${COLOR}08`, border: `1px solid ${COLOR}15` }}>
              <p className="text-xs font-black mb-1" style={{ color: COLOR }}>{item.title}</p>
              <p className="text-xs">{item.body}</p>
            </div>
          ))}
        </div>
      </Accordion>

      {/* Example Input List */}
      <div className="glass-card rounded-xl overflow-hidden mb-3">
        <div className="px-5 py-3 border-b border-border" style={{ backgroundColor: `${COLOR}08` }}>
          <p className="text-xs font-black uppercase tracking-wider" style={{ color: COLOR }}>Example Input List Format</p>
          <p className="text-xs text-text-muted mt-0.5">14-channel full band example, adapt for your configuration</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                {["Ch.", "Source", "Mic / DI", "Stand", "Monitor Mix"].map(h => (
                  <th key={h} className="px-3 py-2 text-left font-black uppercase tracking-wider text-text-muted text-[10px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {EXAMPLE_INPUT_LIST.map((row, i) => (
                <tr key={row.ch} className={`border-b border-border last:border-0 ${i % 2 === 1 ? "bg-surface-2" : ""}`}>
                  <td className="px-3 py-2 font-black" style={{ color: COLOR }}>{row.ch}</td>
                  <td className="px-3 py-2 font-semibold text-text-primary">{row.source}</td>
                  <td className="px-3 py-2 text-text-muted">{row.mic}</td>
                  <td className="px-3 py-2 text-text-muted">{row.stand}</td>
                  <td className="px-3 py-2 text-text-muted">{row.monitor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Accordion title="South African Context Notes" tag="SA context">
        <div className="space-y-3">
          {[
            { title: "'House' microphones vary widely", body: "Unlike larger international markets, South African venues, particularly clubs and mid-sized rooms, do not always stock the same standard microphone inventory. If your input list specifies house mics for critical sources, verify availability during your advance. Bring your own key microphones where quality is non-negotiable." },
            { title: "Load shedding and DI boxes", body: "Passive DI boxes (no power required) are more reliable than active DI boxes in venues where power may be interrupted. Note which DIs in your rig are passive versus active and advise the engineer accordingly." },
            { title: "Monitor provision in township and community venues", body: "Dedicated stage monitoring is not guaranteed in all performance environments. A line-level IEM (in-ear monitor) system for your critical performers significantly reduces dependency on house wedges and gives you consistent monitoring regardless of venue." },
            { title: "Send your rider in advance via WhatsApp", body: "WhatsApp is the dominant communication channel for South African production teams. Once you have an email or phone number, a follow-up WhatsApp message with your stage plot and input list as an image or PDF attachment is standard and expected." },
          ].map(item => (
            <div key={item.title} className="pl-3 border-l-2" style={{ borderColor: `${COLOR}40` }}>
              <p className="font-semibold text-text-primary text-xs mb-1">{item.title}</p>
              <p>{item.body}</p>
            </div>
          ))}
          <div className="rounded-lg p-3" style={{ backgroundColor: `${COLOR}08`, border: `1px solid ${COLOR}20` }}>
            <p className="text-xs">Update your stage plot and input list every time your live configuration changes. An outdated technical document creates unnecessary friction at load-in and reflects poorly on your preparation.</p>
          </div>
        </div>
      </Accordion>

      <div className="flex items-center justify-between mb-8 mt-6 flex-wrap gap-3">
        <Link href="/dashboard/library/touring" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors">
          <ChevronLeft size={15}/>Back to Live: Bookings & Tours
        </Link>
        <Link href="/dashboard/library/touring/promoter-agreement"
          className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-all"
          style={{ backgroundColor: `${COLOR}15`, color: COLOR }}>
          Next: Promoter Agreement<ChevronRight size={14}/>
        </Link>
      </div>
    </div>
  );
}
