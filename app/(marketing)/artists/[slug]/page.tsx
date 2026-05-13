/**
 * Public artist profile route — light marketing surface that displays
 * an artist's verifiable score data + bio + links + recent releases.
 *
 * Loads from Supabase via the admin client (read-only, no auth required).
 * Slug is matched against the `artists.slug` column (added in a future
 * migration) — for the MVP we match against id.
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { scoreArtist } from "@/lib/scoring";
import type { MetricSnapshot, Platform } from "@/lib/scoring/types";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 3600; // 1 hour ISR

export default async function PublicArtistPage({ params }: PageProps) {
  const { slug } = await params;
  const admin = createAdminClient();

  // Match slug against either id or name (lowercased). For production
  // a dedicated slug column is preferable.
  const { data: artist, error } = await admin
    .from("artists")
    .select(`
      id, name, genre, country, country_flag, countries, country_flags,
      spotify_url, image_url, audiomack_handle, youtube_channel_id,
      artist_stats (followers, monthly_listeners, snapshot_at)
    `)
    .or(`id.eq.${slug},name.ilike.${slug.replace(/-/g, " ")}`)
    .limit(1)
    .maybeSingle();

  if (error || !artist) {
    notFound();
  }

  // Pull metric snapshots for scoring
  const { data: metricsRaw } = await admin
    .from("artist_platform_metrics")
    .select("platform, metric, value, snapshot_at, source")
    .eq("artist_id", artist.id)
    .order("snapshot_at", { ascending: false })
    .limit(50);

  const metrics: MetricSnapshot[] = (metricsRaw ?? []).map((m) => ({
    platform: m.platform as Platform,
    metric: m.metric,
    value: Number(m.value),
    snapshotAt: m.snapshot_at,
    source: m.source,
  }));

  let scores: ReturnType<typeof scoreArtist> | null = null;
  try {
    scores = scoreArtist(metrics, { primaryCountry: artist.country ?? "South Africa" });
  } catch {
    scores = null;
  }

  const latest = artist.artist_stats?.[0];

  return (
    <div className="min-h-screen bg-bg text-text-primary">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary mb-8">
          <ArrowLeft size={15} /> ROSTER
        </Link>

        <div className="glass-card rounded-3xl p-8 mb-6">
          <div className="flex items-start gap-6 flex-wrap">
            {artist.image_url && (
              <div className="w-32 h-32 rounded-2xl overflow-hidden flex-shrink-0">
                <Image
                  src={artist.image_url}
                  alt={artist.name}
                  width={128}
                  height={128}
                  className="object-cover w-full h-full"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-widest mb-1 text-brand">
                {artist.country_flag ?? ""} {artist.country ?? ""}
              </p>
              <h1 className="text-4xl font-black text-text-primary mb-2">{artist.name}</h1>
              {artist.genre && <p className="text-text-muted text-sm">{artist.genre}</p>}
              <div className="flex items-center gap-3 mt-4 flex-wrap">
                {artist.spotify_url && (
                  <a href={artist.spotify_url} target="_blank" rel="noreferrer" className="text-xs font-semibold inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3">
                    Spotify <ExternalLink size={11}/>
                  </a>
                )}
                {artist.audiomack_handle && (
                  <a href={`https://audiomack.com/${artist.audiomack_handle}`} target="_blank" rel="noreferrer" className="text-xs font-semibold inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3">
                    Audiomack <ExternalLink size={11}/>
                  </a>
                )}
                {artist.youtube_channel_id && (
                  <a href={`https://youtube.com/channel/${artist.youtube_channel_id}`} target="_blank" rel="noreferrer" className="text-xs font-semibold inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3">
                    YouTube <ExternalLink size={11}/>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {scores && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="glass-card rounded-2xl p-6 text-center">
              <p className="text-xs text-text-muted mb-2">Reach</p>
              <p className="text-4xl font-black text-brand">{Math.round(scores.reach)}</p>
              <p className="text-[10px] text-text-muted mt-1">/ 100</p>
            </div>
            <div className="glass-card rounded-2xl p-6 text-center">
              <p className="text-xs text-text-muted mb-2">Momentum</p>
              <p className="text-4xl font-black" style={{ color: scores.momentum >= 0 ? "#10B981" : "#EF4444" }}>
                {scores.momentum > 0 ? "+" : ""}{Math.round(scores.momentum)}
              </p>
              <p className="text-[10px] text-text-muted mt-1">−100 to +100</p>
            </div>
            <div className="glass-card rounded-2xl p-6 text-center">
              <p className="text-xs text-text-muted mb-2">Engagement</p>
              <p className="text-4xl font-black text-brand">{Math.round(scores.engagement)}</p>
              <p className="text-[10px] text-text-muted mt-1">/ 100</p>
            </div>
          </div>
        )}

        {latest && (
          <div className="glass-card rounded-2xl p-6 mb-6">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3 text-brand">Latest snapshot</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {latest.followers !== null && latest.followers !== undefined && (
                <div>
                  <p className="text-text-muted text-xs">Spotify followers</p>
                  <p className="font-bold text-lg text-text-primary">{latest.followers?.toLocaleString()}</p>
                </div>
              )}
              {latest.monthly_listeners !== null && latest.monthly_listeners !== undefined && (
                <div>
                  <p className="text-text-muted text-xs">Spotify monthly listeners</p>
                  <p className="font-bold text-lg text-text-primary">{latest.monthly_listeners?.toLocaleString()}</p>
                </div>
              )}
            </div>
            <p className="text-[10px] text-text-muted mt-3">
              Snapshot: {latest.snapshot_at ? new Date(latest.snapshot_at).toLocaleDateString() : "—"}
            </p>
          </div>
        )}

        <div className="glass-card rounded-2xl p-6">
          <p className="text-xs text-text-muted leading-relaxed">
            <span className="font-semibold text-text-primary">Verifiable scoring.</span> All scores derived from public-API + auto-pulled platform data, weighted for the artist's market(s). Methodology in
            {" "}<Link href="/methodology" className="text-brand">/methodology</Link>. Built on{" "}
            <Link href="/" className="text-brand font-semibold">ROSTER</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  return {
    title: `${slug.replace(/-/g, " ")} — verified by ROSTER`,
    description: `Public artist profile with verifiable cross-platform scoring on ROSTER.`,
  };
}
