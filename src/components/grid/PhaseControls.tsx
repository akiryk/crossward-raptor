'use client';

import { useState } from 'react';
import type { Phase } from '../../engine/puzzle';
import { Button } from '../ui/Button';

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
        <Button data-testid="enter-hints-button" onClick={() => setConfirming(true)}>
          Enter hints phase
        </Button>
      )}
      {phase === 'grid' && confirming && (
        <div data-testid="enter-hints-confirmation">
          <p>
            This cannot be undone. {emptyCellCount} empty cells will become black.
          </p>
          <Button variant="danger" data-testid="enter-hints-confirm-button" onClick={handleConfirm}>
            Enter hints phase
          </Button>
          <Button variant="quiet" data-testid="enter-hints-cancel-button" onClick={() => setConfirming(false)}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
