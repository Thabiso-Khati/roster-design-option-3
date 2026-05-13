/**
 * Shared types for the ArtistsWidget sub-component tree.
 * Kept separate so every child file imports from one place.
 */

export interface LiveArtist {
  id: string;
  name: string;
  genre: string;
  country: string | null;
  countryFlag: string;
  countries: string[];
  countryFlags: string[];
  spotifyId: string;
  spotifyUrl: string;
  imageUrl: string | null;
  followers: number;
  popularity: number;
  monthlyListeners: number | null;
  monthlyActiveListeners: number | null;
  newActiveListeners: number | null;
  superListeners: number | null;
  trend: "up" | "down" | "flat";
  trendPct: number;
  lastSyncedAt?: string | null;
  reach: number;
  momentum: number;
  engagement: number;
  scoreCoverage?: {
    reachSignals: number;
    momentumSignals: number;
    engagementSignals: number;
    platformCount: number;
  };
  scoreBreakdown?: {
    reach: Array<{ signal: string; contribution: number }>;
    momentum: Array<{ signal: string; contribution: number }>;
    engagement: Array<{ signal: string; contribution: number }>;
  };
  rosterDiagnosis?: string | null;
  audiomackHandle?: string | null;
  youtubeChannelId?: string | null;
  tiktokOpenId?: string | null;
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return (
    !!url &&
    url !== "your_supabase_project_url" &&
    !!key &&
    key !== "your_supabase_anon_key"
  );
}
