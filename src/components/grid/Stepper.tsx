'use client';

import { useState } from 'react';
import type { Step, StepId } from '../../lib/stepper';
import type { Puzzle } from '../../engine/puzzle';
import { publishReadiness } from '../../lib/publish-readiness';
import { ReadinessPanel } from './ReadinessPanel';

const STATUS_STYLE: Record<Step['status'], string> = {
  complete: 'text-accent',
  current: 'text-foreground font-semibold',
  available: 'text-ink-2 cursor-pointer hover:text-accent',
  unavailable: 'text-ink-3 cursor-pointer',
};

export function Stepper({
  steps,
  puzzle,
  onStepClick,
}: {
  steps: readonly Step[];
  puzzle: Puzzle;
  onStepClick: (id: StepId) => void;
}) {
  const [revealedId, setRevealedId] = useState<StepId | null>(null);

  function handleClick(step: Step) {
    if (step.status === 'unavailable') {
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
          {revealedId === step.id && step.reason && (
            <div data-testid="step-reason" className="text-help text-ink-2">
              <p>{step.reason}</p>
              {step.id === 'publish' && <ReadinessPanel findings={publishReadiness(puzzle)} />}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
