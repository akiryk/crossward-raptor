'use client';

import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { MastheadAction } from '@/components/layout/Masthead';

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await authClient.signOut();
    router.push('/');
  }

  return (
    <MastheadAction data-testid="sign-out" onClick={handleSignOut}>
      Sign out
    </MastheadAction>
  );
}
