import { signJWT } from 'better-auth/crypto';
import { ownershipTestClient } from './ownership';

// Editable 23-S5 plumbing, not frozen acceptance.
//
// The E2E harness sends no email (keyless production), and Better Auth keeps
// no copy of an email-change link: its token is a signed JWT, not a database
// row. So this builds the link the app would have mailed, exactly as Better
// Auth 1.7's change-email builds it for the new-address flow (payload
// `{ email: <current>, updateTo: <new>, requestType:
// 'change-email-verification' }`, HS256 with the harness's test-only
// BETTER_AUTH_SECRET from scripts/e2e-env.mjs, 15 minutes), so the browser
// cases can follow it. That the app really mails this link, to the new
// address, is proven in-process by src/lib/auth.change-email.test.ts.
// Adjust here if the installed Better Auth changes its token.

export async function emailChangeLink(currentEmail: string, newEmail: string, expiresIn = 15 * 60): Promise<string> {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error('BETTER_AUTH_SECRET is not set: run through the E2E harness.');
  const token = await signJWT(
    {
      email: currentEmail.toLowerCase(),
      updateTo: newEmail.toLowerCase(),
      requestType: 'change-email-verification',
    },
    secret,
    expiresIn,
  );
  return `/api/auth/verify-email?token=${encodeURIComponent(token)}&callbackURL=${encodeURIComponent('/puzzles')}`;
}

/** The account's current email and username, by id. */
export async function readAccountById(id: string): Promise<{ email: string; displayName: string | null } | null> {
  const client = ownershipTestClient();
  try {
    return await client.user.findUnique({ where: { id }, select: { email: true, displayName: true } });
  } finally {
    await client.$disconnect();
  }
}
