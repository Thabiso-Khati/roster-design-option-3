"use client";
import { useEffect, useMemo, useState } from "react";
import { sanitizeContractHtml } from "@/lib/sign/sanitize";

/**
 * /sign/preview — preview the print PDF before sending for signature.
 *
 * Reads contract HTML, title, type, etc. from sessionStorage (stuffed there
 * by the ContractPreviewButton on the source contract page). Renders using
 * the same legal-document template as the post-sign print view, but without
 * the signature execution block (since this is a pre-send preview).
 *
 * sessionStorage key: roster_contract_preview
 * Shape: { contractTitle, contractType, contractHtml, requesterName, recipientName }
 */

interface PreviewPayload {
  contractTitle: string;
  contractType: string;
  contractHtml: string;
  requesterName: string;
  recipientName: string;
}

export default function ContractPreviewPage() {
  const [data, setData] = useState<PreviewPayload | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("roster_contract_preview");
      if (!raw) {
        setError(
          "No preview data found. Click 'Preview PDF' on the contract page to load this view.",
        );
        return;
      }
      const parsed = JSON.parse(raw) as PreviewPayload;
      setData(parsed);
      setTimeout(() => window.print(), 600);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load preview");
    }
  }, []);

  const sanitizedHtml = useMemo(
    () => (data ? sanitizeContractHtml(data.contractHtml) : ""),
    [data],
  );

  if (error) {
    return (
      <div style={{ padding: "4rem", fontFamily: "Georgia, serif" }}>
        <p>{error}</p>
      </div>
    );
  }
  if (!data) {
    return (
      <div style={{ padding: "4rem", fontFamily: "Georgia, serif" }}>
        Loading preview…
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @page {
          size: A4;
          margin: 2cm 2cm 2.5cm 2cm;
          @bottom-center {
            content: "Page " counter(page) " of " counter(pages);
            font-family: Georgia, "Times New Roman", serif;
            font-size: 9pt;
            color: #666;
          }
        }
        @media screen {
          body {
            background: #e5e7eb;
          }
          .legal-page {
            background: white;
            color: #0F172A;
            max-width: 21cm;
            margin: 2rem auto;
            padding: 2.5cm 2cm;
            box-shadow: 0 0 24px rgba(0, 0, 0, 0.1);
            font-family: Georgia, "Times New Roman", serif;
            font-size: 11pt;
            line-height: 1.65;
          }
          .preview-banner {
            position: fixed;
            top: 1rem;
            right: 1rem;
            background: #C9A84C;
            color: #0F172A;
            padding: 0.75rem 1rem;
            border-radius: 0.5rem;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            font-size: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 1000;
            max-width: 320px;
          }
          .preview-banner button {
            background: #0F172A;
            color: white;
            border: none;
            padding: 0.4rem 0.8rem;
            border-radius: 0.25rem;
            font-weight: bold;
            cursor: pointer;
            margin-left: 0.5rem;
          }
        }
        @media print {
          html, body {
            background: white !important;
            color: #0F172A !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .preview-banner { display: none !important; }
          .legal-page {
            margin: 0;
            padding: 0;
            box-shadow: none;
            max-width: none;
            font-family: Georgia, "Times New Roman", serif;
            font-size: 11pt;
            line-height: 1.65;
            color: #0F172A;
          }
        }
        .cover-page {
          page-break-after: always;
          text-align: center;
          padding: 6cm 0 4cm 0;
        }
        .cover-page .meta-tag {
          font-size: 9pt;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: #666;
          margin-bottom: 1.5cm;
        }
        .cover-page h1 {
          font-size: 22pt;
          font-weight: bold;
          margin: 0 0 2.5cm 0;
          line-height: 1.3;
          letter-spacing: 0.02em;
        }
        .cover-page .between {
          font-size: 11pt;
          margin: 0 0 0.5cm 0;
          font-style: italic;
          color: #555;
        }
        .cover-page .party {
          font-size: 13pt;
          font-weight: bold;
          margin: 0 0 1cm 0;
        }
        .cover-page .party em {
          font-weight: normal;
          font-style: italic;
          color: #555;
          font-size: 10pt;
        }
        .preview-watermark {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-30deg);
          font-size: 96pt;
          color: rgba(201, 168, 76, 0.10);
          font-weight: bold;
          pointer-events: none;
          z-index: -1;
          letter-spacing: 0.1em;
          font-family: Georgia, "Times New Roman", serif;
        }
        .contract-body {
          page-break-after: always;
        }
        .contract-body h2 {
          font-size: 14pt;
          font-weight: bold;
          margin: 1.2cm 0 0.5cm 0;
          padding-bottom: 0.2cm;
          border-bottom: 1px solid #0F172A;
          page-break-after: avoid;
        }
        .contract-body h3 {
          font-size: 12pt;
          font-weight: bold;
          margin: 0.8cm 0 0.3cm 0;
          page-break-after: avoid;
        }
        .contract-body p {
          margin: 0 0 0.4cm 0;
          text-align: justify;
        }
        .contract-body strong { color: #0F172A; }
        .contract-body table {
          width: 100%;
          border-collapse: collapse;
          margin: 0.4cm 0;
          font-size: 10pt;
        }
        .contract-body td, .contract-body th {
          border: 1px solid #cbd5e1;
          padding: 0.25cm 0.4cm;
          text-align: left;
          vertical-align: top;
        }
        .contract-body th {
          background: #f1f5f9;
          font-weight: bold;
        }
        .contract-body [class*="glass-card"],
        .contract-body [class*="rounded-"] {
          background: transparent !important;
          border: none !important;
          padding: 0 !important;
          box-shadow: none !important;
        }
        .contract-body [class*="text-text-muted"] { color: #555 !important; }
        .contract-body [class*="text-text-primary"] { color: #0F172A !important; }
        .contract-body button { display: none !important; }
        .contract-body input::-webkit-outer-spin-button,
        .contract-body input::-webkit-inner-spin-button {
          -webkit-appearance: none !important;
          appearance: none !important;
          margin: 0 !important;
          display: none !important;
        }
        .contract-body input[type="date"]::-webkit-calendar-picker-indicator,
        .contract-body input[type="date"]::-webkit-clear-button,
        .contract-body select::-ms-expand {
          display: none !important;
          opacity: 0 !important;
          -webkit-appearance: none !important;
          appearance: none !important;
        }
        .contract-body input[type="number"] { -moz-appearance: textfield !important; }
        .contract-body select {
          -webkit-appearance: none !important;
          appearance: none !important;
          background-image: none !important;
        }
        .contract-body .esign-static-value {
          font-family: Georgia, "Times New Roman", serif !important;
          color: #0F172A !important;
          font-weight: 600;
          padding: 0 2px;
        }
        .contract-body .esign-static-block {
          font-family: Georgia, "Times New Roman", serif !important;
          color: #0F172A !important;
          white-space: pre-wrap;
          padding: 0.3cm 0;
        }
        .contract-body [data-contract-fields-summary] {
          background: #f8fafc !important;
          border: 1px solid #cbd5e1 !important;
          padding: 0.6cm !important;
          margin: 0.4cm 0 1cm 0 !important;
          page-break-inside: avoid;
        }
        .contract-body [class~="print:hidden"] {
          display: none !important;
        }
      `}</style>

      <div className="preview-banner">
        ⚠️ <strong>PREVIEW</strong> — this is what your PDF will look like when signed. Not yet sent.
        <button onClick={() => window.print()}>Save preview PDF</button>
      </div>

      <div className="legal-page">
        <div className="preview-watermark">PREVIEW</div>

        {/* Cover */}
        <div className="cover-page">
          <p className="meta-tag">{data.contractType}</p>
          <h1>{data.contractTitle.toUpperCase()}</h1>
          <p className="between">— Made and entered into between —</p>
          <p className="party">
            {data.requesterName || "[Sender]"}
            <br />
            <em>(&quot;Sender&quot;)</em>
          </p>
          <p className="between">— and —</p>
          <p className="party">
            {data.recipientName || "[Signatory]"}
            <br />
            <em>(&quot;Signatory&quot;)</em>
          </p>
          <p style={{ marginTop: "2cm", fontSize: "10pt", color: "#555" }}>
            Preview — execution block will appear here once signed.
          </p>
        </div>

        {/* Body */}
        <div className="contract-body">
          <h2>Terms of Agreement</h2>
          <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
        </div>
      </div>
    </>
  );
}
