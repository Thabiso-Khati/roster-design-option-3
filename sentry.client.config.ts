/**
 * Sentry — browser-side initialisation.
 * This file runs in the user's browser. Keep it lean.
 *
 * Docs: https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Capture 100 % of sessions in dev; ramp down in prod once volume
  // is understood. Start at 10 % (0.1) for a large user base.
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Record a video-like replay of user sessions around every error.
  // Error-replay captures 100 % of sessions that end in an error.
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,

  integrations: [
    Sentry.replayIntegration(),
  ],

  // Only send events in production.
  // In dev you can inspect errors in the terminal via the structured logger.
  enabled: process.env.NODE_ENV === "production",
});
