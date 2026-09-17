import Link from 'next/link';

export function Header() {
  return (
    <header
      data-testid="app-header"
      className="bg-foreground text-background font-display px-6 py-4 text-xl"
    >
      <Link href="/" data-testid="home-link">
        Crossward
      </Link>
    </header>
  );
}
