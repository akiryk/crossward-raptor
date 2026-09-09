'use client';

import { useState } from 'react';
import type { Step, StepId } from '../../lib/stepper';

const STATUS_STYLE: Record<Step['status'], string> = {
  complete: 'text-accent',
  current: 'text-foreground font-semibold',
  available: 'text-ink-2 cursor-pointer hover:text-accent',
  unavailable: 'text-ink-3 cursor-pointer',
};

export function Stepper({
  steps,
  onStepClick,
}: {
  steps: readonly Step[];
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
            <p data-testid="step-reason">{step.reason}</p>
          )}
        </div>
      ))}
    </div>
  );
}
