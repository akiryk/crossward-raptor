import { Resend } from 'resend';

// Default for a verified domain. RESEND_FROM_EMAIL can select Resend's testing
// sender for personal sign-in, or another verified sender (see README).
const FROM = 'Crossward <login@crossward.app>';

type Message = {
  to: string;
  subject: string;
  text: string;
  /** Thrown when the local inbox can't take the message (no link in it). */
  localFailure: string;
  /** Thrown when Resend can't deliver it (no link in it). */
  providerFailure: string;
};

// Local development always captures mail, even with an inherited Resend key.
// Tests never deliver; production/hosted runs keep keyless delivery disabled.
async function deliver({ to, subject, text, localFailure, providerFailure }: Message): Promise<void> {
  if (process.env.NODE_ENV === 'test') return;

  if (process.env.NODE_ENV === 'development' && !process.env.VERCEL) {
    try {
      const response = await fetch('http://127.0.0.1:8025/api/v1/send', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          From: { Email: 'login@crossward.app', Name: 'Crossward' },
          To: [{ Email: to }],
          Subject: subject,
          Text: text,
        }),
        signal: AbortSignal.timeout(5000),
        redirect: 'error',
      });
      if (!response.ok) throw new Error('Inbox rejected delivery');
    } catch {
      // Never include the message, supplied URL, or transport response in logs.
      throw new Error(localFailure);
    }
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  try {
    const resend = new Resend(apiKey);
    const from = process.env.RESEND_FROM_EMAIL?.trim() || FROM;
    const { error } = await resend.emails.send({ from, to, subject, text });
    if (error) throw new Error('Provider rejected delivery');
  } catch {
    throw new Error(providerFailure);
  }
}

export async function sendMagicLink(email: string, url: string): Promise<void> {
  await deliver({
    to: email,
    subject: 'Your Crossward sign-in link',
    text: `Sign in to Crossward by opening this link:\n\n${url}\n\nIt expires in 15 minutes and can be used once.`,
    localFailure: 'Could not deliver the sign-in link to the local inbox. Check that Mailpit is running and try again.',
    providerFailure: 'Could not deliver the sign-in link. Please try again.',
  });
}

// Story 23-S5: the link that confirms a new email, sent to the new address
// (lib/auth's email verification sender). Same routes as the sign-in link.
export async function sendEmailChangeLink(email: string, url: string): Promise<void> {
  await deliver({
    to: email,
    subject: 'Confirm your new Crossward email',
    text:
      `Confirm your new email for Crossward by opening this link:\n\n${url}\n\n` +
      'It expires in 15 minutes. Until then, sign in with your current email.\n\n' +
      "If you didn't ask for this, ignore this email.",
    localFailure: 'Could not deliver the confirmation link to the local inbox. Check that Mailpit is running and try again.',
    providerFailure: 'Could not deliver the confirmation link. Please try again.',
  });
}
