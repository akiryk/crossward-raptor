import { redirect } from 'next/navigation';
import { currentSession, hasUsername } from '@/lib/require-session';
import { generateUsername } from '@/lib/username-generator';
import { SignInForm } from '@/components/auth/SignInForm';
import { UsernameStep } from '@/components/auth/UsernameStep';
import { Title } from '@/components/ui/Title';

export default async function Home() {
  const session = await currentSession();
  if (session && hasUsername(session)) redirect('/puzzles');
  // Story 23-S3: a signed-in account without a username sees the username
  // step here, and nowhere else (every other page sends it back to `/`).
  const onStep = session !== null;

  // Story 14-S1: one container below the masthead, a hairline down its left
  // edge, its content 20px right of it.
  return (
    <div
      data-testid="front-door"
      className="mx-auto mt-[90px] flex min-h-[630px] w-full max-w-[700px] flex-col border-l border-line-muted pl-5"
    >
      <Title size={1} color="muted">
        <span className="block">Build a puzzle.</span>
        <span className="block">Or play a puzzle.</span>
        <span className="block text-primary">{onStep ? 'Create a username.' : 'Log in to start.'}</span>
      </Title>
      {/* The suggestion is made here, on the server, so the first paint holds it. */}
      {onStep ? <UsernameStep suggestion={generateUsername()} /> : <SignInForm />}
    </div>
  );
}
