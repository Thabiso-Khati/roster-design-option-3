"use client";
import { useState } from "react";
import { X, Download, ExternalLink, FileText, Table2 } from "lucide-react";

interface DocumentViewerProps {
  title: string;
  filePath: string;
  fileType: "pdf" | "docx" | "xlsx";
  onClose: () => void;
}

export function DocumentViewer({ title, filePath, fileType, onClose }: DocumentViewerProps) {
  const typeColor = fileType === "pdf" ? "#EF4444" : fileType === "docx" ? "#3B82F6" : "#10B981";

  return (
    <div className="fixed inset-0 z-[80] flex items-stretch justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative w-full max-w-4xl bg-surface border-l border-border flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border flex-shrink-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${typeColor}15` }}>
            {fileType === "xlsx"
              ? <Table2 size={16} style={{ color: typeColor }}/>
              : <FileText size={16} style={{ color: typeColor }}/>
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-text-primary truncate">{title}</p>
            <p className="text-xs font-bold uppercase" style={{ color: typeColor }}>{fileType}</p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <a href={filePath} download
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
              style={{ color: typeColor, backgroundColor: `${typeColor}15` }}>
              <Download size={12}/>Download
            </a>
            <a href={filePath} target="_blank" rel="noopener noreferrer"
              className="p-1.5 rounded-lg text-text-muted hover:text-brand hover:bg-brand/10 transition-all"
              title="Open in new tab">
              <ExternalLink size={14}/>
            </a>
            <button onClick={onClose}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-2 transition-all">
              <X size={16}/>
            </button>
          </div>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {fileType === "pdf" && (
            <iframe src={filePath} className="w-full h-full border-0" title={title}/>
          )}
          {fileType === "docx" && <DocxViewer filePath={filePath} title={title}/>}
          {fileType === "xlsx" && <XlsxPlaceholder filePath={filePath}/>}
        </div>
      </div>
    </div>
  );
}

// Load mammoth.js from CDN (avoids needing npm install)
async function loadMammoth() {
  if ((window as unknown as Record<string, unknown>).mammoth) {
    return (window as unknown as Record<string, unknown>).mammoth as {
      convertToHtml: (o: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }>
    };
  }
  return new Promise<{ convertToHtml: (o: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }> }>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://unpkg.com/mammoth@1.6.0/mammoth.browser.js";
    script.onload  = () => resolve((window as unknown as Record<string, unknown>).mammoth as { convertToHtml: (o: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }> });
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function DocxViewer({ filePath, title }: { filePath: string; title: string }) {
  const [html, setHtml]       = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const mammoth  = await loadMammoth();
      const response = await fetch(filePath);
      const buf      = await response.arrayBuffer();
      const result   = await mammoth.convertToHtml({ arrayBuffer: buf });
      setHtml(result.value);
    } catch {
      setError(true);
    }
    setLoading(false);
  };

  if (html) {
    return (
      <div className="h-full overflow-y-auto bg-white">
        <div className="max-w-3xl mx-auto px-10 py-8 text-gray-900 text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: html }}/>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
        style={{ backgroundColor: "#3B82F615" }}>📄</div>
      {error ? (
        <>
          <p className="text-sm text-text-muted mb-3">This document can&apos;t be previewed — download it to open.</p>
          <a href={filePath} download
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm"
            style={{ backgroundColor: "#3B82F620", color: "#3B82F6", border: "1px solid #3B82F630" }}>
            <Download size={14}/>Download {title}
          </a>
        </>
      ) : (
        <>
          <p className="font-bold text-text-primary mb-1">Read on platform</p>
          <p className="text-sm text-text-muted mb-5">Opens the full document here in ROSTER.</p>
          <button onClick={load} disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all"
            style={{ backgroundColor: "#3B82F620", color: "#3B82F6", border: "1px solid #3B82F630" }}>
            {loading ? "Loading..." : "Open Document"}
          </button>
        </>
      )}
    </div>
  );
}

function XlsxPlaceholder({ filePath }: { filePath: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
        style={{ backgroundColor: "#10B98115" }}>📊</div>
      <p className="font-bold text-text-primary mb-1">Spreadsheet Template</p>
      <p className="text-sm text-text-muted mb-5 max-w-xs">
        Download to edit in Excel or Google Sheets, or use the live version in the Tools section of the sidebar.
      </p>
      <a href={filePath} download
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm"
        style={{ backgroundColor: "#10B98120", color: "#10B981", border: "1px solid #10B98130" }}>
        <Download size={14}/>Download .xlsx
      </a>
    </div>
  );
}

// ── Trigger button used in all module pages ───────────────────
interface ViewButtonProps {
  title: string;
  filePath: string;
  fileType: "pdf" | "docx" | "xlsx";
}

export function ViewDocumentButton({ title, filePath, fileType }: ViewButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}
        className="p-2 rounded-lg text-text-muted hover:text-brand hover:bg-brand/10 transition-all"
        title="Read on platform">
        <FileText size={15}/>
      </button>
      {open && (
        <DocumentViewer title={title} filePath={filePath} fileType={fileType} onClose={() => setOpen(false)}/>
      )}
    </>
  );
}
