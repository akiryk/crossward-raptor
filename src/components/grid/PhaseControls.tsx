'use client';

import { useState } from 'react';
import type { Phase } from '../../engine/puzzle';

export function PhaseControls({
  phase,
  emptyCellCount,
  onEnterHints,
}: {
  phase: Phase;
  emptyCellCount: number;
  onEnterHints: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  function handleConfirm() {
    onEnterHints();
    setConfirming(false);
  }

  return (
    <div>
      <span data-testid="phase-badge">{phase}</span>
      {phase === 'grid' && !confirming && (
        <button
          type="button"
          data-testid="enter-hints-button"
          onClick={() => setConfirming(true)}
        >
          Enter hints phase
        </button>
      )}
      {phase === 'grid' && confirming && (
        <div data-testid="enter-hints-confirmation">
          <p>
            This cannot be undone. {emptyCellCount} empty cells will become black.
          </p>
          <button
            type="button"
            data-testid="enter-hints-confirm-button"
            onClick={handleConfirm}
          >
            Enter hints phase
          </button>
          <button
            type="button"
            data-testid="enter-hints-cancel-button"
            onClick={() => setConfirming(false)}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
