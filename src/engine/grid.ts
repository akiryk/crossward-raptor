export type Orientation = 'across' | 'down';

export type Coord = { col: number; row: number };

export type Cell = { kind: 'black' } | { kind: 'active'; letter: string | null };

export type Lookup = Cell | { kind: 'outside' };

export interface Grid {
  readonly cols: number;
  readonly rows: number;
  at(col: number, row: number): Lookup;
}

export function createGrid(spec: { cols: number; rows: number; black?: Coord[] }): Grid {
  const { cols, rows, black = [] } = spec;
  const cells: Cell[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, (): Cell => ({ kind: 'active', letter: null }))
  );
  for (const { col, row } of black) {
    cells[row][col] = { kind: 'black' };
  }

  return {
    cols,
    rows,
    at(col: number, row: number): Lookup {
      if (col < 0 || col >= cols || row < 0 || row >= rows) {
        return { kind: 'outside' };
      }
      return cells[row][col];
    },
  };
}
