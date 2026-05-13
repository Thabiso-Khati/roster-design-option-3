/**
 * global-setup.ts
 *
 * Runs once before all E2E specs.
 *
 * Strategy: server-side session injection — no browser login form needed.
 *
 *   1. Use Supabase admin client to generate a one-time OTP for the test user.
 *   2. Exchange that OTP for a real session via supabase-js (Node.js, no browser).
 *   3. Encode the session in the exact @supabase/ssr cookie format (base64url,
 *      chunked at 3 180 bytes).
 *   4. Inject the cookies directly into the Playwright browser context.
 *   5. Navigate to /dashboard — middleware now sees a valid session and lets us in.
 *
 * This approach works for Google-OAuth users (no password needed) and avoids the
 * implicit-flow / PKCE mismatch that tripped up the magic-link redirect approach.
 *
 * ─── Setup ───────────────────────────────────────────────────────────────────
 * .env.local must have:
 *   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ...
 *
 * Optionally override the test user via .env.test.local:
 *   E2E_TEST_EMAIL=thabiso.khati@gmail.com   (this is the default)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { test as setup, expect } from "@playwright/test";
import { createClient }           from "@supabase/supabase-js";
import path                       from "path";
import fs                         from "fs";

const AUTH_FILE     = path.join(__dirname, "../.auth/user.json");
const DEFAULT_EMAIL = "thabiso.khati@gmail.com";
const MAX_CHUNK     = 3180; // @supabase/ssr MAX_CHUNK_SIZE

// ─── Cookie helpers (mirrors @supabase/ssr chunker.js) ───────────────────────

function encodeSession(session: object): string {
  const json    = JSON.stringify(session);
  const b64     = Buffer.from(json).toString("base64url");
  return "base64-" + b64;
}

function createChunks(
  key: string,
  value: string
): Array<{ name: string; value: string }> {
  const encoded = encodeURIComponent(value);
  if (encoded.length <= MAX_CHUNK) return [{ name: key, value }];

  const chunks: string[] = [];
  let remaining = encoded;
  while (remaining.length > 0) {
    let head = remaining.slice(0, MAX_CHUNK);
    const lastEsc = head.lastIndexOf("%");
    if (lastEsc > MAX_CHUNK - 3) head = head.slice(0, lastEsc);
    let decoded = "";
    while (head.length > 0) {
      try { decoded = decodeURIComponent(head); break; }
      catch { head = head.slice(0, head.length - 3); }
    }
    chunks.push(decoded);
    remaining = remaining.slice(encodeURIComponent(decoded).length);
  }
  return chunks.map((v, i) => ({ name: `${key}.${i}`, value: v }));
}

// ─── Setup test ──────────────────────────────────────────────────────────────

setup("inject session cookies", async ({ page }) => {
  const supabaseUrl    = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey        = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const email          = process.env.E2E_TEST_EMAIL ?? DEFAULT_EMAIL;

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    throw new Error(
      "\n\n╔══════════════════════════════════════════════════════════════════╗\n" +
      "║  Missing Supabase credentials — check .env.local contains:       ║\n" +
      "║    NEXT_PUBLIC_SUPABASE_URL        ║\n" +
      "║    NEXT_PUBLIC_SUPABASE_ANON_KEY   ║\n" +
      "║    SUPABASE_SERVICE_ROLE_KEY       ║\n" +
      "╚══════════════════════════════════════════════════════════════════╝\n"
    );
  }

  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });

  // ── 1. Generate OTP ─────────────────────────────────────────────────────
  console.log(`\n→ Generating OTP for ${email}…`);
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: linkData, error: linkError } =
    await admin.auth.admin.generateLink({ type: "magiclink", email });

  if (linkError || !linkData?.properties?.email_otp) {
    throw new Error(
      `generateLink failed for "${email}": ${linkError?.message ?? "no email_otp"}\n` +
      "Make sure the user exists in your Supabase project."
    );
  }
  const otp = linkData.properties.email_otp;

  // ── 2. Exchange OTP for session (Node.js, no browser) ───────────────────
  console.log("→ Exchanging OTP for session…");
  const anon = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: otpData, error: otpError } = await anon.auth.verifyOtp({
    email,
    token: otp,
    type: "email",
  });

  if (otpError || !otpData.session) {
    throw new Error(
      `verifyOtp failed: ${otpError?.message ?? "no session returned"}`
    );
  }
  const session = otpData.session;
  console.log(`✓ Session obtained (expires ${new Date(session.expires_at! * 1000).toISOString()})`);

  // ── 3. Encode + chunk the session ────────────────────────────────────────
  const projectRef = supabaseUrl.replace("https://", "").split(".")[0];
  const cookieKey  = `sb-${projectRef}-auth-token`;
  const encoded    = encodeSession(session);
  const chunks     = createChunks(cookieKey, encoded);

  // ── 4. Inject cookies into the Playwright browser context ────────────────
  const expiresAt = session.expires_at ?? Math.floor(Date.now() / 1000) + 3600;
  await page.context().addCookies(
    chunks.map(({ name, value }) => ({
      name,
      value,
      domain:   "127.0.0.1",
      path:     "/",
      httpOnly: false,
      secure:   false,
      sameSite: "Lax" as const,
      expires:  expiresAt,
    }))
  );
  console.log(`✓ Injected ${chunks.length} session cookie(s): ${chunks.map(c => c.name).join(", ")}`);

  // ── 5. Navigate to dashboard to confirm the session works ────────────────
  await page.goto("/dashboard");

  const landed = await Promise.race([
    page.waitForURL(/\/dashboard/, { timeout: 15_000 }).then(() => "ok"   as const),
    page.waitForURL(/\/auth/,      { timeout: 15_000 }).then(() => "auth" as const),
  ]).catch(() => "timeout" as const);

  if (landed !== "ok") {
    const screenshot = path.join(path.dirname(AUTH_FILE), "session-inject-failed.png");
    await page.screenshot({ path: screenshot });
    throw new Error(
      `Session injection did not reach /dashboard (result: "${landed}").\n` +
      `URL: ${page.url()}\nScreenshot: ${screenshot}`
    );
  }

  await expect(page).toHaveURL(/\/dashboard/);

  // ── 6. Save storage state ────────────────────────────────────────────────
  await page.context().storageState({ path: AUTH_FILE });
  console.log(`✓ Auth state saved → ${AUTH_FILE}\n`);
});
