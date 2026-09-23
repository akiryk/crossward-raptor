import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { SignInForm } from '@/components/auth/SignInForm';

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect('/puzzles');

  return (
    <div data-testid="front-door" className="p-6">
      <h1>Crossward</h1>
      <p>Build and solve crossword puzzles.</p>
      <SignInForm />
    </div>
  );
}
