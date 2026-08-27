# Story F — Cursor / navigation

Seventh and final slice of Group A–G. The **rules** of cursor movement live
in the engine as pure functions over `(grid, CursorState, intent)`. The
DOM/keyboard event layer that fires these — translating a physical keypress
or click into a call here — is explicitly later UI work (non-goal for this
epic). Cursor functions take `(grid, cursor, ...)`, never a `Puzzle`, so the
same functions serve a builder typing answers and a player typing guesses.

Repo paths:
- `src/engine/cursor.ts` — `CursorState`, `ArrowDirection`, `place`,
  `arrowKey`, `deleteAt`, `moveTo` (new file)
- `src/engine/cursor.test.ts` — the acceptance tests (**already provided —
  do not edit**)

## Required public API

The tests import exactly this surface. Match it.

```ts
// src/engine/cursor.ts
import type { Coord, Grid, Orientation } from './grid';
import { withLetter } from './grid';

export interface CursorState {
  readonly current: Coord;
  readonly orientation: Orientation;
}

export type ArrowDirection = 'up' | 'down' | 'left' | 'right';

/**
 * Writes `letter` into the current active cell, then advances one active
 * cell in the current orientation. If the next cell in that direction is
 * black or off-grid, the cursor stays where it is.
 */
export function place(
  grid: Grid,
  cursor: CursorState,
  letter: string
): { grid: Grid; cursor: CursorState };

/**
 * Sets orientation to the direction's axis (left/right -> 'across',
 * up/down -> 'down'), then moves one active cell that way. If blocked by
 * an edge or a black cell, the orientation change still applies; only the
 * position stays put.
 */
export function arrowKey(grid: Grid, cursor: CursorState, direction: ArrowDirection): CursorState;

/**
 * Backspace. If the current cell has a letter, clears it and the cursor
 * stays. If the current cell is already empty, retreats one active cell in
 * the current orientation and clears that cell instead; the cursor moves
 * there. If there is no active cell to retreat into, nothing is cleared and
 * the cursor stays.
 */
export function deleteAt(grid: Grid, cursor: CursorState): { grid: Grid; cursor: CursorState };

/**
 * Mouse/trackpad click. Moving to an active cell updates the cursor's
 * position (orientation unchanged). Clicking anywhere else that isn't an
 * active cell — black or off-grid — is a no-op.
 */
export function moveTo(grid: Grid, cursor: CursorState, coord: Coord): CursorState;
```

## Decisions

**No reference-identity guarantee on "nothing changed" results, unlike
Group E.** `applyGeometryEdit` guarantees the exact same `Puzzle` reference
back on a no-op or rejection, because `Puzzle`/`Grid` are structures where
avoiding a reallocation is worth documenting and testing. `CursorState` is a
two-field value (`{ current, orientation }`); there's no comparable cost to
avoid, and no part of the epic asks for it. So: these four functions only
guarantee ordinary purity — no mutation, and two calls with the same inputs
produce deep-equal results. Whether a "stays put" result happens to be the
same object reference or a freshly-built equal one is an implementation
detail, not a tested contract. (Tests below use `toEqual`, not `toBe`, for
`CursorState` — contrast with Story E's `toBe` assertions on `Puzzle`.)

**`moveTo`'s no-op rule covers off-grid the same way it covers black.** The
epic's own example only shows clicking a black cell. But the stated policy —
"clicks only land on active cells" — is written in terms of what a click
*can* land on, not black specifically; an off-grid `coord` is just another
case of "not an active cell." Both `{ kind: 'black' }` and
`{ kind: 'outside' }` results from `grid.at(...)` get the same treatment:
no-op.

**No new preconditions beyond what `withLetter` already enforces.** A
`CursorState` is only ever produced by these four functions themselves (or
constructed by a caller as a starting value), and every path that sets
`current` — `place`'s advance, `arrowKey`'s move, `moveTo` — only ever moves
it onto an active cell or leaves it where it was. So `cursor.current` should
always reference an active cell by construction. `place` and `deleteAt` both
call `withLetter(grid, cursor.current, ...)` directly with no separate
active-cell check; if `cursor.current` is somehow black or off-grid, that's
the same class of caller bug `withLetter` already throws on (Story G) — no
new check is added here to catch it earlier.

## Semantics

- **Orientation-to-step mapping**, used by both `place`'s advance and
  `arrowKey`'s move: `'across'` forward is `+1 col`, backward is `-1 col`;
  `'down'` forward is `+1 row`, backward is `-1 row`.
- **`arrowKey`'s direction-to-axis mapping:** `'left'`/`'right'` ->
  orientation `'across'`; `'up'`/`'down'` -> orientation `'down'`. `'left'`
  and `'up'` step backward on their axis; `'right'` and `'down'` step
  forward.
- **A step "succeeds" only if `grid.at(...)` on the stepped-to coord is
  `kind: 'active'`.** Anything else (`'black'` or `'outside'`) means the
  step doesn't happen; position is unchanged.
- **No wrap, no auto-jump.** Reaching the edge of the grid or the end of a
  run simply stops movement there. Jumping into the next slot on completion
  is explicitly a deferred enhancement per the epic, not part of this
  story.
- **`place`** always writes the letter (via `withLetter`) regardless of
  whether the advance afterward succeeds.
- **`deleteAt`, cell has a letter:** clears it via `withLetter(grid,
  cursor.current, null)`; cursor does not move.
- **`deleteAt`, cell already empty:** computes the backward step for the
  current orientation. If that coord is active, clears *that* cell and
  moves the cursor there. If not (edge or black), nothing is cleared and the
  cursor stays — `deleteAt` does not call `withLetter` at all in this case.
- **`moveTo`** never changes `orientation` — only ever `current`, and only
  when the target is active.
- **Purity.** None of the four functions mutate their `grid` or `cursor`
  arguments. Two calls with the same inputs return deep-equal results.

### Boundary behavior

- `place` at the last active cell of a run (edge of grid, or the next cell
  in that direction is black) → letter is written; cursor's `current` is
  unchanged, `orientation` is unchanged.
- `arrowKey` when the move is blocked but the direction's axis differs from
  the cursor's current orientation → `orientation` still changes to match
  the direction; `current` stays put. (This is the case that shows the two
  effects are independent — a blocked move is not "everything stays the
  same.")
- `deleteAt` at the first cell of a run, already empty, with a black cell or
  the grid edge behind it → cursor stays, grid is returned unchanged (same
  data either way; no assumption is made about the returned grid's
  reference).
- `deleteAt`'s retreat can be blocked by a black cell between two runs, not
  only by the grid edge — both count as "nothing to retreat into."
- `moveTo` onto the cursor's own current coordinate (clicking the active
  cell you're already on) → cursor unchanged, treated as an ordinary
  successful move to an active cell (not specially detected as a no-op).
- Dimensions are never assumed; no implementation may hardcode a grid size.

## Scope discipline

- **No DOM/keyboard event translation.** These functions take an already-
  decided `ArrowDirection` or `Coord`; deciding *which* key or click produced
  that value is the (later, out-of-scope) UI layer's job.
- **No auto-jump to the next slot on completing a word.** Deferred
  enhancement, explicitly excluded by the epic.
- **No wrap-around at grid edges.**
- **No `Puzzle`, phase, or hints involvement whatsoever.** These functions
  take `(grid, cursor, ...)` only, per the epic's explicit reasoning: the
  same functions must serve both a builder (`Puzzle.grid`) and a player
  (`entries: Grid`) unchanged.
- **No new types added to `grid.ts` or `puzzle.ts`.** `CursorState` and
  `ArrowDirection` are new but live in `cursor.ts`, which is otherwise a new,
  self-contained module.
- **No caching or memoization.**
- The engine imports no React and no database client — no need to
  re-demonstrate the lint boundary here.

## Acceptance examples

**F1 — `place`**
- Orientation `'across'`, current `(0,0)`, `place(grid, cursor, 'A')` on a
  fully active grid → `'A'` written at `(0,0)`; cursor becomes `{ current:
  (1,0), orientation: 'across' }`.
- Orientation `'down'`, current `(0,0)`, same call → `'A'` at `(0,0)`;
  cursor becomes `{ current: (0,1), orientation: 'down' }`.
- Current cell is the last active cell before a black cell (or the grid
  edge) in the current orientation → letter written, cursor's `current`
  unchanged.

**F2 — `arrowKey`**
- Current `(0,0)`, `arrowKey(grid, cursor, 'down')` → `{ current: (0,1),
  orientation: 'down' }`.
- Current `(0,0)`, `arrowKey(grid, cursor, 'right')` → `{ current: (1,0),
  orientation: 'across' }`.
- Move blocked by the grid edge or a black cell → `orientation` updates to
  match the direction's axis regardless; `current` stays.

**F3 — `deleteAt`**
- Current cell holds a letter, orientation `'across'`, `deleteAt` → that
  cell cleared, cursor's `current` unchanged.
- Same coord, called again (now empty) → retreats one cell backward in
  `'across'`, clears that cell, cursor moves there.
- At the first cell of a run (nothing active behind it), already empty →
  cursor stays, nothing cleared.

**F4 — `moveTo`**
- Click an active cell → cursor's `current` moves there; `orientation`
  unchanged.
- Click a black cell → no-op, cursor unchanged.
- Click an off-grid coordinate → no-op, cursor unchanged (same treatment as
  black — see Decisions).

**F5 — purity and size**
- Each function called twice with identical inputs → deep-equal results.
- None of the four functions mutate the `grid` or `cursor` passed in.
- Behavior holds on a non-square, non-15x15 grid — no implementation may
  hardcode dimensions.

## Definition of done

1. `src/engine/cursor.test.ts` passes unmodified.
2. `tsc --noEmit` is clean.
3. Lint is clean.
4. `npm run verify` exits 0.

Write the implementation to make the provided tests green. Do not edit the
tests to match your implementation — the tests are the specification.
