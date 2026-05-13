"use client";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Printer } from "lucide-react";

const COLOR = "#06B6D4";

export default function IsrcUpcPage() {
  return (
    <div className="animate-fade-in max-w-3xl">
      <div className="flex items-center gap-2 text-xs text-text-muted mb-6">
        <Link href="/dashboard/library" className="hover:text-text-primary transition-colors">Toolkit</Link>
        <ChevronRight size={12}/>
        <Link href="/dashboard/library/recording" className="hover:text-text-primary transition-colors">Releasing Music</Link>
        <ChevronRight size={12}/>
        <span className="text-text-primary">ISRC & UPC Codes</span>
      </div>

      <div className="glass-card rounded-2xl p-7 mb-8" style={{ borderColor: `${COLOR}25` }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: COLOR }}>South Africa · 2026</p>
            <h1 className="text-2xl font-black text-text-primary mb-1">ISRC & UPC Codes</h1>
            <p className="text-sm font-semibold mb-2" style={{ color: COLOR }}>How to identify, track, and assign your recordings.</p>
            <p className="text-sm text-text-muted leading-relaxed max-w-xl">
              These codes are not administrative formalities. They are the infrastructure that connects your recordings to royalty collection, streaming analytics, and anti-piracy monitoring globally. Get them right before you release anything.
            </p>
          </div>
          <button type="button" onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold flex-shrink-0 transition-all hover:opacity-80" style={{ backgroundColor: `${COLOR}20`, color: COLOR, border: `1px solid ${COLOR}30` }}><Printer size={15}/><span className="hidden sm:inline">Save as PDF</span></button>
        </div>
      </div>

      {/* ISRC Section */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-5 rounded-full" style={{ backgroundColor: COLOR }}/>
          <h2 className="text-base font-black text-text-primary">The ISRC, International Standard Recording Code</h2>
        </div>
        <div className="glass-card rounded-xl p-5 mb-4">
          <p className="text-sm text-text-muted leading-relaxed mb-4">
            The ISRC is a globally recognised, permanent identifier assigned to a specific sound recording or music video. No two recordings share the same ISRC. When a collecting society, streaming platform, or digital store encounters your music, the ISRC is how it knows which specific recording it is dealing with, who performed it, who owns the master, and where the associated royalties should flow.
          </p>
          <div className="space-y-2 mb-4">
            {[
              "It uniquely identifies a specific recording across every digital store and collecting society globally.",
              "It triggers royalty collection, without a valid ISRC, collecting societies cannot attribute plays or streams to your recording.",
              "It is a central tool in protecting your recordings against piracy and unauthorised use.",
            ].map((item, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-[10px] font-black flex-shrink-0 mt-0.5" style={{ color: COLOR }}>→</span>
                <p className="text-sm text-text-muted leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
          <div className="rounded-lg p-4" style={{ backgroundColor: `${COLOR}08`, border: `1px solid ${COLOR}20` }}>
            <p className="text-xs font-black uppercase tracking-wider mb-2" style={{ color: COLOR }}>ISRC Format, ZA-XXX-YY-NNNNN</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { code: "ZA", desc: "Country code (ZA for South Africa)" },
                { code: "XXX", desc: "Registrant code assigned to the label or artist" },
                { code: "YY", desc: "Year of registration (2-digit)" },
                { code: "NNNNN", desc: "Unique 5-digit sequence number" },
              ].map(item => (
                <div key={item.code} className="flex gap-2">
                  <span className="font-black text-xs w-16 flex-shrink-0" style={{ color: COLOR }}>{item.code}</span>
                  <p className="text-xs text-text-muted">{item.desc}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-text-muted mt-3">
              <span className="font-semibold text-text-primary">Important:</span> Once issued, an ISRC is permanent and must not be reused, even if the recording is re-released, remixed, or remastered. A new version requires a new ISRC.
            </p>
          </div>
        </div>
      </div>

      {/* UPC Section */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-5 rounded-full" style={{ backgroundColor: "#8B5CF6" }}/>
          <h2 className="text-base font-black text-text-primary">The UPC, Universal Product Code</h2>
        </div>
        <div className="glass-card rounded-xl p-5 mb-4">
          <p className="text-sm text-text-muted leading-relaxed mb-4">
            The UPC is a barcode assigned to a commercial product, in music, that means an album, an EP, or a single as a complete release package. Where the ISRC identifies an individual track, the UPC identifies the product containing those tracks as a commercial entity.
          </p>
          <div className="rounded-lg p-4" style={{ backgroundColor: "#8B5CF608", border: "1px solid #8B5CF620" }}>
            <p className="text-xs font-black uppercase tracking-wider mb-2" style={{ color: "#8B5CF6" }}>Rule of Thumb</p>
            <div className="space-y-1.5">
              <p className="text-sm text-text-muted">Single release: <span className="font-semibold text-text-primary">1 ISRC</span> (for the track) + <span className="font-semibold text-text-primary">1 UPC</span> (for the release package)</p>
              <p className="text-sm text-text-muted">10-track album: <span className="font-semibold text-text-primary">10 ISRCs</span> (one per track) + <span className="font-semibold text-text-primary">1 UPC</span> (for the album)</p>
            </div>
          </div>
        </div>
      </div>

      {/* How to get them in SA */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-5 rounded-full" style={{ backgroundColor: "#10B981" }}/>
          <h2 className="text-base font-black text-text-primary">Getting Your Codes in South Africa</h2>
        </div>
        <div className="glass-card rounded-xl overflow-hidden mb-4">
          <div className="px-4 py-2.5 border-b border-border" style={{ backgroundColor: "#10B98108" }}>
            <p className="text-[10px] font-black uppercase tracking-wider text-green-400">ISRC Registration Options</p>
          </div>
          <div className="divide-y divide-border">
            {[
              { method: "Via your digital distributor", detail: "Most self-service platforms (DistroKid, TuneCore, Amuse, CD Baby) automatically assign ISRCs when you upload a release. Confirm they are embedded in your delivered files.", color: "#10B981" },
              { method: "Via RISA (Recording Industry of SA)", detail: "The Recording Industry of South Africa (risa.org.za) is the official ISRC registrant for South Africa. Independent labels and artists can register directly. Your registrant code is permanently assigned to you.", color: "#8B5CF6" },
              { method: "Via your record label", detail: "If you are signed to a label, the label typically holds an ISRC registrant code and will assign ISRCs to your recordings as part of the release process.", color: "#06B6D4" },
            ].map(item => (
              <div key={item.method} className="grid grid-cols-1 sm:grid-cols-3 px-4 py-3 gap-2">
                <p className="text-xs font-black" style={{ color: item.color }}>{item.method}</p>
                <p className="text-sm text-text-muted leading-relaxed sm:col-span-2">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border" style={{ backgroundColor: "#F59E0B08" }}>
            <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: "#F59E0B" }}>UPC / Barcode Registration</p>
          </div>
          <div className="divide-y divide-border">
            {[
              { method: "Via GS1 South Africa", detail: "GS1 South Africa (gs1.org.za) is the official source for UPC / EAN barcodes for physical product. Register as a member to obtain your company prefix and generate product barcodes. Required for any physical retail placement.", color: "#F59E0B" },
              { method: "Via your distributor", detail: "Most digital distributors automatically generate a UPC for each digital release package. This is sufficient for digital-only releases.", color: "#10B981" },
            ].map(item => (
              <div key={item.method} className="grid grid-cols-1 sm:grid-cols-3 px-4 py-3 gap-2">
                <p className="text-xs font-black" style={{ color: item.color }}>{item.method}</p>
                <p className="text-sm text-text-muted leading-relaxed sm:col-span-2">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Critical rules */}
      <div className="glass-card rounded-xl p-5 mb-8" style={{ borderColor: `${COLOR}20`, backgroundColor: `${COLOR}04` }}>
        <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: COLOR }}>Critical Rules, Never Break These</p>
        <div className="space-y-2">
          {[
            "Never reuse an ISRC, even for a remaster, remix, or re-release. Every distinct recording gets its own unique ISRC.",
            "Never submit a release without ISRCs, your royalties cannot be collected without them.",
            "Never submit a release with incorrect metadata, errors propagate across every store and society. Fix them before you distribute, not after.",
            "Embed ISRCs in your audio files before delivery, use your DAW or a metadata editor to embed the ISRC in the file's header, not just in your distributor's form.",
            "Register compositions with SAMRO and CAPASSO before release, ISRCs identify your recordings; SAMRO and CAPASSO registration protects your compositions.",
          ].map((rule, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-[10px] font-black flex-shrink-0 mt-0.5" style={{ color: COLOR }}>→</span>
              <p className="text-sm text-text-muted leading-relaxed">{rule}</p>
            </div>
          ))}
        </div>
      </div>

      <Link href="/dashboard/library/recording" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors">
        <ChevronLeft size={15}/>Back to Releasing Music
      </Link>
    </div>
  );
}
