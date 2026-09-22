import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { magicLink } from 'better-auth/plugins';
import { prisma } from '@/lib/prisma';
import { sendMagicLink } from '@/lib/email';

// Better Auth validates the origin of state-changing requests against its
// base URL plus these. The e2e web server runs on :3100 while dev runs on
// :3000 (playwright.config.ts / next dev), so both localhost origins are
// trusted explicitly; production's origin is BETTER_AUTH_URL, trusted
// automatically.
const trustedOrigins = ['http://localhost:3000', 'http://localhost:3100'];

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
