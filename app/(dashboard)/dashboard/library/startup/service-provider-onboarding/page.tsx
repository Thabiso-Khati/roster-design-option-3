"use client";
import { Printer, RotateCcw } from "lucide-react";
import { ResourcePage, inputClass, labelClass, useLocalState } from "@/components/library/module-shell";
import { SaveButton } from "@/components/ui/save-button";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";

const COLOR = "#C9A84C";
const STORAGE_KEY = "roster_svc_provider_onboard_v1";

interface State {
  legalName: string; tradingName: string; role: string;
  idNumber: string; passportNumber: string;
  taxNumber: string; vatNumber: string; vatRegistered: string;
  businessReg: string; country: string;
  email: string; phone: string; whatsapp: string; address: string;
  bankName: string; bankAccountName: string; bankAccountNumber: string;
  bankBranchCode: string; bankSwiftBic: string; bankCountry: string;
  insuranceProvider: string; insurancePolicy: string; insuranceCover: string;
  emergencyName: string; emergencyPhone: string;
  ndaSigned: string; contractType: string; contractRef: string;
  notes: string;
}

const empty: State = {
  legalName: "", tradingName: "", role: "",
  idNumber: "", passportNumber: "",
  taxNumber: "", vatNumber: "", vatRegistered: "No",
  businessReg: "", country: "South Africa",
  email: "", phone: "", whatsapp: "", address: "",
  bankName: "", bankAccountName: "", bankAccountNumber: "",
  bankBranchCode: "", bankSwiftBic: "", bankCountry: "",
  insuranceProvider: "", insurancePolicy: "", insuranceCover: "",
  emergencyName: "", emergencyPhone: "",
  ndaSigned: "No", contractType: "Independent Contractor Agreement", contractRef: "",
  notes: "",
};

const F = ({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) => (
  <div>
    <label className={labelClass}>{label}</label>
    <input className={inputClass} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
  </div>
);

const Sel = ({ label, value, onChange, opts }: { label: string; value: string; onChange: (v: string) => void; opts: string[] }) => (
  <div>
    <label className={labelClass}>{label}</label>
    <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value)}>
      {opts.map((o) => <option key={o}>{o}</option>)}
    </select>
  </div>
);

export default function ServiceProviderOnboardingPage() {
  const [s, setS] = useLocalState<State>(STORAGE_KEY, empty);
  useToolRestore("service-provider-onboarding", STORAGE_KEY, setS);
  const set = (k: keyof State) => (v: string) => setS({ ...s, [k]: v });

  return (
    <ResourcePage
      parentHref="/dashboard/library/startup"
      parentLabel="Back to Onboarding"
      color={COLOR}
      tag="Onboarding · Form"
      title="Service Provider Onboarding"
      intro="Complete this once for every producer, photographer, designer, mixing engineer, tour driver, security provider, or other service supplier you contract. Pairs with the Independent Contractor Agreement."
      toolbar={<><SaveButton toolSlug="service-provider-onboarding" storageKey={STORAGE_KEY} title={`Service Provider Onboarding — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
          
        <>
          <button onClick={() => setS(empty)} className="text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1"><RotateCcw size={13}/> Reset</button>
          <button onClick={() => window.print()} className="text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1"><Printer size={13}/> Print / PDF</button>
        </>
            </>
      }
      next={{ href: "/dashboard/library/startup/independent-contractor-agreement", label: "Independent Contractor Agreement" }}
    >
      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Identity</p>
        <div className="grid grid-cols-2 gap-4">
          <F label="Legal name" value={s.legalName} onChange={set("legalName")} placeholder="Individual or registered company"/>
          <F label="Trading name" value={s.tradingName} onChange={set("tradingName")}/>
          <F label="Role / service offered" value={s.role} onChange={set("role")} placeholder="Producer / photographer / driver / etc."/>
          <Sel label="Country" value={s.country} onChange={set("country")} opts={["South Africa","Nigeria","Ghana","Kenya","Tanzania","Uganda","Zimbabwe","Cameroon","Senegal","Côte d'Ivoire","Ethiopia","Egypt","Morocco","Algeria","Angola","Other"]} />
          <F label="ID number" value={s.idNumber} onChange={set("idNumber")} placeholder="National ID where applicable"/>
          <F label="Passport number" value={s.passportNumber} onChange={set("passportNumber")} placeholder="For cross-border work"/>
          <F label="Business registration #" value={s.businessReg} onChange={set("businessReg")} placeholder="CIPC / CAC / equivalent"/>
          <F label="Tax / SARS / FIRS / KRA #" value={s.taxNumber} onChange={set("taxNumber")} />
          <Sel label="VAT registered" value={s.vatRegistered} onChange={set("vatRegistered")} opts={["No","Yes"]} />
          <F label="VAT number (if registered)" value={s.vatNumber} onChange={set("vatNumber")} />
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Contact</p>
        <div className="grid grid-cols-2 gap-4">
          <F label="Email" value={s.email} onChange={set("email")} />
          <F label="Phone" value={s.phone} onChange={set("phone")} />
          <F label="WhatsApp (if different)" value={s.whatsapp} onChange={set("whatsapp")} />
          <F label="Address" value={s.address} onChange={set("address")} />
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Banking</p>
        <div className="grid grid-cols-2 gap-4">
          <F label="Bank name" value={s.bankName} onChange={set("bankName")} />
          <F label="Account holder name" value={s.bankAccountName} onChange={set("bankAccountName")} placeholder="Must match ID / business name"/>
          <F label="Account number" value={s.bankAccountNumber} onChange={set("bankAccountNumber")} />
          <F label="Branch / sort code" value={s.bankBranchCode} onChange={set("bankBranchCode")} />
          <F label="SWIFT / BIC (international)" value={s.bankSwiftBic} onChange={set("bankSwiftBic")} />
          <F label="Bank country" value={s.bankCountry} onChange={set("bankCountry")} />
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Insurance & emergency</p>
        <div className="grid grid-cols-2 gap-4">
          <F label="Insurance provider" value={s.insuranceProvider} onChange={set("insuranceProvider")} placeholder="Public liability / professional indemnity"/>
          <F label="Policy number" value={s.insurancePolicy} onChange={set("insurancePolicy")} />
          <F label="Cover amount" value={s.insuranceCover} onChange={set("insuranceCover")} />
          <div></div>
          <F label="Emergency contact name" value={s.emergencyName} onChange={set("emergencyName")} />
          <F label="Emergency contact phone" value={s.emergencyPhone} onChange={set("emergencyPhone")} />
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Contract & compliance</p>
        <div className="grid grid-cols-2 gap-4">
          <Sel label="NDA on file" value={s.ndaSigned} onChange={set("ndaSigned")} opts={["No","Yes — mutual","Yes — one-way"]} />
          <F label="Contract type" value={s.contractType} onChange={set("contractType")} />
          <F label="Contract reference / file ID" value={s.contractRef} onChange={set("contractRef")} placeholder="Vault ref or DocuSign ID"/>
          <div></div>
          <div className="col-span-2">
            <label className={labelClass}>Notes</label>
            <textarea className={inputClass} rows={3} value={s.notes} onChange={(e) => set("notes")(e.target.value)} placeholder="Day rates, exceptions, languages spoken, allergies, gear preferences"/>
          </div>
        </div>
      </section>
    </ResourcePage>
  );
}
