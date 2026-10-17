import { Resend } from 'resend';

// Default for a verified domain. RESEND_FROM_EMAIL can select Resend's testing
// sender for personal sign-in, or another verified sender (see README).
const FROM = 'Crossward <login@crossward.app>';

// Local development always captures mail, even with an inherited Resend key.
// Tests never deliver; production/hosted runs keep keyless delivery disabled.
export async function sendMagicLink(email: string, url: string): Promise<void> {
  if (process.env.NODE_ENV === 'test') return;

  const subject = 'Your Crossward sign-in link';
  const text = `Sign in to Crossward by opening this link:\n\n${url}\n\nIt expires in 15 minutes and can be used once.`;

  if (process.env.NODE_ENV === 'development' && !process.env.VERCEL) {
    try {
      const response = await fetch('http://127.0.0.1:8025/api/v1/send', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          From: { Email: 'login@crossward.app', Name: 'Crossward' },
          To: [{ Email: email }],
          Subject: subject,
          Text: text,
        }),
        signal: AbortSignal.timeout(5000),
        redirect: 'error',
      });
      if (!response.ok) throw new Error('Inbox rejected delivery');
    } catch {
      // Never include the message, supplied URL, or transport response in logs.
      throw new Error('Could not deliver the sign-in link to the local inbox. Check that Mailpit is running and try again.');
    }
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  try {
    const resend = new Resend(apiKey);
    const from = process.env.RESEND_FROM_EMAIL?.trim() || FROM;
    const { error } = await resend.emails.send({ from, to: email, subject, text });
    if (error) throw new Error('Provider rejected delivery');
  } catch {
    throw new Error('Could not deliver the sign-in link. Please try again.');
  }
}
