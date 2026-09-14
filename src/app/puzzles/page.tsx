import Link from 'next/link';
import { listPuzzles } from './actions';
import { NewPuzzleButton } from './NewPuzzleButton';
import { puzzleStatus } from '@/lib/puzzle-status';

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default async function PuzzlesPage() {
  const puzzles = await listPuzzles();

  return (
    <div className="p-6">
      <h1
        data-testid="page-heading"
        className="font-display text-headline [font-weight:var(--weight-bold)]"
      >
        Puzzles
      </h1>
      <NewPuzzleButton />
      <ul data-testid="puzzle-list">
        {puzzles.map((puzzle) => {
          const isPublished = puzzle.publishedAt !== null;
          const status = puzzleStatus(puzzle);
          return (
            <li key={puzzle.id}>
              <Link
                href={`/puzzles/${puzzle.id}`}
                data-testid="puzzle-list-item"
                data-phase={puzzle.phase}
                data-hints-complete={puzzle.hintsComplete ? 'true' : 'false'}
                data-updated-at={puzzle.updatedAt.toISOString()}
                data-published={isPublished ? 'true' : 'false'}
                data-visibility={puzzle.visibility}
                data-published-at={isPublished ? puzzle.publishedAt!.toISOString() : undefined}
                className="block cursor-pointer px-3 py-2 text-body hover:bg-hover-tint"
              >
                {puzzle.title} — {formatDate(puzzle.updatedAt)} — {status.label}
                {isPublished && ` — ${formatDate(puzzle.publishedAt!)}`}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
