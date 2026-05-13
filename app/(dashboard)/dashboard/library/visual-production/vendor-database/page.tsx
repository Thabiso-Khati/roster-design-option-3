"use client";
import { Plus, Trash2, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { ResourcePage, inputClass, labelClass, useLocalState } from "@/components/library/module-shell";
import { SaveButton } from "@/components/ui/save-button";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";

const COLOR = "#A855F7";
const STORAGE_KEY = "roster_vendor_db_v1";

interface Vendor {
  id: string;
  name: string;
  discipline: string;
  city: string;
  country: string;
  rate: string;
  rating: number;
  email: string;
  phone: string;
  portfolio: string;
  notes: string;
  lastUsed: string;
}

const newVendor = (): Vendor => ({
  id: Math.random().toString(36).slice(2, 8),
  name: "", discipline: "Photographer", city: "", country: "South Africa",
  rate: "", rating: 0, email: "", phone: "", portfolio: "", notes: "", lastUsed: "",
});

const DISCIPLINES = ["Photographer", "DP / Cinematographer", "Music Video Director", "Editor", "Colourist", "Stylist", "Hair / Make-up", "Designer / Illustrator", "Animator / VFX", "Production Co", "Studio / Location", "Other"];

export default function VendorDatabasePage() {
  const [vendors, setVendors] = useLocalState<Vendor[]>(STORAGE_KEY, []);
  useToolRestore("vendor-database", STORAGE_KEY, setVendors);
  const [search, setSearch] = useState("");
  const [filterDiscipline, setFilterDiscipline] = useState("All");
  const [filterCountry, setFilterCountry] = useState("All");

  const update = (id: string, patch: Partial<Vendor>) => setVendors(vendors.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  const remove = (id: string) => setVendors(vendors.filter((v) => v.id !== id));

  const filtered = useMemo(() => vendors.filter((v) => {
    if (filterDiscipline !== "All" && v.discipline !== filterDiscipline) return false;
    if (filterCountry !== "All" && v.country !== filterCountry) return false;
    if (search && !`${v.name} ${v.notes} ${v.city}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [vendors, search, filterDiscipline, filterCountry]);

  const countries = Array.from(new Set(vendors.map((v) => v.country))).sort();

  return (
    <ResourcePage
      parentHref="/dashboard/library/visual-production"
      parentLabel="Back to Visual Production"
      color={COLOR}
      tag="Visual · Database"
      title="Vendor Database"
      intro="Your private rolodex — every photographer, DP, designer, editor, stylist you've worked with. Filter by discipline / country, rate, last-used."
      toolbar={<><SaveButton toolSlug="vendor-database" storageKey={STORAGE_KEY} title={`Vendor Database — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
          
        <button onClick={() => setVendors([...vendors, newVendor()])} className="text-xs font-semibold inline-flex items-center gap-1 px-3 py-1.5 rounded-lg" style={{ backgroundColor: `${COLOR}15`, color: COLOR }}>
          <Plus size={13}/> Add vendor
        </button>
            </>
      }
    >
      <div className="glass-card rounded-2xl p-4 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"/>
          <input className={`${inputClass} pl-9`} placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)}/>
        </div>
        <select className={inputClass} value={filterDiscipline} onChange={(e) => setFilterDiscipline(e.target.value)}>
          <option>All</option>
          {DISCIPLINES.map((d) => <option key={d}>{d}</option>)}
        </select>
        <select className={inputClass} value={filterCountry} onChange={(e) => setFilterCountry(e.target.value)}>
          <option>All</option>
          {countries.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      {vendors.length === 0 && (
        <div className="glass-card rounded-2xl p-12 text-center text-text-muted text-sm">Empty rolodex. Click <span className="font-semibold text-brand">Add vendor</span> to start.</div>
      )}

      <div className="space-y-3">
        {filtered.map((v) => (
          <div key={v.id} className="glass-card rounded-2xl p-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              <div className="col-span-2"><label className={labelClass}>Name</label><input className={inputClass} value={v.name} onChange={(e) => update(v.id, { name: e.target.value })}/></div>
              <div><label className={labelClass}>Discipline</label><select className={inputClass} value={v.discipline} onChange={(e) => update(v.id, { discipline: e.target.value })}>{DISCIPLINES.map((d) => <option key={d}>{d}</option>)}</select></div>
              <div><label className={labelClass}>Rating (0-5)</label><input type="number" min="0" max="5" step="0.5" className={inputClass} value={v.rating} onChange={(e) => update(v.id, { rating: Number(e.target.value) || 0 })}/></div>
              <div><label className={labelClass}>City</label><input className={inputClass} value={v.city} onChange={(e) => update(v.id, { city: e.target.value })}/></div>
              <div><label className={labelClass}>Country</label><input className={inputClass} value={v.country} onChange={(e) => update(v.id, { country: e.target.value })}/></div>
              <div><label className={labelClass}>Rate</label><input className={inputClass} value={v.rate} onChange={(e) => update(v.id, { rate: e.target.value })} placeholder="R5k/day, R150/hr"/></div>
              <div><label className={labelClass}>Last used</label><input type="date" className={inputClass} value={v.lastUsed} onChange={(e) => update(v.id, { lastUsed: e.target.value })}/></div>
              <div><label className={labelClass}>Email</label><input className={inputClass} value={v.email} onChange={(e) => update(v.id, { email: e.target.value })}/></div>
              <div><label className={labelClass}>Phone</label><input className={inputClass} value={v.phone} onChange={(e) => update(v.id, { phone: e.target.value })}/></div>
              <div className="col-span-2"><label className={labelClass}>Portfolio link</label><input className={inputClass} value={v.portfolio} onChange={(e) => update(v.id, { portfolio: e.target.value })} placeholder="https://"/></div>
              <div className="col-span-2 sm:col-span-4"><label className={labelClass}>Notes</label><textarea className={inputClass} rows={2} value={v.notes} onChange={(e) => update(v.id, { notes: e.target.value })} placeholder="What they're great at, who they've worked with, terms / preferences"/></div>
            </div>
            <button onClick={() => remove(v.id)} className="text-xs text-red-400 hover:text-red-300 inline-flex items-center gap-1"><Trash2 size={11}/> Remove</button>
          </div>
        ))}
      </div>
    </ResourcePage>
  );
}
