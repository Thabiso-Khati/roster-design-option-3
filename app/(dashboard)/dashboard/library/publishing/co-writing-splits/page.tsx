"use client";
import { useState, useEffect, useCallback } from "react";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ChevronDown, RotateCcw, Download } from "lucide-react";
import { useLocale } from "@/context/locale-context";
import { getCountryResources } from "@/lib/country-resources";
import { SaveButton } from "@/components/ui/save-button";
import { ExportButton } from "@/components/ui/export-button";

const STORAGE_KEY = "roster_co_writing_splits_v1";
const COLOR = "#8B5CF6";

function ClauseAccordion({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass-card rounded-xl overflow-hidden mb-2">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-5 py-3.5 text-left group">
        <span className="text-xs font-black w-8 flex-shrink-0" style={{ color: COLOR }}>{num}</span>
        <p className="font-semibold text-sm text-text-primary group-hover:text-brand transition-colors flex-1">{title}</p>
        <ChevronDown size={15} className={`text-text-muted transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`}/>
      </button>
      {open && (
        <div className="px-5 pb-4 border-t border-border pt-4 text-xs text-text-muted leading-relaxed space-y-2">
          {children}
        </div>
      )}
    </div>
  );
}

export default function CoWritingSplitsPage() {
  const handleExportPDF = () => { window.print(); };
  const { country } = useLocale();
  const res = getCountryResources(country);
  const proAbbr    = res.performanceRights.abbr;
  const mechAbbr   = res.mechanicalRights?.abbr ?? proAbbr;
  const govLaw     = res.governingLaw ?? "the Republic of South Africa";
  const lawyerNote = res.lawyerNote ?? "qualified entertainment attorney";
  const isSA = country === "South Africa";

  const loc = useCallback((text: string): string => text
    .replace(/\bSAMRO\b(?:\s*·\s*CAPASSO)?(?:\s*\([^)]*\))?/g, `${proAbbr}${mechAbbr !== proAbbr ? ` · ${mechAbbr}` : ""}`)
    .replace(/\bCAPASSO\b(?:\s*\([^)]*\))?/g, mechAbbr)
    .replace(/\bSAMRO\b/g, proAbbr)
    .replace(/the Republic of South Africa/g, govLaw)
    .replace(/Republic of South Africa/g, govLaw)
    .replace(/\bSouth African\b/g, country)
    .replace(/\bSouth Africa\b/g, country)
    .replace(/Arbitration Foundation of Southern Africa(?:\s*\([^)]*\))?/g, "the applicable arbitration body")
  , [proAbbr, mechAbbr, govLaw, country]);

  const [data, setData] = useState<Record<string, string>>({});

  useToolRestore("co-writing-splits", STORAGE_KEY, setData);

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
    if (confirm("Clear all co-writing splits fields? This cannot be undone.")) {
      setData({});
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const handlePrint = () => window.print();

  // Calculate total ownership
  const totalOwnership = [1,2,3,4].reduce((sum, i) => {
    const pct = parseFloat(v(`w${i}_pct`) || "0");
    return sum + (isNaN(pct) ? 0 : pct);
  }, 0);
  const ownershipOk = Math.abs(totalOwnership - 100) < 0.01;

  return (
    <div className="animate-fade-in max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-text-muted mb-6">
          <SaveButton toolSlug="co-writing-splits" storageKey={STORAGE_KEY} title={`Co Writing Splits — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
            <ExportButton onPDF={handleExportPDF} />

        <Link href="/dashboard/library" className="hover:text-text-primary transition-colors">Toolkit</Link>
        <ChevronRight size={12}/>
        <Link href="/dashboard/library/publishing" className="hover:text-text-primary transition-colors">Publishing & Songwriting</Link>
        <ChevronRight size={12}/>
        <span className="text-text-primary">Co-Writing Splits Agreement</span>
      </div>

      {/* Header */}
      <div className="glass-card rounded-2xl p-7 mb-6" style={{ borderColor: `${COLOR}25` }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: COLOR }}>{res.flag} {res.country} · Contract · Fillable · Auto-Saved</p>
            <h1 className="text-2xl font-black text-text-primary mb-1">Co-Writing Splits Agreement</h1>
            <p className="text-sm font-semibold mb-2" style={{ color: COLOR }}>Sign before you leave the session, no exceptions.</p>
            <p className="text-sm text-text-muted">Documents composition ownership, digital rights, and sync allocation for up to four writers. Auto-saved to this device. Use the PDF button to download a signable copy.</p>
          </div>
          <div className="flex flex-col gap-2 flex-shrink-0">
            <button onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all hover:opacity-80"
              style={{ backgroundColor: `${COLOR}20`, color: COLOR }}>
              <Download size={13}/>PDF
            </button>
            <button onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all hover:opacity-80 text-text-muted hover:text-red-400"
              style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
              <RotateCcw size={13}/>Reset
            </button>
          </div>
        </div>
      </div>

      {/* Cardinal rule */}
      <div className="glass-card rounded-xl p-4 mb-6 flex items-start gap-3" style={{ borderColor: `${COLOR}20`, backgroundColor: `${COLOR}06` }}>
        <span className="text-base flex-shrink-0">⚖️</span>
        <div>
          <p className="text-xs font-bold mb-1" style={{ color: COLOR }}>The golden rule of co-writing</p>
          <p className="text-xs text-text-muted leading-relaxed">Always sign a split agreement before you leave the session, even with friends, even on demos, even when it feels awkward. Five minutes now prevents disputes that last years.</p>
        </div>
      </div>

      {/* Legal notice */}
      <div className="glass-card rounded-xl p-4 mb-4 flex items-start gap-3" style={{ borderColor: "rgba(239,68,68,0.15)", backgroundColor: "rgba(239,68,68,0.04)" }}>
        <span className="text-sm flex-shrink-0">⚠️</span>
        <p className="text-xs text-text-muted leading-relaxed">This template does not constitute legal advice. Always have a {lawyerNote} review agreements before signing or issuing any document.</p>
      </div>

      {/* Locale context banner */}
      <div className="glass-card rounded-xl p-4 mb-6 flex items-start gap-3" style={{ borderColor: `${COLOR}25`, backgroundColor: `${COLOR}06` }}>
        <span className="text-base flex-shrink-0">{res.flag}</span>
        <p className="text-xs text-text-muted leading-relaxed">
          <span className="font-semibold text-text-primary">{res.country} rights registration:</span> Register compositions with <span className="font-semibold text-text-primary">{proAbbr}</span> ({res.performanceRights.name}){mechAbbr !== proAbbr ? ` and ${mechAbbr} (${res.mechanicalRights?.name ?? "mechanical rights"})` : ""}. Each writer should register their share independently after this agreement is signed.
          {!isSA && " Note: This template was drafted with South African law as its base — adapt applicable legislation references with your legal counsel."}
        </p>
      </div>

      {/* ─── SECTION 1: Song Details ─── */}
      <div className="glass-card rounded-xl p-6 mb-4">
        <p className="text-xs font-black uppercase tracking-wider mb-4" style={{ color: COLOR }}>01 · Song Details</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-5">
          <div className="col-span-2">
            <label className={labelCls}>Song / Working Title</label>
            <input className={inputBase} placeholder="Official or working title" value={v("song_title")} onChange={e => set("song_title", e.target.value)}/>
          </div>
          <div>
            <label className={labelCls}>Session Date</label>
            <input className={inputBase} placeholder="DD/MM/YYYY" value={v("session_date")} onChange={e => set("session_date", e.target.value)}/>
          </div>
          <div>
            <label className={labelCls}>Recording Location / Studio</label>
            <input className={inputBase} placeholder="Studio name and city" value={v("studio")} onChange={e => set("studio", e.target.value)}/>
          </div>
          <div>
            <label className={labelCls}>Project / Album</label>
            <input className={inputBase} placeholder="Album or project this belongs to" value={v("project")} onChange={e => set("project", e.target.value)}/>
          </div>
          <div>
            <label className={labelCls}>Genre</label>
            <input className={inputBase} placeholder="e.g. Afrobeats, Amapiano" value={v("genre")} onChange={e => set("genre", e.target.value)}/>
          </div>
          <div>
            <label className={labelCls}>BPM & Key</label>
            <input className={inputBase} placeholder="e.g. 112 BPM · A Minor" value={v("bpm_key")} onChange={e => set("bpm_key", e.target.value)}/>
          </div>
          <div>
            <label className={labelCls}>Language(s)</label>
            <input className={inputBase} placeholder="e.g. English, Zulu, French" value={v("languages")} onChange={e => set("languages", e.target.value)}/>
          </div>
          <div>
            <label className={labelCls}>Estimated Release Date</label>
            <input className={inputBase} placeholder="Quarter & Year, or TBC" value={v("release_date")} onChange={e => set("release_date", e.target.value)}/>
          </div>
        </div>
      </div>

      {/* ─── SECTION 2: Composition Ownership Splits ─── */}
      <div className="glass-card rounded-xl p-6 mb-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-black uppercase tracking-wider" style={{ color: COLOR }}>02 · Composition Ownership Splits</p>
          <div className={`text-xs font-black px-3 py-1 rounded-full ${ownershipOk ? "text-emerald-400 bg-emerald-400/10" : totalOwnership > 0 ? "text-amber-400 bg-amber-400/10" : "text-text-muted bg-white/5"}`}>
            {totalOwnership.toFixed(1)}% of 100%
          </div>
        </div>
        <p className="text-xs text-text-muted mb-4">Total must equal exactly 100%. The percentage indicator above turns green when splits are balanced.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[700px]">
            <thead>
              <tr className="border-b border-border">
                {["#","Full Legal Name","Contact / Email","PRO & CAE/IPI #","Publisher / Admin","% Ownership","Contribution","Master Rights"].map(h => (
                  <th key={h} className="text-left py-2 pr-3 font-black text-text-muted uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[1,2,3,4].map(i => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-3 pr-3 font-bold" style={{ color: COLOR }}>{i}</td>
                  <td className="py-3 pr-3"><input className={inputBase} placeholder="Legal name" value={v(`w${i}_name`)} onChange={e => set(`w${i}_name`, e.target.value)}/></td>
                  <td className="py-3 pr-3"><input className={inputBase} placeholder="email@..." value={v(`w${i}_email`)} onChange={e => set(`w${i}_email`, e.target.value)}/></td>
                  <td className="py-3 pr-3"><input className={inputBase} placeholder={`${proAbbr} · IPI#`} value={v(`w${i}_pro`)} onChange={e => set(`w${i}_pro`, e.target.value)}/></td>
                  <td className="py-3 pr-3"><input className={inputBase} placeholder="Publisher" value={v(`w${i}_publisher`)} onChange={e => set(`w${i}_publisher`, e.target.value)}/></td>
                  <td className="py-3 pr-3 w-16"><input className={inputBase} placeholder="%" value={v(`w${i}_pct`)} onChange={e => set(`w${i}_pct`, e.target.value)}/></td>
                  <td className="py-3 pr-3">
                    <select className={inputBase} value={v(`w${i}_contribution`)} onChange={e => set(`w${i}_contribution`, e.target.value)}>
                      <option value="">, Type, </option>
                      <option>Lyrics</option>
                      <option>Melody</option>
                      <option>Beat / Prod.</option>
                      <option>Lyrics & Melody</option>
                      <option>All</option>
                    </select>
                  </td>
                  <td className="py-3">
                    <select className={inputBase} value={v(`w${i}_master`)} onChange={e => set(`w${i}_master`, e.target.value)}>
                      <option value="">, </option>
                      <option>Yes</option>
                      <option>No</option>
                      <option>Partial</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── SECTION 3: Producer / Beat Contribution ─── */}
      <div className="glass-card rounded-xl p-6 mb-4">
        <p className="text-xs font-black uppercase tracking-wider mb-4" style={{ color: COLOR }}>03 · Producer / Beat Contribution</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-5">
          <div>
            <label className={labelCls}>Producer / Beatmaker Name</label>
            <input className={inputBase} placeholder="Legal / stage name" value={v("prod_name")} onChange={e => set("prod_name", e.target.value)}/>
          </div>
          <div>
            <label className={labelCls}>Contact / Email</label>
            <input className={inputBase} placeholder="email@example.com" value={v("prod_email")} onChange={e => set("prod_email", e.target.value)}/>
          </div>
          <div>
            <label className={labelCls}>Beat Ownership %</label>
            <input className={inputBase} placeholder="% included in splits above" value={v("prod_pct")} onChange={e => set("prod_pct", e.target.value)}/>
          </div>
          <div>
            <label className={labelCls}>Beat Licensed or Sold?</label>
            <select className={inputBase} value={v("prod_type")} onChange={e => set("prod_type", e.target.value)}>
              <option value="">, Select, </option>
              <option>Exclusive Purchase (full buy-out)</option>
              <option>Non-Exclusive License</option>
              <option>Co-ownership (splits included above)</option>
              <option>Custom arrangement</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Beat License / Custom Terms</label>
            <input className={inputBase} placeholder="Any specific beat license terms or reference number" value={v("prod_terms")} onChange={e => set("prod_terms", e.target.value)}/>
          </div>
        </div>
      </div>

      {/* ─── SECTION 4: Digital & Sync Rights Allocation ─── */}
      <div className="glass-card rounded-xl p-6 mb-4">
        <p className="text-xs font-black uppercase tracking-wider mb-2" style={{ color: COLOR }}>04 · Digital & Sync Rights Allocation</p>
        <p className="text-xs text-text-muted mb-4">Define how rights are allocated across different exploitation types. Defaults to split % above unless stated otherwise.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                {["Rights Type","Territory","Revenue Split","Notes / Restrictions"].map(h => (
                  <th key={h} className="text-left py-2 pr-4 font-black text-text-muted uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { key: "shortform", label: "Short-Form Video (TikTok / Reels / YouTube Shorts)" },
                { key: "streaming", label: "Streaming & Download (Spotify / Apple Music / Boomplay)" },
                { key: "sync", label: "Sync Licensing (Film / TV / Ad / Game)" },
              ].map(row => (
                <tr key={row.key} className="border-b border-border/50">
                  <td className="py-3 pr-4 font-semibold text-text-primary whitespace-nowrap">{row.label}</td>
                  <td className="py-3 pr-4"><input className={inputBase} placeholder="World / ZA / Africa" value={v(`${row.key}_territory`)} onChange={e => set(`${row.key}_territory`, e.target.value)}/></td>
                  <td className="py-3 pr-4"><input className={inputBase} placeholder="As per splits above / %" value={v(`${row.key}_split`)} onChange={e => set(`${row.key}_split`, e.target.value)}/></td>
                  <td className="py-3"><input className={inputBase} placeholder="Any restrictions or conditions" value={v(`${row.key}_notes`)} onChange={e => set(`${row.key}_notes`, e.target.value)}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── SECTION 5: Additional Notes ─── */}
      <div className="glass-card rounded-xl p-6 mb-4">
        <p className="text-xs font-black uppercase tracking-wider mb-3" style={{ color: COLOR }}>05 · Additional Notes & Special Conditions</p>
        <textarea
          className="bg-transparent border border-border focus:border-brand rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none w-full p-3 transition-colors resize-none leading-relaxed"
          rows={4}
          placeholder="Any special conditions, sample clearances needed, previous versions of this song, dispute resolution preferences…"
          value={v("additional_notes")}
          onChange={e => set("additional_notes", e.target.value)}
        />
      </div>

      {/* ─── SECTION 6: Contract Clauses ─── */}
      <div className="mb-4">
        <p className="text-xs font-black uppercase tracking-wider mb-3 px-1" style={{ color: COLOR }}>06 · Agreement Clauses</p>
        <ClauseAccordion num="6.1" title="Composition Ownership">
          <p>Each party agrees that their ownership percentage of the composition (music and/or lyrics) is as set out in Section 02 of this agreement. Ownership is calculated on the total composition and all parties confirm these splits are fair and agreed upon.</p>
        </ClauseAccordion>
        <ClauseAccordion num="6.2" title="PRO Registration & Collection">
          <p>{`Each writer is responsible for registering the work with their respective Performing Rights Organisation (${proAbbr}, ASCAP, PRS, SOCAN, etc.) under their own CAE/IPI number using the splits agreed herein. All parties agree to cooperate in providing accurate registration details upon request.`}</p>
        </ClauseAccordion>
        <ClauseAccordion num="6.3" title="Credit & Attribution">
          <p>All writers agree to credit each other accurately on all releases, promotional materials, DSP metadata, and any public-facing documentation. Writing credits will reflect legal names and agreed percentage splits as documented in Section 02.</p>
        </ClauseAccordion>
        <ClauseAccordion num="6.4" title="Publishing Administration">
          <p>Each writer retains the right to administer their own publishing share unless they have separately assigned it to a publisher named in Section 02. No party may sub-publish, assign, or encumber another party&apos;s share without written consent.</p>
        </ClauseAccordion>
        <ClauseAccordion num="6.5" title="Master Recording Rights">
          <p>This agreement covers the composition only. Master recording rights are separate and governed by any applicable recording agreement or producer agreement. Master rights holders are noted in Section 02 for reference purposes only.</p>
        </ClauseAccordion>
        <ClauseAccordion num="6.6" title="Sync Licensing Approval">
          <p>Any synchronisation licence (placement in film, TV, advertising, games, or branded content) requires written approval from all parties listed in Section 02 where their ownership percentage exceeds 10%. Parties agree not to unreasonably withhold approval.</p>
        </ClauseAccordion>
        <ClauseAccordion num="6.7" title="Samples & Third-Party Rights">
          <p>If the composition contains any sampled material or interpolations, all parties confirm that appropriate clearances have been obtained or are in progress. Any costs related to sample clearances will be shared pro-rata based on ownership percentages unless separately agreed.</p>
        </ClauseAccordion>
        <ClauseAccordion num="6.8" title="Modifications & Derivative Works">
          <p>No party may create a derivative work, remix, or substantially alter the composition without written consent from all parties holding more than 10% of the composition. Any agreed derivative retains the original split structure unless a new agreement is executed.</p>
        </ClauseAccordion>
        <ClauseAccordion num="6.9" title="Dispute Resolution">
          <p>{loc("In the event of a dispute, all parties agree to first attempt resolution through good-faith mediation before pursuing legal action. South African law governs this agreement. Any unresolved disputes will be referred to arbitration under the Arbitration Foundation of Southern Africa (AFSA) rules.")}</p>
        </ClauseAccordion>
        <ClauseAccordion num="6.10" title="Governing Law & Jurisdiction">
          <p>{loc("This agreement shall be governed by and construed in accordance with the laws of the Republic of South Africa. All parties submit to the non-exclusive jurisdiction of the South African courts, while acknowledging the international scope of music rights enforcement.")}</p>
        </ClauseAccordion>
      </div>

      {/* ─── SECTION 7: Signatures ─── */}
      <div className="glass-card rounded-xl p-6 mb-4">
        <p className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: COLOR }}>07 · Signatures</p>
        <p className="text-xs text-text-muted mb-5">All parties must sign. By signing, each party confirms they have read and agreed to the terms of this Co-Writing Splits Agreement in full.</p>
        <div className="grid grid-cols-2 gap-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="space-y-4 p-4 rounded-xl border border-border/60">
              <p className="text-xs font-black" style={{ color: COLOR }}>Writer {i}</p>
              <div>
                <label className={labelCls}>Full Legal Name</label>
                <input className={inputBase} placeholder="As shown on ID document" value={v(`sig${i}_name`)} onChange={e => set(`sig${i}_name`, e.target.value)}/>
              </div>
              <div>
                <label className={labelCls}>Date</label>
                <input className={inputBase} placeholder="DD/MM/YYYY" value={v(`sig${i}_date`)} onChange={e => set(`sig${i}_date`, e.target.value)}/>
              </div>
              <div>
                <label className={labelCls}>Signature (print name as signature)</label>
                <input className={inputBase + " font-serif italic text-base"} placeholder="Sign here" value={v(`sig${i}_sig`)} onChange={e => set(`sig${i}_sig`, e.target.value)}/>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PRO Footer */}
      <div className="glass-card rounded-xl p-4 mb-4 flex items-start gap-3" style={{ borderColor: `${COLOR}20`, backgroundColor: `${COLOR}06` }}>
        <span className="text-base flex-shrink-0">🎵</span>
        <div>
          <p className="text-xs font-bold mb-1" style={{ color: COLOR }}>PRO Registration Reminder</p>
          <p className="text-xs text-text-muted leading-relaxed">{loc(`After signing, each writer must register the work with their PRO (South Africa: SAMRO · CAPASSO). Include the agreed splits, all CAE/IPI numbers, and mark the ISWC once assigned. Don't leave the session without a signed copy.`)}</p>
        </div>
      </div>

      {/* Auto-save indicator */}
      <div className="glass-card rounded-xl p-4 mb-8 flex items-start gap-3" style={{ borderColor: "rgba(201,168,76,0.15)", backgroundColor: "rgba(201,168,76,0.04)" }}>
        <span className="text-base flex-shrink-0">💾</span>
        <p className="text-xs text-text-muted leading-relaxed"><span className="font-semibold text-brand">Auto-saved to this device for 90 days.</span> Use the PDF button at the top to download and sign. Keep one completed agreement per co-writing session.</p>
      </div>

      {/* ── Bottom navigation bar ── */}
      <div className="flex items-center justify-between mt-10 pt-6 border-t border-border flex-wrap gap-3">
        <Link
          href="/dashboard/library/publishing"
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors"
        >
          <ChevronLeft size={15} />
          Back to Publishing &amp; Songwriting
        </Link>
        <Link
          href="/dashboard/library/publishing/publishing-admin-agreement"
          className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-all"
          style={{ backgroundColor: `${COLOR}15`, color: COLOR }}
        >
          Next: Publishing Administration Agreement
          <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
}
