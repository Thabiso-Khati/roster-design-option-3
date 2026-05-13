"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ChevronDown, Printer, ExternalLink } from "lucide-react";
import { useLocale } from "@/context/locale-context";
import { getCountryResources, hasCountryData } from "@/lib/country-resources";

const COLOR = "#8B5CF6";

const RIGHTS_HOLDERS = [
  { type: "Songwriter / Composer / Lyricist", owns: "The composition, melody, lyrics, and musical structure", earns: "Public performance royalties, mechanical royalties, sync fees, YouTube Content ID (composition share)" },
  { type: "Music Publisher", owns: "Administers the composition on behalf of the songwriter", earns: "Publisher's share of public performance, mechanical, and sync royalties" },
  { type: "Recording Artist / Performer", owns: "Their specific recorded performance on a sound recording", earns: "Neighbouring rights royalties, streaming income (via label or distributor), sync income (master side)" },
  { type: "Session Musician / Background Performer", owns: "Their performance on a specific recording", earns: "Neighbouring rights royalties (via your country's neighbouring rights organisation or AIRCO)" },
  { type: "Record Label / Master Owner", owns: "The sound recording (master) itself", earns: "Master licensing fees, streaming income, sync fees (master side), neighbouring rights (maker share)" },
  { type: "Music Producer", owns: "May own a share of the sound recording or have a defined royalty entitlement", earns: "Producer royalty (negotiated per deal), potentially neighbouring rights if registered as a maker" },
];

export default function Royalties101Page() {
  const { country } = useLocale();
  const res = getCountryResources(country);
  const isKnownCountry = hasCountryData(country);

  const ROYALTY_TYPES = [
    {
      id: "performance",
      num: "1",
      title: "Public Performance Royalties",
      color: "#EC4899",
      what: "Generated whenever a composition is performed or broadcast publicly — on radio, television, in a restaurant, at an airport, in a retail store, at a live concert, or streamed online. This covers the composition (the song itself), not the recording.",
      who: "Songwriters, composers, lyricists, and music publishers who own a share of the composition.",
      collect: res.performanceRights,
      globalNote: "Public performance rights are collected by CMOs (Collective Management Organisations) who are members of CISAC — the international federation of authors' societies. If you are registered in your home country's CMO, royalties earned abroad flow back to you automatically through bilateral agreements.",
    },
    {
      id: "neighbouring",
      num: "2",
      title: "Neighbouring Rights Royalties",
      color: "#8B5CF6",
      what: "Neighbouring rights are separate from compositional royalties and are paid to the people who made the recording — not the people who wrote the song. They are triggered when a sound recording is broadcast or played publicly, including radio airplay and digital streaming.",
      who: "Recording artists (featured and session performers), background vocalists, instrumentalists, and record labels or makers who own the sound recording.",
      collect: res.neighbouringRights ?? {
        name: "AIRCO (African Independent Rights Collection Organisation)",
        abbr: "AIRCO",
        url: "https://airco.africa",
        note: "Neighbouring rights collection is still developing in many African markets. AIRCO collects and distributes international neighbouring rights for independent African artists. PPL (UK), SCPP (France), and GVL (Germany) also collect on behalf of African artists in their territories.",
      },
      globalNote: "Neighbouring rights systems are still developing across much of Africa. RAAP (Ireland), PPL (UK), and SCPP (France) reciprocally collect in many African territories and distribute back to registered artists in your country.",
    },
    {
      id: "mechanical",
      num: "3",
      title: "Mechanical (Reproduction) Royalties",
      color: "#F59E0B",
      what: "Generated when a composition is reproduced — when your song is pressed onto a CD, made available for download, or streamed on a platform. The 'mechanical' label is historical (from the era of player pianos) but applies equally to digital reproduction today.",
      who: "Songwriters, composers, and music publishers who own the composition. You earn mechanical royalties on your song even if someone else records a cover version.",
      collect: res.mechanicalRights ?? res.performanceRights,
      globalNote: "For international digital mechanical royalties, ensure your compositions are registered with your home country's CMO so that BIEM (the international mechanical rights bureau) can collect on your behalf in foreign territories.",
    },
    {
      id: "streaming",
      num: "4",
      title: "Digital Streaming & Performance Royalties",
      color: "#10B981",
      what: "When your music is streamed on platforms such as Spotify, Apple Music, Boomplay, Audiomack, Deezer, TIDAL, or YouTube Music, multiple royalty streams are triggered simultaneously: a public performance royalty (for the composition), a mechanical royalty (for the composition), and a recording royalty (for the sound recording, paid via your distributor or label deal).",
      who: "Songwriters and publishers (public performance + mechanical). Recording artists and labels (recording royalty via distributor). Featured and session performers may also earn neighbouring rights if registered with your country's neighbouring rights organisation.",
      collect: null, // special handling in UI
      globalNote: `These are typically ${res.mechanicalRights ? "three" : "two"} separate payment streams that each require separate registration. Your distributor pays the recording royalty; your CMO pays the compositional royalties; your neighbouring rights org pays the performer royalty.`,
    },
    {
      id: "sync",
      num: "5",
      title: "Sync Licensing Fees",
      color: "#06B6D4",
      what: "A synchronisation licence (sync licence) is a one-time or ongoing fee paid when your music is licensed for use alongside visual content — in a film, television show, advertisement, video game, online content, or documentary. Sync fees are negotiated directly (not collected via a PRO) and can range from a small regional fee to significant sums for major international placements.",
      who: "Both the composition owner (songwriter / publisher) and the sound recording owner (artist / label) must agree and be paid separately for any sync use. A single sync placement generates two fees: a master licence fee and a synchronisation licence fee.",
      collect: null, // special handling
      globalNote: "African streaming content (Netflix Africa, Showmax, Canal+) and the pan-African advertising industry are creating significant new sync opportunities. Retain publishing rights wherever possible — buy-outs reduce your long-term earning potential.",
    },
  ];

  const [openIds, setOpenIds] = useState<Set<string>>(new Set(["performance"]));
  const toggle = (id: string) => setOpenIds(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  return (
    <div className="animate-fade-in max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-text-muted mb-6">
        <Link href="/dashboard/library" className="hover:text-text-primary transition-colors">Toolkit</Link>
        <ChevronRight size={12}/>
        <Link href="/dashboard/library/money" className="hover:text-text-primary transition-colors">Money Matters</Link>
        <ChevronRight size={12}/>
        <span className="text-text-primary">Royalties 101</span>
      </div>

      {/* Header */}
      <div className="glass-card rounded-2xl p-7 mb-8" style={{ borderColor: "#8B5CF625" }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: COLOR }}>
              {res.flag} {res.country} · Music Royalties · 2026
            </p>
            <h1 className="text-2xl font-black text-text-primary mb-1">Royalties 101</h1>
            <p className="text-sm font-semibold mb-2" style={{ color: COLOR }}>Know what you are owed. Know who collects it. Know how to register.</p>
            <p className="text-sm text-text-muted leading-relaxed max-w-xl">
              Royalties are the ongoing income generated when your music is used — streamed, broadcast, performed, reproduced, or licensed. Many artists leave significant money uncollected every year simply because they have not registered with the right organisations.
            </p>
            {!isKnownCountry && country && (
              <p className="text-xs text-text-muted mt-2 p-2 rounded-lg" style={{ backgroundColor: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)" }}>
                We don't yet have specific data for <strong>{country}</strong> — showing South African resources as a reference. Update your country in{" "}
                <Link href="/dashboard/settings" className="underline hover:text-brand transition-colors">Settings</Link>.
              </p>
            )}
          </div>
          <button type="button" onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold flex-shrink-0 transition-all hover:opacity-80" style={{ backgroundColor: `${COLOR}20`, color: COLOR, border: `1px solid ${COLOR}30` }}>
            <Printer size={15}/><span className="hidden sm:inline">Save as PDF</span>
          </button>
        </div>
      </div>

      {/* Country-specific registration priority card */}
      <div className="glass-card rounded-xl p-5 mb-8 flex items-start gap-3" style={{ borderColor: "rgba(201,168,76,0.25)", backgroundColor: "rgba(201,168,76,0.05)" }}>
        <span className="text-lg flex-shrink-0">⚡</span>
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-brand mb-1">{res.flag} {res.country} — Priority Action</p>
          <p className="text-sm text-text-primary leading-relaxed">{res.registerNote}</p>
        </div>
      </div>

      {/* Who is entitled */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-5 rounded-full" style={{ backgroundColor: COLOR }}/>
          <h2 className="text-base font-black text-text-primary">Who Is Entitled to Royalties?</h2>
        </div>
        <div className="glass-card rounded-xl overflow-hidden overflow-x-auto">
          <div className="px-4 py-2.5 border-b border-border grid grid-cols-3 gap-3 min-w-[480px]" style={{ backgroundColor: `${COLOR}10` }}>
            <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: COLOR }}>Rights Holder</p>
            <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: COLOR }}>What They Own</p>
            <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: COLOR }}>Royalties They Earn</p>
          </div>
          <div className="divide-y divide-border min-w-[480px]">
            {RIGHTS_HOLDERS.map(r => (
              <div key={r.type} className="grid grid-cols-3 gap-3 px-4 py-3 hover:bg-surface-2 transition-colors">
                <p className="text-xs font-semibold text-text-primary leading-snug">{r.type}</p>
                <p className="text-xs text-text-muted leading-snug">{r.owns}</p>
                <p className="text-xs text-text-muted leading-snug">{r.earns}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Who pays */}
      <div className="glass-card rounded-xl p-5 mb-8" style={{ borderColor: "rgba(201,168,76,0.2)", backgroundColor: "rgba(201,168,76,0.04)" }}>
        <p className="text-xs font-bold text-brand uppercase tracking-widest mb-2">Who Pays? — Music Users in {res.country} & Africa</p>
        <p className="text-sm text-text-muted leading-relaxed mb-3">By law, any business or platform that uses music must pay for the right to do so. These music users pay royalty collecting organisations, who then distribute the money to rights holders. <span className="text-text-primary font-semibold">If you are not registered, you cannot receive your share — even if your music is actively being used.</span></p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: "Broadcast", items: ["National & regional TV broadcasters", "Community & campus radio stations", "Satellite & online radio"] },
            { label: "Digital Platforms", items: res.keyDSPs.slice(0, 4).concat(["+ 2,000 other platforms globally"]) },
            { label: "Public Venues & Businesses", items: ["Restaurants, bars, clubs, gyms", "Malls, hotels, airlines, casinos", "Cinemas, sports venues, retail stores"] },
          ].map(cat => (
            <div key={cat.label} className="rounded-lg p-3" style={{ backgroundColor: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.15)" }}>
              <p className="text-[10px] font-black uppercase tracking-wider text-brand mb-2">{cat.label}</p>
              {cat.items.map(i => <p key={i} className="text-xs text-text-muted leading-snug mb-1">{i}</p>)}
            </div>
          ))}
        </div>
      </div>

      {/* 5 Royalty Types */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-5 rounded-full" style={{ backgroundColor: COLOR }}/>
          <h2 className="text-base font-black text-text-primary">The 5 Types of Royalties — {res.flag} {res.country} Guide</h2>
        </div>
        <div className="space-y-3">
          {ROYALTY_TYPES.map(r => {
            const isOpen = openIds.has(r.id);
            return (
              <div key={r.id} id={`royalty-${r.id}`} className="glass-card rounded-xl overflow-hidden">
                <button onClick={() => toggle(r.id)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-surface-2 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black w-6 flex-shrink-0" style={{ color: r.color }}>{r.num}</span>
                    <span className="font-bold text-text-primary">{r.title}</span>
                  </div>
                  <ChevronDown size={16} className={`flex-shrink-0 text-text-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}/>
                </button>

                {isOpen && (
                  <div className="border-t border-border">
                    {/* What / Who rows */}
                    {[
                      { label: "What it is", value: r.what },
                      { label: "Who earns it", value: r.who },
                    ].map(row => (
                      <div key={row.label} className="grid grid-cols-1 sm:grid-cols-4 gap-0 border-b border-border">
                        <div className="px-5 py-3 sm:col-span-1" style={{ backgroundColor: `${r.color}06` }}>
                          <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: r.color }}>{row.label}</p>
                        </div>
                        <div className="px-5 py-3 sm:col-span-3">
                          <p className="text-sm text-text-muted leading-relaxed">{row.value}</p>
                        </div>
                      </div>
                    ))}

                    {/* Country collect row — special for streaming and sync */}
                    {r.id === "streaming" && (
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-0 border-b border-border">
                        <div className="px-5 py-3 sm:col-span-1" style={{ backgroundColor: `${r.color}06` }}>
                          <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: r.color }}>Collect via</p>
                        </div>
                        <div className="px-5 py-3 sm:col-span-3 space-y-2">
                          <div className="flex items-start gap-2">
                            <span className="text-xs font-bold text-text-primary w-24 flex-shrink-0">Performance</span>
                            <span className="text-xs text-text-muted">{res.performanceRights.abbr} ({res.performanceRights.name})</span>
                          </div>
                          {res.mechanicalRights && (
                            <div className="flex items-start gap-2">
                              <span className="text-xs font-bold text-text-primary w-24 flex-shrink-0">Mechanical</span>
                              <span className="text-xs text-text-muted">{res.mechanicalRights.abbr !== res.performanceRights.abbr ? `${res.mechanicalRights.abbr} (${res.mechanicalRights.name})` : "Same org as performance"}</span>
                            </div>
                          )}
                          <div className="flex items-start gap-2">
                            <span className="text-xs font-bold text-text-primary w-24 flex-shrink-0">Recording</span>
                            <span className="text-xs text-text-muted">Your digital distributor (DistroKid, TuneCore, Africori, etc.)</span>
                          </div>
                          {res.neighbouringRights && (
                            <div className="flex items-start gap-2">
                              <span className="text-xs font-bold text-text-primary w-24 flex-shrink-0">Neighbouring</span>
                              <span className="text-xs text-text-muted">{res.neighbouringRights.abbr !== res.performanceRights.abbr ? res.neighbouringRights.abbr : "Same org as performance"} / AIRCO for international</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {r.id === "sync" && (
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-0 border-b border-border">
                        <div className="px-5 py-3 sm:col-span-1" style={{ backgroundColor: `${r.color}06` }}>
                          <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: r.color }}>Collect via</p>
                        </div>
                        <div className="px-5 py-3 sm:col-span-3">
                          <p className="text-sm text-text-muted leading-relaxed">There is no central collection body for sync — fees are negotiated directly between the music user (production company, ad agency, filmmaker) and the rights holders. A music lawyer, manager, or sync agent typically handles negotiations.</p>
                        </div>
                      </div>
                    )}

                    {r.collect && (
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-0 border-b border-border">
                        <div className="px-5 py-3 sm:col-span-1" style={{ backgroundColor: `${r.color}06` }}>
                          <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: r.color }}>Collect in {res.flag} {res.country}</p>
                        </div>
                        <div className="px-5 py-3 sm:col-span-3">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-sm font-bold text-text-primary">{r.collect.name}</span>
                            {r.collect.url && (
                              <a href={r.collect.url} target="_blank" rel="noopener noreferrer"
                                className="text-[10px] font-semibold px-2 py-0.5 rounded flex items-center gap-1 hover:opacity-80 transition-opacity"
                                style={{ color: r.color, backgroundColor: `${r.color}15` }}>
                                {r.collect.abbr} <ExternalLink size={9}/>
                              </a>
                            )}
                          </div>
                          <p className="text-sm text-text-muted leading-relaxed">{r.collect.note}</p>
                        </div>
                      </div>
                    )}

                    {/* African/global note */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-0">
                      <div className="px-5 py-3 sm:col-span-1" style={{ backgroundColor: `${r.color}06` }}>
                        <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: r.color }}>Africa note</p>
                      </div>
                      <div className="px-5 py-3 sm:col-span-3">
                        <p className="text-sm text-text-muted leading-relaxed">{r.globalNote}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tax note for the country */}
      <div className="glass-card rounded-xl p-5 mb-8" style={{ borderColor: "rgba(201,168,76,0.2)", backgroundColor: "rgba(201,168,76,0.04)" }}>
        <p className="text-xs font-bold text-brand uppercase tracking-widest mb-2">{res.flag} {res.country} — Tax & Business Registration</p>
        <p className="text-sm text-text-muted leading-relaxed">{res.taxNote}</p>
      </div>

      {/* Industry bodies */}
      {res.industryBodies.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-5 rounded-full" style={{ backgroundColor: COLOR }}/>
            <h2 className="text-base font-black text-text-primary">{res.flag} {res.country} — Key Industry Bodies</h2>
          </div>
          <div className="glass-card rounded-xl overflow-hidden divide-y divide-border">
            {res.industryBodies.map(body => (
              <div key={body.name} className="flex items-start gap-4 px-5 py-3.5 hover:bg-surface-2 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-text-primary">{body.name}</span>
                    {body.abbr && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: COLOR, backgroundColor: `${COLOR}15` }}>{body.abbr}</span>}
                  </div>
                  <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{body.role}</p>
                </div>
                {body.url && (
                  <a href={body.url} target="_blank" rel="noopener noreferrer"
                    className="flex-shrink-0 flex items-center gap-1 text-xs font-semibold hover:opacity-70 transition-opacity mt-0.5"
                    style={{ color: COLOR }}>
                    Visit <ExternalLink size={10}/>
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grants */}
      {res.grants.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-5 rounded-full" style={{ backgroundColor: COLOR }}/>
            <h2 className="text-base font-black text-text-primary">{res.flag} {res.country} — Grants & Funding</h2>
          </div>
          <div className="glass-card rounded-xl overflow-hidden divide-y divide-border">
            {res.grants.map(g => (
              <div key={g.name} className="flex items-start gap-4 px-5 py-3.5 hover:bg-surface-2 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-text-primary">{g.name}</p>
                  <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{g.note}</p>
                </div>
                {g.url && (
                  <a href={g.url} target="_blank" rel="noopener noreferrer"
                    className="flex-shrink-0 flex items-center gap-1 text-xs font-semibold hover:opacity-70 transition-opacity mt-0.5"
                    style={{ color: COLOR }}>
                    Visit <ExternalLink size={10}/>
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="glass-card rounded-xl p-4 mb-8 flex items-start gap-3" style={{ borderColor: "rgba(239,68,68,0.15)", backgroundColor: "rgba(239,68,68,0.04)" }}>
        <span className="text-sm flex-shrink-0">⚠️</span>
        <p className="text-xs text-text-muted leading-relaxed">Royalty laws and collection structures differ by country and change frequently. Always seek the advice of a qualified music lawyer or industry professional for specific guidance. Nothing in this document constitutes financial or legal advice. Update your country in <Link href="/dashboard/settings" className="underline hover:text-brand transition-colors">Settings</Link> to see resources relevant to your market.</p>
      </div>

      <Link href="/dashboard/library/money" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors">
        <ChevronLeft size={15}/>Back to Money Matters
      </Link>
    </div>
  );
}
