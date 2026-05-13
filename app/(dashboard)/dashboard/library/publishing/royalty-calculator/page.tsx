"use client";
import { useMemo } from "react";
import { ResourcePage, inputClass, labelClass, useLocalState } from "@/components/library/module-shell";
import { RotateCcw } from "lucide-react";
import { SaveButton } from "@/components/ui/save-button";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";

const COLOR = "#06B6D4";
const STORAGE_KEY = "roster_pub_royalty_calc_v1";

interface State {
  // streaming
  streams: number;
  perStream: number;
  // mechanical share of streaming (writer side typically ~21% of label rate via MLC)
  mechShare: number;
  // performance share (writer + publisher to PRO)
  perfShare: number;
  // sync
  syncIncome: number;
  syncSplitWriter: number; // % of sync to writer
  syncSplitPublisher: number; // % of sync to publisher
  // physical / download
  physicalIncome: number;
  // structure
  writerSharePct: number;
  publisherSharePct: number;
  // admin / co-pub
  publisherAdminFee: number;
  // co-write
  yourWriterShareOfSong: number;
  yourPublisherShareOfSong: number;
}

const empty: State = {
  streams: 0,
  perStream: 0.0035,
  mechShare: 21,
  perfShare: 79,
  syncIncome: 0,
  syncSplitWriter: 50,
  syncSplitPublisher: 50,
  physicalIncome: 0,
  writerSharePct: 50,
  publisherSharePct: 50,
  publisherAdminFee: 15,
  yourWriterShareOfSong: 100,
  yourPublisherShareOfSong: 100,
};

export default function PublishingRoyaltyCalculator() {
  const [s, setS] = useLocalState<State>(STORAGE_KEY, empty);
  useToolRestore("royalty-calculator", STORAGE_KEY, setS);
  const num = (k: keyof State) => (v: string) => setS({ ...s, [k]: Number(v) || 0 });

  const calc = useMemo(() => {
    const streamingNet = s.streams * s.perStream;
    const streamMechPool = (streamingNet * s.mechShare) / 100;
    const streamPerfPool = (streamingNet * s.perfShare) / 100;

    // Writer side
    const writerStream = ((streamMechPool + streamPerfPool) * s.writerSharePct) / 100;
    const writerSync = (s.syncIncome * s.syncSplitWriter) / 100;
    const writerPhysical = (s.physicalIncome * s.writerSharePct) / 100;
    const writerTotal = writerStream + writerSync + writerPhysical;

    // Publisher side (after admin fee retention)
    const pubGross = ((streamMechPool + streamPerfPool) * s.publisherSharePct) / 100;
    const pubAdmin = (pubGross * s.publisherAdminFee) / 100;
    const pubAfterAdmin = pubGross - pubAdmin;
    const pubSync = (s.syncIncome * s.syncSplitPublisher) / 100;
    const pubPhysical = (s.physicalIncome * s.publisherSharePct) / 100;
    const pubTotal = pubAfterAdmin + pubSync + pubPhysical;

    // Your share of song
    const yourWriterShare = (writerTotal * s.yourWriterShareOfSong) / 100;
    const yourPublisherShare = (pubTotal * s.yourPublisherShareOfSong) / 100;
    const yourTotal = yourWriterShare + yourPublisherShare;

    return {
      streamingNet, streamMechPool, streamPerfPool,
      writerStream, writerSync, writerPhysical, writerTotal,
      pubGross, pubAdmin, pubAfterAdmin, pubSync, pubPhysical, pubTotal,
      yourWriterShare, yourPublisherShare, yourTotal,
    };
  }, [s]);

  const fmt = (n: number) => `USD ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const N = ({ label, k, step = 1, hint }: { label: string; k: keyof State; step?: number; hint?: string }) => (
    <div>
      <label className={labelClass}>{label}</label>
      <input type="number" step={step} className={inputClass} value={s[k]} onChange={(e) => num(k)(e.target.value)}/>
      {hint && <p className="text-[10px] text-text-muted mt-1">{hint}</p>}
    </div>
  );

  return (
    <ResourcePage
      parentHref="/dashboard/library/publishing"
      parentLabel="Back to Publishing"
      color={COLOR}
      tag="Publishing · Calculator"
      title="Publishing Royalty Calculator"
      intro="Estimate writer + publisher income from streaming, sync, physical. Models split structure, admin fee, co-write share. Anchor for catalogue valuation."
      toolbar={<><SaveButton toolSlug="royalty-calculator" storageKey={STORAGE_KEY} title={`Royalty Calculator — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
          <button onClick={() => setS(empty)} className="text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1"><RotateCcw size={13}/> Reset</button>          </>
          }
      next={{ href: "/dashboard/library/publishing/cover-mech-license", label: "Cover Song Mech-License" }}
    >
      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Streaming</p>
        <div className="grid grid-cols-2 gap-4">
          <N label="Streams (period)" k="streams"/>
          <N label="Avg per-stream (USD)" k="perStream" step={0.0001} hint="Spotify ~0.0035, Apple ~0.008, etc."/>
          <N label="Mechanical % of streaming" k="mechShare" step={1} hint="MLC/HFA carve-out, typically ~21%"/>
          <N label="Performance % of streaming" k="perfShare" step={1} hint="PRO income from on-demand streaming"/>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Sync & physical</p>
        <div className="grid grid-cols-2 gap-4">
          <N label="Sync income (period)" k="syncIncome"/>
          <N label="Sync writer split %" k="syncSplitWriter" step={1}/>
          <N label="Sync publisher split %" k="syncSplitPublisher" step={1}/>
          <N label="Physical / download income" k="physicalIncome"/>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Structure</p>
        <div className="grid grid-cols-2 gap-4">
          <N label="Writer share of song" k="writerSharePct" step={1} hint="Industry standard: 50%"/>
          <N label="Publisher share of song" k="publisherSharePct" step={1} hint="Industry standard: 50%"/>
          <N label="Publisher admin fee %" k="publisherAdminFee" step={0.5} hint="On admin / co-pub deals"/>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: COLOR }}>Your share (co-writes / co-pub)</p>
        <div className="grid grid-cols-2 gap-4">
          <N label="Your % of writer share" k="yourWriterShareOfSong" step={1} hint="Multi-writer? Your slice of total writer share"/>
          <N label="Your % of publisher share" k="yourPublisherShareOfSong" step={1} hint="Co-pub? Your slice of total publisher share"/>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6" style={{ borderColor: `${COLOR}40` }}>
        <p className="text-[11px] font-black uppercase tracking-widest mb-3" style={{ color: COLOR }}>Income breakdown</p>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2 text-sm">
            <p className="text-[11px] font-black uppercase tracking-wider text-text-muted">Writer side (total song)</p>
            <div className="flex justify-between"><span className="text-text-muted">Streaming</span><span className="font-semibold">{fmt(calc.writerStream)}</span></div>
            <div className="flex justify-between"><span className="text-text-muted">Sync</span><span className="font-semibold">{fmt(calc.writerSync)}</span></div>
            <div className="flex justify-between"><span className="text-text-muted">Physical / DL</span><span className="font-semibold">{fmt(calc.writerPhysical)}</span></div>
            <div className="flex justify-between border-t border-border pt-2"><span className="font-bold">Writer total</span><span className="font-bold" style={{ color: COLOR }}>{fmt(calc.writerTotal)}</span></div>
          </div>
          <div className="space-y-2 text-sm">
            <p className="text-[11px] font-black uppercase tracking-wider text-text-muted">Publisher side (after admin)</p>
            <div className="flex justify-between"><span className="text-text-muted">Streaming gross</span><span className="font-semibold">{fmt(calc.pubGross)}</span></div>
            <div className="flex justify-between"><span className="text-text-muted">Less admin {s.publisherAdminFee}%</span><span className="font-semibold">−{fmt(calc.pubAdmin)}</span></div>
            <div className="flex justify-between"><span className="text-text-muted">Sync</span><span className="font-semibold">{fmt(calc.pubSync)}</span></div>
            <div className="flex justify-between"><span className="text-text-muted">Physical / DL</span><span className="font-semibold">{fmt(calc.pubPhysical)}</span></div>
            <div className="flex justify-between border-t border-border pt-2"><span className="font-bold">Publisher total</span><span className="font-bold" style={{ color: COLOR }}>{fmt(calc.pubTotal)}</span></div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 mt-4 border-t border-border text-center">
          <div>
            <p className="text-xs text-text-muted mb-1">Your writer share</p>
            <p className="font-bold text-text-primary">{fmt(calc.yourWriterShare)}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted mb-1">Your publisher share</p>
            <p className="font-bold text-text-primary">{fmt(calc.yourPublisherShare)}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted mb-1" style={{ color: COLOR }}>Your total</p>
            <p className="text-2xl font-black" style={{ color: COLOR }}>{fmt(calc.yourTotal)}</p>
          </div>
        </div>
      </section>
    </ResourcePage>
  );
}
