"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Search, FileText, PenLine } from "lucide-react";
import { ResourcePage } from "@/components/library/module-shell";
import {
  CONTRACT_REGISTRY,
  CONTRACT_CATEGORIES,
  type ContractCategory,
} from "@/lib/contracts/registry";

const COLOR = "#64748B";

export default function ContractLibraryPage() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<ContractCategory | "All">("All");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CONTRACT_REGISTRY.filter((c) => {
      if (activeCategory !== "All" && c.category !== activeCategory) return false;
      if (!q) return true;
      return (
        c.title.toLowerCase().includes(q) ||
        c.contractType.toLowerCase().includes(q) ||
        c.shortDescription.toLowerCase().includes(q) ||
        c.parentModule.toLowerCase().includes(q)
      );
    });
  }, [query, activeCategory]);

  const grouped = useMemo(() => {
    const map: Record<string, typeof CONTRACT_REGISTRY> = {};
    for (const cat of CONTRACT_CATEGORIES) map[cat] = [];
    for (const c of filtered) {
      if (!map[c.category]) map[c.category] = [];
      map[c.category].push(c);
    }
    return map;
  }, [filtered]);

  return (
    <ResourcePage
      parentHref="/dashboard/library/legal"
      parentLabel="Back to Legal & Compliance"
      color={COLOR}
      tag="Legal · Contract Library"
      title="Contract Library"
      intro={`Every signable agreement on ROSTER, in one place. ${CONTRACT_REGISTRY.length} contracts across ${CONTRACT_CATEGORIES.length} categories — all e-signature ready, all linked to their original module home.`}
    >
      {/* Search + category filter */}
      <div className="glass-card rounded-2xl p-4 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <Search size={16} className="text-text-muted flex-shrink-0" />
          <input
            type="text"
            placeholder="Search by name, type, or module…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-transparent text-sm text-text-primary placeholder:text-text-muted w-full focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
          <CategoryPill
            label={`All (${CONTRACT_REGISTRY.length})`}
            active={activeCategory === "All"}
            onClick={() => setActiveCategory("All")}
          />
          {CONTRACT_CATEGORIES.map((cat) => {
            const count = CONTRACT_REGISTRY.filter((c) => c.category === cat).length;
            if (count === 0) return null;
            return (
              <CategoryPill
                key={cat}
                label={`${cat} (${count})`}
                active={activeCategory === cat}
                onClick={() => setActiveCategory(cat)}
              />
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <FileText size={28} className="mx-auto mb-3 opacity-40" style={{ color: COLOR }} />
          <p className="font-bold text-text-primary mb-1">No contracts match</p>
          <p className="text-sm text-text-muted">Try a different search or clear the filter.</p>
        </div>
      ) : (
        <div className="space-y-7">
          {CONTRACT_CATEGORIES.map((cat) => {
            const items = grouped[cat] ?? [];
            if (items.length === 0) return null;
            return (
              <div key={cat}>
                <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: items[0].parentColor }}>
                  {cat} <span className="text-text-muted">· {items.length}</span>
                </p>
                <div className="space-y-3">
                  {items.map((c) => (
                    <Link
                      key={c.id}
                      href={c.route}
                      className="glass-card rounded-xl p-5 flex items-start gap-4 group hover:border-brand/30 transition-all block"
                    >
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${c.parentColor}15` }}
                      >
                        <FileText size={22} style={{ color: c.parentColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="min-w-0">
                            <p className="font-bold text-text-primary mb-0.5 group-hover:text-brand transition-colors">
                              {c.title}
                            </p>
                            <p className="text-xs text-text-muted leading-relaxed mb-1.5">
                              {c.shortDescription}
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded"
                                style={{ color: c.parentColor, backgroundColor: `${c.parentColor}15` }}
                              >
                                {c.parentModule}
                              </span>
                              {!c.comingSoon && (
                                <span
                                  className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded inline-flex items-center gap-1"
                                  style={{ color: "#10B981", backgroundColor: "#10B98115" }}
                                >
                                  <PenLine size={9} /> E-sign ready
                                </span>
                              )}
                              <span className="text-[10px] text-text-muted">
                                {c.fields.length} negotiable {c.fields.length === 1 ? "term" : "terms"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <ArrowRight
                        size={18}
                        className="text-text-muted group-hover:text-brand group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-3"
                      />
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div
        className="glass-card rounded-2xl p-5 mt-6 flex items-start gap-3"
        style={{ borderColor: `${COLOR}25`, backgroundColor: `${COLOR}06` }}
      >
        <FileText size={16} className="flex-shrink-0 mt-0.5" style={{ color: COLOR }} />
        <p className="text-xs text-text-muted leading-relaxed">
          <span className="font-semibold text-text-primary">Two homes for every contract.</span> Contracts live in their original module (Recording, Publishing, Sync, etc.) and are mirrored here in the Legal & Compliance hub for quick access. Every contract is e-signature ready — fill in negotiable terms (Term, Option, percentages, fees), then click <span className="font-semibold text-text-primary">Send for signature</span> on the contract page.
        </p>
      </div>
    </ResourcePage>
  );
}

function CategoryPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
        active ? "border-brand text-text-primary" : "border-border text-text-muted hover:text-text-primary"
      }`}
      style={active ? { borderColor: COLOR, backgroundColor: `${COLOR}15` } : undefined}
    >
      {label}
    </button>
  );
}
