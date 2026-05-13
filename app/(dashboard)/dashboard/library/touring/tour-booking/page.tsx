"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { useLocale } from "@/context/locale-context";
import { getCountryResources } from "@/lib/country-resources";

const COLOR = "#F59E0B";

type Section = {
  id: string;
  title: string;
  tag?: string;
  content: React.ReactNode;
};

function Accordion({ section }: { section: Section }) {
  const [open, setOpen] = useState(false);
  return (
    <div id={section.id} className="glass-card rounded-xl overflow-hidden mb-3">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left group">
        <div className="flex items-center gap-3">
          <p className="font-bold text-sm text-text-primary group-hover:text-brand transition-colors">{section.title}</p>
          {section.tag && (
            <span className="text-[10px] font-black px-2 py-0.5 rounded hidden sm:inline"
              style={{ color: COLOR, backgroundColor: `${COLOR}15` }}>{section.tag}</span>
          )}
        </div>
        <ChevronDown size={16} className={`text-text-muted transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`}/>
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-border pt-4 text-sm text-text-muted leading-relaxed space-y-3">
          {section.content}
        </div>
      )}
    </div>
  );
}

const SECTIONS: Section[] = [
  {
    id: "why",
    title: "Why You Tour, And What It Actually Costs",
    tag: "Foundation",
    content: (
      <>
        <p>Most artists at the beginning of their live career will spend more than they earn on their first significant tour. This is normal and not a failure, it is the cost of market entry. The return on that investment is measured in audience reach, territorial credibility, performance quality, and the professional relationships formed along the way.</p>
        <p>Managers, promoters, booking agents, and labels all pay close attention to touring activity, an artist who routes consistently signals that they take their career seriously.</p>
        <p className="font-semibold text-text-primary">Touring is not a reward for making an album, it is a primary commercial and audience-building mechanism that runs in parallel with recorded output.</p>
      </>
    ),
  },
  {
    id: "pathways",
    title: "Performance Pathways Before Touring",
    tag: "Pre-tour",
    content: (
      <>
        <p>A full tour is not always the right first move. Sustained local performance activity builds the foundation that makes a tour viable.</p>
        <div className="space-y-3 mt-2">
          {[
            { title: "Local residency", body: "A regular monthly or bi-monthly slot at a consistent local venue builds a reliable local following, provides a known income stream, and keeps your live performance sharp. Local fans are your most dedicated advocates and are often the foundation of viable touring in surrounding regions." },
            { title: "Corporate and private event work", body: "Function bookings, corporate entertainment, and private event work can generate significantly higher per-show fees than club gigs, particularly in Johannesburg and Cape Town. Event management companies, corporate entertainment agencies, and direct relationships with event planners are the primary access routes." },
            { title: "Industry showcases", body: "Organisations such as RISA, SXSW Africa equivalents, Bushfire Festival (eSwatini), and various provincial music development bodies offer showcase opportunities that put you in front of industry decision-makers. These are not income gigs, they are relationship-building and visibility opportunities." },
            { title: "Festival support and co-billing", body: "Approaching established acts for support slots or co-billing arrangements is one of the fastest ways to access their existing audience base. Relationships with other artists are among the most valuable assets in your network, cultivate them deliberately." },
          ].map(item => (
            <div key={item.title} className="pl-3 border-l-2" style={{ borderColor: `${COLOR}40` }}>
              <p className="font-semibold text-text-primary text-xs mb-1">{item.title}</p>
              <p>{item.body}</p>
            </div>
          ))}
        </div>
      </>
    ),
  },
  {
    id: "step1",
    title: "Step 1, Intelligence Gathering",
    tag: "Step 1 of 5",
    content: (
      <>
        <p>Build a live contact directory before you write a single outreach email. This document will become one of your most valuable operational assets. Structure it by city or region, and capture the following for each entry: venue name, venue capacity, booker / talent buyer name, email address, website booking submission link (if used), your target dates for that location, and any notes on genre fit or prior contact history.</p>
        <ul className="space-y-2 mt-2">
          {[
            "Research acts in your genre and audit where they have performed. Quicket event listings, Howler, Facebook Events, and venue social media pages are all useful primary sources for understanding what a venue books.",
            "Leverage your existing network, ask artists you know where they have had good experiences. Venue recommendations from trusted peers carry more weight than cold directory research.",
            "Keep the document live and current, update it with every response, name you learn, and relationship you build. The more populated this database becomes over time, the more efficient every subsequent booking campaign will be.",
          ].map((item, i) => (
            <li key={i} className="flex gap-2"><span style={{ color: COLOR }} className="font-black flex-shrink-0">→</span><span>{item}</span></li>
          ))}
        </ul>
      </>
    ),
  },
  {
    id: "step2",
    title: "Step 2, Audience Intelligence",
    tag: "Step 2 of 5",
    content: (
      <>
        <p>Before you commit to a routing, understand where your existing audience actually is. Data-driven routing avoids the costly mistake of booking cities where you have no following and bypassing cities where your audience is waiting.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          {[
            { platform: "Spotify for Artists", detail: "City-level streaming data shows you where listeners are located. Cross-reference this against your planned routing." },
            { platform: "Meta / Instagram Insights", detail: "City and country breakdowns of your followers and engaged audience are available natively in the app. Pull these numbers before finalising your routing." },
            { platform: "Quicket / Howler", detail: "If you have sold tickets previously through these platforms, buyer location data can be requested or viewed in your dashboard." },
            { platform: "WhatsApp list geography", detail: "City-specific WhatsApp broadcast lists are direct indicators of where your most engaged fans are located." },
          ].map(item => (
            <div key={item.platform} className="rounded-lg p-3" style={{ backgroundColor: `${COLOR}08`, border: `1px solid ${COLOR}20` }}>
              <p className="text-xs font-black mb-1" style={{ color: COLOR }}>{item.platform}</p>
              <p className="text-xs">{item.detail}</p>
            </div>
          ))}
        </div>
      </>
    ),
  },
  {
    id: "step3",
    title: "Step 3, Routing Strategy",
    tag: "Step 3 of 5",
    content: (
      <>
        <p>A tour route is an operational plan, not just a list of cities. Draft your geographic sequence before you contact any venue, it shapes every conversation you then have about dates and availability.</p>
        <ul className="space-y-2 mt-2">
          {[
            { point: "Route geographically, not chronologically", detail: "Commit first to the geographic logic of the run, which cities, in which sequence, and then fill in dates. Venues confirmed in the wrong order create expensive and exhausting travel patterns." },
            { point: "Lead times matter", detail: "For venues of 50–500 capacity, approach 2–4 months before your target date. For larger venues or festival slots, 6–12 months in advance is the standard." },
            { point: "Check Google Maps drive times", detail: "South African distances are significant. A Johannesburg–Cape Town overland drive is roughly 14 hours. Build genuine rest and travel time into the schedule." },
            { point: "Aim for 4–5 shows per week", detail: "Fewer shows per week reduces your chances of breaking even or generating positive cash flow. More than 5 consecutive nights without a rest day creates a vocal degradation risk." },
            { point: "Build in contingency days", detail: "Load shedding, vehicle breakdowns, and weather events all affect travel. A schedule with no slack is a schedule that falls apart under the first disruption." },
          ].map((item, i) => (
            <div key={i} className="pl-3 border-l-2" style={{ borderColor: `${COLOR}40` }}>
              <p className="font-semibold text-text-primary text-xs mb-1">{item.point}</p>
              <p>{item.detail}</p>
            </div>
          ))}
        </ul>
      </>
    ),
  },
  {
    id: "step4",
    title: "Step 4, Outreach and Booking",
    tag: "Step 4 of 5",
    content: (
      <>
        <p>Refer to the Show Booking Email Guide (in this module's Forms & Templates tab) for the full outreach methodology. In brief:</p>
        <ul className="space-y-2 mt-2">
          {[
            "Lead with your strongest evidence, live footage, attendance figures, streaming data, notable support slots or co-headlines.",
            "Pitch the specific date you want, and make it clear you have an alternative if that date is not available.",
            "Follow up once per week for 3–4 cycles, if there is no response after that window, redirect the effort to the next contact on your list.",
            "Keep a record of every interaction, in your contact directory, note every email sent, every response received, and every offer made or declined. This history compounds into intelligence over time.",
          ].map((item, i) => (
            <li key={i} className="flex gap-2"><span style={{ color: COLOR }} className="font-black flex-shrink-0">→</span><span>{item}</span></li>
          ))}
        </ul>
      </>
    ),
  },
  {
    id: "step5",
    title: "Step 5, Advancing the Show",
    tag: "Step 5 of 5",
    content: (
      <>
        <p>Once a date is confirmed, the advance process begins. This is the pre-show operational conversation with the venue or promoter that resolves every logistical question before load-in day. Do not leave advance questions to the day of the show.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
          {[
            { item: "Load-in & soundcheck times", detail: "Confirm at least one week out and reconfirm 48 hours before the show." },
            { item: "Technical provision", detail: "Confirm what the venue provides and what you bring. Send your stage plot and input list the moment the show is confirmed." },
            { item: "Accommodation & buyout", detail: "Establish whether the venue or promoter provides accommodation or a cash buyout in lieu." },
            { item: "Guest list", detail: "Agree on your allocation and submit it the day before the show, not on the night." },
            { item: "Settlement process", detail: "Confirm how and when you will be paid, and who handles the settlement conversation. Resolve this in advance, not at midnight after the show." },
            { item: "Load shedding schedule", detail: "Check EskomSePush for the venue city and share the schedule with your production contact. Confirm the venue's backup power provision." },
          ].map(item => (
            <div key={item.item} className="rounded-lg p-3" style={{ backgroundColor: `${COLOR}08`, border: `1px solid ${COLOR}15` }}>
              <p className="text-xs font-black mb-1" style={{ color: COLOR }}>{item.item}</p>
              <p className="text-xs">{item.detail}</p>
            </div>
          ))}
        </div>
      </>
    ),
  },
  {
    id: "newmarket",
    title: "Entering New Markets Without a Track Record",
    tag: "New markets",
    content: (
      <>
        <p>Carrying no documented audience history in a particular city is not a barrier to booking, it simply defines the type of opportunity you are eligible for. New market entry starts with support slots, not headlines.</p>
        <p>Present your strongest available evidence of what you do and be transparent about where you are in your development. A compelling 20-minute support set in front of 300 people who have never heard of you is worth more than a headline slot in front of 40.</p>
        <div className="rounded-lg p-4 mt-3" style={{ backgroundColor: `${COLOR}08`, border: `1px solid ${COLOR}20` }}>
          <p className="text-xs font-black mb-2" style={{ color: COLOR }}>The Compound Effect</p>
          <p className="text-xs">Touring is cumulative. Every show builds something, audience, relationships, performance quality, data, reputation. The artists who tour consistently, even when the returns are modest, are the ones whose careers compound over time.</p>
        </div>
      </>
    ),
  },
];

export default function TourBookingPage() {
  const { country, currency, currencyName } = useLocale();
  const res = getCountryResources(country);
  const proAbbr = res.performanceRights.abbr;
  const isAlgeria = country === "Algeria";
  const ticketNote = isAlgeria
    ? "Yassir Events and Weezevent"
    : "Quicket and Howler";
  const currencyNote = `${currency} (${currencyName})`;

  return (
    <div className="animate-fade-in max-w-3xl">
      <div className="flex items-center gap-2 text-xs text-text-muted mb-6">
        <Link href="/dashboard/library" className="hover:text-text-primary transition-colors">Toolkit</Link>
        <ChevronRight size={12}/>
        <Link href="/dashboard/library/touring" className="hover:text-text-primary transition-colors">Live: Bookings & Tours</Link>
        <ChevronRight size={12}/>
        <span className="text-text-primary">Tour Booking Guide</span>
      </div>

      <div className="glass-card rounded-2xl p-7 mb-8" style={{ borderColor: `${COLOR}25` }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: COLOR }}>{res.flag} {res.country} · 5-Step Process · African Markets · 2026 Edition</p>
        <h1 className="text-2xl font-black text-text-primary mb-1">Tour Booking Guide</h1>
        <p className="text-sm font-semibold mb-1" style={{ color: COLOR }}>How to route and book a tour from the ground up.</p>
        <p className="text-sm text-text-muted">Research markets, build your routing strategy, approach venues and promoters, and fill a tour calendar, even without a track record. The full 5-step process from intelligence gathering to advancing the show.</p>
      </div>

      {/* Locale context card */}
      <div className="glass-card rounded-xl p-4 mb-6 flex items-start gap-3" style={{ borderColor: `${COLOR}25`, backgroundColor: `${COLOR}06` }}>
        <span className="text-base flex-shrink-0">{res.flag}</span>
        <div>
          <p className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: COLOR }}>{res.country} Market Context</p>
          <p className="text-xs text-text-muted leading-relaxed">
            Key cities for routing: <span className="font-semibold text-text-primary">{res.keyCities?.join(", ") ?? country}</span>. Ticketing platforms: <span className="font-semibold text-text-primary">{ticketNote}</span>. Rights body: <span className="font-semibold text-text-primary">{proAbbr}</span>. Settlement currency: <span className="font-semibold text-text-primary">{currencyNote}</span>.
            {isAlgeria && " Note: This guide references African touring broadly — apply the principles to your Algerian and North/West African routing."}
          </p>
        </div>
      </div>

      {/* Steps nav */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-8">
        {["Intelligence", "Audience", "Routing", "Outreach", "Advancing"].map((label, i) => (
          <button
            key={i}
            type="button"
            onClick={() => document.getElementById(`step${i + 1}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className="rounded-lg p-2 text-center transition-all hover:brightness-125 active:scale-95 cursor-pointer"
            style={{ backgroundColor: `${COLOR}10`, border: `1px solid ${COLOR}20` }}
          >
            <p className="text-[10px] font-black" style={{ color: COLOR }}>Step {i + 1}</p>
            <p className="text-[9px] text-text-muted leading-tight mt-0.5">{label}</p>
          </button>
        ))}
      </div>

      <div>
        {SECTIONS.map(s => <Accordion key={s.id} section={s}/>)}
      </div>

      <div className="glass-card rounded-xl p-4 my-8 flex items-start gap-3" style={{ borderColor: "rgba(201,168,76,0.15)", backgroundColor: "rgba(201,168,76,0.04)" }}>
        <span className="text-base flex-shrink-0">📋</span>
        <p className="text-xs text-text-muted leading-relaxed">Use the <span className="font-semibold text-brand">Booking Advance Sheet</span> in the Work Tools tab to manage every show's technical and logistical details once a date is confirmed.</p>
      </div>

      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <Link href="/dashboard/library/touring" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors">
          <ChevronLeft size={15}/>Back to Live: Bookings & Tours
        </Link>
        <Link href="/dashboard/library/touring/tour-management"
          className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-all"
          style={{ backgroundColor: `${COLOR}15`, color: COLOR }}>
          Next: Tour Management<ChevronRight size={14}/>
        </Link>
      </div>
    </div>
  );
}
