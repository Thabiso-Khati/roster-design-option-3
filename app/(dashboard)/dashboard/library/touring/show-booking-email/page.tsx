"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ChevronDown, Copy, Check } from "lucide-react";

const COLOR = "#8B5CF6";

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

function CopyableTemplate() {
  const [copied, setCopied] = useState(false);
  const template = `Subject: [ACT NAME] | [CITY] | [DATE] | Supported [Notable Act]

Hi [Booker Name],

My name is [Your Name], and I manage [Artist Name], a [genre] act based in [city].

I'm reaching out to propose a [support / headline / co-billing] slot at [Venue Name] on [specific date]. This forms part of a [route / run / regional tour] we're building across [list of cities].

What we bring:
• Live show: [brief, specific description of what the performance looks and feels like, instrumentation, duration, energy]
• Live footage: [single link to your strongest live recording]
• Credibility: [2–3 specific, factual points, notable supports, festival appearances, streaming milestones, press]
• Local audience: [what you can demonstrably draw in their market, numbers, platforms, previous shows]

We're flexible on the exact date if [target date] doesn't work, [alternative date] is also available.

I've attached our stage plot and input list. Full tech rider and EPK available on request.

Look forward to hearing from you.

[Your Name]
[Your title / role]
[Mobile, WhatsApp-enabled]
[Email]
[Website / EPK link]
[Streaming link]`;

  const copy = () => {
    navigator.clipboard.writeText(template).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="glass-card rounded-xl overflow-hidden mb-6" style={{ borderColor: `${COLOR}25` }}>
      <div className="px-5 py-3 flex items-center justify-between border-b border-border" style={{ backgroundColor: `${COLOR}08` }}>
        <div>
          <p className="text-xs font-black uppercase tracking-wider" style={{ color: COLOR }}>Booking Outreach Email Template</p>
          <p className="text-xs text-text-muted mt-0.5">Customise for every contact, never send a template untouched</p>
        </div>
        <button onClick={copy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border"
          style={{ borderColor: `${COLOR}30`, color: copied ? "#10B981" : COLOR, backgroundColor: copied ? "rgba(16,185,129,0.08)" : `${COLOR}08` }}>
          {copied ? <Check size={12}/> : <Copy size={12}/>}
          {copied ? "Copied!" : "Copy template"}
        </button>
      </div>
      <pre className="px-5 py-4 text-xs text-text-muted leading-relaxed whitespace-pre-wrap font-mono overflow-x-auto">
        {template}
      </pre>
    </div>
  );
}

export default function ShowBookingEmailPage() {
  return (
    <div className="animate-fade-in max-w-3xl">
      <div className="flex items-center gap-2 text-xs text-text-muted mb-6">
        <Link href="/dashboard/library" className="hover:text-text-primary transition-colors">Toolkit</Link>
        <ChevronRight size={12}/>
        <Link href="/dashboard/library/touring" className="hover:text-text-primary transition-colors">Live: Bookings & Tours</Link>
        <ChevronRight size={12}/>
        <span className="text-text-primary">Show Booking Email Guide</span>
      </div>

      <div className="glass-card rounded-2xl p-7 mb-8" style={{ borderColor: `${COLOR}25` }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: COLOR }}>Outreach Guide · Templates · 2026 Edition</p>
        <h1 className="text-2xl font-black text-text-primary mb-1">Show Booking Email Guide</h1>
        <p className="text-sm font-semibold mb-1" style={{ color: COLOR }}>Every booking enquiry you send is a sales pitch.</p>
        <p className="text-sm text-text-muted">The person receiving it is a decision-maker with limited time, a full inbox, and a commercial interest in whether your act is worth a slot on their calendar. This guide covers what to do before you write, what your email must contain, and every mistake that gets it deleted.</p>
      </div>

      {/* Subject line formula */}
      <div className="glass-card rounded-xl p-5 mb-6" style={{ borderColor: `${COLOR}20` }}>
        <p className="text-xs font-black uppercase tracking-wider mb-3" style={{ color: COLOR }}>Subject Line Formula</p>
        <div className="rounded-lg p-4 text-center font-mono text-sm" style={{ backgroundColor: `${COLOR}08`, border: `1px solid ${COLOR}20` }}>
          <span style={{ color: COLOR }} className="font-bold">[ACT NAME]</span>
          <span className="text-text-muted"> | </span>
          <span style={{ color: "#F59E0B" }} className="font-bold">[CITY]</span>
          <span className="text-text-muted"> | </span>
          <span style={{ color: "#10B981" }} className="font-bold">[DATE]</span>
          <span className="text-text-muted"> | Supported </span>
          <span style={{ color: "#EC4899" }} className="font-bold">[Notable Act]</span>
        </div>
        <p className="text-xs text-text-muted mt-3">Pack it with the information a booker needs to triage their inbox. Do not use urgency language, it reads as amateur and in some contexts comes across as aggressive.</p>
      </div>

      <Accordion title="Before You Write Anything, 5 Pre-Write Checks" tag="Must do first">
        <p>Five things to resolve before your fingers hit the keyboard:</p>
        <div className="space-y-3 mt-1">
          {[
            { n: 1, title: "Research the contact first", body: "Visit the venue's website, social media, and Quicket / Howler event listings. Know what kind of shows they book, what night you are pitching, and whether something is already running on that date. Pitching blind signals that you have not done your homework, and bookers notice immediately." },
            { n: 2, title: "You are pitching a commercial proposition", body: "The booker's primary concern is not whether your music is good, it is whether your act translates into a room full of people who spend money. Frame everything through that lens. What does bringing you in do for their venue, their night, their revenue?" },
            { n: 3, title: "Know your market position honestly", body: "Drawing 200 people in one city and 40 in the next is normal. What matters is that you know your numbers and communicate them accurately. Inflated claims unravel quickly; honest numbers with context are far more credible." },
            { n: 4, title: "Relationships unlock doors that emails cannot", body: "In the South African live music ecosystem, and across African markets, personal referrals and community positioning matter enormously. Being known through other artists, promoters, or music industry networks shortens the trust-building process significantly. Network actively, not transactionally." },
            { n: 5, title: "Do not overstate, do not understate", body: "Both are forms of dishonesty and both undermine trust. Present your act as it actually is, with the best evidence available." },
          ].map(item => (
            <div key={item.n} className="flex gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5"
                style={{ backgroundColor: `${COLOR}20`, color: COLOR }}>{item.n}</div>
              <div>
                <p className="font-semibold text-text-primary text-xs mb-1">{item.title}</p>
                <p>{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </Accordion>

      <Accordion title="What Your Email Must Contain, 5 Requirements" tag="Email structure">
        <p>Keep it tight. A booker who has to scroll to find the point has already disengaged. Lead with the most important information and make the structure scannable.</p>
        <div className="space-y-3 mt-2">
          {[
            { n: 1, title: "Proposed date(s) and routing context", body: "Lead with the specific date you want. If this is part of a broader tour, include the route, it signals planning and makes your pitch easier to place within their calendar. If your preferred date is taken, indicate flexibility to be considered for an alternative." },
            { n: 2, title: "What the package is", body: "Describe the live performance, genre, duration, band configuration, the tone and energy of your show. Be specific enough that they can picture it in their room. Generic descriptions ('great vibes', 'incredible live show') carry no information and waste their time." },
            { n: 3, title: "Visual proof", body: "Link to the single strongest live performance footage you have. One link only. No file attachments. The footage must have good audio, a phone video shot from the back of a room with distorted sound actively works against you." },
            { n: 4, title: "Credibility signals", body: "A short, factual point-form bio covering notable past performances, support slots, festival appearances, press coverage, playlist placements, or streaming milestones. Link to your EPK or website if it consolidates this information cleanly." },
            { n: 5, title: "Audience proof for their specific market", body: "Tell them how many people you can demonstrably draw in their city or region. Reference recent show attendance figures, local streaming numbers, or city-specific follower counts. If you have played that market before, lead with it. If you have not, say so directly." },
          ].map(item => (
            <div key={item.n} className="flex gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5"
                style={{ backgroundColor: `${COLOR}20`, color: COLOR }}>{item.n}</div>
              <div>
                <p className="font-semibold text-text-primary text-xs mb-1">{item.title}</p>
                <p>{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </Accordion>

      <Accordion title="If You Have No Track Record in That Market" tag="New markets">
        <p>No following in a new city is not a disqualifying condition, it is simply a different pitch. Be direct: state that you are establishing a presence in this market, share the strongest available evidence of what you do (your best recording or footage), and make it clear you understand what this engagement is about.</p>
        <p>Bookers add new acts to existing bills all the time. What they cannot work with is vagueness. A clean, honest pitch for a support slot from an unknown act almost always outperforms an oversold pitch from the same act.</p>
        <p>When referencing past performances in other markets, be specific: name the venue, the city, the approximate turnout, and merchandise revenue where relevant. Specificity communicates professionalism and makes the information usable.</p>
      </Accordion>

      <Accordion title="Follow-Up Protocol" tag="After sending">
        <p>Send your initial outreach and set a calendar reminder to follow up exactly one week later if no response has arrived. Your follow-up should be a single sentence acknowledging your previous message and asking whether they received it, nothing more.</p>
        <p>As your routing develops, send brief updates to contacts you are still trying to lock in, showing the tour is taking shape and the date you want is still available.</p>
        <div className="rounded-lg p-3 mt-2" style={{ backgroundColor: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
          <p className="text-xs font-black mb-1 text-red-400">The threshold rule</p>
          <p className="text-xs">Three to four unanswered messages is the threshold at which most bookers have communicated their answer implicitly. Redirect that energy to the next contact. Persistence and harassment are not the same thing, know the boundary.</p>
        </div>
      </Accordion>

      <Accordion title="What Will Get Your Email Deleted Instantly" tag="Avoid these">
        <div className="space-y-2">
          {[
            { mistake: "Getting the name wrong", detail: "The contact's name, the venue name, the festival name. Any of these, get it wrong and the email goes in the bin. In copy-paste campaigns, this is the most common and most damaging error." },
            { mistake: "Template contamination", detail: "When sending the same base email across multiple contacts, always verify that venue names, dates, and city references are correct for each recipient. Sending a venue in Pretoria an email that references Durban is a quick way to end that relationship before it begins." },
            { mistake: "Overly casual tone", detail: "This is a professional business communication. A booker does not need your personality in the first email, they need your information, your evidence, and your ask." },
            { mistake: "Attachments", detail: "Links only. Attachments increase spam filter probability, slow down loading, and irritate recipients. A single link to your strongest material is always more effective." },
            { mistake: "WhatsApp cold pitching without permission", detail: "In South Africa and across Africa, WhatsApp is a primary business channel, but unsolicited booking pitches via WhatsApp are invasive. Use it only once you have an established relationship or explicit permission. Email first." },
          ].map(item => (
            <div key={item.mistake} className="flex gap-2 pl-3 border-l-2 border-red-500/30">
              <div>
                <p className="font-semibold text-red-400 text-xs mb-0.5">{item.mistake}</p>
                <p>{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-lg p-3 mt-3" style={{ backgroundColor: `${COLOR}08`, border: `1px solid ${COLOR}20` }}>
          <p className="text-xs">Booking relationships are long-term assets. A booker who does not take your act this cycle may programme you next year. Every interaction is part of that accumulation.</p>
        </div>
      </Accordion>

      {/* Template */}
      <div className="mt-6">
        <p className="text-xs font-black uppercase tracking-wider mb-3" style={{ color: COLOR }}>Booking Outreach Email Template</p>
        <CopyableTemplate/>
      </div>

      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <Link href="/dashboard/library/touring" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors">
          <ChevronLeft size={15}/>Back to Live: Bookings & Tours
        </Link>
        <Link href="/dashboard/library/touring/set-list"
          className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-all"
          style={{ backgroundColor: `${COLOR}15`, color: COLOR }}>
          Next: Building Your Set List<ChevronRight size={14}/>
        </Link>
      </div>
    </div>
  );
}
