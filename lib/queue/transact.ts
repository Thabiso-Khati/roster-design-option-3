/**
 * lib/queue/transact.ts
 * ─────────────────────
 * Lightweight wrapper around Upstash QStash for transactional
 * single-recipient messages (welcome WhatsApp, claim emails, etc.).
 *
 * When QSTASH_TOKEN + NEXT_PUBLIC_APP_URL are set, jobs are enqueued
 * and QStash delivers them to /api/queue/transact with up to MAX_RETRIES
 * automatic retries on failure (exponential back-off, ~30 s → 5 min → 30 min).
 *
 * When those vars are absent (local dev / CI) the function returns
 * { queued: false } and callers fall back to inline sends — zero config needed.
 *
 * Required env vars (add to .env.local + Vercel):
 *   QSTASH_TOKEN               — publish token (Upstash console → QStash)
 *   QSTASH_CURRENT_SIGNING_KEY — for /api/queue/transact signature verify
 *   QSTASH_NEXT_SIGNING_KEY    — for key rotation
 *
 * NOTE: env vars are read inside each function (not at module load) so that
 * tests can stub process.env without needing module resets.
 */
import { Client, Receiver } from "@upstash/qstash";

// ── Job shapes ─────────────────────────────────────────────────────────────
export type TransactJob =
  | { type: "email";    to: string; subject: string; html: string; replyTo?: string }
  | { type: "whatsapp"; to: string; body: string;    fromNumber?: string            };

const MAX_RETRIES = 3;

// ── Publisher ──────────────────────────────────────────────────────────────
export async function enqueueTransact(
  job: TransactJob,
): Promise<{ queued: boolean; messageId?: string; error?: string }> {
  // Read at call time so tests can stub process.env freely
  const token  = process.env.QSTASH_TOKEN;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  if (!token || !appUrl) {
    return { queued: false };
  }

  const client = new Client({ token });
  try {
    const res = await client.publishJSON({
      url:     `${appUrl}/api/queue/transact`,
      body:    job,
      retries: MAX_RETRIES,
    });
    return { queued: true, messageId: res.messageId };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown QStash error";
    return { queued: false, error };
  }
}

// ── Signature verifier (used by the consumer route) ───────────────────────
export function getQStashReceiver(): Receiver | null {
  const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const nextSigningKey    = process.env.QSTASH_NEXT_SIGNING_KEY;
  if (!currentSigningKey || !nextSigningKey) return null;
  return new Receiver({ currentSigningKey, nextSigningKey });
}
