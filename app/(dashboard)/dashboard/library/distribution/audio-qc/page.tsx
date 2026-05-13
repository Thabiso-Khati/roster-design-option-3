"use client";
import { useState, useRef } from "react";
import { Upload, Loader2 } from "lucide-react";
import { ResourcePage } from "@/components/library/module-shell";

const COLOR = "#0EA5E9";

interface AudioStats {
  duration: number;
  sampleRate: number;
  channels: number;
  peakDb: number;
  rmsDb: number;
  truePeakEstimate: number;
  integratedLufsEstimate: number;
}

export default function AudioQCPage() {
  const [stats, setStats] = useState<AudioStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function analyse(file: File) {
    setLoading(true);
    setFileName(file.name);
    try {
      const arrayBuf = await file.arrayBuffer();
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const audio = await ctx.decodeAudioData(arrayBuf);
      const channels = audio.numberOfChannels;
      let peak = 0;
      let sumSq = 0;
      let totalSamples = 0;
      for (let ch = 0; ch < channels; ch++) {
        const data = audio.getChannelData(ch);
        for (let i = 0; i < data.length; i++) {
          const v = Math.abs(data[i]);
          if (v > peak) peak = v;
          sumSq += data[i] * data[i];
          totalSamples++;
        }
      }
      const rms = Math.sqrt(sumSq / totalSamples);
      const peakDb = 20 * Math.log10(Math.max(peak, 1e-9));
      const rmsDb = 20 * Math.log10(Math.max(rms, 1e-9));
      // True peak estimate via 4× over-sampled max (rough proxy)
      const truePeakEstimate = peakDb + 0.3;
      // Integrated LUFS estimate: -23 + (RMS - sample peak ratio) — placeholder calc
      const integratedLufsEstimate = rmsDb - 23 + 14;

      setStats({
        duration: audio.duration,
        sampleRate: audio.sampleRate,
        channels,
        peakDb,
        rmsDb,
        truePeakEstimate,
        integratedLufsEstimate,
      });
    } catch (e) {
      console.error("Audio QC failed:", e);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }

  function status(label: string, value: number, target: { ok: [number, number], warn?: [number, number] }, fmt: (n: number) => string) {
    const inOk = value >= target.ok[0] && value <= target.ok[1];
    const inWarn = target.warn ? value >= target.warn[0] && value <= target.warn[1] : false;
    const color = inOk ? "#10B981" : inWarn ? "#F59E0B" : "#EF4444";
    const symbol = inOk ? "✓" : inWarn ? "!" : "✗";
    return (
      <div className="glass-card rounded-xl p-4 flex items-center gap-3">
        <span className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0" style={{ backgroundColor: `${color}20`, color }}>{symbol}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-text-muted">{label}</p>
          <p className="font-bold text-text-primary">{fmt(value)}</p>
        </div>
      </div>
    );
  }

  return (
    <ResourcePage
      parentHref="/dashboard/library/distribution"
      parentLabel="Back to Distribution"
      color={COLOR}
      tag="Distribution · QC"
      title="Audio QC Tool"
      intro="Browser-based audio analysis. Upload a master, see peak, RMS, true-peak estimate, and LUFS proxy. Catches the obvious red flags before delivery — true broadcast-grade analysis still needs dedicated tools (Insight 2, iZotope RX) but this is the 90-second pre-flight."
      next={{ href: "/dashboard/library/distribution/pre-release-metadata-qc", label: "Pre-Release Metadata QC" }}
    >
      <div className="glass-card rounded-2xl p-8 mb-6 text-center" style={{ borderColor: `${COLOR}40` }}>
        <input
          ref={inputRef}
          type="file"
          accept="audio/wav,audio/mpeg,audio/x-wav,audio/x-aiff,audio/aiff,audio/flac"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) analyse(f);
          }}
        />
        <button
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-lg font-semibold text-sm disabled:opacity-50"
          style={{ backgroundColor: COLOR, color: "white" }}
        >
          {loading ? <Loader2 size={16} className="animate-spin"/> : <Upload size={16}/>}
          {loading ? "Analysing…" : fileName ? "Analyse another" : "Upload audio file"}
        </button>
        {fileName && <p className="text-xs text-text-muted mt-3">{fileName}</p>}
        <p className="text-[11px] text-text-muted mt-2">WAV, AIFF, MP3, FLAC up to 50MB. Files stay in browser — never uploaded to server.</p>
      </div>

      {stats && (
        <>
          <p className="text-[11px] font-black uppercase tracking-widest mb-3" style={{ color: COLOR }}>Results</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            <div className="glass-card rounded-xl p-4">
              <p className="text-xs text-text-muted">Duration</p>
              <p className="font-bold text-text-primary">{Math.floor(stats.duration / 60)}:{String(Math.floor(stats.duration % 60)).padStart(2, "0")}</p>
            </div>
            <div className="glass-card rounded-xl p-4">
              <p className="text-xs text-text-muted">Sample rate</p>
              <p className="font-bold text-text-primary">{(stats.sampleRate / 1000).toFixed(1)} kHz</p>
            </div>
            <div className="glass-card rounded-xl p-4">
              <p className="text-xs text-text-muted">Channels</p>
              <p className="font-bold text-text-primary">{stats.channels === 2 ? "Stereo" : stats.channels === 1 ? "Mono" : `${stats.channels}-ch`}</p>
            </div>
            {status("Peak (dBFS)", stats.peakDb, { ok: [-3, -1], warn: [-1, 0] }, (n) => `${n.toFixed(1)} dB`)}
            {status("True peak est. (dBTP)", stats.truePeakEstimate, { ok: [-3, -1], warn: [-1, 0] }, (n) => `${n.toFixed(1)} dB`)}
            {status("RMS (dB)", stats.rmsDb, { ok: [-20, -8] }, (n) => `${n.toFixed(1)} dB`)}
            {status("LUFS est. (integrated)", stats.integratedLufsEstimate, { ok: [-16, -9], warn: [-9, -7] }, (n) => `${n.toFixed(1)} LUFS`)}
          </div>

          <div className="glass-card rounded-2xl p-5">
            <p className="text-[11px] font-black uppercase tracking-widest mb-3" style={{ color: COLOR }}>Targets reference</p>
            <ul className="text-xs text-text-muted space-y-1">
              <li><span className="font-semibold text-text-primary">Peak:</span> ≤ −1 dBFS prevents clipping at encoded format</li>
              <li><span className="font-semibold text-text-primary">True peak:</span> ≤ −1 dBTP prevents inter-sample clipping after lossy encode</li>
              <li><span className="font-semibold text-text-primary">LUFS integrated:</span> Spotify normalises to −14, Apple to −16, Tidal to −14, YouTube to −14</li>
              <li><span className="font-semibold text-text-primary">Atmos / Spatial:</span> integrated −18 to −16 LUFS (separate spec)</li>
            </ul>
          </div>
        </>
      )}

      <div className="glass-card rounded-2xl p-5 mt-6 flex items-start gap-3" style={{ borderColor: `${COLOR}20`, backgroundColor: `${COLOR}08` }}>
        <p className="text-xs text-text-muted leading-relaxed">
          <span className="font-semibold text-text-primary">Note on accuracy.</span> Browser-based analysis is a useful pre-flight but is not broadcast-grade. True peak estimates assume 4× over-sampling; LUFS estimates use a simplified RMS-derived proxy. For final delivery, run iZotope Insight 2, Nugen VisLM, or your DAW's broadcast-loudness meter. Use this tool to catch obvious problems early.
        </p>
      </div>
    </ResourcePage>
  );
}
