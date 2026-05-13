"use client";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Star, ArrowRight } from "lucide-react";
import { useTranslation } from "@/lib/i18n/hooks";

export interface ExpertCardData {
  id: string;
  name: string;
  bio?: string | null;
  specialty?: string | null;
  country?: string | null;
  avatar_url?: string | null;
  is_verified: boolean;
  session_types?: { id: string; duration_minutes: number; price: number; currency: string }[];
}

export function ExpertCard({ expert }: { expert: ExpertCardData }) {
  const { t } = useTranslation();

  const lowestPrice = expert.session_types?.length
    ? Math.min(...expert.session_types.map((s) => s.price))
    : null;
  const currency = expert.session_types?.[0]?.currency || "ZAR";
  const priceStr = lowestPrice != null
    ? (currency === "ZAR" ? `From R${lowestPrice.toLocaleString()}` : `From ${currency} ${lowestPrice}`)
    : null;

  return (
    <Link
      href={`/dashboard/experts/${expert.id}`}
      className="module-card glass-card rounded-2xl p-6 flex flex-col group h-full"
    >
      {/* Avatar + verified */}
      <div className="flex items-start justify-between mb-4">
        <div className="w-14 h-14 rounded-xl bg-surface-2 border border-border flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">
          {expert.avatar_url ? (
            <Image src={expert.avatar_url} alt={expert.name} width={56} height={56} className="w-full h-full object-cover" unoptimized />
          ) : (
            "👤"
          )}
        </div>
        {expert.is_verified && (
          <div className="flex items-center gap-1 bg-brand/10 border border-brand/20 rounded-full px-2 py-0.5">
            <Star size={10} className="text-brand fill-brand" />
            <span className="text-xs font-semibold text-brand">{t("status.verified")}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <h3 className="font-bold text-text-primary text-base mb-1 group-hover:text-gold transition-colors">
        {expert.name}
      </h3>
      {expert.specialty && (
        <p className="text-sm text-brand font-medium mb-2">{expert.specialty}</p>
      )}
      {expert.country && (
        <div className="flex items-center gap-1 text-xs text-text-muted mb-3">
          <MapPin size={11} />
          {expert.country}
        </div>
      )}
      {expert.bio && (
        <p className="text-xs text-text-muted leading-relaxed line-clamp-2 mb-4">
          {expert.bio}
        </p>
      )}

      {/* Session types */}
      {expert.session_types && expert.session_types.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {expert.session_types.map((s) => (
            <span
              key={s.duration_minutes}
              className="text-xs border border-border rounded-full px-2.5 py-0.5 text-text-muted"
            >
              {s.duration_minutes} min
            </span>
          ))}
        </div>
      )}

      {/* Price + CTA */}
      <div className="mt-auto flex items-center justify-between pt-3 border-t border-border">
        {priceStr && (
          <span className="text-xs font-semibold text-text-muted">{priceStr}</span>
        )}
        <span className="flex items-center gap-1 text-xs font-semibold text-brand ml-auto">
          {t("action.bookSession")}
          <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
        </span>
      </div>
    </Link>
  );
}
