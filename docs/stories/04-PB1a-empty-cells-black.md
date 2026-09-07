# Story PB1a — Empty cells become black on entering hints phase

First slice of the publishing epic, and the structural decision the rest of
it rests on. From the builder's standpoint an unfilled cell *is* a black
cell, so entering hints phase converts every active cell holding no letter
into a black cell — fixing the geometry before slots, numbering, and
required hints are derived from it.

Split from the epic's PB1: this story is the conversion and its
confirmation. The grid-phase preview toggle is PB1b, which touches no
committed files and can land separately.

Repo paths:
- `src/engine/phase.ts` — edited: `enterHintsPhase` performs the conversion
- `src/engine/phase.test.ts` — **rewritten E2 block** (**already provided —
  do not edit**; see "Test changes" below — this is a substantial
  authorized edit, not a mechanical one)
- `src/app/puzzles/actions.ts` — edited: `enterHints` returns and persists
  `grid`
- `src/components/grid/PuzzleGridEditor.tsx` — edited: applies the returned
  grid; wires the confirmation
- `src/components/grid/PhaseControls.tsx` — edited: two-step confirmation
- `e2e/phase-controls.spec.ts` — **edited** (**already provided — do not
  edit**; authorized changes to a committed acceptance test)
- `e2e/hints-transition.spec.ts` — new Playwright tests (**already
  provided — do not edit**)

## Required contract

```ts
// src/engine/phase.ts (behavior change, signature unchanged)

/**
 * Transitions phase to 'hints'. Before deriving anything, converts every
 * active cell holding no letter into a black cell — an unfilled cell is a
 * black cell. Then fills in blank ('') entries for any required hint of
 * the *converted* grid not already present in puzzle.hints.
 */
export function enterHintsPhase(puzzle: Puzzle): Puzzle;
```

```ts
// src/app/puzzles/actions.ts (return type widened)
import type { SerializedGrid } from '../../lib/puzzle-storage';

export async function enterHints(id: string): Promise<{
  phase: Phase;
  hints: Record<string, string>;
  grid: SerializedGrid;   // new — without this the conversion is discarded
}>;
```

The action must also persist `grid` alongside `hints` and `phase`. It
currently writes only the latter two.

## Markup contract

`PhaseControls` gains a two-step confirmation on the existing
`enter-hints-button`:

- Clicking `data-testid="enter-hints-button"` reveals
  `data-testid="enter-hints-confirmation"`, whose visible text includes
  **"cannot be undone"** and states how many cells will be blackened.
- `data-testid="enter-hints-confirm-button"` performs the transition;
  `data-testid="enter-hints-cancel-button"` returns to the initial state.

## Decisions

**Why this moment and no other.** Slots, numbering, and required hints are
all derived from geometry. If empty cells stay active while hints are
authored, `extractSlots` sees a 15-cell across run where the finished
puzzle has a 6-cell one — the numbering is wrong, the required-hint set is
wrong, and the builder writes clues against a puzzle nobody will ever see.
Converting at publish time is too late for the same reason. The hints
transition is already where geometry freezes, so it's where the final
geometry must be decided.

**Four changes, not one.** The engine change alone accomplishes nothing.
`enterHints` currently persists only `hints` and `phase` and returns no
grid; `handleEnterHints` applies only the returned hints and never touches
grid state. Both were deliberately designed that way by Story P4, on the
assumption the transition never touched geometry — the assumption this
story reverses. Without changing all three, the conversion is computed and
silently discarded.

**A confirmation, because this is irreversible.** There is no reverse
hints→grid transition. That puts this in the same category as delete and
clear-letters, which both get honest confirmation copy. It is *not* a gate
— the builder always proceeds if they want to — and it states the concrete
count ("9 empty cells will become black") rather than a vague warning,
because the number is exactly the information needed to decide.

**Symmetric counterparts are not auto-blackened.** The conversion blackens
exactly the empty cells and nothing more. A builder whose filled cells
aren't symmetric gets an asymmetric grid, which is their prerogative per
the epic's governing principle.

**A puzzle already in hints phase is unaffected.** Calling
`enterHintsPhase` on a `'hints'`-phase puzzle should not re-convert. In
practice the UI never offers it, but the function shouldn't depend on that.

## Test changes (read before implementing)

Four committed assertions in `src/engine/phase.test.ts` change, three
because their fixtures become degenerate and one for a subtler reason:

1. **"geometry is untouched"** asserts `expect(next.grid).toBe(grid)`. Its
   entire point is that no rebuild happened. Deleted and replaced with
   conversion assertions.
2. **"fully active 3×3 grid gets exactly the 6 derived hint keys"** — its
   fixture is fully empty, so post-conversion the grid is entirely black
   and yields no slots at all. Refixtured with letters.
3. **"existing authored text is preserved"** — same fixture, same problem.
   Refixtured.
4. **The E4 purity check** `expect(a).toEqual(b)` on two `enterHintsPhase`
   results. This passes today only because both results share one grid
   *reference*, so the comparison short-circuits. Once the grid is rebuilt
   per call, the two `at` closures are distinct objects and `toEqual`
   fails. Rewritten to compare cells explicitly.

`e2e/phase-controls.spec.ts` also changes: five tests must click through
the new confirmation, and several must seed grids **with letters**, since
a fully-empty seed leaves no active cells after conversion — "letter
editing still works in hints phase" would have nowhere to type.

## Scope discipline

- **No preview toggle.** That's PB1b.
- **No reverse hints→grid transition.** Doesn't exist, isn't added.
- **No publishing, no `publishedAt`.** Later stories.
- **No readiness checks.** PB2.
- **No changes to `extractSlots`, `numberGrid`, `requiredHints`, or
  `hintsComplete`** — the conversion happens before they run, so none of
  them needs to know about it.
- **No changes to `applyGeometryEdit` or `applyLetterEdit`.**

## Acceptance examples

**PB1a-1 — `enterHintsPhase` conversion (Vitest)**
- A 3×3 grid with letters at `(0,0)`,`(1,0)`,`(2,0)`,`(0,1)`,`(0,2)` and
  the other four cells empty → after the transition those four are
  `{ kind: 'black' }` and the five lettered cells are unchanged.
- The resulting required hints are exactly `1-across` and `1-down` — the
  converted geometry leaves one 3-cell across run and one 3-cell down run,
  both starting at `(0,0)`.
- Authored text for a still-required hint survives; blank entries are
  added for the rest.
- Extra keys matching no required hint are left untouched.
- A grid with no empty active cells is returned cell-for-cell identical.
- A fully black grid converts to itself; hints stay `{}`.
- Purity: the input puzzle's grid still has its empty active cells
  afterward.
- Two calls on the same input produce cell-for-cell equal grids and equal
  hints (compared explicitly, not via whole-object `toEqual`).

**PB1a-2 — transition flow (Playwright)**
- Clicking `enter-hints-button` shows a confirmation containing "cannot be
  undone" and the count of cells that will be blackened; the phase badge
  still reads `grid`.
- Cancelling returns to the initial state, still in grid phase, grid
  unchanged.
- Confirming moves to hints phase and blackens exactly the empty cells;
  lettered cells stay active with their letters.
- The converted grid survives a reload — proving `grid` was actually
  persisted, not just applied locally.

## Definition of done

1. `src/engine/phase.test.ts` passes with its rewritten E2/E4 cases.
2. `e2e/phase-controls.spec.ts` and `e2e/hints-transition.spec.ts` both
   pass: `npm run test:e2e`.
3. `tsc --noEmit` is clean across the repo.
4. Lint is clean.
5. `npm run verify` exits 0.

Write the implementation to make the provided tests green. Do not edit the
tests to match your implementation — the tests are the specification.
