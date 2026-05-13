/**
 * Next.js instrumentation hook.
 * Runs once on server start (Node.js runtime only).
 *
 * We use it to initialise Sentry so it captures errors from the very
 * first request, before any user session has been established.
 *
 * Docs: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

