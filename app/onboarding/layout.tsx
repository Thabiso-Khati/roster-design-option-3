// ============================================================
// ROSTER — Onboarding layout
// ------------------------------------------------------------
// Intentionally minimal: no sidebar, no nav bar.
// The full-screen wizard is the only thing on screen.
// ============================================================

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Welcome to ROSTER",
  description: "Set up your account in 2 minutes.",
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
