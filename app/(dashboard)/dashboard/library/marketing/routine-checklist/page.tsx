"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Printer, RotateCcw } from "lucide-react";
import { useLocale } from "@/context/locale-context";
import { getCountryResources } from "@/lib/country-resources";
import { SaveButton } from "@/components/ui/save-button";
import { ExportButton } from "@/components/ui/export-button";

const STORAGE_KEY = "roster_marketing_checklist_v1";

const SECTIONS = [
  {
    id: "daily",
    title: "Daily Tasks",
    cadence: "Every working day",
    color: "#8B5CF6",
    description: "These are the foundation of sustained audience growth.",
    rows: [
      { category: "Short-Form Video", tasks: [
        "Post or schedule 1 TikTok, trends, BTS, studio content, original sounds",
        "Post or schedule 1 Instagram Reel, repurpose or create fresh",
        "Post or schedule 1 YouTube Short, performance clips, snippets, lifestyle",
        "Engage with comments across all short-form content within 2 hours of posting",
      ]},
      { category: "Social Engagement", tasks: [
        "Reply to comments and DMs on Instagram, TikTok & Facebook",
        "Post 2–3 Instagram Stories, polls, behind-the-scenes, Q&As, countdowns",
        "Like and comment on posts from peers, collaborators and key industry accounts",
        "Share at least 1 piece of fan-generated content or repost a tag",
      ]},
      { category: "Content Monitoring", tasks: [
        "Check trending sounds on TikTok SA and adapt if relevant",
        "Monitor Instagram Explore & TikTok 'For You' page for content inspiration",
        "Review overnight analytics (reach, saves, shares), note what outperformed",
        "Check for press mentions, blog features or playlist adds",
      ]},
      { category: "Admin & Money", tasks: [
        "Review daily revenue (streaming, merch, sync enquiries)",
        "Flag and respond to booking enquiries or collaboration proposals",
        "Update income/expense log if any transactions occurred",
      ]},
    ],
  },
  {
    id: "weekly",
    title: "Weekly Tasks",
    cadence: "Anchor to specific days",
    color: "#EC4899",
    description: "Consistency builds algorithm trust and audience expectation.",
    rows: [
      { category: "Monday, Content Planning", tasks: [
        "Plan and batch-create content for the week (TikTok, Reels, Shorts, feed posts)",
        "Confirm DSP pitching deadlines, Spotify editorial requires 7 days notice minimum",
        "Write captions, hashtag sets and post scheduling queue for the week",
        "Brief creative team on visuals, graphics or video needed",
      ]},
      { category: "Tuesday, Digital Marketing", tasks: [
        "Review and adjust active paid campaigns (Meta Ads, TikTok Ads, YouTube Ads)",
        "Check Spotify for Artists, streams, saves, playlist additions, listener location",
        "Check Apple Music for Artists, Shazam trends, city data",
        "Review Audiomack & Boomplay dashboards, key metrics for African audience",
      ]},
      { category: "Wednesday, Outreach", tasks: [
        "Pitch new release to 3–5 playlist curators (Spotify, Apple Music, Audiomack, Boomplay)",
        "Reach out to 1–2 media contacts (journalists, bloggers, podcast hosts)",
        "Pursue 1 collaboration or feature conversation with another artist or producer",
        "Send weekly email newsletter or WhatsApp broadcast to fan list",
      ]},
      { category: "Thursday, YouTube & Long-Form", tasks: [
        "Upload or schedule weekly YouTube video (music video, vlog, performance clip, Q&A)",
        "Review YouTube Studio analytics, watch time, CTR, subscriber source",
        "Optimise older video titles, thumbnails or descriptions for better searchability",
        "Post YouTube Community tab update, polls, behind-the-scenes, artwork teasers",
      ]},
      { category: "Friday, Press & Partnerships", tasks: [
        "Respond to outstanding media requests, interview offers or feature pitches",
        "Review and pursue 1 brand partnership or sponsorship opportunity",
        "Update EPK, one-sheet or artist bio if new milestones were reached this week",
        "Check in with distributor, confirm metadata, release schedule, any issues",
      ]},
      { category: "Weekend, Community", tasks: [
        "Post 1 relaxed or personal piece of content (story, poll, fan Q&A, going live)",
        "Go live on Instagram or TikTok, even 15 minutes builds strong connection",
        "Review the week: what content performed best and why?",
        "Prepare the Monday content plan based on this week's data",
      ]},
    ],
  },
];

const MORE_SECTIONS = [
  {
    id: "monthly",
    title: "Monthly Tasks",
    cadence: "Block time in your calendar",
    color: "#F59E0B",
    description: "These larger-effort activities compound over time.",
    rows: [
      { category: "Analytics Review", tasks: [
        "Pull a full cross-platform analytics report, Spotify, Apple Music, YouTube, TikTok, IG, Audiomack, Boomplay",
        "Identify top 3 performing content pieces and reverse-engineer why they worked",
        "Review audience demographic data, age, location, gender breakdown",
        "Check South African city-level data: Johannesburg, Cape Town, Durban, Pretoria performance",
        "Compare monthly streaming revenue (ZAR), identify growth or decline by platform",
      ]},
      { category: "Content & PR", tasks: [
        "Write and publish 1 long-form article, newsletter or press release",
        "Pitch 1 cover story, interview or feature to a major publication (Rolling Stone Africa, City Press, IOL Entertainment, etc.)",
        "Update website with new content, photos, tour dates, streaming links, merch",
        "Host or attend a networking event or industry function",
      ]},
      { category: "Release Management", tasks: [
        "Confirm upcoming release schedule with distributor (DistroKid, Amuse, TuneCore, CD Baby, or direct label)",
        "Submit pre-save campaign for upcoming single or EP",
        "Deliver assets for next release: artwork, bio update, pitch notes, ISRC/ISWC registrations",
        "Submit release to SAMPRA/SAMRO for royalty registration (South Africa)",
      ]},
      { category: "Revenue & Finance", tasks: [
        "Reconcile all income: streaming royalties (ZAR equivalent), performance fees, sync, merch sales",
        "Review accounts payable: studio costs, team fees, advertising spend",
        "Compare actual revenue vs. monthly target, adjust strategy accordingly",
        "Follow up on outstanding invoices or payments from promoters or partners",
      ]},
      { category: "Growth Tactics", tasks: [
        "Launch or refresh 1 fan growth initiative, giveaway, challenge, contest or live event",
        "Seek and collect 3–5 fan testimonials or UGC posts for repurposing",
        "Identify 1–2 new potential strategic partnerships (brand, NGO, festival, playlist network)",
        "Review competitor activity, what are other SA and Pan-African artists doing well?",
      ]},
    ],
  },
  {
    id: "quarterly",
    title: "Quarterly Tasks",
    cadence: "Every 3 months",
    color: "#10B981",
    description: "Zoom out. Evaluate strategy, recalibrate and plan the next campaign cycle.",
    rows: [
      { category: "Strategy Review", tasks: [
        "Conduct a full quarterly performance review across all platforms and revenue streams",
        "Revisit marketing goals, are monthly listeners, follower counts, revenue targets on track?",
        "Revise release strategy for the next quarter based on data insights",
        "Evaluate advertising ROI, which campaigns delivered results at what cost per stream or follower?",
      ]},
      { category: "Campaigns & Releases", tasks: [
        "Plan and confirm release campaign for next quarter (single, EP, album or remix package)",
        "Pitch 1 major press or promotional campaign, radio, TV or digital media buy",
        "Launch a fan appreciation initiative, exclusive content drop, competition or meet & greet",
        "Consider a collaboration or remix release to access a new audience segment",
      ]},
      { category: "Brand & Partnerships", tasks: [
        "Evaluate current brand partnerships, are they adding value?",
        "Pitch 2–3 new brand deals aligned with artist identity (fashion, tech, FMCG, lifestyle)",
        "Review and update management or agency agreements if milestones have been reached",
        "Explore African continental opportunities: Pan-African festivals, DSP editorial pitches in Nigeria, Kenya, Ghana",
      ]},
      { category: "Team & Operations", tasks: [
        "Team performance review, is your manager, publicist, booking agent, or social media manager delivering?",
        "Review quarterly marketing budget (ZAR), reallocate spend based on what is working",
        "Update artist one-sheet, EPK and press kit with new achievements, stats and photos",
        "Plan and confirm touring or live performance commitments for next quarter",
      ]},
    ],
  },
  {
    id: "annual",
    title: "Annual Tasks",
    cadence: "Once a year",
    color: "#06B6D4",
    description: "The big picture. These shape the trajectory of your entire year and career.",
    rows: [
      { category: "Year-End Review", tasks: [
        "Compile a comprehensive annual report, streams, revenue (ZAR), social growth, press coverage, live shows",
        "Identify your top 3 wins and top 3 missed opportunities",
        "Review all content for the year, what resonated, what flopped, what surprised you",
        "Assess audience growth: where are new fans coming from (platforms, markets, countries)?",
      ]},
      { category: "Annual Planning", tasks: [
        "Set annual goals for the coming year (streams, listeners, revenue, awards, touring)",
        "Plan the annual release schedule, singles, EPs, albums, collaborations",
        "Set an annual advertising budget (ZAR) and allocate by platform and campaign type",
        "Identify 1 key market for international expansion, UK, USA, continental Africa or diaspora markets",
      ]},
      { category: "Brand & Relationships", tasks: [
        "Send year-end thank you messages to key industry contacts, collaborators and partners",
        "Review and renew (or exit) all business agreements, management, distribution, sync licensing",
        "Evaluate awards eligibility, SAMA, Channel O, MTV Africa Music Awards, BET Hip Hop Awards",
        "Update long-form bio, press bio, one-sheet and all digital profiles",
      ]},
      { category: "Community", tasks: [
        "Host an annual fan appreciation event or exclusive online content drop",
        "Year-in-review content series, share highlights, growth and gratitude with your audience",
        "Plan a charitable initiative aligned with your brand values",
        "Audit your digital presence: website, streaming profiles, social bios, all must be current",
      ]},
    ],
  },
];

const ALL_SECTIONS = [...SECTIONS, ...MORE_SECTIONS];

const PLATFORMS = [
  { name: "TikTok", use: "Discovery & virality", note: "Most powerful discovery engine in SA. Use trending sounds, original audio and challenges. Post daily for algorithm traction. TikTok LIVE rewards consistency." },
  { name: "Instagram Reels", use: "Engagement & brand", note: "Strongest platform for brand storytelling. Reels drive reach; Stories drive intimacy. Use Collabs feature for cross-audience growth." },
  { name: "YouTube Shorts", use: "Discovery & evergreen", note: "Feeds the YouTube algorithm for your main channel. Use Shorts as teasers for full music videos. YouTube is search-based, titles and descriptions matter enormously." },
  { name: "YouTube (Main)", use: "Revenue & depth", note: "Best long-term monetisation. Upload music videos, vlogs, lyric videos, live sessions. Optimise thumbnails and use chapters in longer videos." },
  { name: "Spotify", use: "Streaming & editorial", note: "Submit via Spotify for Artists minimum 7 days before release. Target editorial playlists: New Music Friday Africa, Afrobeats, Amapiano. Pitch to independent curators too." },
  { name: "Apple Music", use: "Premium audience", note: "Strong in SA urban and diaspora markets. Use Apple Music for Artists for Shazam data. Radio promotion still matters for Apple editorial consideration." },
  { name: "Audiomack", use: "African-first streaming", note: "Critical in West Africa (Nigeria, Ghana) and growing in SA. Free streaming removes the data-cost barrier. Strong for hip hop, Afrobeats and gospel." },
  { name: "Boomplay", use: "Pan-African reach", note: "Largest DSP by monthly active users in Africa. Essential for Nigeria, Kenya, Tanzania, Ghana, Ethiopia. Partner with their editorial team for playlist placement." },
  { name: "WhatsApp/Broadcast", use: "Direct fan contact", note: "Most used app in SA. Build a broadcast list, use it for exclusive drops, show announcements, presales. No algorithm. 100% reach." },
  { name: "Facebook", use: "Community & older demo", note: "Still highly effective for 30+ audience in SA. Facebook Groups and Events are underutilised. Boosts and ads have strong local targeting." },
];

// Build a flat map of all task keys for easy lookup
function taskKey(sectionId: string, rowIdx: number, taskIdx: number) {
  return `${sectionId}:${rowIdx}:${taskIdx}`;
}

function countTasks(section: typeof ALL_SECTIONS[0]) {
  return section.rows.reduce((sum, row) => sum + row.tasks.length, 0);
}

export default function RoutineChecklistPage() {
  const handleExportPDF = () => { window.print(); };
  const { country, currency } = useLocale();
  const res = getCountryResources(country);

  // Replace SA-specific tokens with country-specific equivalents
  const localisedSections = useMemo(() => {
    const saCity = "South African city-level data: Johannesburg, Cape Town, Durban, Pretoria";
    const localCity = `${res.country} city-level data: ${(res.keyCities ?? ["Johannesburg", "Cape Town", "Durban", "Pretoria"]).join(", ")}`;
    const saRoyalty = "Submit release to SAMPRA/SAMRO for royalty registration (South Africa)";
    const localRoyalty = `Submit release to ${res.performanceRights.abbr} for royalty registration (${res.country})`;
    const proAbbr = res.performanceRights.abbr;
    const taxAbbr = res.taxAuthorityAbbr ?? "SARS";

    const replacements: [RegExp, string][] = [
      [/South African city-level data: Johannesburg, Cape Town, Durban, Pretoria/g, localCity],
      [/Submit release to SAMPRA\/SAMRO for royalty registration \(South Africa\)/g, localRoyalty],
      [/\bZAR\b/g, currency],
      [/\(ZAR\)/g, `(${currency})`],
      [/SAMPRA\/SAMRO/g, proAbbr],
      [/SAMRO/g, proAbbr],
      [/\bSARS\b/g, taxAbbr],
    ];

    const applyToString = (s: string) => replacements.reduce((acc, [re, rep]) => acc.replace(re, rep), s);

    const applyToRows = (rows: { category: string; tasks: string[] }[]) =>
      rows.map(row => ({ ...row, tasks: row.tasks.map(applyToString) }));

    const applyToSection = (section: typeof SECTIONS[0]) => ({
      ...section,
      rows: applyToRows(section.rows),
    });

    return {
      sections: SECTIONS.map(applyToSection),
      moreSections: MORE_SECTIONS.map(applyToSection),
    };
  }, [country, currency, res]);

  // checked: set of task keys that are ticked
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setChecked(new Set(JSON.parse(saved)));
    } catch {}
    setLoaded(true);


  fetch('/api/tools/save?slug=routine-checklist')
    .then(r => r.json())
    .then(({ snapshot }) => {
      if (!snapshot?.data) return;
      const _d = snapshot.data as Record<string, unknown>;

      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot.data)); } catch { /* quota */ }
    })
    .catch(() => {});
  }, []);

  const toggle = useCallback((key: string) => {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next))); } catch {}
      return next;
    });
  }, []);

  const handleReset = () => {
    if (confirm("Clear all ticked tasks? This cannot be undone.")) {
      setChecked(new Set());
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const ALL_LOCALE_SECTIONS = [...localisedSections.sections, ...localisedSections.moreSections];
  const totalTasks = ALL_LOCALE_SECTIONS.reduce((sum, s) => sum + countTasks(s), 0);
  const doneCount = checked.size;

  return (
    <>
      {/* Print-specific strikethrough style */}
      <style>{`
        @media print {
          .task-done { text-decoration: line-through !important; opacity: 0.5; }
          .task-check-box { border: 1px solid #999 !important; }
          .task-check-box.is-checked { background: #555 !important; border-color: #555 !important; }
          .task-check-box.is-checked::after {
            content: '✓';
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 9px;
            font-weight: 900;
            line-height: 1;
          }
        }
      `}</style>

      <div className="animate-fade-in max-w-3xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-text-muted mb-6">
          <Link href="/dashboard/library" className="hover:text-text-primary transition-colors">Toolkit</Link>
          <ChevronRight size={12}/>
          <Link href="/dashboard/library/marketing" className="hover:text-text-primary transition-colors">Market Your Artist</Link>
          <ChevronRight size={12}/>
          <span className="text-text-primary">Marketing Routine</span>
        </div>

        {/* Header */}
        <div className="glass-card rounded-2xl p-7 mb-8 no-print" style={{ borderColor: "#8B5CF625" }}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#8B5CF6" }}>{res.flag} {res.country} · Africa & Emerging Markets · 2026</p>
              <h1 className="text-2xl font-black text-text-primary mb-2">Artist Marketing Routine Checklist</h1>
              <p className="text-sm text-text-muted leading-relaxed max-w-xl">
                Your marketing operating system. Tick tasks as you complete them, they are saved automatically. Export via Save as PDF to share a record of what has been done.
              </p>
              {/* Progress bar */}
              {loaded && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-semibold text-text-muted">{doneCount} of {totalTasks} tasks completed</p>
                    {doneCount > 0 && (
                      <button onClick={handleReset}
                        className="flex items-center gap-1 text-[10px] font-semibold text-text-muted hover:text-text-primary transition-colors">
                        <RotateCcw size={10}/>Reset
                      </button>
                    )}
                  </div>
                  <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.round((doneCount / totalTasks) * 100)}%`, backgroundColor: "#8B5CF6" }}
                    />
                  </div>
                </div>
              )}
            </div>
            
          </div>
        </div>

        {/* Print header (only shows on print) */}
        <div className="hidden" style={{ display: "none" }}>
          <style>{`@media print { .print-header { display: block !important; } }`}</style>
          <div className="print-header" style={{ marginBottom: "24px" }}>
            <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#8B5CF6", marginBottom: "4px" }}>
              Africa & Emerging Markets · 2026
            </p>
            <h1 style={{ fontSize: "22px", fontWeight: 900, marginBottom: "4px" }}>Artist Marketing Routine Checklist</h1>
            <p style={{ fontSize: "11px", color: "#555" }}>
              {doneCount} of {totalTasks} tasks completed
            </p>
          </div>
        </div>

        {/* How to use */}
        <div className="glass-card rounded-xl p-5 mb-8 no-print" style={{ borderColor: "rgba(201,168,76,0.2)", backgroundColor: "rgba(201,168,76,0.04)" }}>
          <p className="text-xs font-bold text-brand uppercase tracking-widest mb-2">How to use this checklist</p>
          <p className="text-sm text-text-muted leading-relaxed mb-2">
            Tick each task as you complete it. Your progress saves automatically to this device. When you Save as PDF, completed tasks appear with a strikethrough so you can share a clear record of what has been done.
          </p>
          <p className="text-sm text-text-muted leading-relaxed">
            <span className="text-text-primary font-semibold">Adapt cadences to your team&apos;s bandwidth.</span> A solo independent artist should focus on Daily and Weekly tasks. A managed artist with a team should activate all tiers.
          </p>
        </div>

        {/* Task sections */}
        <div className="space-y-8 mb-10">
          {ALL_LOCALE_SECTIONS.map((section) => {
            const sectionDone = section.rows.flatMap((row, ri) =>
              row.tasks.map((_, ti) => taskKey(section.id, ri, ti))
            ).filter(k => checked.has(k)).length;
            const sectionTotal = countTasks(section);

            return (
              <div key={section.id}>
                <div className="flex items-center gap-3 mb-4">
          <SaveButton toolSlug="routine-checklist" storageKey={STORAGE_KEY} title={`Routine Checklist — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
            <ExportButton onPDF={handleExportPDF} />

                  <div className="w-1 h-5 rounded-full" style={{ backgroundColor: section.color }}/>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base font-black text-text-primary">{section.title}</h2>
                      {loaded && sectionDone > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded"
                          style={{ color: section.color, backgroundColor: `${section.color}15` }}>
                          {sectionDone}/{sectionTotal}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-muted">{section.cadence} · {section.description}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {section.rows.map((row, rowIdx) => (
                    <div key={row.category} className="glass-card rounded-xl overflow-hidden">
                      <div className="px-4 py-2.5 border-b border-border"
                        style={{ backgroundColor: `${section.color}08` }}>
                        <p className="text-xs font-black uppercase tracking-wider" style={{ color: section.color }}>{row.category}</p>
                      </div>
                      <div className="divide-y divide-border">
                        {row.tasks.map((task, taskIdx) => {
                          const key = taskKey(section.id, rowIdx, taskIdx);
                          const done = loaded && checked.has(key);
                          return (
                            <button
                              key={taskIdx}
                              type="button"
                              onClick={() => toggle(key)}
                              className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2"
                            >
                              {/* Checkbox */}
                              <div
                                className={`task-check-box w-4 h-4 rounded flex-shrink-0 mt-0.5 transition-all flex items-center justify-center ${done ? "is-checked" : ""}`}
                                style={{
                                  border: done ? "none" : `1.5px solid ${section.color}50`,
                                  backgroundColor: done ? section.color : "transparent",
                                }}
                              >
                                {done && (
                                  <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                                    <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                )}
                              </div>
                              {/* Task text */}
                              <p className={`task-text text-sm leading-relaxed transition-all ${done ? "task-done line-through opacity-50" : "text-text-muted"}`}>
                                {task}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Platform quick reference */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-5 rounded-full bg-brand"/>
            <h2 className="text-base font-black text-text-primary">Platform Quick Reference, Africa 2026</h2>
          </div>
          <div className="space-y-2">
            {PLATFORMS.map((p) => (
              <div key={p.name} className="glass-card rounded-xl p-4 flex gap-3">
                <div className="flex-shrink-0 pt-0.5">
                  <span className="text-xs font-black px-2 py-1 rounded bg-brand/10 text-brand">{p.name}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-text-primary mb-0.5">{p.use}</p>
                  <p className="text-xs text-text-muted leading-relaxed">{p.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Back + Export */}
        <div className="flex items-center justify-between flex-wrap gap-3 no-print">
          <Link href="/dashboard/library/marketing"
            className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors">
            <ChevronLeft size={15}/>Back to Market Your Artist
          </Link>
          
        </div>
      </div>
    </>
  );
}
