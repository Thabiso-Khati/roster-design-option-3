"use client";
import { useEffect, useMemo, useState } from "react";
import type { PublicSigningRequestView } from "@/lib/sign/types";
import { sanitizeContractHtml } from "@/lib/sign/sanitize";

/**
 * Print-optimized signed contract — /sign/[token]/print
 *
 * Renders a clean, legal-document-style version of the signed contract:
 *   • Cover page with parties + effective date
 *   • Contract body in serif font, single column, 1in margins
 *   • Execution block with the captured signature image, typed name, audit trail
 *   • Footer on every page with permanent reference + ROSTER attribution
 *
 * Auto-triggers window.print() after the page renders so the browser's
 * Save-as-PDF dialog opens. Once saved, the resulting PDF looks like an
 * actual signed agreement, not a printout of a web app.
 */
export default function SignPrintPage({ params }: { params: Promise<{ token: string }> }) {
  const [data, setData] = useState<PublicSigningRequestView | null>(null);
  const [token, setToken] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    params.then((p) => setToken(p.token));
  }, [params]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/sign/${token}`);
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(json.error || "Could not load contract");
          return;
        }
        setData(json);
        // Trigger print after layout settles
        setTimeout(() => {
          if (!cancelled) window.print();
        }, 600);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Network error");
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  // Sanitize the contract HTML for print: strip form chrome, neutralise
  // theme colors, drop UI helper text. Memoised so we don't reprocess on
  // every render.
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
        Loading contract for printing…
      </div>
    );
  }

  const isSigned = data.status === "signed";
  const refTag = token.slice(0, 12) + "…" + token.slice(-8);

  return (
    <>
      {/* Inline print stylesheet — only this page */}
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
          .print-toolbar {
            position: fixed;
            top: 1rem;
            right: 1rem;
            background: #0F172A;
            color: white;
            padding: 0.75rem 1rem;
            border-radius: 0.5rem;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            font-size: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 1000;
          }
          .print-toolbar button {
            background: #C9A84C;
            color: #0F172A;
            border: none;
            padding: 0.4rem 0.8rem;
            border-radius: 0.25rem;
            font-weight: bold;
            cursor: pointer;
            margin-left: 0.75rem;
          }
        }

        @media print {
          html, body {
            background: white !important;
            color: #0F172A !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .print-toolbar {
            display: none !important;
          }
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

        /* Cover */
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
        .cover-page .effective {
          margin-top: 2cm;
          font-size: 10pt;
          color: #555;
        }
        .cover-page .effective strong {
          color: #0F172A;
        }

        /* Contract body */
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
        .contract-body strong {
          color: #0F172A;
        }
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
        /* Strip dark-mode classes inherited from the original contract HTML */
        .contract-body [class*="glass-card"],
        .contract-body [class*="rounded-"] {
          background: transparent !important;
          border: none !important;
          padding: 0 !important;
          box-shadow: none !important;
        }
        .contract-body [class*="text-text-muted"] {
          color: #555 !important;
        }
        .contract-body [class*="text-text-primary"] {
          color: #0F172A !important;
        }
        /* Hide UI-only elements (collapse buttons, helper text inputs) when printing */
        .contract-body button {
          display: none !important;
        }
        .contract-body input[type="date"],
        .contract-body input[type="number"],
        .contract-body input[type="text"],
        .contract-body select,
        .contract-body textarea {
          border: none !important;
          background: transparent !important;
          padding: 0 !important;
          font-family: Georgia, "Times New Roman", serif !important;
          font-size: 11pt !important;
          color: #0F172A !important;
        }
        /* Print-friendly layout for the negotiable-terms summary */
        .contract-body [data-contract-fields-summary] {
          background: #f8fafc !important;
          border: 1px solid #cbd5e1 !important;
          padding: 0.6cm !important;
          margin: 0.4cm 0 1cm 0 !important;
          page-break-inside: avoid;
        }
        /* Hide the editable inputs row in the fields bar — only the summary should print */
        .contract-body [data-contract-fields-bar] .print\\:hidden,
        .contract-body [class~="print:hidden"] {
          display: none !important;
        }
        .contract-body [data-contract-fields-bar] {
          padding: 0 !important;
          border: none !important;
        }

        /* ── Nuke native input chrome ──────────────────────────────────── */
        .contract-body input::-webkit-outer-spin-button,
        .contract-body input::-webkit-inner-spin-button {
          -webkit-appearance: none !important;
          appearance: none !important;
          margin: 0 !important;
          display: none !important;
        }
        .contract-body input[type="date"]::-webkit-calendar-picker-indicator,
        .contract-body input[type="date"]::-webkit-clear-button,
        .contract-body input[type="time"]::-webkit-calendar-picker-indicator,
        .contract-body input[type="number"]::-webkit-calendar-picker-indicator {
          display: none !important;
          opacity: 0 !important;
          pointer-events: none !important;
          -webkit-appearance: none !important;
          appearance: none !important;
        }
        .contract-body input[type="number"] {
          -moz-appearance: textfield !important;
        }
        .contract-body select,
        .contract-body select::-ms-expand {
          -webkit-appearance: none !important;
          appearance: none !important;
          background-image: none !important;
        }

        /* ── Static value spans (rendered by sanitizer) ────────────────── */
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

        /* ── Aggressive theme-color neutralisation (catches any remaining gold/pink/etc. via class names) ── */
        .contract-body [style*="color:"] {
          /* Inline color rules already neutralised by sanitizer; this is a safety net */
        }
        .contract-body .text-brand,
        .contract-body [class*="text-amber"],
        .contract-body [class*="text-emerald"],
        .contract-body [class*="text-pink"],
        .contract-body [class*="text-purple"],
        .contract-body [class*="text-cyan"],
        .contract-body [class*="text-rose"],
        .contract-body [class*="text-fuchsia"] {
          color: #475569 !important;
        }

        /* ── Force-show all collapsed elements so accordions don't hide clauses ── */
        .contract-body [hidden],
        .contract-body details:not([open]) > *:not(summary) {
          display: block !important;
        }
        .contract-body details summary {
          font-weight: bold !important;
          margin-bottom: 0.3cm !important;
          list-style: none !important;
        }
        .contract-body details summary::-webkit-details-marker {
          display: none !important;
        }

        /* Execution / signature block */
        .execution-block {
          page-break-before: always;
          padding-top: 1cm;
        }
        .execution-block h2 {
          font-size: 14pt;
          font-weight: bold;
          margin-bottom: 0.5cm;
          padding-bottom: 0.2cm;
          border-bottom: 1px solid #0F172A;
        }
        .execution-block .preamble {
          margin-bottom: 1cm;
          font-style: italic;
        }
        .signatory-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5cm;
          margin-bottom: 1.5cm;
        }
        .sig-block {
          border: 1px solid #cbd5e1;
          padding: 0.7cm;
          page-break-inside: avoid;
        }
        .sig-block .role {
          font-size: 9pt;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #666;
          margin-bottom: 0.2cm;
        }
        .sig-block .name {
          font-size: 12pt;
          font-weight: bold;
          margin-bottom: 0.1cm;
        }
        .sig-block .email {
          font-size: 9pt;
          color: #666;
          margin-bottom: 0.6cm;
        }
        .sig-block .sig-canvas-area {
          height: 2.5cm;
          border-bottom: 1.5px solid #0F172A;
          display: flex;
          align-items: flex-end;
          justify-content: flex-start;
          margin-bottom: 0.2cm;
        }
        .sig-block .sig-canvas-area img {
          max-height: 2.3cm;
          max-width: 100%;
          object-fit: contain;
          object-position: left bottom;
        }
        .sig-block .sig-meta {
          font-size: 9pt;
          color: #555;
          line-height: 1.4;
        }
        .sig-block .sig-meta strong {
          color: #0F172A;
        }
        .audit-trail {
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          padding: 0.6cm;
          font-size: 9pt;
          line-height: 1.5;
          margin-top: 1cm;
          page-break-inside: avoid;
        }
        .audit-trail h3 {
          font-size: 9pt;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          margin: 0 0 0.3cm 0;
          color: #666;
        }
        .audit-trail dl {
          display: grid;
          grid-template-columns: 5cm 1fr;
          gap: 0.15cm 0.5cm;
          margin: 0;
        }
        .audit-trail dt {
          color: #666;
        }
        .audit-trail dd {
          margin: 0;
          color: #0F172A;
          font-weight: bold;
        }
        .legal-validity {
          margin-top: 1cm;
          padding-top: 0.5cm;
          border-top: 1px solid #cbd5e1;
          font-size: 9pt;
          color: #555;
          line-height: 1.5;
        }
      `}</style>

      <div className="print-toolbar">
        Click <button onClick={() => window.print()}>Save as PDF</button> to save this contract.
      </div>

      <div className="legal-page">
        {/* ── Cover ──────────────────────────────────────────────────────── */}
        <div className="cover-page">
          <p className="meta-tag">{data.contractType}</p>
          <h1>{data.contractTitle.toUpperCase()}</h1>
          <p className="between">— Made and entered into between —</p>
          <p className="party">
            {data.requesterName}
            <br />
            <em>(&quot;Sender&quot;)</em>
          </p>
          <p className="between">— and —</p>
          <p className="party">
            {data.recipientName}
            <br />
            <em>(&quot;Signatory&quot;)</em>
          </p>
          {isSigned && data.signedAt && (
            <p className="effective">
              Executed on <strong>{fmtDate(data.signedAt)}</strong>
              <br />
              via ROSTER E-Signature
            </p>
          )}
        </div>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <div className="contract-body">
          <h2>Terms of Agreement</h2>
          <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
        </div>

        {/* ── Execution Block ────────────────────────────────────────────── */}
        {isSigned && (
          <div className="execution-block">
            <h2>Execution</h2>
            <p className="preamble">
              By executing this agreement below, the Signatory confirms they have read the foregoing terms in
              full, understand them, and agree to be bound by them. This electronic signature is legally
              binding under SA&apos;s ECTA Section 13 and Nigeria&apos;s Electronic Transactions Act for
              ordinary contracts.
            </p>

            <div className="signatory-grid">
              {/* Signatory (the recipient who signed) */}
              <div className="sig-block">
                <p className="role">Signatory</p>
                <p className="name">{data.recipientName}</p>
                <p className="email">{data.signatureTypedName ? "Typed full name: " + data.signatureTypedName : ""}</p>
                <div className="sig-canvas-area">
                  {data.signatureImageData ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={data.signatureImageData} alt="Signature" />
                  ) : null}
                </div>
                <div className="sig-meta">
                  <strong>Signed:</strong> {data.signedAt ? fmtDateTime(data.signedAt) : "—"}
                </div>
              </div>

              {/* Sender (the requester — pre-acknowledged by sending) */}
              <div className="sig-block">
                <p className="role">Sender</p>
                <p className="name">{data.requesterName}</p>
                <p className="email">{data.requesterEmail}</p>
                <div className="sig-canvas-area">{/* electronically issued */}</div>
                <div className="sig-meta">
                  <strong>Issued:</strong> {data.sentAt ? fmtDateTime(data.sentAt) : "—"}
                  <br />
                  Sender authorised this contract by sending it for signature.
                </div>
              </div>
            </div>

            <div className="audit-trail">
              <h3>Audit Trail</h3>
              <dl>
                <dt>Sender</dt>
                <dd>{data.requesterName} &lt;{data.requesterEmail}&gt;</dd>
                <dt>Signatory</dt>
                <dd>{data.recipientName}</dd>
                {data.signatureTypedName ? (
                  <>
                    <dt>Typed legal name</dt>
                    <dd>{data.signatureTypedName}</dd>
                  </>
                ) : null}
                <dt>Sent</dt>
                <dd>{data.sentAt ? fmtDateTime(data.sentAt) : "—"}</dd>
                <dt>Signed</dt>
                <dd>{data.signedAt ? fmtDateTime(data.signedAt) : "—"}</dd>
                <dt>Permanent reference</dt>
                <dd style={{ fontFamily: "Menlo, monospace", fontSize: "8.5pt" }}>{refTag}</dd>
              </dl>
            </div>

            <p className="legal-validity">
              <strong>Legal validity.</strong> This electronic signature constitutes a &quot;simple
              electronic signature&quot; under the Electronic Communications and Transactions Act, 2002
              (South Africa) and the Electronic Transactions Act, 2011 (Nigeria), and is admissible as
              evidence of the Signatory&apos;s intention to be bound by the terms herein. Property
              transfers, wills, and antenuptial contracts require advanced electronic signatures and
              cannot be executed via this flow.
            </p>
          </div>
        )}
      </div>
    </>
  );
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
