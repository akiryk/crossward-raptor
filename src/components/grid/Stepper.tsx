"use client";

import { useState } from "react";
import type { Step, StepId } from "../../lib/stepper";
import type { Puzzle } from "../../engine/puzzle";
import type { Visibility } from "../../app/puzzles/actions";
import { publishReadiness } from "../../lib/publish-readiness";
import { ReadinessPanel } from "./ReadinessPanel";
import { PublishControls } from "./PublishControls";

const STATUS_STYLE: Record<Step["status"], string> = {
  complete: "text-accent",
  current: "text-foreground font-semibold",
  available: "text-ink-2 cursor-pointer hover:text-accent",
  unavailable: "text-ink-3 cursor-pointer",
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
    if (step.id === "publish" || step.status === "unavailable") {
      setRevealedId((prev) => (prev === step.id ? null : step.id));
      return;
    }
    setRevealedId(null);
    onStepClick(step.id);
  }

  const revealedStep = steps.find((step) => step.id === revealedId) ?? null;

  return (
    <>
      {/* The row's own height and each button's own position must never
          depend on revealed content -- otherwise revealing Publish's long
          readiness text made that button's column widen (shifting it left
          under justify-between) and the row grow taller (breaking the
          three labels' shared baseline under items-center). Revealed
          content renders as a sibling below the row instead, so it can
          push page content further down without feeding back into the
          row's own layout. */}
      <div
        data-testid="stepper"
        className="my-4 flex flex-wrap items-center justify-between gap-4"
      >
        {steps.map((step) => (
          <button
            key={step.id}
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
        ))}
      </div>
      {revealedStep &&
        (revealedStep.reason || revealedStep.id === "publish") && (
          <div data-testid="step-reason" className="text-help text-ink-2">
            {revealedStep.reason && <p>{revealedStep.reason}</p>}
            {revealedStep.id === "publish" && (
              <>
                <ReadinessPanel findings={publishReadiness(puzzle)} />
                {revealedStep.status !== "unavailable" && (
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
    </>
  );
}
