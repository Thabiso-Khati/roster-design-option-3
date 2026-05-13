"use client";
import { Printer, RotateCcw } from "lucide-react";
import { ResourcePage, inputClass, labelClass, useLocalState } from "@/components/library/module-shell";
import { SaveButton } from "@/components/ui/save-button";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";

const COLOR = "#F59E0B";
const STORAGE_KEY = "roster_hospitality_rider_v1";

interface State {
  artist: string; party: string; arrival: string; checkout: string;
  hotel: string; hotelStandard: string; rooms: string;
  ground: string; airportTransfer: string;
  catering: string; allergies: string; dietary: string; dressing: string; drinks: string;
  greenRoom: string; security: string; meetGreet: string;
  perDiem: string; cashFloat: string;
  notes: string;
}

const empty: State = {
  artist: "", party: "5 — artist + 3 band + 1 TM",
  arrival: "Day before show, 14:00 minimum",
  checkout: "Morning after show by 12:00",
  hotel: "Promoter to provide accommodation in 4★ minimum branded hotel within 15 min of venue.",
  hotelStandard: "Branded chain (Hilton, Marriott, Radisson, City Lodge Premier or equivalent). King-bed rooms; non-smoking; high floor where available.",
  rooms: "1× king (artist) + 4× king/twin (band/TM). All breakfast included.",
  ground: "Promoter-supplied vehicle for full duration of stay. Sedan + driver for artist; 14-seat van for band/gear.",
  airportTransfer: "Door-to-door pickup at airport on arrival; drop-off on departure. Driver to wait if flight delayed.",
  catering: "Full hot meal at venue 90 min before set. Cold buffet available throughout the show day. Halal/kosher options on request.",
  allergies: "Confirm with artist 14 days before show.",
  dietary: "1× vegetarian, 1× pescatarian by default. Adjust per booking.",
  dressing: "Lockable dressing room with mirror, costume rail, ironing facilities, hairdryer, full-length mirror.",
  drinks: "12× still water, 6× sparkling, 6× sports drink, 6× sodas, fresh-cut fruit, energy bars, kettle, instant coffee, Five Roses tea.",
  greenRoom: "Separate from dressing — large comfortable seating for band + 4 guests. Wi-Fi password on arrival. PS5 / Apple TV optional.",
  security: "Promoter-supplied venue security present from artist arrival to departure. Backstage access list managed by TM.",
  meetGreet: "If included in deal: max 30 min, 50 fans, run by venue manager. Photographer present.",
  perDiem: "Per diem paid in local currency cash on arrival. Default: $50 / £40 / R750 per person per day.",
  cashFloat: "Promoter cash float of equivalent of $300 for incidentals (taxi, late food, supplies).",
  notes: "Wi-Fi password and venue Wi-Fi capacity confirmed in advance for streaming if any. No fans/photos in dressing room without artist consent.",
};

const F = ({ label, value, onChange, rows }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) => (
  <div>
    <label className={labelClass}>{label}</label>
    {rows ? <textarea className={inputClass} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
          : <input className={inputClass} value={value} onChange={(e) => onChange(e.target.value)} />}
  </div>
);

export default function HospitalityRiderPage() {
  const [s, setS] = useLocalState<State>(STORAGE_KEY, empty);
  useToolRestore("hospitality-rider", STORAGE_KEY, setS);
  const set = (k: keyof State) => (v: string) => setS({ ...s, [k]: v });

  return (
    <ResourcePage
      parentHref="/dashboard/library/touring"
      parentLabel="Back to Live, Touring & Festivals"
      color={COLOR}
      tag="Live · Rider"
      title="Hospitality Rider"
      intro="Travel, accommodation, food, dressing, security, per-diem. Sent alongside the Performance Rider on every confirmation."
      toolbar={<><SaveButton toolSlug="hospitality-rider" storageKey={STORAGE_KEY} title={`Hospitality Rider — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
          
        <>
          <button onClick={() => setS(empty)} className="text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1"><RotateCcw size={13}/> Reset</button>
          <button onClick={() => window.print()} className="text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1"><Printer size={13}/> Print / PDF</button>
        </>
            </>
      }
      next={{ href: "/dashboard/library/touring/dj-set-submission", label: "DJ Set Submission" }}
    >
      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Travelling Party</p>
        <div className="grid grid-cols-2 gap-4">
          <F label="Artist" value={s.artist} onChange={set("artist")} />
          <F label="Party size" value={s.party} onChange={set("party")} />
          <F label="Arrival" value={s.arrival} onChange={set("arrival")} />
          <F label="Checkout" value={s.checkout} onChange={set("checkout")} />
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Accommodation & Travel</p>
        <div className="space-y-4">
          <F label="Hotel" value={s.hotel} onChange={set("hotel")} rows={2}/>
          <F label="Standard" value={s.hotelStandard} onChange={set("hotelStandard")} rows={2}/>
          <F label="Rooms" value={s.rooms} onChange={set("rooms")} />
          <F label="Ground transport" value={s.ground} onChange={set("ground")} rows={2}/>
          <F label="Airport transfer" value={s.airportTransfer} onChange={set("airportTransfer")} />
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Catering</p>
        <div className="space-y-4">
          <F label="Show-day catering" value={s.catering} onChange={set("catering")} rows={2}/>
          <F label="Allergies" value={s.allergies} onChange={set("allergies")} />
          <F label="Dietary requirements" value={s.dietary} onChange={set("dietary")} />
          <F label="Drinks" value={s.drinks} onChange={set("drinks")} rows={2}/>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Backstage</p>
        <div className="space-y-4">
          <F label="Dressing room" value={s.dressing} onChange={set("dressing")} rows={2}/>
          <F label="Green room" value={s.greenRoom} onChange={set("greenRoom")} rows={2}/>
          <F label="Security" value={s.security} onChange={set("security")} rows={2}/>
          <F label="Meet & greet" value={s.meetGreet} onChange={set("meetGreet")} />
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Cash & Notes</p>
        <div className="space-y-4">
          <F label="Per diem" value={s.perDiem} onChange={set("perDiem")} />
          <F label="Cash float" value={s.cashFloat} onChange={set("cashFloat")} />
          <F label="Notes" value={s.notes} onChange={set("notes")} rows={3}/>
        </div>
      </section>
    </ResourcePage>
  );
}
