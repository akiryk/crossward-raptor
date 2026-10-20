import { dimensionsFor, type PuzzleSize } from './puzzle-size';
import type { Phase } from '../engine/puzzle';
import type { PlayState } from './library-play';

const SIZES: readonly PuzzleSize[] = ['mini', 'midi', 'daily', 'sunday'];

/** The standard size whose dimensions match exactly, or null. */
export function sizeFor(dimensions: { cols: number; rows: number }): PuzzleSize | null {
  for (const size of SIZES) {
    const { cols, rows } = dimensionsFor(size);
    if (dimensions.cols === cols && dimensions.rows === rows) return size;
  }
  return null;
}

const LABEL: Record<PuzzleSize, string> = {
  mini: 'Mini',
  midi: 'Midi',
  daily: 'Daily',
  sunday: 'Sunday',
};

function dimensionsLabel(size: PuzzleSize): string {
  const { cols, rows } = dimensionsFor(size);
  return `${cols} × ${rows}`;
}

export interface GroupablePuzzle {
  cols: number;
  rows: number;
  phase: Phase;
  publishedAt: Date | null;
  updatedAt: Date;
  play?: { state: PlayState } | null;
}

export interface PuzzleGroup<T> {
  size: PuzzleSize | null; // null = the "Other sizes" group
  label: string; // 'Mini' | 'Midi' | 'Daily' | 'Sunday' | 'Other sizes'
  dimensions: string | null; // '15 × 15' (U+00D7), null for Other sizes
  puzzles: T[];
}

/** 0 unpublished, 1 published and not completed, 2 completed by the caller. */
function band(puzzle: GroupablePuzzle): number {
  if (puzzle.publishedAt === null) return 0;
  return puzzle.play?.state === 'completed' ? 2 : 1;
}

/** Unpublished, then published puzzles still to finish, then completed ones;
 *  within a band, most recently updated first. */
function compare(a: GroupablePuzzle, b: GroupablePuzzle): number {
  const delta = band(a) - band(b);
  if (delta !== 0) return delta;
  return b.updatedAt.getTime() - a.updatedAt.getTime();
}

export function groupPuzzles<T extends GroupablePuzzle>(
  puzzles: readonly T[]
): PuzzleGroup<T>[] {
  const bySize = new Map<PuzzleSize | null, T[]>();

  for (const puzzle of puzzles) {
    const size = sizeFor(puzzle);
    const bucket = bySize.get(size);
    if (bucket) {
      bucket.push(puzzle);
    } else {
      bySize.set(size, [puzzle]);
    }
  }

  const groups: PuzzleGroup<T>[] = [];
  for (const size of SIZES) {
    const bucket = bySize.get(size);
    if (!bucket || bucket.length === 0) continue;
    groups.push({
      size,
      label: LABEL[size],
      dimensions: dimensionsLabel(size),
      puzzles: [...bucket].sort(compare),
    });
  }

  const other = bySize.get(null);
  if (other && other.length > 0) {
    groups.push({
      size: null,
      label: 'Other sizes',
      dimensions: null,
      puzzles: [...other].sort(compare),
    });
  }

  return groups;
}
