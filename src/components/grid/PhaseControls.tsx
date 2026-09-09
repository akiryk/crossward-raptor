'use client';

import { useState } from 'react';
import type { Phase } from '../../engine/puzzle';
import { Button } from '../ui/Button';
import { Stepper } from './Stepper';
import { stepStates } from '../../lib/stepper';
import type { StepId } from '../../lib/stepper';

export function PhaseControls({
  phase,
  emptyCellCount,
  hintsComplete,
  onEnterHints,
}: {
  phase: Phase;
  emptyCellCount: number;
  hintsComplete: boolean;
  onEnterHints: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  function handleConfirm() {
    onEnterHints();
    setConfirming(false);
  }

  function handleStepClick(id: StepId) {
    if (id === 'clues' && phase === 'grid') {
      setConfirming(true);
    }
  }

  return (
    <div>
      <span data-testid="phase-badge">{phase}</span>
      <Stepper steps={stepStates({ phase, hintsComplete })} onStepClick={handleStepClick} />
      {phase === 'grid' && !confirming && (
        <Button variant="quiet" data-testid="enter-hints-button" onClick={() => setConfirming(true)}>
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
