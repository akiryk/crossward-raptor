import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { magicLink } from 'better-auth/plugins';
import { createAuthMiddleware } from 'better-auth/api';
import { prisma } from '@/lib/prisma';
import { sendMagicLink } from '@/lib/email';
import { usernameError } from '@/lib/username';

// Better Auth validates the origin of state-changing requests against its
// base URL plus these. The e2e web server runs on :3100 while dev runs on
// :3000 (playwright.config.ts / next dev), so both localhost origins are
// trusted explicitly; production's origin is BETTER_AUTH_URL, trusted
// automatically.
const trustedOrigins = ['http://localhost:3000', 'http://localhost:3100'];

const VERIFY_PATH = '/magic-link/verify';

/** The username a magic link carries, if it passes the form's rules. */
function linkUsername(value: string): string | null {
  try {
    const { name } = JSON.parse(value) as { name?: unknown };
    return usernameError(name) ? null : (name as string).trim();
  } catch {
    return null;
  }
}

/**
 * Story 14-S1: the first username wins. Give the account the link's username
 * only while its stored one is blank, compared against the exact value read
 * so a concurrent sign-in can't replace a username already captured.
 */
async function captureUsername(userId: string, username: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { displayName: true } });
  if (!user || user.displayName?.trim()) return;
  await prisma.user.updateMany({
    where: { id: userId, displayName: user.displayName },
    data: { displayName: username },
  });
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  trustedOrigins,
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
  hooks: {
    // Verification consumes the link's token, so its username is read first
    // and handed to the after hook, which runs once a session exists.
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== VERIFY_PATH || typeof ctx.query?.token !== 'string') return;
      const stored = await ctx.context.internalAdapter.findVerificationValue(ctx.query.token);
      const username = stored ? linkUsername(stored.value) : null;
      if (username) return { context: { linkUsername: username } };
    }),
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== VERIFY_PATH) return;
      const username = (ctx as { linkUsername?: unknown }).linkUsername;
      const userId = ctx.context.newSession?.user.id;
      if (typeof username === 'string' && userId) await captureUsername(userId, username);
    }),
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
