// ============================================================
// ROSTER — /experts/claim
// ------------------------------------------------------------
// Public landing page for the one-time claim link emailed to an
// approved expert applicant. Server component does the token
// lookup (needs the admin client because is_active=false rows
// aren't visible through regular RLS), then hands off to a
// client component for the interactive bits (magic link sign-in,
// auto-claim after auth).
// ============================================================

import Link from "next/link";
import { AlertCircle, ShieldCheck, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ClaimForm } from "@/components/experts/claim-form";

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function ClaimPage({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token) {
    return <ClaimError title="Missing claim token" message="This URL is missing its token. Check the link in your approval email." />;
  }

  // Look up expert by token. Admin client bypasses RLS so we can
  // find is_active=false rows. We only return sanitized metadata
  // — never the token or internal IDs — to the client.
  const admin = createAdminClient();
  const { data: expert } = await admin
    .from("experts")
    .select("id, name, application_email, claim_token_expires_at, user_id")
    .eq("claim_token", token)
    .maybeSingle();

  if (!expert) {
    return (
      <ClaimError
        title="Link already used or revoked"
        message="This claim link is no longer valid. If you've already claimed your account, sign in as usual. If you need a new link, email experts@rosterapp.ai."
      />
    );
  }

  if (expert.user_id) {
    return (
      <ClaimError
        title="Already claimed"
        message="This expert account has already been claimed. Sign in to your dashboard to continue."
        cta={{ label: "Go to Sign In", href: "/auth/login" }}
      />
    );
  }

  if (
    expert.claim_token_expires_at &&
    new Date(expert.claim_token_expires_at) < new Date()
  ) {
    return (
      <ClaimError
        title="Link expired"
        icon="clock"
        message="This claim link has expired. Email experts@rosterapp.ai and we'll reissue a fresh one."
      />
    );
  }

  // Current auth state — so the form can auto-claim if the visitor
  // is already signed in with the right email.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const signedInEmail = user?.email?.toLowerCase().trim() ?? null;
  const targetEmail = (expert.application_email || "").toLowerCase().trim();

  return (
    <div className="min-h-screen bg-background text-text-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="glass-card rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center">
              <ShieldCheck size={18} className="text-brand" />
            </div>
            <div>
              <h1 className="text-xl font-black">Claim your expert account</h1>
              <p className="text-xs text-text-muted">
                Approved for <span className="text-text-primary">{expert.name}</span>
              </p>
            </div>
          </div>

          <p className="text-sm text-text-muted leading-relaxed mb-6">
            This link was issued to{" "}
            <span className="text-text-primary font-semibold">{targetEmail}</span>. Sign in
            with that email to bind your ROSTER account to your expert profile. You&apos;ll
            then land on your Expert Dashboard to finish setting up (photo, bio, pricing,
            payouts).
          </p>

          <ClaimForm
            token={token}
            targetEmail={targetEmail}
            signedInEmail={signedInEmail}
          />
        </div>

        <p className="text-center text-xs text-text-muted/60 mt-4">
          Not you? Ignore this email. Questions: experts@rosterapp.ai
        </p>
      </div>
    </div>
  );
}

// ─── Error state shell ─────────────────────────────────────
function ClaimError({
  title,
  message,
  icon = "alert",
  cta,
}: {
  title: string;
  message: string;
  icon?: "alert" | "clock";
  cta?: { label: string; href: string };
}) {
  const Icon = icon === "clock" ? Clock : AlertCircle;
  return (
    <div className="min-h-screen bg-background text-text-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="glass-card rounded-2xl p-8">
          <div className="w-12 h-12 rounded-full bg-error/10 border border-error/20 flex items-center justify-center mx-auto mb-4">
            <Icon size={20} className="text-error" />
          </div>
          <h1 className="text-lg font-bold mb-2">{title}</h1>
          <p className="text-sm text-text-muted mb-6">{message}</p>
          {cta && (
            <Link
              href={cta.href}
              className="inline-flex items-center gap-2 bg-brand hover:bg-brand-light text-background font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors"
            >
              {cta.label}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
