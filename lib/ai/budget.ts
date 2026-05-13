// ============================================================
// ROSTER — AI budget enforcement (Phase 3 foundation)
// ------------------------------------------------------------
// Wraps the Anthropic SDK with per-user spend tracking + caps.
// Every call must go through `withBudget()` so cost is recorded
// and a runaway loop can never bankrupt anyone.
//
// See /docs/phase-3-agentic-ai.md § 4 ("Per-user budget") for
// the full design rationale.
// ============================================================

import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";

// ── Pricing as of April 2026 ────────────────────────────────
// USD per 1M tokens (input/output). Keep this in sync with
// https://docs.claude.com/en/api/pricing — when prices change,
// historical ai_calls.cost_usd stays correct (we record cost at
// the time of the call, not on read).
const PRICING_USD_PER_MTOK: Record<string, { input: number; output: number }> = {
  "claude-haiku-4-5-20251001": { input: 1.0, output: 5.0 },
  "claude-sonnet-4-6": { input: 3.0, output: 15.0 },
  "claude-opus-4-6": { input: 15.0, output: 75.0 },
  // Fallback for unknown models — assume Sonnet rates so we don't
  // accidentally under-charge against an unknown model.
  default: { input: 3.0, output: 15.0 },
};

const DEFAULT_MONTHLY_BUDGET_USD = 5.0;

export class BudgetExhaustedError extends Error {
  constructor(public readonly resetAt: Date) {
    super(
      `AI quota exhausted. Resets ${resetAt.toISOString().slice(0, 10)}.`
    );
    this.name = "BudgetExhaustedError";
  }
}

interface BudgetRow {
  user_id: string;
  monthly_budget_usd: number;
  spent_usd: number;
  reset_at: string; // ISO
}

/** Fetch (or seed) the budget row for a user, auto-resetting
 *  spent_usd → 0 if we've crossed reset_at. Returns the live row. */
async function getOrSeedBudget(userId: string): Promise<BudgetRow> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("ai_usage")
    .select("user_id, monthly_budget_usd, spent_usd, reset_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(`Budget read failed: ${error.message}`);

  // First call for this user — seed with the default budget.
  if (!data) {
    const fresh: BudgetRow = {
      user_id: userId,
      monthly_budget_usd: DEFAULT_MONTHLY_BUDGET_USD,
      spent_usd: 0,
      reset_at: nextMonthBoundary().toISOString(),
    };
    const { error: insertError } = await admin.from("ai_usage").insert({
      user_id: fresh.user_id,
      monthly_budget_usd: fresh.monthly_budget_usd,
      spent_usd: fresh.spent_usd,
      reset_at: fresh.reset_at,
    });
    if (insertError) throw new Error(`Budget seed failed: ${insertError.message}`);
    return fresh;
  }

  // Auto-reset if we've crossed reset_at (cheaper than a SQL cron).
  if (new Date(data.reset_at).getTime() <= Date.now()) {
    const newReset = nextMonthBoundary().toISOString();
    const { error: resetError } = await admin
      .from("ai_usage")
      .update({ spent_usd: 0, reset_at: newReset })
      .eq("user_id", userId);
    if (resetError) {
      throw new Error(`Budget reset failed: ${resetError.message}`);
    }
    return { ...data, spent_usd: 0, reset_at: newReset };
  }

  return data as BudgetRow;
}

function nextMonthBoundary(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 1);
}

export interface BudgetCheckResult {
  allowed: boolean;
  monthlyBudgetUsd: number;
  spentUsd: number;
  remainingUsd: number;
  resetAt: Date;
}

/** Read-only check — returns budget state without committing.
 *  Use this for UI affordances ("AI quota: $4.20 of $5.00 used"). */
export async function checkBudget(userId: string): Promise<BudgetCheckResult> {
  const row = await getOrSeedBudget(userId);
  return {
    allowed: row.spent_usd < row.monthly_budget_usd,
    monthlyBudgetUsd: row.monthly_budget_usd,
    spentUsd: row.spent_usd,
    remainingUsd: Math.max(0, row.monthly_budget_usd - row.spent_usd),
    resetAt: new Date(row.reset_at),
  };
}

/** Compute USD cost for an Anthropic call given token usage. */
export function computeCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const rates =
    PRICING_USD_PER_MTOK[model] ?? PRICING_USD_PER_MTOK.default;
  const cost =
    (inputTokens / 1_000_000) * rates.input +
    (outputTokens / 1_000_000) * rates.output;
  // Round to 6 decimals — sub-cent precision matters for tracking
  // tiny short-prompt calls.
  return Math.round(cost * 1_000_000) / 1_000_000;
}

interface RecordCallOpts {
  userId: string;
  intent: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  success: boolean;
  errorMessage?: string;
}

/** Log one AI call to ai_calls + bump ai_usage.spent_usd.
 *  Failed calls still log (cost=0) so abuse patterns are visible. */
export async function recordCall(opts: RecordCallOpts): Promise<number> {
  const cost = opts.success
    ? computeCost(opts.model, opts.inputTokens, opts.outputTokens)
    : 0;

  const admin = createAdminClient();

  // Insert audit row first — independent from the budget update so
  // a budget-write failure doesn't lose the audit record.
  const { error: insertError } = await admin.from("ai_calls").insert({
    user_id: opts.userId,
    intent: opts.intent,
    model: opts.model,
    input_tokens: opts.inputTokens,
    output_tokens: opts.outputTokens,
    cost_usd: cost,
    success: opts.success,
    error_message: opts.errorMessage ?? null,
  });
  if (insertError) {
    logger.error("[ai/budget] ai_calls insert failed", {}, insertError);
    // Don't throw — audit failure shouldn't break the response path.
  }

  if (cost > 0) {
    // Atomic increment via Postgres RPC — defined in migration 027.
    // This is the only safe path under concurrent requests: a
    // read-modify-write UPDATE can silently under-count when two
    // calls read the same spent_usd before either writes back.
    const { error: updateError } = await admin.rpc("increment_ai_spent", {
      p_user_id: opts.userId,
      p_amount: cost,
    });
    if (updateError) {
      // Log loudly — this means the migration hasn't been run in this
      // environment, or the RPC was dropped. The audit row was already
      // written above so the call IS recorded; only the running total
      // is wrong. An ops alert should fire on this log line.
      logger.error(
        "[ai/budget] increment_ai_spent RPC failed — run migration 027",
        { userId: opts.userId, cost },
        updateError
      );
      // Do NOT silently fall back to read-modify-write: that path
      // can cause double-counting under concurrency and gives a false
      // sense of correctness. Fail loudly instead.
    }
  }

  return cost;
}

/** Higher-level wrapper: enforce budget BEFORE the call, run the
 *  user's function, log the cost AFTER. The function receives no
 *  args — capture model/intent/tokens via closures or by passing
 *  metadata to recordCall in a finally block.
 *
 *  Most callers should use this. Lower-level access via
 *  checkBudget/recordCall remains for routes that want to do their
 *  own thing. */
export async function withBudget<T>(
  userId: string,
  intent: string,
  fn: () => Promise<{
    result: T;
    model: string;
    inputTokens: number;
    outputTokens: number;
  }>
): Promise<T> {
  const check = await checkBudget(userId);
  if (!check.allowed) {
    throw new BudgetExhaustedError(check.resetAt);
  }

  let success = false;
  let model = "unknown";
  let inputTokens = 0;
  let outputTokens = 0;
  let errorMessage: string | undefined;

  try {
    const out = await fn();
    success = true;
    model = out.model;
    inputTokens = out.inputTokens;
    outputTokens = out.outputTokens;
    return out.result;
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : String(err);
    throw err;
  } finally {
    // Always log — success or failure.
    void recordCall({
      userId,
      intent,
      model,
      inputTokens,
      outputTokens,
      success,
      errorMessage,
    });
  }
}
