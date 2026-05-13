"use client";
import { useEffect } from "react";
import Link from "next/link";

// Capture to Sentry if installed; silently skip otherwise.
function captureToSentry(error: Error) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { captureException } = require("@sentry/nextjs");
    captureException(error);
  } catch {
    // Sentry not installed yet — that's fine
  }
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureToSentry(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-background min-h-screen flex flex-col items-center justify-center px-4 text-center"
        style={{ backgroundColor: "#080B14", color: "#F1F5F9", fontFamily: "Inter, sans-serif" }}>
        <span className="text-xl font-black tracking-widest mb-12"
          style={{ background: "linear-gradient(135deg,#C9A84C,#F59E0B)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          ROSTER
        </span>

        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl"
          style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
          ⚠️
        </div>

        <h1 className="text-2xl font-black mb-3" style={{ color: "#F1F5F9" }}>
          Something went wrong.
        </h1>
        <p className="text-sm mb-8 max-w-xs" style={{ color: "#64748B" }}>
          An unexpected error occurred. Our team has been notified. Try refreshing the page.
        </p>

        {error.digest && (
          <p className="text-xs mb-6 font-mono" style={{ color: "#374151" }}>
            Error ID: {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={reset}
            className="font-bold text-sm px-6 py-3 rounded-lg transition-all"
            style={{ background: "linear-gradient(135deg,#C9A84C,#F59E0B)", color: "#080B14" }}
          >
            Try Again
          </button>
          <Link
            href="/dashboard"
            className="border font-semibold text-sm px-6 py-3 rounded-lg transition-all"
            style={{ borderColor: "#1F2937", color: "#64748B" }}
          >
            Back to Dashboard
          </Link>
        </div>
      </body>
    </html>
  );
}
