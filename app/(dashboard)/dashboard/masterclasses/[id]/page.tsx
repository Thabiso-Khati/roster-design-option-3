import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Clock, User, Tag } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { VideoPlayer } from "@/components/masterclass/video-player";
import { MasterclassCard, type MasterclassCardData } from "@/components/masterclass/masterclass-card";
import { SEED_MASTERCLASSES, SEED_MAP } from "@/lib/masterclasses/seed";

interface Props {
  params: Promise<{ id: string }>;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h} hr ${m % 60} min`;
  return `${m} min`;
}

// SEED_MAP is pre-built in lib/masterclasses/seed.ts
const SEED: Record<string, MasterclassCardData & { vimeo_id?: string }> = SEED_MAP;

export default async function MasterclassPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  let masterclass: (MasterclassCardData & { vimeo_id?: string }) | null = null;
  let related: MasterclassCardData[] = [];

  if (id.startsWith("seed-")) {
    masterclass = SEED[id] || null;
    if (masterclass) {
      // Show related seeds in the same category
      related = SEED_MASTERCLASSES.filter(
        s => s.category === masterclass!.category && s.id !== id
      ).slice(0, 3);
    }
  } else {
    const { data } = await supabase
      .from("masterclasses")
      .select("*")
      .eq("id", id)
      .eq("is_published", true)
      .single();
    masterclass = data;

    if (masterclass) {
      const { data: relatedData } = await supabase
        .from("masterclasses")
        .select("*")
        .eq("is_published", true)
        .eq("category", masterclass.category)
        .neq("id", id)
        .limit(3);
      related = relatedData || [];
    }
  }

  if (!masterclass) notFound();

  return (
    <div className="animate-fade-in max-w-4xl">
      {/* Back */}
      <Link
        href="/dashboard/masterclasses"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary mb-6 transition-colors"
      >
        <ChevronLeft size={15} />
        Back to Masterclasses
      </Link>

      {/* Video player */}
      <div className="mb-8">
        {masterclass.vimeo_id ? (
          <VideoPlayer
            vimeoId={masterclass.vimeo_id}
            title={masterclass.title}
            thumbnailUrl={masterclass.thumbnail_url}
          />
        ) : (
          // Polished placeholder when video is in production
          <div className="relative w-full rounded-2xl overflow-hidden bg-surface-2 border border-border" style={{ paddingTop: "56.25%" }}>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8">
              <div className="w-20 h-20 rounded-full bg-brand/10 border border-brand/25 flex items-center justify-center">
                <span className="text-3xl">🎬</span>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-text-primary mb-1">Video In Production</p>
                <p className="text-xs text-text-muted max-w-xs leading-relaxed">
                  This lesson is being recorded with our industry expert. The full video will be available here
                  once production is complete. The curriculum outline below is live.
                </p>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-brand/10 text-brand border border-brand/20">
                Coming Soon
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Masterclass details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h1 className="text-2xl font-black text-text-primary mb-4 leading-tight">
            {masterclass.title}
          </h1>
          {masterclass.description && (
            <p className="text-text-muted leading-relaxed mb-6">
              {masterclass.description}
            </p>
          )}

          {/* Meta */}
          <div className="flex flex-wrap gap-4 text-sm text-text-muted">
            {masterclass.duration_seconds && (
              <div className="flex items-center gap-1.5">
                <Clock size={14} className="text-brand" />
                {formatDuration(masterclass.duration_seconds)}
              </div>
            )}
            {masterclass.instructor_name && (
              <div className="flex items-center gap-1.5">
                <User size={14} className="text-brand" />
                {masterclass.instructor_name}
              </div>
            )}
            {masterclass.category && (
              <div className="flex items-center gap-1.5">
                <Tag size={14} className="text-brand" />
                <span className="capitalize">{masterclass.category}</span>
              </div>
            )}
          </div>
        </div>

        {/* Instructor card */}
        {masterclass.instructor_name && (
          <div className="glass-card rounded-2xl p-5">
            <p className="text-xs font-semibold text-brand uppercase tracking-widest mb-3">
              Instructor
            </p>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-surface-2 border border-border flex items-center justify-center text-lg flex-shrink-0">
                👤
              </div>
              <div>
                <p className="font-bold text-text-primary text-sm">
                  {masterclass.instructor_name}
                </p>
                {masterclass.instructor_title && (
                  <p className="text-xs text-text-muted">
                    {masterclass.instructor_title}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div className="mt-12">
          <h2 className="text-lg font-bold text-text-primary mb-5">
            More in this module
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {related.map((mc) => (
              <MasterclassCard key={mc.id} masterclass={mc} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
