import { notFound } from 'next/navigation';
import { PlayPuzzle } from '@/components/play/PlayPuzzle';
import { loadPlayPuzzle } from '../../actions';

export default async function PlayPuzzlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const puzzle = await loadPlayPuzzle(id);
  if (!puzzle) notFound();

  return <PlayPuzzle key={puzzle.id} initialPuzzle={puzzle} />;
}
