# Story C — Numbering

Third slice of the grid-engine epic. Numbering assigns the shared across/down
number to each cell that starts a slot. It reads Story B's output rather than
re-deriving run boundaries, so a cell numbered here is, by construction, a
start cell of something `extractSlots` returned.

Repo paths:
- `src/engine/numbering.ts` — types + numbering (you create this)
- `src/engine/numbering.test.ts` — the acceptance tests (**already provided — do not edit**)

## Required public API

The tests import exactly this surface. Match it.

```ts
// src/engine/numbering.ts
import type { Coord, Grid } from './grid';
import type { Slot } from './slots';

export interface NumberedCell {
  readonly coord: Coord;
  readonly number: number;
}

export function numberGrid(grid: Grid): readonly NumberedCell[];

export type NumberedSlot = Slot & { readonly number: number };

export function slotsWithNumbers(grid: Grid): readonly NumberedSlot[];
```

**Note on the return shape.** The epic's original sketch was
`numberGrid(grid) -> Map<Coord, number>`. That does not work: `Coord` is an
object type and `Map` keys by reference identity, so a structurally equal but
distinct coord object never matches a stored key. `numberGrid` returns an
ordered array instead — which also lets "strictly increasing, no gaps" and
"count of distinct numbers" be asserted directly against the array, rather
than through a lookup.

## Semantics (the rules the tests encode)

- **Numbered cells are exactly the start cells of `extractSlots(grid)`.**
  Numbering does not re-derive run boundaries or re-inspect neighbors — it
  collects every slot's `start`, sorts in reading order (row ascending, then
  column ascending), removes duplicates (an across and a down slot can share
  a start cell), and assigns `1..n` in that order. This is what makes "an
  across and a down slot starting at the same cell share a number"
  structurally true rather than a coincidence the tests happen to catch.

- **`numberGrid`** returns one `{ coord, number }` entry per distinct start
  cell, in the same reading order used to assign the numbers — so the array
  is already sorted by `number` ascending.

- **`slotsWithNumbers`** returns every slot from `extractSlots`, unchanged
  except for the added `number` field, in `extractSlots`'s own order (all
  across slots first, then all down slots; within each group, start-cell
  reading order — the ordering rule Story B established). It does not
  re-sort, filter, or drop anything.

- **Letters are irrelevant.** Numbering reads only the slot set, which is
  itself letter-independent (Story B, B5). A grid with letters and the same
  black pattern numbers identically.

- **Purity.** Neither function mutates the grid or holds state between calls.
  Two calls on the same grid return deep-equal results.

### Boundary behavior

- A grid with no slots (fully black, or too small for any run of ≥2) →
  `numberGrid` and `slotsWithNumbers` both return an empty array.

## Scope discipline

- **No hint derivation.** Required-hint lists, `HintRef`, and anything about
  hint text are Story D. This story stops at numbers.
- **No `number` field on `Slot` itself.** `Slot` (from `slots.ts`) is not
  touched. `NumberedSlot` is a separate type — `Slot & { number }` — exactly
  as Story B's note promised. Do not widen `Slot`.
- **No caching or memoization.** Both functions recompute from `grid` on
  every call, same as `extractSlots`.
- **No `numberAt(col, row)` accessor.** The epic mentions one as optional
  convenience; it isn't required by any test here and isn't part of this
  story's surface. A later story can ask for it if it turns out to be needed.
- The engine imports no React and no database client. The lint boundary was
  proven in Story A — no need to re-demonstrate it here.

## Acceptance examples

**C1 — `numberGrid`**
- 15×15, fully active → `(0,0)` is numbered `1` (it starts both an across and
  a down slot, but appears once in the array).
- 15×15 with `(1,0)` black → `(0,0)` starts no across slot (isolated in that
  direction) but still starts a down slot, so it still gets a number.
- 15×15 with `(10,0)` black (Story B's `splitRow0` grid) → the first entries
  in reading order are `(0,0)`, `(1,0)`, `(2,0)`, ... `(9,0)`, `(11,0)` —
  numbered `1` through `11`. Note that `(1,0)` through `(9,0)` start down
  slots only, and `(10,0)` is black; this is the order of *all* start cells,
  not the across-slot order from Story B's B4.
- Numbers strictly increase by exactly 1 across the array; the array's length
  equals the count of distinct cells that start ≥1 slot in `extractSlots`'s
  output.

**C2 — `slotsWithNumbers`**
- `slotsWithNumbers(grid).length === extractSlots(grid).length` — every slot
  gets a number, none are added or dropped.
- On the `splitRow0` grid, the across slot starting `(0,0)` has `number === 1`.
- An across slot and a down slot that start at the same coord carry the same
  `number`.
- Slot order matches `extractSlots`'s order exactly: across slots first, then
  down; every field other than `number` is unchanged from the corresponding
  `extractSlots` entry.

**C3 — purity and letter-independence**
- `numberGrid(grid)` called twice → deep-equal results. Same for
  `slotsWithNumbers`.
- A grid with the same black pattern but letters present numbers identically
  to the plain grid, for both functions.

**C4 — boundary**
- A fully black grid → `numberGrid` and `slotsWithNumbers` both return `[]`.

## Definition of done

1. `src/engine/numbering.test.ts` passes unmodified.
2. `tsc --noEmit` is clean.
3. Lint is clean.
4. `npm run verify` exits 0.

Write the implementation to make the provided tests green. Do not edit the
tests to match your implementation — the tests are the specification.
