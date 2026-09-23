import { Resend } from 'resend';

// The verified sender. Resend requires this address to live on a domain
// verified in the Resend dashboard (see README) before it can deliver to
// anyone but the account owner.
const FROM = 'Crossward <login@crossward.app>';

/**
 * Deliver a magic-link email through Resend.
 *
 * A deliberate no-op when `RESEND_API_KEY` is unset: local dev and the e2e
 * test env have no key, so no email is ever sent there while Better Auth
 * still stores the verification token (the spec reads it from the database).
 * Key-presence, not `NODE_ENV`, is the signal — a keyless run should never
 * silently attempt a send.
 */
export async function sendMagicLink(email: string, url: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Your Crossward sign-in link',
    text: `Sign in to Crossward by opening this link:\n\n${url}\n\nIt expires in 15 minutes and can be used once.`,
  });
  if (error) {
    throw new Error(`sendMagicLink failed: ${error.name} ${error.message}`);
  }
}
