// ============================================================
// ROSTER — Plan a release
// ------------------------------------------------------------
// Server component: fetches the artist roster so the form can
// render a dropdown synced to the user's actual artists. Falls
// back to free-text artist_name if no artist is linked, so the
// release pipeline still works pre-Spotify-connect.
// ============================================================

import { createClient } from "@/lib/supabase/server";
import { ReleaseForm } from "@/components/dashboard/release-form";

interface ArtistOption {
  id: string;
  name: string;
}

const SUPABASE_CONFIGURED =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== "your_supabase_project_url" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith("http");

async function fetchArtistOptions(): Promise<ArtistOption[]> {
  if (!SUPABASE_CONFIGURED) return [];
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase
      .from("artists")
      .select("id, name")
      .eq("user_id", user.id)
      .order("name", { ascending: true });
    return (data ?? []) as ArtistOption[];
  } catch {
    return [];
  }
}

export default async function NewReleasePage() {
  const artists = await fetchArtistOptions();

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-text-muted font-medium mb-2">
          Pipeline
        </p>
        <h1 className="text-2xl md:text-[28px] font-semibold text-text-primary tracking-tight">
          Plan a release
        </h1>
        <p className="text-sm text-text-muted mt-2 leading-relaxed max-w-xl">
          Drop in a title, a date, and the DSPs you're targeting. The pipeline
          starts tracking it from there. Leave the date empty if it's still TBC.
        </p>
      </header>

      <ReleaseForm artists={artists} />
    </div>
  );
}
