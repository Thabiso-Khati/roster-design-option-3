import { createHmac } from "crypto";
import { generateTxRef } from "./utils";
import { PRICING, TIERS, BOOKING_COMMISSION, type TierId } from "./constants";
import { logger } from "@/lib/logger";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;
const PAYSTACK_BASE_URL = "https://api.paystack.co";

function getHeaders() {
  return {
    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  };
}

// ── Per-tier Paystack recurring plan codes ──────────────────
// Set these env vars in Paystack dashboard for each tier+billing.
// Pro falls back to the legacy PAYSTACK_MONTHLY/ANNUAL_PLAN_CODE vars.
// If empty, the charge is a one-time transaction (no auto-recurring);
// the subscription row is still activated via callback/webhook.
const TIER_PLAN_CODES: Record<string, Record<string, string>> = {
  pro: {
    monthly: process.env.PAYSTACK_PRO_MONTHLY_PLAN_CODE    || process.env.PAYSTACK_MONTHLY_PLAN_CODE || "",
    annual:  process.env.PAYSTACK_PRO_ANNUAL_PLAN_CODE     || process.env.PAYSTACK_ANNUAL_PLAN_CODE  || "",
  },
  agency: {
    monthly: process.env.PAYSTACK_AGENCY_MONTHLY_PLAN_CODE  || "",
    annual:  process.env.PAYSTACK_AGENCY_ANNUAL_PLAN_CODE   || "",
  },
  enterprise: {
    monthly: process.env.PAYSTACK_ENTERPRISE_MONTHLY_PLAN_CODE     || "",
    annual:  process.env.PAYSTACK_ENTERPRISE_ANNUAL_PLAN_CODE       || "",
  },
  enterprise_max: {
    monthly: process.env.PAYSTACK_ENTERPRISE_MAX_MONTHLY_PLAN_CODE || "",
    annual:  process.env.PAYSTACK_ENTERPRISE_MAX_ANNUAL_PLAN_CODE  || "",
  },
};

// ──────────────────────────────────────────
// SUBSCRIPTIONS
// ──────────────────────────────────────────

export interface InitSubscriptionParams {
  email: string;
  name: string;
  phone?: string;
  /** Tier being purchased */
  tierId: Exclude<TierId, "free">;
  /** Billing cadence */
  billing: "monthly" | "annual";
  redirectUrl: string;
}

export async function initSubscriptionPayment(
  params: InitSubscriptionParams
): Promise<{ paymentLink: string; txRef: string }> {
  const txRef = generateTxRef("SUB");

  const tier = TIERS.find((t) => t.id === params.tierId);
  if (!tier) throw new Error(`Unknown tierId: ${params.tierId}`);

  const amount = params.billing === "annual" ? tier.annualPrice : tier.monthlyPrice;
  const planCode = TIER_PLAN_CODES[params.tierId]?.[params.billing] || "";

  // Guard: a missing plan code silently converts a subscription into a one-time
  // charge — the user is billed but will NEVER be auto-renewed. This is a
  // configuration error, not a recoverable state. Fail fast and loudly.
  if (!planCode) {
    const varName = `PAYSTACK_${params.tierId.toUpperCase()}_${params.billing.toUpperCase()}_PLAN_CODE`;
    throw new Error(
      `Paystack plan code not configured for ${params.tierId}/${params.billing}. ` +
      `Set the ${varName} environment variable in your Paystack dashboard and .env.local.`
    );
  }

  // Build Paystack payload.
  const payload: Record<string, unknown> = {
    email: params.email,
    // Paystack expects amount in the smallest currency unit (kobo/cents for ZAR)
    amount: amount * 100,
    currency: "ZAR",
    reference: txRef,
    callback_url: params.redirectUrl,
    metadata: {
      custom_fields: [
        { display_name: "Full Name",   variable_name: "full_name",   value: params.name },
        { display_name: "Tier",        variable_name: "tier_id",     value: params.tierId },
        { display_name: "Billing",     variable_name: "billing",     value: params.billing },
      ],
      tier_id: params.tierId,
      billing: params.billing,
    },
  };

  payload.plan = planCode;

  const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!data.status) {
    throw new Error(data.message || "Failed to initialize payment");
  }

  return { paymentLink: data.data.authorization_url, txRef };
}

// ──────────────────────────────────────────
// BOOKING PAYMENTS (with split / commission)
// ──────────────────────────────────────────

export interface InitBookingPaymentParams {
  email: string;
  name: string;
  phone?: string;
  amount: number;
  currency: string;
  expertSubaccountCode: string; // Expert's Paystack subaccount code (ACCT_xxx)
  expertName: string;
  sessionDurationMinutes: number;
  redirectUrl: string;
  bookingId: string;
}

export async function initBookingPayment(
  params: InitBookingPaymentParams
): Promise<{ paymentLink: string; txRef: string }> {
  const txRef = generateTxRef("BOOK");

  // transaction_charge = platform's 20% cut (in cents)
  const platformCommissionCents = Math.round(
    params.amount * BOOKING_COMMISSION * 100
  );

  const payload = {
    email: params.email,
    amount: params.amount * 100, // cents
    currency: params.currency,
    reference: txRef,
    callback_url: params.redirectUrl,
    subaccount: params.expertSubaccountCode,
    bearer: "account", // platform account bears Paystack's processing fee
    transaction_charge: platformCommissionCents, // platform keeps this amount
    metadata: {
      custom_fields: [
        {
          display_name: "Full Name",
          variable_name: "full_name",
          value: params.name,
        },
        {
          display_name: "Session Duration",
          variable_name: "session_duration",
          value: `${params.sessionDurationMinutes} min`,
        },
      ],
      booking_id: params.bookingId,
    },
  };

  const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!data.status) {
    throw new Error(data.message || "Failed to initialize booking payment");
  }

  return { paymentLink: data.data.authorization_url, txRef };
}

// ──────────────────────────────────────────
// VERIFY TRANSACTION
// ──────────────────────────────────────────

export async function verifyTransaction(
  reference: string
): Promise<{ verified: boolean; data: Record<string, unknown> }> {
  const res = await fetch(
    `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: getHeaders() }
  );

  const data = await res.json();
  const verified =
    data.status === true && data.data?.status === "success";

  return { verified, data: data.data || {} };
}

// ──────────────────────────────────────────
// BANK LIST + ACCOUNT RESOLUTION
// ──────────────────────────────────────────

export interface PaystackBank {
  id: number;
  name: string;
  slug: string;
  code: string;
  longcode: string | null;
  gateway: string | null;
  pay_with_bank: boolean;
  active: boolean;
  country: string;
  currency: string;
  type: string;
}

// Paystack bank list — defaults to South Africa since that's where ROSTER
// pays out. For other markets, pass the country slug ("nigeria", "ghana").
export async function listBanks(country = "south africa"): Promise<PaystackBank[]> {
  const url = `${PAYSTACK_BASE_URL}/bank?country=${encodeURIComponent(country)}&perPage=100`;
  const res = await fetch(url, { headers: getHeaders() });
  const data = await res.json();

  if (!data.status) {
    throw new Error(data.message || "Failed to list banks");
  }
  return (data.data as PaystackBank[]).filter((b) => b.active);
}

// Given a bank code + account number, ask Paystack who owns the account.
// Used for in-form verification ("Pay Joe Bloggs at ABSA — is that right?")
// before we commit a subaccount record.
export interface ResolvedAccount {
  accountName: string;
  accountNumber: string;
}
export async function resolveAccount(params: {
  bankCode: string;
  accountNumber: string;
}): Promise<ResolvedAccount> {
  const url =
    `${PAYSTACK_BASE_URL}/bank/resolve` +
    `?account_number=${encodeURIComponent(params.accountNumber)}` +
    `&bank_code=${encodeURIComponent(params.bankCode)}`;
  const res = await fetch(url, { headers: getHeaders() });
  const data = await res.json();

  if (!data.status) {
    throw new Error(data.message || "Could not verify that account.");
  }
  return {
    accountName: data.data.account_name,
    accountNumber: data.data.account_number,
  };
}

// ──────────────────────────────────────────
// CREATE EXPERT SUBACCOUNT
// ──────────────────────────────────────────

export interface CreateSubaccountParams {
  businessName: string;
  businessEmail: string;
  country: string;
  bankCode: string;
  accountNumber: string;
  splitValue?: number; // percentage (e.g. 80 = expert keeps 80%)
}

export interface CreatedSubaccount {
  subaccountId: number;
  subaccountCode: string;
  accountNumber: string;
  bankCode: string;
  settlementBank: string;
}

export async function createExpertSubaccount(
  params: CreateSubaccountParams
): Promise<CreatedSubaccount> {
  const payload = {
    business_name: params.businessName,
    settlement_bank: params.bankCode, // bank code from Paystack's bank list
    account_number: params.accountNumber,
    // Paystack uses decimal (0.8 = 80%). This is the subaccount's share.
    percentage_charge: (params.splitValue ?? 80) / 100,
    primary_contact_email: params.businessEmail,
    primary_contact_name: params.businessName,
  };

  const res = await fetch(`${PAYSTACK_BASE_URL}/subaccount`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!data.status) {
    throw new Error(data.message || "Failed to create subaccount");
  }

  return {
    subaccountId: data.data.id,
    subaccountCode: data.data.subaccount_code, // e.g. "ACCT_xxxxxxxx"
    accountNumber: data.data.account_number,
    bankCode: params.bankCode,
    settlementBank: data.data.settlement_bank,
  };
}

// Paystack doesn't expose a true "delete subaccount" endpoint — the safe
// pattern is to mark it inactive. This flip stops the subaccount from
// receiving future splits without breaking historical transactions.
export async function deactivateSubaccount(subaccountCode: string): Promise<void> {
  const res = await fetch(
    `${PAYSTACK_BASE_URL}/subaccount/${encodeURIComponent(subaccountCode)}`,
    {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ active: false }),
    }
  );

  const data = await res.json();
  if (!data.status) {
    // Non-fatal from the user's perspective — they already clicked disconnect
    // and we've nulled the local row. Log and move on.
    logger.error("[Paystack] Failed to deactivate subaccount", {}, data.message);
  }
}

// ──────────────────────────────────────────
// WEBHOOK SIGNATURE VERIFICATION
// ──────────────────────────────────────────

export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secretKey: string
): boolean {
  const hash = createHmac("sha512", secretKey)
    .update(rawBody)
    .digest("hex");
  return hash === signature;
}
