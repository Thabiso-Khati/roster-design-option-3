import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Clock, BookOpen, ArrowRight, CheckCircle2, FileText } from "lucide-react";
import { getCourse } from "@/lib/course-data";

interface Props { params: Promise<{ course: string }> }

const LEVEL_COLORS = {
  Foundation:   { color: "#10B981", bg: "rgba(16,185,129,0.10)" },
  Intermediate: { color: "#F59E0B", bg: "rgba(245,158,11,0.10)" },
  Advanced:     { color: "#EF4444", bg: "rgba(239,68,68,0.10)" },
};

export default async function CoursePage({ params }: Props) {
  const { course: slug } = await params;
  const course = getCourse(slug);
  if (!course) notFound();

  const levelCfg = LEVEL_COLORS[course.level];

  return (
    <div className="animate-fade-in max-w-3xl">
      <Link href="/dashboard/learn"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary mb-6 transition-colors">
        <ChevronLeft size={15}/>Back to Courses
      </Link>

      {/* Course header */}
      <div className="glass-card rounded-2xl p-7 mb-8" style={{ borderColor: `${course.color}25` }}>
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl flex-shrink-0"
            style={{ backgroundColor: `${course.color}15` }}>
            {course.icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: course.color }}>
                {course.subtitle}
              </p>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ color: levelCfg.color, backgroundColor: levelCfg.bg }}>
                {course.level}
              </span>
            </div>
            <h1 className="text-2xl font-black text-text-primary mb-2">{course.title}</h1>
            <p className="text-text-muted text-sm leading-relaxed mb-3">{course.description}</p>
            <div className="flex items-center gap-4 text-xs text-text-muted">
              <span className="flex items-center gap-1"><BookOpen size={11}/>{course.totalLessons} lessons</span>
              <span className="flex items-center gap-1"><Clock size={11}/>{course.estimatedHours} total</span>
            </div>
          </div>
        </div>
      </div>

      {/* Lessons */}
      <h2 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-4">
        Course Content
      </h2>
      <div className="space-y-2.5">
        {course.lessons.map((lesson, i) => (
          <Link key={lesson.id} href={`/dashboard/learn/${slug}/${lesson.id}`}
            className="glass-card rounded-xl p-5 flex items-center gap-4 group hover:border-brand/20 transition-colors block">

            {/* Number */}
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
              style={{ backgroundColor: `${course.color}15`, color: course.color }}>
              {i + 1}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-text-primary group-hover:text-gold transition-colors">
                {lesson.title}
              </p>
              <p className="text-xs text-text-muted mt-0.5">{lesson.summary}</p>
            </div>

            {/* Meta */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-xs text-text-muted flex items-center gap-1">
                <Clock size={10}/>{lesson.duration}
              </span>
              {lesson.resources && lesson.resources.length > 0 && (
                <span className="text-xs text-text-muted flex items-center gap-1">
                  <FileText size={10}/>{lesson.resources.length}
                </span>
              )}
              <ArrowRight size={14} className="text-text-muted group-hover:text-brand group-hover:translate-x-0.5 transition-all"/>
            </div>
          </Link>
        ))}
      </div>

      {/* What you get */}
      <div className="mt-8 glass-card rounded-xl p-5">
        <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">
          What&apos;s included
        </p>
        {[
          `${course.totalLessons} in-depth lessons written for working managers`,
          "Downloadable templates for every concept covered",
          "Real-world exercises to apply immediately",
          "Key takeaways summarised at the end of each lesson",
        ].map(item => (
          <div key={item} className="flex items-start gap-2.5 mb-2">
            <CheckCircle2 size={14} className="text-brand flex-shrink-0 mt-0.5"/>
            <p className="text-xs text-text-muted">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
