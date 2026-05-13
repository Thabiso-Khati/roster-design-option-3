"use client";
import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Printer, CheckCircle, XCircle, HelpCircle, ExternalLink, X } from "lucide-react";
import { useLocale } from "@/context/locale-context";
import { getCountryResources } from "@/lib/country-resources";
import { SaveButton } from "@/components/ui/save-button";
import { ExportButton } from "@/components/ui/export-button";

const MODULE_COLOR = "#C9A84C";
const LS_KEY = "roster_checklist_v2";

type ItemStatus = "done" | "not_done" | "help" | null;

interface HelpVendor { name: string; url?: string; note?: string }
interface ChecklistItem {
  id: string; text: string; note: string;
  help: { guide: string; link?: string; linkLabel?: string; vendors?: HelpVendor[] }
}
interface ChecklistCategory { name: string; items: ChecklistItem[] }
interface ChecklistSection { id: string; title: string; cadence: string; color: string; categories: ChecklistCategory[] }

const SECTIONS: ChecklistSection[] = [
  {
    id: "01", title: "Artist Assessment & Market Positioning",
    cadence: "Before doing anything else, be honest about where the artist stands",
    color: "#C9A84C",
    categories: [
      { name: "Core Artistry", items: [
        { id:"01-01", text:"Vocal ability & range", note:"Assess live and studio performance quality, are there gaps that need vocal coaching?",
          help:{ guide:"Book a session with a professional vocal coach to get an objective assessment. Record the artist in both a studio and live setting and compare. If gaps exist, budget for weekly coaching before the next release cycle.", vendors:[{name:"SA Vocal Academy",url:"https://www.savocalacademy.co.za",note:"Cape Town-based coaching"},{name:"AFDA",url:"https://www.afda.co.za",note:"Johannesburg performance training"}] }},
        { id:"01-02", text:"Songwriting & compositional depth", note:"Does the artist write their own material? Do they need a co-writer or topliner?",
          help:{ guide:"Have the artist write and demo 3 original songs without production assistance. Evaluate lyrical depth, melody construction, and structural variety. If co-writing is needed, build a session roster of 3–5 writers in your genre.", vendors:[{name:"SAMRO Song Registration",url:"https://www.samro.org.za",note:"Register all compositions immediately"},{name:"Music In Africa Directory",url:"https://www.musicinafrica.net",note:"Find producers and writers across Africa"}] }},
        { id:"01-03", text:"Production & studio literacy", note:"Can they communicate their creative vision in a session? Do they understand basic DAW workflow?",
          help:{ guide:"Run a studio test session: book 2 hours with no producer direction and observe how the artist communicates what they want. If gaps exist, enrol them in a basic Ableton or Logic Pro intro course — online options are free or low-cost.", vendors:[{name:"Beat Lab Academy (SA)",url:"https://www.beatlab.co.za",note:"Cape Town production training"},{name:"Producertech",url:"https://www.producertech.com",note:"Online production courses"}] }},
        { id:"01-04", text:"Stage presence & live performance", note:"Assess energy, movement, crowd engagement, book a performance coach if needed",
          help:{ guide:"Film the artist performing 3 songs live (even at rehearsal) and review together. Rate energy, eye contact, use of space, and crowd engagement. Book a performance coach if the score is below where you need it for target venues.", vendors:[{name:"AFDA Johannesburg",url:"https://www.afda.co.za"},{name:"Market Theatre Lab",url:"https://www.markettheatre.co.za",note:"Johannesburg stage performance training"}] }},
        { id:"01-05", text:"Entertainment & personality on camera", note:"Critical for short-form content, TikTok, Reels, and Shorts are now primary discovery channels",
          help:{ guide:"Film a 5-minute unscripted 'day in the life' video and review it honestly. Natural charisma on camera is the #1 driver of organic discovery in 2026. If the artist is stiff, book a media trainer before any major press cycle.", vendors:[{name:"BizCommunity SA Media Trainers",url:"https://www.bizcommunity.com"},{name:"The Media Workshop",url:"https://www.themediaworkshop.co.za",note:"Johannesburg-based media coaching"}] }},
        { id:"01-06", text:"Media confidence", note:"Can the artist hold their own in an interview or podcast? Arrange media training if not",
          help:{ guide:"Conduct a mock interview with tough questions (streaming numbers, comparisons, controversies). Review the footage. If the artist struggles, invest in at least 2 sessions with a media trainer before any major campaign.", vendors:[{name:"The Media Workshop",url:"https://www.themediaworkshop.co.za"},{name:"Red Pepper Communications",url:"https://www.redpepper.co.za",note:"SA PR and media training"}] }},
      ]},
      { name: "Brand & Identity", items: [
        { id:"01-07", text:"Visual identity & branding", note:"Is the aesthetic consistent across all platforms? Does it reflect the artist's sonic and cultural identity?",
          help:{ guide:"Audit every social profile with a screenshots folder. Are the colours, fonts, photo style, and aesthetic consistent? If not, commission a creative director or graphic designer for a 'brand bible' — a 1-page visual guide that governs all future content.", vendors:[{name:"Behance (Find SA creatives)",url:"https://www.behance.net"},{name:"99designs",url:"https://www.99designs.com"},{name:"Upwork",url:"https://www.upwork.com",note:"Find African creative directors"}] }},
        { id:"01-08", text:"Genre positioning", note:"Clearly define the primary genre(s), Amapiano, Afropop, Hip Hop, Gospel, Afrobeats, R&B, etc.",
          help:{ guide:"Write a one-sentence genre statement: '[Artist] makes [primary genre] with [secondary influence] for [audience].' This single sentence drives every pitch, press release, and DSP submission. Agree on it before any release.", vendors:[{name:"Music In Africa Genre Guide",url:"https://www.musicinafrica.net"},{name:"Audiomack Genre Pages",url:"https://www.audiomack.com"}] }},
        { id:"01-09", text:"Target audience profile", note:"Define age, geography, listening habits, and platform behaviour, SA vs diaspora vs international",
          help:{ guide:"Pull Spotify for Artists audience data and Instagram Insights. Build a one-page profile: age range, top cities, top listening times, and which platform they use most. This drives where you spend marketing budget.", vendors:[{name:"Spotify for Artists",url:"https://artists.spotify.com"},{name:"Apple Music for Artists",url:"https://artists.apple.com"},{name:"Boomplay for Artists",url:"https://artists.boomplay.com"}] }},
        { id:"01-10", text:"Role models & reference points", note:"Identify who the artist looks up to, use this to benchmark goals and inform strategy",
          help:{ guide:"Ask the artist to name 3 artists at their target level in 3 years. Research each one's career trajectory: when did they break, what was the breakthrough moment, what team did they have? Use this as your roadmap benchmark.", vendors:[{name:"ChartMasters",url:"https://chartmasters.org",note:"Track streaming career milestones"},{name:"IFPI Global Music Report",url:"https://www.ifpi.org/reports"}] }},
        { id:"01-11", text:"Unique selling point", note:"What is this artist's defining difference? Articulate it clearly for pitching and booking",
          help:{ guide:"Write 3 different USP statements, each from a different angle: sonic (what they sound like), cultural (where they're from and what they represent), and emotional (how they make people feel). Use the strongest one consistently.", vendors:[] }},
      ]},
      { name: "Current Market Standing", items: [
        { id:"01-12", text:"Existing fanbase & engagement quality", note:"Follower count means nothing without engagement, audit the ratio",
          help:{ guide:"Engagement rate = (likes + comments) / followers × 100. A healthy rate for music artists is 2–5% on Instagram. Use HypeAuditor or Social Blade to audit for authentic vs bot engagement.", vendors:[{name:"HypeAuditor",url:"https://hypeauditor.com",note:"Audit social media authenticity"},{name:"Social Blade",url:"https://socialblade.com"}] }},
        { id:"01-13", text:"Prior releases & streaming history", note:"Pull stats from DistroKid/Tunecore/Africori, streams, saves, skip rate, playlist adds",
          help:{ guide:"Log into the distributor dashboard and export all-time streaming stats per track. Key metrics: total streams, monthly streams, save rate (saves/plays), playlist adds, and skip rate. Build a baseline document you update monthly.", vendors:[{name:"DistroKid",url:"https://distrokid.com"},{name:"Africori",url:"https://www.africori.com",note:"Best for African distribution"},{name:"TuneCore",url:"https://www.tunecore.com"}] }},
        { id:"01-14", text:"Press & media coverage to date", note:"Has the artist had any coverage? From which outlets? Quality matters more than volume",
          help:{ guide:"Google '[artist name]' and clip every result into a press folder. Sort by outlet quality: Tier 1 (Rolling Stone Africa, Okay Africa, Mail & Guardian), Tier 2 (The Plug, TshisaLIVE, Channel O), Tier 3 (blogs, local news). Document the date and outlet for every mention.", vendors:[{name:"Rolling Stone Africa",url:"https://rollingstoneza.co.za"},{name:"Okay Africa",url:"https://www.okayafrica.com"},{name:"The Plug SA",url:"https://theplug.co.za"}] }},
        { id:"01-15", text:"Live performance history", note:"How many shows? What sizes? Any notable festivals or headline slots?",
          help:{ guide:"Build a gig history spreadsheet: date, venue, city, capacity, fee, and promoter contact. This becomes your booking portfolio. Note the top 5 most significant shows — these are what agents and promoters want to hear about.", vendors:[{name:"SA Concert Promoters Network",url:"https://www.bizcommunity.com/marketing/entertainment"},{name:"Music In Africa Shows Database",url:"https://www.musicinafrica.net"}] }},
        { id:"01-16", text:"Industry relationships already in place", note:"Labels, producers, booking agents, publicists, map the existing network",
          help:{ guide:"Map every warm relationship in a CRM — even a Google Sheet works. Columns: Name, Role, Company, Last Contact, Relationship Strength (1–5). This becomes the foundation of your outreach strategy for the first campaign.", vendors:[{name:"Music In Africa Directory",url:"https://www.musicinafrica.net"},{name:"SA Music Industry Contacts (RISA)",url:"https://www.risa.co.za"}] }},
      ]},
    ],
  },
  {
    id: "02", title: "Digital Infrastructure & Platform Setup",
    cadence: "A broken digital infrastructure costs artists real money, audit everything before release",
    color: "#8B5CF6",
    categories: [
      { name: "Streaming & Distribution", items: [
        { id:"02-01", text:"Distributor account confirmed", note:"e.g. DistroKid, TuneCore, Amuse, Africori, Platoon, or label deal, know exactly where releases live",
          help:{ guide:"If the artist doesn't have a distributor, compare: Africori (strong African market reach), DistroKid (cheapest flat-fee, global), TuneCore (per-release pricing, established), Believe/Platoon (for artists with traction wanting label services). Sign one, confirm login credentials, and store them securely.", vendors:[{name:"Africori",url:"https://www.africori.com",note:"Best for African reach"},{name:"DistroKid",url:"https://distrokid.com",note:"Flat annual fee, unlimited releases"},{name:"Believe",url:"https://www.believe.com",note:"Label-services model"},{name:"Platoon",url:"https://platoon.com",note:"Apple-owned, curated"}] }},
        { id:"02-02", text:"Spotify for Artists, claimed and verified", note:"Check monthly listeners, audience demographics, playlist pitching portal access",
          help:{ guide:"Go to artists.spotify.com and claim the profile. Verification requires a distributor-confirmed release. Once in, enable pitch submissions (must be done 7+ days before release). Check demographics weekly during campaigns.", link:"https://artists.spotify.com", linkLabel:"Claim on Spotify for Artists" }},
        { id:"02-03", text:"Apple Music for Artists, claimed and verified", note:"Pull Shazam data, city-level audience breakdown, download trends",
          help:{ guide:"Go to artists.apple.com. Verification takes 2–5 business days. Once verified, access Shazam data (invaluable for radio performance) and city-level audience breakdowns that Spotify doesn't show.", link:"https://artists.apple.com", linkLabel:"Claim on Apple Music for Artists" }},
        { id:"02-04", text:"Boomplay Artist Dashboard, claimed", note:"Priority platform for East and West African reach, essential for continental growth",
          help:{ guide:"Apply at boomplay.com/artist. Boomplay is the #1 streaming platform in Nigeria, Ghana, Kenya, and East Africa — more relevant than Spotify in these markets. Essential for any multi-market African growth strategy.", link:"https://www.boomplay.com", linkLabel:"Apply for Boomplay Artist Access" }},
        { id:"02-05", text:"Audiomack for Artists, claimed", note:"Key for diaspora audiences and West Africa. Audiomack Discovery has real organic reach",
          help:{ guide:"Apply at audiomack.com/artist. Audiomack's Discovery program surfaces new music to real listeners at no cost — one of the most genuinely organic discovery tools remaining in 2026. Essential for hip hop, Afrobeats, and gospel.", link:"https://audiomack.com/artist", linkLabel:"Apply for Audiomack for Artists" }},
        { id:"02-06", text:"YouTube Music, artist profile claimed", note:"Link to YouTube channel; ensure Official Artist Channel (OAC) status is applied for",
          help:{ guide:"Apply for Official Artist Channel (OAC) status through your distributor or directly via music.youtube.com/artists. OAC merges your auto-generated music page with your main YouTube channel, giving a single verified presence.", link:"https://artists.youtube.com", linkLabel:"Apply for YouTube OAC" }},
        { id:"02-07", text:"Deezer Artist account, verified", note:"Strong in Francophone Africa, do not overlook for broader international footprint",
          help:{ guide:"Claim your profile at artists.deezer.com. Deezer is significant in Côte d'Ivoire, Senegal, Cameroon, and across Francophone Africa. For any artist targeting Francophone African markets, this cannot be skipped.", link:"https://artists.deezer.com", linkLabel:"Claim on Deezer for Artists" }},
        { id:"02-08", text:"Amazon Music for Artists, claimed", note:"Growing relevance in SA as smart speaker adoption increases",
          help:{ guide:"Claim at artists.amazonmusic.com. While not dominant in Africa, Amazon Music is growing with Alexa device adoption and is important for international touring revenue and diaspora audiences in the UK and US.", link:"https://artists.amazonmusic.com", linkLabel:"Claim on Amazon Music for Artists" }},
        { id:"02-09", text:"TIDAL, artist profile active", note:"Worth maintaining for high-fidelity positioning and playlist opportunities",
          help:{ guide:"Claim through your distributor dashboard — most major distributors (DistroKid, TuneCore, Africori) auto-deliver to TIDAL. Worth monitoring for playlist placement opportunities, especially in the hip hop and R&B space.", link:"https://tidal.com/about/artists", linkLabel:"TIDAL Artist Info" }},
      ]},
      { name: "Social Media Platforms", items: [
        { id:"02-10", text:"TikTok, account active, content strategy defined", note:"Algorithm-first platform. Short-form video is the #1 discovery driver globally in 2026, non-negotiable",
          help:{ guide:"Set up a dedicated artist TikTok (separate from personal). Enable TikTok for Creators. Post 3x per week minimum with music-first content. The algorithm rewards consistency and completion rate — hook in the first 2 seconds. Aim for 60–70% video completion rate.", vendors:[{name:"TikTok for Creators",url:"https://www.tiktok.com/creators"},{name:"TikTok Sound Distribution Guide",url:"https://artists.tiktok.com"}] }},
        { id:"02-11", text:"Instagram, profile optimised", note:"Reels are the primary reach driver. Ensure bio, link-in-bio, and story highlights are current",
          help:{ guide:"Switch to a Professional Account (free). Bio must include: genre/role, booking email, and a link-in-bio tool (Linktree or Beacons). Post Reels 4–5x per week for reach; use Stories daily for engagement. Check Insights weekly.", vendors:[{name:"Linktree",url:"https://linktr.ee"},{name:"Beacons",url:"https://beacons.ai",note:"Better analytics than Linktree"}] }},
        { id:"02-12", text:"YouTube, channel claimed and optimised", note:"Official channel with full back catalogue, Shorts strategy in place, Community tab active",
          help:{ guide:"Enable Community tab (requires 500+ subscribers). Upload a channel trailer and organize content into Playlists by release/type. Post Shorts (under 60 seconds, vertical) alongside any music video. YouTube is also a significant royalty earner — ensure Content ID is active.", vendors:[{name:"YouTube Studio",url:"https://studio.youtube.com"},{name:"YouTube for Artists",url:"https://artists.youtube.com"}] }},
        { id:"02-13", text:"Facebook, page maintained", note:"Still relevant in South Africa and across sub-Saharan Africa, do not abandon it",
          help:{ guide:"Maintain an active Facebook Page (not personal profile). Cross-post Reels automatically to Facebook. Facebook Events are still the dominant platform for show promotion in South Africa — use for every gig. Aim for 2–3 posts per week minimum.", vendors:[{name:"Facebook for Creators",url:"https://www.facebook.com/creators"},{name:"Meta Business Suite",url:"https://business.facebook.com"}] }},
        { id:"02-14", text:"X (Twitter), active", note:"Valuable for industry relationships, media, and real-time cultural commentary",
          help:{ guide:"X is less of a fan platform and more of an industry platform in 2026. Prioritize engagement with journalists, industry insiders, and cultural conversations over follower growth. Post real-time commentary around cultural moments relevant to the artist's brand.", vendors:[{name:"X for Business",url:"https://business.twitter.com"}] }},
        { id:"02-15", text:"All bio sections current", note:"Every platform should reflect correct name, genre, location, links, and bio text",
          help:{ guide:"Create a master bio document with: Short bio (100 words), Medium bio (200 words), Long bio (400 words). Pull from this for every platform. Set a quarterly review reminder to update stats and achievements. Inconsistency across platforms reduces credibility in industry searches.", vendors:[] }},
        { id:"02-16", text:"Secure login details saved", note:"All usernames, passwords, 2FA backup codes stored securely, not only with the artist",
          help:{ guide:"Use a shared password manager (1Password Teams or LastPass) accessible by management and one trusted team member. Store: login credentials, 2FA backup codes, linked email accounts. Never store in plain text files or WhatsApp chats. This prevents account lockouts from derailing releases.", vendors:[{name:"1Password Teams",url:"https://1password.com/teams"},{name:"LastPass",url:"https://www.lastpass.com"},{name:"Bitwarden",url:"https://bitwarden.com",note:"Free open-source option"}] }},
      ]},
      { name: "Content ID & Monetisation", items: [
        { id:"02-17", text:"YouTube Content ID claimed via distributor", note:"Ensure all releases are claimed, unclaimed content loses revenue daily",
          help:{ guide:"Enable Content ID through your distributor dashboard — most major distributors (DistroKid, Africori, TuneCore, Believe) offer this. It means every time someone uses your song in a YouTube video, you earn. Unclaimed = lost revenue. Check the Content ID dashboard monthly for claims and disputes.", vendors:[{name:"DistroKid Content ID",url:"https://distrokid.com/youtube"},{name:"Africori YouTube Monetisation",url:"https://www.africori.com"}] }},
        { id:"02-18", text:"TikTok Sound monetisation active", note:"Set up via TikTok for Artists or through distributor, viral sounds generate meaningful royalties",
          help:{ guide:"Ensure your distributor delivers to TikTok's commercial music library. Check TikTok for Artists (artists.tiktok.com) to see if your sounds are active. Viral TikTok sounds can generate hundreds of thousands of streams in a single week — this is non-negotiable income.", link:"https://artists.tiktok.com", linkLabel:"Check TikTok for Artists" }},
        { id:"02-19", text:"Instagram/Facebook Sound Collection active", note:"Opt in to Meta's sound collection for Reels, separate revenue stream",
          help:{ guide:"Contact your distributor to confirm Meta Sound Collection delivery is enabled. When Instagram users use your music in Reels, you collect royalties through Meta's licensing deal with distributors. Not all distributors have this — Africori, DistroKid, and TuneCore do.", vendors:[{name:"Meta Sound Collection Info",url:"https://www.facebook.com/formedia/blog"},{name:"DistroKid Meta Licensing",url:"https://distrokid.com"}] }},
        { id:"02-20", text:"Link-in-bio tool configured", note:"e.g. Linktree, Koji, or Beacons, all releases, social accounts, and booking info in one link",
          help:{ guide:"Set up a link-in-bio page with: Latest release (pre-save or stream link), all streaming platform links, social media links, booking email, and EPK link. Beacons and Koji have better analytics than Linktree. Update it every release cycle.", vendors:[{name:"Beacons",url:"https://beacons.ai",note:"Best analytics"},{name:"Linktree",url:"https://linktr.ee",note:"Most widely recognised"},{name:"Koji",url:"https://koji.to"}] }},
      ]},
    ],
  },
  {
    id: "03", title: "Legal, Rights & Registration",
    cadence: "Unregistered songs lose royalties permanently, prioritise this before any new release",
    color: "#EF4444",
    categories: [
      { name: "Rights & Registrations", items: [
        { id:"03-01", text:"SAMRO membership, confirmed active", note:"South African Music Rights Organisation: samro.org.za. Register all compositions immediately",
          help:{ guide:"Apply for SAMRO membership at samro.org.za. Cost: approximately R450 for full membership. You'll need your ID, bank details, and a list of your songs. SAMRO collects performance royalties (radio, TV, live performances, streaming). Every week without registration is lost income.", link:"https://www.samro.org.za", linkLabel:"Apply at SAMRO", vendors:[{name:"SAMRO",url:"https://www.samro.org.za",note:"Performance royalties"},{name:"SAMRO Membership Info",url:"https://www.samro.org.za/membership"}] }},
        { id:"03-02", text:"All existing songs registered with SAMRO", note:"Do not wait, register every song regardless of whether it has been released yet",
          help:{ guide:"After joining SAMRO, log into the member portal and register each composition separately. You'll need: song title, co-writers and their SAMRO numbers, ISRC (if released), and publisher info. Register unreleased songs too — registration is pre-emptive, not post-release.", link:"https://online.samro.org.za", linkLabel:"SAMRO Member Portal" }},
        { id:"03-03", text:"SAMPRA membership, confirmed active", note:"South African Master Performers Association: sampra.org.za. Covers neighbouring rights on recordings",
          help:{ guide:"SAMPRA (sampra.org.za) collects neighbouring rights on sound recordings — different from SAMRO which covers compositions. Apply separately. SAMPRA distributes royalties from broadcast (radio, TV), public performances, and digital streams of the actual recording.", link:"https://www.sampra.org.za", linkLabel:"Apply at SAMPRA", vendors:[{name:"SAMPRA",url:"https://www.sampra.org.za",note:"Neighbouring rights on recordings"}] }},
        { id:"03-04", text:"All existing recordings registered with SAMPRA", note:"Each sound recording must be separately registered to collect neighbouring rights royalties",
          help:{ guide:"After joining SAMPRA, register each sound recording via the member portal. You'll need the ISRC for each recording. Register the master owner (label or the artist themselves if independent). Do this for every track, including old releases — SAMPRA can look back.", link:"https://www.sampra.org.za", linkLabel:"SAMPRA Member Portal" }},
        { id:"03-05", text:"Management Agreement signed", note:"Both parties must have a fully executed copy on file before any business is transacted",
          help:{ guide:"Use the Management Agreement template in this toolkit as a starting point, but have it reviewed by an entertainment attorney before signing. Both parties should have independent legal advice. Once signed, scan and store in your shared drive. The original signed hard copies must be filed separately.", vendors:[{name:"Entertainment Attorney SA",url:"https://www.lssa.org.za",note:"Find via Law Society of SA"},{name:"IPR Matters",note:"IP law specialists SA"},{name:"Adams & Adams",url:"https://www.adams.africa",note:"Music/IP specialists"}] }},
        { id:"03-06", text:"Record Label Agreement reviewed (if applicable)", note:"Ensure reversion clauses, streaming royalty rates, and term lengths are understood",
          help:{ guide:"Before signing ANY label deal, pay an entertainment attorney to review it. Key clauses to scrutinise: royalty rate (industry standard is 20–25% of streaming revenue for the artist), reversion clause (what happens if the label doesn't release the music?), term and options, and territory. Never sign on the same day you receive the contract.", vendors:[{name:"Adams & Adams",url:"https://www.adams.africa"},{name:"Law Society of SA",url:"https://www.lssa.org.za",note:"Find accredited entertainment lawyers"}] }},
        { id:"03-07", text:"Publishing Agreement in place (if applicable)", note:"Know who administers publishing rights, if self-published, ensure SAMRO reflects this",
          help:{ guide:"Publishing rights (the composition) are separate from master rights (the recording). If the artist is self-published, register as the publisher with SAMRO. If signed to a publisher, confirm SAMRO has the correct publisher split on record. A 50/50 or 75/25 (writer/publisher) split is typical.", vendors:[{name:"SAMRO Publisher Registration",url:"https://www.samro.org.za"},{name:"CAPASSO",url:"https://www.capasso.co.za",note:"Mechanical rights collection SA"}] }},
        { id:"03-08", text:"ISRC codes assigned to all releases", note:"Each recording requires a unique ISRC for DSP tracking and royalty collection",
          help:{ guide:"ISRCs (International Standard Recording Codes) are assigned by your distributor automatically, or you can get them directly from RISA (risa.co.za) as the SA ISRC registrar. Every track needs one. Log all ISRCs in your Song Master Metadata sheet.", link:"https://www.risa.co.za", linkLabel:"RISA ISRC Registration", vendors:[{name:"RISA",url:"https://www.risa.co.za",note:"SA ISRC registrar"},{name:"Your distributor",note:"Auto-assigns ISRCs on delivery"}] }},
        { id:"03-09", text:"UPC/EAN barcodes assigned per release", note:"Required for commercial distribution, obtain via distributor or independent",
          help:{ guide:"UPCs (for releases) are different from ISRCs (for recordings). Your distributor assigns a UPC to each release automatically. If self-distributing physically, purchase from GS1 SA. Log every UPC in your master catalogue.", vendors:[{name:"GS1 South Africa",url:"https://www.gs1za.org",note:"For physical product barcodes"}] }},
        { id:"03-10", text:"Performer's Protection Act obligations understood", note:"Both parties should understand what the Performers' Protection Act 11 of 1967 covers for SA performers",
          help:{ guide:"The Performers' Protection Act gives SA artists rights to remuneration when their performances are broadcast or communicated to the public. Speak to an entertainment attorney about how this interacts with your label/producer agreements. SAMPRA administers these rights.", vendors:[{name:"SAMPRA Legal Info",url:"https://www.sampra.org.za"},{name:"SA Copyright Resources",url:"https://www.cipc.co.za"}] }},
        { id:"03-11", text:"Copyright ownership documented for all works", note:"Co-written material must have signed split sheets, do not distribute without these",
          help:{ guide:"For every co-written song, a split sheet must be signed BEFORE the track is released. Use the Co-Writing Splits template in this toolkit. Store signed PDF copies in your shared drive. Without a split sheet, copyright disputes can freeze distribution and stall royalty payments permanently.", vendors:[{name:"SAMRO Split Sheet Guidance",url:"https://www.samro.org.za"}] }},
        { id:"03-12", text:"SARS tax registration in order", note:"Ensure the artist's tax affairs are compliant, a SARS issue can derail income processing entirely",
          help:{ guide:"Register the artist for income tax at sars.gov.za if not already done. Artists are provisional taxpayers — they must submit an IRP6 return twice a year (August and February). Engage an accountant with music industry experience to handle this. A SARS debt can result in bank accounts being frozen, which stops all income processing.", link:"https://www.sars.gov.za", linkLabel:"Register at SARS", vendors:[{name:"SARS eFiling",url:"https://efiling.sars.gov.za"},{name:"SAIT Accountant Directory",url:"https://www.thesait.org.za",note:"Find registered tax practitioners"}] }},
      ]},
    ],
  },
  {
    id: "04", title: "Assets & Documents to Collect",
    cadence: "Centralise everything in a shared cloud folder, accessible to both management and artist",
    color: "#F59E0B",
    categories: [
      { name: "Artist Identity Assets", items: [
        { id:"04-01", text:"Artist biography, short (100 words) and long (400 words)", note:"Written in third person. Should be fresh, genre-specific, and reflect 2026 positioning",
          help:{ guide:"Commission a music copywriter to write both versions. The short bio is for DSP profiles, Instagram bios, and booking submissions. The long bio is for press kits and media. Both must be written in third person, updated annually, and approved by the artist before use.", vendors:[{name:"Okay Africa Content Team",url:"https://www.okayafrica.com"},{name:"Upwork Music Writers",url:"https://www.upwork.com"}] }},
        { id:"04-02", text:"Professional press photographs", note:"Minimum three clean, high-resolution images suitable for editorial use, update at least annually",
          help:{ guide:"Commission a professional photographer who shoots musicians. You need: one head shot (clear background), one full-body editorial image, and one candid/lifestyle image. Images must be minimum 300dpi at A3 size for print. Get the RAW files — you may need different crops for different outlets.", vendors:[{name:"SA Music Photographers (search Behance)",url:"https://www.behance.net/search/projects?field=photography&search=music+south+africa"},{name:"The Photographers Gallery SA",url:"https://www.photozone.co.za"}] }},
        { id:"04-03", text:"Artist logo, vector file (AI or SVG) + PNG", note:"Must work on both dark and light backgrounds",
          help:{ guide:"Commission a graphic designer for both a wordmark (name in stylised typography) and an icon/symbol if applicable. Always get the AI (Adobe Illustrator) or SVG source file — without it, you cannot resize without quality loss. Test on both black and white backgrounds before finalising.", vendors:[{name:"99designs",url:"https://www.99designs.com"},{name:"Behance SA Designers",url:"https://www.behance.net"},{name:"Fiverr Logo Design",url:"https://www.fiverr.com"}] }},
        { id:"04-04", text:"One Sheet (PDF and editable version)", note:"For booking and pitch submissions, see Artist One Sheet template",
          help:{ guide:"Use the One Sheet Generator in this toolkit — go to the Marketing module to build one. A one sheet is a single-page document with: artist photo, bio (100 words), streaming stats, notable press, notable shows, and booking contact. Update it for every major campaign.", link:"/dashboard/library/marketing/one-sheet", linkLabel:"Build your One Sheet" }},
        { id:"04-05", text:"Electronic Press Kit (EPK)", note:"Password-protected link for industry submissions, include bio, stats, photos, videos, and booking info",
          help:{ guide:"Build a Google Drive folder or use Presskit.to with: artist bio (both lengths), 3+ press photos, streaming stats screenshot, top 3 music video links, best 2 live performance clips, press coverage links, and booking contact. Make it password-protected for non-public submission.", vendors:[{name:"Presskit.to",url:"https://presskit.to",note:"Dedicated EPK hosting"},{name:"Canva EPK Templates",url:"https://www.canva.com"},{name:"Google Drive",url:"https://drive.google.com"}] }},
        { id:"04-06", text:"Award nominations and wins, documented", note:"Save all SAMA, Channel O, METRO FM, Crown Gospel, or regional nominations in a single record",
          help:{ guide:"Create a 'Achievements' document with: award name, category, year, and status (nominated/won). Include screenshots or certificates where available. This feeds into the bio, one sheet, and any grant applications. Incomplete achievement records are a common gap in artist files.", vendors:[] }},
        { id:"04-07", text:"Full back catalogue, titles, ISRCs, release dates", note:"One master document, the Song Master Metadata sheet covers this",
          help:{ guide:"Use the Song Master Metadata tool in this toolkit to build a complete catalogue record. Essential fields: song title, ISRC, release date, UPC (if part of a release), distributor, PRO registration status (SAMRO/SAMPRA), split sheet on file (Y/N), and streaming platform links.", link:"/dashboard/tools/song-metadata", linkLabel:"Open Song Master Metadata Tool" }},
        { id:"04-08", text:"Lyrics, all released and unreleased songs", note:"Collected and filed per the Lyric Sheet template, required for PRO registration and sync pitching",
          help:{ guide:"Use the Lyric Sheet template in the Publishing module — it includes SAMRO registration fields, co-writer credits, PRO numbers, and section-by-section lyrics. Sync licensing (placement in film/TV/advertising) often requires clean lyrics within 24 hours of a pitch request — have them ready.", link:"/dashboard/library/publishing/lyric-sheet", linkLabel:"Open Lyric Sheet Template" }},
      ]},
      { name: "Video & Media Assets", items: [
        { id:"04-09", text:"Official music videos, links and file backups", note:"Keep both the online link and a local high-resolution file backup",
          help:{ guide:"Store the YouTube link AND download the MP4 file from the production company (you should have the master file as part of your production agreement). File the local copy in your shared drive. Labels, broadcasters, and festivals frequently request high-quality files on short notice.", vendors:[] }},
        { id:"04-10", text:"Live performance footage, curated links", note:"Select the strongest two or three for the EPK; label by event and year",
          help:{ guide:"Review all existing live footage and select the best 2–3 clips that show the artist at their highest energy and most professional. These go in the EPK. Label each clip: 'Artist Name – Show Name – City – Year'. Prioritise clips with good sound quality over visual quality.", vendors:[] }},
        { id:"04-11", text:"Interview and press footage, saved", note:"Collect all broadcast and online interview links for the media record",
          help:{ guide:"Search YouTube, the outlet websites, and your own records for every interview. Download copies where possible (use yt-dlp or a browser extension) — online content disappears. A complete media archive increases perceived legitimacy in industry pitches.", vendors:[] }},
        { id:"04-12", text:"Short-form content archive, TikTok, Reels, Shorts", note:"Screenshot and log high-performing content, engagement data informs future strategy",
          help:{ guide:"Download and save every piece of short-form content that performed above average. Log in a spreadsheet: platform, post date, views, engagement rate, and what made it perform. This is your algorithm intelligence — the best creative tool you have for future campaigns.", vendors:[] }},
        { id:"04-13", text:"Brand campaign content, saved", note:"Any content produced for brand partnerships should be archived for future use",
          help:{ guide:"Brand campaign footage has dual value: it demonstrates commercial viability (important for future brand pitches) and often contains high-quality production you can repurpose. Collect the master files and any usage rights agreements.", vendors:[] }},
      ]},
      { name: "Booking & Live Performance", items: [
        { id:"04-14", text:"Technical rider, current and formatted", note:"Input list, stage plot, monitor requirements, and backline specification, version dated",
          help:{ guide:"If the artist doesn't have a technical rider, build one with your production manager or sound engineer. It must include: input list (every mic/DI with channel assignment), monitor mix requirements, backline needs (whether you bring your own or not), and power requirements. Date-stamp every version.", vendors:[{name:"SAMF Production Guidelines",url:"https://www.samf.co.za",note:"SA Music Festival technical standards"},{name:"TAMA SA Production",note:"Contact production companies for rider templates"}] }},
        { id:"04-15", text:"Stage plot, visual diagram", note:"Must reflect current live setup, share with agent and promoter for every booking",
          help:{ guide:"Use the Stage Plot tool in this toolkit's Touring module to build a visual diagram. The stage plot shows every position on stage — artist positions, band member positions, monitor placements, and any required risers or furniture. Update it every time the live setup changes.", link:"/dashboard/library/touring/stage-plot", linkLabel:"Open Stage Plot Tool" }},
        { id:"04-16", text:"Hospitality rider", note:"Catering, dressing room, and accommodation requirements, keep realistic and professional",
          help:{ guide:"Keep the hospitality rider realistic and proportionate to the artist's level. Outrageous riders are industry jokes and can cost you bookings. Include: dressing room requirements, catering preferences (with dietary needs noted), accommodation standard, and ground transport. Keep it to one page.", vendors:[] }},
        { id:"04-17", text:"Performance fee structure, documented", note:"Range by event type: club, festival, private, corporate, international",
          help:{ guide:"Document a tiered fee structure: (1) Club/venue: walk-in fee, (2) Festival: based on slot size, (3) Private event (wedding, birthday), (4) Corporate event (highest rate), (5) International (add 25–40% travel uplift). These are starting points for negotiation — never publish publicly.", vendors:[] }},
      ]},
    ],
  },
  {
    id: "05", title: "Financial & Business Setup",
    cadence: "Clean financial administration protects both artist and management, establish correct structures early",
    color: "#10B981",
    categories: [
      { name: "Financial Foundations", items: [
        { id:"05-01", text:"Artist bank account details on file, dedicated business account", note:"Personal accounts should not be used for business income, open a business account immediately",
          help:{ guide:"Open a dedicated business bank account at a South African bank. FNB, Nedbank, and Standard Bank all have small business accounts. The account name should match the business entity that earns music income. Personal and business finances mixing is the #1 financial administration error in artist management.", vendors:[{name:"FNB Business Account",url:"https://www.fnb.co.za/business"},{name:"Nedbank Business",url:"https://www.nedbank.co.za/business"},{name:"Capitec Business",url:"https://www.capitecbank.co.za/business"}] }},
        { id:"05-02", text:"Company or sole proprietor registration status, confirmed", note:"If income will regularly exceed R1 million per year, corporatisation is strongly advised",
          help:{ guide:"Register a company (Pty) Ltd through CIPC at cipc.co.za for approximately R175. A registered company provides liability protection and is more credible for corporate bookings and brand deals. Sole proprietors earn in their personal name which exposes personal assets to business liability.", link:"https://www.cipc.co.za", linkLabel:"Register at CIPC", vendors:[{name:"CIPC Company Registration",url:"https://www.cipc.co.za",note:"~R175, online"},{name:"BizVault SA",url:"https://bizvault.co.za",note:"Assisted company registration"}] }},
        { id:"05-03", text:"VAT registration, assess if applicable", note:"Artists generating over R1 million in taxable turnover per year must register for VAT with SARS",
          help:{ guide:"If taxable income exceeds R1 million in any 12-month period, VAT registration is compulsory. Below this, voluntary registration may have advantages (claiming VAT on production costs). Speak to your accountant about timing — registering too early can create a cash flow burden.", link:"https://www.sars.gov.za/types-of-tax/value-added-tax", linkLabel:"SARS VAT Info" }},
        { id:"05-04", text:"Invoicing capability confirmed", note:"Artist or management must be able to issue compliant tax invoices for all engagements",
          help:{ guide:"South African tax invoices must include: invoice number, date, supplier name and address, VAT number (if VAT-registered), description of service, and amount. Use software like Xero, Wave (free), or a template. Never accept payment for a performance without issuing an invoice first.", vendors:[{name:"Wave (Free Invoicing)",url:"https://www.waveapps.com",note:"Completely free"},{name:"Xero",url:"https://www.xero.com/za"},{name:"Sage SA",url:"https://www.sage.com/en-za"}] }},
        { id:"05-05", text:"Provisional tax obligations communicated", note:"Artists are typically provisional taxpayers, ensure 6-monthly IRP6 submissions are diarised",
          help:{ guide:"Provisional tax is paid twice a year: first period (August 31) and second period (February 28). The IRP6 form estimates the year's income. Missing a provisional tax payment incurs a 20% penalty. Diarise both dates NOW and set a reminder 6 weeks before each to get the estimates from your accountant.", vendors:[{name:"SARS eFiling",url:"https://efiling.sars.gov.za"},{name:"SAIT Tax Practitioners",url:"https://www.thesait.org.za"}] }},
        { id:"05-06", text:"Accountant or bookkeeper engaged", note:"Recommended from the outset, financial mismanagement is one of the most common career-ending issues",
          help:{ guide:"Find a SAICA-registered accountant with music or entertainment industry experience. They must understand: provisional tax, royalty income, SARS compliance for irregular income streams, and VAT on performance fees. Expect to pay R800–R3,000/month depending on income volume and complexity.", vendors:[{name:"SAICA Accountant Directory",url:"https://www.saica.org.za",note:"Find registered CAs"},{name:"SAIT Tax Practitioners",url:"https://www.thesait.org.za"},{name:"Numbr",url:"https://www.numbr.co.za",note:"Online SA accountants"}] }},
        { id:"05-07", text:"International payment pathway established", note:"For cross-border payments: Wise, Payoneer, or forex-compliant bank account, test before it is urgent",
          help:{ guide:"Test your international payment setup BEFORE the first international fee is due. Wise (transferwise.com) is fastest and cheapest for SA recipients. Payoneer is preferred by some US industry platforms. All foreign income must be declared to SARS — your accountant must advise on Section 6quat credits for foreign tax paid.", vendors:[{name:"Wise",url:"https://wise.com/za",note:"Best rates for SA recipients"},{name:"Payoneer",url:"https://www.payoneer.com"},{name:"FNB Forex",url:"https://www.fnb.co.za/forex"}] }},
        { id:"05-08", text:"Currency exposure noted for international bookings", note:"ZAR volatility against USD, EUR, and GBP must be factored into international fee negotiations",
          help:{ guide:"When negotiating international fees, always try to invoice in USD or EUR — not ZAR. If invoiced in ZAR, build a 10–15% currency buffer into the fee to protect against rand weakness between invoice date and payment date. Use Wise's rate tracking to know the best time to convert.", vendors:[{name:"Wise Rate Alerts",url:"https://wise.com"},{name:"SARB Exchange Rates",url:"https://www.resbank.co.za",note:"Official SA Reserve Bank rates"}] }},
      ]},
    ],
  },
  {
    id: "06", title: "Content & Release Preparation",
    cadence: "Releases require at least 6-8 weeks of preparation, build the infrastructure before the music is finished",
    color: "#06B6D4",
    categories: [
      { name: "Release Infrastructure", items: [
        { id:"06-01", text:"Release schedule, 12-month plan drafted", note:"Use the Release Plan Template, map out all confirmed and projected releases for the year",
          help:{ guide:"Map every release on a Google Sheet with columns: release type (single/EP/album), target date, distributor submission deadline, Spotify pitch deadline, press embargo date, and marketing campaign start date. Work backwards from each release date to ensure you never miss a DSP submission window.", vendors:[] }},
        { id:"06-02", text:"DSP pitch deadlines diarised", note:"Spotify editorial pitch: 7 days before release. Apple Music: similar. Boomplay and Audiomack: direct relationship required",
          help:{ guide:"Spotify pitching MUST be submitted via Spotify for Artists at least 7 days before release date — not 7 days before the distributor submission date. For Boomplay and Audiomack, you need a direct relationship with their Africa editorial teams. For Apple, submit through your distributor or via Apple Music for Artists.", link:"https://artists.spotify.com/pitch", linkLabel:"Pitch on Spotify for Artists" }},
        { id:"06-03", text:"Song metadata complete for all upcoming releases", note:"Artist, title, ISRC, UPC, genre, language, BPM, credits, no blanks. Use the Song Master Metadata template",
          help:{ guide:"Incomplete metadata means incorrect DSP listings, missed royalties, and failed Content ID claims. Every field must be complete before delivery to your distributor — once live, changes take days or weeks. Use the Song Master Metadata tool to prepare everything before delivery.", link:"/dashboard/tools/song-metadata", linkLabel:"Open Song Master Metadata Tool" }},
        { id:"06-04", text:"Content calendar for release cycle built", note:"Pre-save campaign, cover art reveal, snippet rollout, behind-the-scenes, release day, post-release push",
          help:{ guide:"Build a day-by-day content calendar starting 4 weeks before release to 4 weeks after. Phases: (1) Teaser/announcement, (2) Cover art reveal, (3) Snippet/BTS content, (4) Pre-save campaign, (5) Release day content, (6) Post-release push for 2 weeks. Use the Social Media Calendar tool in this toolkit.", link:"/dashboard/tools/social-media-calendar", linkLabel:"Open Social Media Calendar Tool" }},
        { id:"06-05", text:"Cover artwork, final, formatted per DSP spec", note:"3000x3000px minimum, RGB, JPEG or PNG, no explicit logos or URLs, check each DSP's exact spec",
          help:{ guide:"Technical requirements: 3000x3000px minimum, RGB colour space (not CMYK), JPEG or PNG, maximum 72dpi for screen. Content rules: no social media handles, no website URLs, no explicit content (for clean versions), and no copyrighted imagery. Canva Pro or Photoshop are the standard tools.", vendors:[{name:"Canva Pro",url:"https://www.canva.com"},{name:"Spotify Cover Art Guidelines",url:"https://artists.spotify.com/help/article/cover-art-specs"}] }},
        { id:"06-06", text:"Playlist seeding strategy mapped", note:"Identify target editorial and independent playlists per release. South Africa, Nigeria, Kenya, Ghana at minimum",
          help:{ guide:"List target playlists in three tiers: (1) DSP Editorial (Spotify, Apple Music, Boomplay — requires direct pitch), (2) Playlist pitching services (Groover, SubmitHub — budget R2,000–R5,000 per campaign), (3) Independent playlist curators (direct DM outreach on Instagram).", vendors:[{name:"Groover",url:"https://groover.co",note:"Paid playlist pitching, good for Africa"},{name:"SubmitHub",url:"https://www.submithub.com",note:"Indie playlists and blogs"},{name:"Daily Playlists SA",url:"https://www.dailyplaylists.com"}] }},
        { id:"06-07", text:"TikTok and Reels sound strategy confirmed", note:"Decide whether to lead with the track hook or an alternative clip moment, brief 3-5 creator partners",
          help:{ guide:"Identify the 'TikTok moment' in the track — the 15-second clip that will drive use on the platform. This is usually the chorus hook or a compelling lyric. Brief 3–5 creators who align with the artist's audience to use the sound on release day. This seeds the algorithm before editorial picks it up.", vendors:[{name:"TikTok Creator Marketplace",url:"https://www.tiktok.com/business/en/apps/creator-marketplace"},{name:"AfroCreators",note:"SA TikTok creator network — DM based"}] }},
        { id:"06-08", text:"Press strategy in place for release", note:"Which outlets? Rolling Stone Africa, Okay Africa, TshisaLIVE, The Plug, Channel O, SABC, prioritised",
          help:{ guide:"Build a press list: Tier 1 (Rolling Stone Africa, Okay Africa, Mail & Guardian), Tier 2 (The Plug, TshisaLIVE, IOL Entertainment, Channel O), Tier 3 (music blogs, student media). Send embargoed press releases 2 weeks before release. Follow up with personalised emails to Tier 1 within 48 hours.", vendors:[{name:"Rolling Stone Africa",url:"https://rollingstoneza.co.za"},{name:"Okay Africa",url:"https://www.okayafrica.com"},{name:"TshisaLIVE",url:"https://www.timeslive.co.za/tshisalive"},{name:"The Plug SA",url:"https://theplug.co.za"}] }},
        { id:"06-09", text:"Radio strategy confirmed", note:"Commercial stations (Metro FM, 947, 5FM), regional (Ukhozi FM, Umhlobo Wenene, Lesedi FM), independent online stations",
          help:{ guide:"South African radio requires a radio plugger for effective commercial placement — cold submissions rarely succeed at Tier 1 stations. Budget R5,000–R15,000 per campaign for a plugger. For regional and community stations, direct relationships are more accessible.", vendors:[{name:"Metro FM Music Submission",url:"https://www.metrofm.co.za"},{name:"5FM Music",url:"https://www.5fm.co.za"},{name:"SA Radio Pluggers",note:"Contact via RISA or Music In Africa directory"}] }},
        { id:"06-10", text:"DJ and tastemaker seeding plan", note:"Who receives the track before release? Documented, with delivery method and follow-up dates",
          help:{ guide:"Build a DJ seeding list: 10–20 key DJs in the genre, sorted by market influence. Send via WeTransfer or a private SoundCloud link (never a WhatsApp voice note). Follow up exactly once, 5 days after sending. Relationships with DJs are long-term investments — a single DJ co-sign can trigger significant streaming movement.", vendors:[{name:"WeTransfer",url:"https://wetransfer.com"},{name:"SoundCloud Private Sharing",url:"https://soundcloud.com"}] }},
      ]},
    ],
  },
  {
    id: "07", title: "Team & Personnel Records",
    cadence: "A complete personnel record is essential for touring, visas, insurance, and emergency response",
    color: "#EC4899",
    categories: [
      { name: "Artist & Band Member Record", items: [
        { id:"07-01", text:"Full Legal Name, on file", note:"Required for contracts, visa applications, and tax documentation",
          help:{ guide:"Collect and store the full legal name exactly as it appears on the ID document — not stage names or abbreviated names. Any mismatch between contractual name and ID causes delays on visa applications, insurance claims, and SARS submissions.", vendors:[] }},
        { id:"07-02", text:"South African ID Number, on file", note:"Required for SAMRO/SAMPRA registration and SARS compliance",
          help:{ guide:"Collect the full 13-digit South African ID number. Store in an encrypted document (not plain text, not WhatsApp). Required for: SAMRO/SAMPRA registration, SARS tax filing, music industry insurance, certain bank account verifications, and visa applications.", vendors:[] }},
        { id:"07-03", text:"Passport Number & Expiry, confirmed", note:"Renew at least 6 months before expiry for visa purposes",
          help:{ guide:"Most countries require a passport valid for at least 6 months beyond the travel date. Diarise the expiry date and set a renewal reminder 8 months before expiry. Passport renewal from the SA Department of Home Affairs takes 4–8 weeks — do not leave this until the last minute.", link:"https://www.dha.gov.za", linkLabel:"SA Home Affairs Passport Info" }},
        { id:"07-04", text:"Emergency Contact, Name & Number, on file", note:"For touring, travel, and medical situations",
          help:{ guide:"Store a verified emergency contact (NOT the artist themselves — it should be a family member or partner). Confirm the number is correct and that the person knows they are the emergency contact. For international touring, also store the South African High Commission contact for the destination country.", vendors:[] }},
        { id:"07-05", text:"Medical Aid Scheme & Number, documented", note:"Essential for international touring, ensure it covers travel",
          help:{ guide:"For domestic touring, confirm the medical aid provides cover outside the home province. For international touring, take out travel medical insurance — many SA medical aids provide limited international cover. Discovery Health International Cover is one option but verify the specific plan.", vendors:[{name:"Discovery Health",url:"https://www.discovery.co.za"},{name:"Momentum Health",url:"https://www.momentum.co.za"},{name:"TIC Travel Insurance",url:"https://www.tic.co.za",note:"SA travel insurance specialist"}] }},
        { id:"07-06", text:"SAMRO Membership Number, on file", note:"Required for royalty collection and registration",
          help:{ guide:"Once the artist has joined SAMRO, they are issued a member number. Store this securely — it is required for every song registration submission and for claiming royalties. If the number cannot be found, contact SAMRO directly at samro.org.za.", link:"https://www.samro.org.za", linkLabel:"SAMRO Member Portal" }},
        { id:"07-07", text:"SAMPRA Membership Number, on file", note:"Required for neighbouring rights collection",
          help:{ guide:"SAMPRA issues a separate member number from SAMRO. Store it alongside the SAMRO number. This number is required for registering every sound recording (as distinct from song compositions with SAMRO).", link:"https://www.sampra.org.za", linkLabel:"SAMPRA Member Portal" }},
        { id:"07-08", text:"SARS Tax Reference Number, on file", note:"Required for tax-compliant income payments",
          help:{ guide:"The SARS tax reference number is 10 digits and is needed for: filing tax returns, receiving payments from corporates (they may need to withhold PAYE without it), and most banking relationships. Find it on any SARS correspondence or via eFiling.", link:"https://efiling.sars.gov.za", linkLabel:"SARS eFiling" }},
        { id:"07-09", text:"Banking Details, stored securely", note:"Account name, number, and bank, store encrypted, not in plain text",
          help:{ guide:"Store: bank name, account holder name (must match the entity receiving payment), account number, branch code, and account type. Use an encrypted password manager or a secure shared document — not a WhatsApp message, email, or plain text file. A bank account detail change request via email is a common fraud vector — always verify by phone before updating.", vendors:[{name:"1Password Teams",url:"https://1password.com/teams"},{name:"Bitwarden",url:"https://bitwarden.com"}] }},
      ]},
      { name: "Industry Team Record", items: [
        { id:"07-10", text:"Booking Agent, contact details on file", note:"Name, company, email, and phone",
          help:{ guide:"If the artist doesn't yet have a formal booking agent, identify 3–5 agents who represent similar artists at the same level. Book an introductory meeting before you need them urgently. For SA, start with agencies like ICM, 9-8-One, or Reel to Real.", vendors:[{name:"RISA Agent Directory",url:"https://www.risa.co.za"},{name:"Music In Africa",url:"https://www.musicinafrica.net/directory"}] }},
        { id:"07-11", text:"Entertainment Lawyer, engaged", note:"Non-negotiable before signing any agreement",
          help:{ guide:"An entertainment lawyer is the single most important professional relationship in artist management. They should review EVERY agreement before signing — management, label, publishing, brand deals. Budget R2,000–R8,000 per contract review. This fee is always smaller than the cost of a bad deal.", vendors:[{name:"Law Society of SA",url:"https://www.lssa.org.za"},{name:"Adams & Adams",url:"https://www.adams.africa",note:"Top IP/music law firm in SA"},{name:"IPR Matters SA",note:"Specialist IP attorneys"}] }},
        { id:"07-12", text:"Accountant / Tax Practitioner, engaged", note:"Must be familiar with South African entertainment income structures",
          help:{ guide:"Music income is complex: royalties, performance fees, brand deals, sync fees, and touring income each have different tax treatments. A general accountant without entertainment experience will miss legal tax savings and make filing errors. Ask specifically for experience with SAMRO royalties and provisional tax.", vendors:[{name:"SAICA Directory",url:"https://www.saica.org.za"},{name:"SAIT Tax Practitioner Search",url:"https://www.thesait.org.za"}] }},
        { id:"07-13", text:"Publicist / PR Company, identified or engaged", note:"Even if not yet retained, know who you would call",
          help:{ guide:"You don't need a full-time publicist at every career stage, but you must know who to call when you have a story to tell. Build a relationship before the album cycle — not during it. For SA, identify 3 PR firms or independent publicists who work in your genre.", vendors:[{name:"Red Pepper Communications",url:"https://www.redpepper.co.za"},{name:"RX Communications",url:"https://www.rxcomms.co.za"},{name:"PRISA PR Directory",url:"https://www.prisa.co.za"}] }},
        { id:"07-14", text:"Radio Plugger, identified", note:"Specialist contact for commercial and regional radio campaigns",
          help:{ guide:"A radio plugger is a specialist who has existing relationships with radio music directors and programme directors at SA commercial stations. Without one, unsolicited submissions are rarely playlisted at Metro FM, 947, or 5FM. Budget R5,000–R20,000 per radio campaign.", vendors:[{name:"Find via RISA",url:"https://www.risa.co.za"},{name:"Music In Africa Plugger Directory",url:"https://www.musicinafrica.net"}] }},
        { id:"07-15", text:"Record Label Contact, documented", note:"If signed, direct A&R and royalties contact at the label",
          help:{ guide:"If label-signed, store: A&R manager name and direct contact, royalties department email, finance/accounts payable contact, and marketing liaison. Labels change staff — verify contacts every 6 months. If a payment is late, you need to know exactly who to contact.", vendors:[] }},
      ]},
    ],
  },
  {
    id: "08", title: "Calendar & Scheduling",
    cadence: "A shared, always-current calendar is one of the most important tools in a well-run management setup",
    color: "#F97316",
    categories: [
      { name: "Calendar Setup", items: [
        { id:"08-01", text:"Shared calendar established", note:"Google Calendar recommended. Management and artist must both have full access, sync to all devices",
          help:{ guide:"Create a dedicated Google Calendar for the artist's professional commitments and share it with all team members. Use colour coding: Green = confirmed shows, Red = deadlines, Blue = studio, Orange = media/press, Purple = travel. The artist must not have editing rights — changes go through management.", vendors:[{name:"Google Calendar",url:"https://calendar.google.com"}] }},
        { id:"08-02", text:"Entire artist team added to shared calendar", note:"Agent, publicist, label rep, tour manager, everyone who needs visibility of commitments",
          help:{ guide:"Add each team member with 'View only' access unless they have a legitimate reason to add events. The goal: no one in the team should miss a commitment because they weren't informed. A shared calendar eliminates 90% of scheduling conflicts.", vendors:[{name:"Google Calendar Sharing Guide",url:"https://support.google.com/calendar/answer/37082"}] }},
        { id:"08-03", text:"All confirmed bookings loaded immediately", note:"Include full event details: date, time, venue, contact, fee, and settlement terms",
          help:{ guide:"Every confirmed booking must be entered within 24 hours of confirmation. Event details: show name, venue name, address, load-in time, soundcheck time, performance time, performance duration, fee agreed, payment terms (deposit %, balance timing), and promoter contact.", vendors:[] }},
        { id:"08-04", text:"DSP pitch deadlines added", note:"Spotify, Apple, Boomplay, Audiomack, Deezer, pitch windows are strict and non-negotiable",
          help:{ guide:"Add as recurring calendar events keyed to every planned release: Spotify (7 days before release date), Apple Music (similar), Boomplay (2 weeks recommended for editorial consideration), Audiomack (1 week). Missing these deadlines means no editorial consideration — no pitch, no playlist.", link:"https://artists.spotify.com/pitch", linkLabel:"Pitch on Spotify for Artists" }},
        { id:"08-05", text:"SAMRO quarterly royalty periods diarised", note:"Royalty distribution periods must be tracked, late registrations forfeit income",
          help:{ guide:"SAMRO distributes royalties quarterly. Ensure all songs performed or broadcast in any quarter are registered BEFORE the distribution period closes. Log into samro.org.za to check upcoming distribution dates and verify all songs are registered.", link:"https://www.samro.org.za", linkLabel:"SAMRO Member Portal" }},
        { id:"08-06", text:"Tax submission deadlines added", note:"Provisional tax (IRP6): August and February. Annual ITR12: due date varies, confirm with accountant",
          help:{ guide:"Diarise: IRP6 First Period (31 August), IRP6 Second Period (28 February), Annual ITR12 (date varies — confirm with SARS for the specific tax year). Set reminders 6 weeks before each to prepare figures with your accountant. Late submissions incur a 20% penalty on the shortfall.", link:"https://efiling.sars.gov.za", linkLabel:"SARS eFiling" }},
        { id:"08-07", text:"Festival and showcase submission deadlines", note:"SXSW, AfroNation, Cape Town Jazz Festival, Oppikoppi, One Music Fest, add all deadlines 12 months ahead",
          help:{ guide:"Research submission deadlines for target festivals 12 months in advance. Most SA festival applications open 6–9 months before the event. International showcase festivals (SXSW, Midem, Reeperbahn) have strict application windows.", vendors:[{name:"SXSW Submission",url:"https://www.sxsw.com/music/apply"},{name:"Cape Town International Jazz Festival",url:"https://www.capetownjazzfest.com"},{name:"One Music Fest",url:"https://www.onemusicfest.com"}] }},
        { id:"08-08", text:"Funding application deadlines diarised", note:"NAC, DSAC, NFVF, Creative SA, add all application windows annually",
          help:{ guide:"South African arts funding bodies open applications at specific times of year. Missing the window means waiting a full year. Add all opening and closing dates for: NAC (National Arts Council), DSAC (Dept of Sport, Arts and Culture), Creative SA, and any provincial arts councils relevant to the artist's home province.", vendors:[{name:"National Arts Council SA",url:"https://www.nac.org.za"},{name:"DSAC Bursaries",url:"https://www.dac.gov.za"},{name:"Creative SA",url:"https://www.creativesa.co.za"}] }},
        { id:"08-09", text:"Visa application timelines flagged", note:"International bookings should trigger a visa review at least 8 weeks before travel",
          help:{ guide:"As soon as an international booking is confirmed, immediately check: does the artist need a visa for the destination? South African passport holders currently require visas for most countries. Processing can take 4–8 weeks. Certain countries (UK, USA, Schengen) can take longer. Never leave this to the last 4 weeks.", vendors:[{name:"SA Department of Home Affairs",url:"https://www.dha.gov.za"},{name:"Visa Agency SA",url:"https://www.visafirst.com/za"}] }},
        { id:"08-10", text:"Monthly management review meetings scheduled", note:"Set recurring monthly check-in between artist and management, strategy, admin, and finances",
          help:{ guide:"Set a recurring monthly meeting (1–2 hours) covering: finances reviewed (income, expenses, outstanding payments), active releases performance, upcoming bookings confirmed, rights and registrations up to date, team feedback, and 30/60/90-day priorities confirmed. This is your management heartbeat meeting.", vendors:[] }},
      ]},
    ],
  },
  {
    id: "09", title: "First 30-Day Priority Actions",
    cadence: "The first month sets the tone, focus on the foundations that unlock everything else",
    color: "#6366F1",
    categories: [
      { name: "Week 1", items: [
        { id:"09-01", text:"Execute management agreement and open shared drive", note:"Legal framework and shared workspace before any business is transacted",
          help:{ guide:"Use the Management Agreement template in this toolkit, have it reviewed by an entertainment attorney, and execute both copies before any work begins. Simultaneously create the shared Google Drive folder structure: Admin (contracts, IDs), Finance, Music (stems, masters, metadata), Press, Social, Shows.", vendors:[{name:"Google Drive",url:"https://drive.google.com"},{name:"Dropbox Business",url:"https://www.dropbox.com/business"}] }},
        { id:"09-02", text:"Audit all existing platform assets and accounts", note:"Document every account, follower count, and engagement rate as a baseline",
          help:{ guide:"Create a spreadsheet with every platform account: name, URL, follower count, engagement rate (calculate it), last post date, and who has the login. This becomes your baseline — every metric is measured against it from month 1. Platforms with no recent activity should be either refreshed or deleted.", vendors:[] }},
        { id:"09-03", text:"File SAMRO and SAMPRA registrations", note:"Do not delay. Every week of delay is a week of uncollectable royalties",
          help:{ guide:"SAMRO registration takes 2–4 weeks to process after application. Do it in week 1. Simultaneously, list every existing song title with co-writer details ready for registration as soon as membership is confirmed. SAMPRA registration is a parallel process — apply to both simultaneously.", link:"https://www.samro.org.za", linkLabel:"Apply to SAMRO Now", vendors:[{name:"SAMRO",url:"https://www.samro.org.za"},{name:"SAMPRA",url:"https://www.sampra.org.za"}] }},
      ]},
      { name: "Week 2", items: [
        { id:"09-04", text:"Complete personnel records for all team members", note:"Emergency contacts, travel documents, banking, complete and stored",
          help:{ guide:"Use the Personnel Record template in this toolkit's Touring module. Collect every field for the artist plus every band member and regular collaborator: full legal name, ID number, passport number and expiry, emergency contact, medical aid, banking details. Store in an encrypted shared document.", link:"/dashboard/library/touring/personnel-record", linkLabel:"Open Personnel Record Template" }},
        { id:"09-05", text:"Build release calendar for next 6 months", note:"Decisions about timing drive everything else, make them early",
          help:{ guide:"List every piece of music that is finished, in progress, or planned for the next 6 months. For each, decide: is this a single, EP track, or album track? What is the target release date? Work backwards from that date to fill in: distributor submission, Spotify pitch, content plan start, and press outreach start.", vendors:[] }},
        { id:"09-06", text:"Confirm distributor and DSP profiles", note:"Claimed, verified, and optimised across all relevant platforms",
          help:{ guide:"By week 2, every major streaming profile should be claimed, verified, and optimised. Priority order: Spotify for Artists, Apple Music for Artists, Boomplay, Audiomack, YouTube OAC, Deezer. If any are unclaimed, the process takes 2–7 business days — start immediately.", vendors:[{name:"Spotify for Artists",url:"https://artists.spotify.com"},{name:"Apple Music for Artists",url:"https://artists.apple.com"},{name:"Boomplay for Artists",url:"https://www.boomplay.com"}] }},
      ]},
      { name: "Week 3", items: [
        { id:"09-07", text:"Develop content strategy for next 90 days", note:"Platform-specific plan: what posts, what format, what cadence, what narrative",
          help:{ guide:"For each active platform, define: posting frequency (e.g. TikTok 4x/week, Instagram Reels 3x/week, Stories daily, X 2x/week), content types (behind the scenes, music snippets, lifestyle, cultural commentary), and the dominant narrative for the quarter. Put it in the Social Media Calendar tool.", link:"/dashboard/tools/social-media-calendar", linkLabel:"Open Social Media Calendar" }},
        { id:"09-08", text:"Identify and brief PR and radio contacts", note:"Introductions take time, start building relationships before a release is imminent",
          help:{ guide:"Write a brief introduction email for each key media contact (not a press release — a personal introduction). Send it 6–8 weeks before any release. Ask for a coffee or call, not coverage. Relationships built before you need them are infinitely more valuable than cold pitches.", vendors:[{name:"Music In Africa Media Directory",url:"https://www.musicinafrica.net"},{name:"PRISA Media Contacts",url:"https://www.prisa.co.za"}] }},
      ]},
      { name: "Week 4", items: [
        { id:"09-09", text:"Review financials and establish payment workflow", note:"How income flows, what gets deducted, when the artist gets paid, agreed and documented",
          help:{ guide:"Document in writing how money flows: (1) Payment received into management/artist account, (2) Management commission deducted (document the percentage — typically 15–20%), (3) Expenses reimbursed from agreed budget, (4) Balance paid to artist within X days of receipt. Both parties must sign this addendum to the management agreement.", vendors:[] }},
        { id:"09-10", text:"First management review meeting", note:"Sit down together: review everything completed, agree priorities for the next 60 days",
          help:{ guide:"Use a structured agenda: (1) Onboarding checklist review — what is complete, what is outstanding, (2) Financial baseline established, (3) Streaming baseline locked in, (4) Next release confirmed and dated, (5) 60-day action plan agreed in writing. Both parties leave with the same list of priorities.", vendors:[] }},
      ]},
    ],
  },
];

function countItems(sections: ChecklistSection[]) {
  return sections.reduce((t, s) => t + s.categories.reduce((t2, c) => t2 + c.items.length, 0), 0);
}

function countByStatus(statuses: Record<string, ItemStatus>, status: ItemStatus, sections: ChecklistSection[]) {
  const allIds = sections.flatMap(s => s.categories.flatMap(c => c.items.map(i => i.id)));
  return allIds.filter(id => statuses[id] === status).length;
}

export default function ChecklistPage() {
  const handleExportPDF = () => { window.print(); };
  const { country, currency, currencyName } = useLocale();
  const res = getCountryResources(country);
  const proAbbr       = res.performanceRights.abbr;
  const mechAbbr      = res.mechanicalRights?.abbr ?? proAbbr;
  const neighbourAbbr = res.neighbouringRights?.abbr ?? proAbbr;
  const taxAbbr       = res.taxAuthorityAbbr ?? "Tax Authority";
  const busRegAbbr    = res.businessRegAbbr  ?? "Business Registry";

  // Replace SA-specific abbreviations with the selected country's equivalents
  const loc = useCallback((s: string) => s
    .replace(/\bSAMRO\b(?:\s*\/\s*SAMPRA)?(?:\s*\([^)]*\))?/g, `${proAbbr}${neighbourAbbr !== proAbbr ? ` / ${neighbourAbbr}` : ""}`)
    .replace(/\bSAMRO\b/g, proAbbr)
    .replace(/\bCAPASSO\b/g, mechAbbr)
    .replace(/\bSAMPRA\b/g, neighbourAbbr)
    .replace(/\bSARS\b/g, taxAbbr)
    .replace(/\bCIPC\b/g, busRegAbbr)
    .replace(/\bSouth African\b/g, country)
    .replace(/\bZAR\b/g, currency)
    // case-sensitive: "rand" → lowercase currency name; "Rand" → capitalised name
    .replace(/\brand\b/g, currencyName.toLowerCase())
    .replace(/\bRand\b/g, currencyName)
  , [proAbbr, mechAbbr, neighbourAbbr, taxAbbr, busRegAbbr, country, currency, currencyName]);

  const [statuses, setStatuses] = useState<Record<string, ItemStatus>>({});
  const [openHelp, setOpenHelp] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) setStatuses(JSON.parse(saved));
    } catch {}
    setLoaded(true);
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(LS_KEY, JSON.stringify(statuses));
  }, [statuses, loaded]);

  const setStatus = useCallback((id: string, status: ItemStatus) => {
    setStatuses(prev => {
      const current = prev[id];
      // Toggle off if already set to same status
      const next = current === status ? null : status;
      return { ...prev, [id]: next };
    });
    if (status === "help") {
      setOpenHelp(prev => prev === id ? null : id);
    } else {
      setOpenHelp(prev => prev === id ? null : prev);
    }
  }, []);

  const totalItems = countItems(SECTIONS);
  const doneCount = countByStatus(statuses, "done", SECTIONS);
  const helpCount = countByStatus(statuses, "help", SECTIONS);
  const pct = Math.round((doneCount / totalItems) * 100);

  return (
    <div className="animate-fade-in max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-text-muted mb-6">
          <SaveButton toolSlug="checklist" getData={() => {}} title={`Checklist — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
            <ExportButton onPDF={handleExportPDF} />

        <Link href="/dashboard/library" className="hover:text-text-primary transition-colors">Toolkit</Link>
        <ChevronRight size={12}/>
        <Link href="/dashboard/library/startup" className="hover:text-text-primary transition-colors">Onboarding New Artists</Link>
        <ChevronRight size={12}/>
        <span className="text-text-primary">Onboarding Checklist</span>
      </div>

      {/* Header */}
      <div className="glass-card rounded-2xl p-7 mb-8" style={{ borderColor: "#C9A84C25" }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: MODULE_COLOR }}>2026</p>
            <h1 className="text-2xl font-black text-text-primary mb-2">Artist Onboarding Checklist</h1>
            <p className="text-sm text-text-muted leading-relaxed max-w-xl">
              Work through each section systematically. Mark each task Done, Not Done, or click Need Help for step-by-step guidance and vetted vendor recommendations.
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-success"><CheckCircle size={13}/>{doneCount} Done</div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-brand"><HelpCircle size={13}/>{helpCount} Need Help</div>
              <div className="text-xs text-text-muted">{totalItems - doneCount} remaining</div>
            </div>
          </div>
          <button type="button" onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold flex-shrink-0 transition-all hover:opacity-80"
            style={{ backgroundColor: `${MODULE_COLOR}20`, color: MODULE_COLOR, border: `1px solid ${MODULE_COLOR}30` }}>
            <Printer size={15}/><span className="hidden sm:inline">Save as PDF</span>
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="glass-card rounded-xl p-4 mb-8" style={{ borderColor: "rgba(201,168,76,0.2)", backgroundColor: "rgba(201,168,76,0.04)" }}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-brand uppercase tracking-widest">Overall Progress</p>
          <p className="text-xs font-bold text-text-primary">{doneCount} / {totalItems} complete</p>
        </div>
        <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: "linear-gradient(90deg, #C9A84C, #F59E0B)" }}/>
        </div>
        <p className="text-xs text-text-muted mt-1.5">{pct}% done{pct === 100 ? " 🎉 Onboarding complete!" : ""}</p>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-6 px-1 text-xs text-text-muted">
        <span className="font-semibold text-text-primary">Mark each task:</span>
        <span className="flex items-center gap-1 text-success"><CheckCircle size={12}/> Done</span>
        <span className="flex items-center gap-1 text-error"><XCircle size={12}/> Not Done</span>
        <span className="flex items-center gap-1 text-brand"><HelpCircle size={12}/> Need Help</span>
      </div>

      {/* Sections */}
      <div className="space-y-10 mb-10">
        {SECTIONS.map((section) => {
          const sectionItems = section.categories.flatMap(c => c.items);
          const sectionDone = sectionItems.filter(i => statuses[i.id] === "done").length;

          return (
            <div key={section.id}>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-5 rounded-full flex-shrink-0" style={{ backgroundColor: section.color }}/>
                  <div>
                    <h2 className="text-base font-black text-text-primary">
                      <span style={{ color: section.color }}>{section.id} </span>{section.title}
                    </h2>
                    <p className="text-xs text-text-muted">{section.cadence}</p>
                  </div>
                </div>
                <span className="text-xs font-bold flex-shrink-0" style={{ color: section.color }}>
                  {sectionDone}/{sectionItems.length}
                </span>
              </div>

              <div className="space-y-3">
                {section.categories.map((cat) => (
                  <div key={cat.name} className="glass-card rounded-xl overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-border" style={{ backgroundColor: `${section.color}08` }}>
                      <p className="text-xs font-black uppercase tracking-wider" style={{ color: section.color }}>{cat.name}</p>
                    </div>
                    <div className="divide-y divide-border">
                      {cat.items.map((item) => {
                        const status = statuses[item.id];
                        const helpOpen = openHelp === item.id;

                        return (
                          <div key={item.id}>
                            <div className={`px-4 py-3 transition-colors ${status === "done" ? "bg-success/5" : status === "not_done" ? "bg-error/5" : status === "help" ? "bg-brand/5" : ""}`}>
                              <div className="flex items-start gap-3">
                                {/* Task text */}
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm leading-snug font-semibold transition-colors ${status === "done" ? "text-text-muted line-through" : "text-text-primary"}`}>
                                    {loc(item.text)}
                                  </p>
                                  <p className="text-xs text-text-muted leading-relaxed mt-0.5">{loc(item.note)}</p>
                                </div>

                                {/* Three action buttons */}
                                <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                                  {/* Done */}
                                  <button
                                    onClick={() => setStatus(item.id, "done")}
                                    title="Mark as Done"
                                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                                      status === "done"
                                        ? "bg-success text-white"
                                        : "bg-success/10 text-success hover:bg-success/20"
                                    }`}>
                                    <CheckCircle size={12}/>
                                    <span className="hidden sm:inline">Done</span>
                                  </button>
                                  {/* Not Done */}
                                  <button
                                    onClick={() => setStatus(item.id, "not_done")}
                                    title="Mark as Not Done"
                                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                                      status === "not_done"
                                        ? "bg-error text-white"
                                        : "bg-error/10 text-error hover:bg-error/20"
                                    }`}>
                                    <XCircle size={12}/>
                                    <span className="hidden sm:inline">Not Done</span>
                                  </button>
                                  {/* Need Help */}
                                  <button
                                    onClick={() => setStatus(item.id, "help")}
                                    title="I need help with this"
                                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                                      status === "help"
                                        ? "bg-brand text-background"
                                        : "bg-brand/10 text-brand hover:bg-brand/20"
                                    }`}>
                                    <HelpCircle size={12}/>
                                    <span className="hidden sm:inline">Need Help?</span>
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Help Panel */}
                            {(status === "help" || helpOpen) && (
                              <div className="border-t border-brand/20 bg-brand/5 px-4 py-4">
                                <div className="flex items-start justify-between gap-3 mb-3">
                                  <p className="text-xs font-black text-brand uppercase tracking-widest flex items-center gap-1.5">
                                    <HelpCircle size={12}/> How to complete this
                                  </p>
                                  <button onClick={() => { setOpenHelp(null); setStatuses(p => ({...p, [item.id]: null})); }}
                                    className="text-text-muted hover:text-text-primary transition-colors flex-shrink-0">
                                    <X size={14}/>
                                  </button>
                                </div>
                                <p className="text-sm text-text-primary leading-relaxed mb-4">{loc(item.help.guide)}</p>

                                {/* Direct action link */}
                                {item.help.link && (
                                  <a href={item.help.link} target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-brand bg-brand/10 hover:bg-brand/20 px-3 py-2 rounded-lg transition-all mb-4">
                                    <ExternalLink size={11}/>{item.help.linkLabel || "Open resource"}
                                  </a>
                                )}

                                {/* Vendors */}
                                {item.help.vendors && item.help.vendors.length > 0 && (
                                  <div>
                                    <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Recommended resources</p>
                                    <div className="flex flex-wrap gap-2">
                                      {item.help.vendors.map((v, i) => (
                                        <div key={i} className="group">
                                          {v.url ? (
                                            <a href={v.url} target="_blank" rel="noopener noreferrer"
                                              className="flex flex-col gap-0.5 bg-surface border border-border hover:border-brand/40 rounded-lg px-3 py-2 transition-all">
                                              <span className="text-xs font-bold text-text-primary group-hover:text-brand transition-colors flex items-center gap-1">
                                                {loc(v.name)}<ExternalLink size={9}/>
                                              </span>
                                              {v.note && <span className="text-[10px] text-text-muted">{loc(v.note)}</span>}
                                            </a>
                                          ) : (
                                            <div className="flex flex-col gap-0.5 bg-surface border border-border rounded-lg px-3 py-2">
                                              <span className="text-xs font-bold text-text-primary">{loc(v.name)}</span>
                                              {v.note && <span className="text-[10px] text-text-muted">{loc(v.note)}</span>}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
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

      {/* Bottom note */}
      <div className="glass-card rounded-xl p-5 mb-8" style={{ borderColor: "rgba(201,168,76,0.2)", backgroundColor: "rgba(201,168,76,0.04)" }}>
        <p className="text-xs font-bold text-brand uppercase tracking-widest mb-2">Document Control</p>
        <p className="text-sm text-text-muted leading-relaxed">
          Your progress is saved to this browser automatically. Use <span className="text-text-primary font-semibold">Save as PDF</span> to keep a permanent record and share with your artist.
        </p>
      </div>

      <Link href="/dashboard/library/startup" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors">
        <ChevronLeft size={15}/>Back to Onboarding New Artists
      </Link>
    </div>
  );
}
