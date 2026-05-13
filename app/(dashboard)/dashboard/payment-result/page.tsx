// ============================================================
// ROSTER — /dashboard/payment-result
// ------------------------------------------------------------
// Landing page after Paystack hosted checkout. Called with:
//   ?booking=<uuid>&reference=<tx_ref>&trxref=<tx_ref>
//
// The reference/trxref params are appended by Paystack on its
// redirect; booking is ours from the original create call.
//
// This page does two things server-side:
//
//   1. Loads the booking row for the current user (scoped).
//   2. If it's still pending-payment, asks Paystack to verify the
//      transaction synchronously. If verified, calls our shared
//      promote helper to flip the row to paid, provision the Daily
//      room, and send confirmations — same code path the webhook
//      uses, so whichever fires first wins.
//
// If Paystack says the transaction is still pending (can happen
// with slow bank confirmations), we render a client poller that
// re-checks /api/bookings/[id]/status every 2s for up to 30s.
// After that, we show a "check your email" state rather than
// spinning forever.
// ============================================================

import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyTransaction } from "@/lib/paystack";
import { promoteBookingToPaid } from "@/lib/bookings/promote";
import { PaymentResultPoller } from "@/components/bookings/payment-result-poller";
import { getServerT } from "@/lib/i18n/server";
import type { TranslationPath } from "@/lib/i18n";

type TFn = (key: TranslationPath, vars?: Record<string, string | number>) => string;

interface SearchParams {
  booking?: string;
  reference?: string;
  trxref?: string;
}

interface Props {
  searchParams: Promise<SearchParams>;
}

export default async function PaymentResultPage({ searchParams }: Props) {
  const params = await searchParams;
  const bookingId = params.booking;
  // Paystack sends both reference and trxref — they're identical. Prefer
  // reference; fall back to trxref for any edge cases.
  const paystackRef = params.reference || params.trxref || null;

  // Scoped read — only the booking owner should be able to see this.
  const supabase = await createClient();
  const t = await getServerT(supabase);

  if (!bookingId) {
    return <MissingBookingPanel t={t} />;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <NotAuthenticatedPanel t={t} />;
  }

  const { data: booking } = await supabase
    .from("bookings")
    .select(
      `id, payment_status, booking_status, scheduled_at, duration_minutes,
       amount, currency, meeting_url, paid_at, tx_ref,
       experts(name, specialty)`
    )
    .eq("id", bookingId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!booking) {
    return <NotFoundPanel t={t} />;
  }

  // Normalize the joined expert (object or array depending on cardinality).
  const expertRaw = booking.experts as
    | { name: string; specialty: string }
    | Array<{ name: string; specialty: string }>
    | null;
  const expert = Array.isArray(expertRaw) ? expertRaw[0] : expertRaw;

  // ── Fast path: booking already paid (webhook beat the redirect) ─
  if (booking.payment_status === "paid") {
    return (
      <SuccessPanel
        t={t}
        expertName={expert?.name || "your expert"}
        scheduledAt={booking.scheduled_at}
        durationMinutes={booking.duration_minutes}
        amount={booking.amount}
        currency={booking.currency}
        bookingId={booking.id}
        meetingUrl={booking.meeting_url}
      />
    );
  }

  // ── Still pending — try verifying Paystack synchronously ─────────
  // If the user lands here before the webhook does, we want the page
  // to be correct anyway. We use the admin client because the promote
  // helper needs service-role access (auth.users lookups, etc.).
  let verifiedNow = false;
  let meetingUrl = booking.meeting_url as string | null;

  if (paystackRef) {
    try {
      const { verified } = await verifyTransaction(paystackRef);
      if (verified) {
        const admin = createAdminClient();
        const result = await promoteBookingToPaid(bookingId, paystackRef, admin);
        verifiedNow = result.paymentStatus === "paid";
        meetingUrl = result.meetingUrl ?? meetingUrl;
      }
    } catch (e) {
      console.error(
        "[payment-result] Synchronous verify failed, will poll instead:",
        e
      );
    }
  }

  if (verifiedNow) {
    return (
      <SuccessPanel
        t={t}
        expertName={expert?.name || "your expert"}
        scheduledAt={booking.scheduled_at}
        durationMinutes={booking.duration_minutes}
        amount={booking.amount}
        currency={booking.currency}
        bookingId={booking.id}
        meetingUrl={meetingUrl}
      />
    );
  }

  // ── Still not paid — either user abandoned, card failed, or slow
  //    settlement. Hand the client poller an initial status; it polls
  //    /api/bookings/[id]/status for 30s. If it flips to paid, it
  //    reloads the page. Otherwise it shows a fallback.
  return (
    <PendingPanel
      t={t}
      bookingId={booking.id}
      expertName={expert?.name || "your expert"}
      scheduledAt={booking.scheduled_at}
      amount={booking.amount}
      currency={booking.currency}
    />
  );
}

// ─── Result panels ──────────────────────────────────────────────

function SuccessPanel({
  t,
  expertName,
  scheduledAt,
  durationMinutes,
  amount,
  currency,
  bookingId,
  meetingUrl,
}: {
  t: TFn;
  expertName: string;
  scheduledAt: string;
  durationMinutes: number;
  amount: number;
  currency: string;
  bookingId: string;
  meetingUrl: string | null;
}) {
  const when = new Date(scheduledAt).toLocaleDateString("en-ZA", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const priceStr =
    currency === "ZAR"
      ? `R${amount.toLocaleString()}`
      : `${currency} ${amount.toLocaleString()}`;

  return (
    <div className="animate-fade-in max-w-lg mx-auto">
      <div className="glass-card rounded-2xl p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-success/10 border border-success/20 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 size={26} className="text-success" />
        </div>
        <h1 className="text-2xl font-black text-text-primary mb-2">
          {t("paymentResult.successTitle")}
        </h1>
        <p className="text-sm text-text-muted mb-6">
          {t("paymentResult.successDesc").replace("{expert}", expertName)}
        </p>

        <div className="bg-surface-2 border border-border rounded-xl p-4 mb-6 text-left space-y-2.5 text-sm">
          <DetailRow label={t("paymentResult.labelWhen")} value={when} />
          <DetailRow label={t("paymentResult.labelDuration")} value={t("paymentResult.durationMin").replace("{n}", String(durationMinutes))} />
          <DetailRow label={t("paymentResult.labelAmountPaid")} value={priceStr} />
        </div>

        <div className="flex flex-col gap-2.5">
          {meetingUrl ? (
            <a
              href={meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-brand hover:bg-brand-light transition-colors text-background font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2"
            >
              <Sparkles size={14} />
              {t("paymentResult.openRoom")}
              <ExternalLink size={13} />
            </a>
          ) : (
            <div className="w-full bg-surface-2 border border-border text-text-muted font-semibold py-3 rounded-xl text-xs flex items-center justify-center gap-2">
              <Clock size={13} />
              {t("paymentResult.roomSetup")}
            </div>
          )}
          <Link
            href={`/dashboard/bookings?booking=${bookingId}`}
            className="w-full bg-surface-2 hover:bg-surface border border-border text-text-primary font-semibold py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"
          >
            {t("paymentResult.viewBooking")}
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}

function PendingPanel({
  t,
  bookingId,
  expertName,
  scheduledAt,
  amount,
  currency,
}: {
  t: TFn;
  bookingId: string;
  expertName: string;
  scheduledAt: string;
  amount: number;
  currency: string;
}) {
  const when = new Date(scheduledAt).toLocaleDateString("en-ZA", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const priceStr =
    currency === "ZAR"
      ? `R${amount.toLocaleString()}`
      : `${currency} ${amount.toLocaleString()}`;

  return (
    <div className="animate-fade-in max-w-lg mx-auto">
      <div className="glass-card rounded-2xl p-8 text-center">
        <PaymentResultPoller bookingId={bookingId} />

        <h1 className="text-2xl font-black text-text-primary mb-2">
          {t("paymentResult.pendingTitle")}
        </h1>
        <p className="text-sm text-text-muted mb-6">
          {t("paymentResult.pendingDesc")}
        </p>

        <div className="bg-surface-2 border border-border rounded-xl p-4 mb-6 text-left space-y-2.5 text-sm">
          <DetailRow label={t("paymentResult.labelExpert")} value={expertName} />
          <DetailRow label={t("paymentResult.labelWhen")} value={when} />
          <DetailRow label={t("paymentResult.labelAmount")} value={priceStr} />
        </div>

        <p className="text-xs text-text-muted">
          {t("paymentResult.pendingNote")}
        </p>

        <Link
          href="/dashboard/bookings"
          className="inline-block mt-4 text-xs text-text-muted hover:text-text-primary transition-colors"
        >
          {t("paymentResult.goToBookings")} →
        </Link>
      </div>
    </div>
  );
}

function MissingBookingPanel({ t }: { t: TFn }) {
  return (
    <div className="animate-fade-in max-w-lg mx-auto">
      <div className="glass-card rounded-2xl p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-warning/10 border border-warning/20 flex items-center justify-center mx-auto mb-5">
          <XCircle size={26} className="text-warning" />
        </div>
        <h1 className="text-xl font-black text-text-primary mb-2">
          {t("paymentResult.missingTitle")}
        </h1>
        <p className="text-sm text-text-muted mb-6">
          {t("paymentResult.missingDesc")}
        </p>
        <Link
          href="/dashboard/bookings"
          className="inline-flex items-center gap-2 bg-brand hover:bg-brand-light transition-colors text-background font-bold px-5 py-3 rounded-xl text-sm"
        >
          {t("paymentResult.goToBookings")}
          <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}

function NotAuthenticatedPanel({ t }: { t: TFn }) {
  return (
    <div className="animate-fade-in max-w-lg mx-auto">
      <div className="glass-card rounded-2xl p-8 text-center">
        <h1 className="text-xl font-black text-text-primary mb-2">
          {t("paymentResult.signInTitle")}
        </h1>
        <p className="text-sm text-text-muted mb-6">
          {t("paymentResult.signInDesc")}
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 bg-brand hover:bg-brand-light transition-colors text-background font-bold px-5 py-3 rounded-xl text-sm"
        >
          {t("action.signIn")}
        </Link>
      </div>
    </div>
  );
}

function NotFoundPanel({ t }: { t: TFn }) {
  return (
    <div className="animate-fade-in max-w-lg mx-auto">
      <div className="glass-card rounded-2xl p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-error/10 border border-error/20 flex items-center justify-center mx-auto mb-5">
          <XCircle size={26} className="text-error" />
        </div>
        <h1 className="text-xl font-black text-text-primary mb-2">
          {t("paymentResult.notFoundTitle")}
        </h1>
        <p className="text-sm text-text-muted mb-6">
          {t("paymentResult.notFoundDesc")}
        </p>
        <Link
          href="/dashboard/bookings"
          className="inline-flex items-center gap-2 bg-brand hover:bg-brand-light transition-colors text-background font-bold px-5 py-3 rounded-xl text-sm"
        >
          {t("paymentResult.goToBookings")}
          <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-text-muted">{label}</span>
      <span className="text-text-primary font-semibold text-right">{value}</span>
    </div>
  );
}
