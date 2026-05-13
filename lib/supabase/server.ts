import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Placeholder values used when credentials haven't been configured yet
const PLACEHOLDER_URL = "https://placeholder.supabase.co";
const PLACEHOLDER_KEY = "placeholder-anon-key";

export async function createClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Use real credentials if configured, otherwise use placeholders so the
  // app renders without crashing in local preview before setup is complete.
  const url =
    supabaseUrl && supabaseUrl !== "your_supabase_project_url"
      ? supabaseUrl
      : PLACEHOLDER_URL;

  const key =
    supabaseKey && supabaseKey !== "your_supabase_anon_key"
      ? supabaseKey
      : PLACEHOLDER_KEY;

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server component — cookies can be read but not always set
        }
      },
    },
  });
}
