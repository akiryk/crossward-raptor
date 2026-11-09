'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAnySession } from '@/lib/require-session';
import { usernameError } from '@/lib/username';

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
