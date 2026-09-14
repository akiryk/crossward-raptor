import type { Phase } from '../engine/puzzle';

export type Visibility = 'private' | 'public';
export type StatusKind = 'grid' | 'hints' | 'published';

export interface PuzzleStatus {
  readonly kind: StatusKind;
  /** What the builder reads, e.g. "Published — private". */
  readonly label: string;
}

/**
 * Published outranks phase: a builder reads a published puzzle as
 * published, not as its underlying grid/hints phase -- publishing is what
 * happened at the end of authoring, not a description of where authoring
 * currently stands.
 */
export function puzzleStatus(args: {
  phase: Phase;
  hintsComplete: boolean;
  publishedAt: Date | null;
  visibility: Visibility;
}): PuzzleStatus {
  const { phase, hintsComplete, publishedAt, visibility } = args;

  if (publishedAt !== null) {
    return { kind: 'published', label: `Published — ${visibility}` };
  }

  if (phase === 'grid') {
    return { kind: 'grid', label: 'Grid' };
  }

  return {
    kind: 'hints',
    label: hintsComplete ? 'Hints — complete' : 'Hints — incomplete',
  };
}
