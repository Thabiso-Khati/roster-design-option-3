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
  // AUTH BYPASSED — design preview only. Restore for production.

  return (
    <LocaleProvider>
      <WorkspaceProvider>
        <div className="min-h-screen" style={{ background: "var(--bg)" }}>
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
          <div className="lg:pl-[244px] lg:pb-0" style={{ paddingBottom: "calc(5rem + env(safe-area-inset-bottom))" }}>
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
