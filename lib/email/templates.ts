// ─────────────────────────────────────────────────────────────
// ROSTER — Email HTML Templates
// ─────────────────────────────────────────────────────────────

const BASE_STYLE = `
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background: #080B14;
  color: #F1F5F9;
  margin: 0; padding: 0;
`;

function wrap(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="${BASE_STYLE}">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px;">
    <!-- Header -->
    <div style="text-align:center;margin-bottom:40px;">
      <span style="font-size:22px;font-weight:900;letter-spacing:6px;
        background:linear-gradient(135deg,#C9A84C,#F59E0B);
        -webkit-background-clip:text;-webkit-text-fill-color:transparent;">
        ROSTER
      </span>
    </div>
    <!-- Card -->
    <div style="background:#111827;border:1px solid #1F2937;border-radius:16px;padding:40px;">
      ${content}
    </div>
    <!-- Footer -->
    <div style="text-align:center;margin-top:32px;">
      <p style="font-size:12px;color:#64748B;margin:0;">
        © ${new Date().getFullYear()} ROSTER by JO:LA LABS<br>
        <a href="{{unsubscribe}}" style="color:#C9A84C;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

// Bulletproof email button (table-based + VML fallback for Outlook).
// Renders identically in Gmail, Apple Mail, Outlook (desktop + web), Yahoo,
// and mobile clients. Dark text on gold = ~6:1 contrast (passes WCAG AA).
const btn = (text: string, href: string) =>
  `<!--[if mso]>
  <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${href}" style="height:48px;v-text-anchor:middle;width:280px;" arcsize="17%" stroke="f" fillcolor="#C9A84C">
    <w:anchorlock/>
    <center style="color:#080B14;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;">${text}</center>
  </v:roundrect>
  <![endif]-->
  <!--[if !mso]><!-- -->
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;border-spacing:0;margin:0 auto;">
    <tr>
      <td align="center" bgcolor="#C9A84C" style="background-color:#C9A84C;border-radius:8px;padding:14px 32px;mso-padding-alt:0;">
        <a href="${href}" target="_blank" rel="noopener" style="background-color:#C9A84C;color:#080B14;display:inline-block;font-family:'Inter',Arial,sans-serif;font-size:14px;font-weight:700;line-height:1;text-align:center;text-decoration:none;-webkit-text-size-adjust:none;mso-hide:all;">${text}</a>
      </td>
    </tr>
  </table>
  <!--<![endif]-->`;

// Secondary variant — dark grey bg, white text (used for "view signed contract" CTA).
const btnSecondary = (text: string, href: string) =>
  `<!--[if mso]>
  <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${href}" style="height:48px;v-text-anchor:middle;width:280px;" arcsize="17%" stroke="f" fillcolor="#1F2937">
    <w:anchorlock/>
    <center style="color:#FFFFFF;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;">${text}</center>
  </v:roundrect>
  <![endif]-->
  <!--[if !mso]><!-- -->
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;border-spacing:0;margin:0 auto;">
    <tr>
      <td align="center" bgcolor="#1F2937" style="background-color:#1F2937;border-radius:8px;padding:14px 32px;mso-padding-alt:0;">
        <a href="${href}" target="_blank" rel="noopener" style="background-color:#1F2937;color:#FFFFFF;display:inline-block;font-family:'Inter',Arial,sans-serif;font-size:14px;font-weight:700;line-height:1;text-align:center;text-decoration:none;-webkit-text-size-adjust:none;mso-hide:all;">${text}</a>
      </td>
    </tr>
  </table>
  <!--<![endif]-->`;

const muted = (text: string) =>
  `<p style="font-size:13px;color:#64748B;margin:0 0 8px 0;">${text}</p>`;

const heading = (text: string) =>
  `<h1 style="font-size:22px;font-weight:900;color:#F1F5F9;margin:0 0 8px 0;">${text}</h1>`;

// ── WELCOME ──────────────────────────────────────────────────
const TIER_LABELS: Record<string, string> = {
  pro:        "Pro",
  agency:     "Agency",
  enterprise: "Enterprise",
};

const TIER_PRICES: Record<string, Record<string, string>> = {
  pro:        { monthly: "R599/month",    annual: "R5,990/year (2 months free)" },
  agency:     { monthly: "R1,299/month",  annual: "R12,990/year (2 months free)" },
  enterprise: { monthly: "R4,999/month",  annual: "R49,990/year (2 months free)" },
};

export function welcomeEmail({
  name,
  tierId,
  billing,
  dashboardUrl,
}: {
  name: string;
  tierId: string;
  billing: "monthly" | "annual";
  dashboardUrl: string;
}): { subject: string; html: string } {
  const tierLabel  = TIER_LABELS[tierId]  || "Pro";
  const priceLabel = TIER_PRICES[tierId]?.[billing] || "R599/month";
  return {
    subject: "Welcome to ROSTER — you're in. 🎤",
    html: wrap(`
      ${heading(`Welcome, ${name.split(" ")[0]}. You're in.`)}
      ${muted("Your ROSTER subscription is now active.")}
      <div style="height:20px;"></div>
      <p style="color:#94A3B8;font-size:14px;line-height:1.6;margin:0 0 24px 0;">
        You now have full access to all toolkit modules, every video masterclass,
        and the expert booking directory. Everything you need to manage your artists
        like a major — built for the African market.
      </p>
      <div style="background:#1F2937;border-radius:10px;padding:20px;margin-bottom:28px;">
        <p style="font-size:12px;font-weight:700;color:#C9A84C;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px 0;">Your Plan</p>
        <p style="font-size:16px;font-weight:700;color:#F1F5F9;margin:0;">
          ${tierLabel} — ${priceLabel}
        </p>
      </div>
      <div style="text-align:center;">
        ${btn("Go to My Dashboard →", dashboardUrl)}
      </div>
    `),
  };
}

// ── BOOKING CONFIRMATION (user) ───────────────────────────────
export function bookingConfirmationEmail({
  userName,
  expertName,
  expertSpecialty,
  durationMinutes,
  scheduledAt,
  amount,
  currency,
  bookingId,
}: {
  userName: string;
  expertName: string;
  expertSpecialty: string;
  durationMinutes: number;
  scheduledAt: string;
  amount: number;
  currency: string;
  bookingId: string;
}): { subject: string; html: string } {
  const amountStr = currency === "ZAR" ? `R${amount.toLocaleString()}` : `${currency} ${amount}`;
  return {
    subject: `Booking confirmed — ${expertName} · ${durationMinutes} min`,
    html: wrap(`
      ${heading("Your session is confirmed.")}
      ${muted(`Booking ID: #${bookingId.slice(0, 8).toUpperCase()}`)}
      <div style="height:20px;"></div>
      <div style="background:#1F2937;border-radius:10px;padding:20px;margin-bottom:20px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:6px 0;font-size:12px;color:#64748B;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Expert</td>
              <td style="padding:6px 0;font-size:14px;color:#F1F5F9;font-weight:600;text-align:right;">${expertName}</td></tr>
          <tr><td style="padding:6px 0;font-size:12px;color:#64748B;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Specialty</td>
              <td style="padding:6px 0;font-size:14px;color:#94A3B8;text-align:right;">${expertSpecialty}</td></tr>
          <tr><td style="padding:6px 0;font-size:12px;color:#64748B;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Duration</td>
              <td style="padding:6px 0;font-size:14px;color:#94A3B8;text-align:right;">${durationMinutes} minutes</td></tr>
          <tr><td style="padding:6px 0;font-size:12px;color:#64748B;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Scheduled</td>
              <td style="padding:6px 0;font-size:14px;color:#94A3B8;text-align:right;">${scheduledAt}</td></tr>
          <tr style="border-top:1px solid #374151;">
              <td style="padding:12px 0 6px;font-size:12px;color:#C9A84C;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Amount Paid</td>
              <td style="padding:12px 0 6px;font-size:16px;color:#C9A84C;font-weight:900;text-align:right;">${amountStr}</td></tr>
        </table>
      </div>
      <p style="font-size:13px;color:#64748B;line-height:1.6;margin:0 0 24px 0;">
        The expert will reach out with a calendar invite and session link shortly.
        Keep an eye on your inbox.
      </p>
      <div style="text-align:center;">
        ${btn("View My Bookings →", `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/bookings`)}
      </div>
    `),
  };
}

// ── BOOKING NOTIFICATION (expert) ────────────────────────────
export function expertBookingNotificationEmail({
  expertName,
  userName,
  durationMinutes,
  scheduledAt,
  expertPayout,
  currency,
  notes,
}: {
  expertName: string;
  userName: string;
  durationMinutes: number;
  scheduledAt: string;
  expertPayout: number;
  currency: string;
  notes?: string;
}): { subject: string; html: string } {
  const payoutStr = currency === "ZAR" ? `R${expertPayout.toLocaleString()}` : `${currency} ${expertPayout}`;
  return {
    subject: `New booking from ${userName} — ${durationMinutes} min session`,
    html: wrap(`
      ${heading("You have a new booking.")}
      ${muted("A ROSTER member has booked a session with you.")}
      <div style="height:20px;"></div>
      <div style="background:#1F2937;border-radius:10px;padding:20px;margin-bottom:20px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:6px 0;font-size:12px;color:#64748B;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Client</td>
              <td style="padding:6px 0;font-size:14px;color:#F1F5F9;font-weight:600;text-align:right;">${userName}</td></tr>
          <tr><td style="padding:6px 0;font-size:12px;color:#64748B;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Duration</td>
              <td style="padding:6px 0;font-size:14px;color:#94A3B8;text-align:right;">${durationMinutes} minutes</td></tr>
          <tr><td style="padding:6px 0;font-size:12px;color:#64748B;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Scheduled</td>
              <td style="padding:6px 0;font-size:14px;color:#94A3B8;text-align:right;">${scheduledAt}</td></tr>
          ${notes ? `<tr><td style="padding:6px 0;font-size:12px;color:#64748B;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Notes</td>
              <td style="padding:6px 0;font-size:13px;color:#94A3B8;text-align:right;">${notes}</td></tr>` : ""}
          <tr style="border-top:1px solid #374151;">
              <td style="padding:12px 0 6px;font-size:12px;color:#10B981;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Your Payout</td>
              <td style="padding:12px 0 6px;font-size:16px;color:#10B981;font-weight:900;text-align:right;">${payoutStr}</td></tr>
        </table>
      </div>
      <p style="font-size:13px;color:#64748B;line-height:1.6;margin:0 0 24px 0;">
        Please send the client a calendar invite and session link (Zoom, Google Meet, etc.)
        within 24 hours of this booking.
      </p>
      <div style="text-align:center;">
        ${btn("View in Expert Dashboard →", `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/expert`)}
      </div>
    `),
  };
}

// ── PASSWORD RESET ────────────────────────────────────────────
export function passwordResetEmail({
  name,
  resetUrl,
}: {
  name: string;
  resetUrl: string;
}): { subject: string; html: string } {
  return {
    subject: "Reset your ROSTER password",
    html: wrap(`
      ${heading("Reset your password.")}
      ${muted(`Hi ${name.split(" ")[0]},`)}
      <div style="height:16px;"></div>
      <p style="color:#94A3B8;font-size:14px;line-height:1.6;margin:0 0 28px 0;">
        We received a request to reset the password for your ROSTER account.
        Click the button below — this link expires in 1 hour.
      </p>
      <div style="text-align:center;margin-bottom:24px;">
        ${btn("Reset My Password →", resetUrl)}
      </div>
      ${muted("If you didn't request this, you can safely ignore this email.")}
    `),
  };
}

// ── E-SIGN: Signing request to recipient ─────────────────────
export function signingRequestEmail({
  recipientName,
  requesterName,
  contractTitle,
  contractType,
  signerUrl,
  expiresAt,
}: {
  recipientName: string;
  requesterName: string;
  contractTitle: string;
  contractType: string;
  signerUrl: string;
  expiresAt: string;
}): string {
  const expiryDate = new Date(expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  return wrap(`
    ${heading(`${requesterName} sent you a contract to sign.`)}
    ${muted(`Hi ${recipientName.split(" ")[0]},`)}
    <div style="height:16px;"></div>
    <p style="color:#94A3B8;font-size:14px;line-height:1.6;margin:0 0 24px 0;">
      <strong style="color:#F1F5F9;">${requesterName}</strong> has sent you
      <strong style="color:#F1F5F9;">"${contractTitle}"</strong> for your signature.
    </p>
    <div style="background:#1F2937;border-radius:10px;padding:20px;margin-bottom:28px;">
      <p style="font-size:12px;font-weight:700;color:#C9A84C;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px 0;">Contract Type</p>
      <p style="font-size:16px;font-weight:700;color:#F1F5F9;margin:0;">${contractType}</p>
    </div>
    <p style="color:#94A3B8;font-size:14px;line-height:1.6;margin:0 0 24px 0;">
      You'll be able to read the full contract before signing. The signing link expires on <strong style="color:#F1F5F9;">${expiryDate}</strong>.
    </p>
    <div style="text-align:center;margin-bottom:24px;">
      ${btn("Read & Sign →", signerUrl)}
    </div>
    ${muted("If the button doesn't work, paste this link into your browser:")}
    <p style="font-size:12px;color:#64748B;word-break:break-all;margin:4px 0 0 0;">${signerUrl}</p>
    <div style="height:24px;"></div>
    ${muted("ROSTER electronic signatures are legally binding under SA's ECTA and Nigeria's Electronic Transactions Act for most music-industry contracts.")}
  `);
}

// ── E-SIGN: Signature complete (to both parties) ─────────────
export function signingCompleteEmail({
  recipientName,
  requesterName,
  contractTitle,
  signedAt,
}: {
  recipientName: string;
  requesterName: string;
  contractTitle: string;
  signedAt: string;
}): string {
  const signedDate = new Date(signedAt).toLocaleString("en-GB", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
  return wrap(`
    ${heading("Contract signed. ✓")}
    <div style="height:8px;"></div>
    <p style="color:#94A3B8;font-size:14px;line-height:1.6;margin:0 0 24px 0;">
      <strong style="color:#F1F5F9;">"${contractTitle}"</strong> has been electronically signed.
    </p>
    <div style="background:#1F2937;border-radius:10px;padding:20px;margin-bottom:28px;">
      <p style="font-size:12px;font-weight:700;color:#10B981;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px 0;">Signature Captured</p>
      <p style="font-size:14px;color:#F1F5F9;margin:0 0 4px 0;"><strong>Signer:</strong> ${recipientName}</p>
      <p style="font-size:14px;color:#F1F5F9;margin:0 0 4px 0;"><strong>Sender:</strong> ${requesterName}</p>
      <p style="font-size:14px;color:#F1F5F9;margin:0;"><strong>Signed at:</strong> ${signedDate}</p>
    </div>
    <p style="color:#94A3B8;font-size:14px;line-height:1.6;margin:0 0 24px 0;">
      A complete audit trail (IP, browser, timestamps) is stored on ROSTER alongside the signed contract.
      Both parties can access the signed copy from the ROSTER signing inbox at any time.
    </p>
    ${muted("This electronic signature is legally binding under SA's ECTA Section 13 and Nigeria's Electronic Transactions Act for ordinary contracts.")}
  `);
}

// ── E-SIGN: Decline notification (to requester) ──────────────
export function signingDeclinedEmail({
  requesterName,
  recipientName,
  contractTitle,
  reason,
}: {
  requesterName: string;
  recipientName: string;
  contractTitle: string;
  reason: string;
}): string {
  return wrap(`
    ${heading("Signing declined.")}
    ${muted(`Hi ${requesterName.split(" ")[0]},`)}
    <div style="height:16px;"></div>
    <p style="color:#94A3B8;font-size:14px;line-height:1.6;margin:0 0 24px 0;">
      <strong style="color:#F1F5F9;">${recipientName}</strong> declined to sign
      <strong style="color:#F1F5F9;">"${contractTitle}"</strong>.
    </p>
    ${reason ? `
      <div style="background:#1F2937;border-radius:10px;padding:20px;margin-bottom:28px;">
        <p style="font-size:12px;font-weight:700;color:#EF4444;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px 0;">Reason given</p>
        <p style="font-size:14px;color:#F1F5F9;margin:0;line-height:1.6;">${reason}</p>
      </div>
    ` : muted("No reason was provided.")}
    <p style="color:#94A3B8;font-size:14px;line-height:1.6;margin:24px 0 0 0;">
      You can revise the contract in ROSTER and send a new signing request, or follow up with ${recipientName.split(" ")[0]} directly.
    </p>
  `);
}
