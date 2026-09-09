'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createPuzzle } from './actions';
import { Button } from '@/components/ui/Button';
import { NewPuzzleDialog } from '@/components/puzzle/NewPuzzleDialog';
import type { PuzzleSize } from '@/lib/puzzle-size';

export function NewPuzzleButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleCreate(input: { title: string; size: PuzzleSize }) {
    setPending(true);
    const { id } = await createPuzzle(input);
    router.push(`/puzzles/${id}`);
  }

  return (
    <>
      <Button data-testid="new-puzzle-button" onClick={() => setOpen(true)} disabled={pending}>
        New Puzzle
      </Button>
      {open && <NewPuzzleDialog onCancel={() => setOpen(false)} onCreate={handleCreate} />}
    </>
  );
}
