/**
 * /api/queue/transact
 * ────────────────────
 * QStash consumer for transactional single-recipient messages.
 *
 * QStash delivers POST requests here (signed with HMAC-SHA256).
 * On a non-2xx response QStash retries automatically — up to the
 * retries value set when the job was published (default: 3).
 *
 * Security: When QSTASH_CURRENT_SIGNING_KEY is set, every request
 * must carry a valid `upstash-signature` header. Requests without a
 * valid signature are rejected 401 before any send attempt.
 *
 * This route is excluded from the rate-limiter middleware (see SKIP list).
 */
import { NextRequest, NextResponse } from "next/server";
import { getQStashReceiver, TransactJob } from "@/lib/queue/transact";
import { sendEmail }    from "@/lib/email/send";
import { sendWhatsApp } from "@/lib/campaigns/whatsapp";
import { logger }       from "@/lib/logger";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const receiver = getQStashReceiver();

  let job: TransactJob;

  if (receiver) {
    // Verify QStash HMAC signature
    const signature = req.headers.get("upstash-signature") ?? "";
    const rawBody   = await req.text();

    let valid = false;
    try {
      valid = await receiver.verify({ signature, body: rawBody });
    } catch {
      valid = false;
    }

    if (!valid) {
      logger.warn("[queue/transact] invalid QStash signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    job = JSON.parse(rawBody) as TransactJob;
  } else {
    // No signing keys — accept without verification (local dev only)
    job = (await req.json()) as TransactJob;
  }

  return handleJob(job);
}

async function handleJob(job: TransactJob): Promise<NextResponse> {
  if (job.type === "email") {
    const result = await sendEmail({
      to:      job.to,
      subject: job.subject,
      html:    job.html,
      replyTo: job.replyTo,
    });

    if (!result.success) {
      // Non-2xx → QStash will retry
      logger.error("[queue/transact] email failed", { to: job.to, subject: job.subject }, result.error);
      return NextResponse.json({ error: result.error ?? "Email send failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: result.id });
  }

  if (job.type === "whatsapp") {
    const result = await sendWhatsApp({
      to:         job.to,
      body:       job.body,
      fromNumber: job.fromNumber,
    });

    if (!result.success) {
      // Non-2xx → QStash will retry
      logger.error("[queue/transact] whatsapp failed", { to: job.to }, result.error);
      return NextResponse.json({ error: result.error ?? "WhatsApp send failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, sid: result.sid });
  }

  // Unknown job type — return 400 (no retry — bad payload)
  logger.error("[queue/transact] unknown job type", { job });
  return NextResponse.json({ error: "Unknown job type" }, { status: 400 });
}
