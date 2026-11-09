'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { isAPIError } from 'better-auth/api';
import { startEmailChange } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireAnySession, requireSession } from '@/lib/require-session';
import { emailError, usernameError } from '@/lib/username';

// Story 23-S3: saving a username, the one action an account without a
// username may call. It changes only the signed-in account's own
// displayName, under the username rules, then goes on to /puzzles. A later
// save replaces an earlier one (the latest explicit choice wins).

export async function saveUsername(value: string): Promise<{ error: string }> {
  const session = await requireAnySession();
  const problem = usernameError(value);
  if (problem) return { error: problem };
  await prisma.user.update({
    where: { id: session.user.id },
    data: { displayName: value.trim() },
  });
  redirect('/puzzles');
}

// Story 23-S4: changing a username from Account details. Only an account that
// already has a username (requireSession; a nameless one is refused like no
// session and sent to /, where the step is its way in). It changes only the
// caller's own displayName, under the same rules, and returns without
// navigating, so the page the user is on stays.
export async function changeUsername(value: string): Promise<{ error: string } | { ok: true }> {
  const session = await requireSession();
  const problem = usernameError(value);
  if (problem) return { error: problem };
  await prisma.user.update({
    where: { id: session.user.id },
    data: { displayName: value.trim() },
  });
  return { ok: true };
}

const SAME_EMAIL = "Oops! That's already your email.";
const EMAIL_IN_USE = 'Oops! Another account already uses that email.';
const BAD_EMAIL = "Oops! That doesn't look like an email address.";
const SEND_FAILED = 'Could not send the confirmation link. Please try again.';

// Story 23-S5: asking to change the email from Account details. Only an
// account with a username (requireSession). It never writes the email: it asks
// Better Auth (lib/auth startEmailChange) to mail a confirmation link to the
// new address, and the email changes only when that link is followed. Better
// Auth stores emails lowercased; it would silently send nothing for an address
// another account has, so that is checked here and reported.
export async function changeEmail(value: string): Promise<{ error: string } | { ok: true }> {
  const session = await requireSession();
  const problem = emailError(value);
  if (problem) return { error: problem };
  const email = value.trim().toLowerCase();
  if (email === session.user.email.toLowerCase()) return { error: SAME_EMAIL };
  const holder = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (holder) return { error: holder.id === session.user.id ? SAME_EMAIL : EMAIL_IN_USE };
  try {
    await startEmailChange(await headers(), email);
  } catch (error) {
    // Better Auth's own email rule is stricter than emailError (e.g. "a..b@x.co").
    if (isAPIError(error) && error.statusCode === 400) return { error: BAD_EMAIL };
    return { error: SEND_FAILED };
  }
  return { ok: true };
}
