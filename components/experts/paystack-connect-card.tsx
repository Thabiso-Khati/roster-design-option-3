// ============================================================
// ROSTER — Paystack connect card (expert dashboard)
// ------------------------------------------------------------
// Two-step flow:
//
//   1. Pick bank + type account number  → POST /resolve-account
//      → Paystack returns the verified account holder name, we
//        show it so the expert can eyeball before committing.
//
//   2. Confirm                          → POST /subaccount
//      → creates the subaccount, stores metadata, refreshes
//        parent state via the onConnected() callback.
//
// When already connected, renders a compact summary card with a
// Disconnect button that DELETEs /subaccount (which also flips
// is_active=false so the expert is hidden from the directory
// while they sort out a new bank).
// ============================================================

"use client";

import { useEffect, useState } from "react";
import {
  CreditCard,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Banknote,
  Unlink,
  ShieldCheck,
} from "lucide-react";

interface PaystackConnection {
  bankName: string | null;
  accountLast4: string | null;
  accountName: string | null;
  subaccountCode: string | null;
  connectedAt: string | null;
}

interface Props {
  connection: PaystackConnection;
  onConnected: (c: PaystackConnection) => void;
  onDisconnected: () => void;
}

interface BankOption {
  code: string;
  name: string;
  slug: string;
}

export function PaystackConnectCard({ connection, onConnected, onDisconnected }: Props) {
  const isConnected = !!connection.subaccountCode;

  const [banks, setBanks] = useState<BankOption[]>([]);
  const [banksLoading, setBanksLoading] = useState(false);
  const [banksError, setBanksError] = useState<string | null>(null);

  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  const [resolving, setResolving] = useState(false);
  const [resolvedName, setResolvedName] = useState<string | null>(null);
  const [resolveError, setResolveError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [disconnecting, setDisconnecting] = useState(false);
  const [confirmingDisconnect, setConfirmingDisconnect] = useState(false);

  // Load bank list once, lazily when the card enters the "not connected"
  // branch. No point fetching if they're already connected.
  useEffect(() => {
    if (isConnected || banks.length > 0) return;
    (async () => {
      setBanksLoading(true);
      setBanksError(null);
      try {
        const res = await fetch("/api/experts/paystack/banks");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Could not load banks.");
        setBanks(json.banks);
      } catch (e) {
        setBanksError(e instanceof Error ? e.message : "Could not load banks.");
      } finally {
        setBanksLoading(false);
      }
    })();
  }, [isConnected, banks.length]);

  // Clear resolved name whenever the inputs change — otherwise a stale
  // verification could leak through to the connect call.
  useEffect(() => {
    setResolvedName(null);
    setResolveError(null);
  }, [bankCode, accountNumber]);

  async function handleResolve() {
    setResolving(true);
    setResolveError(null);
    setResolvedName(null);
    try {
      const res = await fetch("/api/experts/paystack/resolve-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bank_code: bankCode, account_number: accountNumber }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not verify that account.");
      setResolvedName(json.accountName);
    } catch (e) {
      setResolveError(e instanceof Error ? e.message : "Verification failed.");
    } finally {
      setResolving(false);
    }
  }

  async function handleConnect() {
    if (!resolvedName) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/experts/paystack/subaccount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bank_code: bankCode, account_number: accountNumber }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not connect.");

      onConnected({
        bankName: json.bankName,
        accountLast4: json.accountLast4,
        accountName: json.accountName,
        subaccountCode: json.subaccountCode,
        connectedAt: new Date().toISOString(),
      });

      // Reset inputs
      setBankCode("");
      setAccountNumber("");
      setResolvedName(null);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Could not connect.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      const res = await fetch("/api/experts/paystack/subaccount", { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Could not disconnect.");
      }
      onDisconnected();
      setConfirmingDisconnect(false);
    } catch {
      // Swallow — button stops spinning; user can retry.
    } finally {
      setDisconnecting(false);
    }
  }

  // ── Render: connected ─────────────────────────────────────
  if (isConnected) {
    return (
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-success/10 border border-success/20 flex items-center justify-center flex-shrink-0">
              <ShieldCheck size={18} className="text-success" />
            </div>
            <div>
              <p className="text-sm font-bold text-text-primary flex items-center gap-2">
                Payouts connected
                <span className="text-xs font-bold text-success bg-success/10 px-2 py-0.5 rounded-full">
                  Active
                </span>
              </p>
              <p className="text-xs text-text-muted mt-0.5">
                {connection.bankName} · ••••{connection.accountLast4}
                {connection.accountName && (
                  <span className="text-text-primary"> · {connection.accountName}</span>
                )}
              </p>
            </div>
          </div>

          {!confirmingDisconnect ? (
            <button
              type="button"
              onClick={() => setConfirmingDisconnect(true)}
              className="flex items-center gap-1.5 text-xs text-text-muted hover:text-error transition-colors"
            >
              <Unlink size={12} />
              Disconnect
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmingDisconnect(false)}
                disabled={disconnecting}
                className="text-xs text-text-muted hover:text-text-primary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="flex items-center gap-1.5 bg-error/10 border border-error/20 text-error text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-error/20 transition-colors"
              >
                {disconnecting ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : (
                  <Unlink size={11} />
                )}
                {disconnecting ? "Disconnecting…" : "Confirm disconnect"}
              </button>
            </div>
          )}
        </div>

        {confirmingDisconnect && (
          <p className="text-xs text-text-muted mt-3 bg-surface-2 border border-border rounded-lg p-3">
            Disconnecting will take you off the directory (flip you to hidden) and
            stop new bookings until you reconnect a bank.
          </p>
        )}
      </div>
    );
  }

  // ── Render: not connected ────────────────────────────────
  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center flex-shrink-0">
          <Banknote size={18} className="text-brand" />
        </div>
        <div>
          <p className="text-sm font-bold text-text-primary">Connect payouts</p>
          <p className="text-xs text-text-muted mt-0.5">
            We split each booking automatically. You get 80%, ROSTER keeps 20%.
          </p>
        </div>
      </div>

      {banksError && (
        <div className="bg-error/5 border border-error/20 rounded-lg px-3 py-2 text-xs text-error flex items-start gap-2 mb-4">
          <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
          <span>{banksError}</span>
        </div>
      )}

      <div className="space-y-3">
        <label className="block">
          <span className="text-xs font-semibold text-text-muted">Bank</span>
          <select
            value={bankCode}
            onChange={(e) => setBankCode(e.target.value)}
            disabled={banksLoading || submitting}
            className="mt-1 w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand disabled:opacity-50"
          >
            <option value="">{banksLoading ? "Loading banks…" : "Choose your bank"}</option>
            {banks.map((b) => (
              <option key={b.code} value={b.code}>
                {b.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-text-muted">Account number</span>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={accountNumber}
            onChange={(e) =>
              setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 20))
            }
            placeholder="0123456789"
            disabled={submitting}
            className="mt-1 w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand disabled:opacity-50"
          />
        </label>

        {resolveError && (
          <div className="bg-error/5 border border-error/20 rounded-lg px-3 py-2 text-xs text-error flex items-start gap-2">
            <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
            <span>{resolveError}</span>
          </div>
        )}

        {resolvedName ? (
          <div className="bg-success/5 border border-success/20 rounded-lg p-3 flex items-start gap-2.5">
            <CheckCircle2 size={15} className="text-success flex-shrink-0 mt-0.5" />
            <div className="text-xs flex-1">
              <p className="text-text-primary font-semibold">{resolvedName}</p>
              <p className="text-text-muted mt-0.5">
                Is this you? If yes, confirm below to finish connecting.
              </p>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleResolve}
            disabled={!bankCode || accountNumber.length < 6 || resolving}
            className="w-full bg-surface-2 hover:bg-surface border border-border disabled:opacity-50 transition-colors text-text-primary font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm"
          >
            {resolving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <CreditCard size={14} />
            )}
            {resolving ? "Verifying…" : "Verify account"}
          </button>
        )}

        {submitError && (
          <div className="bg-error/5 border border-error/20 rounded-lg px-3 py-2 text-xs text-error flex items-start gap-2">
            <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
            <span>{submitError}</span>
          </div>
        )}

        {resolvedName && (
          <button
            type="button"
            onClick={handleConnect}
            disabled={submitting}
            className="w-full bg-brand hover:bg-brand-light disabled:opacity-50 transition-colors text-background font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm"
          >
            {submitting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <ShieldCheck size={14} />
            )}
            {submitting ? "Connecting…" : "Confirm & connect"}
          </button>
        )}
      </div>
    </div>
  );
}
