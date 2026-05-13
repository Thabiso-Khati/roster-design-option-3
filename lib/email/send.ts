import { Resend } from "resend";
import { logger } from "@/lib/logger";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM || "ROSTER <noreply@rosterapp.ai>";

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendEmail({
  to,
  subject,
  html,
  replyTo,
}: SendEmailParams): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      reply_to: replyTo,
    });

    if (error) {
      logger.error("[email] send failed", { to: Array.isArray(to) ? to[0] : to, subject }, error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("[email] unexpected error", { subject }, err);
    return { success: false, error: message };
  }
}
