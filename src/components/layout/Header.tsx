import { currentSession } from '@/lib/require-session';
import { SignOutButton } from '@/components/auth/SignOutButton';
import { SessionRenewal } from '@/components/auth/SessionRenewal';
import { Masthead } from '@/components/layout/Masthead';

export async function Header() {
  const session = await currentSession();

  return (
    <Masthead
      data-testid="app-header"
      homeLinkTestId="home-link"
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
