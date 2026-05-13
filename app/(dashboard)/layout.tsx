import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";
import { LocaleProvider } from "@/context/locale-context";
import { WorkspaceProvider } from "@/context/workspace-context";
import { WorkspaceBanner } from "@/components/layout/workspace-banner";
import { CommandPalette } from "@/components/search/command-palette";

const SUPABASE_CONFIGURED =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== "your_supabase_project_url";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Only enforce auth when Supabase is configured
  if (SUPABASE_CONFIGURED) {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/auth/login");

    // ── Subscription paywall ─────────────────────────────────
    // Free-tier users (no subscription rows at all) always get through.
    // Users who previously paid but whose subscription is no longer active
    // are redirected to renew. We check for ANY subscription row first to
    // distinguish "never paid" (free tier) from "lapsed paid tier".
    const { count: anySubCount } = await supabase
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (anySubCount && anySubCount > 0) {
      // User has at least one subscription row — check if any are active
      const { count: activeCount } = await supabase
        .from("subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "active");

      if (!activeCount || activeCount === 0) {
        // All subscription rows are cancelled / expired → paywall
        redirect("/auth/signup?expired=1");
      }
    }
    // No rows → free tier → fall through normally
  }

  return (
    <LocaleProvider>
      <WorkspaceProvider>
        <div className="min-h-screen bg-background">
          {/* Skip-to-content — first focusable element, visible on focus */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-surface focus:text-brand focus:rounded-lg focus:border focus:border-brand focus:text-sm focus:font-semibold"
          >
            Skip to main content
          </a>
          <Sidebar />
          <MobileNav />
          <WhatsAppButton context="my ROSTER account" />
          <CommandPalette />
          <div className="lg:pl-64 lg:pb-0" style={{ paddingBottom: "calc(5rem + env(safe-area-inset-bottom))" }}>
            {/* Shown only to team members — "Viewing X's workspace · Role" */}
            <WorkspaceBanner />
            <main id="main-content" className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
              {children}
            </main>
          </div>
        </div>
      </WorkspaceProvider>
    </LocaleProvider>
  );
}
