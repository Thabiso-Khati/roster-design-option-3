export const dynamic = 'force-dynamic';

/**
 * GET /api/ticker
 *
 * Fetches live music-industry headlines from multiple RSS feeds and merges
 * them with a set of curated deadline / opportunity events.
 *
 * Results are cached by Next.js for 30 minutes (revalidate: 1800).
 * If all RSS feeds fail, the curated events are returned on their own so the
 * ticker always has content.
 */
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 1800; // 30 minutes

// ─── Types ───────────────────────────────────────────────────────────────────

type TickerType = "deadline" | "opportunity" | "news" | "new-on-roster";

interface TickerEvent {
  id: string;
  type: TickerType;
  headline: string;
  detail: string;
  country?: string;
  endsAt?: string;
  href?: string;
  priority: "critical" | "normal";
}

// ─── RSS sources ─────────────────────────────────────────────────────────────

const FEEDS: { url: string; country?: string }[] = [
  { url: "https://www.musicbusinessworldwide.com/feed/" },
  { url: "https://www.billboard.com/feed/" },
  { url: "https://pitchfork.com/rss/news/feed/rss" },
  { url: "https://www.musicinafrica.net/rss.xml" },
];

// ─── Curated events (deadlines / opportunities — manually maintained) ─────────
//
// These supplement the live RSS feed. Update endsAt dates each season.
// Items with an expired endsAt are automatically filtered out.

const CURATED: TickerEvent[] = [
  {
    id: "cur-samro-q2",
    type: "deadline",
    headline: "SAMRO Q2 royalty claims window",
    detail:
      "South African Music Rights Organisation is accepting Q2 performance claim submissions. Register all live and broadcast performances before the window closes.",
    country: "ZA",
    endsAt: "2026-06-30",
    priority: "critical",
  },
  {
    id: "cur-afrima-2026",
    type: "deadline",
    headline: "AFRIMA 2026 submission deadline",
    detail:
      "All-Africa Music Awards submissions for the 2026 edition. Releases from the current eligibility period are now being considered. Complete entry pack required.",
    endsAt: "2026-07-15",
    priority: "critical",
  },
  {
    id: "cur-acces-2026",
    type: "opportunity",
    headline: "ACCES 2026 — showcase & speaker applications",
    detail:
      "Music In Africa's annual ACCES conference in Nairobi is accepting applications for showcase artists and industry panel speakers. Focus on live performance and business development.",
    country: "KE",
    endsAt: "2026-08-01",
    priority: "normal",
  },
  {
    id: "cur-sauti-busara",
    type: "opportunity",
    headline: "Sauti za Busara 2027 artist applications open",
    detail:
      "The pan-African world-music festival on Zanzibar has opened artist applications for its 2027 edition. Selected artists receive travel, accommodation, and a performance fee.",
    country: "TZ",
    endsAt: "2026-09-01",
    priority: "normal",
  },
  {
    id: "cur-goethe-residency",
    type: "opportunity",
    headline: "Goethe-Institut Music Residency — 2026 intake",
    detail:
      "Three-month music residency in Berlin for artists and producers from across the continent. Full monthly stipend and studio access provided. Apply via your nearest Goethe-Institut.",
    endsAt: "2026-09-15",
    priority: "normal",
  },
  {
    id: "cur-new-expert-sync",
    type: "new-on-roster",
    headline: "New expert: Chidi Okonkwo — publishing & sync, Lagos",
    detail:
      "15 years at Sony/ATV Africa. Specialises in sub-publishing deals and cross-territory collections. Booking calendar now open on ROSTER.",
    href: "/dashboard/experts",
    priority: "normal",
  },
  {
    id: "cur-new-mc-sync",
    type: "new-on-roster",
    headline: "New masterclass: Structuring a Sync Deal for a Global Catalog",
    detail:
      "A 48-minute masterclass on negotiating sync terms when your catalog spans multiple territories. With industry practitioners from Lagos, Nairobi, and London.",
    href: "/dashboard/masterclasses",
    priority: "normal",
  },
];

// ─── Lightweight RSS XML parser ───────────────────────────────────────────────

interface RssItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
}

function extractTag(xml: string, tag: string): string {
  // Handle both <tag>content</tag> and <tag><![CDATA[content]]></tag>
  const re = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, "i");
  const m = xml.match(re);
  if (!m) return "";
  return m[1].trim();
}

function parseRssItems(xml: string, limit = 6): RssItem[] {
  const items: RssItem[] = [];
  // Split on <item> boundaries
  const parts = xml.split(/<item[\s>]/i);
  for (let i = 1; i < parts.length && items.length < limit; i++) {
    const chunk = parts[i];
    const title = extractTag(chunk, "title");
    const description = extractTag(chunk, "description");
    const link = extractTag(chunk, "link");
    const pubDate = extractTag(chunk, "pubDate");
    if (title && title.length > 10) {
      items.push({ title, description, link, pubDate });
    }
  }
  return items;
}

function truncate(s: string, max: number): string {
  const plain = s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#8217;/g, "'").replace(/&#8220;/g, "“").replace(/&#8221;/g, "”").replace(/&quot;/g, '"').replace(/&nbsp;/g, " ").trim();
  return plain.length > max ? plain.slice(0, max - 1) + "…" : plain;
}

async function fetchFeed(url: string, country?: string): Promise<TickerEvent[]> {
  const res = await fetch(url, {
    headers: { "User-Agent": "ROSTER/1.0 (music industry platform)" },
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) return [];
  const xml = await res.text();
  const items = parseRssItems(xml, 6);
  return items.map((item, idx) => ({
    id: `rss-${encodeURIComponent(url).slice(-20)}-${idx}`,
    type: "news" as TickerType,
    headline: truncate(item.title, 90),
    detail: truncate(item.description || item.title, 320),
    country,
    href: item.link || undefined,
    priority: "normal" as const,
  }));
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET() {
  // Filter out curated events whose deadline has already passed
  const now = Date.now();
  const activeCurated = CURATED.filter((e) => {
    if (!e.endsAt) return true;
    return new Date(e.endsAt).getTime() > now;
  });

  // Attempt all feeds in parallel; individual failures are swallowed
  const rssEvents: TickerEvent[] = [];
  const results = await Promise.allSettled(
    FEEDS.map((f) => fetchFeed(f.url, f.country))
  );
  for (const r of results) {
    if (r.status === "fulfilled") rssEvents.push(...r.value);
  }

  // Deduplicate RSS by similar headline prefix (first 40 chars)
  const seen = new Set<string>();
  const deduped = rssEvents.filter((e) => {
    const key = e.headline.slice(0, 40).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Merge: curated first (deadlines / opportunities / roster), then live news
  const events: TickerEvent[] = [...activeCurated, ...deduped];

  return NextResponse.json(
    { events, fetchedAt: new Date().toISOString(), liveCount: deduped.length },
    {
      headers: {
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=300",
      },
    }
  );
}
