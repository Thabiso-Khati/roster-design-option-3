/**
 * E-Sign token utilities — server-side only.
 *
 * Tokens are HMAC-SHA-256 signed strings of the form:
 *   <base64url(payload)>.<base64url(hmac)>
 *
 * Payload is a JSON blob with { rid, exp } where rid = signing_request id and
 * exp = epoch seconds expiry. We verify both the signature AND the exp time.
 *
 * The HMAC secret comes from ESIGN_TOKEN_SECRET env var. If that's not set,
 * we fall back to a derivation of NEXTAUTH_SECRET / SUPABASE_SERVICE_ROLE_KEY
 * so it works in dev without explicit configuration.
 */
import crypto from "crypto";

const HMAC_ALG = "sha256";

function getSecret(): string {
  const explicit = process.env.ESIGN_TOKEN_SECRET;
  if (explicit && explicit.length >= 16) return explicit;
  const fallback = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXTAUTH_SECRET || "";
  if (!fallback) {
    throw new Error("E-Sign tokens require ESIGN_TOKEN_SECRET or SUPABASE_SERVICE_ROLE_KEY env var.");
  }
  return crypto.createHash("sha256").update("roster-esign:" + fallback).digest("hex");
}

function base64url(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input) : input;
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64url(s: string): Buffer {
  const padded = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice(0, (4 - (s.length % 4)) % 4);
  return Buffer.from(padded, "base64");
}

export interface SigningTokenPayload {
  rid: string;          // signing_request id
  exp: number;          // epoch seconds
}

/** Issue a signed token for a given signing_request id, valid for `ttlSeconds`. */
export function issueSigningToken(signingRequestId: string, ttlSeconds = 30 * 24 * 60 * 60): string {
  const payload: SigningTokenPayload = {
    rid: signingRequestId,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const payloadB64 = base64url(JSON.stringify(payload));
  const sig = crypto.createHmac(HMAC_ALG, getSecret()).update(payloadB64).digest();
  return `${payloadB64}.${base64url(sig)}`;
}

/**
 * Verify a token. Returns the decoded payload on success, or null if the
 * signature doesn't verify or the token has expired.
 */
export function verifySigningToken(token: string): SigningTokenPayload | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, sigB64] = parts;

  // Verify signature
  const expectedSig = crypto.createHmac(HMAC_ALG, getSecret()).update(payloadB64).digest();
  let providedSig: Buffer;
  try {
    providedSig = fromBase64url(sigB64);
  } catch {
    return null;
  }
  if (expectedSig.length !== providedSig.length) return null;
  if (!crypto.timingSafeEqual(expectedSig, providedSig)) return null;

  // Decode payload
  let payload: SigningTokenPayload;
  try {
    payload = JSON.parse(fromBase64url(payloadB64).toString("utf8"));
  } catch {
    return null;
  }
  if (!payload || typeof payload.rid !== "string" || typeof payload.exp !== "number") return null;

  // Check expiry
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;

  return payload;
}

/** Extract IP from a Next.js request — best-effort across deployment envs. */
export function ipFromRequest(req: Request): string | null {
  const headers = req.headers;
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    headers.get("cf-connecting-ip") ||
    null
  );
}
