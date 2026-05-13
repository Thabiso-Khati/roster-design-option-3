"use client";
import { useState, useEffect, useCallback } from "react";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";
import Link from "next/link";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { useLocale } from "@/context/locale-context";
import { getCountryResources } from "@/lib/country-resources";
import { SaveButton } from "@/components/ui/save-button";
import { ExportButton } from "@/components/ui/export-button";

const STORAGE_KEY = "roster_personnel_record_v1";
const COLOR = "#10B981";

export default function PersonnelRecordPage() {
  const handleExportPDF = () => { window.print(); };
  const { country } = useLocale();
  const res = getCountryResources(country);
  const proAbbr = res.performanceRights.abbr;
  const taxAbbr = res.taxAuthorityAbbr ?? "SARS";
  const currency = res.currency ?? "ZAR";
  const [data, setData] = useState<Record<string, string>>({});

  useToolRestore("personnel-record", STORAGE_KEY, setData);

  const set = useCallback((key: string, val: string) => {
    setData(d => {
      const next = { ...d, [key]: val };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const v = (key: string) => data[key] || "";

  const inputBase = "bg-transparent border-b border-border focus:border-brand text-sm text-text-primary placeholder:text-text-muted focus:outline-none w-full py-1 transition-colors";
  const labelCls = "text-[10px] font-black uppercase tracking-wider text-text-muted block mb-1";

  const handleReset = () => {
    if (confirm("Reset all personnel record fields? This cannot be undone.")) {
      setData({});
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  type FieldDef = { key: string; label: string; type?: string; placeholder?: string };

  function Section({ title, color, fields }: { title: string; color: string; fields: FieldDef[] }) {
    return (
      <div className="glass-card rounded-xl overflow-hidden mb-4">
        <div className="px-5 py-3 border-b border-border" style={{ backgroundColor: `${color}08` }}>
          <p className="text-xs font-black uppercase tracking-wider" style={{ color }}>{title}</p>
        </div>
        <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map(f => (
            <div key={f.key} className={f.key.includes("address") || f.key.includes("medication") || f.key.includes("restrictions") ? "sm:col-span-2" : ""}>
              <label className={labelCls}>{f.label}</label>
              {f.type === "textarea" ? (
                <textarea value={v(f.key)} onChange={e => set(f.key, e.target.value)}
                  placeholder={f.placeholder || f.label}
                  rows={2}
                  className="bg-transparent border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand w-full resize-none"/>
              ) : (
                <input type={f.type || "text"} value={v(f.key)} onChange={e => set(f.key, e.target.value)}
                  placeholder={f.placeholder || f.label} className={inputBase}/>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-3xl">
      <div className="flex items-center gap-2 text-xs text-text-muted mb-6">
          <SaveButton toolSlug="personnel-record" storageKey={STORAGE_KEY} title={`Personnel Record — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
            <ExportButton onPDF={handleExportPDF} />

        <Link href="/dashboard/library" className="hover:text-text-primary transition-colors">Toolkit</Link>
        <ChevronRight size={12}/>
        <Link href="/dashboard/library/touring" className="hover:text-text-primary transition-colors">Live: Bookings & Tours</Link>
        <ChevronRight size={12}/>
        <span className="text-text-primary">Tour Personnel Record</span>
      </div>

      <div className="glass-card rounded-2xl p-7 mb-8" style={{ borderColor: `${COLOR}25` }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: COLOR }}>Fillable · Auto-Saved · One Record Per Person · 2026 Edition</p>
        <h1 className="text-2xl font-black text-text-primary mb-1">Tour Personnel Record</h1>
        <p className="text-sm font-semibold mb-1" style={{ color: COLOR }}>One completed record for every artist, musician, and crew member on this tour.</p>
        <p className="text-sm text-text-muted">Maintain a master copy in a secure, password-protected digital folder (shared only with your tour manager and manager) and a printed backup sealed in the tour manager's road case. Update it before every tour leg.</p>
      </div>

      <div className="glass-card rounded-xl p-4 mb-6 flex items-start gap-3" style={{ borderColor: "rgba(239,68,68,0.15)", backgroundColor: "rgba(239,68,68,0.04)" }}>
        <span className="text-sm flex-shrink-0">🔒</span>
        <p className="text-xs text-text-muted leading-relaxed"><span className="font-semibold text-red-400">POPIA Notice:</span> This record contains personal information protected under the Protection of Personal Information Act, Act 4 of 2013. Access is restricted to authorised tour management personnel only. Store securely. Do not share without consent. Destroy sensitively when no longer required.</p>
      </div>

      <Section title="Personal Information" color={COLOR} fields={[
        { key: "full_legal_name", label: "Full legal name (as per ID / passport)" },
        { key: "preferred_name", label: "Preferred name / stage name" },
        { key: "id_number", label: "SA Identity Number (or foreign national ID number)" },
        { key: "dob", label: "Date of birth" },
        { key: "nationality", label: "Nationality" },
        { key: "home_address", label: "Home address", type: "textarea" },
        { key: "alt_address", label: "Alternative / emergency address", type: "textarea" },
        { key: "mobile_number", label: "Personal mobile number (WhatsApp-enabled)" },
        { key: "personal_email", label: "Personal email address" },
        { key: "blood_type", label: "Blood type" },
        { key: "allergies", label: "Known allergies or medical conditions", type: "textarea" },
      ]}/>

      <Section title="Travel Documents" color="#8B5CF6" fields={[
        { key: "passport_number", label: "Passport number" },
        { key: "passport_expiry", label: "Passport expiry date" },
        { key: "passport_scan", label: "Passport scan / photo on file (Y / N)" },
        { key: "drivers_licence", label: "Driver's licence number" },
        { key: "drivers_expiry", label: "Driver's licence expiry date" },
        { key: "drivers_scan", label: "Driver's licence scan / photo on file (Y / N)" },
        { key: "visa_status", label: "Visa status for scheduled tour territories", type: "textarea" },
        { key: "entry_restrictions", label: "Any entry restrictions to note", type: "textarea" },
      ]}/>

      <Section title="Medical & Insurance" color="#EF4444" fields={[
        { key: "medical_aid", label: "Medical aid provider" },
        { key: "medical_aid_number", label: "Medical aid membership number" },
        { key: "medical_principal", label: "Principal member name (if different)" },
        { key: "medical_emergency_line", label: "Medical aid 24-hr emergency line" },
        { key: "travel_insurance", label: "Travel / touring insurance provider" },
        { key: "travel_policy", label: "Travel insurance policy number" },
        { key: "travel_claims", label: "Travel insurance claims number" },
        { key: "medication", label: "Personal medication (list all)", type: "textarea" },
        { key: "dietary", label: "Dietary requirements" },
      ]}/>

      <Section title="Financial & Professional" color="#C9A84C" fields={[
        { key: "bank_name", label: "Bank name" },
        { key: "account_type", label: "Account type (cheque / savings)" },
        { key: "account_number", label: "Account number" },
        { key: "branch_code", label: "Branch / sort code" },
        { key: "samro_number", label: `${proAbbr} / IPI number (if applicable)` },
        { key: "risa_number", label: "RISA / RISA membership number (if applicable)" },
        { key: "tax_number", label: `Tax reference number (${taxAbbr})` },
        { key: "vat_number", label: "VAT registration number (if applicable)" },
        { key: "payment_method", label: "Preferred payment method for settlement" },
        { key: "frequent_flyer", label: "Frequent flyer programme & number (if applicable)" },
      ]}/>

      <Section title="Emergency Contact" color="#F59E0B" fields={[
        { key: "emergency_name", label: "Primary emergency contact name" },
        { key: "emergency_relationship", label: "Relationship to traveller" },
        { key: "emergency_mobile", label: "Mobile number (WhatsApp-enabled)" },
        { key: "emergency_alt_mobile", label: "Alternative contact number" },
        { key: "emergency_email", label: "Email address" },
        { key: "emergency_address", label: "Physical address", type: "textarea" },
        { key: "emergency2_name", label: "Secondary emergency contact name" },
        { key: "emergency2_mobile", label: "Secondary contact mobile number" },
      ]}/>

      <Section title="Tour-Specific Details" color="#06B6D4" fields={[
        { key: "role", label: "Role on this tour" },
        { key: "per_diem", label: `Agreed per diem (${currency} per day)` },
        { key: "tour_fee", label: `Tour fee / weekly rate (${currency})` },
        { key: "arrival_date", label: "Tour start / arrival date" },
        { key: "departure_date", label: "Tour end / departure date" },
        { key: "shirt_size", label: "T-shirt size (for crew merch)" },
        { key: "notes", label: "Additional notes", type: "textarea" },
      ]}/>

      <div className="glass-card rounded-xl p-4 mb-8 flex items-start gap-3" style={{ borderColor: "rgba(201,168,76,0.15)", backgroundColor: "rgba(201,168,76,0.04)" }}>
        <span className="text-base flex-shrink-0">💾</span>
        <p className="text-xs text-text-muted leading-relaxed"><span className="font-semibold text-brand">Auto-saved to this device.</span> Fill in one form per person. Screenshot or export each completed record and store in a secure folder accessible to tour management only.</p>
      </div>

      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <Link href="/dashboard/library/touring" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors">
          <ChevronLeft size={15}/>Back to Live: Bookings & Tours
        </Link>
        <button onClick={handleReset}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-text-muted hover:text-text-primary border border-border hover:border-text-muted transition-all">
          <RotateCcw size={12}/>Reset record
        </button>
      </div>
    </div>
  );
}
