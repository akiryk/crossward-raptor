'use client';

import type { Phase } from '../../engine/puzzle';
import { Button } from '../ui/Button';

export type BuilderStepId = 'build' | 'hints' | 'publish';

/** Story 14-S4. The builder's three numbered buttons. One is selected: 1 in
 *  the build phase, 2 in the hints phase, where 1 is done: gray, with a
 *  check, and it does nothing (14-S12). */
export function BuilderSteps({
  phase,
  onStep,
}: {
  phase: Phase;
  onStep: (id: BuilderStepId) => void;
}) {
  const selected: BuilderStepId = phase === 'hints' ? 'hints' : 'build';
  const steps: { id: BuilderStepId; label: string }[] = [
    { id: 'build', label: 'Build the Grid' },
    { id: 'hints', label: 'Create Hints' },
    { id: 'publish', label: 'Publish' },
  ];
  return (
    <div data-testid="builder-steps" className="flex flex-wrap items-center gap-2.5">
      {steps.map((step, index) => (
        <Button
          key={step.id}
          number={index + 1}
          selected={step.id === selected}
          done={step.id === 'build' ? phase === 'hints' : undefined}
          disabled={phase === 'hints' && step.id === 'build'}
          data-step-id={step.id}
          onClick={() => {
            if (step.id !== selected) onStep(step.id);
          }}
        >
          {step.label}
        </Button>
      ))}
    </div>
  );
}

/** A published puzzle's row: "Published" and a link to play it. */
export function PublishedState({ puzzleId }: { puzzleId: string }) {
  return (
    <div className="flex items-baseline gap-5">
      <p data-testid="publish-state" className="text-title-3 text-primary">
        Published
      </p>
      <a
        data-testid="play-link"
        href={`/puzzles/${puzzleId}/play`}
        className="text-title-3 text-link-muted outline-hidden transition-colors duration-150 ease-out hover:text-button-hover focus-visible:text-button-hover"
      >
        Play it!
      </a>
    </div>
  );
}
