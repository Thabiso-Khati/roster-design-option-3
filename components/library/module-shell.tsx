"use client";
/**
 * Shared module/sub-page shell components used across the Toolkit's 15 modules.
 *
 * - <ModuleShell> — back link + glass-card module header
 * - <ResourcePage> — back link + sub-page header (used by individual contracts/tools)
 * - <ModuleTabs> — tab strip for Guides / Forms / Tools
 * - <ResourceCard> — a single Guide/Form/Tool tile
 * - <Disclaimer> — yellow legal-advice disclaimer (used in contract sub-pages)
 *
 * These keep contract / form / tool pages short while preserving the existing
 * glass-card aesthetic.
 */
import { ReactNode, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight, LucideIcon } from "lucide-react";
import { useTranslation } from "@/lib/i18n/hooks";

export interface ResourceItem {
  href: string;
  icon: LucideIcon;
  color: string;
  title: string;
  desc: string;
  tag: string;
  phase?: string;
}

export function ModuleShell({
  color,
  icon,
  subtitle,
  title,
  description,
  meta,
  children,
}: {
  color: string;
  icon: ReactNode;
  subtitle: string;
  title: string;
  description: string;
  meta?: ReactNode;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <>
      <Link
        href="/dashboard/library"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary mb-6 transition-colors"
      >
        <ChevronLeft size={15} />
        {t("library.backToToolkit")}
      </Link>

      <div
        className="glass-card rounded-2xl p-7 mb-8"
        style={{ borderColor: `${color}25` }}
      >
        <div className="flex items-start gap-5">
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl flex-shrink-0"
            style={{ backgroundColor: `${color}15` }}
          >
            {icon}
          </div>
          <div className="min-w-0">
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-1"
              style={{ color }}
            >
              {subtitle}
            </p>
            <h1 className="text-2xl font-black text-text-primary mb-2">
              {title}
            </h1>
            <p className="text-text-muted text-sm leading-relaxed">
              {description}
            </p>
            {meta && (
              <div className="flex items-center gap-4 mt-3 text-xs text-text-muted flex-wrap">
                {meta}
              </div>
            )}
          </div>
        </div>
      </div>

      {children}
    </>
  );
}

export function ModuleTabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex gap-0 mb-6 border-b border-border overflow-x-auto" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={active === t.id}
          onClick={() => onChange(t.id)}
          className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 -mb-px whitespace-nowrap ${
            active === t.id
              ? "border-brand text-brand"
              : "border-transparent text-text-muted hover:text-text-primary"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function ResourceCard({
  item,
  delay = 0,
}: {
  item: ResourceItem;
  delay?: number;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className="glass-card rounded-xl p-5 flex items-start gap-4 hover:border-brand/30 transition-all group"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
        style={{ backgroundColor: `${item.color}15` }}
      >
        <Icon size={18} style={{ color: item.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <p className="font-bold text-sm text-text-primary">{item.title}</p>
          <span
            className="text-[10px] font-black px-2 py-0.5 rounded"
            style={{ color: item.color, backgroundColor: `${item.color}15` }}
          >
            {item.tag}
          </span>
        </div>
        <p className="text-xs text-text-muted leading-relaxed">{item.desc}</p>
      </div>
      <ArrowRight
        size={15}
        className="flex-shrink-0 text-text-muted group-hover:text-brand transition-colors mt-0.5"
      />
    </Link>
  );
}

export function Disclaimer({ kind = "legal" }: { kind?: "legal" | "save" }) {
  const { t } = useTranslation();
  if (kind === "save") {
    return (
      <div
        className="glass-card rounded-xl p-4 mt-2 flex items-start gap-3"
        style={{
          borderColor: "rgba(201,168,76,0.15)",
          backgroundColor: "rgba(201,168,76,0.04)",
        }}
      >
        <span className="text-base flex-shrink-0">💾</span>
        <p className="text-xs text-text-muted leading-relaxed">
          {t("library.autosaveNote")}
        </p>
      </div>
    );
  }
  return (
    <div
      className="glass-card rounded-xl p-4 mt-6 flex items-start gap-3"
      style={{
        borderColor: "rgba(239,68,68,0.15)",
        backgroundColor: "rgba(239,68,68,0.04)",
      }}
    >
      <span className="text-sm flex-shrink-0">⚠️</span>
      <p className="text-xs text-text-muted leading-relaxed">
        {t("library.legalDisclaimer")}
      </p>
    </div>
  );
}

/**
 * Sub-page wrapper for individual tools / forms / contracts.
 * Provides the back link, header, and content slot.
 */
export function ResourcePage({
  parentHref,
  parentLabel,
  color,
  tag,
  title,
  intro,
  toolbar,
  next,
  children,
}: {
  parentHref: string;
  parentLabel: string;
  color: string;
  tag: string;
  title: string;
  intro?: string;
  toolbar?: ReactNode;
  /** Optional link to the next resource in the module */
  next?: { href: string; label: string };
  children: ReactNode;
}) {
  return (
    <div className="animate-fade-in max-w-4xl">
      <Link
        href={parentHref}
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary mb-6 transition-colors"
      >
        <ChevronLeft size={15} />
        {parentLabel}
      </Link>

      <div className="glass-card rounded-2xl p-6 mb-6" style={{ borderColor: `${color}25` }}>
        {/* Stack on mobile: title full-width, toolbar below. Row on sm+ */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <p
              className="text-[10px] font-black uppercase tracking-widest mb-1"
              style={{ color }}
            >
              {tag}
            </p>
            <h1 className="text-2xl font-black text-text-primary">{title}</h1>
            {intro && (
              <p className="text-sm text-text-muted mt-2 leading-relaxed max-w-prose">
                {intro}
              </p>
            )}
          </div>
          {toolbar && (
            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
              {toolbar}
            </div>
          )}
        </div>
      </div>

      {children}

      {/* ── Bottom navigation bar ── */}
      <div className="flex items-center justify-between mt-10 pt-6 border-t border-border flex-wrap gap-3">
        <Link
          href={parentHref}
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors"
        >
          <ChevronLeft size={15} />
          {parentLabel}
        </Link>
        {next && (
          <Link
            href={next.href}
            className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-all"
            style={{ backgroundColor: `${color}15`, color }}
          >
            Next: {next.label}
            <ChevronRight size={14} />
          </Link>
        )}
      </div>
    </div>
  );
}

/**
 * Reusable accordion clause used in contract templates.
 */
export function ClauseAccordion({
  num,
  title,
  text,
  color,
}: {
  num: string;
  title: string;
  text: string;
  color: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-surface-2 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span
            className="text-sm font-black w-6 flex-shrink-0"
            style={{ color }}
          >
            {num}.
          </span>
          <span className="font-bold text-text-primary text-sm">{title}</span>
        </div>
        <span
          className="text-text-muted text-xs"
          style={{
            transform: open ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        >
          ▶
        </span>
      </button>
      {open && (
        <div className="border-t border-border px-5 py-4">
          <p className="text-sm text-text-muted leading-relaxed whitespace-pre-line">
            {text}
          </p>
        </div>
      )}
    </div>
  );
}

/** Standard input/label classes used by every form & tool. */
export const inputClass =
  "bg-transparent border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand w-full";
export const labelClass =
  "text-xs font-semibold uppercase tracking-wider mb-1 block text-text-muted";

/** localStorage hook for auto-save (90-day, no expiry tracking). */
export function useLocalState<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  const persist = (next: T | ((prev: T) => T)) => {
    setState((prev) => {
      const value = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {}
      return value;
    });
  };
  return [state, persist] as const;
}
