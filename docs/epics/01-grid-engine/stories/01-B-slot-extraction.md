# Story B — Slot extraction

Second slice of the grid-engine epic. A **slot** is a maximal run of ≥2 contiguous
active cells in one direction. Everything downstream — numbering, hint derivation,
the frozen slot set in the phase lock — reads slots, so this is the second
load-bearing story after the data model.

Repo paths:
- `src/engine/slots.ts` — types + extraction (you create this)
- `src/engine/slots.test.ts` — the acceptance tests (**already provided — do not edit**)

## Required public API

The tests import exactly this surface. Match it.

```ts
// src/engine/slots.ts
import type { Coord, Grid, Orientation } from './grid';

export interface Slot {
  readonly orientation: Orientation;
  readonly start: Coord;
  readonly cells: readonly Coord[];   // in reading order, length >= 2
  readonly length: number;            // === cells.length
}

export function extractSlots(grid: Grid): readonly Slot[];
```

**Note on `Slot.number`.** The epic's illustrative type carries a `number` field.
It is deliberately absent here: numbering is Story C, and a field that exists but
holds a placeholder is worse than no field. Story C will introduce
`NumberedSlot = Slot & { readonly number: number }` and leave `Slot` alone.

## Semantics (the rules the tests encode)

- **A slot** is a maximal run of ≥2 contiguous active cells along one orientation,
  bounded at each end by a non-active lookup — a black cell *or* the grid edge.
  Because `at()` returns `{ kind: 'outside' }` off-grid, both boundary conditions
  are the same test: `at(col, row).kind !== 'active'`. No separate bounds check is
  needed anywhere in this module.

- **Maximal** means a run is never a sub-slice of a longer run. A row of 10 active
  cells yields one across slot of length 10, not nine overlapping pairs.

- **Isolated cells produce nothing.** A run of exactly 1 active cell is not a slot
  in that orientation. A cell can start a down slot while belonging to no across
  slot, and vice versa.

- **Letters are irrelevant.** Extraction reads only `kind`. A grid with letters
  and the same black pattern yields identical slots.

- `cells` is in reading order — left-to-right for across, top-to-bottom for down.
  `start` equals `cells[0]`. `length` equals `cells.length`.

- **Ordering of the returned array** (a decision, not specified in the epic):
  **all across slots first, then all down slots.** Within each group, ordered by
  start cell in reading order — row ascending, then column ascending. For down
  slots this is reading order of the *start cell*, not column order: a
  down slot starting at `(10,1)` sorts after one starting at `(14,0)`. This is
  deterministic and the tests assert it, so it is now an engine rule.

- **Purity.** `extractSlots` does not mutate the grid and holds no state between
  calls. Two calls on the same grid return deep-equal results.

### Boundary behavior

- A fully black grid yields an empty array.

## Scope discipline

- **No numbering.** Not even a counter. Story C owns it.
- **No minimum-length policy.** Extraction finds runs of ≥2. A rule like "no
  2-letter words" is a separate configurable validator in a later story; do not
  filter here and do not add an options parameter for it.
- **No slot lookup by cell**, no `slotsAt(coord)`, no caching, no memoization.
  Later stories will need some of these; they can ask.
- The engine imports no React and no database client. The lint boundary was
  proven in Story A — no need to re-demonstrate it here.

## Acceptance examples

**B1 — across runs**
- 15×15, row 0 with col 10 black and all else in that row active → two across
  slots on row 0: `start (0,0)` length 10, and `start (11,0)` length 4.
- The first slot's `cells` is exactly `(0,0)` through `(9,0)` in order.

**B2 — the ≥2 rule**
- 3×3 with every cell black except the center `(1,1)` → **zero** slots.
- 15×15 with col 1 black on row 0 → the single active cell at `(0,0)` starts no
  across slot; it may still start a down slot.
- A run of exactly 2 active cells **is** a slot.

**B3 — full grid**
- Fully active 15×15 → exactly 30 slots: 15 across of length 15, then 15 down of
  length 15.
- The first element is the across slot starting `(0,0)`; the sixteenth is the
  down slot starting `(0,0)`.

**B4 — ordering**
- On a grid with across slots starting at `(0,0)`, `(11,0)`, and `(0,1)`, the
  returned across slots appear in that order.
- Every across slot in the array precedes every down slot.

**B5 — purity and letter-independence**
- `extractSlots(grid)` called twice → deep-equal results.
- A grid with the same black pattern but letters present → identical slots.

## Definition of done

1. `src/engine/slots.test.ts` passes unmodified.
2. `tsc --noEmit` is clean.
3. Lint is clean.
4. `npm run verify` exits 0.

Write the implementation to make the provided tests green. Do not edit the tests
to match your implementation — the tests are the specification.
