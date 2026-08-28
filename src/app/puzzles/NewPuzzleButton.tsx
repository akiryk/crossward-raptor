'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createPuzzle } from './actions';

export function NewPuzzleButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    const { id } = await createPuzzle();
    router.push(`/puzzles/${id}`);
  }

  return (
    <button
      type="button"
      data-testid="new-puzzle-button"
      onClick={handleClick}
      disabled={pending}
    >
      New Puzzle
    </button>
  );
}
