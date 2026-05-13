// ============================================================
// ROSTER — TikTok fetcher (OAuth v2)
// ------------------------------------------------------------
// Pulls profile stats + video-level metrics for a connected
// artist via TikTok's Content Posting API v2.
//
// Metrics written:
//   followers       — latest follower count
//   monthly_plays   — sum of play_count across all videos
//                     published within the last 28 days
//
// Internal bookkeeping:
//   _total_likes_lifetime   — cumulative likes (for delta)
//   _total_videos_lifetime  — total video count (for delta)
//
// Prerequisites:
//   - Artist has linked TikTok (artist_tiktok_tokens row exists)
//   - Migration 033 applied (tiktok_open_id column on artists)
//   - TIKTOK_CLIENT_KEY + TIKTOK_CLIENT_SECRET set in .env.local
//
// TikTok API endpoint reference:
//   GET /v2/user/info/  ?fields=follower_count,likes_count,video_count
//   POST /v2/video/list/ body: { max_count: 20, cursor: 0 }
//                        fields: play_count,like_count,create_time
// ============================================================

import type { FetcherContext, FetcherResult } from "./types";
import { emptyResult } from "./types";
import { getAccessTokenForArtist } from "@/lib/tiktok/oauth";
import { createAdminClient } from "@/lib/supabase/admin";

const TT_API = "https://open.tiktokapis.com/v2";

// 28 days in milliseconds
const WINDOW_MS = 28 * 24 * 60 * 60 * 1000;

// ── API helpers ───────────────────────────────────────────────

interface UserInfoResponse {
  data?: {
    user?: {
      follower_count?: number;
      likes_count?: number;
      video_count?: number;
      display_name?: string;
    };
  };
  error?: { code?: string; message?: string };
}

interface VideoListResponse {
  data?: {
    videos?: Array<{
      play_count?: number;
      like_count?: number;
      create_time?: number; // Unix timestamp (seconds)
    }>;
    cursor?: number;
    has_more?: boolean;
  };
  error?: { code?: string; message?: string };
}

async function fetchUserInfo(
  accessToken: string
): Promise<UserInfoResponse> {
  const res = await fetch(
    `${TT_API}/user/info/?fields=follower_count,likes_count,video_count,display_name`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    }
  );
  if (!res.ok) {
    throw new Error(`TikTok user/info ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as UserInfoResponse;
}

/** Fetch up to `maxVideos` most recent videos. */
async function fetchRecentVideos(
  accessToken: string,
  maxVideos = 20
): Promise<VideoListResponse["data"]> {
  const res = await fetch(
    `${TT_API}/video/list/?fields=play_count,like_count,create_time`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ max_count: maxVideos, cursor: 0 }),
      signal: AbortSignal.timeout(20_000),
      cache: "no-store",
    }
  );
  if (!res.ok) {
    throw new Error(`TikTok video/list ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as VideoListResponse;
  return json.data;
}

// ── Main export ───────────────────────────────────────────────

export async function fetchTikTok(
  artistId: string,
  artistName: string,
  _ctx: FetcherContext
): Promise<FetcherResult> {
  // 1. Get a valid access token (refreshes automatically)
  let accessToken: string;
  try {
    accessToken = await getAccessTokenForArtist(artistId);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "TIKTOK_NOT_CONNECTED") {
      return emptyResult("tiktok_oauth", `TikTok not connected for '${artistName}'`);
    }
    if (msg === "TIKTOK_REFRESH_EXPIRED") {
      return emptyResult(
        "tiktok_oauth",
        `TikTok refresh token expired for '${artistName}' — artist must reconnect`
      );
    }
    return emptyResult("tiktok_oauth", `TikTok token error: ${msg}`);
  }

  // 2. Fetch user info + recent videos in parallel
  let userInfo: UserInfoResponse;
  let videoData: VideoListResponse["data"];

  try {
    [userInfo, videoData] = await Promise.all([
      fetchUserInfo(accessToken),
      fetchRecentVideos(accessToken, 20),
    ]);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "TikTok API error";
    return emptyResult("tiktok_oauth", msg);
  }

  // 3. Extract values
  const user          = userInfo?.data?.user;
  const followers     = user?.follower_count ?? null;
  const totalLikes    = user?.likes_count ?? null;
  const totalVideos   = user?.video_count ?? null;
  const displayName   = user?.display_name ?? null;

  // 4. Rolling 28-day play sum from videos
  const cutoff   = Date.now() - WINDOW_MS;
  const videos   = videoData?.videos ?? [];
  let monthlyPlays = 0;
  for (const v of videos) {
    const publishedMs = (v.create_time ?? 0) * 1000;
    if (publishedMs >= cutoff && typeof v.play_count === "number") {
      monthlyPlays += v.play_count;
    }
  }

  // 5. Backfill display_name on the artist row (non-blocking)
  if (displayName) {
    const admin = createAdminClient();
    await admin
      .from("artist_tiktok_tokens")
      .update({ display_name: displayName, updated_at: new Date().toISOString() })
      .eq("artist_id", artistId);
    await admin
      .from("artists")
      .update({ tiktok_display_name: displayName })
      .eq("id", artistId);
  }

  // 6. Assemble result
  const result: FetcherResult = {
    ok: true,
    source: "tiktok_oauth",
    metrics: {},
    internal: {},
  };

  if (followers !== null)  result.metrics.followers    = followers;
  if (monthlyPlays > 0)   result.metrics.monthly_plays = monthlyPlays;

  if (totalLikes  !== null) result.internal._total_likes_lifetime  = totalLikes;
  if (totalVideos !== null) result.internal._total_videos_lifetime = totalVideos;

  if (Object.keys(result.metrics).length === 0) {
    return emptyResult(
      "tiktok_oauth",
      `TikTok returned no readable metrics for '${artistName}'`
    );
  }

  return result;
}
