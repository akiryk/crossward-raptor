'use client';

import { authClient } from '@/lib/auth-client';
import { MastheadAction } from '@/components/layout/Masthead';

export function SignOutButton() {
  async function handleSignOut() {
    await authClient.signOut();
    // A full load, not a client navigation: the root layout's masthead and the
    // router's cached signed-in pages would otherwise outlive the session.
    window.location.assign('/');
  }

  return (
    <MastheadAction data-testid="sign-out" onClick={handleSignOut}>
      Sign out
    </MastheadAction>
  );
}
