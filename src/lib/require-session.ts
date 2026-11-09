import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

// Story 23-S3: the one guard. Every page and server action that needs a
// signed-in account calls `requireSession()`, which admits only an account
// with a username; an account without one is refused exactly like no session
// (sent to `/`, where it sees the username step). `requireAnySession()` admits
// any valid session and is used only by the username save.
//
// The username (`displayName`) is declared to Better Auth (lib/auth.ts), so
// `getSession` returns it with the session's user, read from the database
// with the session: no extra query. Enabling Better Auth's session cookie
// cache would make it lag behind a save; revisit this guard before doing so.

export type Session = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

/** Better Auth's session for this request, or null. The app's only reader. */
export async function currentSession(): Promise<Session | null> {
  return auth.api.getSession({ headers: await headers() });
}

/** True when the session's account has a username: a string not blank once trimmed. */
export function hasUsername(session: { user: unknown } | null | undefined): boolean {
  const user = session?.user as { displayName?: unknown } | null | undefined;
  const name = user?.displayName;
  return typeof name === 'string' && name.trim() !== '';
}

/** A valid session whose account has a username; anything else goes to `/`. */
export async function requireSession(): Promise<Session> {
  const session = await currentSession();
  if (!session || !hasUsername(session)) redirect('/');
  return session;
}

/** Any valid session, with or without a username. Only for saving a username. */
export async function requireAnySession(): Promise<Session> {
  const session = await currentSession();
  if (!session) redirect('/');
  return session;
}
