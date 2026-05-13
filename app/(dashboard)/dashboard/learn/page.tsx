import Link from "next/link";
import { ArrowRight, Clock, BookOpen, GraduationCap } from "lucide-react";
import { COURSES } from "@/lib/course-data";
import { getServerT } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import type { TranslationPath } from "@/lib/i18n";

const LEVEL_COLORS = {
  Foundation:   { color: "#10B981", bg: "rgba(16,185,129,0.10)" },
  Intermediate: { color: "#F59E0B", bg: "rgba(245,158,11,0.10)" },
  Advanced:     { color: "#EF4444", bg: "rgba(239,68,68,0.10)" },
};

const LEVEL_KEY_MAP: Record<string, TranslationPath> = {
  Foundation:   "learn.foundation",
  Intermediate: "learn.intermediate",
  Advanced:     "learn.advanced",
};

export default async function LearnPage() {
  const supabase = await createClient();
  const t = await getServerT(supabase);

  return (
    <div className="animate-fade-in">
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-2">
          <GraduationCap size={22} className="text-brand" />
          <h1 className="text-3xl font-black text-text-primary">{t("learn.title")}</h1>
        </div>
        <p className="text-text-muted">{t("learn.subtitle")}</p>
      </div>

      {/* Course grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {COURSES.map((course) => {
          const levelCfg = LEVEL_COLORS[course.level as keyof typeof LEVEL_COLORS] ?? LEVEL_COLORS.Foundation;
          const levelKey = LEVEL_KEY_MAP[course.level] ?? "learn.foundation";
          return (
            <Link key={course.id} href={`/dashboard/learn/${course.slug}`}
              className="module-card glass-card rounded-2xl p-6 group flex flex-col"
              style={{ borderColor: `${course.color}20` }}>

              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                  style={{ backgroundColor: `${course.color}15` }}>
                  {course.icon}
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ color: levelCfg.color, backgroundColor: levelCfg.bg }}>
                  {t(levelKey)}
                </span>
              </div>

              {/* Content */}
              <p className="text-xs font-semibold uppercase tracking-widest mb-1"
                style={{ color: course.color }}>
                {course.subtitle}
              </p>
              <h3 className="text-lg font-black text-text-primary mb-2 group-hover:text-gold transition-colors">
                {course.title}
              </h3>
              <p className="text-sm text-text-muted leading-relaxed flex-1">
                {course.description}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between mt-5 pt-4 border-t border-border">
                <div className="flex items-center gap-4 text-xs text-text-muted">
                  <span className="flex items-center gap-1">
                    <BookOpen size={11} />
                    {t("learn.lessonsCount", { n: course.totalLessons })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={11} />
                    {course.estimatedHours}
                  </span>
                </div>
                <span className="flex items-center gap-1 text-xs font-semibold"
                  style={{ color: course.color }}>
                  {t("learn.startCourse")}
                  <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* More coming */}
      <div className="mt-8 glass-card rounded-xl p-5 border-dashed text-center">
        <p className="text-xs font-semibold text-text-muted mb-1">{t("learn.moreComingSoon")}</p>
        <p className="text-xs text-text-muted">{t("learn.moreComingSoonDesc")}</p>
      </div>
    </div>
  );
}
