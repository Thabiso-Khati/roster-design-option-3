import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MODULES } from "@/lib/constants";
import { ModuleIcon } from "@/components/icons/module-icons";
import { getServerT } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

// ── Journey groupings ─────────────────────────────────────────
const GROUPS = [
  {
    id: "foundation",
    tag: "Start Here",
    headline: "Build the foundation",
    sub: "Get the basics right before anything else.",
    moduleIds: ["onboarding", "legal", "finance"],
  },
  {
    id: "release",
    tag: "Create & Release",
    headline: "Make music that travels",
    sub: "From studio session to streaming to screens.",
    moduleIds: ["ar-recording", "distribution", "marketing", "visual", "pr"],
  },
  {
    id: "money",
    tag: "Get Paid",
    headline: "Every revenue stream, tracked",
    sub: "Royalties, licensing, live shows, merchandise.",
    moduleIds: ["royalties", "publishing", "sync", "merch", "live"],
  },
  {
    id: "longterm",
    tag: "Build Long-term",
    headline: "Own the career",
    sub: "Audience, assets, and everything that compounds.",
    moduleIds: ["fan", "vault"],
  },
];

export default async function LibraryPage() {
  const supabase = await createClient();
  const t = await getServerT(supabase);

  return (
    <div className="animate-fade-in max-w-4xl">

      {/* Page header */}
      <div className="mb-12">
        <h1 className="text-3xl font-black text-text-primary">{t("library.title")}</h1>
        <p className="text-text-muted mt-2 max-w-lg leading-relaxed">
          {t("library.subtitle", { count: MODULES.length })}
        </p>
      </div>

      {/* Journey groups */}
      <div className="space-y-12">
        {GROUPS.map((group) => {
          const mods = group.moduleIds
            .map((id) => MODULES.find((m) => m.id === id))
            .filter(Boolean) as typeof MODULES;

          if (!mods.length) return null;

          // Use the first module's color as the group accent
          const accentColor = mods[0].color;

          return (
            <div key={group.id}>

              {/* Group header */}
              <div className="flex items-start gap-4 mb-5">
                <div
                  className="w-1 rounded-full flex-shrink-0 mt-1"
                  style={{ height: 36, backgroundColor: accentColor }}
                />
                <div>
                  <p
                    className="text-[10px] font-bold uppercase tracking-widest mb-0.5"
                    style={{ color: accentColor }}
                  >
                    {group.tag}
                  </p>
                  <h2 className="text-lg font-black text-text-primary leading-tight">
                    {group.headline}
                  </h2>
                  <p className="text-xs text-text-muted mt-0.5">{group.sub}</p>
                </div>
              </div>

              {/* Module cards — compact row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {mods.map((mod) => (
                  <Link
                    key={mod.id}
                    href={`/dashboard/library/${mod.slug}`}
                    className="module-card glass-card rounded-xl p-4 flex items-center gap-3.5 group"
                    style={{ borderColor: `${mod.color}20` }}
                  >
                    {/* Icon */}
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${mod.color}15` }}
                    >
                      <ModuleIcon id={mod.id} size={18} style={{ color: mod.color }} />
                    </div>

                    {/* Title + label */}
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-[9px] font-bold uppercase tracking-widest mb-0.5"
                        style={{ color: mod.color }}
                      >
                        {mod.subtitle}
                      </p>
                      <h3 className="font-bold text-text-primary text-sm leading-tight group-hover:text-gold transition-colors">
                        {mod.title}
                      </h3>
                    </div>

                    {/* Arrow */}
                    <ArrowRight
                      size={14}
                      className="flex-shrink-0 text-text-muted group-hover:translate-x-1 group-hover:text-gold transition-all"
                    />
                  </Link>
                ))}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
