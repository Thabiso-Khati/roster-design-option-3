/**
 * Sentry — Node.js server-side initialisation.
 * Runs in Next.js API routes, Server Components, and Server Actions.
 *
 * Docs: https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Capture all server-side traces. Lower this if cron routes create noise.
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,

  // Spotlight shows Sentry events in the browser dev-tools overlay in dev.
  spotlight: process.env.NODE_ENV === "development",

  enabled: process.env.NODE_ENV === "production",
});
