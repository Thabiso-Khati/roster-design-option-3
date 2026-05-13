// ============================================================
// ROSTER — /onboarding
// ------------------------------------------------------------
// Server component:
//   • Unauthenticated → redirect to /auth/login
//   • Already completed onboarding → redirect to /dashboard
//   • Otherwise → render the 5-step wizard
// ============================================================

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserTier } from "@/lib/vault/get-user-tier";
import { OnboardingWizard } from "@/components/onboarding/wizard";

export default async function OnboardingPage() {
  const supabase = await createClient();

  // 1. Auth guard
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirect=/onboarding");
  }

  // 2. Check onboarding state
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, onboarding_complete")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.onboarding_complete) {
    redirect("/dashboard");
  }

  // 3. Resolve current subscription tier (to tailor step 4)
  const currentTier = await getUserTier(supabase, user.id);

  const userName =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    "";

  return (
    <OnboardingWizard
      userName={userName}
      currentTier={currentTier}
      userEmail={user.email ?? ""}
      userId={user.id}
    />
  );
}
