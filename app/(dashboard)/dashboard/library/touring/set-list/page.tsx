"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";

const COLOR = "#EC4899";

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

export default function SetListPage() {
  return (
    <div className="animate-fade-in max-w-3xl">
      <div className="flex items-center gap-2 text-xs text-text-muted mb-6">
        <Link href="/dashboard/library" className="hover:text-text-primary transition-colors">Toolkit</Link>
        <ChevronRight size={12}/>
        <Link href="/dashboard/library/touring" className="hover:text-text-primary transition-colors">Live: Bookings & Tours</Link>
        <ChevronRight size={12}/>
        <span className="text-text-primary">Building Your Set List</span>
      </div>

      <div className="glass-card rounded-2xl p-7 mb-8" style={{ borderColor: `${COLOR}25` }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: COLOR }}>Performance Design · 2026 Edition</p>
        <h1 className="text-2xl font-black text-text-primary mb-1">Building Your Set List</h1>
        <p className="text-sm font-semibold mb-1" style={{ color: COLOR }}>A set list is not a playlist. It is a designed performance arc.</p>
        <p className="text-sm text-text-muted">A deliberate sequence of musical decisions that controls energy, emotion, and audience experience from the moment the first note lands to the last. The difference between an act that leaves people buzzing and one they forget by the time they hit the parking lot is almost always in how the set was constructed, not just how the songs were played.</p>
      </div>

      {/* Variables cards */}
      <div className="glass-card rounded-xl p-5 mb-6" style={{ borderColor: `${COLOR}20` }}>
        <p className="text-xs font-black uppercase tracking-wider mb-4" style={{ color: COLOR }}>The Variables You Are Managing</p>
        <p className="text-xs text-text-muted mb-4">Every song in your set affects the following dimensions simultaneously. Train yourself to hear and plan across all of them, not just melody and lyrics.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { v: "Audience", d: "Who is in the room, composition, expectations, energy level when they arrive." },
            { v: "Key relationships", d: "Moving between closely related keys feels natural. Abrupt changes create friction." },
            { v: "Tempo & groove", d: "Build peaks and valleys deliberately. Sustained high-tempo sets fatigue audiences." },
            { v: "Emotional register", d: "A set that stays in one emotional register for too long loses dimensionality." },
            { v: "Sonic texture", d: "Contrast in instrumentation and arrangement prevents the ear from switching off." },
            { v: "Transitions", d: "How you move between songs matters as much as the songs themselves. Dead air erodes momentum." },
            { v: "Voice management", d: "Plan around the physical demands of your voice. Build in songs that give your voice relative rest." },
          ].map(item => (
            <div key={item.v} className="rounded-lg p-3" style={{ backgroundColor: `${COLOR}08`, border: `1px solid ${COLOR}15` }}>
              <p className="text-xs font-black mb-1" style={{ color: COLOR }}>{item.v}</p>
              <p className="text-xs text-text-muted">{item.d}</p>
            </div>
          ))}
        </div>
      </div>

      <Accordion title="Structural Principles, Opening Strategy" tag="Opening">
        <div className="space-y-3">
          {[
            { title: "Technical calibration", body: "The opening song is a technical calibration moment as much as a performance one, give your sound engineer space to lock in levels before unleashing your most demanding material." },
            { title: "Your centrepiece opener belongs second", body: "By then the room has settled, the sound is dialled, and the audience has relaxed into the experience." },
            { title: "Lead with energy and commitment", body: "Hesitation at the top of a set is visible and it telegraphs uncertainty to the room." },
            { title: "Read the room", body: "The venue environment is a co-author of the mood you can realistically create, a small, low-ceiling room responds to intimacy; a large outdoor stage responds to scale." },
          ].map(item => (
            <div key={item.title} className="pl-3 border-l-2" style={{ borderColor: `${COLOR}40` }}>
              <p className="font-semibold text-text-primary text-xs mb-1">{item.title}</p>
              <p>{item.body}</p>
            </div>
          ))}
        </div>
      </Accordion>

      <Accordion title="Structural Principles, Middle Section" tag="Middle">
        <div className="space-y-3">
          {[
            { title: "Deepen the relationship", body: "The middle of a set is where you deepen the audience relationship. This is where covers, stories, crowd interaction, and slower material create contrast and connection." },
            { title: "Plan what you will say between songs", body: "Ad-libbed banter can work, but rehearsed storytelling that ties your songs to real experiences is what moves people from spectators to participants." },
            { title: "Genuine audience interaction", body: "Not performative call-and-response, but actual acknowledgement of who is in the room, builds loyalty that outlasts the show." },
            { title: "Diversification within a consistent identity", body: "Even if your catalogue spans styles, the set should feel like one coherent voice across its full length." },
          ].map(item => (
            <div key={item.title} className="pl-3 border-l-2" style={{ borderColor: `${COLOR}40` }}>
              <p className="font-semibold text-text-primary text-xs mb-1">{item.title}</p>
              <p>{item.body}</p>
            </div>
          ))}
        </div>
      </Accordion>

      <Accordion title="Structural Principles, Closing Strategy" tag="Closing">
        <div className="space-y-3">
          <p>The final song is your last word in the room. It must earn its place. Whether it is a slow, resonant closer or a euphoric peak, it should leave the audience with a clear emotional imprint.</p>
          <p>Everything in a set that seems incidental, the walk-off, the between-song pacing, the encore structure, is perceived and processed by an audience. Plan it as deliberately as the music.</p>
          <div className="rounded-lg p-3" style={{ backgroundColor: `${COLOR}08`, border: `1px solid ${COLOR}20` }}>
            <p className="text-xs font-black mb-1" style={{ color: COLOR }}>Unpredictability vs. unpreparedness</p>
            <p className="text-xs">Unpredictability is not the same as unpreparedness. The distinction is clear to any experienced audience.</p>
          </div>
        </div>
      </Accordion>

      <Accordion title="South African & African Context" tag="SA context">
        <div className="space-y-3">
          {[
            { title: "Audience heterogeneity", body: "South African audiences at many venues span multiple linguistic and cultural backgrounds simultaneously. Musical choices that acknowledge this breadth, whether through language, genre reference, or structural familiarity, deepen the room's sense of ownership over the performance." },
            { title: "Language as an instrument", body: "A single Zulu, Sesotho, Xhosa, or Afrikaans phrase at the right moment in a set can shift the entire temperature of a room. Consider this as a compositional tool, not an afterthought." },
            { title: "Genre context", body: "Afrobeats, Amapiano, and their derivatives carry rhythmic expectations in their audience that are as precise as any classical form. If you are working adjacent to these genres, understand the vocabulary before you improvise with it." },
            { title: "Load shedding contingency", body: "Have an acoustic or minimal-production alternative for at least two songs in your set. Backup power failures happen. The act that can hold a room without the full rig is the act that earns respect." },
          ].map(item => (
            <div key={item.title} className="pl-3 border-l-2" style={{ borderColor: `${COLOR}40` }}>
              <p className="font-semibold text-text-primary text-xs mb-1">{item.title}</p>
              <p>{item.body}</p>
            </div>
          ))}
          <div className="rounded-lg p-3" style={{ backgroundColor: `${COLOR}08`, border: `1px solid ${COLOR}20` }}>
            <p className="text-xs">Study live recordings of performances in your genre with the same critical attention you bring to recorded output. The set list is always a draft until it has been tested in a real room.</p>
          </div>
        </div>
      </Accordion>

      <div className="glass-card rounded-xl p-4 my-8 flex items-start gap-3" style={{ borderColor: "rgba(201,168,76,0.15)", backgroundColor: "rgba(201,168,76,0.04)" }}>
        <span className="text-base flex-shrink-0">📋</span>
        <p className="text-xs text-text-muted leading-relaxed">Use the <span className="font-semibold text-brand">Run Sheet tool</span> in the Work Tools tab to map out your show timeline, from load-in to load-out, cue by cue.</p>
      </div>

      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <Link href="/dashboard/library/touring" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors">
          <ChevronLeft size={15}/>Back to Live: Bookings & Tours
        </Link>
        <Link href="/dashboard/library/touring/stage-plot"
          className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-all"
          style={{ backgroundColor: `${COLOR}15`, color: COLOR }}>
          Next: Stage Plot & Input List<ChevronRight size={14}/>
        </Link>
      </div>
    </div>
  );
}
