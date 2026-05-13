// ============================================================
// ROSTER — Platform/metric registry
// ------------------------------------------------------------
// Single source of truth for "what platforms ROSTER tracks and
// what metrics each one accepts". The Update Stats modal reads
// this to build its tabs and fields, the API route reads it to
// validate incoming PATCH bodies, and the scoring config (above)
// references the same metric keys.
//
// Adding a new metric here is the only change needed to surface
// it in the modal — the rest is wired generically.
//
// ── 28-day rolling convention ───────────────────────────────
// Volume metrics (streams, plays, views, sound uses, etc.) are
// stored as the LAST 28 DAYS of activity, NOT lifetime totals.
// This is the only way scores reflect *current* market position
// — a viral hit from 2 years ago shouldn't dominate a cold
// artist's score today. 28 days matches Spotify's monthly_listeners
// window, Instagram's monthly insights window, and TikTok's
// default analytics range.
//
// Cumulative-OK signals (intentional exceptions):
//   - followers / subscribers — slow-moving trust asset
//   - audiomack.supporters — paid commitment doesn't decay
//   - boomplay.fans (favourites) — same logic
// ============================================================

import type { Platform } from "./types";

export interface MetricFieldDef {
  /** Lowercase snake_case key — matches the SQL `metric` column. */
  key: string;
  /** Human label for the modal input. */
  label: string;
  /** Helper text under the field — what to enter, where to find it. */
  hint?: string;
  /** Placeholder example value. */
  placeholder?: string;
  /** Which composite score(s) this metric feeds. UI hint only. */
  feeds: Array<"reach" | "momentum" | "engagement">;
}

export interface PlatformDef {
  key: Platform;
  label: string;
  /** One-line subtitle for the tab — e.g. "Streams + super listeners". */
  blurb: string;
  /** Visual emoji/icon for the tab badge. */
  icon: string;
  /** Reach (volume) fields — usually entered first. */
  reach: MetricFieldDef[];
  /** Engagement (depth) fields. */
  engagement: MetricFieldDef[];
}

// Order = the tab order in the modal. Spotify first because it's
// the most-used reference point, then YouTube/Audiomack/Boomplay
// (the auto-pull or Africa-priority platforms), then the manual
// stragglers.
export const PLATFORMS: PlatformDef[] = [
  {
    key: "spotify",
    label: "Spotify",
    blurb: "Streams, listeners, UGC playlist adds",
    icon: "🟢",
    reach: [
      {
        key: "monthly_listeners",
        label: "Monthly listeners",
        hint: "From the public Spotify artist page (already a 28-day rolling window)",
        placeholder: "e.g. 1,240,000",
        feeds: ["reach"],
      },
      {
        key: "streams_28d",
        label: "Streams (last 28 days)",
        hint: "Spotify for Artists → Audience → Streams → set range to 28 days",
        placeholder: "e.g. 2,400,000",
        feeds: ["reach", "momentum"],
      },
      {
        key: "followers",
        label: "Followers",
        hint: "Public Spotify artist page (cumulative)",
        placeholder: "e.g. 125,430",
        feeds: ["reach"],
      },
    ],
    engagement: [
      {
        key: "ugc_playlist_adds_28d",
        label: "UGC playlist adds (last 28 days)",
        hint: "S4A → Playlists → filter Editorial vs Listener-made → 28-day window",
        placeholder: "e.g. 1,200",
        feeds: ["engagement"],
      },
      {
        key: "super_listeners",
        label: "Super listeners",
        hint: "Spotify for Artists → Audience (already a 28-day rolling window)",
        placeholder: "e.g. 1,840",
        feeds: ["engagement"],
      },
      {
        key: "saves_28d",
        label: "Saves (last 28 days)",
        hint: "S4A → Music → Saves → set range to 28 days",
        placeholder: "e.g. 6,800",
        feeds: ["engagement"],
      },
    ],
  },
  {
    key: "youtube",
    label: "YouTube",
    blurb: "Views, subscribers, comments",
    icon: "🔴",
    reach: [
      {
        key: "views_28d",
        label: "Views (last 28 days)",
        hint: "YT Studio → Analytics → Overview → last 28 days. Bot-discounted by 0.6x in scoring.",
        placeholder: "e.g. 4,200,000",
        feeds: ["reach", "momentum"],
      },
      {
        key: "subscribers",
        label: "Subscribers",
        hint: "Channel home page (cumulative)",
        placeholder: "e.g. 850,000",
        feeds: ["reach"],
      },
    ],
    engagement: [
      {
        key: "comments_28d",
        label: "Comments (last 28 days)",
        hint: "YT Studio → Analytics → Engagement → Comments → 28-day window",
        placeholder: "e.g. 1,200",
        feeds: ["engagement", "momentum"],
      },
      {
        key: "watch_time_seconds_28d",
        label: "Watch time (seconds, last 28 days)",
        hint: "YT Studio → Analytics → Watch time (in seconds)",
        placeholder: "e.g. 45,000,000",
        feeds: ["engagement"],
      },
    ],
  },
  {
    key: "audiomack",
    label: "Audiomack",
    blurb: "Plays, supporters (paid)",
    icon: "🟠",
    reach: [
      {
        key: "plays_28d",
        label: "Plays (last 28 days)",
        hint: "Audiomack creator dashboard → Analytics → 28-day range",
        placeholder: "e.g. 320,000",
        feeds: ["reach", "momentum"],
      },
      {
        key: "followers",
        label: "Followers",
        hint: "Cumulative",
        placeholder: "e.g. 32,000",
        feeds: ["reach"],
      },
    ],
    engagement: [
      {
        key: "supporters",
        label: "Supporters (paid, cumulative)",
        hint: "Highest-trust signal in the model — paid intent doesn't decay so we keep this cumulative",
        placeholder: "e.g. 420",
        feeds: ["engagement"],
      },
    ],
  },
  {
    key: "boomplay",
    label: "Boomplay",
    blurb: "Streams, fans (Africa-first DSP)",
    icon: "🔵",
    reach: [
      {
        key: "streams_28d",
        label: "Streams (last 28 days)",
        hint: "Boomplay artist dashboard → Analytics → 28-day range",
        placeholder: "e.g. 800,000",
        feeds: ["reach", "momentum"],
      },
      {
        key: "followers",
        label: "Followers",
        hint: "Cumulative",
        placeholder: "e.g. 28,500",
        feeds: ["reach"],
      },
    ],
    engagement: [
      {
        key: "fans",
        label: "Fans / favourites (cumulative)",
        hint: "Users who marked the artist as a favourite — sticky like a follow, kept cumulative",
        placeholder: "e.g. 9,800",
        feeds: ["engagement"],
      },
    ],
  },
  {
    key: "tiktok",
    label: "TikTok",
    blurb: "Sound uses, video views, followers",
    icon: "⚫",
    reach: [
      {
        key: "video_views_28d",
        label: "Video views (last 28 days)",
        hint: "TikTok Creator → Analytics → Overview → 28-day range. Bot-discounted by 0.5x.",
        placeholder: "e.g. 1,800,000",
        feeds: ["reach", "momentum"],
      },
      {
        key: "followers",
        label: "Followers",
        hint: "Cumulative",
        placeholder: "e.g. 410,000",
        feeds: ["reach"],
      },
    ],
    engagement: [
      {
        key: "sound_uses_28d",
        label: "Sound uses (last 28 days)",
        hint: "TikTok Creator → Sounds → Used in → 28-day range. The big virality signal.",
        placeholder: "e.g. 2,400",
        feeds: ["momentum", "engagement"],
      },
    ],
  },
  {
    key: "instagram",
    label: "Instagram",
    blurb: "Reach, saves, shares",
    icon: "🟣",
    reach: [
      {
        key: "reach_28d",
        label: "Reach (last 28 days)",
        hint: "IG Insights → Accounts reached → 28-day range",
        placeholder: "e.g. 1,200,000",
        feeds: ["reach", "momentum"],
      },
      {
        key: "followers",
        label: "Followers",
        hint: "Cumulative",
        placeholder: "e.g. 380,000",
        feeds: ["reach"],
      },
    ],
    engagement: [
      {
        key: "saves_28d",
        label: "Saves (last 28 days)",
        hint: "IG Insights → Content interactions → Saves",
        placeholder: "e.g. 12,400",
        feeds: ["engagement", "momentum"],
      },
      {
        key: "shares_28d",
        label: "Shares (last 28 days)",
        hint: "IG Insights → Content interactions → Shares",
        placeholder: "e.g. 8,900",
        feeds: ["engagement", "momentum"],
      },
      {
        key: "comments_28d",
        label: "Comments (last 28 days)",
        hint: "IG Insights → Content interactions → Comments",
        placeholder: "e.g. 3,200",
        feeds: ["engagement"],
      },
    ],
  },
  {
    key: "mdundo",
    label: "Mdundo",
    blurb: "Plays (East Africa)",
    icon: "🟤",
    reach: [
      {
        key: "plays_28d",
        label: "Plays (last 28 days)",
        hint: "Mdundo creator dashboard → 28-day range",
        placeholder: "e.g. 80,000",
        feeds: ["reach", "momentum"],
      },
    ],
    engagement: [],
  },
  {
    key: "deezer",
    label: "Deezer",
    blurb: "Plays (FR-speaking markets)",
    icon: "🟡",
    reach: [
      {
        key: "plays_28d",
        label: "Plays (last 28 days)",
        hint: "Deezer for Creators → Stats → 28-day range",
        placeholder: "e.g. 240,000",
        feeds: ["reach", "momentum"],
      },
    ],
    engagement: [],
  },
];

// Lookup helpers
export function getPlatform(key: Platform): PlatformDef | undefined {
  return PLATFORMS.find((p) => p.key === key);
}

export function isValidMetric(platform: string, metric: string): boolean {
  const p = PLATFORMS.find((x) => x.key === platform);
  if (!p) return false;
  return [...p.reach, ...p.engagement].some((f) => f.key === metric);
}
