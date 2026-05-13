// ============================================================
// ROSTER — Boomplay fetcher (SCAFFOLD — awaiting credentials)
// ------------------------------------------------------------
// Pulls artist plays, listeners, and chart data from Boomplay's
// Open API. Critical for scoring engine accuracy in West Africa
// (Nigeria, Ghana, Côte d'Ivoire, Cameroon, Senegal) where
// Boomplay is the #1 DSP.
//
// Status: STUB — needs partner credentials to activate.
//
// ── Application path ──────────────────────────────────────
// 1. User registers at https://developer.boomplay.com
// 2. Creates an app → receives `app_id` + `app_secret`
// 3. Saves to .env.local:
//      BOOMPLAY_APP_ID=...
//      BOOMPLAY_APP_SECRET=...
// 4. Approval: hours to days (may require business docs)
//
// ── Auth model ─────────────────────────────────────────────
// OAuth 2.0, two flows:
//   • Client Credentials (server-to-server) — what we use
//   • Implicit Grant (per-user) — for if artists self-link later
//
// Token endpoint: POST /oauth/userToken
// Headers:
//   Content-Type: application/json
//   Accept-Language: en-US
// Body: { app_id, app_secret, grant_type: "client_credentials" }
// Response: { access_token, expires_in: 7200, refresh_token, user_id }
// Token TTL: 2 hours → cache + refresh
//
// ── Once credentials arrive ────────────────────────────────
// 1. Fill in BOOMPLAY_BASE_URL + endpoints below from
//    developer.boomplay.com → ENDPOINTS section
// 2. Implement getAccessToken() with caching (in-memory or Redis)
// 3. Implement fetchArtistMetrics() to match FetcherResult shape
// 4. Wire into lib/fetchers/index.ts
// 5. Activate Boomplay weight in lib/scoring/config.ts for the
//    West African country profiles
// 6. Add to nightly cron in /api/cron
// ============================================================

import type { FetcherResult } from "./types";
import { logger } from "@/lib/logger";

// ── Config ─────────────────────────────────────────────────
const BOOMPLAY_BASE_URL = "https://api.boomplay.com"; // CONFIRM: verify base URL from developer.boomplay.com once credentials arrive
const BOOMPLAY_TOKEN_PATH = "/oauth/userToken";

// In-memory token cache. For production, move to Redis or
// Supabase if running multi-instance.
let cachedToken: { accessToken: string; expiresAt: number } | null = null;

function getCredentials(): { appId: string; appSecret: string } | null {
  const appId = process.env.BOOMPLAY_APP_ID;
  const appSecret = process.env.BOOMPLAY_APP_SECRET;
  if (!appId || !appSecret) return null;
  return { appId, appSecret };
}

// ── Auth ───────────────────────────────────────────────────
/**
 * Get a valid access token, refreshing if expired.
 * Uses Client Credentials flow.
 */
export async function getAccessToken(): Promise<string | null> {
  const creds = getCredentials();
  if (!creds) {
    logger.warn("[boomplay] credentials not configured — set BOOMPLAY_APP_ID + BOOMPLAY_APP_SECRET in .env.local");
    return null;
  }

  // Return cached token if still valid (60s safety margin)
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.accessToken;
  }

  try {
    const res = await fetch(`${BOOMPLAY_BASE_URL}${BOOMPLAY_TOKEN_PATH}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept-Language": "en-US",
      },
      body: JSON.stringify({
        app_id: creds.appId,
        app_secret: creds.appSecret,
        grant_type: "client_credentials",
      }),
    });

    if (!res.ok) {
      logger.error("[boomplay] token fetch failed", { status: res.status, body: await res.text() });
      return null;
    }

    const json = await res.json();
    // Boomplay response shape: { code, desc, data: { access_token, expires_in, refresh_token, user_id } }
    const data = json.data ?? json;
    const accessToken = data.access_token;
    const expiresIn = data.expires_in ?? 7200;

    if (!accessToken) {
      logger.error("[boomplay] token response missing access_token", {}, json);
      return null;
    }

    cachedToken = {
      accessToken,
      expiresAt: Date.now() + expiresIn * 1000,
    };
    return accessToken;
  } catch (e) {
    logger.error("[boomplay] token fetch error", {}, e);
    return null;
  }
}

// ── Endpoints ──────────────────────────────────────────────
// TODO: Fill these in once you've reviewed the ENDPOINTS section
// of developer.boomplay.com. Most likely candidates:
//   GET /open/artist/{artistId}/profile  → plays, listeners
//   GET /open/artist/{artistId}/charts   → chart positions
//   GET /open/search/artist?q={name}     → artist lookup by name

interface BoomplayArtistProfile {
  artist_id: string;
  name: string;
  followers: number;
  total_plays: number;
  monthly_listeners?: number;
  // …additional fields per Boomplay schema once docs reviewed
}

/**
 * Fetch artist profile + plays/listeners.
 * @param artistId - Boomplay's internal artist ID (NOT the slug)
 */
export async function fetchArtistProfile(artistId: string): Promise<BoomplayArtistProfile | null> {
  const token = await getAccessToken();
  if (!token) return null;

  try {
    // TODO: confirm endpoint path from docs
    const res = await fetch(`${BOOMPLAY_BASE_URL}/open/artist/${artistId}/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Accept-Language": "en-US",
      },
    });

    if (!res.ok) {
      logger.error("[boomplay] artist profile fetch failed", {}, res.status);
      return null;
    }

    const json = await res.json();
    return json.data as BoomplayArtistProfile;
  } catch (e) {
    logger.error("[boomplay] artist profile error", {}, e);
    return null;
  }
}

/**
 * Look up Boomplay artist ID by name. Used when an artist
 * is added to ROSTER without a known Boomplay ID.
 */
export async function searchArtist(_name: string): Promise<{ artist_id: string; name: string } | null> {
  // TODO: implement search endpoint per docs
  return null;
}

// ── Public fetcher (matches FetcherResult shape used elsewhere) ──
/**
 * Standard fetcher signature consumed by /api/cron and the scoring engine.
 * Returns null if credentials aren't set yet (graceful degradation).
 */
export async function fetchBoomplayArtist(boomplayArtistId: string): Promise<FetcherResult> {
  const profile = await fetchArtistProfile(boomplayArtistId);
  if (!profile) {
    return {
      ok: false,
      source: "boomplay" as FetcherResult["source"],
      metrics: {},
      internal: {},
      error: "Boomplay credentials not configured or artist not found",
    };
  }

  // TODO: when adding to lib/scoring/types.ts MetricSource,
  // add "boomplay" — until then we coerce.
  return {
    ok: true,
    source: "boomplay" as FetcherResult["source"],
    metrics: {
      boomplay_followers: profile.followers,
      boomplay_plays_lifetime: profile.total_plays,
      boomplay_monthly_listeners: profile.monthly_listeners ?? 0,
    },
    internal: {
      _total_plays_lifetime: profile.total_plays,
    },
  };
}
