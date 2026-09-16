'use client';

import type { Phase, Puzzle } from '../../engine/puzzle';
import type { Visibility } from '../../app/puzzles/actions';
import { Stepper } from './Stepper';
import { stepStates } from '../../lib/stepper';

// The hints-transition button and its confirmation were removed here
// (visual-polish-02): "Write clues" in the stepper is the one control for
// entering hints phase now, not a second button beside it. It's a no-op
// for the moment -- onStepClick is intentionally empty -- until the
// confirmation popup that belongs on that click is built. The engine call
// (enterHintsPhase) and Server Action (enterHints) this used to invoke are
// untouched and still covered by phase.test.ts; only the UI wiring to them
// was removed. See docs/handoffs/06-HANDOFF-visual-polish.md.
export function PhaseControls({
  phase,
  hintsComplete,
  puzzle,
  isPublished,
  visibility,
  onPublish,
  onUnpublish,
}: {
  phase: Phase;
  hintsComplete: boolean;
  puzzle: Puzzle;
  isPublished: boolean;
  visibility: Visibility;
  onPublish: (visibility: Visibility) => void;
  onUnpublish: () => void;
}) {
  return (
    <Stepper
      steps={stepStates({ phase, hintsComplete, isPublished })}
      puzzle={puzzle}
      isPublished={isPublished}
      visibility={visibility}
      onStepClick={() => {}}
      onPublish={onPublish}
      onUnpublish={onUnpublish}
    />
  );
}
