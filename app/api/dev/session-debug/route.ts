/**
 * GET /api/dev/session-debug
 *
 * Dev-only endpoint — returns the cookies the server sees plus the result
 * of getUser(). Used to diagnose the sign-in redirect loop where the proxy
 * redirects to /auth/login even though signInWithPassword() succeeds.
 *
 * Excluded from rate limiting (see RL_SKIP in proxy.ts).
 * Remove this file once the auth issue is resolved.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Dev only" }, { status: 403 });
  }

  const allCookies = req.cookies.getAll();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  const cookieInfo = allCookies.map(({ name, value }) => ({
    name,
    length: value.length,
    // Only show first 40 chars of value so the auth token isn't fully exposed in logs
    preview: value.slice(0, 40) + (value.length > 40 ? "…" : ""),
  }));

  const authCookies = allCookies.filter(({ name }) =>
    name.includes("auth-token") || name.includes("sb-")
  );

  let user = null;
  let userError: string | null = null;

  if (supabaseUrl && supabaseKey) {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll() { /* read-only debug */ },
      },
    });
    const { data, error } = await supabase.auth.getUser();
    user = data.user ? { id: data.user.id, email: data.user.email } : null;
    userError = error?.message ?? null;
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    totalCookies: allCookies.length,
    authCookiesFound: authCookies.length,
    cookies: cookieInfo,
    getUser: { user, error: userError },
  });
}
