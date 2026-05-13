import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Clock, FileText, Download, CheckCircle2, PenSquare } from "lucide-react";
import { getCourse, getLesson } from "@/lib/course-data";
import { ViewDocumentButton } from "@/components/toolkit/document-viewer";

interface Props { params: Promise<{ course: string; lesson: string }> }

const FILE_LABEL: Record<string, string> = {
  ".pdf":  "PDF",
  ".docx": "DOCX",
  ".xlsx": "XLSX",
};

function getFileLabel(path: string) {
  for (const ext of Object.keys(FILE_LABEL)) {
    if (path.endsWith(ext)) return FILE_LABEL[ext];
  }
  return "FILE";
}

function getFileType(path: string): "pdf" | "docx" | "xlsx" {
  if (path.endsWith(".pdf"))  return "pdf";
  if (path.endsWith(".docx")) return "docx";
  return "xlsx";
}

function getFileName(path: string) {
  return path.split("/").pop()?.replace(/[-_]/g, " ").replace(/\.(pdf|docx|xlsx)$/i, "") || path;
}

export default async function LessonPage({ params }: Props) {
  const { course: courseSlug, lesson: lessonId } = await params;
  const course = getCourse(courseSlug);
  if (!course) notFound();

  const lessonIndex = course.lessons.findIndex(l => l.id === lessonId);
  if (lessonIndex === -1) notFound();

  const lesson = course.lessons[lessonIndex];
  const prevLesson = course.lessons[lessonIndex - 1] || null;
  const nextLesson = course.lessons[lessonIndex + 1] || null;

  function renderContent(text: string) {
    return text.split("\n\n").map((block, i) => {
      if (block.startsWith("**") && block.endsWith("**")) {
        return (
          <h3 key={i} className="text-base font-bold text-text-primary mt-6 mb-2">
            {block.replace(/\*\*/g, "")}
          </h3>
        );
      }
      if (block.startsWith("*") && block.endsWith("*") && !block.startsWith("**")) {
        return <p key={i} className="text-sm text-brand italic mb-3">{block.replace(/\*/g, "")}</p>;
      }
      const parts = block.split(/(\*\*[^*]+\*\*)/g);
      return (
        <p key={i} className="text-sm text-text-muted leading-relaxed mb-4">
          {parts.map((part, j) =>
            part.startsWith("**") && part.endsWith("**")
              ? <strong key={j} className="text-text-primary font-semibold">{part.replace(/\*\*/g, "")}</strong>
              : part
          )}
        </p>
      );
    });
  }

  return (
    <div className="animate-fade-in max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-text-muted mb-6">
        <Link href="/dashboard/learn" className="hover:text-text-primary transition-colors">Learn</Link>
        <ChevronRight size={12}/>
        <Link href={`/dashboard/learn/${courseSlug}`} className="hover:text-text-primary transition-colors">{course.title}</Link>
        <ChevronRight size={12}/>
        <span className="text-text-primary">Lesson {lessonIndex + 1}</span>
      </div>

      {/* Lesson header */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: course.color }}>
          Lesson {lessonIndex + 1} of {course.lessons.length}
        </p>
        <h1 className="text-2xl font-black text-text-primary mb-3">{lesson.title}</h1>
        <div className="flex items-center gap-4 text-xs text-text-muted">
          <span className="flex items-center gap-1"><Clock size={11}/>{lesson.duration}</span>
          {lesson.resources && <span className="flex items-center gap-1"><FileText size={11}/>{lesson.resources.length} resources</span>}
        </div>
      </div>

      {/* Summary callout */}
      <div className="rounded-xl px-5 py-4 mb-8"
        style={{ backgroundColor: `${course.color}08`, border: `1px solid ${course.color}20` }}>
        <p className="text-xs font-bold mb-1" style={{ color: course.color }}>In this lesson</p>
        <p className="text-sm text-text-muted">{lesson.summary}</p>
      </div>

      {/* Main content */}
      <article className="mb-10">
        {renderContent(lesson.content)}
      </article>

      {/* Key points */}
      {lesson.keyPoints && lesson.keyPoints.length > 0 && (
        <div className="glass-card rounded-xl p-6 mb-6">
          <p className="text-xs font-bold text-brand uppercase tracking-widest mb-4">Key Takeaways</p>
          {lesson.keyPoints.map((point, i) => (
            <div key={i} className="flex items-start gap-2.5 mb-3 last:mb-0">
              <CheckCircle2 size={15} className="text-brand flex-shrink-0 mt-0.5"/>
              <p className="text-sm text-text-muted">{point}</p>
            </div>
          ))}
        </div>
      )}

      {/* Exercise */}
      {lesson.exercise && (
        <div className="glass-card rounded-xl p-6 mb-6"
          style={{ borderColor: `${course.color}20`, backgroundColor: `${course.color}04` }}>
          <div className="flex items-center gap-2 mb-3">
            <PenSquare size={15} style={{ color: course.color }}/>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: course.color }}>Exercise</p>
          </div>
          <p className="text-sm text-text-muted leading-relaxed">{lesson.exercise}</p>
        </div>
      )}

      {/* Resources */}
      {lesson.resources && lesson.resources.length > 0 && (
        <div className="mb-8">
          <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-1">Resources in this lesson</p>
          <p className="text-xs text-text-muted mb-3">Click the <FileText size={11} className="inline"/> icon to read any document here on ROSTER.</p>
          <div className="space-y-2.5">
            {lesson.resources.map((res) => {
              const label     = getFileLabel(res);
              const name      = getFileName(res);
              const fileType  = getFileType(res);
              const typeColor = label === "PDF" ? "#EF4444" : label === "DOCX" ? "#3B82F6" : "#10B981";
              return (
                <div key={res} className="glass-card rounded-xl p-4 flex items-center gap-3 group hover:border-brand/20 transition-colors">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${typeColor}15` }}>
                    <FileText size={16} style={{ color: typeColor }}/>
                  </div>
                  <p className="flex-1 text-sm font-medium text-text-primary group-hover:text-gold transition-colors truncate capitalize">
                    {name}
                  </p>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-xs font-bold uppercase px-2 py-0.5 rounded"
                      style={{ color: typeColor, backgroundColor: `${typeColor}15` }}>
                      {label}
                    </span>
                    <ViewDocumentButton title={name} filePath={res} fileType={fileType} />
                    <a href={res} download
                      className="p-1.5 rounded-lg text-text-muted hover:text-brand hover:bg-brand/10 transition-all"
                      title="Download">
                      <Download size={14}/>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lesson navigation */}
      <div className="flex items-center justify-between gap-4 pt-6 border-t border-border">
        {prevLesson ? (
          <Link href={`/dashboard/learn/${courseSlug}/${prevLesson.id}`}
            className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors group">
            <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform"/>
            <span className="truncate max-w-[180px]">{prevLesson.title}</span>
          </Link>
        ) : (
          <Link href={`/dashboard/learn/${courseSlug}`}
            className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors">
            <ChevronLeft size={16}/>
            Back to course
          </Link>
        )}

        {nextLesson ? (
          <Link href={`/dashboard/learn/${courseSlug}/${nextLesson.id}`}
            className="flex items-center gap-2 text-sm font-semibold group ml-auto"
            style={{ color: course.color }}>
            <span className="truncate max-w-[180px]">{nextLesson.title}</span>
            <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform"/>
          </Link>
        ) : (
          <Link href={`/dashboard/learn/${courseSlug}`}
            className="flex items-center gap-2 text-sm font-semibold ml-auto"
            style={{ color: course.color }}>
            Course complete
            <CheckCircle2 size={16}/>
          </Link>
        )}
      </div>
    </div>
  );
}
