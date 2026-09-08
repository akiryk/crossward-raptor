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
        <p>This cannot be undone.</p>
        <Button
          variant="danger"
          data-testid="delete-confirm-button"
          onClick={handleConfirm}
          disabled={pending}
        >
          Delete puzzle
        </Button>
        <Button
          variant="quiet"
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
    <Button variant="danger" data-testid="delete-puzzle-button" onClick={() => setConfirming(true)}>
      Delete puzzle
    </Button>
  );
}
