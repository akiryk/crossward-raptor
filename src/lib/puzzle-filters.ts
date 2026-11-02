import { sizeFor } from './puzzle-groups';
import type { PuzzleSize } from './puzzle-size';
import type { Phase } from '../engine/puzzle';
import type { PlayState } from './library-play';

/** Story 18-S4: the library's filters, their URL form and the filter itself. */

export const PLAY_FILTERS = ['unplayed', 'underway', 'complete'] as const;
export const CREATE_FILTERS = ['build', 'hint', 'unlisted'] as const;
export const SIZE_FILTERS = ['mini', 'midi', 'daily', 'sunday'] as const satisfies readonly PuzzleSize[];

export type PlayFilter = (typeof PLAY_FILTERS)[number];
export type CreateFilter = (typeof CREATE_FILTERS)[number];
export type SizeFilter = (typeof SIZE_FILTERS)[number];

export interface LibraryFilters {
  play: PlayFilter[];
  create: CreateFilter[];
  size: SizeFilter[];
}

export const NO_FILTERS: LibraryFilters = { play: [], create: [], size: [] };

export interface FilterablePuzzle {
  builderId: string;
  phase: Phase;
  publishedAt: Date | string | null;
  visibility: string;
  cols: number;
  rows: number;
  play?: { state: PlayState } | null;
}

function playState(puzzle: FilterablePuzzle): PlayState {
  return puzzle.play?.state ?? 'untouched';
}

const PLAY_MATCH: Record<PlayFilter, (p: FilterablePuzzle) => boolean> = {
  unplayed: (p) => p.publishedAt !== null && playState(p) === 'untouched',
  underway: (p) => p.publishedAt !== null && playState(p) === 'in-progress',
  complete: (p) => p.publishedAt !== null && playState(p) === 'completed',
};

const CREATE_MATCH: Record<CreateFilter, (p: FilterablePuzzle, userId: string) => boolean> = {
  build: (p, userId) => p.builderId === userId && p.publishedAt === null && p.phase === 'grid',
  hint: (p, userId) => p.builderId === userId && p.publishedAt === null && p.phase === 'hints',
  unlisted: (p, userId) => p.builderId === userId && p.publishedAt !== null && p.visibility === 'private',
};

/** Play and Create options combine with OR, as one status filter; Size
 *  narrows. A group with nothing checked doesn't restrict. */
export function filterPuzzles<T extends FilterablePuzzle>(
  puzzles: readonly T[],
  filters: LibraryFilters,
  userId: string,
): T[] {
  const anyStatus = filters.play.length + filters.create.length > 0;
  return puzzles.filter((puzzle) => {
    if (anyStatus
      && !filters.play.some((f) => PLAY_MATCH[f](puzzle))
      && !filters.create.some((f) => CREATE_MATCH[f](puzzle, userId))) return false;
    if (filters.size.length === 0) return true;
    const size = sizeFor(puzzle);
    return size !== null && filters.size.includes(size);
  });
}

export function filterCount(filters: LibraryFilters): number {
  return filters.play.length + filters.create.length + filters.size.length;
}

function pick<V extends string>(raw: string | null, known: readonly V[]): V[] {
  const given = new Set((raw ?? '').split(','));
  return known.filter((value) => given.has(value));
}

/** Reads `?play=…&create=…&size=…`; unknown values are ignored. */
export function parseFilters(params: URLSearchParams): LibraryFilters {
  return {
    play: pick(params.get('play'), PLAY_FILTERS),
    create: pick(params.get('create'), CREATE_FILTERS),
    size: pick(params.get('size'), SIZE_FILTERS),
  };
}

const GROUPS = [['play', PLAY_FILTERS], ['create', CREATE_FILTERS], ['size', SIZE_FILTERS]] as const;

/** The query for these filters, in canonical order; '' when none is checked. */
export function filtersQuery(filters: LibraryFilters): string {
  const parts: string[] = [];
  for (const [key, known] of GROUPS) {
    const checked: readonly string[] = filters[key];
    const values = known.filter((value) => checked.includes(value));
    if (values.length > 0) parts.push(`${key}=${values.join(',')}`);
  }
  return parts.length === 0 ? '' : `?${parts.join('&')}`;
}
