/**
 * ROSTER analytics wrapper — thin layer over PostHog.
 *
 * All product-meaningful events are tracked here so they're easy to find,
 * rename, and test. Never scatter raw `posthog.capture()` calls through
 * components — always go through this module.
 *
 * Server-side usage (API routes, Server Components):
 *   import { serverTrack } from "@/lib/analytics";
 *   await serverTrack(userId, "booking_created", { expertId, amount });
 *
 * Client-side usage:
 *   import { track } from "@/lib/analytics";
 *   track("vault_item_uploaded", { category });
 *
 * PostHog must be installed before server-side tracking works:
 *   npm install posthog-node
 */

// ─── Client-side ──────────────────────────────────────────────────────────────
// These functions are safe to import in client components.
// They're no-ops if PostHog hasn't loaded yet (SSR pass, or before hydration).

export type AnalyticsEvent =
  // Bookings
  | "booking_initiated"
  | "booking_created"
  | "booking_paid"
  | "booking_cancelled"
  // Vault
  | "vault_unlocked"
  | "vault_item_uploaded"
  | "vault_item_downloaded"
  // Subscriptions
  | "subscription_started"
  | "subscription_cancelled"
  // Compass
  | "suggestion_viewed"
  | "suggestion_acted"
  | "suggestion_snoozed"
  | "suggestion_dismissed"
  // E-Sign
  | "signing_request_sent"
  | "document_signed"
  | "document_declined"
  // Artists
  | "artist_added"
  | "spotify_connected"
  // Experts
  | "expert_profile_viewed"
  | "expert_claimed";

/**
 * Track an event from a client component.
 * Silently no-ops if PostHog hasn't loaded or isn't configured.
 */
export function track(event: AnalyticsEvent, properties?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  try {
    // posthog-js attaches itself to window after the Provider mounts.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ph = (window as any).posthog;
    if (ph?.capture) {
      ph.capture(event, properties);
    }
  } catch {
    // Analytics must never throw
  }
}

// ─── Server-side ──────────────────────────────────────────────────────────────
// These functions run in API routes, Server Actions, and cron jobs.
// They require posthog-node (npm install posthog-node).

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _serverClient: any | null = null;

function getServerClient() {
  if (_serverClient) return _serverClient;
  try {
    const { PostHog } = require("posthog-node");
    const key  = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
    if (!key) return null;
    _serverClient = new PostHog(key, { host: host ?? "https://us.i.posthog.com", flushAt: 1, flushInterval: 0 });
    return _serverClient;
  } catch {
    return null; // package not installed yet
  }
}

/**
 * Track an event from a server-side context.
 * Requires `posthog-node` to be installed; silently no-ops otherwise.
 *
 * @param distinctId  The user's Supabase UUID (or "anonymous" for unauthed events).
 */
export async function serverTrack(
  distinctId: string,
  event: AnalyticsEvent,
  properties?: Record<string, unknown>,
): Promise<void> {
  try {
    const client = getServerClient();
    if (!client) return;
    client.capture({ distinctId, event, properties });
    await client.flushAsync();
  } catch {
    // Analytics must never throw or break the calling route
  }
}
