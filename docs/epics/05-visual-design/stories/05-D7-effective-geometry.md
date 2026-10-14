# Story D7 — Two-letter highlighting against the effective geometry

Corrects a scope gap in D6, found in manual testing after merge, and
replaces the abandoned D6r attempt at the same fix.

D6 checked slot length against the **raw** grid, so only explicitly
blackened boundaries counted. A word with nothing blackened after it —
the normal state of a grid mid-construction — was never flagged, even
though Preview already renders its trailing undecided cells as black and
it reads on screen as a bounded two-letter word. On a real builder grid
with three words placed and no black squares yet, the feature flagged
zero of eight two-letter words.

**D6r's attempted fix is withdrawn and must not be revived.** It passed
`convertEmptyCellsToBlack(grid)` into `recommendedCells`. That converter
blackens every empty active cell, which is exactly the set the feature
has to point at, so under D6r's contract no empty cell can ever be
flagged — only already-lettered ones survive. That is structural, not an
edge case, and it regressed D6's own passing cases. Any implementation
reaching for `convertEmptyCellsToBlack` here is reintroducing that bug.

Repo paths:
- `src/engine/puzzle-geometry.ts` — new: `intendedGeometry`
- `src/engine/puzzle-geometry.test.ts` — new (**already provided — do
  not edit**)
- `src/components/grid/PuzzleGrid.tsx` — edited: pass
  `intendedGeometry(grid)` to `recommendedCells`
- `e2e/preview.spec.ts` — extended (**already provided — do not edit**;
  D4-2's and D6's cases unchanged, D7's appended, D6r's removed)

## Required contract

```ts
// src/engine/puzzle-geometry.ts (new)

/**
 * The grid as the puzzle currently stands: a cell stays active if it
 * holds a letter or is the symmetric counterpart of a cell that does;
 * everything else is black. Letters and dimensions are preserved.
 */
export function intendedGeometry(grid: Grid): Grid;
```

Cells surviving the conversion are exactly: already-active cells that
either hold a letter, or whose symmetric counterpart (per
`symmetricCounterpart`) is an active lettered cell. This is the same set
Preview already paints as `letter` plus `required` — which is the point:
slot boundaries should come from the geometry the builder is looking at.

Already-black cells stay black. A lettered cell whose counterpart is
black still survives on its own letter. A cell that is its own
counterpart (the exact center of an odd-sized grid) is covered by the
letter clause alone.

No change to `recommendedCells`'s signature or behavior — it stays a
pure "find slots of length 2 in whatever grid you give me". Only the
grid it is handed changes:

```ts
// src/components/grid/PuzzleGrid.tsx (edited)
const recommended = recommendedCells(intendedGeometry(grid));
```

## Decisions

**A new engine module, not a lib helper.** `symmetricHintKeys` in
`src/lib/cell-appearance.ts` computes the same counterpart set but
returns render keys (`cellNumberKey` strings) for a component to look
up, not a `Grid`. `intendedGeometry` needs a `Grid` for `extractSlots`,
and belongs in the engine where it gets real unit coverage and stays
importable without crossing the lib boundary. It depends only on
`grid.ts` and `symmetry.ts`. The duplication of the counterpart rule
between the two is two lines and deliberate; unifying them would drag
render-layer key formats into the engine.

**Not the numbering precedent.** D6r cited
`buildCellNumberLookup(convertEmptyCellsToBlack(grid))` as the pattern
to copy. Numbering can blacken empties safely because it only ever needs
final boundaries around cells that already hold letters. Two-letter
detection has to *name* empty cells, so the same technique inverts into
a bug. Same shape of problem, different converter.

**Symmetry-implied cells count as part of the puzzle.** An empty cell
that exists only because its counterpart is lettered is already treated
as real by Preview (it renders `required`, not black). Letting it
participate in slot boundaries follows, and is what lets an all-empty
counterpart pair be flagged at all.

## Scope discipline

- No change to `recommendedCells`, `extractSlots`, or
  `src/engine/slots.test.ts`.
- No change to `symmetricHintKeys`, `convertEmptyCellsToBlack`, or
  numbering.
- No change to Build mode, `cellAppearance`'s precedence, tokens, or
  markup.
- No new appearance states.

## Acceptance examples

**D7-1 — `intendedGeometry` (Vitest,
`src/engine/puzzle-geometry.test.ts`)**
- Lettered cells stay active; their empty counterparts stay active.
- An empty cell that is neither is blackened; an already-black cell
  stays black.
- A grid with no letters at all converts to entirely black.
- A lettered cell whose counterpart is black stays active anyway.
- The active set is exactly the lettered cells plus their counterparts,
  no more.
- A center cell that is its own counterpart is handled.
- Letters, emptiness of counterparts, and dimensions are preserved; the
  input is not mutated; repeated calls are deep-equal.
- Composed with `recommendedCells`: a two-letter word with nothing
  blackened after it is flagged along with its empty mirror; a
  three-letter one is not; two abutting across words that create
  two-letter **down** words get those down words flagged, while a
  length-1 run is not a slot and stays unflagged.

**D7-2 — preview flow (Playwright, `e2e/preview.spec.ts` D7 block)**
- An undecided two-letter word with nothing blackened after it reports
  `data-cell-state="recommended"`, as does its still-empty symmetric
  counterpart.
- Two abutting across words produce `recommended` on the two-letter down
  words they create, and on those words' empty mirrors, while the
  length-1 run stays `letter`.
- D6's explicitly-bounded case still reports `recommended` unchanged.
- A three-letter word still reports `letter`, and its counterparts still
  report `required` — the D4-2 behavior is not disturbed.

## Definition of done

1. `npx vitest run src/engine/puzzle-geometry.test.ts` passes.
2. `npx vitest run src/engine/slots.test.ts` passes unchanged — confirms
   D6's engine contract was not altered.
3. `e2e/preview.spec.ts` passes in full: `npm run test:e2e`.
4. Every other spec passes unmodified. **Check this rather than assuming
   it.**
5. `tsc --noEmit` is clean across the repo.
6. Lint is clean.
7. `npm run verify` exits 0.

Before starting: discard any uncommitted D6r working-tree change to
`PuzzleGrid.tsx`, and remove D6r's committed block from
`e2e/preview.spec.ts` — the provided spec file already excludes it.

Write the implementation to make the provided tests green. Do not edit
the tests to match your implementation — the tests are the
specification.
