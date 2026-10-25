import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { SignInForm } from '@/components/auth/SignInForm';
import { Title } from '@/components/ui/Title';

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect('/puzzles');

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
        <span className="block text-primary">Log in to start.</span>
      </Title>
      <SignInForm />
    </div>
  );
}
