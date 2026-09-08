# Story D3 — Build-phase grid

Third slice of the visual-design epic. Makes the real grid look like the
style guide's build sample: fixed square cells, grey empties, filled cells
distinguishable, symmetric hints, hairlines on every edge, and numbers only
where a word actually starts.

Repo paths:
- `src/lib/cell-appearance.ts` — new
- `src/lib/cell-appearance.test.ts` — Vitest acceptance tests (**already
  provided — do not edit**)
- `src/components/grid/PuzzleGrid.tsx` — edited: hairline container,
  effective-geometry numbering, appearance wiring
- `src/components/grid/GridCell.tsx` — edited
- `src/components/grid/EmptyCell.tsx`, `LetterCell.tsx`, `BlackCell.tsx` —
  edited
- `e2e/build-grid.spec.ts` — Playwright acceptance tests (**already
  provided — do not edit**)

**Every existing data attribute stays.** `data-coord`, `data-kind`, and
`data-highlight` are used by `editing.spec.ts`, `hints-panel.spec.ts`,
`phase-controls.spec.ts`, `grid-rendering.spec.ts` and
`hints-transition.spec.ts`. This story *adds* `data-cell-state` alongside
them and changes none of them. If preserving all of those turns out to be
impossible, stop and say so rather than editing those specs.

## Required contract

```ts
// src/lib/cell-appearance.ts
import type { Cell, Coord, Grid } from '../engine/grid';

export type CellAppearance =
  | 'black'
  | 'empty'
  | 'letter'
  | 'symmetric-hint'
  | 'slot'
  | 'selected';

/**
 * The single visual state a cell should render in. Precedence, highest
 * first: selected, slot, then the cell's own content.
 */
export function cellAppearance(args: {
  cell: Cell;
  isSelected: boolean;
  isInSlot: boolean;
  isSymmetricHint: boolean;
}): CellAppearance;

/**
 * Keys (via cellNumberKey) of empty active cells that are the symmetric
 * counterpart of a cell holding a letter — the squares a symmetric grid
 * would want filled. Render-only; nothing is stored.
 */
export function symmetricHintKeys(grid: Grid): ReadonlySet<string>;
```

## Markup contract

Each cell keeps `data-coord`, `data-kind`, and `data-highlight` exactly as
today, and adds `data-cell-state` carrying the `CellAppearance` value.

The grid container carries `data-testid="puzzle-grid"`.

## Decisions

**Numbering derives from the effective grid, computed at the call site.**
Numbers currently come from `buildCellNumberLookup(grid)`, so during
building every cell looks like a word start — nine numbers on a 3×3 with
one word in it. They should reflect the puzzle as it will actually be:
`buildCellNumberLookup(convertEmptyCellsToBlack(grid))`, reusing the
function PB1a added.

Doing this at the call site rather than inside `buildCellNumberLookup`
matters: that function's committed tests assert numbering over raw grids,
and changing its meaning would break them for no gain. It stays a pure
function of whatever grid it's handed; `PuzzleGrid` decides which grid to
hand it. In hints phase the grid is already converted, so the same call is
correct in both phases.

**Symmetric hints are derived per render, never stored.** For every cell
holding a letter, its 180°-rotational counterpart (Story A's
`symmetricCounterpart`, which no UI has called until now) renders white if
that counterpart is active and empty. These cells still blacken at the
hints transition like any other empty cell — the white is a suggestion,
not a commitment, exactly as the epic records.

**Appearance is one derived value, not a pile of booleans in the
component.** `cellAppearance` collapses selection, slot membership, and
content into a single state with explicit precedence, so the ordering is
testable in Vitest rather than implied by the order of ternaries in JSX.

**Hairlines use the container-background technique**, the same one D1c
settled: container painted `--color-grid-line`, `gap` and `padding` both
`--grid-line-width`, cells carrying no borders of their own. Every
division — inner and outer — is one pixel of one colour regardless of what
the adjacent cells contain.

**Cells are fixed squares.** A cell's dimensions never change with its
content. The grid scales with viewport (that's D5's problem to constrain
properly), but within a given render every cell is identical and square.

## Scope discipline

- **No preview mode.** D4 owns the black/white/red published rendering.
- **No layout work.** The grid may still not fit on screen; D5.
- **No changes to `src/engine/`.** `symmetricCounterpart` and
  `convertEmptyCellsToBlack` are consumed as they are.
- **No changes to `buildCellNumberLookup` or its tests.**
- **No behaviour changes** — clicking, typing, and selection work exactly
  as before.
- **No new tokens.**

## Acceptance examples

**D3-1 — `cell-appearance` (Vitest)**
- A black cell is `'black'` regardless of every other flag.
- Selection outranks slot membership, which outranks content: a selected
  cell in a slot holding a letter is `'selected'`; an unselected cell in a
  slot is `'slot'`.
- An active cell with a letter, not selected or in a slot, is `'letter'`.
- An empty active cell that's a symmetric hint is `'symmetric-hint'`; one
  that isn't is `'empty'`.
- `symmetricHintKeys` on a 3×3 with a letter at `(0,0)` returns exactly
  the key for `(2,2)`.
- A counterpart that already holds a letter is not a hint.
- A counterpart that is black is not a hint.
- The centre cell of an odd grid is its own counterpart, so a letter there
  produces no hint.
- Purity: two calls on the same grid return equal sets.

**D3-2 — build grid rendering (Playwright, measured)**
- Adjacent cells are exactly `--grid-line-width` apart, both axes, and the
  same hairline surrounds the outside — measured from bounding rects, per
  D1c.
- Every cell is square, and all cells share one size.
- A lettered cell and an empty cell have identical dimensions.
- Empty and lettered cells have different background colours.
- A symmetric-hint cell's background differs from a plain empty cell's.
- On a 3×3 seeded with `CAT` across the top row and nothing else, exactly
  one cell number renders — at `(0,0)`. (The three across cells form the
  only slot; every column is a run of one.)
- `data-kind` and `data-highlight` still behave as the existing specs
  expect.

## Definition of done

1. `npx vitest run src/lib/cell-appearance.test.ts` passes (covered by
   `npm run verify`).
2. `e2e/build-grid.spec.ts` passes: `npm run test:e2e`.
3. Every other spec passes unmodified.
4. `tsc --noEmit` is clean across the repo.
5. Lint is clean.
6. `npm run verify` exits 0.

Write the implementation to make the provided tests green. Do not edit the
tests to match your implementation — the tests are the specification.
