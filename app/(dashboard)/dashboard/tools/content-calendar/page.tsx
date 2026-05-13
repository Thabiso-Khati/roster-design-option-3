"use client";
import { useState, useEffect } from "react";
import { useToolRestore } from "@/lib/hooks/use-tool-restore";
import Link from "next/link";
import { SaveButton } from "@/components/ui/save-button";
import { ExportButton } from "@/components/ui/export-button";
import {
  ChevronLeft, CalendarDays, ChevronRight, Plus, X, Info,
  Clock, Lightbulb, ExternalLink, AlertCircle,
} from "lucide-react";
const STORAGE_KEY = "roster_cal_entries_v1";

const MODULE_COLOR = "#06B6D4";

type Market = "africa" | "us-uk-eu" | "asia" | "latin";

const MARKETS: { id: Market; label: string; flag: string }[] = [
  { id: "africa",   label: "Africa",       flag: "🌍" },
  { id: "us-uk-eu", label: "US · UK · EU", flag: "🌎" },
  { id: "asia",     label: "Asia",         flag: "🌏" },
  { id: "latin",    label: "Latin",        flag: "🌐" },
];

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

// ─── Moment type ──────────────────────────────────────────────────────────────

interface CulturalMoment {
  month: number;           // 0-indexed
  label: string;
  type: "award" | "festival" | "cultural" | "industry" | "submission";
  markets: Market[];
  // Rich detail fields
  description: string;     // What this moment is
  actionDate?: string;     // When you need to ACT (vs when event happens)
  tip: string;             // Specific manager advice
  deadline?: string;       // Hard deadline if applicable
  contact?: string;        // Submission portal / contact URL
  isActionable?: boolean;  // Does this require a concrete action?
}

// ─── Corrected & enriched moments ────────────────────────────────────────────

const CULTURAL_MOMENTS: CulturalMoment[] = [

  // ── JANUARY ──
  {
    month: 0, label: "New Year Release Window", type: "cultural", markets: ["africa","us-uk-eu","asia","latin"],
    description: "The first two weeks of January are a high-consumption, low-competition release window. Listeners are active, playlists are refreshing, and most major acts are quiet.",
    actionDate: "December — have your release ready and pitched before Christmas",
    tip: "Release January 10–17 for maximum first-week editorial pickup. Avoid Jan 1 (no one is watching). Pitch DSPs by December 10.",
    isActionable: true,
  },
  {
    month: 0, label: "Lunar New Year", type: "cultural", markets: ["asia"],
    description: "The most important cultural moment in East and Southeast Asia. Massive spike in content consumption and gifting-related purchases.",
    actionDate: "2–3 weeks before — localised content should be live",
    tip: "If your artist has any Asian fanbase, create culturally respectful New Year content. Red-themed visuals perform strongly. Avoid releasing heavy or dark content.",
    isActionable: true,
  },
  {
    month: 0, label: "BRIT Awards Nominations", type: "award", markets: ["us-uk-eu"],
    description: "BRIT Award nominations are announced in January, with the ceremony in March. Being nominated or eligible requires prior UK chart or streaming activity.",
    actionDate: "Nominations announced mid-January — monitor eligibility from prior year",
    tip: "If your artist has significant UK streaming numbers, check eligibility. BRIT voters include industry professionals — ensure your artist has UK label/management relationships.",
    contact: "https://brit.co.uk",
  },

  // ── FEBRUARY ──
  {
    month: 1, label: "Grammy Awards Ceremony", type: "award", markets: ["us-uk-eu","africa","latin","asia"],
    description: "The Grammy ceremony takes place in February. IMPORTANT: Submissions for this year's Grammys opened in June of the prior year — if you haven't submitted, it's too late for this cycle.",
    actionDate: "June — submissions open. February = ceremony only.",
    tip: "Use Grammy weekend for content even without a nomination — reaction posts, congratulations to winners in your genre, and 'next year' positioning content all perform well.",
    deadline: "Submissions close September of prior year",
    contact: "https://recordingacademy.com/grammys/submit",
    isActionable: false,
  },
  {
    month: 1, label: "BRIT Awards Ceremony", type: "award", markets: ["us-uk-eu"],
    description: "The UK's biggest music awards. Broadcast on ITV. Strong editorial pull from UK press and playlists around ceremony week.",
    actionDate: "Pitch UK press for context pieces 2 weeks before",
    tip: "If your artist is Nigeria/Ghana-based with UK traction, pitch to UK Afrobeats blogs and playlists the week of the BRITs — massive spike in UK music consumption.",
    contact: "https://brit.co.uk",
  },
  {
    month: 1, label: "Black History Month (US/UK)", type: "cultural", markets: ["us-uk-eu","africa"],
    description: "February is Black History Month in the US and UK. Editorial teams actively seek Black artists for features, playlists, and content partnerships.",
    actionDate: "January — pitch editorial and content partnerships early",
    tip: "Pitch DSP editorial teams and media by Jan 10. Authentic storytelling > performative posting. Spotify, Apple Music, and Amazon Music all run dedicated BHM playlists.",
    isActionable: true,
  },
  {
    month: 1, label: "Valentine's Day Content", type: "cultural", markets: ["africa","us-uk-eu","asia","latin"],
    description: "February 14. Romantic and feel-good content spikes across all platforms. Strong streaming window for love songs and R&B/Afrobeats.",
    actionDate: "Release or repitch love-themed content by Feb 7",
    tip: "If your artist has romantic catalogue tracks, repitch them to editorial playlists by Feb 1. Reels/TikTok of love-themed studio moments perform strongly Jan 30–Feb 14.",
    isActionable: true,
  },
  {
    month: 1, label: "SAMAs (South African Music Awards)", type: "award", markets: ["africa"],
    description: "South Africa's premier music awards. Nominations typically announced January–February. Eligibility based on prior year releases.",
    actionDate: "January — ensure release is registered with RISA",
    tip: "Register releases with RISA (Recording Industry of SA) immediately on release. SAMA eligibility requires proper ISRC registration and chart activity. Submit via RISA portal.",
    contact: "https://risa.org.za",
    isActionable: true,
  },
  {
    month: 1, label: "Headies Awards", type: "award", markets: ["africa"],
    description: "Nigeria's most prestigious music awards, often called the 'Nigerian Grammys'. Categories span Afrobeats, Afropop, hip-hop, Fuji, and gospel.",
    actionDate: "Submissions open November–December of prior year",
    tip: "Ensure your Nigerian releases are properly registered with MAP (Music Artists of Proudly Nigerian). Build relationships with The Headies voting committee year-round.",
    contact: "https://theheadies.com",
  },
  {
    month: 1, label: "Cape Town Jazz Festival", type: "festival", markets: ["africa"],
    description: "Africa's largest jazz festival, held in Cape Town. Attracts 37,000+ attendees and major international and African acts.",
    actionDate: "June–August prior year — booking enquiries",
    tip: "Apply for showcase slots via the official submission portal. The festival is a major networking opportunity even without a slot — attend and work the room.",
    contact: "https://capetownjazzfest.com",
  },
  {
    month: 1, label: "SXSW (Austin, Texas)", type: "festival", markets: ["us-uk-eu"],
    description: "South by Southwest — the world's most important industry conference and festival. A&Rs, managers, booking agents, and press attend from every major market.",
    actionDate: "October prior year — artist applications open",
    tip: "Apply via SXSW official application portal. Even without an official slot, SXSW week is prime networking — book unofficial showcases at nearby venues. Africa Now stage specifically supports African acts.",
    contact: "https://sxsw.com/music/showcase-applications",
    isActionable: true,
  },

  // ── MARCH ──
  {
    month: 2, label: "BRIT Awards Ceremony", type: "award", markets: ["us-uk-eu"],
    description: "The full BRIT Awards broadcast. Strong UK press and playlist activity around this date.",
    actionDate: "2 weeks before — pitch UK editorial",
    tip: "Heavy UK streaming day. If your artist is on any UK playlists, check that profiles are updated and all links are working.",
  },
  {
    month: 2, label: "Coachella (Weekend 1)", type: "festival", markets: ["us-uk-eu","latin"],
    description: "The world's most streamed festival. Artists who perform see major streaming spikes globally. Even non-performing artists see Coachella-adjacent content perform well.",
    actionDate: "Submit for consideration 9–12 months prior",
    tip: "Coachella booking submissions close around April–May for the following April. Work through a US booking agency. If not performing, create 'Coachella energy' content that week — algorithm rewards trending cultural moments.",
    contact: "https://goldenvoice.com",
  },
  {
    month: 2, label: "Africa Day Content Sprint", type: "cultural", markets: ["africa"],
    description: "Africa Day is May 25. March is the time to plan and create content for this moment — editorial pieces, collaborative projects, visual concepts.",
    actionDate: "March — plan. April — produce. May — release.",
    tip: "Brands and DSPs run Africa Day campaigns. Pitch your artist for partnerships in March. Authentic pan-African content outperforms generic posts significantly.",
    isActionable: true,
  },

  // ── APRIL ──
  {
    month: 3, label: "Coachella (Weekend 2)", type: "festival", markets: ["us-uk-eu","latin"],
    description: "Second weekend of Coachella. Streaming spikes continue. Key content window for festival-adjacent posts.",
    tip: "The week after Coachella, editorial teams are actively refreshing playlists. Pitch anything with a festival or summer feel.",
  },
  {
    month: 3, label: "Spotify Fresh Finds Push (Q2)", type: "industry", markets: ["africa","us-uk-eu"],
    description: "Spotify's editorial team refreshes emerging artist focus playlists at the start of Q2. Fresh Finds, New Music Friday, and regional discovery playlists see heavy curation.",
    actionDate: "Submit via Spotify for Artists at least 7 days before release",
    tip: "Pitch late March/early April releases for maximum Fresh Finds eligibility. Include full track metadata, mood tags, and a strong artist bio. Spotify pitching requires a release date set in advance.",
    contact: "https://artists.spotify.com",
    isActionable: true,
  },
  {
    month: 3, label: "MAMA Awards (Asia)", type: "award", markets: ["asia"],
    description: "Mnet Asian Music Awards — Korea's largest music awards. Voting includes global fan participation. Strong social media campaign potential.",
    actionDate: "Voting typically opens September–November",
    tip: "If your artist has K-pop adjacent content or Asian fanbase, drive voting campaigns via fan clubs. MAMA has significant YouTube streaming components.",
    contact: "https://mama.mwave.me",
  },

  // ── MAY ──
  {
    month: 4, label: "Africa Day (May 25)", type: "cultural", markets: ["africa"],
    description: "Africa Day celebrates the founding of the African Union. Major cultural moment for pan-African identity and pride. DSPs, brands, and media run Africa-focused campaigns.",
    actionDate: "March — plan content and pitch partnerships",
    tip: "Pitch Spotify, Apple Music, Boomplay, and Audiomack for Africa Day playlist features by April 1. Create content celebrating your specific country and the continent. Authentic > performative.",
    isActionable: true,
  },
  {
    month: 4, label: "Billboard Music Awards", type: "award", markets: ["us-uk-eu","latin","africa"],
    description: "Billboard Music Awards recognise chart performance. Eligibility based on Billboard chart activity from the prior year.",
    actionDate: "Prior year chart activity determines eligibility",
    tip: "If your artist had significant US chart activity, ensure your label/distributor has submitted for consideration. Use BBMA week for US press push.",
    contact: "https://billboardmusicawards.com",
  },
  {
    month: 4, label: "Glastonbury (Lineup Announced)", type: "festival", markets: ["us-uk-eu"],
    description: "Glastonbury Festival announcement. The festival itself is in June. Booking submissions close in October of the prior year.",
    actionDate: "October prior year — booking agent submissions",
    tip: "Work through a UK booking agent with Glastonbury relationships. West Holts and The Park stages regularly feature African acts. Announcement day is excellent for editorial pitching.",
    contact: "https://glastonburyfestivals.co.uk",
  },
  {
    month: 4, label: "Mid-Year Charts Season", type: "industry", markets: ["africa","us-uk-eu","asia","latin"],
    description: "Every major publication and DSP publishes mid-year lists in June. June releases that chart in May–June are eligible for these lists.",
    actionDate: "May — release. June — push for list inclusion",
    tip: "Pitch music journalists for mid-year list consideration in May. A great June release can appear on 'Best of So Far' lists from Pitchfork, Apple Music, and major blogs.",
    isActionable: true,
  },

  // ── JUNE ──
  {
    month: 5, label: "Grammy Submissions Open", type: "submission", markets: ["us-uk-eu","africa","latin","asia"],
    description: "THIS IS THE ACTION DATE. Grammy Award submissions open in June for songs released in the eligibility year (Oct 1 prior year – Sept 30 current year). Missing this window = not eligible.",
    actionDate: "June — portal opens. Submit immediately.",
    deadline: "Submissions typically close in September",
    tip: "Go to the Recording Academy portal. You need RIAA membership or Recording Academy membership to submit. Register releases with proper metadata. Only recordings commercially released in the eligibility window qualify.",
    contact: "https://recordingacademy.com/grammys/submit",
    isActionable: true,
  },
  {
    month: 5, label: "Essence Festival (New Orleans)", type: "festival", markets: ["us-uk-eu","africa"],
    description: "The world's largest Black music and culture festival. 500,000+ attendees. Huge editorial platform for Black artists globally, including African acts.",
    actionDate: "October prior year — artist bookings",
    tip: "Work through a US booking agent. Essence Festival is a major platform for African acts breaking into the US market. Even without a slot, presence in New Orleans that week is valuable.",
    contact: "https://essence.com/festival",
  },
  {
    month: 5, label: "Pride Month", type: "cultural", markets: ["us-uk-eu","africa","latin","asia"],
    description: "June is Pride Month globally. Brands, DSPs, and media actively seek diverse artist content and partnerships.",
    actionDate: "May — pitch brand and media partnerships",
    tip: "Authentic allyship content performs. Reactive or performative posts do not. If your artist has genuine Pride-related content or messaging, pitch it to DSP editorial by May 1.",
    isActionable: true,
  },
  {
    month: 5, label: "Glastonbury Festival", type: "festival", markets: ["us-uk-eu"],
    description: "The world's most iconic music festival. 200,000+ attendees. BBC broadcasts globally. A Glastonbury slot transforms a career.",
    actionDate: "October prior year — booking submissions",
    tip: "Streaming spikes dramatically for all Glastonbury performers. Even without a slot, create content during Glastonbury weekend — the algorithm surfaces music-adjacent content.",
    contact: "https://glastonburyfestivals.co.uk",
  },
  {
    month: 5, label: "Ivor Novello Awards", type: "award", markets: ["us-uk-eu"],
    description: "The UK's most prestigious songwriting awards. Judged entirely by music industry professionals. Recognises songwriting and composition, not just commercial performance.",
    actionDate: "Eligibility requires MCPS/PRS membership and UK release",
    tip: "Register your songwriters with PRS for Music. The Ivors are highly respected — even a nomination significantly boosts UK industry credibility.",
    contact: "https://ivorsacademy.com",
  },
  {
    month: 5, label: "KCON (US / Asia)", type: "festival", markets: ["asia"],
    description: "The world's largest K-pop festival and convention. Held in multiple cities globally. Major platform for Korean and Asian acts.",
    actionDate: "Applications open 6–9 months prior",
    tip: "KCON has expanded to include non-Korean Asian acts. If your artist has crossover potential with the Asian diaspora market, this is worth exploring.",
    contact: "https://kconusa.com",
  },

  // ── JULY ──
  {
    month: 6, label: "Mandela Day (July 18)", type: "cultural", markets: ["africa"],
    description: "Nelson Mandela International Day. South African brands, media, and DSPs run campaigns. 67 minutes of service is the global action call.",
    actionDate: "July 1 — pitch partnerships and content",
    tip: "Authentic social impact content performs strongly. Brands are actively looking for South African and pan-African artist partnerships for this day. Pitch corporates and NGOs early July.",
    isActionable: true,
  },
  {
    month: 6, label: "Afronation (Portugal)", type: "festival", markets: ["us-uk-eu","africa"],
    description: "Europe's largest Afrobeats festival. 50,000+ attendees. Major press and industry presence. A booking here signals European market readiness.",
    actionDate: "September prior year — booking enquiries",
    tip: "Work through a European booking agent with Afronation relationships. Festival week is a major networking moment — every African music industry figure is present.",
    contact: "https://afronation.com",
  },
  {
    month: 6, label: "DSTV Delicious Festival", type: "festival", markets: ["africa"],
    description: "South Africa's premium food and music festival. Mix of urban, jazz, and Afropop artists. Strong brand partnership opportunities.",
    actionDate: "April — booking enquiries",
    tip: "Premium brand alignment festival. If your artist is at a stage where brand positioning matters, this is a valuable booking. Good media coverage from South African entertainment press.",
  },
  {
    month: 6, label: "Grammy Submissions Deadline", type: "submission", markets: ["us-uk-eu","africa","latin","asia"],
    description: "Grammy submission portal typically closes in late September. July is the time to ensure all eligible recordings have been submitted.",
    actionDate: "Submit by September — but submit in June as soon as portal opens",
    tip: "Don't wait for the deadline. Submit as soon as the portal opens in June. Late submissions are often not processed. Confirm submission with Recording Academy.",
    contact: "https://recordingacademy.com/grammys/submit",
    isActionable: true,
    deadline: "September (portal typically closes)",
  },
  {
    month: 6, label: "Summer Sonic (Japan)", type: "festival", markets: ["asia"],
    description: "Japan's largest summer music festival. Features international and Asian acts across multiple stages in Tokyo and Osaka.",
    actionDate: "October prior year — booking through Japanese agency",
    tip: "Requires a Japanese booking agent or agency. Japan is a high-value market — a Summer Sonic booking typically generates strong local press and streaming.",
    contact: "https://summersonic.com",
  },

  // ── AUGUST ──
  {
    month: 7, label: "African Women's Day (Aug 9)", type: "cultural", markets: ["africa"],
    description: "August 9 is Women's Day in South Africa and observed across Africa. Strong editorial and brand campaign moment.",
    actionDate: "July — pitch brand partnerships and editorial",
    tip: "Female artists: pitch DSPs and brands early July. Male artists: collaborative content featuring female artists performs well. Authentic partnership > token posts.",
    isActionable: true,
  },
  {
    month: 7, label: "Q4 Campaign Planning Window", type: "industry", markets: ["africa","us-uk-eu","asia","latin"],
    description: "August is when the industry plans Q4. Label A&Rs, booking agents, and brand managers are mapping out their October–December campaigns.",
    actionDate: "August — pitch for Q4 slots and partnerships",
    tip: "This is the time to pitch your Q4 release to A&Rs, brands, and media. Q4 decisions are made in August. Don't pitch in October when everyone is already locked in.",
    isActionable: true,
  },
  {
    month: 7, label: "MTV VMAs", type: "award", markets: ["us-uk-eu","africa","latin"],
    description: "MTV Video Music Awards. Heavy social media engagement. Eligibility based on music video release and performance.",
    actionDate: "Submissions typically open June",
    tip: "MTV VMAs are fan-voted for many categories. Strong fan mobilisation campaigns are essential. If submitting, ensure your music video has been commercially released on MTV-eligible platforms.",
    contact: "https://vma.mtv.com",
  },

  // ── SEPTEMBER ──
  {
    month: 8, label: "Heritage Month (South Africa)", type: "cultural", markets: ["africa"],
    description: "September is Heritage Month in South Africa. September 24 is Heritage Day (Braai Day). Strong cultural identity content opportunity.",
    actionDate: "September 1 — localised content campaign",
    tip: "South African artists: authentic cultural content performs strongly this month. Brands run Heritage Month campaigns — pitch early August. Non-SA artists: support SA artists' content for goodwill.",
    isActionable: true,
  },
  {
    month: 8, label: "Hispanic Heritage Month (US)", type: "cultural", markets: ["us-uk-eu","latin"],
    description: "US Hispanic Heritage Month runs September 15 – October 15. Significant editorial and brand investment in Latin artists.",
    actionDate: "August — pitch editorial and brand partnerships",
    tip: "Latin artists should pitch US DSPs (Spotify VIVA, Apple Music Sones y Ritmos) and Hispanic media in August. This is a significant commercial window.",
    isActionable: true,
  },
  {
    month: 8, label: "Grammy Submission Portal Closes", type: "submission", markets: ["us-uk-eu","africa","latin","asia"],
    description: "Grammy submissions typically close in September. Last chance to submit eligible recordings for this cycle.",
    actionDate: "Submit NOW if you haven't already",
    tip: "If you haven't submitted yet, do it today. Do not miss this window. Next year's window won't open until June.",
    contact: "https://recordingacademy.com/grammys/submit",
    isActionable: true,
    deadline: "Typically mid-to-late September",
  },
  {
    month: 8, label: "Diwali Content Planning", type: "cultural", markets: ["asia","us-uk-eu"],
    description: "Diwali typically falls in October/November. September is the time to plan and produce culturally relevant content if your artist has South Asian fanbase.",
    actionDate: "September — plan. October — release.",
    tip: "South Asian diaspora is a significant music-consuming demographic in the UK, US, and Canada. Authentic cross-cultural content builds long-term loyalty.",
  },

  // ── OCTOBER ──
  {
    month: 9, label: "Latin Grammy Awards", type: "award", markets: ["latin","us-uk-eu"],
    description: "The Latin Recording Academy's annual awards. Spanish and Portuguese language recordings eligible. Nominations announced September.",
    actionDate: "Submissions open April–May",
    tip: "Latin Grammys require membership of the Latin Recording Academy. Submissions are via the official portal. Even a nomination in a niche category has significant commercial impact in Latin markets.",
    contact: "https://latingrammy.com",
  },
  {
    month: 9, label: "Grammy Nominations Announced", type: "award", markets: ["us-uk-eu","africa","latin","asia"],
    description: "Grammy nominations are announced in October/November. If you submitted in June–September, this is when you find out.",
    tip: "Use nominations week for press regardless of whether your artist is nominated. 'Grammy-eligible' and 'in contention' language is industry-standard PR. Be ready with reaction content.",
  },
  {
    month: 9, label: "Basadi in Music Awards", type: "award", markets: ["africa"],
    description: "South Africa's awards celebrating women in music. Focus on female artists, producers, and music business executives.",
    actionDate: "Submissions open August",
    tip: "Important platform for female artists in the South African market. Ensure releases are properly registered with RISA. Strong media coverage from South African entertainment press.",
    contact: "https://basadiinmusic.co.za",
  },
  {
    month: 9, label: "Year-End Push Begins", type: "industry", markets: ["africa","us-uk-eu","asia","latin"],
    description: "October is the unofficial start of the year-end campaign season. Streaming spikes in Q4 begin building from October. Labels, brands, and media are executing Q4 plans.",
    actionDate: "October 1 — activate Q4 campaign",
    tip: "If you planned in August, your Q4 campaign should be live by October 1. Releases in October–November capture year-end list eligibility and holiday playlist placement.",
    isActionable: true,
  },
  {
    month: 9, label: "Nigerian Independence (Oct 1)", type: "cultural", markets: ["africa"],
    description: "Nigeria's independence day is October 1. Massive social media moment, especially for Nigerian and diaspora artists.",
    actionDate: "September — plan cultural content",
    tip: "One of the biggest cultural moments for Nigerian artists. Authentic patriotic content — not performative — performs extremely well. Brands run Nigeria-specific campaigns.",
    isActionable: true,
  },

  // ── NOVEMBER ──
  {
    month: 10, label: "Detty December Planning", type: "industry", markets: ["africa"],
    description: "Detty December is West Africa's biggest party season (December). November is the time to confirm bookings, release music for December consumption, and plan content.",
    actionDate: "November — confirm bookings and prep releases",
    tip: "The biggest concerts and shows in Nigeria, Ghana, and South Africa happen in December. Booking confirmations should be signed in November. Release music in November that will be consumed in December.",
    isActionable: true,
  },
  {
    month: 10, label: "MAMA Awards (Korea)", type: "award", markets: ["asia"],
    description: "Mnet Asian Music Awards — the largest K-pop awards globally. Held in November/December. Fan voting is a major component.",
    actionDate: "Voting opens September–October",
    tip: "Drive fan voting campaigns via official channels. MAMA streaming numbers (YouTube, streaming) are part of the scoring. Ensure content is maximised in the voting period.",
    contact: "https://mama.mwave.me",
  },
  {
    month: 10, label: "Golden Disc Awards (Korea)", type: "award", markets: ["asia"],
    description: "One of South Korea's oldest music awards. Based on digital and physical album sales. January ceremony.",
    actionDate: "Album sales in the prior year determine eligibility",
    tip: "Korean music market rewards consistent release schedules. Ensure Korean distribution is active and Hanteo/Gaon chart registrations are complete.",
  },
  {
    month: 10, label: "Thanksgiving Release Window (US)", type: "cultural", markets: ["us-uk-eu"],
    description: "Thanksgiving week is historically a strong US release window. People are off work, travelling, and streaming heavily. Black Friday also creates gifting-adjacent content opportunities.",
    actionDate: "Submit to US DSPs by November 7 for Thanksgiving week placement",
    tip: "US editorial teams are actively curating for Thanksgiving and pre-Christmas playlists. Pitch by November 7. Upbeat and feel-good music performs strongest this week.",
    isActionable: true,
  },
  {
    month: 10, label: "Year-End Lists Season", type: "industry", markets: ["africa","us-uk-eu","asia","latin"],
    description: "Pitchfork, Apple Music, Spotify, Rolling Stone, OkayAfrica, and every major publication publish year-end lists in November–December. Being included drives significant streaming and credibility.",
    actionDate: "Pitch journalists in October for November list consideration",
    tip: "Proactively pitch music journalists and editors for year-end consideration in October. Follow up in early November. A year-end list placement from a credible outlet has long-tail SEO and streaming value.",
    isActionable: true,
  },

  // ── DECEMBER ──
  {
    month: 11, label: "Detty December (Nigeria/Ghana)", type: "festival", markets: ["africa"],
    description: "West Africa's biggest party season. Lagos, Accra, and diaspora cities host hundreds of major concerts. Every top African act performs. Streaming is at its annual peak.",
    actionDate: "Bookings confirmed in August–November",
    tip: "If your artist isn't performing this December, ensure they have presence in the content conversation. Release a December single. Attend key shows. Be visible.",
    isActionable: false,
  },
  {
    month: 11, label: "Christmas Release Window", type: "cultural", markets: ["africa","us-uk-eu","asia","latin"],
    description: "The biggest streaming week of the year globally. Christmas Day and the days around it drive massive streaming numbers. Holiday playlists dominate.",
    actionDate: "Submit to DSPs by December 1 for holiday playlist consideration",
    tip: "Release anything you want to end the year on by December 6 at the latest. DSP editorial teams lock holiday playlists by December 10. A feel-good track has the best chance of placement.",
    isActionable: true,
  },
  {
    month: 11, label: "Year-End Lists Published", type: "industry", markets: ["africa","us-uk-eu","asia","latin"],
    description: "All major year-end lists are published December–January. If you pitched in October/November, this is when you see results.",
    tip: "Amplify any year-end list appearances aggressively. This content has long-term value — 'Artist of the Year' mentions compound over time. Screenshot, post, and archive every mention.",
    isActionable: false,
  },
  {
    month: 11, label: "Detty December Culture", type: "cultural", markets: ["africa"],
    description: "Beyond concerts, December in West Africa is the defining cultural moment of the year. Fashion, food, travel, and music all converge. Content consumption is at its peak.",
    tip: "Your artist should be highly active on social media this month regardless of whether they're performing. The algorithm rewards consistent posting during high-traffic periods.",
  },
];

// ─── Type colors ──────────────────────────────────────────────────────────────

const TYPE_COLORS = {
  award:      { bg: "#F59E0B20", text: "#F59E0B",  border: "#F59E0B40",  label: "Award"      },
  festival:   { bg: "#8B5CF620", text: "#8B5CF6",  border: "#8B5CF640",  label: "Festival"   },
  cultural:   { bg: "#10B98120", text: "#10B981",  border: "#10B98140",  label: "Cultural"   },
  industry:   { bg: "#06B6D420", text: "#06B6D4",  border: "#06B6D440",  label: "Industry"   },
  submission: { bg: "#EF444420", text: "#EF4444",  border: "#EF444440",  label: "SUBMIT NOW" },
};

// ─── User entries ─────────────────────────────────────────────────────────────

interface CalEntry {
  id: string;
  month: number;
  text: string;
  type: "release" | "content" | "promo" | "note";
}

const ENTRY_COLORS = { release: "#EC4899", content: "#8B5CF6", promo: "#F59E0B", note: "#6B7280" };

function uid() { return Math.random().toString(36).slice(2, 9); }

// ─── Component ────────────────────────────────────────────────────────────────

export default function ContentCalendarPage() {
  const handleExportPDF = () => { window.print(); };
  const [market, setMarket]         = useState<Market>("africa");
  const [viewMonth, setViewMonth]   = useState(new Date().getMonth());
  const [entries, setEntries]       = useState<CalEntry[]>([]);
  const [newText, setNewText]       = useState("");
  const [newType, setNewType]       = useState<CalEntry["type"]>("content");
  const [selectedMoment, setSelectedMoment] = useState<CulturalMoment | null>(null);

  useToolRestore<CalEntry[]>("content-calendar", STORAGE_KEY, setEntries);

  const saveEntries = (e: CalEntry[]) => {
    setEntries(e);
    localStorage.setItem("roster_cal_entries_v1", JSON.stringify(e));
  };

  const moments = CULTURAL_MOMENTS.filter(m => m.month === viewMonth && m.markets.includes(market));
  const monthEntries = entries.filter(e => e.month === viewMonth);

  const addEntry = () => {
    if (!newText.trim()) return;
    saveEntries([...entries, { id: uid(), month: viewMonth, text: newText.trim(), type: newType }]);
    setNewText("");
  };

  const prev = () => setViewMonth(m => m === 0 ? 11 : m - 1);
  const next = () => setViewMonth(m => m === 11 ? 0 : m + 1);

  return (
    <div className="animate-fade-in max-w-4xl">
      <Link href="/dashboard/library/marketing" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary mb-6 transition-colors">
        <ChevronLeft size={15}/>Back to Marketing
      </Link>

      {/* Header */}
      <div className="glass-card rounded-2xl p-6 mb-7" style={{ borderColor: `${MODULE_COLOR}25` }}>
        <div className="flex items-center gap-4">
          <SaveButton toolSlug="content-calendar" storageKey={STORAGE_KEY} title={`Content Calendar — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
            <ExportButton onPDF={handleExportPDF} />

          <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${MODULE_COLOR}15` }}>
            <CalendarDays size={26} style={{ color: MODULE_COLOR }}/>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: MODULE_COLOR }}>Plan · Create · Distribute</p>
            <h1 className="text-2xl font-black text-text-primary">Content Calendar (12-Month)</h1>
            <p className="text-sm text-text-muted mt-0.5">Every major music industry moment — with the action intel you actually need. Click any moment for details.</p>
          </div>
        </div>
      </div>

      {/* Market + Legend row */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex flex-wrap gap-2">
          {MARKETS.map(m => (
            <button key={m.id} onClick={() => setMarket(m.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border"
              style={market === m.id
                ? { color: "#fff", backgroundColor: MODULE_COLOR, borderColor: MODULE_COLOR }
                : { color: "var(--text-muted)", borderColor: "var(--border)" }}>
              {m.flag} {m.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {Object.entries(TYPE_COLORS).map(([type, cfg]) => (
            <div key={type} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.text }}/>
              <span className="text-[10px] text-text-muted">{cfg.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Year strip */}
      <div className="grid grid-cols-6 sm:grid-cols-12 gap-1 mb-7">
        {MONTHS.map((m, i) => {
          const hasSubmission = CULTURAL_MOMENTS.some(cm => cm.month === i && cm.type === "submission" && cm.markets.includes(market));
          const hasMoments    = CULTURAL_MOMENTS.some(cm => cm.month === i && cm.markets.includes(market));
          const hasEntries    = entries.some(e => e.month === i);
          return (
            <button key={m} onClick={() => setViewMonth(i)}
              className="rounded-lg py-2 text-center transition-all"
              style={i === viewMonth
                ? { backgroundColor: MODULE_COLOR, color: "#fff" }
                : { backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
              <p className="text-[9px] font-black uppercase">{m.slice(0,3)}</p>
              <div className="flex items-center justify-center gap-0.5 mt-1">
                {hasSubmission && <span className="w-1.5 h-1.5 rounded-full bg-red-400"/>}
                {hasMoments && !hasSubmission && <span className="w-1 h-1 rounded-full" style={{ backgroundColor: i === viewMonth ? "rgba(255,255,255,0.7)" : "#F59E0B" }}/>}
                {hasEntries && <span className="w-1 h-1 rounded-full" style={{ backgroundColor: i === viewMonth ? "rgba(255,255,255,0.7)" : "#8B5CF6" }}/>}
              </div>
            </button>
          );
        })}
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={prev} className="p-2 glass-card rounded-lg hover:border-brand/20 transition-colors text-text-muted hover:text-text-primary">
          <ChevronLeft size={16}/>
        </button>
        <h2 className="text-xl font-black text-text-primary">{MONTHS[viewMonth]} 2026</h2>
        <button onClick={next} className="p-2 glass-card rounded-lg hover:border-brand/20 transition-colors text-text-muted hover:text-text-primary">
          <ChevronRight size={16}/>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">

        {/* Moments panel */}
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-wider text-text-muted">
              {MARKETS.find(m => m.id === market)?.flag} Market moments
            </p>
            <p className="text-[10px] text-text-muted">Click for intel</p>
          </div>
          <div className="divide-y divide-border/60">
            {moments.length === 0 && (
              <p className="text-xs text-text-muted px-4 py-6 text-center opacity-60">No key moments this month for this market.</p>
            )}
            {moments.map((moment, i) => {
              const colors = TYPE_COLORS[moment.type];
              return (
                <button key={i} onClick={() => setSelectedMoment(moment === selectedMoment ? null : moment)}
                  className="w-full px-4 py-3 flex items-start gap-3 text-left transition-all hover:bg-surface-2/50"
                  style={selectedMoment === moment ? { backgroundColor: `${colors.text}08` } : {}}>
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5 whitespace-nowrap"
                    style={{ color: colors.text, backgroundColor: colors.bg }}>
                    {colors.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary">{moment.label}</p>
                    {moment.isActionable && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <AlertCircle size={10} className="text-amber-400"/>
                        <span className="text-[10px] text-amber-400 font-semibold">Action required</span>
                      </div>
                    )}
                    {moment.deadline && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Clock size={10} className="text-red-400"/>
                        <span className="text-[10px] text-red-400 font-semibold">Deadline: {moment.deadline}</span>
                      </div>
                    )}
                  </div>
                  <Info size={13} className="flex-shrink-0 mt-0.5 text-text-muted opacity-50"/>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detail panel / Your entries */}
        <div className="space-y-4">
          {/* Selected moment detail */}
          {selectedMoment && (
            <div className="glass-card rounded-xl overflow-hidden" style={{ borderColor: `${TYPE_COLORS[selectedMoment.type].text}30` }}>
              <div className="px-4 py-3 border-b border-border flex items-center justify-between"
                style={{ backgroundColor: `${TYPE_COLORS[selectedMoment.type].text}08` }}>
                <div>
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded mr-2"
                    style={{ color: TYPE_COLORS[selectedMoment.type].text, backgroundColor: TYPE_COLORS[selectedMoment.type].bg }}>
                    {TYPE_COLORS[selectedMoment.type].label}
                  </span>
                  <span className="text-sm font-bold text-text-primary">{selectedMoment.label}</span>
                </div>
                <button onClick={() => setSelectedMoment(null)} className="text-text-muted hover:text-text-primary transition-colors">
                  <X size={14}/>
                </button>
              </div>
              <div className="p-4 space-y-3">
                <p className="text-xs text-text-muted leading-relaxed">{selectedMoment.description}</p>
                {selectedMoment.actionDate && (
                  <div className="flex items-start gap-2 p-3 rounded-lg" style={{ backgroundColor: "#F59E0B08", borderLeft: "2px solid #F59E0B" }}>
                    <Clock size={12} className="flex-shrink-0 mt-0.5" style={{ color: "#F59E0B" }}/>
                    <div>
                      <p className="text-[10px] font-black uppercase text-amber-400 mb-0.5">Action date</p>
                      <p className="text-xs text-text-primary">{selectedMoment.actionDate}</p>
                    </div>
                  </div>
                )}
                {selectedMoment.deadline && (
                  <div className="flex items-start gap-2 p-3 rounded-lg" style={{ backgroundColor: "#EF444408", borderLeft: "2px solid #EF4444" }}>
                    <AlertCircle size={12} className="flex-shrink-0 mt-0.5 text-red-400"/>
                    <div>
                      <p className="text-[10px] font-black uppercase text-red-400 mb-0.5">Hard deadline</p>
                      <p className="text-xs text-text-primary">{selectedMoment.deadline}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-2 p-3 rounded-lg" style={{ backgroundColor: "#06B6D408", borderLeft: "2px solid #06B6D4" }}>
                  <Lightbulb size={12} className="flex-shrink-0 mt-0.5" style={{ color: "#06B6D4" }}/>
                  <div>
                    <p className="text-[10px] font-black uppercase mb-0.5" style={{ color: MODULE_COLOR }}>Manager tip</p>
                    <p className="text-xs text-text-primary leading-relaxed">{selectedMoment.tip}</p>
                  </div>
                </div>
                {selectedMoment.contact && (
                  <a href={selectedMoment.contact} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-semibold transition-colors hover:opacity-80"
                    style={{ color: MODULE_COLOR }}>
                    <ExternalLink size={12}/>Submit / learn more
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Your entries */}
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-xs font-black uppercase tracking-wider text-text-muted">Your entries</p>
            </div>
            <div className="p-3 space-y-2">
              <div className="flex gap-2">
                <input value={newText} onChange={e => setNewText(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addEntry()}
                  placeholder="Release, content drop, promo..."
                  className="flex-1 bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-brand/40 placeholder:text-text-muted/40"/>
                <select value={newType} onChange={e => setNewType(e.target.value as CalEntry["type"])}
                  className="bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-xs font-semibold text-text-primary focus:outline-none cursor-pointer">
                  <option value="release">Release</option>
                  <option value="content">Content</option>
                  <option value="promo">Promo</option>
                  <option value="note">Note</option>
                </select>
                <button onClick={addEntry} className="p-2 rounded-lg text-white transition-all hover:opacity-80" style={{ backgroundColor: MODULE_COLOR }}>
                  <Plus size={14}/>
                </button>
              </div>
              {monthEntries.length === 0 ? (
                <p className="text-xs text-text-muted text-center py-4 opacity-60">No entries yet for {MONTHS[viewMonth]}.</p>
              ) : (
                <div className="space-y-1">
                  {monthEntries.map(entry => (
                    <div key={entry.id} className="flex items-center gap-2 py-1.5 border-t border-border/60">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: ENTRY_COLORS[entry.type] }}/>
                      <p className="text-xs text-text-primary flex-1">{entry.text}</p>
                      <span className="text-[10px] font-bold" style={{ color: ENTRY_COLORS[entry.type] }}>{entry.type}</span>
                      <button onClick={() => saveEntries(entries.filter(e => e.id !== entry.id))}
                        className="text-text-muted hover:text-red-400 transition-colors flex-shrink-0">
                        <X size={12}/>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="glass-card rounded-xl p-4 flex flex-wrap items-center gap-4 text-xs text-text-muted">
        <span className="font-semibold text-text-primary">Year strip indicators:</span>
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400"/><span>Submit-now deadline</span></div>
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400"/><span>Market moments</span></div>
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-violet-400"/><span>Your entries</span></div>
      </div>
    </div>
  );
}
