"use client";
import { ReactNode } from "react";
import { Eye } from "lucide-react";
import { ContractFieldsBar, readContractFieldsFromDom } from "@/components/library/contract-fields-bar";
import { SendForSignatureButton } from "@/components/sign/send-for-signature";
import { getContractById } from "@/lib/contracts/registry";
import { useTranslation } from "@/lib/i18n/hooks";

/**
 * Drop-in components that wire any contract page to the registry, the
 * dynamic-fields bar, and the Send-for-signature button.
 *
 * Usage with ResourcePage:
 *
 *   <ResourcePage
 *     toolbar={<ContractSendButton contractId="producer-agreement" />}
 *     ...
 *   >
 *     <ContractScaffold contractId="producer-agreement">
 *       …existing children (clauses, schedule, etc.)…
 *     </ContractScaffold>
 *   </ResourcePage>
 *
 * The `contractId` matches an entry in lib/contracts/registry.ts.
 */

/** Fields-bar only (used internally by ContractScaffold or directly). */
export function ContractTopBar({ contractId }: { contractId: string }) {
  const entry = getContractById(contractId);
  if (!entry) return null;
  return (
    <ContractFieldsBar
      contractId={entry.id}
      fields={entry.fields}
      color={entry.parentColor}
    />
  );
}

/** Send-for-signature button bound to the registry entry. */
export function ContractSendButton({ contractId, buttonLabel }: { contractId: string; buttonLabel?: string }) {
  const { t } = useTranslation();
  const entry = getContractById(contractId);
  if (!entry) return null;
  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <ContractPreviewButton contractId={contractId} />
      <SendForSignatureButton
        contractType={entry.contractType}
        contractTitle={entry.title}
        getContractHtml={() => {
          const el = document.getElementById("contract-printable");
          return el ? el.innerHTML : "";
        }}
        contractMetadata={{
          contractId: entry.id,
          category: entry.category,
          parentModule: entry.parentModule,
          fields: readContractFieldsFromDom(entry.id),
        }}
        color={entry.parentColor}
        buttonLabel={buttonLabel ?? t("signing.sendForSig")}
      />
    </div>
  );
}

/**
 * Preview-PDF button — captures the live contract HTML + dynamic field values,
 * stuffs them into sessionStorage, and opens the legal-document preview view
 * in a new tab. Lets the requester verify the PDF will look right BEFORE
 * sending it for signature.
 */
export function ContractPreviewButton({ contractId }: { contractId: string }) {
  const { t } = useTranslation();
  const entry = getContractById(contractId);
  if (!entry) return null;

  const onClick = () => {
    const el = document.getElementById("contract-printable");
    const contractHtml = el ? el.innerHTML : "";
    const payload = {
      contractTitle: entry.title,
      contractType: entry.contractType,
      contractHtml,
      requesterName: "[Your name will appear here]",
      recipientName: "[Recipient name will appear here]",
    };
    try {
      sessionStorage.setItem("roster_contract_preview", JSON.stringify(payload));
    } catch {
      alert(t("error.generic"));
      return;
    }
    window.open("/sign/preview", "_blank");
  };

  return (
    <button
      onClick={onClick}
      className="text-sm font-semibold inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border hover:bg-surface-2"
      style={{ color: entry.parentColor }}
      title={t("action.preview")}
    >
      <Eye size={14} /> {t("action.preview")}
    </button>
  );
}

/** Wraps a contract's body — adds the fields bar + the printable container. */
export function ContractScaffold({
  contractId,
  children,
}: {
  contractId: string;
  children: ReactNode;
}) {
  return (
    <div id="contract-printable">
      <ContractTopBar contractId={contractId} />
      {children}
    </div>
  );
}
