import type { Phase } from '../engine/puzzle';

export type StepId = 'build' | 'clues' | 'publish';
export type StepStatus = 'complete' | 'current' | 'available' | 'unavailable';

export interface Step {
  readonly id: StepId;
  readonly label: string;
  readonly status: StepStatus;
  /** Present only when status is 'unavailable'. Explains what's in the way. */
  readonly reason?: string;
}

export function stepStates(args: {
  phase: Phase;
  hintsComplete: boolean;
  isPublished: boolean;
}): readonly Step[] {
  const { phase, isPublished } = args;

  const build: Step =
    phase === 'grid'
      ? { id: 'build', label: 'Build the grid', status: 'current' }
      : {
          id: 'build',
          label: 'Build the grid',
          status: 'unavailable',
          reason: 'The grid is locked once you start writing clues.',
        };

  const clues: Step =
    phase === 'grid'
      ? { id: 'clues', label: 'Write clues', status: 'available' }
      : { id: 'clues', label: 'Write clues', status: isPublished ? 'complete' : 'current' };

  const publish: Step =
    phase === 'grid'
      ? {
          id: 'publish',
          label: 'Publish',
          status: 'unavailable',
          reason: 'The grid must be in hints phase before it can be published.',
        }
      : { id: 'publish', label: 'Publish', status: isPublished ? 'current' : 'available' };

  return [build, clues, publish];
}
