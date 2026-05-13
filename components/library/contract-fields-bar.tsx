"use client";
import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Sliders } from "lucide-react";
import type { ContractDynamicField } from "@/lib/contracts/registry";
import { useTranslation } from "@/lib/i18n/hooks";

const STORAGE_PREFIX = "roster_contract_fields:";

/**
 * Dynamic editable fields for a contract page.
 * Renders inline as a "Negotiable Terms" panel that becomes part of the
 * contract HTML when sent for signature.
 *
 * Usage on a contract page:
 *
 *   <ContractFieldsBar
 *     contractId="management-agreement"
 *     fields={contract.fields}
 *     color={MODULE_COLOR}
 *   />
 *
 * Then wrap contract content (incl. this component) in:
 *   <div id="contract-printable">…clauses…</div>
 *
 * The values are saved to localStorage keyed by contractId, so they persist
 * across reloads. They also flow into the rendered HTML (visible to the
 * recipient on the signing page) and into contractMetadata when sent.
 */
export function ContractFieldsBar({
  contractId,
  fields,
  color = "#C9A84C",
  defaultOpen = true,
}: {
  contractId: string;
  fields: ContractDynamicField[];
  color?: string;
  defaultOpen?: boolean;
}) {
  const { t } = useTranslation();
  const [values, setValues] = useState<Record<string, string | number>>({});
  const [open, setOpen] = useState(defaultOpen);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + contractId);
      const stored = raw ? (JSON.parse(raw) as Record<string, string | number>) : {};
      const initial: Record<string, string | number> = {};
      for (const f of fields) {
        if (stored[f.id] !== undefined) initial[f.id] = stored[f.id];
        else if (f.defaultValue !== undefined) initial[f.id] = f.defaultValue;
        else initial[f.id] = "";
      }
      setValues(initial);
    } catch {
      const initial: Record<string, string | number> = {};
      for (const f of fields) {
        initial[f.id] = f.defaultValue ?? "";
      }
      setValues(initial);
    }
    setHydrated(true);
  }, [contractId, fields]);

  // Persist on change
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_PREFIX + contractId, JSON.stringify(values));
    } catch { /* ignore quota errors */ }
  }, [values, contractId, hydrated]);

  // Expose values on a known DOM element so capture-time helpers can grab them.
  // We embed them as a JSON script tag inside the printable region.
  // This ALSO ensures they're visible in the contract HTML when sent.

  function shouldShow(field: ContractDynamicField): boolean {
    if (!field.showWhen) return true;
    const v = values[field.showWhen.fieldId];
    return v === field.showWhen.equals;
  }

  function inputFor(field: ContractDynamicField) {
    const v = values[field.id] ?? "";
    const onChange = (val: string | number) =>
      setValues((prev) => ({ ...prev, [field.id]: val }));

    const baseClass = "bg-transparent border border-border rounded-lg px-3 py-2 text-sm text-text-primary w-full focus:outline-none focus:border-brand";

    switch (field.type) {
      case "date":
        return (
          <input
            type="date"
            value={v.toString()}
            onChange={(e) => onChange(e.target.value)}
            className={baseClass}
          />
        );
      case "number":
      case "percentage":
        return (
          <input
            type="number"
            value={v.toString()}
            onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder={field.placeholder}
            className={baseClass}
          />
        );
      case "currency":
        return (
          <input
            type="text"
            inputMode="numeric"
            value={v.toString()}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            className={baseClass}
          />
        );
      case "text":
      default:
        return (
          <input
            type="text"
            value={v.toString()}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            className={baseClass}
          />
        );
    }
  }

  function displayValue(field: ContractDynamicField): string {
    const v = values[field.id];
    if (v === undefined || v === null || v === "") return "—";
    if (field.type === "percentage") return `${v}%`;
    if (field.type === "date") {
      try {
        return new Date(v as string).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
      } catch { return String(v); }
    }
    return String(v);
  }

  return (
    <div
      className="glass-card rounded-2xl mb-6"
      style={{ borderColor: `${color}40` }}
      data-contract-fields-bar
      data-contract-id={contractId}
    >
      {/* Header (collapse toggle) */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-surface-2 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}15` }}>
            <Sliders size={14} style={{ color }} />
          </div>
          <div>
            <p className="font-bold text-sm text-text-primary">{t("library.negotiableTerms")}</p>
            <p className="text-xs text-text-muted">{t("library.negotiableTermsDesc")}</p>
          </div>
        </div>
        {open ? (
          <ChevronUp size={16} className="text-text-muted flex-shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-text-muted flex-shrink-0" />
        )}
      </button>

      {open && (
        <div className="px-5 pb-5 pt-1 border-t border-border space-y-4">
          {/* Editable inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 print:hidden">
            {fields.filter(shouldShow).map((field) => (
              <div key={field.id}>
                <label className="text-[10px] font-semibold uppercase tracking-wider mb-1 block text-text-muted">
                  {field.label}
                </label>
                {inputFor(field)}
                {field.helperText && (
                  <p className="text-[10px] text-text-muted mt-1 leading-relaxed">{field.helperText}</p>
                )}
              </div>
            ))}
          </div>

          {/* Read-only summary embedded in contract HTML — visible to signer */}
          <div className="rounded-lg border border-border p-4" data-contract-fields-summary>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color }}>
              {t("library.agreedTerms")}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {fields.filter(shouldShow).map((field) => (
                <div key={field.id} className="flex items-baseline gap-2 border-b border-border/30 pb-1.5">
                  <span className="text-text-muted text-xs flex-shrink-0">{field.label}:</span>
                  <span className="font-semibold text-text-primary tabular-nums">{displayValue(field)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Helper to read the values from the DOM at capture time. Used by the
 * SendForSignatureButton's getContractHtml callback to also include the
 * structured field values in contractMetadata.
 */
export function readContractFieldsFromDom(contractId: string): Record<string, unknown> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + contractId);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
