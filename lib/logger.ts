/**
 * ROSTER structured logger
 *
 * • Development  → pretty-printed, colour-coded to stderr/stdout
 * • Production   → newline-delimited JSON (compatible with Vercel log drains,
 *                  Datadog, CloudWatch, and Sentry breadcrumbs)
 *
 * No external dependencies — pure Node.js / Edge-compatible.
 *
 * Usage:
 *   import { logger } from "@/lib/logger";
 *   logger.info("Booking created", { bookingId, userId });
 *   logger.error("Vault decrypt failed", { itemId }, err);
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogContext = Record<string, unknown>;

interface LogEntry {
  level: LogLevel;
  msg: string;
  ts: string;
  svc: string;
  ctx?: LogContext;
  err?: {
    name: string;
    message: string;
    stack?: string;
  };
}

// ─── config ──────────────────────────────────────────────────────────────────

const SERVICE = "roster-v3";
const IS_PROD = process.env.NODE_ENV === "production";

// In test environments we suppress all output unless LOG_LEVEL=debug is set.
const IS_TEST = process.env.NODE_ENV === "test";
const FORCE_DEBUG = process.env.LOG_LEVEL === "debug";

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const MIN_LEVEL: LogLevel =
  FORCE_DEBUG ? "debug"
  : IS_TEST   ? "warn"
  : IS_PROD   ? "info"
  : "debug";

// ─── ANSI colours (dev only) ──────────────────────────────────────────────────

const C = {
  reset:  "\x1b[0m",
  bold:   "\x1b[1m",
  dim:    "\x1b[2m",
  red:    "\x1b[31m",
  yellow: "\x1b[33m",
  blue:   "\x1b[34m",
  cyan:   "\x1b[36m",
  gray:   "\x1b[90m",
};

const LEVEL_COLOUR: Record<LogLevel, string> = {
  debug: C.dim + C.gray,
  info:  C.blue,
  warn:  C.yellow,
  error: C.red + C.bold,
};

// ─── serialise error ──────────────────────────────────────────────────────────

function serialiseError(raw: unknown): LogEntry["err"] {
  if (!raw) return undefined;
  const e = raw instanceof Error ? raw : new Error(String(raw));
  return {
    name:    e.name,
    message: e.message,
    // Omit stack in prod to keep JSON compact; Sentry will capture it via its
    // own SDK. Include in dev for quick terminal debugging.
    stack:   IS_PROD ? undefined : e.stack,
  };
}

// ─── formatters ──────────────────────────────────────────────────────────────

function formatDev(entry: LogEntry): string {
  const time  = new Date(entry.ts).toLocaleTimeString("en-ZA", { hour12: false });
  const level = `[${entry.level.toUpperCase().padEnd(5)}]`;
  const color = LEVEL_COLOUR[entry.level];
  const ctx   = entry.ctx
    ? ` ${C.cyan}${JSON.stringify(entry.ctx)}${C.reset}`
    : "";
  const err   = entry.err
    ? `\n  ${C.red}${entry.err.stack ?? `${entry.err.name}: ${entry.err.message}`}${C.reset}`
    : "";
  return `${C.gray}${time}${C.reset} ${color}${level}${C.reset} ${entry.msg}${ctx}${err}`;
}

function formatProd(entry: LogEntry): string {
  return JSON.stringify(entry);
}

// ─── write ────────────────────────────────────────────────────────────────────

function write(
  level:   LogLevel,
  msg:     string,
  ctx?:    LogContext,
  rawErr?: unknown,
): void {
  if (LEVEL_RANK[level] < LEVEL_RANK[MIN_LEVEL]) return;

  const entry: LogEntry = {
    level,
    msg,
    ts:  new Date().toISOString(),
    svc: SERVICE,
    ...(ctx                        ? { ctx }               : {}),
    ...(rawErr !== undefined       ? { err: serialiseError(rawErr) } : {}),
  };

  const line = IS_PROD ? formatProd(entry) : formatDev(entry);

  // Route warns + errors to stderr so Vercel separates them in the log UI.
  if (level === "error" || level === "warn") {
    process.stderr.write(line + "\n");
  } else {
    process.stdout.write(line + "\n");
  }
}

// ─── public API ───────────────────────────────────────────────────────────────

export const logger = {
  /**
   * Verbose — disabled in production by default.
   * Useful for tracing cron steps, algorithm stages, etc.
   */
  debug: (msg: string, ctx?: LogContext) =>
    write("debug", msg, ctx),

  /**
   * Normal operational events: booking created, payment verified, etc.
   */
  info: (msg: string, ctx?: LogContext) =>
    write("info", msg, ctx),

  /**
   * Recoverable anomaly — something unexpected happened but the request
   * can continue. Examples: SMS fallback skipped, non-fatal email error.
   */
  warn: (msg: string, ctx?: LogContext, err?: unknown) =>
    write("warn", msg, ctx, err),

  /**
   * Request failed or critical subsystem errored.
   * Always pass the raw Error (or caught unknown) as the third argument so
   * the stack trace is captured.
   *
   * @example
   *   logger.error("[vault/init] insert error", { userId }, insertError);
   */
  error: (msg: string, ctx?: LogContext, err?: unknown) =>
    write("error", msg, ctx, err),
};
