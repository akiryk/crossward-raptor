'use client';

import { useState } from 'react';
import type { Step, StepId } from '../../lib/stepper';
import type { Puzzle } from '../../engine/puzzle';
import type { Visibility } from '../../app/puzzles/actions';
import { publishReadiness } from '../../lib/publish-readiness';
import { ReadinessPanel } from './ReadinessPanel';
import { PublishControls } from './PublishControls';

const STATUS_STYLE: Record<Step['status'], string> = {
  complete: 'text-accent',
  current: 'text-foreground font-semibold',
  available: 'text-ink-2 cursor-pointer hover:text-accent',
  unavailable: 'text-ink-3 cursor-pointer',
};

export function Stepper({
  steps,
  puzzle,
  isPublished,
  visibility,
  onStepClick,
  onPublish,
  onUnpublish,
}: {
  steps: readonly Step[];
  puzzle: Puzzle;
  isPublished: boolean;
  visibility: Visibility;
  onStepClick: (id: StepId) => void;
  onPublish: (visibility: Visibility) => void;
  onUnpublish: () => void;
}) {
  const [revealedId, setRevealedId] = useState<StepId | null>(null);

  function handleClick(step: Step) {
    // The publish step's revealed content (readiness panel, publish
    // controls) must stay reachable by click regardless of its status --
    // unlike build/clues, whose reveal only ever shows an explanatory
    // reason for being unavailable.
    if (step.id === 'publish' || step.status === 'unavailable') {
      setRevealedId((prev) => (prev === step.id ? null : step.id));
      return;
    }
    setRevealedId(null);
    onStepClick(step.id);
  }

  return (
    <div data-testid="stepper" className="flex flex-wrap items-center gap-4">
      {steps.map((step) => (
        <div key={step.id}>
          <button
            type="button"
            data-testid="step"
            data-step-id={step.id}
            data-step-status={step.status}
            title={step.reason}
            onClick={() => handleClick(step)}
            className={STATUS_STYLE[step.status]}
          >
            {step.label}
          </button>
          {revealedId === step.id && (step.reason || step.id === 'publish') && (
            <div data-testid="step-reason" className="text-help text-ink-2">
              {step.reason && <p>{step.reason}</p>}
              {step.id === 'publish' && (
                <>
                  <ReadinessPanel findings={publishReadiness(puzzle)} />
                  {step.status !== 'unavailable' && (
                    <PublishControls
                      isPublished={isPublished}
                      visibility={visibility}
                      onPublish={onPublish}
                      onUnpublish={onUnpublish}
                    />
                  )}
                </>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
