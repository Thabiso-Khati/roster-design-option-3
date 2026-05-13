/**
 * Sentry — Edge runtime initialisation.
 * Runs in Next.js Middleware and any route segments with `export const runtime = "edge"`.
 *
 * Docs: https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,
  enabled: process.env.NODE_ENV === "production",
});
