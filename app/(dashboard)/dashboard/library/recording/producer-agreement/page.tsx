"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ChevronDown, Printer, RotateCcw } from "lucide-react";
import { useLocale } from "@/context/locale-context";
import { getCountryResources } from "@/lib/country-resources";
import { ContractTopBar, ContractSendButton } from "@/components/library/contract-scaffold";
import { SaveButton } from "@/components/ui/save-button";
import { ExportButton } from "@/components/ui/export-button";

const STORAGE_KEY = "roster_producer_agreement_v1";
const COLOR = "#C9A84C";

const inputClass = "bg-transparent border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand w-full";
const labelClass = "text-xs font-semibold uppercase tracking-wider mb-1 block";

const CLAUSES = [
  {
    num: "1",
    title: "Engagement",
    text: "Producer shall provide audio production services and deliver a completed Master recording for inclusion, at Commissioner's election, in an audio product by the recording artist. Recording dates and session times shall be agreed upon in writing by both parties in advance.",
  },
  {
    num: "2",
    title: "Recording Procedure",
    text: "All recording sessions shall be conducted at the Commissioner's sole cost and expense. The Commissioner shall settle all Recording Costs as and when they fall due. The Producer shall deliver to the Commissioner, upon completion, a fully mixed, edited, and mastered audio file in a format mutually agreed upon, commercially satisfactory to the Commissioner for release as part of an audio product. Producer shall act diligently and shall not cause unreasonable delays.",
  },
  {
    num: "3",
    title: "Compensation",
    text: "In full and final settlement for the services described in this Agreement, the Commissioner shall pay the Producer a flat production fee per song or track produced and delivered to commercial standard. No further royalty, equity interest, or participation in revenue is payable to the Producer beyond the agreed fee, unless separately agreed in a signed addendum.",
  },
  {
    num: "4",
    title: "Ownership of Recordings",
    text: "Each Master produced under this Agreement shall, from the moment of its creation, be deemed a work commissioned for the Commissioner within the meaning of the Copyright Act 98 of 1978, as amended. To the extent that any Master is determined not to constitute a commissioned work, the Producer hereby irrevocably assigns to the Commissioner all right, title, and interest in and to that Master, including all copyright and related rights, throughout the world, in perpetuity, without further payment. All Masters and audio products derived therefrom shall be the sole and exclusive property of the Commissioner, free of any claim by the Producer or any third party.",
  },
  {
    num: "5",
    title: "Musical Compositions",
    text: "Where the Producer has written or co-written any musical composition embodied in the Masters produced hereunder, the Producer shall be recognised as the author of that music in proportion to their contribution, in accordance with the Copyright Act 98 of 1978. The Producer shall register all such compositions with SAMRO (South African Music Rights Organisation) and, where applicable, CAPASSO (Composers, Authors and Publishers Association of South Africa), and shall provide the Commissioner with confirmation of such registration upon request. The Producer shall retain sole administration rights over their musical compositions and shall not license or assign those compositions to any third party without the Commissioner's prior written consent where such use affects the Masters produced hereunder.",
  },
  {
    num: "6",
    title: "Mechanical Licensing & Royalties",
    text: "All musical compositions written or co-written by the Producer and embodied in the Masters (\"Controlled Compositions\") are hereby licensed to the Commissioner in perpetuity for use in all audio products and formats. Mechanical royalties for SA exploitation shall be determined in accordance with rates set by CAPASSO. For international exploitation, the applicable mechanical royalty rate shall be determined by the mechanical rights society with jurisdiction in the relevant territory. The Commissioner shall account to the Producer on a semi-annual basis and shall remit any royalties due within thirty (30) days of the close of each period ending 30 June and 31 December.",
  },
  {
    num: "7",
    title: "Name & Likeness",
    text: "The Commissioner shall have the worldwide right, in perpetuity, to use and to authorise the use of the Producer's professional name, likeness, biographical information, and any other identifying information in connection with the Masters produced hereunder and all audio products derived therefrom, for trade and promotional purposes without further payment or consent.",
  },
  {
    num: "8",
    title: "Production Credit",
    text: "The Commissioner shall ensure that the Producer receives appropriate production credit on all commercial releases embodying the Masters, in a form substantially as follows: \"Produced by [Producer Name].\" Credit shall appear on digital metadata, physical packaging where applicable, and all commercially distributed configurations. Should a credit error occur, the Commissioner's sole obligation is to use reasonable efforts to rectify the error in future materials upon receiving written notice. An inadvertent failure to provide credit shall not constitute a breach of this Agreement.",
  },
  {
    num: "9",
    title: "Warranties & Indemnities",
    text: "The Producer warrants that: (i) the Producer is the sole and unencumbered owner of all rights granted herein; (ii) the Masters shall be free of any third-party claims; (iii) all samples, interpolations, or replays embodied in the Masters have been properly cleared and licensed, or the Commissioner has been notified in writing and has separately agreed to secure such clearances; (iv) the Masters do not infringe the intellectual property rights of any third party. The Producer indemnifies and holds harmless the Commissioner, its officers, employees, agents, and assigns against all claims, losses, damages, and costs (including attorney's fees on the attorney-and-client scale) arising from any breach of the above warranties.",
  },
  {
    num: "10",
    title: "Independent Contractor",
    text: "The Producer provides services under this Agreement as an independent contractor and not as an employee of the Commissioner. The Commissioner shall not be required to deduct or pay PAYE, UIF, or any other statutory employment contributions in respect of fees paid to the Producer. The Producer is solely responsible for all tax obligations arising from remuneration received under this Agreement, including registration with SARS where required.",
  },
  {
    num: "11",
    title: "Confidentiality",
    text: "Each party undertakes to keep confidential all non-public business information, creative content, and commercial terms disclosed by the other party in connection with this Agreement, and not to disclose such information to any third party without prior written consent, except as required by law.",
  },
  {
    num: "12",
    title: "Entire Agreement",
    text: "This Agreement constitutes the entire agreement between the parties in relation to its subject matter and supersedes all prior discussions, representations, and understandings. No variation or amendment shall be binding unless recorded in writing and signed by both parties or their duly authorised representatives.",
  },
  {
    num: "13",
    title: "Governing Law & Dispute Resolution",
    text: "This Agreement is governed by the laws of the Republic of South Africa. Any dispute that cannot be resolved by good-faith negotiation between the parties shall be referred to mediation and, failing resolution, to arbitration in accordance with the rules of the Arbitration Foundation of Southern Africa (AFSA), with proceedings conducted in the agreed city. The award of the arbitrator shall be final and binding.",
  },
];

function ClauseAccordion({ clause }: { clause: typeof CLAUSES[0] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-surface-2 transition-colors">
        <div className="flex items-center gap-3">

          <span className="text-sm font-black w-6 flex-shrink-0" style={{ color: COLOR }}>{clause.num}.</span>
          <span className="font-bold text-text-primary">{clause.title}</span>
        </div>
        <ChevronDown size={16} className={`flex-shrink-0 text-text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}/>
      </button>
      {open && (
        <div className="border-t border-border px-5 py-4">
          <p className="text-sm text-text-muted leading-relaxed">{clause.text}</p>
        </div>
      )}
    </div>
  );
}

export default function ProducerAgreementPage() {
  const handleExportPDF = () => { window.print(); };
  const { country, sym } = useLocale();
  const res = getCountryResources(country);
  const proAbbr      = res.performanceRights.abbr;
  const mechAbbr     = res.mechanicalRights?.abbr ?? proAbbr;
  const neighbourAbbr = res.neighbouringRights?.abbr ?? proAbbr;
  const taxAbbr      = res.taxAuthorityAbbr ?? "SARS";
  const busRegAbbr   = res.businessRegAbbr ?? "CIPC";
  const govLaw       = res.governingLaw ?? "the Republic of South Africa";
  const lawyerNote   = res.lawyerNote ?? "qualified entertainment attorney";
  const isSA = country === "South Africa";

  const loc = useCallback((text: string): string => text
    .replace(/\bSAMRO\b(?:\s*\([^)]*\))?/g, proAbbr)
    .replace(/\bCAPASSO\b(?:\s*\([^)]*\))?/g, mechAbbr)
    .replace(/\bSAMPRA\b(?:\s*\([^)]*\))?/g, neighbourAbbr)
    .replace(/\bSARS\b/g, taxAbbr)
    .replace(/\bCIPC\b/g, busRegAbbr)
    .replace(/the Republic of South Africa/g, govLaw)
    .replace(/Republic of South Africa/g, govLaw)
    .replace(/laws of South Africa\b/g, `laws of ${country}`)
    .replace(/\bSouth African\b/g, country)
    .replace(/\bSouth Africa\b/g, country)
    .replace(/Copyright Act 98 of 1978/g, "the Copyright Act")
    .replace(/Arbitration Foundation of Southern Africa(?:\s*\([^)]*\))?/g, "the applicable arbitration body")
    .replace(/\bPAYE\b/g, "the applicable employment withholding tax")
    .replace(/\bUIF\b/g, "the applicable unemployment insurance contribution")
    .replace(/\bZAR\b/g, res.currency ?? "ZAR")
    .replace(/\bR(\d[\d,]*(?:\.\d{2})?)\b/g, `${sym}\u00A0$1`)
  , [proAbbr, mechAbbr, neighbourAbbr, taxAbbr, busRegAbbr, govLaw, country, sym, res.currency]);

  const localizedClauses = useMemo(() =>
    CLAUSES.map(c => ({ ...c, text: loc(c.text) }))
  , [loc]);

  const [data, setData] = useState<Record<string, string>>({});

  useToolRestore("producer-agreement", STORAGE_KEY, setData);

  const set = useCallback((key: string, val: string) => {
    setData(d => {
      const next = { ...d, [key]: val };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const v = (key: string) => data[key] || "";

  const handleReset = () => {
    if (confirm("Clear all agreement fields? This cannot be undone.")) {
      setData({});
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const SIG_FIELDS = [
    { k: "sig", label: "Signature" },
    { k: "full_name", label: "Full Legal Name" },
    { k: "capacity", label: "Capacity / Title" },
    { k: "date", label: "Date", type: "date" },
    { k: "address", label: "Address" },
  ];

  return (
    <div className="animate-fade-in max-w-3xl">
      <div className="flex items-center gap-2 text-xs text-text-muted mb-6">
        <Link href="/dashboard/library" className="hover:text-text-primary transition-colors">Toolkit</Link>
        <ChevronRight size={12}/>
        <Link href="/dashboard/library/recording" className="hover:text-text-primary transition-colors">Releasing Music</Link>
        <ChevronRight size={12}/>
        <span className="text-text-primary">Producer Agreement</span>
      </div>

      {/* Legal Disclaimer */}
      <div className="glass-card rounded-xl p-4 mb-4 flex items-start gap-3" style={{ borderColor: "rgba(239,68,68,0.2)", backgroundColor: "rgba(239,68,68,0.05)" }}>
        <span className="text-sm flex-shrink-0">⚠️</span>
        <p className="text-xs text-text-muted leading-relaxed">This template is provided for general guidance only. It does not constitute legal advice. {isSA ? "South African contract law, the Copyright Act 98 of 1978 (as amended), and applicable collecting society rules govern this agreement." : `Applicable ${res.country} contract law and collecting society rules govern this agreement.`} You are strongly advised to consult a {lawyerNote} before signing or issuing this document.</p>
      </div>

      {/* Locale context banner */}
      {!isSA && (
        <div className="glass-card rounded-xl p-4 mb-6 flex items-start gap-3" style={{ borderColor: `${COLOR}25`, backgroundColor: `${COLOR}06` }}>
          <span className="text-base flex-shrink-0">{res.flag}</span>
          <div>
            <p className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: COLOR }}>{res.country} Context Note</p>
            <p className="text-xs text-text-muted leading-relaxed">
              This template references South African legislation and societies. For {res.country}: compositions should be registered with <span className="font-semibold text-text-primary">{proAbbr}</span> ({res.performanceRights.name}){mechAbbr !== proAbbr ? ` and ${mechAbbr} (${res.mechanicalRights?.name ?? "mechanical rights"})` : ""}. References to the Copyright Act 98 of 1978 and CAPASSO should be replaced with applicable {res.country} legislation. Have a {lawyerNote} adapt this template before use.
            </p>
          </div>
        </div>
      )}

      <div className="glass-card rounded-2xl p-7 mb-8" style={{ borderColor: `${COLOR}25` }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: COLOR }}>{res.flag} {res.country} · Contract · No Royalty Transfer · 2026</p>
            <h1 className="text-2xl font-black text-text-primary mb-1">Producer Agreement</h1>
            <p className="text-sm font-semibold mb-2" style={{ color: COLOR }}>Flat fee structure · No royalty transfer · Master ownership retained by Commissioner.</p>
            <p className="text-sm text-text-muted leading-relaxed max-w-xl">
              Formalise the relationship between artist and producer before any sessions begin. Fill in the agreement details below, then review all clauses with your legal counsel before signing.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <ContractSendButton contractId="producer-agreement" />
            <SaveButton toolSlug="producer-agreement" storageKey={STORAGE_KEY} title="Producer Agreement" />
            <ExportButton onPDF={handleExportPDF} />
            
          </div>
        </div>
      </div>

      <ContractTopBar contractId="producer-agreement" />

      <div id="contract-printable">

      {/* Agreement Details */}
      <div className="glass-card rounded-xl p-5 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-5 rounded-full" style={{ backgroundColor: COLOR }}/>
          <h2 className="text-base font-black text-text-primary">Agreement Details</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} style={{ color: COLOR }}>Agreement Date</label>
            <input type="date" value={v("agreement_date")} onChange={e => set("agreement_date", e.target.value)} className={inputClass}/>
          </div>
          <div>
            <label className={labelClass} style={{ color: COLOR }}>Commissioner (Full Name / Company)</label>
            <input type="text" value={v("commissioner")} onChange={e => set("commissioner", e.target.value)} placeholder="Legal name or company" className={inputClass}/>
          </div>
          <div>
            <label className={labelClass} style={{ color: COLOR }}>Producer (Full Name)</label>
            <input type="text" value={v("producer")} onChange={e => set("producer", e.target.value)} placeholder="Producer's legal name" className={inputClass}/>
          </div>
          <div>
            <label className={labelClass} style={{ color: COLOR }}>Artist Name</label>
            <input type="text" value={v("artist")} onChange={e => set("artist", e.target.value)} placeholder="Recording artist name" className={inputClass}/>
          </div>
          <div>
            <label className={labelClass} style={{ color: COLOR }}>Production Fee Per Track ({res.currency ?? "ZAR"})</label>
            <input type="number" value={v("fee_per_track")} onChange={e => set("fee_per_track", e.target.value)} placeholder="e.g. 5000" className={inputClass}/>
          </div>
          <div>
            <label className={labelClass} style={{ color: COLOR }}>Payment Due (Days After Delivery)</label>
            <input type="number" value={v("payment_days")} onChange={e => set("payment_days", e.target.value)} placeholder="e.g. 14" className={inputClass}/>
          </div>
          <div>
            <label className={labelClass} style={{ color: COLOR }}>Governing City (for Dispute Resolution)</label>
            <input type="text" value={v("governing_city")} onChange={e => set("governing_city", e.target.value)} placeholder="e.g. Johannesburg" className={inputClass}/>
          </div>
        </div>
        <div className="mt-4">
          <label className={labelClass} style={{ color: COLOR }}>Schedule A, Songs Covered</label>
          <textarea rows={4} value={v("schedule_a")} onChange={e => set("schedule_a", e.target.value)}
            placeholder="List all tracks covered by this agreement, one per line. e.g.:&#10;1. Working Title One&#10;2. Working Title Two" className={inputClass}/>
        </div>
      </div>

      {/* Contract Clauses */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-5 rounded-full" style={{ backgroundColor: COLOR }}/>
          <h2 className="text-base font-black text-text-primary">Contract Clauses</h2>
        </div>
        <p className="text-xs text-text-muted mb-4">Click each clause to read the full text. Review all clauses with a {lawyerNote} before executing.</p>
        <div className="space-y-2">
          {localizedClauses.map(c => <ClauseAccordion key={c.num} clause={c}/>)}
        </div>
      </div>

      {/* Definitions */}
      <div className="glass-card rounded-xl p-5 mb-6" style={{ borderColor: `${COLOR}15`, backgroundColor: `${COLOR}04` }}>
        <p className="text-xs font-black uppercase tracking-wider mb-3" style={{ color: COLOR }}>Key Definitions</p>
        <div className="space-y-2">
          {[
            { term: "Audio Product", def: "Any configuration in which sound may be fixed or reproduced by any method now known or later developed, including digital files, streaming, downloads, physical media, and audiovisual recordings." },
            { term: "Master", def: "Any recording of sound, whether or not coupled with a visual image, by any method and on any substance or medium, used in the production or distribution of audio products." },
            { term: "Recording Costs", def: "All direct costs incurred by the Commissioner in the production, mixing, and mastering of Masters, including studio hire, engineering, session musician fees, equipment hire, and related expenses." },
          ].map(d => (
            <div key={d.term} className="flex gap-2">
              <span className="text-xs font-black flex-shrink-0" style={{ color: COLOR }}>{d.term}:</span>
              <p className="text-xs text-text-muted leading-relaxed">{d.def}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Signature Block */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-5 rounded-full" style={{ backgroundColor: COLOR }}/>
          <h2 className="text-base font-black text-text-primary">Signatures</h2>
        </div>
        <p className="text-xs text-text-muted mb-4">This Agreement becomes effective on the date first written above and is only valid when signed by both parties.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {["commissioner", "producer"].map(party => (
            <div key={party} className="glass-card rounded-xl p-4" style={{ borderColor: `${COLOR}20` }}>
              <p className="text-xs font-black uppercase tracking-wider mb-3" style={{ color: COLOR }}>{party === "commissioner" ? "Commissioner" : "Producer"}</p>
              {SIG_FIELDS.map(f => (
                <div key={f.k} className="mb-3">
                  <label className="text-[10px] font-semibold uppercase tracking-wider mb-1 block text-text-muted">{f.label}</label>
                  {f.label === "Signature" ? (
                    <div className="h-10 border-b-2 border-border" style={{ borderColor: `${COLOR}40` }}/>
                  ) : (
                    <input type={f.type || "text"} value={v(`${party}_${f.k}`)} onChange={e => set(`${party}_${f.k}`, e.target.value)}
                      placeholder={f.label} className="bg-transparent border-b border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand w-full py-1"/>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      </div> {/* end #contract-printable */}

      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <p className="text-xs text-text-muted">💾 Your agreement details are saved automatically to this device.</p>
        <button onClick={handleReset}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-text-muted hover:text-text-primary border border-border hover:border-text-muted transition-all">
          <RotateCcw size={12}/>Clear form
        </button>
      </div>

      <Link href="/dashboard/library/recording" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors">
        <ChevronLeft size={15}/>Back to Releasing Music
      </Link>
    </div>
  );
}
