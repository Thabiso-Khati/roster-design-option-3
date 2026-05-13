"use client";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search, X, FileText, Mic, Calendar, PenLine, Sparkles, ArrowRight,
  Users, Loader2, ChevronRight, Command,
} from "lucide-react";
import type { SearchResult, SearchResultType } from "@/app/api/search/route";
import { useTranslation } from "@/lib/i18n/hooks";

interface SearchResultsByType {
  artists: SearchResult[];
  bookings: SearchResult[];
  events: SearchResult[];
  signing: SearchResult[];
  contracts: SearchResult[];
  modules: SearchResult[];
}

const TYPE_ICON: Record<SearchResultType, React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>> = {
  "artist":            Mic,
  "booking":           Calendar,
  "workspace-event":   Sparkles,
  "signing-request":   PenLine,
  "contract-template": FileText,
  "module":            Users,
  "library-tool":      FileText,
};

/**
 * Global cmd-K command palette. Mounted once in the dashboard layout.
 * Opens on Cmd+K / Ctrl+K. Esc to close. Arrow keys to navigate.
 */
export function CommandPalette() {
  const router = useRouter();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultsByType | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement | null>(null);

  // Sections defined inside component so t() is in scope
  const SECTIONS = useMemo(() => [
    { key: "events"    as keyof SearchResultsByType, label: t("search.recentlyTouched"),   icon: Sparkles },
    { key: "artists"   as keyof SearchResultsByType, label: t("search.artists"),            icon: Mic },
    { key: "bookings"  as keyof SearchResultsByType, label: t("search.bookings"),           icon: Calendar },
    { key: "signing"   as keyof SearchResultsByType, label: t("search.signingRequests"),    icon: PenLine },
    { key: "contracts" as keyof SearchResultsByType, label: t("search.contractTemplates"),  icon: FileText },
    { key: "modules"   as keyof SearchResultsByType, label: t("search.toolkitModules"),     icon: Users },
  ], [t]);

  // ── keyboard shortcut to toggle ──────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        return;
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // ── focus input on open ──────────────────────────────────────────
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [open]);

  // ── debounced search ─────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          setResults(data.results as SearchResultsByType);
          setSelectedIndex(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, open]);

  // ── flat list of results for keyboard navigation ─────────────────
  const flatResults = useMemo<SearchResult[]>(() => {
    if (!results) return [];
    return SECTIONS.flatMap((s) => results[s.key] ?? []);
  }, [results, SECTIONS]);

  // ── arrow key navigation ─────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(flatResults.length - 1, i + 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(0, i - 1));
      } else if (e.key === "Enter" && flatResults[selectedIndex]) {
        e.preventDefault();
        navigateTo(flatResults[selectedIndex].href);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, flatResults, selectedIndex]);

  const navigateTo = useCallback((href: string) => {
    setOpen(false);
    router.push(href);
  }, [router]);

  if (!open) {
    return (
      // Floating hint button (bottom-right). Comment out to rely on keyboard shortcut alone.
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-30 hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-bg/80 backdrop-blur-sm text-text-muted hover:text-text-primary text-xs font-semibold shadow-lg"
        aria-label={t("nav.openCommandPalette")}
      >
        <Command size={12} /> K
      </button>
    );
  }

  let runningIndex = -1;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 pt-[10vh]"
      onClick={() => setOpen(false)}
      aria-hidden="true"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("nav.commandPalette")}
        className="glass-card rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ borderColor: "rgba(201,168,76,0.40)" }}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <Search size={18} className="text-text-muted flex-shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("search.placeholder")}
            className="bg-transparent text-text-primary placeholder:text-text-muted text-base focus:outline-none flex-1"
          />
          {loading && <Loader2 size={14} className="animate-spin text-text-muted" />}
          <button
            onClick={() => setOpen(false)}
            aria-label={t("nav.closeCommandPalette")}
            className="text-text-muted hover:text-text-primary"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {!results || flatResults.length === 0 ? (
            <div className="p-8 text-center">
              <Search size={20} className="mx-auto mb-2 opacity-40 text-text-muted" />
              <p className="text-sm text-text-muted">
                {query.length < 2 && !results
                  ? t("search.hint")
                  : t("search.noResults")}
              </p>
              <p className="text-[10px] text-text-muted mt-3">
                <kbd className="px-1.5 py-0.5 rounded border border-border bg-surface-2 font-mono text-[10px]">↑↓</kbd> navigate · <kbd className="px-1.5 py-0.5 rounded border border-border bg-surface-2 font-mono text-[10px]">↵</kbd> open · <kbd className="px-1.5 py-0.5 rounded border border-border bg-surface-2 font-mono text-[10px]">esc</kbd> close
              </p>
            </div>
          ) : (
            <>
              {SECTIONS.map((section) => {
                const items = results[section.key] ?? [];
                if (items.length === 0) return null;
                const SecIcon = section.icon;
                return (
                  <div key={section.key} className="py-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted px-5 py-1.5 flex items-center gap-1.5">
                      <SecIcon size={11} />
                      {section.label} <span className="text-text-muted/60">· {items.length}</span>
                    </p>
                    {items.map((r) => {
                      runningIndex++;
                      const i = runningIndex;
                      const Icon = TYPE_ICON[r.type];
                      const isSelected = selectedIndex === i;
                      return (
                        <button
                          key={r.id}
                          onMouseEnter={() => setSelectedIndex(i)}
                          onClick={() => navigateTo(r.href)}
                          className={`w-full text-left px-5 py-2.5 flex items-center gap-3 transition-colors ${
                            isSelected ? "bg-surface-2" : "hover:bg-surface-2/50"
                          }`}
                        >
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(201,168,76,0.10)" }}>
                            <Icon size={14} style={{ color: "#C9A84C" }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-text-primary truncate">{r.title}</p>
                            {r.subtitle && (
                              <p className="text-xs text-text-muted truncate">{r.subtitle}</p>
                            )}
                          </div>
                          {isSelected ? (
                            <ArrowRight size={14} className="text-text-muted flex-shrink-0" />
                          ) : (
                            <ChevronRight size={14} className="text-text-muted/40 flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}

              <div className="px-5 py-3 border-t border-border bg-surface-2/30 text-[10px] text-text-muted flex items-center justify-between flex-wrap gap-2">
                <span>
                  <kbd className="px-1.5 py-0.5 rounded border border-border bg-surface-2 font-mono text-[10px]">↑↓</kbd> nav · <kbd className="px-1.5 py-0.5 rounded border border-border bg-surface-2 font-mono text-[10px]">↵</kbd> open · <kbd className="px-1.5 py-0.5 rounded border border-border bg-surface-2 font-mono text-[10px]">esc</kbd> close
                </span>
                <span>
                  {flatResults.length} {flatResults.length === 1 ? t("search.result") : t("search.results")}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
