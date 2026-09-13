'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPuzzle } from './actions';
import { Button } from '@/components/ui/Button';
import { NewPuzzleDialog } from '@/components/puzzle/NewPuzzleDialog';
import type { PuzzleSize } from '@/lib/puzzle-size';

export function NewPuzzleButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // isReady flips once this component has committed, which is exactly
    // when its onClick becomes live -- before that, hydration hasn't
    // wired the handler yet and a click on the server-rendered markup is
    // silently dropped. Same pattern as PuzzleGridEditor's data-ready.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsReady(true);
  }, []);

  async function handleCreate(input: { title: string; size: PuzzleSize }) {
    setPending(true);
    const { id } = await createPuzzle(input);
    router.push(`/puzzles/${id}`);
  }

  return (
    <div data-testid="new-puzzle" data-ready={isReady}>
      <Button data-testid="new-puzzle-button" onClick={() => setOpen(true)} disabled={pending}>
        New Puzzle
      </Button>
      {open && <NewPuzzleDialog onCancel={() => setOpen(false)} onCreate={handleCreate} />}
    </div>
  );
}
