# Story A — Grid data model + rotational symmetry

First slice of the grid-engine epic. Establishes the engine's data model and the
purity discipline, then implements Story Group A (symmetry). Everything downstream
depends on the types this story pins down, so get them clean.

Repo paths:
- `src/engine/grid.ts` — types + grid factory/accessor (you create this)
- `src/engine/symmetry.ts` — the three symmetry functions (you create this)
- `src/engine/symmetry.test.ts` — the acceptance tests (**already provided — do not edit**)

## Required public API

The tests import exactly this surface. Match it.

```ts
// src/engine/grid.ts
export type Orientation = 'across' | 'down';
export type Coord = { col: number; row: number };
export type Cell =
  | { kind: 'black' }
  | { kind: 'active'; letter: string | null };   // null = empty active cell

export interface Grid {
  readonly cols: number;
  readonly rows: number;
  at(col: number, row: number): Cell;             // accessor; storage is opaque
}

// Construct a grid. Cells not listed in `black` are active with letter = null.
export function createGrid(spec: { cols: number; rows: number; black?: Coord[] }): Grid;
```

```ts
// src/engine/symmetry.ts
export function symmetricCounterpart(grid: Grid, coord: Coord): Coord;
export function isSymmetric(grid: Grid): boolean;
export function toggleBlackSymmetric(grid: Grid, coord: Coord): Grid;
```

## Semantics (the rules the tests encode)

- **Coordinates** are `{ col, row }`, zero-indexed, origin top-left.
- **Counterpart formula.** For an `R x C` grid the counterpart of `(col, row)` is
  `(C-1-col, R-1-row)`. On odd dimensions the center is its own counterpart.
- **`isSymmetric`** compares only the black/active pattern (letters are irrelevant):
  the grid is symmetric iff every cell and its counterpart are both black or both
  active. A fully active grid is symmetric vacuously.
- **`toggleBlackSymmetric`** flips the target cell's black/active state and sets its
  counterpart to that **same** new state, returning a **new** grid. When the target is
  its own counterpart (odd-dimension center), only that one cell changes.
- **Purity is the whole point.** No function mutates its input. `toggleBlackSymmetric`
  returns a new grid; the original is untouched. This is what the epic's verify hook
  protects, and the tests assert it directly.

## Scope discipline

- Implement only what this story needs. No slot extraction, numbering, or phase logic
  yet — those are later stories.
- The engine imports no React and no database client (enforced by directory boundaries
  and lint). Keep `src/engine/` pure.
- Symmetry here is an **assist and a checkable property**, not a hard constraint baked
  into the `Grid` type — the app must still support asymmetric grids later.

## Definition of done

1. `src/engine/symmetry.test.ts` passes unmodified.
2. `tsc --noEmit` is clean.
3. Lint is clean.
4. `npm run verify` exits 0.

Write the implementation to make the provided tests green. Do not edit the tests to
match your implementation — the tests are the specification.
