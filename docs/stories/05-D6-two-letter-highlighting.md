# Story D6 — Two-letter slot highlighting in preview

Slice of the visual-design epic, following D4's preview toggle. Flags any
slot of length exactly 2 — a two-letter word — in Preview mode, so a
builder can see where their puzzle currently has one. Purely advisory:
builders remain free to leave two-letter words in place.

Repo paths:
- `src/engine/slots.ts` — edited: new `recommendedCells` export
- `src/engine/slots.test.ts` — extended (**already provided — do not
  edit**; B1–B5's cases unchanged, B6's appended)
- `src/lib/cell-appearance.ts` — edited: new `recommended` appearance
  value, new `isRecommended` input
- `src/components/grid/PuzzleGrid.tsx` — edited: computes
  `recommendedCells(grid)` and passes `isRecommended` per cell
- `globals.css` — edited: new `--color-recommended` token, alongside the
  existing `--color-required`
- `e2e/preview.spec.ts` — extended (**already provided — do not edit**;
  D4-2's cases unchanged, D6's appended)

## Required contract

```ts
// src/engine/slots.ts (extended)

export function recommendedCells(grid: Grid): readonly Coord[];
```

Implementation: call `extractSlots(grid)`, keep only slots with
`length === 2`, return the deduplicated union of their cells (a cell can
belong to both an across-2 and a down-2 slot; it appears once).

```ts
// src/lib/cell-appearance.ts (extended)

export type CellAppearance =
  | 'black'
  | 'empty'
  | 'letter'
  | 'symmetric-hint'
  | 'required'
  | 'recommended'    // new: preview only
  | 'slot'
  | 'slot-letter'
  | 'slot-required'
  | 'selected';

export function cellAppearance(args: {
  cell: Cell;
  isSelected: boolean;
  isInSlot: boolean;
  isSymmetricHint: boolean;
  isRecommended: boolean;   // new
  mode?: GridMode;
}): CellAppearance;
```

Preview mode's early-return branch gets one new check, checked *first* —
`recommended` applies whether or not the cell has a letter, so it must be
tested before the `cell.letter !== null` branch:

```ts
if (mode === 'preview') {
  if (isRecommended) return 'recommended';
  if (cell.letter !== null) return 'letter';
  return isSymmetricHint ? 'required' : 'black';
}
```

## Decisions

**Build mode is untouched.** Two-letter words are common and often
temporary mid-construction; flagging them there would be distracting, not
helpful. `recommended` only ever appears when `mode === 'preview'`.

**`recommended` overrides `required`, not the other way around.** A cell
that is both an unfilled symmetric counterpart and part of a length-2 slot
renders `recommended` only — never both colors, never a border/overlay
combination.

**No interaction with `selected`/`slot`/`slot-letter`/`slot-required` to
resolve.** Per D4, Preview mode's branch already short-circuits before
those are consulted at all — the builder's cursor position is irrelevant
to "what will this look like published." `recommended` slots into that
same early-return branch and never needs to be weighed against them.

**One rule covers all three motivating cases.** A standalone two-letter
word, two abutting words that incidentally create a two-letter cross-word,
and an empty symmetric-counterpart pair that happens to be length 2 are
all just "a slot of length 2" — same check, letters or not. No special
casing per scenario.

**No engine change to the minimum slot length.** Still 2, per
`extractSlots`'s existing `>= 2` rule. Whether that minimum should become
3 to match NYT convention is a separate, unresolved question
(`docs/NYT-CROSSWORD-REFERENCE.md`) and out of scope here.

## Scope discipline

- No validation, no blocking, no warnings-on-save. Purely a Preview-mode
  visual cue.
- No changes to Build mode's rendering or `symmetricHintKeys`.
- No changes to `extractSlots` itself — `recommendedCells` is a thin
  filter over its existing output.
- No changes to hint behavior.
- No new tokens beyond `--color-recommended`.

## Acceptance examples

**D6-1 — `recommendedCells` (Vitest, `src/engine/slots.test.ts` B6)**
- Both cells of a standalone 2-letter across word are flagged.
- An empty (no-letter) length-2 slot is flagged identically to a filled
  one.
- A 3-letter word is not flagged.
- A cell is flagged via its down-slot even when its across-slot is
  longer than 2 — the check is per-direction, not per-cell-overall.
- A cell that is length-2 in both directions at once appears exactly
  once in the result, not twice.
- An empty symmetric-counterpart pair, created purely by rotational
  symmetry, is flagged when it forms a length-2 slot.

**D6-2 — preview flow (Playwright, `e2e/preview.spec.ts` D6 describe
block)**
- A standalone 2-letter word and its empty symmetric counterpart both
  report `data-cell-state="recommended"`.
- `recommended`'s rendered background differs from `required`'s.
- A 3-letter word's cells report `data-cell-state="letter"`, not
  `recommended`.
- In build mode, none of a two-letter word's cells report
  `data-cell-state="recommended"`.

## Definition of done

1. `npx vitest run src/engine/slots.test.ts` passes with B1–B5's and
   B6's cases.
2. `e2e/preview.spec.ts` passes: `npm run test:e2e`.
3. Every other spec passes unmodified. Check this rather than assuming
   it.
4. `tsc --noEmit` is clean across the repo.
5. Lint is clean.
6. `npm run verify` exits 0.

Write the implementation to make the provided tests green. Do not edit the
tests to match your implementation — the tests are the specification.
