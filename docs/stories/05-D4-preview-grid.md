# Story D4 — Preview and published grid

Fourth slice of the visual-design epic, and it absorbs **PB1b** from the
publishing epic — the grid-phase preview toggle. Shows the grid as it will
look once published: empty cells black, lettered cells white, and unfilled
symmetric counterparts red.

Repo paths:
- `src/lib/cell-appearance.ts` — edited: optional `mode`
- `src/lib/cell-appearance.test.ts` — extended (**already provided — do
  not edit**; D3's cases unchanged, D4's appended)
- `src/components/grid/PreviewToggle.tsx` — new
- `src/components/grid/PuzzleGrid.tsx` — edited: `mode` prop
- `src/components/grid/GridCell.tsx` and the cell components — edited: the
  `required` state
- `src/components/grid/PuzzleGridEditor.tsx` — edited: preview state,
  renders the toggle
- `e2e/preview.spec.ts` — Playwright acceptance tests (**already
  provided — do not edit**)

## Required contract

```ts
// src/lib/cell-appearance.ts (extended)

export type CellAppearance =
  | 'black'
  | 'empty'
  | 'letter'
  | 'symmetric-hint'
  | 'required'      // new: preview only
  | 'slot'
  | 'selected';

export type GridMode = 'build' | 'preview';

export function cellAppearance(args: {
  cell: Cell;
  isSelected: boolean;
  isInSlot: boolean;
  isSymmetricHint: boolean;
  mode?: GridMode;          // defaults to 'build'
}): CellAppearance;
```

```tsx
// src/components/grid/PreviewToggle.tsx
export function PreviewToggle(props: {
  isPreviewing: boolean;
  onToggle: () => void;
}): JSX.Element;
```

`PuzzleGrid` gains `mode?: GridMode`, defaulting to `'build'`.

## Markup contract

- `data-testid="preview-toggle"`, rendered **only in grid phase**.
- The grid container carries `data-grid-mode="build"` or `"preview"`.
- Cells carry `data-cell-state` as in D3, now including `required`.

## Decisions

**`mode` is an optional parameter with a `'build'` default, not a new
function.** Preview shares the precedence logic; duplicating it into a
second function would let the two drift. Optional-with-default also means
D3's committed test cases call the function exactly as before and keep
passing — only new cases are appended.

**Preview ignores selection and slot highlighting.** In build mode those
outrank content, but preview answers one question: what will this look
like as a finished puzzle? A cursor highlight is the builder's own state,
not the puzzle's, and showing it would obscure the geometry that's being
judged. So in preview: black stays black, lettered cells are letters,
empty cells are black, and empty symmetric counterparts are `required`.

**Red means "this square needs a word for the grid to be symmetric."** It
is a warning, not a state. These cells still blacken at the hints
transition like any other empty cell — nothing about preview changes what
PB1a does. Per the publishing epic's governing principle, this informs the
builder; it never blocks anything.

**The toggle only exists in grid phase.** After the hints transition the
grid is already converted, so preview and reality are identical and the
control would do nothing.

**Nothing is persisted.** Preview is component state. A reload returns to
build view.

## Scope discipline

- **No changes to `enterHintsPhase` or anything in `src/engine/`.**
- **No publishing, no `publishedAt`.** Epic 4 resumes after this epic.
- **No layout work.** D5.
- **No changes to `buildCellNumberLookup` or its call site** — numbering
  already derives from the effective geometry after D3, so preview shows
  the same numbers build mode does.
- **No new tokens.** `--color-required` already exists from D1.

## Acceptance examples

**D4-1 — `cellAppearance` in preview mode (Vitest)**
- Preview, empty cell, not a symmetric hint → `'black'`.
- Preview, empty cell that is a symmetric hint → `'required'`.
- Preview, lettered cell → `'letter'`.
- Preview, black cell → `'black'`.
- Preview ignores selection: a selected lettered cell is `'letter'`, and a
  selected empty cell is `'black'`.
- Preview ignores slot membership, likewise.
- Omitting `mode` behaves exactly as `'build'` — every D3 case still holds.

**D4-2 — preview flow (Playwright)**
- In grid phase, `preview-toggle` is visible and the grid reports
  `data-grid-mode="build"`.
- Clicking it sets `data-grid-mode="preview"`; empty cells now report
  `data-cell-state="black"`, and their rendered background differs from
  build mode.
- Symmetric counterparts of lettered cells report
  `data-cell-state="required"` and are visually distinct from both black
  and lettered cells.
- Lettered cells keep their letters and stay distinguishable from black
  cells.
- Clicking again returns to build appearance.
- Reloading returns to build mode — preview isn't persisted.
- Hairline geometry still holds in preview: adjacent cells exactly
  `--grid-line-width` apart, the same hairline around the outside, cells
  still square (measured, per D1c).
- In hints phase, `preview-toggle` is not rendered.

## Definition of done

1. `npx vitest run src/lib/cell-appearance.test.ts` passes with both D3's
   and D4's cases.
2. `e2e/preview.spec.ts` passes: `npm run test:e2e`.
3. Every other spec passes unmodified. **Check this rather than assuming
   it** — D3's Definition of Done made that claim and it was false for
   `grid-rendering.spec.ts`. If a frozen test contradicts this story, stop
   and report it.
4. `tsc --noEmit` is clean across the repo.
5. Lint is clean.
6. `npm run verify` exits 0.

Write the implementation to make the provided tests green. Do not edit the
tests to match your implementation — the tests are the specification.
