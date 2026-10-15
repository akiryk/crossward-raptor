import Link from 'next/link';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { SignOutButton } from '@/components/auth/SignOutButton';

export async function Header() {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <header
      data-testid="app-header"
      className="bg-foreground text-background font-display px-6 py-4 text-xl flex items-center justify-between"
    >
      <Link href="/" data-testid="home-link">
        Crossward
      </Link>
      {session && <SignOutButton />}
    </header>
  );
}
