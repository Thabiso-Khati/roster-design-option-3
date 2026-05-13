"use client";
import { useState } from "react";
import { Download, ExternalLink, FileText, Table2 } from "lucide-react";
import { DocumentViewer } from "@/components/toolkit/document-viewer";

export interface Resource {
  title: string;
  description: string;
  type: "pdf" | "docx" | "xlsx";
  file: string;
  also_docx?: string;
  category: string;
}

const TYPE_COLORS: Record<string, string> = {
  pdf: "#EF4444", docx: "#3B82F6", xlsx: "#10B981",
};

const CATEGORY_COLORS: Record<string, string> = {
  Guide:       "#C9A84C",
  Checklist:   "#F59E0B",
  Contract:    "#8B5CF6",
  Template:    "#10B981",
  Technical:   "#F59E0B",
  Spreadsheet: "#06B6D4",
  Tracker:     "#10B981",
  "Case Study": "#F59E0B",
};

interface Props {
  resources: Resource[];
  categories: string[];
  moduleColor?: string;
}

export function ResourceList({ resources, categories, moduleColor = "#C9A84C" }: Props) {
  const [viewer, setViewer] = useState<{ title: string; filePath: string; fileType: "pdf"|"docx"|"xlsx" } | null>(null);

  const openViewer = (res: Resource) =>
    setViewer({ title: res.title, filePath: res.file, fileType: res.type });

  return (
    <>
      {categories.map(cat => {
        const items = resources.filter(r => r.category === cat);
        if (!items.length) return null;
        const catColor = CATEGORY_COLORS[cat] || "#64748B";

        return (
          <div key={cat} className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                style={{ color: catColor, backgroundColor: `${catColor}15` }}>
                {cat}{cat !== "Case Study" && items.length > 1 ? "s" : ""}
              </span>
              <span className="text-xs text-text-muted">
                {items.length} file{items.length > 1 ? "s" : ""}
              </span>
            </div>

            <div className="space-y-2.5">
              {items.map(res => {
                const typeColor = TYPE_COLORS[res.type] || "#64748B";
                const Icon = res.type === "xlsx" ? Table2 : FileText;
                return (
                  <div key={res.file}
                    className="glass-card rounded-xl p-5 flex items-center gap-4 group hover:border-brand/20 transition-colors">

                    {/* File type icon */}
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${typeColor}15` }}>
                      <Icon size={18} style={{ color: typeColor }}/>
                    </div>

                    {/* Clickable title + description */}
                    <button
                      onClick={() => openViewer(res)}
                      className="flex-1 min-w-0 text-left group/title"
                    >
                      <p className="font-semibold text-sm text-text-primary group-hover/title:text-gold transition-colors leading-snug">
                        {res.title}
                        <span className="ml-2 text-xs font-normal opacity-0 group-hover/title:opacity-100 transition-opacity"
                          style={{ color: moduleColor }}>
                          — click to read
                        </span>
                      </p>
                      <p className="text-xs text-text-muted mt-0.5 leading-relaxed line-clamp-2">
                        {res.description}
                      </p>
                      {res.also_docx && (
                        <button
                          onClick={e => { e.stopPropagation(); setViewer({ title: res.title, filePath: res.also_docx!, fileType: "docx" }); }}
                          className="mt-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          Open editable .docx version
                        </button>
                      )}
                    </button>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="text-xs font-bold uppercase px-2 py-0.5 rounded"
                        style={{ color: typeColor, backgroundColor: `${typeColor}15` }}>
                        {res.type}
                      </span>
                      {/* Open embedded viewer */}
                      <button
                        onClick={() => openViewer(res)}
                        className="p-2 rounded-lg transition-all"
                        style={{ color: moduleColor }}
                        title="Read on platform"
                      >
                        <FileText size={14}/>
                      </button>
                      {/* Download */}
                      <a href={res.file} download
                        onClick={e => e.stopPropagation()}
                        className="p-2 rounded-lg text-text-muted hover:text-brand hover:bg-brand/10 transition-all"
                        title="Download">
                        <Download size={14}/>
                      </a>
                      {/* Open in new tab */}
                      <a href={res.file} target="_blank" rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="p-2 rounded-lg text-text-muted hover:text-brand hover:bg-brand/10 transition-all"
                        title="Open in new tab">
                        <ExternalLink size={14}/>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Embedded document viewer */}
      {viewer && (
        <DocumentViewer
          title={viewer.title}
          filePath={viewer.filePath}
          fileType={viewer.fileType}
          onClose={() => setViewer(null)}
        />
      )}
    </>
  );
}
