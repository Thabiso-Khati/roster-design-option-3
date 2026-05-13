"use client";
import { useState, useEffect, useCallback } from "react";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";
import Link from "next/link";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { useLocale } from "@/context/locale-context";
import { getCountryResources } from "@/lib/country-resources";
import { SaveButton } from "@/components/ui/save-button";
import { ExportButton } from "@/components/ui/export-button";

const STORAGE_KEY = "roster_booking_advance_v1";
const COLOR = "#EC4899";

const SHOWS = ["Show 1", "Show 2", "Show 3", "Show 4", "Show 5"];

export default function BookingAdvancePage() {
  const handleExportPDF = () => { window.print(); };
  const { country } = useLocale();
  const res = getCountryResources(country);
  const currency = res.currency ?? "ZAR";
  const [activeShow, setActiveShow] = useState(0);
  const [data, setData] = useState<Record<string, string>>({});

  useToolRestore("booking-advance", STORAGE_KEY, setData);

  const set = useCallback((key: string, val: string) => {
    setData(d => {
      const next = { ...d, [key]: val };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const s = activeShow;
  const v = (key: string) => data[`s${s}_${key}`] || "";
  const f = (key: string, val: string) => set(`s${s}_${key}`, val);

  const inputBase = "bg-transparent border-b border-border focus:border-brand text-sm text-text-primary placeholder:text-text-muted focus:outline-none w-full py-1 transition-colors";
  const labelCls = "text-[10px] font-black uppercase tracking-wider text-text-muted block mb-1";

  const handleReset = () => {
    if (confirm(`Reset all data for ${SHOWS[s]}? This cannot be undone.`)) {
      const next = { ...data };
      Object.keys(next).forEach(key => { if (key.startsWith(`s${s}_`)) delete next[key]; });
      setData(next);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
  };

  type FieldGroup = { title: string; color: string; fields: { key: string; label: string; type?: string; wide?: boolean }[] };

  const GROUPS: FieldGroup[] = [
    {
      title: "Event Details",
      color: COLOR,
      fields: [
        { key: "city", label: "City" },
        { key: "perf_date", label: "Performance Date" },
        { key: "event_name", label: "Event Name", wide: true },
      ],
    },
    {
      title: "Travel",
      color: "#F59E0B",
      fields: [
        { key: "travel_route", label: "From → To", wide: true },
        { key: "travel_distance", label: "Distance (KM)" },
        { key: "travel_time", label: "Travel Time (hours)" },
        { key: "depart_time", label: "Hit the Road (time)" },
      ],
    },
    {
      title: "Schedule",
      color: "#10B981",
      fields: [
        { key: "load_in", label: "Load-in Time" },
        { key: "soundcheck", label: "Soundcheck Time" },
        { key: "doors", label: "Doors" },
        { key: "support_time", label: "Opening Act Time" },
        { key: "set_time", label: "Set Time (start)" },
        { key: "set_length", label: "Length of Set(s)" },
        { key: "num_sets", label: "Number of Sets" },
        { key: "changeover", label: "Changeover Length" },
        { key: "curfew", label: "Curfew" },
      ],
    },
    {
      title: "Venue Details",
      color: "#8B5CF6",
      fields: [
        { key: "venue_name", label: "Venue Name", wide: true },
        { key: "venue_capacity", label: "Capacity" },
        { key: "venue_address", label: "Address", wide: true, type: "textarea" },
        { key: "venue_phone", label: "Venue Phone" },
        { key: "venue_contact", label: "Venue Contact" },
        { key: "internet", label: "Internet (Y/N)" },
        { key: "parking", label: "Parking Instructions", wide: true },
        { key: "load_in_instructions", label: "Load-in Instructions", wide: true },
      ],
    },
    {
      title: "Technical / Production",
      color: "#06B6D4",
      fields: [
        { key: "foh_tech", label: "Front-of-House Tech Provided (Y/N)" },
        { key: "tech_contact", label: "Technical Contact Name" },
        { key: "tech_phone", label: "Technical Contact Phone" },
        { key: "tech_email", label: "Technical Contact Email" },
        { key: "production_status", label: "Production Status / Notes", wide: true },
        { key: "backline", label: "Backline Provided", wide: true },
      ],
    },
    {
      title: "Merchandise",
      color: "#C9A84C",
      fields: [
        { key: "merch_table", label: "Merch Table (Yes / No)" },
        { key: "merch_location", label: "Merch Table Location", wide: true },
        { key: "merch_terms", label: "Merch Terms (split %)", wide: true },
      ],
    },
    {
      title: "Promoter",
      color: "#EF4444",
      fields: [
        { key: "promoter_name", label: "Promoter Name" },
        { key: "promoter_phone", label: "Promoter Phone" },
        { key: "promoter_email", label: "Promoter Email" },
        { key: "guest_list", label: "Guest List Spots" },
        { key: "perf_terms", label: "Performance Terms", wide: true },
      ],
    },
    {
      title: "Agreement & Settlement",
      color: COLOR,
      fields: [
        { key: "perf_fee", label: `Performance Fee (${currency})` },
        { key: "deposit", label: `Deposit Amount (${currency})` },
        { key: "balance", label: `Balance Due Night-of (${currency})` },
        { key: "meals_rider", label: "Meals / Rider (Y/N)" },
        { key: "rider_details", label: "F&B / Buyout Details", wide: true },
        { key: "dressing_room", label: "Dressing Room / Green Room / Storage", wide: true },
        { key: "accom_included", label: "Accommodation Included (Y/N)" },
      ],
    },
    {
      title: "Accommodation",
      color: "#8B5CF6",
      fields: [
        { key: "hotel", label: "Hotel Name" },
        { key: "hotel_address", label: "Hotel Address", wide: true },
        { key: "hotel_phone", label: "Hotel Phone" },
        { key: "hotel_distance", label: "Distance to Venue" },
        { key: "num_rooms", label: "Number of Rooms" },
        { key: "booking_ref", label: "Booking Reference & Name" },
        { key: "check_in", label: "Check-in Time" },
        { key: "credit_card", label: "Credit Card Needed (Y/N)" },
        { key: "hotel_notes", label: "Hotel Notes", wide: true },
      ],
    },
    {
      title: "Artist Contacts",
      color: "#10B981",
      fields: [
        { key: "contact_manager", label: "Manager (name & number)" },
        { key: "contact_tour_mgr", label: "Tour Manager (name & number)" },
        { key: "contact_agent", label: "Agent (name & number)" },
        { key: "contact_publicist", label: "Publicist (name & number)" },
      ],
    },
    {
      title: "Social Media & Ticketing",
      color: "#F59E0B",
      fields: [
        { key: "fb", label: "Venue / Event Facebook" },
        { key: "instagram", label: "Venue / Event Instagram" },
        { key: "ticketing_link", label: "Ticketing Link", wide: true },
        { key: "ticketing_platform", label: "Ticketing Platform" },
      ],
    },
    {
      title: "Load Shedding & Tech Prep",
      color: "#EF4444",
      fields: [
        { key: "loadshedding_stage", label: "Loadshedding Stage (on show day)" },
        { key: "loadshedding_times", label: "Loadshedding Scheduled Times", wide: true },
        { key: "generator", label: "Venue Generator (Y/N / capacity)" },
        { key: "backup_notes", label: "Backup Power Notes", wide: true },
      ],
    },
  ];

  return (
    <div className="animate-fade-in max-w-3xl">
      <div className="flex items-center gap-2 text-xs text-text-muted mb-6">
          <SaveButton toolSlug="booking-advance" storageKey={STORAGE_KEY} title={`Booking Advance — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
            <ExportButton onPDF={handleExportPDF} />

        <Link href="/dashboard/library" className="hover:text-text-primary transition-colors">Toolkit</Link>
        <ChevronRight size={12}/>
        <Link href="/dashboard/library/touring" className="hover:text-text-primary transition-colors">Live: Bookings & Tours</Link>
        <ChevronRight size={12}/>
        <span className="text-text-primary">Booking Advance Sheet</span>
      </div>

      <div className="glass-card rounded-2xl p-7 mb-6" style={{ borderColor: `${COLOR}25` }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: COLOR }}>5 Shows · Live Tool · Auto-Saved · One Form Per Show</p>
        <h1 className="text-2xl font-black text-text-primary mb-1">Booking Advance Sheet</h1>
        <p className="text-sm font-semibold mb-1" style={{ color: COLOR }}>Complete show advance, every logistical detail resolved before load-in day.</p>
        <p className="text-sm text-text-muted">Fill in one tab per show. Venue details, schedule, technical, hospitality, accommodation, settlement terms, and load shedding prep. Never leave advance questions for show day.</p>
      </div>

      {/* Show tabs */}
      <div className="flex gap-0 mb-6 border-b border-border overflow-x-auto">
        {SHOWS.map((show, i) => {
          const hasData = Object.keys(data).some(k => k.startsWith(`s${i}_`));
          return (
            <button key={i} onClick={() => setActiveShow(i)}
              className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 -mb-px whitespace-nowrap flex items-center gap-1.5 ${
                activeShow === i ? "border-brand text-brand" : "border-transparent text-text-muted hover:text-text-primary"
              }`}>
              {show}
              {hasData && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLOR }}/>}
            </button>
          );
        })}
      </div>

      <div className="space-y-4">
        {GROUPS.map(group => (
          <div key={group.title} className="glass-card rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border" style={{ backgroundColor: `${group.color}08` }}>
              <p className="text-xs font-black uppercase tracking-wider" style={{ color: group.color }}>{group.title}</p>
            </div>
            <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {group.fields.map(field => (
                <div key={field.key} className={field.wide ? "sm:col-span-2" : ""}>
                  <label className={labelCls}>{field.label}</label>
                  {field.type === "textarea" ? (
                    <textarea value={v(field.key)} onChange={e => f(field.key, e.target.value)}
                      placeholder={field.label} rows={2}
                      className="bg-transparent border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand w-full resize-none"/>
                  ) : (
                    <input type="text" value={v(field.key)} onChange={e => f(field.key, e.target.value)}
                      placeholder={field.label} className={inputBase}/>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-xl p-4 my-8 flex items-start gap-3" style={{ borderColor: "rgba(201,168,76,0.15)", backgroundColor: "rgba(201,168,76,0.04)" }}>
        <span className="text-base flex-shrink-0">💾</span>
        <p className="text-xs text-text-muted leading-relaxed"><span className="font-semibold text-brand">Auto-saved to this device for 90 days.</span> Fill in each show tab as dates are confirmed. Screenshot or export each completed advance sheet to share with crew.</p>
      </div>

      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <Link href="/dashboard/library/touring" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors">
          <ChevronLeft size={15}/>Back to Live: Bookings & Tours
        </Link>
        <button onClick={handleReset}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-text-muted hover:text-text-primary border border-border hover:border-text-muted transition-all">
          <RotateCcw size={12}/>Reset {SHOWS[activeShow]}
        </button>
      </div>
    </div>
  );
}
