'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createPuzzle } from './actions';
import { Button } from '@/components/ui/Button';

export function NewPuzzleButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    const { id } = await createPuzzle();
    router.push(`/puzzles/${id}`);
  }

  return (
    <Button data-testid="new-puzzle-button" onClick={handleClick} disabled={pending}>
      New Puzzle
    </Button>
  );
}
