export type Orientation = 'across' | 'down';

export type Coord = { col: number; row: number };

export type Cell = { kind: 'black' } | { kind: 'active'; readonly letter: string | null };

export type Lookup = Cell | { kind: 'outside' };

export interface Grid {
  readonly cols: number;
  readonly rows: number;
  at(col: number, row: number): Lookup;
}

interface InternalGrid extends Grid {
  readonly cells: Cell[][];
}

// A single shared `at` implementation, referenced (not re-closed) by every
// grid built via buildGrid. Two grids with equal cols/rows/cells are then
// genuinely toEqual-comparable — a fresh closure per grid would make `at`
// reference-unequal even between structurally identical grids.
function gridAt(this: InternalGrid, col: number, row: number): Lookup {
  if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
    return { kind: 'outside' };
  }
  return this.cells[row][col];
}

function buildGrid(cols: number, rows: number, cells: Cell[][]): Grid {
  const grid: InternalGrid = { cols, rows, cells, at: gridAt };
  return grid;
}

export function createGrid(spec: { cols: number; rows: number; black?: Coord[] }): Grid {
  const { cols, rows, black = [] } = spec;
  const cells: Cell[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, (): Cell => ({ kind: 'active', letter: null }))
  );
  for (const { col, row } of black) {
    cells[row][col] = { kind: 'black' };
  }

  return buildGrid(cols, rows, cells);
}

export function withLetter(grid: Grid, coord: Coord, letter: string | null): Grid {
  const target = grid.at(coord.col, coord.row);
  if (target.kind !== 'active') {
    throw new TypeError(`withLetter: (${coord.col}, ${coord.row}) is not an active cell`);
  }

  const cells: Cell[][] = Array.from({ length: grid.rows }, (_, row) =>
    Array.from({ length: grid.cols }, (_, col) =>
      row === coord.row && col === coord.col
        ? { kind: 'active', letter }
        : (grid.at(col, row) as Cell)
    )
  );

  return buildGrid(grid.cols, grid.rows, cells);
}
