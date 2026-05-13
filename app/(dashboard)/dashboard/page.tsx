import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WelcomeBanner } from "@/components/layout/welcome-banner";
import { TodaysBrief } from "@/components/dashboard/todays-brief";
import { ArtistsWidget } from "@/components/dashboard/artists-widget";
import { ReleasesWidget } from "@/components/dashboard/releases-widget";
import { RemindersWidget } from "@/components/dashboard/reminders-widget";
import { IndustryTicker } from "@/components/dashboard/industry-ticker";
import { LearningCompass } from "@/components/dashboard/learning-compass";
import { CompassCard } from "@/components/dashboard/compass-card";
import { fetchReleases } from "@/lib/data/releases";
import { fetchReminders } from "@/lib/data/reminders";
import { fetchCalendarEventsForDashboard } from "@/lib/data/calendar";
import { buildBrief } from "@/lib/brief/build-brief";
import { CalendarWidget } from "@/components/dashboard/calendar-widget";
import { getServerT } from "@/lib/i18n/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const t = await getServerT(supabase);

  let name = "Thabiso";
  let needsOnboarding = false;

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, onboarding_complete")
        .eq("id", user.id)
        .maybeSingle();

      // First-time users: no profile row yet, or onboarding not complete
      if (!profile || profile.onboarding_complete === false) {
        needsOnboarding = true;
      } else {
        const profileName = profile?.full_name?.split(" ")[0];
        const metaName = user?.user_metadata?.full_name?.split(" ")[0];
        name = profileName || metaName || "Thabiso";
      }
    }
  } catch {
    // Supabase not configured or unavailable — keep default
  }

  // redirect() throws internally — must be called outside the try/catch
  if (needsOnboarding) redirect("/onboarding");

  // Fetch real-data prototype layer in parallel
  const [releases, reminders, calendarEvents] = await Promise.all([
    fetchReleases(),
    fetchReminders(),
    fetchCalendarEventsForDashboard(14),
  ]);
  const brief = await buildBrief({ releases, reminders, calendarEvents });

  return (
    <div className="animate-fade-in">
      <WelcomeBanner />

      {/* Zone 1 — Today's Brief */}
      <TodaysBrief name={name} brief={brief} />

      {/* Zone 3 — Workspace
          Layout:
            Row 1 — ArtistsWidget, full-width (the roster is the north
                     star of the business; deserves the real estate)
            Row 2 — Pipeline + Reminders, 2 equal columns
      */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-4 px-1">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-text-muted font-medium">
              {t("dashboard.workspace")}
            </p>
            <p className="text-xs text-text-muted/60 mt-0.5">
              {t("dashboard.workspaceDesc")}
            </p>
          </div>
        </div>

        <div className="mb-4">
          <ArtistsWidget />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <ReleasesWidget initialReleases={releases} />
          <RemindersWidget initialReminders={reminders} />
          <CalendarWidget initialEvents={calendarEvents} />
        </div>
      </section>

      {/* Zone 4 — Compass (AI Tier B proactive suggestions) */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-4 px-1">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-text-muted font-medium">
              {t("dashboard.compassSection")}
            </p>
            <p className="text-xs text-text-muted/60 mt-0.5">
              {t("dashboard.compassDesc")}
            </p>
          </div>
        </div>
        <CompassCard limit={3} />
      </section>

      {/* Zone 5 — Learning Compass (sits above ticker as a decision card) */}
      <section className="mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1">
            <LearningCompass />
          </div>
          <div className="lg:col-span-2 glass-card rounded-2xl p-6 flex flex-col justify-center">
            <p className="text-xs uppercase tracking-[0.2em] text-text-muted font-medium mb-2">
              {t("dashboard.knowledge")}
            </p>
            <h2 className="text-lg font-semibold text-text-primary mb-1">
              {t("dashboard.knowledgeTitle")}
            </h2>
            <p className="text-sm text-text-muted leading-relaxed mb-4 max-w-2xl">
              {t("dashboard.knowledgeDesc")}
            </p>
            <a
              href="/dashboard/library"
              className="self-start inline-flex items-center gap-2 text-sm text-brand hover:text-brand-light transition-colors font-medium"
            >
              {t("dashboard.browseLibrary")}
            </a>
          </div>
        </div>
      </section>

      {/* Zone 4 — Industry Pulse Ticker */}
      <IndustryTicker />
    </div>
  );
}
