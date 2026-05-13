import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import { Plus, Edit2, Eye, EyeOff, Clock, Video } from "lucide-react";

function fmtDuration(s: number) {
  const m = Math.floor(s / 60);
  return m > 59 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
}

const CATEGORY_COLORS: Record<string, string> = {
  startup: "#C9A84C", touring: "#F59E0B", recording: "#10B981",
  marketing: "#8B5CF6", money: "#EC4899",
};

export default async function AdminMasterclassesPage() {
  const supabase = await createClient();
  const { data: masterclasses } = await supabase
    .from("masterclasses")
    .select("*")
    .order("created_at", { ascending: false });

  const published = masterclasses?.filter((m) => m.is_published).length || 0;
  const drafts = (masterclasses?.length || 0) - published;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-text-primary">Masterclasses</h1>
          <p className="text-text-muted mt-1">
            {published} published · {drafts} draft
          </p>
        </div>
        <Link href="/admin/masterclasses/new">
          <button className="flex items-center gap-2 bg-gold-gradient text-background font-bold text-sm px-5 py-2.5 rounded-lg hover:brightness-110 transition-all">
            <Plus size={15} />Add Masterclass
          </button>
        </Link>
      </div>

      {!masterclasses || masterclasses.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 text-center">
          <Video className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h3 className="font-bold text-text-primary mb-2">No masterclasses yet</h3>
          <p className="text-text-muted text-sm mb-6">Add your first masterclass to get started.</p>
          <Link href="/admin/masterclasses/new">
            <button className="bg-gold-gradient text-background font-bold text-sm px-5 py-2.5 rounded-lg">
              Add First Masterclass
            </button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {masterclasses.map((mc) => {
            const color = CATEGORY_COLORS[mc.category || ""] || "#64748B";
            return (
              <div key={mc.id} className="glass-card rounded-xl p-5 flex items-center gap-4">
                {/* Thumbnail */}
                <div className="w-14 h-10 rounded-lg bg-surface-2 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {mc.thumbnail_url ? (
                    <Image src={mc.thumbnail_url} alt="" width={56} height={40} className="w-full h-full object-cover" unoptimized />
                  ) : (
                    <span style={{ color }} className="text-lg">▶</span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-text-primary text-sm truncate">{mc.title}</p>
                    {mc.category && (
                      <span className="text-xs font-bold capitalize px-1.5 py-0.5 rounded flex-shrink-0"
                        style={{ color, backgroundColor: `${color}15` }}>
                        {mc.category}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-text-muted">
                    {mc.instructor_name && <span>{mc.instructor_name}</span>}
                    {mc.duration_seconds && (
                      <span className="flex items-center gap-0.5">
                        <Clock size={10} />{fmtDuration(mc.duration_seconds)}
                      </span>
                    )}
                    {mc.vimeo_id && <span className="text-brand">Vimeo: {mc.vimeo_id}</span>}
                  </div>
                </div>

                {/* Status + actions */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    mc.is_published
                      ? "text-success bg-success/10"
                      : "text-text-muted bg-surface-2"
                  }`}>
                    {mc.is_published ? "Published" : "Draft"}
                  </span>
                  <Link href={`/admin/masterclasses/${mc.id}/edit`}
                    className="p-2 rounded-lg text-text-muted hover:text-brand hover:bg-brand/10 transition-all">
                    <Edit2 size={14} />
                  </Link>
                  <TogglePublish id={mc.id} isPublished={mc.is_published} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Client component just for the toggle button
function TogglePublish({ id, isPublished }: { id: string; isPublished: boolean }) {
  return (
    <form action={`/api/admin/masterclasses`} method="POST">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="action" value="toggle" />
      <button
        type="submit"
        className="p-2 rounded-lg text-text-muted hover:text-brand hover:bg-brand/10 transition-all"
        title={isPublished ? "Unpublish" : "Publish"}
      >
        {isPublished ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </form>
  );
}
