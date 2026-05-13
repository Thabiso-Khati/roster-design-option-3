import { createClient } from "@/lib/supabase/server";
import { MasterclassCard } from "@/components/masterclass/masterclass-card";
import { MODULES } from "@/lib/constants";
import { ModuleIcon } from "@/components/icons/module-icons";
import { getServerT } from "@/lib/i18n/server";
import type { TranslationPath } from "@/lib/i18n";
import { SEED_MASTERCLASSES } from "@/lib/masterclasses/seed";

const CATEGORY_KEY_MAP: Record<string, TranslationPath> = {
  startup:   "masterclasses.catStartup",
  touring:   "masterclasses.catTouring",
  recording: "masterclasses.catRecording",
  marketing: "masterclasses.catMarketing",
  money:     "masterclasses.catMoney",
};


export default async function MasterclassesPage() {
  const supabase = await createClient();
  const t = await getServerT(supabase);

  const { data: masterclasses } = await supabase
    .from("masterclasses")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  const items =
    masterclasses && masterclasses.length > 0 ? masterclasses : SEED_MASTERCLASSES;

  // Group by category
  const grouped = MODULES.reduce<Record<string, typeof items>>((acc, mod) => {
    const filtered = items.filter((m) => m.category === mod.slug);
    if (filtered.length > 0) acc[mod.slug] = filtered;
    return acc;
  }, {});

  // Detect whether we're showing DB data or seeds
  const isSeeded = !masterclasses || masterclasses.length === 0;

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-text-primary">{t("masterclasses.title")}</h1>
        <p className="text-text-muted mt-2">{t("masterclasses.subtitle")}</p>
      </div>

      {/* Preview curriculum banner — shown when no DB content exists yet */}
      {isSeeded && (
        <div className="flex items-start gap-3 bg-brand/8 border border-brand/25 rounded-xl px-5 py-4 mb-8 text-sm">
          <span className="text-lg flex-shrink-0 mt-0.5">🎬</span>
          <div>
            <p className="font-bold text-text-primary mb-0.5">Curriculum Preview — Videos In Production</p>
            <p className="text-text-muted text-xs leading-relaxed">
              The 12-lesson curriculum below is live. Video recordings are currently in production with our industry experts.
              Each lesson will unlock as the recording is published. Bookmark your interests now and you&apos;ll be notified first.
            </p>
          </div>
        </div>
      )}


      {/* All masterclasses ungrouped at top */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-bold text-text-muted uppercase tracking-widest">
            {t("masterclasses.allClasses")} · {items.length}
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((mc) => (
            <MasterclassCard key={mc.id} masterclass={mc} />
          ))}
        </div>
      </div>

      {/* By category */}
      {Object.entries(grouped).map(([slug, mcs]) => {
        const mod = MODULES.find((m) => m.slug === slug);
        if (!mod) return null;
        const catKey = CATEGORY_KEY_MAP[slug];
        const catLabel = catKey ? t(catKey) : slug;
        return (
          <div key={slug} className="mb-12">
            <div className="flex items-center gap-3 mb-5">
              <ModuleIcon id={mod.id} size={18} style={{ color: mod.color }} />
              <h2 className="text-sm font-bold uppercase tracking-widest text-text-muted">
                {catLabel} · {mcs.length}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {mcs.map((mc) => (
                <MasterclassCard key={mc.id} masterclass={mc} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
