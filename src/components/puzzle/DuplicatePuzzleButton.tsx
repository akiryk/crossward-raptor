'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { duplicatePuzzle } from '../../app/puzzles/actions';

export function DuplicatePuzzleButton({ puzzleId }: { puzzleId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    const { id } = await duplicatePuzzle(puzzleId);
    router.push(`/puzzles/${id}`);
  }

  return (
    <button
      type="button"
      data-testid="duplicate-puzzle-button"
      onClick={handleClick}
      disabled={pending}
    >
      Duplicate puzzle
    </button>
  );
}
