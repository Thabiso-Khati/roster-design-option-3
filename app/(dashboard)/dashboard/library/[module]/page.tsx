"use client";
/**
 * Catch-all fallback — all six toolkit modules now have dedicated pages.
 * This file is intentionally a client component so Next.js routing always
 * prefers the specific static-segment pages over this dynamic segment.
 */
import { useParams, notFound } from "next/navigation";
import { MODULES } from "@/lib/constants";
import { ModuleIcon } from "@/components/icons/module-icons";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function ModuleFallbackPage() {
  const params = useParams();
  const moduleSlug = params.module as string;
  const mod = MODULES.find((m) => m.slug === moduleSlug);

  if (!mod) {
    notFound();
    return null;
  }

  // All known modules have dedicated pages — this should never render.
  // If it does, send the user to the correct page.
  return (
    <div className="animate-fade-in">
      <Link
        href="/dashboard/library"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary mb-6 transition-colors"
      >
        <ChevronLeft size={15} />
        Back to Toolkit
      </Link>
      <div className="glass-card rounded-2xl p-7" style={{ borderColor: `${mod.color}25` }}>
        <div className="flex items-start gap-5">
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${mod.color}15` }}
          >
            <ModuleIcon id={mod.id} size={28} style={{ color: mod.color }} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: mod.color }}>
              {mod.subtitle}
            </p>
            <h1 className="text-2xl font-black text-text-primary mb-2">{mod.title}</h1>
            <p className="text-text-muted text-sm leading-relaxed max-w-xl">{mod.description}</p>
            <Link
              href={`/dashboard/library/${moduleSlug}`}
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold"
              style={{ color: mod.color }}
            >
              Open module →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
