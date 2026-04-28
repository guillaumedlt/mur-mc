import { Resend } from "resend";

const FROM = "Monte Carlo Work <notifications@montecarlowork.com>";

let resend: Resend | null = null;

function getResend(): Resend | null {
  if (resend) return resend;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error("[email] RESEND_API_KEY not configured");
    return null;
  }
  resend = new Resend(key);
  return resend;
}

/**
 * Send an email via Resend. Fire-and-forget — logs errors but never throws.
 */
export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const r = getResend();
  if (!r) return false;

  try {
    const { error } = await r.emails.send({
      from: FROM,
      to: input.to,
      subject: input.subject,
      html: input.html,
    });

    if (error) {
      console.error("[email] Resend error:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[email] Send failed:", err);
    return false;
  }
}

/**
 * Send to multiple recipients (batch). Max 100 per call.
 */
export async function sendEmailBatch(
  emails: Array<{ to: string; subject: string; html: string }>,
): Promise<number> {
  let sent = 0;
  for (const email of emails) {
    const ok = await sendEmail(email);
    if (ok) sent++;
  }
  return sent;
}
