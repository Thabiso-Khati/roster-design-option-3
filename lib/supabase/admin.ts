import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client for privileged server-side operations.
 *
 * Bypasses Row Level Security. Use ONLY in trusted server contexts
 * (API routes, server actions) for mutations the end user shouldn't
 * perform directly — subscription state, booking payment flips, admin
 * operations, webhook handlers, etc.
 *
 * NEVER import this into a React component or client-bundled module —
 * exposing the service role key in the browser would grant full DB
 * access to anyone viewing the page source.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase admin client missing config: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set."
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
