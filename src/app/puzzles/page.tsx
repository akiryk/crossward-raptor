import Link from 'next/link';
import { listPuzzles } from './actions';
import { NewPuzzleButton } from './NewPuzzleButton';

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function statusText(phase: 'grid' | 'hints', hintsComplete: boolean): string {
  if (phase === 'grid') return 'Grid';
  return hintsComplete ? 'Hints — complete' : 'Hints — incomplete';
}

export default async function PuzzlesPage() {
  const puzzles = await listPuzzles();

  return (
    <div className="p-6">
      <h1>Puzzles</h1>
      <NewPuzzleButton />
      <ul data-testid="puzzle-list">
        {puzzles.map((puzzle) => (
          <li key={puzzle.id}>
            <Link
              href={`/puzzles/${puzzle.id}`}
              data-testid="puzzle-list-item"
              data-phase={puzzle.phase}
              data-hints-complete={puzzle.hintsComplete ? 'true' : 'false'}
              data-updated-at={puzzle.updatedAt.toISOString()}
            >
              {puzzle.title} — {formatDate(puzzle.updatedAt)} —{' '}
              {statusText(puzzle.phase, puzzle.hintsComplete)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
