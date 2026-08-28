import Link from 'next/link';
import { listPuzzles } from './actions';
import { NewPuzzleButton } from './NewPuzzleButton';

export default async function PuzzlesPage() {
  const puzzles = await listPuzzles();

  return (
    <div className="p-6">
      <h1>Puzzles</h1>
      <NewPuzzleButton />
      <ul data-testid="puzzle-list">
        {puzzles.map((puzzle) => (
          <li key={puzzle.id}>
            <Link href={`/puzzles/${puzzle.id}`} data-testid="puzzle-list-item">
              {puzzle.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
