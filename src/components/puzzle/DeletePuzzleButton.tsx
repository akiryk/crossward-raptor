'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { deletePuzzle } from '../../app/puzzles/actions';
import { Button } from '../ui/Button';

export function DeletePuzzleButton({ puzzleId }: { puzzleId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleConfirm() {
    setPending(true);
    await deletePuzzle(puzzleId);
    router.push('/puzzles');
  }

  if (confirming) {
    return (
      <div data-testid="delete-confirmation">
        <p className="text-help text-ink-2">This cannot be undone.</p>
        <Button
          data-testid="delete-confirm-button"
          onClick={handleConfirm}
          disabled={pending}
        >
          Delete puzzle
        </Button>
        <Button
          variant="alternate"
          data-testid="delete-cancel-button"
          onClick={() => setConfirming(false)}
          disabled={pending}
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button data-testid="delete-puzzle-button" onClick={() => setConfirming(true)}>
      Delete puzzle
    </Button>
  );
}
