/**
 * Sends an email with an optional file attachment via Resend
 * (https://resend.com). Requires RESEND_API_KEY and RESEND_FROM_EMAIL env
 * vars. Throws with a clear message on failure rather than swallowing it —
 * callers (the cron job) should catch and log per-subscription, so one
 * bad email doesn't stop the rest of the batch.
 */
export async function sendEmail({ to, subject, html, attachment }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    throw new Error("RESEND_API_KEY / RESEND_FROM_EMAIL are not configured.");
  }

  const body = {
    from,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
  };

  if (attachment) {
    body.attachments = [
      {
        filename: attachment.filename,
        content: attachment.buffer.toString("base64"),
      },
    ];
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Resend API error (${res.status}): ${text}`);
  }

  return res.json();
}
