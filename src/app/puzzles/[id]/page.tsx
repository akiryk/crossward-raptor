import { notFound } from 'next/navigation';
import { PuzzleGrid } from '@/components/grid/PuzzleGrid';
import { loadPuzzle } from '../actions';

export default async function PuzzleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const puzzle = await loadPuzzle(id);

  if (!puzzle) {
    notFound();
  }

  return (
    <div className="p-6">
      <h1 data-testid="puzzle-title">{puzzle.title}</h1>
      <p data-testid="puzzle-phase">{puzzle.phase}</p>
      <PuzzleGrid grid={puzzle.grid} />
    </div>
  );
}
