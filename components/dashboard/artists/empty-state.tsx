"use client";

import { Plus, Users } from "lucide-react";
import { useTranslation } from "@/lib/i18n/hooks";

export function EmptyState({ onAdd }: { onAdd: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="text-center py-8">
      <div className="w-12 h-12 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center mx-auto mb-4">
        <Users size={16} className="text-brand" />
      </div>
      <p className="text-sm font-semibold text-text-primary mb-1">
        {t("roster.noArtists")}
      </p>
      <p className="text-xs text-text-muted mb-4 max-w-[220px] mx-auto">
        {t("widget.addArtistHint")}
      </p>
      <button
        onClick={onAdd}
        className="text-xs font-medium text-background bg-brand hover:bg-brand-light transition-colors rounded-lg px-3 py-1.5"
      >
        <Plus size={12} className="inline -mt-px mr-1" />
        {t("roster.addArtist")}
      </button>
    </div>
  );
}
