/**
 * lib/rate-limit.ts
 *
 * Distributed rate limiter backed by Upstash Redis.
 * Falls back to an in-memory Map when the Upstash env vars are not set
 * (local dev, CI) so the app boots without Redis configured.
 *
 * Upstash setup:
 *   1. Create a Redis database at https://console.upstash.com
 *   2. Copy the REST URL and token into your env:
 *        UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
 *        UPSTASH_REDIS_REST_TOKEN=AXxx...
 *   3. Add the same two vars to Vercel → Settings → Environment Variables
 *      (Production + Preview environments).
 *
 * The sliding-window algorithm gives a smooth limit: 20 requests per 60s
 * per IP, measured over a rolling window rather than a hard reset bucket.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis }     from "@upstash/redis";

// ── Fallback in-memory limiter (single-instance only) ────────────────────────
interface RateLimitEntry { count: number; windowStart: number }
const FALLBACK_WINDOW_MS = 60_000;
const FALLBACK_MAX       = 20;
const fallbackMap        = new Map<string, RateLimitEntry>();

function inMemoryIsRateLimited(ip: string): boolean {
  const now   = Date.now();
  const entry = fallbackMap.get(ip);
  if (!entry || now - entry.windowStart > FALLBACK_WINDOW_MS) {
    fallbackMap.set(ip, { count: 1, windowStart: now });
    return false;
  }
  entry.count += 1;
  fallbackMap.set(ip, entry);
  return entry.count > FALLBACK_MAX;
}

// ── Upstash limiter (distributed, works across all Vercel edge instances) ────
const UPSTASH_URL   = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const upstashLimiter =
  UPSTASH_URL && UPSTASH_TOKEN
    ? new Ratelimit({
        redis:     new Redis({ url: UPSTASH_URL, token: UPSTASH_TOKEN }),
        limiter:   Ratelimit.slidingWindow(20, "60 s"),
        analytics: false,        // set to true once you want Upstash analytics
        prefix:    "roster:rl:", // namespace so keys don't collide
      })
    : null;

// ── Public interface ──────────────────────────────────────────────────────────

export interface RateLimitResult {
  limited:   boolean;
  remaining: number;
  resetMs:   number;   // ms until the window resets (for Retry-After header)
}

/**
 * Check whether the given identifier (typically an IP address) has exceeded
 * the rate limit. Uses Upstash when configured, falls back to in-memory.
 */
export async function checkRateLimit(identifier: string): Promise<RateLimitResult> {
  if (upstashLimiter) {
    const { success, remaining, reset } = await upstashLimiter.limit(identifier);
    return {
      limited:   !success,
      remaining: remaining ?? 0,
      resetMs:   Math.max(0, (reset ?? Date.now()) - Date.now()),
    };
  }

  // Fallback
  const limited = inMemoryIsRateLimited(identifier);
  return { limited, remaining: limited ? 0 : FALLBACK_MAX, resetMs: FALLBACK_WINDOW_MS };
}

export const isUpstashConfigured = Boolean(UPSTASH_URL && UPSTASH_TOKEN);
