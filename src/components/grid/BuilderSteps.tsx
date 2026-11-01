'use client';

import type { Phase } from '../../engine/puzzle';
import type { ReactNode } from 'react';
import { Button } from '../ui/Button';

export type BuilderStepId = 'build' | 'hints' | 'publish';

/** Story 17-S8. The current step as a label, marked current, and one
 *  button for the next: "1 Build the Grid" then 2 Create Hints, or
 *  "2 Create Hints" then 3 Publish. Inset to line up with the toggle. */
export function BuilderSteps({
  phase,
  onStep,
}: {
  phase: Phase;
  onStep: (id: Exclude<BuilderStepId, 'build'>) => void;
}) {
  const isHints = phase === 'hints';
  const current: { id: BuilderStepId; number: number; label: string } = isHints
    ? { id: 'hints', number: 2, label: 'Create Hints' }
    : { id: 'build', number: 1, label: 'Build the Grid' };
  const next: { id: Exclude<BuilderStepId, 'build'>; number: number; label: string } = isHints
    ? { id: 'publish', number: 3, label: 'Publish' }
    : { id: 'hints', number: 2, label: 'Create Hints' };
  return (
    <div
      data-testid="builder-steps"
      className="flex flex-wrap items-center gap-x-3 gap-y-2.5 px-3 min-[748px]:gap-x-5 min-[748px]:px-4"
    >
      <p data-testid="builder-step-current" data-step-id={current.id} aria-current="true" className="inline-flex items-center gap-2 text-title-4 text-primary">
        <span
          data-step-number
          className="inline-flex size-6 shrink-0 items-center justify-center rounded-pill bg-primary text-inverse"
        >
          {current.number}
        </span>
        {current.label}
      </p>
      <Button number={next.number} data-step-id={next.id} onClick={() => onStep(next.id)}>
        {next.label}
      </Button>
    </div>
  );
}

/** Story 17-S8. The toggle row: the grid's own controls on a `toggle-row`
 *  panel with 10px corners, at the grid's width. A published puzzle's is
 *  empty: it keeps its space beside the hints list, so the grid doesn't
 *  move (14-S4), and has none narrow (15-S3). */
export function ToggleRow({ isPublished = false, children }: { isPublished?: boolean; children?: ReactNode }) {
  return (
    <div
      data-testid="toggle-row"
      className={`h-10 w-[700px] max-w-full items-center justify-between rounded-modal px-3 min-[748px]:h-12 min-[748px]:px-4 ${
        isPublished ? 'hidden @min-[1092px]/editor:invisible @min-[1092px]/editor:flex' : 'flex bg-toggle-row'
      }`}
    >
      {children}
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
