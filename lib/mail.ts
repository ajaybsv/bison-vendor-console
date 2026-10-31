import "server-only";

type Mail = { to: string; toName?: string; subject: string; text: string; html: string };

/** Sends one email through Mailjet's v3.1 Send API. Throws if Mailjet isn't configured or rejects it. */
export async function sendMail({ to, toName, subject, text, html }: Mail): Promise<void> {
  const { MAILJET_API_KEY, MAILJET_API_SECRET, MAILJET_EMAIL } = process.env;
  if (!MAILJET_API_KEY || !MAILJET_API_SECRET || !MAILJET_EMAIL) {
    throw new Error("Mailjet is not configured (MAILJET_API_KEY, MAILJET_API_SECRET, MAILJET_EMAIL)");
  }
  const res = await fetch("https://api.mailjet.com/v3.1/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic " + Buffer.from(`${MAILJET_API_KEY}:${MAILJET_API_SECRET}`).toString("base64"),
    },
    body: JSON.stringify({
      Messages: [
        {
          From: { Email: MAILJET_EMAIL, Name: "BISON" },
          To: [{ Email: to, Name: toName ?? to }],
          Subject: subject,
          TextPart: text,
          HTMLPart: html,
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Mailjet send failed: ${res.status} ${await res.text()}`);
}

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export function passwordResetEmail(name: string, link: string): Omit<Mail, "to" | "toName"> {
  return {
    subject: "Reset your BISON password",
    text: `Hi ${name},\n\nUse this link to set a new BISON password. It works once and expires in 1 hour:\n${link}\n\nIf you didn't ask for this, you can ignore this email — your password won't change.`,
    html: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:22px;color:#0d1b2e;max-width:520px">
  <p style="font-size:20px;font-weight:600;color:#2455F5;margin:0 0 20px">BISON</p>
  <p>Hi ${escape(name)},</p>
  <p>Use the button below to set a new BISON password. The link works once and expires in 1 hour.</p>
  <p style="margin:24px 0"><a href="${escape(link)}" style="background:#2455F5;color:#ffffff;text-decoration:none;font-weight:600;padding:10px 16px;border-radius:8px;display:inline-block">Reset password</a></p>
  <p style="color:#455670;font-size:13px">If you didn't ask for this, you can ignore this email — your password won't change.</p>
</div>`,
  };
}
