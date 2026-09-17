"use client";

import { useState } from "react";
import type { Step, StepId } from "../../lib/stepper";
import type { Puzzle } from "../../engine/puzzle";
import type { Visibility } from "../../app/puzzles/actions";
import { publishReadiness } from "../../lib/publish-readiness";
import { ReadinessPanel } from "./ReadinessPanel";
import { PublishControls } from "./PublishControls";

// Numbered rail: a badge per step (filled when current, tinted when
// complete, outlined otherwise) connected by a hairline, matching the
// design mock's "workflow rail" rather than plain text tabs.
const STEP_STYLE: Record<Step["status"], { badge: string; label: string; button: string }> = {
  complete: {
    badge: "border-accent bg-ok-tint text-accent",
    label: "text-accent",
    button: "",
  },
  current: {
    badge: "border-accent bg-accent text-background",
    label: "text-foreground font-semibold",
    button: "",
  },
  available: {
    badge: "border-rule-strong bg-background text-ink-3",
    label: "text-ink-2 group-hover:text-accent",
    button: "cursor-pointer group",
  },
  unavailable: {
    badge: "border-rule-strong bg-background text-ink-3",
    label: "text-ink-3",
    button: "cursor-pointer",
  },
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
        className="my-4 flex flex-wrap items-center gap-3"
      >
        {steps.flatMap((step, index) => {
          const style = STEP_STYLE[step.status];
          const button = (
            <button
              key={step.id}
              type="button"
              data-testid="step"
              data-step-id={step.id}
              data-step-status={step.status}
              title={step.reason}
              onClick={() => handleClick(step)}
              className={`flex shrink-0 items-center gap-2 ${style.button}`}
            >
              <span
                className={`flex size-7.5 shrink-0 items-center justify-center rounded-sm border text-label [font-weight:var(--weight-bold)] ${style.badge}`}
              >
                {index + 1}
              </span>
              <span className={style.label}>{step.label}</span>
            </button>
          );

          if (index === steps.length - 1) return [button];
          return [
            button,
            <span
              key={`${step.id}-connector`}
              aria-hidden="true"
              className="h-px min-w-4.5 flex-1 bg-rule-strong"
            />,
          ];
        })}
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
