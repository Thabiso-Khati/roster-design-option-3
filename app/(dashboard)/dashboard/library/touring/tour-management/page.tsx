"use client";
import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { useLocale } from "@/context/locale-context";
import { getCountryResources } from "@/lib/country-resources";

const COLOR = "#10B981";

type LocFn = (s: string) => string;
type Section = { id: string; title: string; tag?: string; content: (loc: LocFn) => React.ReactNode };

function Accordion({ section, loc }: { section: Section; loc: LocFn }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass-card rounded-xl overflow-hidden mb-3">
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
          {section.content(loc)}
        </div>
      )}
    </div>
  );
}

const NIGHTLY_CHECKLIST = [
  { num: 1, title: "Payment at source", body: "Do not leave a venue without physically receiving and verifying your settlement. Push for instant EFT, SnapScan, or Zapper over cash where possible. Screenshot or download the payment confirmation before the conversation moves on." },
  { num: 2, title: "Independent attendance verification", body: "Where your fee is tied to door revenue, have your own person physically at the entrance tallying numbers. In township venues and community halls, electronic ticket scanning is often absent, your count is the only count that matters." },
  { num: 3, title: "Lodging confirmation", body: "Phone your next night's accommodation directly and re-confirm the booking. Properties in secondary towns routinely release unconfirmed reservations, especially over peak weekends." },
  { num: 4, title: "Movement logistics check", body: "Verify your ground transport or flight for the following day. Obtain the driver or carrier's WhatsApp number and confirm pickup time. Do not leave this until morning." },
  { num: 5, title: "Itinerary distribution", body: "Push the updated daily schedule to the crew WhatsApp group, follow up with an email thread for record-keeping, and keep a minimum of two printed hard copies in separate bags. Grid power, mobile data, and device batteries are all unreliable on the road." },
  { num: 6, title: "Audience data capture", body: "Collect fan contact details at every show. City-by-city records enable precise targeting the next time you route through that area." },
  { num: 7, title: "Power situation briefing", body: "Before load up, confirm with the venue production manager what their backup power provision looks like. Check the load shedding schedule via EskomSePush. Share that schedule with the sound engineer and lighting operator at the earliest opportunity." },
];

const SECTIONS: Section[] = [
  {
    id: "crossborder",
    title: "Pan-African & Cross-Border Touring",

    content: (loc) => (
      <>
        <p>{loc("Taking your act beyond South Africa's borders unlocks significant audience and revenue potential, but it introduces a set of logistical variables that require separate planning to what you would apply to a domestic run.")}</p>
        <div className="space-y-3 mt-2">
          {[
            { title: "Entry documentation", body: "Begin visa and work permit research no later than six weeks out. A South African travel document gets you far across SADC on arrival, but band members and crew on other passports may face different requirements. Plan for the slowest person in your group." },
            { title: "Equipment movement", body: "Instruments, PA, and stage gear crossing a border need to be covered by an ATA Carnet or equivalent temporary importation document to avoid being taxed as commercial imports. SARS and chambers of commerce can assist, start this process early." },
            { title: "Cash and currency planning", body: "Operate with a layered currency strategy. ZAR travels well in the SADC region; USD is the preferred settlement denomination across most of sub-Saharan Africa for artist guarantees. Avoid solo reliance on card infrastructure, it degrades significantly outside major metropolitan areas." },
            { title: "Mobile payment fluency", body: "In East Africa, M-Pesa dominates; in Francophone West Africa, Orange Money is prevalent; in Nigeria and Ghana, Opay, Palmpay, and MTN MoMo are standard. Know which platform your promoter uses before the show date, not on settlement night." },
            { title: "Communications infrastructure", body: "WhatsApp is the continent's default business channel. Every partner, promoter, venue contact, driver, hospitality liaison, must be reachable on it. Activate international roaming before departure or acquire local SIMs at each border." },
            { title: "Travel time buffers", body: "African geography demands respect. Build at least one full rest day into any run that involves overnight overland travel or multi-leg connections through hub airports such as Johannesburg, Nairobi, Lagos, or Addis Ababa." },
            { title: "Ground-level market access", body: "Entering a new city or country without an established local promoter is high-risk. A trusted on-the-ground partner brings the audience relationships, venue access, and operational knowledge that no amount of remote planning can replicate." },
          ].map(item => (
            <div key={item.title} className="pl-3 border-l-2" style={{ borderColor: `${COLOR}40` }}>
              <p className="font-semibold text-text-primary text-xs mb-1">{loc(item.title)}</p>
              <p>{loc(item.body)}</p>
            </div>
          ))}
        </div>
      </>
    ),
  },
  {
    id: "financial",
    title: "Financial Discipline on the Road",

    content: (loc) => (
      <>
        <p>{loc("Gross income is a vanity number. Net income, what remains after every agent, manager, promoter, transport operator, accommodation provider, and production supplier has been settled, is the only figure that matters. The single most controllable lever available to an independent artist is the expense line, not the deal size.")}</p>
        <div className="space-y-3 mt-3">
          <p className="text-xs font-black uppercase tracking-wider text-text-primary">{loc("Practical Expense Controls")}</p>
          {[
            { title: "Production scale", body: "Build a show that can be executed profitably at the venues you are actually playing. Elaborate stage sets and large touring crews are financial liabilities in club and mid-capacity touring." },
            { title: "Accommodation strategy", body: "Airbnb, guesthouses, and hosted stays typically offer significant savings over branded hotels, particularly in secondary cities. Quality sleep and security are non-negotiable; price paid per square metre is not." },
            { title: "Routing intelligence", body: "Map your tour dates geographically before committing to anything. A well-routed run can reduce transport costs by 20–30%. A badly routed SA run, Cape Town, then Johannesburg, then Port Elizabeth, then back to Johannesburg, can add thousands of rands in avoidable transport costs before you play a note." },
            { title: "Pre-departure budgeting", body: "Build a line-item tour budget at least a month before you leave. Apply a contingency of 10–15% on top of your total, African touring regularly surfaces costs that no template anticipates: generator hire, unexpected border fees, last-minute re-routing." },
            { title: "Transport cost locking", body: "Negotiate a fixed all-in transport fee with your carrier. Given how significantly ZAR fuel prices can move over the course of a multi-week tour, an open-ended fuel arrangement is a liability you do not need." },
          ].map(item => (
            <div key={item.title} className="pl-3 border-l-2" style={{ borderColor: `${COLOR}40` }}>
              <p className="font-semibold text-text-primary text-xs mb-1">{loc(item.title)}</p>
              <p>{loc(item.body)}</p>
            </div>
          ))}
          <p className="text-xs font-black uppercase tracking-wider text-text-primary pt-2">{loc("South African Financial Specifics")}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { title: "VAT clarity", body: "Every deal should specify whether quoted amounts are VAT-inclusive or VAT-exclusive. At 15%, the difference is material. Get this in writing before a handshake becomes a commitment." },
              { title: "SAMRO", body: "Venues bear the SAMRO licensing obligation, but it is your show that stops if they are non-compliant. Verify the venue's licensing status as part of your advance process, not on show day." },
              { title: "Settlement documentation", body: "A verbal confirmation of payment is not a payment. Require a bank-stamped deposit slip, an OZOW confirmation, or a Peach Payments receipt, something timestamped and traceable, before you walk away from every settlement." },
              { title: "Multi-currency touring", body: "For pan-African dates, agree on the settlement currency (ZAR or USD) within the written contract before any travel is booked. Currency ambiguity at settlement creates conflict." },
            ].map(item => (
              <div key={item.title} className="rounded-lg p-3" style={{ backgroundColor: `${COLOR}08`, border: `1px solid ${COLOR}15` }}>
                <p className="text-xs font-black mb-1" style={{ color: COLOR }}>{loc(item.title)}</p>
                <p className="text-xs">{loc(item.body)}</p>
              </div>
            ))}
          </div>
        </div>
      </>
    ),
  },
  {
    id: "fandata",
    title: "Fan Engagement & Data Strategy",

    content: (loc) => (
      <>
        <p>{loc("The most durable asset any independent artist builds over time is not a streaming number or a follower count, it is a direct, owned channel to people who have already shown up for the music. In southern Africa and across the continent, that channel is increasingly mobile-first.")}</p>
        <div className="space-y-3 mt-2">
          {[
            { title: "City-segmented contact databases", body: "Structure your fan data by city, not as a single national list. When you return to Cape Town, only Cape Town fans need to know. Precision targeting drives better open rates, better ticket conversion, and less list fatigue." },
            { title: "WhatsApp broadcast architecture", body: "In the African context, WhatsApp messages are read at dramatically higher rates than email. Build city-specific broadcast lists. The technical requirement, fans must have your number saved before a broadcast reaches them, means you need to promote this actively at shows." },
            { title: "QR code sign-up deployment", body: "A printed QR code at the merch table, linking to a mobile-optimised sign-up form, processes fan registrations faster than any paper sheet and generates clean, usable data. Include a POPIA consent checkbox on the form, it is legally required and builds trust." },
            { title: "POPIA obligations", body: "The Protection of Personal Information Act (Act 4 of 2013) governs all personal data collection in South Africa. You need explicit consent before adding any fan to any list. Data must be stored securely. Fans must be able to opt out easily. Non-compliance carries real legal and reputational risk." },
            { title: "Real-time content capture", body: "Assign someone to document every show for social media. TikTok and Instagram Reels built from live audience footage are currently the most cost-effective organic discovery mechanism available to independent artists. The content window closes when the crowd leaves." },
          ].map(item => (
            <div key={item.title} className="pl-3 border-l-2" style={{ borderColor: `${COLOR}40` }}>
              <p className="font-semibold text-text-primary text-xs mb-1">{loc(item.title)}</p>
              <p>{loc(item.body)}</p>
            </div>
          ))}
        </div>
      </>
    ),
  },
  {
    id: "tech",
    title: "Technology & Infrastructure Preparedness",

    content: (loc) => (
      <>
        <p>{loc("The infrastructure assumptions embedded in most international touring guides do not translate to South African or African conditions without modification. The following practices are non-optional for a smooth run.")}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          {[
            { title: "Offline-first document management", body: "Every critical file, itinerary, crew contacts, contracts, hospitality riders, setlists, must be accessible without a data connection. Google Docs offline mode, downloaded PDFs, and local device storage are your safety net." },
            { title: "Load shedding schedule management", body: "EskomSePush is mandatory on every touring device. Pull the schedule for every city on your route before you arrive and share it with production at the venue advance stage. A show that starts in darkness because nobody checked the schedule is entirely avoidable." },
            { title: "Portable power inventory", body: "High-capacity power banks and a vehicle inverter for the touring vehicle are standard kit. For rural or township venues without reliable generator backup, bring your own charging infrastructure for devices." },
            { title: "Network redundancy", body: "Carry active SIMs on at least two networks (Vodacom and MTN cover the broadest geographic spread in South Africa). For pan-African touring, research dominant carriers per country before departure and purchase local SIMs at entry points." },
            { title: "Ticketing platform selection", body: "Use platforms with established South African market penetration: Quicket and Howler both integrate with local payment rails and are familiar to South African audiences. Platform fees must be factored into ticket face value before announcement." },
            { title: "Live streaming protocol", body: "Before committing to any live broadcast, physically test venue internet bandwidth and confirm load shedding backup power with the venue. A stream that drops mid-performance is worse for brand perception than not streaming at all." },
          ].map(item => (
            <div key={item.title} className="rounded-lg p-3" style={{ backgroundColor: `${COLOR}08`, border: `1px solid ${COLOR}15` }}>
              <p className="text-xs font-black mb-1" style={{ color: COLOR }}>{loc(item.title)}</p>
              <p className="text-xs">{loc(item.body)}</p>
            </div>
          ))}
        </div>
      </>
    ),
  },
];

export default function TourManagementPage() {
  const { country, currency, currencyName, taxName, taxRate } = useLocale();
  const res = getCountryResources(country);
  const proAbbr = res.performanceRights.abbr;
  const taxAuthorityAbbr = res.taxAuthorityAbbr ?? "the local tax authority";
  const isSouthAfrica = country === "South Africa";
  const isAlgeria = country === "Algeria";

  const loc = useCallback((s: string): string => {
    let out = s;
    // Universal currency / tax replacements (apply everywhere, including SA when terms differ)
    out = out.replace(/\bZAR\b/g, currency);
    if (taxName !== "VAT") out = out.replace(/\bVAT\b/g, taxName);
    if (taxRate !== 15) out = out.replace(/\bAt 15%\b/g, `At ${taxRate}%`);
    out = out.replace(/\brands\b/g, currencyName ? `${currencyName.toLowerCase()}s` : currency.toLowerCase());
    out = out.replace(/\bRands\b/g, currencyName ? `${currencyName}s` : currency);

    if (isSouthAfrica) return out;

    // Non-SA: rewrite SA-specific institutions, geography, and platforms
    out = out.replace(/\bSAMRO\b/g, proAbbr);
    out = out.replace(/\bSARS\b/g, taxAuthorityAbbr);
    out = out.replace(/EskomSePush/g, isAlgeria ? "the local power utility schedule" : "your local power utility schedule app");
    out = out.replace(/instant EFT, SnapScan, or Zapper/g, isAlgeria
      ? "CIB transfer, BaridiMob, or mobile payment confirmation"
      : "instant bank transfer or local mobile payment confirmation");
    out = out.replace(/an OZOW confirmation, or a Peach Payments receipt/g, "a verified instant transfer confirmation, or a payment processor receipt");
    out = out.replace(/Quicket and Howler/g, "established local ticketing platforms");
    out = out.replace(/Vodacom and MTN/g, "the country's two largest mobile networks");
    out = out.replace(/the Protection of Personal Information Act \(Act 4 of 2013\)/g, "local data protection legislation");
    out = out.replace(/\bPOPIA\b/g, "local data protection law");
    out = out.replace(/all personal data collection in South Africa/g, `all personal data collection in ${country}`);
    out = out.replace(/\bin South Africa\b/g, `in ${country}`);
    out = out.replace(/South African Financial Specifics/g, `${country} Financial Specifics`);
    out = out.replace(/South African audiences/g, `${country} audiences`);
    out = out.replace(/South African market penetration/g, `${country} market penetration`);
    out = out.replace(/South African or African conditions/g, `${country} or African conditions`);
    out = out.replace(/South Africa's borders/g, `${country}'s borders`);
    out = out.replace(/A South African travel document/g, `A ${country} travel document`);
    return out;
  }, [country, currency, currencyName, proAbbr, taxAuthorityAbbr, taxName, taxRate, isSouthAfrica, isAlgeria]);

  const localeNightlyChecklist = useMemo(
    () => NIGHTLY_CHECKLIST.map(item => ({ ...item, body: loc(item.body) })),
    [loc]
  );

  const [nightlyOpen, setNightlyOpen] = useState(true);
  return (
    <div className="animate-fade-in max-w-3xl">
      <div className="flex items-center gap-2 text-xs text-text-muted mb-6">
        <Link href="/dashboard/library" className="hover:text-text-primary transition-colors">Toolkit</Link>
        <ChevronRight size={12}/>
        <Link href="/dashboard/library/touring" className="hover:text-text-primary transition-colors">Live: Bookings & Tours</Link>
        <ChevronRight size={12}/>
        <span className="text-text-primary">Tour Management</span>
      </div>

      <div className="glass-card rounded-2xl p-7 mb-8" style={{ borderColor: `${COLOR}25` }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: COLOR }}>{res.flag} {res.country} · Full Guide · African Markets · 2026 Edition</p>
        <h1 className="text-2xl font-black text-text-primary mb-1">Tour Management</h1>
        <p className="text-sm font-semibold mb-1" style={{ color: COLOR }}>Running your own tour without a dedicated road team.</p>
        <p className="text-sm text-text-muted">Everything that happens between load-in and load-out, nightly operations, cross-border logistics, financial discipline, fan data strategy, and the technology stack that keeps a tour running.</p>
      </div>

      {/* Locale context card */}
      <div className="glass-card rounded-xl p-4 mb-6 flex items-start gap-3" style={{ borderColor: `${COLOR}25`, backgroundColor: `${COLOR}06` }}>
        <span className="text-base flex-shrink-0">{res.flag}</span>
        <div>
          <p className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: COLOR }}>{res.country} Market Context</p>
          <p className="text-xs text-text-muted leading-relaxed">
            Rights body: <span className="font-semibold text-text-primary">{proAbbr}</span>. Settlement currency: <span className="font-semibold text-text-primary">{currency}</span>. Key cities: <span className="font-semibold text-text-primary">{res.keyCities?.slice(0, 3).join(", ") ?? country}</span>.
            {isAlgeria && " Data protection in Algeria is governed by Law 18-07 (2018). Ensure fan data collection complies with local privacy regulations."}
            {!isAlgeria && " Fan data collection is governed by POPIA (Act 4 of 2013) — explicit consent is required before adding anyone to a broadcast list."}
          </p>
        </div>
      </div>

      {/* Nightly Checklist */}
      <div className="glass-card rounded-xl overflow-hidden mb-6">
        <button
          type="button"
          onClick={() => setNightlyOpen(o => !o)}
          className="w-full flex items-center justify-between px-5 py-4 text-left group"
          style={{ borderBottom: nightlyOpen ? "1px solid rgba(255,255,255,0.06)" : "none" }}
        >
          <div className="flex items-center gap-3">
            <p className="font-bold text-sm text-text-primary group-hover:text-brand transition-colors">
              Nightly Operations Checklist
            </p>
            <span className="text-[10px] font-black px-2 py-0.5 rounded hidden sm:inline"
              style={{ color: COLOR, backgroundColor: `${COLOR}15` }}>7 tasks</span>
          </div>
          <ChevronDown
            size={16}
            className={`text-text-muted transition-transform flex-shrink-0 ${nightlyOpen ? "rotate-180" : ""}`}
          />
        </button>
        {nightlyOpen && (
          <div className="divide-y divide-border">
            {localeNightlyChecklist.map(item => (
              <div key={item.num} className="px-5 py-3 flex gap-4">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: `${COLOR}20`, color: COLOR }}>{item.num}</div>
                <div>
                  <p className="text-sm font-bold text-text-primary mb-0.5">{item.title}</p>
                  <p className="text-xs text-text-muted leading-relaxed">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Accordion sections */}
      <div>
        {SECTIONS.map(s => <Accordion key={s.id} section={s} loc={loc}/>)}
      </div>

      <div className="glass-card rounded-xl p-4 my-8 flex items-start gap-3" style={{ borderColor: "rgba(201,168,76,0.15)", backgroundColor: "rgba(201,168,76,0.04)" }}>
        <span className="text-base flex-shrink-0">💾</span>
        <p className="text-xs text-text-muted leading-relaxed">Use the <span className="font-semibold text-brand">Fan Sign-Up & Data Capture tool</span> in the Work Tools tab to collect and organise fan data at every show.</p>
      </div>

      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <Link href="/dashboard/library/touring" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors">
          <ChevronLeft size={15}/>Back to Live: Bookings & Tours
        </Link>
        <Link href="/dashboard/library/touring/show-booking-email"
          className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-all"
          style={{ backgroundColor: `${COLOR}15`, color: COLOR }}>
          Next: Show Booking Email Guide<ChevronRight size={14}/>
        </Link>
      </div>
    </div>
  );
}
