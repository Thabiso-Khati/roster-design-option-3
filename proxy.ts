import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis }     from "@upstash/redis";

// ── API rate limiting ─────────────────────────────────────────────────────────
const RL_SKIP = [
  /^\/api\/cron\//,
  /^\/api\/auth\//,
  /^\/api\/paystack\/webhook/,
  /^\/api\/paystack\/callback/,
  /^\/api\/spotify\/callback/,
  /^\/api\/tiktok\/callback/,
  /^\/api\/optin\//,
  /^\/api\/queue\//,
  /^\/api\/dev\//,
];
const AI_ROUTES = [
  /^\/api\/ai/,
  /^\/api\/agents\//,
  /^\/api\/campaign-builder/,
  /^\/api\/brand-book/,
  /^\/api\/suggestions/,
];
const UPSTASH_URL   = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const standardLimiter = UPSTASH_URL && UPSTASH_TOKEN
  ? new Ratelimit({ redis: new Redis({ url: UPSTASH_URL, token: UPSTASH_TOKEN }), limiter: Ratelimit.slidingWindow(30, "60 s"), prefix: "roster:rl:std:" })
  : null;
const aiLimiter = UPSTASH_URL && UPSTASH_TOKEN
  ? new Ratelimit({ redis: new Redis({ url: UPSTASH_URL, token: UPSTASH_TOKEN }), limiter: Ratelimit.slidingWindow(10, "60 s"), prefix: "roster:rl:ai:" })
  : null;

// ── CSP nonce helpers ─────────────────────────────────────────────────────────
// Edge runtime: use Web Crypto API (globalThis.crypto), not Node crypto.

function generateNonce(): string {
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  // btoa wants a binary string — spread Uint8Array into char codes
  return btoa(String.fromCharCode(...bytes));
}

function buildCsp(nonce: string): string {
  // script-src: remove unsafe-inline + unsafe-eval; use per-request nonce.
  // style-src: keeps unsafe-inline (Tailwind/CSS-in-JS patterns require it;
  //   inline styles are significantly lower risk than inline scripts).
  // Google Fonts: needs fonts.googleapis.com in style-src (CSS)
  //   and fonts.gstatic.com in font-src (woff2 files).
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://app.posthog.com https://us.i.posthog.com https://js.sentry-cdn.com https://*.sentry.io`,
    `style-src 'self' 'nonce-${nonce}' 'unsafe-inline' https://fonts.googleapis.com`,
    "img-src 'self' data: blob: https://*.supabase.co https://i.scdn.co https://mosaic.scdn.co https://*.spotifycdn.com",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.supabase.co https://app.posthog.com https://us.i.posthog.com https://*.sentry.io wss://*.supabase.co",
    "media-src 'self' blob:",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ];
  return directives.join("; ");
}

/** Stamp nonce + CSP headers onto any response. */
function applySecurityHeaders(response: NextResponse, nonce: string): NextResponse {
  response.headers.set("x-nonce", nonce);
  response.headers.set("Content-Security-Policy", buildCsp(nonce));
  return response;
}

const PROTECTED_ROUTES = ["/dashboard", "/onboarding"];
const AUTH_ROUTES = ["/auth/login", "/auth/signup", "/auth/reset-password"];

// ── Rate limiter (in-memory, per edge instance) ───────────────────────────────
// Works correctly in local dev and single-region deploys.
//
// For production on Vercel (multiple parallel edge instances), replace this
// with Upstash Redis. The lib/rate-limit.ts module is already written and
// ready — it just cannot be imported here because proxy.ts runs in the Edge
// runtime, and bundling @upstash/redis into Edge middleware requires the
// `export const runtime = "edge"` declaration plus Vercel Edge Config.
//
// To activate distributed limiting:
//   1. Add `export const runtime = "edge";` to this file
//   2. Uncomment: import { checkRateLimit } from "@/lib/rate-limit";
//   3. Replace the inMemoryIsRateLimited call below with: await checkRateLimit(ip)
//   4. Set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN in Vercel env vars

interface RateLimitEntry { count: number; windowStart: number }
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX       = 20;
const rateLimitMap         = new Map<string, RateLimitEntry>();

function inMemoryIsRateLimited(ip: string): boolean {
  const now   = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return false;
  }
  entry.count += 1;
  rateLimitMap.set(ip, entry);
  return entry.count > RATE_LIMIT_MAX;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Upstash API rate limiting ─────────────────────────────────────────────
  if (pathname.startsWith("/api/") && !RL_SKIP.some(p => p.test(pathname))) {
    const isAI    = AI_ROUTES.some(p => p.test(pathname));
    const limiter = isAI ? aiLimiter : standardLimiter;
    if (limiter) {
      const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
      const { success, reset } = await limiter.limit(ip);
      if (!success) {
        const retryAfter = Math.ceil(Math.max(0, reset - Date.now()) / 1000);
        return NextResponse.json(
          { error: "Too many requests — please wait before trying again." },
          { status: 429, headers: { "Retry-After": String(retryAfter), "X-RateLimit-Remaining": "0" } }
        );
      }
    }
  }

  // Generate a fresh nonce for every request.
  const nonce = generateNonce();

  // ── Stamp x-pathname + x-nonce so server components can read them ─────────
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  requestHeaders.set("x-nonce", nonce);

  // ── Rate-limit auth endpoints ─────────────────────────────────────────────
  if (pathname.startsWith("/api/auth/")) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";

    if (inMemoryIsRateLimited(ip)) {
      // 429s don't render HTML so no nonce needed, but add CSP for consistency.
      return applySecurityHeaders(
        new NextResponse(
          JSON.stringify({ error: "Too many requests. Please try again shortly." }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "Retry-After":  "60",
            },
          }
        ),
        nonce
      );
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (
    !supabaseUrl ||
    supabaseUrl === "your_supabase_project_url" ||
    !supabaseKey ||
    supabaseKey === "your_supabase_anon_key"
  ) {
    return applySecurityHeaders(
      NextResponse.next({ request: { headers: requestHeaders } }),
      nonce
    );
  }

  let supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });
  // DESIGN PREVIEW: bypass auth — remove before production
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding')) {
    return applySecurityHeaders(supabaseResponse, nonce);
  }


  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setAll(cookiesToSet: any[]) {
        cookiesToSet.forEach(({ name, value }: { name: string; value: string }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });
        cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options: unknown }) =>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          supabaseResponse.cookies.set(name, value, options as any)
        );
      },
    },
  });

  const {
    data: { session },
    error: getSessionError,
  } = await supabase.auth.getSession();

  // Surface auth errors so we can diagnose the redirect loop.
  // In dev: logged to the server console so they appear in `npm run dev` output.
  // In production: logged to Vercel function logs.
  if (getSessionError) {
    console.error(
      "[proxy] getSession() error on",
      pathname,
      "| name:", getSessionError.name,
      "| message:", getSessionError.message,
      "| status:", getSessionError.status,
      "| cookies sent:", request.cookies.getAll().map(c => c.name).join(", ") || "(none)"
    );
  }

  // Debug helper: if the request carries an x-auth-debug header (set by the
  // session-debug endpoint), log the full cookie list at debug level too.
  if (!session && PROTECTED_ROUTES.some(r => pathname.startsWith(r))) {
    const cookieNames = request.cookies.getAll().map(c => c.name).join(", ");
    console.warn(
      "[proxy] unauthenticated request to protected route",
      pathname,
      "| cookies:", cookieNames || "(none)",
      "| getUser error:", getSessionError?.message ?? "null"
    );
  }

  const redirectWithCookies = (destination: URL) => {
    const res = NextResponse.redirect(destination);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      const { name, value, ...cookieOptions } = cookie;
      res.cookies.set(name, value, cookieOptions);
    });
    // Redirects render no HTML body, but the CSP header is still good practice.
    return applySecurityHeaders(res, nonce);
  };

  // AUTH BYPASSED — design preview only. Restore for production.

  return applySecurityHeaders(supabaseResponse, nonce);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|sw.js|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
