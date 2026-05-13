// ============================================================
// ROSTER — Server-side i18n helper
// ------------------------------------------------------------
// Returns a translate function for use in React Server Components
// (async page.tsx / layout.tsx files that can't use hooks).
//
// Usage:
//   import { getServerT } from "@/lib/i18n/server";
//   import { createClient } from "@/lib/supabase/server";
//
//   export default async function Page() {
//     const supabase = await createClient();
//     const t = await getServerT(supabase);
//     return <h1>{t("nav.myBookings")}</h1>;
//   }
//
// The function reads `ui_language` from the authenticated user's
// profile row (set by the language switcher). Falls back to
// inferring from country, then to English if unauthenticated.
// ============================================================

import { cookies }                               from "next/headers";
import { translate, inferLanguageFromCountry }  from "@/lib/i18n";
import type { UILanguage, TranslationPath }      from "@/lib/i18n";
import type { SupabaseClient }                   from "@supabase/supabase-js";

const VALID_LANGS = new Set<string>(["en", "fr", "sw", "pt", "ar"]);

/**
 * Returns a server-side `t()` function bound to the current user's
 * preferred language. Safe to call in any async Server Component.
 *
 * Pass the Supabase server client — it's already instantiated in
 * most page files so there's no extra connection overhead.
 */
export async function getServerT(
  supabase: SupabaseClient,
): Promise<(path: TranslationPath, vars?: Record<string, string | number>) => string> {
  let lang: UILanguage = "en";

  // 1️⃣  Cookie — written instantly by setUILanguage(), no Supabase race.
  try {
    const jar        = await cookies();
    const cookieLang = jar.get("roster_ui_language")?.value;
    if (cookieLang && VALID_LANGS.has(cookieLang)) {
      lang = cookieLang as UILanguage;
      return (path, vars) => translate(lang, path, vars);
    }
  } catch { /* cookies() unavailable outside request context */ }

  // 2️⃣  Supabase profile — source of truth after first Supabase write.
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("ui_language, country")
        .eq("id", user.id)
        .single();

      if (profile?.ui_language) {
        lang = profile.ui_language as UILanguage;
      } else if (profile?.country) {
        lang = inferLanguageFromCountry(profile.country);
      }
    }
  } catch {
    // Unauthenticated or Supabase unavailable — fall through to English
  }

  return (path: TranslationPath, vars?: Record<string, string | number>) =>
    translate(lang, path, vars);
}
