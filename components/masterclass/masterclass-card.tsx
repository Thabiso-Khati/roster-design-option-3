import Link from "next/link";
import { Play, Clock, Lock } from "lucide-react";

export interface MasterclassCardData {
  id: string;
  title: string;
  description?: string | null;
  instructor_name?: string | null;
  instructor_title?: string | null;
  thumbnail_url?: string | null;
  duration_seconds?: number | null;
  category?: string | null;
  is_published: boolean;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m} min`;
}

const CATEGORY_COLORS: Record<string, string> = {
  startup: "#C9A84C",
  touring: "#F59E0B",
  recording: "#10B981",
  marketing: "#8B5CF6",
  money: "#EC4899",
};

interface MasterclassCardProps {
  masterclass: MasterclassCardData;
  locked?: boolean;
}

export function MasterclassCard({ masterclass, locked = false }: MasterclassCardProps) {
  const color = CATEGORY_COLORS[masterclass.category || ""] || "#C9A84C";
  const duration = masterclass.duration_seconds
    ? formatDuration(masterclass.duration_seconds)
    : null;

  const content = (
    <div className="module-card bg-surface rounded-2xl overflow-hidden border border-border group h-full flex flex-col">
      {/* Thumbnail */}
      <div className="relative h-44 bg-surface-2 flex items-center justify-center flex-shrink-0">
        {masterclass.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={masterclass.thumbnail_url}
            alt={masterclass.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${color}20`, border: `1px solid ${color}40` }}
          >
            {locked ? (
              <Lock size={22} style={{ color }} />
            ) : (
              <Play size={22} className="ml-1" style={{ color }} />
            )}
          </div>
        )}

        {/* Overlay play button on thumbnail */}
        {masterclass.thumbnail_url && !locked && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Play size={20} className="text-white ml-1" />
            </div>
          </div>
        )}

        {/* Category badge */}
        {masterclass.category && (
          <div
            className="absolute top-3 left-3 rounded-full px-2.5 py-0.5 text-xs font-bold capitalize"
            style={{ backgroundColor: `${color}20`, color, border: `1px solid ${color}30` }}
          >
            {masterclass.category}
          </div>
        )}

        {/* Duration */}
        {duration && (
          <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm rounded-full px-2 py-0.5 flex items-center gap-1">
            <Clock size={10} className="text-text-muted" />
            <span className="text-xs text-text-muted">{duration}</span>
          </div>
        )}

        {/* Lock overlay */}
        {locked && (
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center">
            <Lock size={20} className="text-text-muted" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-bold text-sm text-text-primary leading-snug mb-2 group-hover:text-gold transition-colors line-clamp-2">
          {masterclass.title}
        </h3>
        {masterclass.description && (
          <p className="text-xs text-text-muted leading-relaxed line-clamp-2 mb-3">
            {masterclass.description}
          </p>
        )}
        {masterclass.instructor_name && (
          <div className="mt-auto pt-3 border-t border-border">
            <p className="text-xs font-semibold text-text-primary">{masterclass.instructor_name}</p>
            {masterclass.instructor_title && (
              <p className="text-xs text-text-muted">{masterclass.instructor_title}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (locked) return <div className="cursor-not-allowed h-full">{content}</div>;

  return (
    <Link href={`/dashboard/masterclasses/${masterclass.id}`} className="block h-full">
      {content}
    </Link>
  );
}
