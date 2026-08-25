import type { Grid } from './grid';

export type Phase = 'grid' | 'hints';

export interface Puzzle {
  readonly grid: Grid;
  readonly hints: Readonly<Record<string, string>>;
  readonly phase: Phase;
}
