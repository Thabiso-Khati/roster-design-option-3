"use client";
import { useState } from "react";
import { PenLine, X, Check, Loader2, Copy, ExternalLink, Send } from "lucide-react";
import { useTranslation } from "@/lib/i18n/hooks";

export function SendForSignatureButton({
  contractType,
  contractTitle,
  getContractHtml,
  defaultRecipientName = "",
  defaultRecipientEmail = "",
  contractMetadata,
  buttonLabel,
  buttonStyle = "primary",
  color = "#C9A84C",
}: {
  contractType: string;
  contractTitle: string;
  getContractHtml: () => string;
  defaultRecipientName?: string;
  defaultRecipientEmail?: string;
  contractMetadata?: Record<string, unknown>;
  buttonLabel?: string;
  buttonStyle?: "primary" | "ghost";
  color?: string;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [recipientName, setRecipientName] = useState(defaultRecipientName);
  const [recipientEmail, setRecipientEmail] = useState(defaultRecipientEmail);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ id: string; signerUrl: string; expiresAt: string } | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const resolvedLabel = buttonLabel ?? t("signing.sendForSig");

  async function handleSubmit() {
    setError("");
    if (!recipientName.trim()) { setError(t("signing.errNameRequired")); return; }
    if (!recipientEmail.trim()) { setError(t("signing.errEmailRequired")); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail.trim())) {
      setError(t("signing.errEmailInvalid"));
      return;
    }

    setSubmitting(true);
    try {
      const contractHtml = getContractHtml();
      if (!contractHtml || contractHtml.length < 100) {
        setError(t("signing.errContractEmpty"));
        setSubmitting(false);
        return;
      }

      const res = await fetch("/api/sign/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail: recipientEmail.trim(),
          recipientName: recipientName.trim(),
          contractType,
          contractTitle,
          contractHtml,
          contractMetadata: contractMetadata ?? {},
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("signing.errSendFailed"));
        setSubmitting(false);
        return;
      }
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("signing.errNetwork"));
    } finally {
      setSubmitting(false);
    }
  }

  function copyLink() {
    if (!result) return;
    navigator.clipboard.writeText(result.signerUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  function reset() {
    setOpen(false);
    setSubmitting(false);
    setResult(null);
    setError("");
    setCopied(false);
    setRecipientName(defaultRecipientName);
    setRecipientEmail(defaultRecipientEmail);
  }

  const btnStyle: React.CSSProperties =
    buttonStyle === "primary"
      ? { backgroundColor: color, color: "#080B14" }
      : { color };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={
          buttonStyle === "primary"
            ? "text-sm font-semibold inline-flex items-center gap-1.5 px-4 py-2 rounded-lg"
            : "text-sm font-semibold inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border hover:bg-surface-2"
        }
        style={btnStyle}
      >
        <PenLine size={14} /> {resolvedLabel}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={reset}>
          <div className="glass-card rounded-2xl p-6 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <p className="font-bold text-text-primary text-base">{t("signing.sendForSig")}</p>
              <button onClick={reset} className="text-text-muted hover:text-text-primary" aria-label={t("action.close")}>
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-text-muted leading-relaxed mb-5">
              <span className="font-semibold text-text-primary">{contractTitle}</span><br />
              {t("signing.modalDesc")}
            </p>

            {!result ? (
              <>
                <div className="space-y-3 mb-5">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest mb-1 block text-text-muted">
                      {t("signing.recipientName")}
                    </label>
                    <input
                      type="text"
                      className="bg-transparent border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary w-full focus:outline-none focus:border-brand"
                      placeholder={t("signing.recipientNamePh")}
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest mb-1 block text-text-muted">
                      {t("signing.recipientEmail")}
                    </label>
                    <input
                      type="email"
                      className="bg-transparent border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary w-full focus:outline-none focus:border-brand"
                      placeholder="signer@example.com"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                    />
                  </div>
                </div>

                {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

                <div className="flex items-center gap-2 justify-end">
                  <button onClick={reset} className="text-sm font-semibold px-4 py-2 rounded-lg border border-border text-text-primary hover:bg-surface-2">
                    {t("action.cancel")}
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="text-sm font-semibold inline-flex items-center gap-1.5 px-4 py-2 rounded-lg disabled:opacity-50"
                    style={{ backgroundColor: color, color: "#080B14" }}
                  >
                    {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    {submitting ? t("status.submitting") : t("signing.sendRequest")}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-lg p-4 mb-4 flex items-start gap-3" style={{ backgroundColor: "rgba(16,185,129,0.10)", borderColor: "rgba(16,185,129,0.30)", borderWidth: 1 }}>
                  <Check size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-text-primary mb-1">{t("signing.requestSent")}</p>
                    <p className="text-xs text-text-muted">
                      {t("signing.emailSentDesc", {
                        email: recipientEmail,
                        date: new Date(result.expiresAt).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" }),
                      })}
                    </p>
                  </div>
                </div>

                <p className="text-[10px] font-black uppercase tracking-widest mb-2 text-text-muted">{t("signing.linkLabel")}</p>
                <div className="flex items-center gap-2 mb-5">
                  <input
                    readOnly
                    value={result.signerUrl}
                    className="bg-transparent border border-border rounded-lg px-3 py-2 text-xs text-text-primary w-full font-mono"
                    onFocus={(e) => e.currentTarget.select()}
                  />
                  <button onClick={copyLink} className="text-xs font-semibold inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-border text-text-primary hover:bg-surface-2 flex-shrink-0">
                    {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    {copied ? t("signing.copied") : t("action.copy")}
                  </button>
                  <a href={result.signerUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-border text-text-primary hover:bg-surface-2 flex-shrink-0">
                    <ExternalLink size={12} /> {t("widget.open")}
                  </a>
                </div>

                <div className="flex items-center gap-2 justify-end">
                  <button onClick={reset} className="text-sm font-semibold px-4 py-2 rounded-lg" style={{ backgroundColor: color, color: "#080B14" }}>
                    {t("action.confirm")}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
