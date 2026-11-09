import { currentSession, hasUsername } from '@/lib/require-session';
import { SignOutButton } from '@/components/auth/SignOutButton';
import { SessionRenewal } from '@/components/auth/SessionRenewal';
import { AccountDetails } from '@/components/auth/AccountDetails';
import { Masthead, MastheadDivider } from '@/components/layout/Masthead';

export async function Header() {
  const session = await currentSession();

  return (
    <Masthead
      data-testid="app-header"
      homeLinkTestId="home-link"
      action={
        session && (
          <div className="flex items-center">
            <SessionRenewal />
            {/* 23-S4: Account only for an account with a username (not on the step). */}
            {hasUsername(session) && (
              <>
                <AccountDetails
                  username={(session.user as { displayName: string }).displayName}
                  email={session.user.email}
                />
                <MastheadDivider />
              </>
            )}
            <SignOutButton />
          </div>
        )
      }
    />
  );
}
