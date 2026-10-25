import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { SignOutButton } from '@/components/auth/SignOutButton';
import { SessionRenewal } from '@/components/auth/SessionRenewal';
import { Masthead } from '@/components/layout/Masthead';

export async function Header() {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <Masthead
      data-testid="app-header"
      action={
        session && (
          <>
            <SessionRenewal />
            <SignOutButton />
          </>
        )
      }
    />
  );
}
