import { AsyncLocalStorage } from 'node:async_hooks';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { magicLink } from 'better-auth/plugins';
import { prisma } from '@/lib/prisma';
import { sendEmailChangeLink, sendMagicLink } from '@/lib/email';

// Better Auth validates the origin of state-changing requests against its
// base URL plus these. The e2e web server runs on :3100 while dev runs on
// :3000 (playwright.config.ts / next dev), so both localhost origins are
// trusted explicitly; production's origin is BETTER_AUTH_URL, trusted
// automatically.
const trustedOrigins = ['http://localhost:3000', 'http://localhost:3100'];

// Story 23-S5: what happened to the confirmation link during one
// startEmailChange call. Better Auth awaits its sender but swallows a failure
// (and sends nothing at all for an address another account has) while still
// answering success, so the sender records both facts here for the wrapper.
const emailChangeDelivery = new AsyncLocalStorage<{ called: boolean; failed: boolean }>();

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  trustedOrigins,
  user: {
    // Story 23-S3: the username. Declared so the session's user carries it
    // (read with the session, no extra query) for the username guard in
    // lib/require-session. `input: false`: Better Auth refuses it from any
    // client input (update-user, sign-up), so the username step's save
    // (app/account-actions) is its only writer. The magic link no longer
    // carries a username; Better Auth's own `name` is unread by the app.
    additionalFields: {
      displayName: { type: 'string', required: false, input: false },
    },
    // Story 23-S5: an email change is confirmed by the new address only. With
    // neither `sendChangeEmailConfirmation` (a first link to the old address)
    // nor `updateEmailWithoutVerification`, Better Auth mails a link to the new
    // address and changes the email when /verify-email is followed.
    changeEmail: { enabled: true },
  },
  emailVerification: {
    // As short-lived as a sign-in link: following it can sign a browser in.
    expiresIn: 60 * 15,
    // Reached only by change-email (its HTTP route and send-verification-email
    // are closed below; no password or social sign-up is enabled). Better Auth
    // passes the new address as `user.email`.
    sendVerificationEmail: async ({ user, url }) => {
      const delivery = emailChangeDelivery.getStore();
      if (delivery) delivery.called = true;
      try {
        await sendEmailChangeLink(user.email, url);
      } catch (error) {
        if (delivery) delivery.failed = true;
        throw error;
      }
    },
  },
  // Story 23-S5: only the app's username-gated server action
  // (app/account-actions changeEmail, through startEmailChange below) starts
  // an email change; nobody can ask the app to mail an unverified account.
  // /verify-email stays open for the link.
  disabledPaths: ['/change-email', '/send-verification-email'],
  session: {
    // 30-day sessions that slide forward on activity: any use more than a
    // day after the last refresh extends the expiry by another 30 days, so
    // an active user effectively never signs in again while an abandoned
    // device expires within a month (epic 09 decision).
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
    // Server-component reads cannot write browser cookies. Let the browser
    // session observer perform renewal through Better Auth's POST response.
    deferSessionRefresh: true,
  },
  plugins: [
    magicLink({
      // Single-use (consumed atomically on first verify) and short-lived:
      // the link is the sensitive artifact, not the session.
      expiresIn: 60 * 15,
      sendMagicLink: async ({ email, url }) => {
        await sendMagicLink(email, url);
      },
    }),
  ],
});

/**
 * Story 23-S5: asks Better Auth to mail `newEmail` a link that changes the
 * signed-in account's email (the session in `headers`). Resolves with nothing
 * once the link was delivered. Rejects if delivery failed, or if Better Auth
 * answered success without sending (an address another account has); an
 * address Better Auth's own validation refuses rejects with its 400 APIError.
 */
export async function startEmailChange(headers: Headers, newEmail: string): Promise<void> {
  const delivery = { called: false, failed: false };
  await emailChangeDelivery.run(delivery, () =>
    auth.api.changeEmail({ headers, body: { newEmail, callbackURL: '/puzzles' } }),
  );
  if (!delivery.called || delivery.failed) {
    throw new Error('The email change confirmation link was not delivered.');
  }
}
