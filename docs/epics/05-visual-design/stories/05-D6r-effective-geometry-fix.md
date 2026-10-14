# Story D6r — Two-letter highlighting against the effective grid

Revises D6. Ships correcting a scope gap in D6's original spec, found in
manual testing after merge: D6 checked slot length against the *raw*
grid (only explicit black cells count as boundaries), so an in-progress
word with nothing blackened after it — the common, everyday state of a
grid mid-construction — was never flagged, even though Preview already
renders its trailing undecided cells as black and it visually reads as a
bounded two-letter word. `recommendedCells` itself is unaffected and
needs no change; the fix is entirely in what grid gets passed to it.

Repo paths:
- `src/components/grid/PuzzleGrid.tsx` — edited: pass
  `convertEmptyCellsToBlack(grid)` to `recommendedCells`, not the raw
  `grid`, matching the existing pattern one line above it for numbering
  (`buildCellNumberLookup(convertEmptyCellsToBlack(grid))`, Story D3)
- `e2e/preview.spec.ts` — extended (**already provided — do not edit**;
  D4-2's and D6's cases unchanged, D6r's appended)

## Required contract

No change to `src/engine/slots.ts` or `recommendedCells`'s signature —
it remains a pure function over whatever `Grid` it's given. The change
is entirely at the call site:

```ts
// src/components/grid/PuzzleGrid.tsx (edited)

// Before (D6, as shipped):
const recommended = recommendedCells(grid);

// After (D6r):
const recommended = recommendedCells(convertEmptyCellsToBlack(grid));
```

`convertEmptyCellsToBlack` is already imported in this file for
numbering — no new import needed beyond reusing it for this second
computation.

## Decisions

**Effective grid, not raw grid — matching the D3 precedent exactly.**
Numbering already solved this same class of problem (an in-progress,
unbounded grid making every empty cell look like a word start) by
computing against the grid as it will actually resolve, not the grid as
literally stored. Two-letter detection has the identical shape of
problem and gets the identical fix, for consistency and because it's
already proven correct in this codebase.

**Only the caller changes; the engine function doesn't.**
`recommendedCells` stays generic — "find slots of length 2 in whatever
grid you give me." That's more reusable and keeps D6's Vitest coverage
(`slots.test.ts` B6) entirely valid; no engine test needed updating.

**This is a revision, not a new feature.** No new `CellAppearance`
value, no new token, no new markup. Existing `recommended` rendering is
unchanged — it just now receives a truer input.

## Scope discipline

- No change to `recommendedCells`'s signature or its existing Vitest
  coverage.
- No change to how numbering itself computes (already correct).
- No change to Build mode.
- No new appearance states, tokens, or markup.

## Acceptance examples

**D6r-1 — preview flow (Playwright, `e2e/preview.spec.ts` D6r describe
block)**
- A two-letter word with nothing blackened after it (an "undecided"
  trailing run) is flagged `recommended` in Preview, the same as an
  explicitly-bounded one.
- Its symmetric counterpart — also undecided, also reading as a bounded
  two-letter pair once trailing cells convert to black — is flagged the
  same way.
- D6's original explicitly-bounded case (`twoLetterGrid`) still passes
  unchanged — this is confirmation, not new coverage.

## Definition of done

1. `e2e/preview.spec.ts` passes in full: `npm run test:e2e`.
2. `npx vitest run src/engine/slots.test.ts` still passes unchanged —
   confirms this story touched no engine behavior.
3. Every other spec passes unmodified. Check this rather than assuming
   it.
4. `tsc --noEmit` is clean across the repo.
5. Lint is clean.
6. `npm run verify` exits 0.

Write the implementation to make the provided tests green. Do not edit
the tests to match your implementation — the tests are the
specification.
