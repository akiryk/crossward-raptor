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
  status,
  canPublish = true,
}: {
  phase: Phase;
  onStep: (id: Exclude<BuilderStepId, 'build'>) => void;
  /** 24-S5: false for a collaborator: publishing is the owner's (D7), so
   *  Create Hints has no next step for them. */
  canPublish?: boolean;
  /** The save status (24-S3), at the row's end. */
  status?: ReactNode;
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
      {(next.id !== 'publish' || canPublish) && (
        <Button number={next.number} data-step-id={next.id} onClick={() => onStep(next.id)}>
          {next.label}
        </Button>
      )}
      {status}
    </div>
  );
}

/** Story 17-S8. The toggle row: the grid's own controls on a `toggle-row`
 *  panel with 10px corners, at the grid's width (the editor's `--grid-max`,
 *  21-S9; a Sunday's 700px in the style guide). A published puzzle's is
 *  empty: it keeps its space beside the hints list, so the grid doesn't
 *  move (14-S4), and has none narrow (15-S3). Holding the build progress
 *  (22-S2), below a 490px window it wraps onto two lines, 64px tall: 8px
 *  padding, a 24px line (Preview and the message), 8px, a 16px line (the
 *  bar and the percentage), 8px. */
export function ToggleRow({
  isPublished = false,
  hasProgress = false,
  children,
}: {
  isPublished?: boolean;
  hasProgress?: boolean;
  children?: ReactNode;
}) {
  return (
    <div
      data-testid="toggle-row"
      className={`h-10 w-(--grid-max,700px) max-w-full items-center justify-between rounded-modal px-3 min-[748px]:h-12 min-[748px]:px-4 ${
        isPublished ? 'hidden @min-[1092px]/editor:invisible @min-[1092px]/editor:flex' : 'flex bg-toggle-row'
      } ${hasProgress ? 'max-[490px]:h-16 max-[490px]:flex-wrap max-[490px]:content-start max-[490px]:items-start max-[490px]:gap-y-2 max-[490px]:py-2' : ''}`}
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
