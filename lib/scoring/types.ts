// ============================================================
// ROSTER — Scoring engine types
// ------------------------------------------------------------
// Shared shapes for the scoring engine. Kept in their own file
// so they can be imported by client components (the UI badge,
// the Update Stats modal) without dragging in the algorithm.
// ============================================================

export type Platform =
  | "spotify"
  | "youtube"
  | "audiomack"
  | "boomplay"
  | "tiktok"
  | "instagram"
  | "mdundo"
  | "deezer";

// All known metric source values — mirrors the SQL CHECK
// constraint in migration 018. Used for trust-weighting later.
export type MetricSource =
  | "manual"
  | "spotify_api"
  | "spotify_oauth"
  | "youtube_api"
  | "audiomack_api"
  | "tiktok_oauth"
  | "tiktok_api"
  | "instagram_api"
  | "boomplay_api"
  | "mdundo_api"
  | "deezer_api";

export interface MetricSnapshot {
  platform: Platform;
  metric: string;
  value: number;
  snapshotAt: string; // ISO string
  source: MetricSource;
}

// One contribution row per signal that fed a score, used by
// the "why is this 67?" tooltip in the UI.
export interface SignalContribution {
  signal: string; // e.g. "spotify.streams_28d"
  contribution: number; // points contributed to the score (0-100 scale)
}

export interface ArtistScores {
  // 0-100. Aggregate "how many people the artist reached".
  reach: number;
  // -100 to +100 (signed). Velocity across reach + engagement
  // signals. Negative means declining; the UI surfaces this as
  // a down-arrow + red.
  momentum: number;
  // 0-100. Depth signals (paid support, listening time, shares,
  // saves) weighted by bot-resistance.
  engagement: number;

  // Diagnostic breakdown — never shown by default but available
  // for the "score breakdown" hover in the widget. Sorted desc
  // by contribution so the biggest drivers are first.
  breakdown: {
    reach: SignalContribution[];
    momentum: SignalContribution[];
    engagement: SignalContribution[];
  };

  // Coverage flags so the UI can warn "this artist has no
  // engagement data yet — score is just based on reach".
  coverage: {
    reachSignals: number;
    momentumSignals: number;
    engagementSignals: number;
  };
}
