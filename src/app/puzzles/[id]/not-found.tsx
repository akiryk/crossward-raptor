import Link from 'next/link';
import { Title } from '@/components/ui/Title';

export default function PuzzleNotFound() {
  return (
    <div data-testid="puzzle-not-found" className="p-6">
      <Title size={2} as="h1">This puzzle is no longer available.</Title>
      <p className="mt-2 text-body-normal text-muted">It may have been deleted, or the link may be wrong.</p>
      <p className="mt-4 text-body-normal">
        <Link href="/puzzles" className="text-body-normal text-button-fill underline transition-colors duration-150 ease-out hover:text-button-hover">
          Back to puzzles
        </Link>
      </p>
    </div>
  );
}
