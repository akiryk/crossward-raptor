export type PuzzleSize = 'mini' | 'daily' | 'sunday';

export interface Dimensions {
  readonly cols: number;
  readonly rows: number;
}

export const DEFAULT_SIZE: PuzzleSize = 'daily';

const DIMENSIONS: Record<PuzzleSize, Dimensions> = {
  mini: { cols: 5, rows: 5 },
  daily: { cols: 15, rows: 15 },
  sunday: { cols: 21, rows: 21 },
};

/** mini 5x5, daily 15x15, sunday 21x21. */
export function dimensionsFor(size: PuzzleSize): Dimensions {
  return DIMENSIONS[size];
}
