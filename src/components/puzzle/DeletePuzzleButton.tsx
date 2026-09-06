'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { deletePuzzle } from '../../app/puzzles/actions';

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
        <button
          type="button"
          data-testid="delete-confirm-button"
          onClick={handleConfirm}
          disabled={pending}
        >
          Delete puzzle
        </button>
        <button
          type="button"
          data-testid="delete-cancel-button"
          onClick={() => setConfirming(false)}
          disabled={pending}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button type="button" data-testid="delete-puzzle-button" onClick={() => setConfirming(true)}>
      Delete puzzle
    </button>
  );
}
