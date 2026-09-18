'use client';

import type { Phase, Puzzle } from '../../engine/puzzle';
import type { Visibility } from '../../app/puzzles/actions';
import { Stepper } from './Stepper';
import { stepStates, type StepId } from '../../lib/stepper';

export function PhaseControls({
  phase,
  hintsComplete,
  puzzle,
  isPublished,
  visibility,
  onStepClick,
  onPublish,
  onUnpublish,
}: {
  phase: Phase;
  hintsComplete: boolean;
  puzzle: Puzzle;
  isPublished: boolean;
  visibility: Visibility;
  onStepClick: (id: StepId) => void;
  onPublish: (visibility: Visibility) => void;
  onUnpublish: () => void;
}) {
  return (
    <Stepper
      steps={stepStates({ phase, hintsComplete, isPublished })}
      puzzle={puzzle}
      isPublished={isPublished}
      visibility={visibility}
      onStepClick={onStepClick}
      onPublish={onPublish}
      onUnpublish={onUnpublish}
    />
  );
}
