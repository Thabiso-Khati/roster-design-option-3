"use client";
// ============================================================
// ROSTER — ExportButton
// ------------------------------------------------------------
// Context-aware Export button used across all work tools.
// - If only PDF is available: single button, triggers PDF directly
// - If PDF + CSV: dropdown with both options
// Replaces all "Save as PDF" buttons across ROSTER tools.
// ============================================================
import { useState, useRef, useEffect } from "react";
import { Download, ChevronDown, FileText, Table } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ExportButtonProps {
  /** Called to trigger PDF export */
  onPDF: () => void;
  /** Called to trigger CSV export — omit for PDF-only tools */
  onCSV?: () => void;
  /** Extra class names */
  className?: string;
  /** Override the button label (default: "Export") */
  label?: string;
}

export function ExportButton({ onPDF, onCSV, className, label = "Export" }: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // PDF only — single button, no dropdown
  if (!onCSV) {
    return (
      <button
        onClick={onPDF}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-border",
          "text-text-muted hover:text-text-primary hover:border-brand/30 transition-all",
          className
        )}
      >
        <Download size={14} />
        {label}
      </button>
    );
  }

  // PDF + CSV — dropdown
  return (
    <div ref={ref} className="relative inline-flex">
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-border",
          "text-text-muted hover:text-text-primary hover:border-brand/30 transition-all",
          open && "border-brand/30 text-text-primary",
          className
        )}
      >
        <Download size={14} />
        {label}
        <ChevronDown size={12} className={cn("transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1.5 w-36 bg-surface border border-border rounded-xl shadow-lg z-50 overflow-hidden animate-fade-in">
          <button
            onClick={() => { onPDF(); setOpen(false); }}
            className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-text-primary hover:bg-surface-2 transition-colors"
          >
            <FileText size={14} className="text-text-muted" />
            PDF
          </button>
          <button
            onClick={() => { onCSV(); setOpen(false); }}
            className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-text-primary hover:bg-surface-2 transition-colors border-t border-border/50"
          >
            <Table size={14} className="text-text-muted" />
            CSV
          </button>
        </div>
      )}
    </div>
  );
}
