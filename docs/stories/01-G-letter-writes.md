# Story G — Letter writes

Fifth slice of the grid-engine epic, and the last thing blocking both E (phase
lock) and F (cursor/navigation). The engine currently cannot construct a grid
containing a letter: `createGrid` sets every active cell to `letter: null` and
nothing writes one. This story adds the missing primitive and fixes the one
existing function that silently discards letters because it predates this
primitive.

Repo paths:

- `src/engine/grid.ts` — add `withLetter` (existing file, alongside `createGrid`)
- `src/engine/symmetry.ts` — fix `toggleBlackSymmetric` to preserve letters, by rebuilding via `createGrid` as before and then replaying prior letters onto the result with `withLetter` (existing file; signature unchanged)
- `src/engine/grid.test.ts` — G1 acceptance tests for `withLetter` (**new file, already provided — do not edit**)
- `src/engine/symmetry.test.ts` — existing Group A tests (A1–A3, unchanged) plus new G2 acceptance tests for `toggleBlackSymmetric`'s letter preservation (**already provided — do not edit**)

## Required public API

The tests import exactly this surface. Match it.

```ts
// src/engine/grid.ts (addition to the existing file)
import type { Coord, Grid } from "./grid";

/**
 * Returns a new grid with one active cell's letter changed. `letter: null`
 * clears the cell. Unchanged cells are shared by reference with the input
 * grid (structural sharing) — a 50x50 edit allocates arrays, not 2,500 cells.
 *
 * Precondition: `coord` must reference an active cell within grid bounds.
 * This is an internal primitive, not a user-facing operation — callers
 * (`applyLetterEdit`, `place`) are responsible for checking validity before
 * calling. Calling with a black or off-grid coord (a `Lookup` of kind
 * `'black'` or `'outside'`) is a caller bug and throws.
 */
export function withLetter(
  grid: Grid,
  coord: Coord,
  letter: string | null,
): Grid;
```

```ts
// src/engine/symmetry.ts (existing file, behavior fixed, signature unchanged)
import type { Coord, Grid } from "./grid";

// Previously rebuilt via createGrid and discarded every letter in the grid.
// Now preserves all letters except at the (at most two) toggled cells, by
// building the new black/active pattern as before and then using withLetter
// to carry forward every pre-existing letter that wasn't on a toggled cell.
export function toggleBlackSymmetric(grid: Grid, coord: Coord): Grid;
```

## Decision: behavior at a black or off-grid coord

The epic left this open. Settled here: **`withLetter` throws.**

Two other options were considered and rejected:

- _Return the grid unchanged._ This matches the cursor-policy no-op pattern
  from Group F (clicking a black cell does nothing), but that pattern is
  about _user_ input, where "do nothing" is a reasonable response to a normal
  action. `withLetter` is an internal primitive — code calling it with a
  black coord is a bug, not a user doing something unusual. Returning the
  grid unchanged would let that bug produce a puzzle silently missing a
  letter, with no error anywhere: the exact failure mode `at()` returning
  `{ kind: 'outside' }` was designed to prevent.
- _Make it unrepresentable with a branded type_, so `withLetter` only accepts
  a coord already known to be active. TypeScript can't express that without
  more machinery than this deserves (a branded/nominal type threaded through
  every caller). Rejected on AGENTS.md rule 2 grounds — speculative
  abstraction for a single-use guarantee.

Throwing is consistent with `createGrid`'s existing stance (decision 3):
out-of-range coordinates are caller bugs, not user states, and get a
`TypeError` from array indexing. Writing to a black square is the same class
of bug. The throw is an assertion, not error handling for a reachable user
state — it stays within rule 2 because it isn't handling an impossible
state, it's failing loudly on one.

## Semantics

- **`withLetter` writes exactly one cell.** All other cells — including
  unrelated rows — are shared by reference with the input grid, not merely
  deep-equal to it.
- **`letter: null` clears** an active cell back to empty. It is a normal
  write, not a special case.
- **Precondition, not validation.** `withLetter` does not distinguish "black"
  from "off-grid" in its behavior — both throw. It does not return a
  `Result`/error-object; the throw is the whole mechanism.
- **`toggleBlackSymmetric` letter rule:** toggling a cell **to** black
  discards that cell's letter (black cells hold no letter — there is nothing
  to preserve). Toggling a cell **to** active gives it `letter: null` (a
  fresh empty cell — there is no letter to restore, since it had none while
  black). Every cell other than the (at most two) toggled coords keeps its
  letter unchanged, including the untouched member of a pair when the
  toggle target is its own counterpart (center cell, odd dimensions).
- **Purity.** Both functions return new grids; neither mutates its input.
  Two calls on the same input return deep-equal results.
- **Size is never assumed.** No implementation may hardcode 15.

### Boundary behavior

- Writing a letter to an active cell that already holds a letter → the new
  letter replaces the old one; unrelated cells are untouched.
- Writing at a coord outside `[0, cols) x [0, rows)` → throws.
- Writing at a coord that is `kind: 'black'` → throws.
- Toggling a cell from active-with-letter to black → that cell's letter is
  gone in the result (it's black, not active-with-null); everything else,
  including other letters, is unchanged.
- Toggling a cell from black to active → the new active cell has
  `letter: null`; everything else is unchanged.

## Scope discipline

- **No other grid functions touched.** `symmetricCounterpart`, `isSymmetric`,
  `extractSlots`, `numberGrid`, `slotsWithNumbers`, `requiredHints`,
  `hintsComplete` are all out of scope. Nothing about this story's letter
  primitive changes their behavior or signatures.
- **No `Cell` or `Grid` type changes.** Both are already shaped to hold a
  letter (`{ kind: 'active'; letter: string | null }`); this story is only
  about the function that writes one.
- **No edit-legality rules.** `withLetter` does not know about phase, does
  not check whether an edit would shorten a slot, and does not gate anything.
  That's `applyLetterEdit` (Story E) and `place` (Story F), both of which are
  callers of this primitive, not part of it.
- **No caching or memoization.** Recompute from the input on every call, with
  structural sharing for the unchanged parts — not a cached result.
- **No branded/nominal coord type.** See the decision section above.
- The engine imports no React and no database client — no need to
  re-demonstrate the lint boundary here.

## Acceptance examples

**G1 — `withLetter`**

- Active cell `(2,3)` with `letter: null`, `withLetter(grid, {col:2,row:3}, 'A')` → new grid has `'A'` at `(2,3)`; original grid's cell at `(2,3)` still `null` (purity).
- Active cell holding `'A'`, `withLetter(grid, coord, null)` → cell becomes `letter: null`.
- Rows/cells other than the target are reference-equal (`===`) between input and output grid, not just deep-equal — structural sharing.
- `withLetter(grid, blackCoord, 'A')` → throws.
- `withLetter(grid, { col: -1, row: 0 }, 'A')` → throws.
- `withLetter(grid, { col: cols, row: 0 }, 'A')` → throws (off the right edge).

**G2 — `toggleBlackSymmetric` preserves letters**

- 15x15 grid, several active cells carry letters, `(0,0)` and `(14,14)` both carry letters, toggle `(0,0)` to black → result has `(0,0)` and `(14,14)` black (mirrored per Story A); every other letter present beforehand is still present and unchanged.
- Same grid, toggle a currently-black symmetric pair to active → both cells become active with `letter: null`; all pre-existing letters elsewhere unchanged.
- Toggle the center `(7,7)` on an odd-dimension grid with a letter there → only `(7,7)` changes (self-counterpart, per Story A3); its letter is discarded since it becomes black.
- Purity: original grid unchanged after `toggleBlackSymmetric`; two calls on the same input are deep-equal.

## Definition of done

1. `src/engine/grid.test.ts` (new, G1 only) passes.
2. `src/engine/symmetry.test.ts` passes — its existing Group A tests (A1–A3) unmodified, plus the new G2 tests appended to it.
3. `tsc --noEmit` is clean.
4. Lint is clean.
5. `npm run verify` exits 0.

Write the implementation to make the provided tests green. Do not edit the tests
to match your implementation — the tests are the specification.
