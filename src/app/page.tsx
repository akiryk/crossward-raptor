import Link from 'next/link';

export default function Home() {
  return (
    <p className="p-6">
      Crossward — a crossword puzzle builder.{' '}
      <Link href="/puzzles">Puzzles</Link>
    </p>
  );
}
