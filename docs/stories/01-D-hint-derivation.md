# Story D — Hint derivation

Fourth slice of the grid-engine epic. Required hints fall directly out of the
numbered slot set: one hint per slot, keyed by the slot's start-cell number and
its orientation. This story derives *which* hints are required and answers
whether they have all been authored. It does not store, author, or edit hint
text.

Repo paths:
- `src/engine/puzzle.ts` — the `Puzzle` type (you create this)
- `src/engine/hints.ts` — types + derivation (you create this)
- `src/engine/hints.test.ts` — the acceptance tests (**already provided — do not edit**)

## Required public API

The tests import exactly this surface. Match it.

```ts
// src/engine/puzzle.ts
import type { Grid } from './grid';

export type Phase = 'grid' | 'hints';

export interface Puzzle {
  readonly grid: Grid;                               // geometry + answer letters
  readonly hints: Readonly<Record<string, string>>;  // "3-across" -> hint text
  readonly phase: Phase;
}
```

```ts
// src/engine/hints.ts
import type { Grid, Orientation } from './grid';
import type { Puzzle } from './puzzle';

export interface HintRef {
  readonly number: number;
  readonly orientation: Orientation;
}

export interface RequiredHints {
  readonly across: readonly HintRef[];
  readonly down: readonly HintRef[];
}

export function hintKey(ref: HintRef): string;

export function requiredHints(grid: Grid): RequiredHints;

export function hintsComplete(puzzle: Puzzle): boolean;
```

**Note on `puzzle.ts`.** `Puzzle` is the epic's declared artifact type. This
story is the first that needs it, so it lands here — including `phase`, which
this story does not read. Story E owns the phase transitions; splitting the type
so D gets two fields and E adds a third would change the artifact's shape
mid-epic for no benefit. It is a type-only module: no functions.

**Note on `hintsComplete(puzzle)`.** The epic's original sketch was
`hintsComplete(grid, hints)`. Taking the whole `Puzzle` is the correction: "are
this puzzle's hints complete" is a question about one puzzle, and passing the
grid and the hint map separately invites callers to mismatch them — the grid
from one puzzle against the hints of another. The epic text still shows the old
two-argument form and needs a one-line fix.

## Semantics (the rules the tests encode)

- **One `HintRef` per slot.** `requiredHints` derives from
  `slotsWithNumbers(grid)` (Story C), not from any independent scan. Every slot
  yields exactly one ref carrying that slot's `number` and `orientation`. Nothing
  is merged: a cell numbered `1` that starts both an across and a down slot
  produces two refs — `{ number: 1, orientation: 'across' }` and
  `{ number: 1, orientation: 'down' }` — one in each group.

- **Group order follows `slotsWithNumbers`.** The `across` array holds the across
  slots in that function's order; `down` likewise. Since Story B established
  across-then-down with start-cell reading order inside each group, both arrays
  come out in ascending `number` order without any re-sorting here.

- **`hintKey` is `` `${number}-${orientation}` ``** — so `"3-across"`. This is
  the key under which `Puzzle.hints` stores authored text. A string key, not a
  `Coord` or an object, for the reason Story C documents: object keys fail on
  structural equality.

- **`hintsComplete` checks every required hint has non-blank text.** For each ref
  in both groups, `puzzle.hints[hintKey(ref)]` must exist and must contain a
  non-whitespace character. A missing key, an empty string, and a whitespace-only
  string all count as unauthored.

- **Extra authored text is ignored.** Keys in `puzzle.hints` that match no
  required hint — left behind when a geometry edit removed a slot — neither block
  completeness nor contribute to it. Only the derived refs are consulted.

- **Letters are irrelevant.** Hints derive from the slot set, which is itself
  letter-independent (Story B, B5). A grid with letters and the same black
  pattern derives identical hints.

- **Size is never assumed.** Dimensions come from the grid. No implementation may
  hardcode 15.

- **Purity.** No function mutates its input or holds state between calls. Two
  calls on the same input return deep-equal results.

### Boundary behavior

- A grid with no slots (fully black) → `requiredHints` returns
  `{ across: [], down: [] }`.
- A puzzle whose grid has no slots → `hintsComplete` is vacuously `true`: there
  is nothing left unauthored.

## Scope discipline

- **No hint authoring.** Nothing in this story sets, edits, or clears hint text.
  A function that writes into `Puzzle.hints` belongs to a later story.
- **No phase logic.** `Puzzle.phase` is declared and otherwise untouched. No
  transitions, no gating, no validation of the current phase. That is Story E.
- **No pruning of stale hints.** Extra keys are ignored, not removed. Deleting
  them would be a write, and this story performs no writes.
- **No re-derivation.** `requiredHints` calls `slotsWithNumbers`. It does not
  re-scan the grid for run boundaries or recompute numbers — the same rule Story
  C follows with respect to `extractSlots`.
- **No caching or memoization.** Recompute from the input on every call.
- **No `Slot` or `NumberedSlot` changes.** Neither type is touched.
- The engine imports no React and no database client. The lint boundary was
  proven in Story A — no need to re-demonstrate it here.

## Acceptance examples

**D1 — `hintKey`**
- `{ number: 3, orientation: 'across' }` → `"3-across"`.
- `{ number: 12, orientation: 'down' }` → `"12-down"`.

**D2 — `requiredHints`**
- Fully active 15×15 → `across.length === 15`, `down.length === 15`, 30 total.
- `splitRow0` (15×15 with `(10,0)` black) → `across.length === 16`,
  `down.length === 15`, 31 total.
- On `splitRow0`, `across` contains `{ number: 1, orientation: 'across' }`, and
  `down` contains `{ number: 1, orientation: 'down' }` — the shared number at
  `(0,0)` yields one ref in each group.
- Total ref count always equals `extractSlots(grid).length`, for every grid
  tested.
- Every ref's `number` matches the number `slotsWithNumbers` gives the
  corresponding slot, in the same order.
- Fully active 21×21 → `across.length === 21`, `down.length === 21`, 42 total.
  *(second size, per handoff decision 8)*

**D3 — `hintsComplete`**
- Every required hint authored with non-empty text → `true`.
- One required hint holding `''` → `false`.
- One required key absent from `puzzle.hints` entirely → `false`.
- One required hint holding `'   '` (whitespace only) → `false`.
- All required hints authored, plus extra keys matching no slot (e.g.
  `"99-across"`) → `true`; the extras are ignored.
- A puzzle whose grid is fully black → `true` vacuously, whatever `hints` holds.

**D4 — purity and letter-independence**
- `requiredHints(grid)` called twice → deep-equal results. Same for
  `hintsComplete(puzzle)`.
- A grid with the same black pattern but letters present derives identical
  required hints.
- `hintsComplete` does not mutate `puzzle` or `puzzle.hints`.

## Definition of done

1. `src/engine/hints.test.ts` passes unmodified.
2. `tsc --noEmit` is clean.
3. Lint is clean.
4. `npm run verify` exits 0.

Write the implementation to make the provided tests green. Do not edit the tests
to match your implementation — the tests are the specification.
