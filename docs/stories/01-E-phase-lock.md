# Story E — Phase lock

Sixth slice of the grid-engine epic. Two phases: `'grid'` and `'hints'`.
Entering hints freezes geometry (the black/active pattern) — which freezes
the slot set and numbering, since both are derived from geometry — while
still allowing letter edits. This is what keeps the required-hint list from
desyncing mid-authoring.

Repo paths:
- `src/engine/phase.ts` — `applyGeometryEdit`, `enterHintsPhase`,
  `applyLetterEdit` (new file)
- `src/engine/phase.test.ts` — the acceptance tests (**already provided —
  do not edit**)

This story adds no new types to `puzzle.ts` — `Puzzle` and `Phase` already
exist from Story D and are unchanged.

## Required public API

The tests import exactly this surface. Match it.

```ts
// src/engine/phase.ts
import type { Coord } from './grid';
import type { Puzzle } from './puzzle';

export type GeometryEditResult =
  | { readonly ok: true; readonly puzzle: Puzzle }
  | { readonly ok: false; readonly error: string; readonly puzzle: Puzzle };

/**
 * Sets the black/active state of one cell, mirrored to its symmetric
 * counterpart. Allowed only in the 'grid' phase. In 'hints' phase, rejected:
 * returns { ok: false, error, puzzle } with the same, unchanged puzzle.
 */
export function applyGeometryEdit(
  puzzle: Puzzle,
  coord: Coord,
  black: boolean
): GeometryEditResult;

/**
 * Transitions phase to 'hints' and fills in blank ('') entries for any
 * required hint not already present in puzzle.hints. Does not snapshot
 * slots or numbering — those stay derived.
 */
export function enterHintsPhase(puzzle: Puzzle): Puzzle;

/**
 * Writes a letter into one active cell. Allowed in both phases — letter
 * edits never touch geometry, so there is nothing for either phase to
 * freeze against.
 */
export function applyLetterEdit(puzzle: Puzzle, coord: Coord, letter: string | null): Puzzle;
```

## Decisions

**`applyGeometryEdit` delegates to `toggleBlackSymmetric`, not a new
non-mirroring primitive.** The epic gives `applyGeometryEdit(puzzle, coord,
black)` an explicit target boolean rather than a toggle, which could be read
as "set this one cell, no mirroring." But no non-mirroring black/active
setter exists anywhere in the engine — `toggleBlackSymmetric` (Group A) is
the only function that changes a cell's kind, and its own doc calls itself
"the phase-1 assist that keeps the builder symmetric by default." Introducing
a second, non-symmetric setter here would be a speculative addition nothing
in this story asked for (AGENTS.md rule 2). So: `applyGeometryEdit` compares
the cell's current black/active state to the requested `black`, and if they
differ, calls `toggleBlackSymmetric(puzzle.grid, coord)` — which mirrors, per
Group A. If they already match, it's a no-op (see below). Fully asymmetric
per-cell editing is out of scope for this story; the epic notes the app must
support it eventually (mini/midi, experimentation), but that's a future,
separate capability, not something to invent here as a side effect of phase
gating.

**Phase gate is checked before no-op detection, unconditionally.** A request
that would be a no-op (the cell already has the requested black/active
state) is still rejected if `phase !== 'grid'`. The alternative — letting
no-op requests through regardless of phase, since nothing would actually
change — was considered and rejected: it makes the function's behavior
depend on the *current* grid state as well as the phase, for no benefit, and
contradicts the plain reading of "allowed only in 'grid' phase."

**Implementation note on the epic's `LIONS → LYER` example.** The epic
illustrates the rejection with a geometry edit that "would shorten the
5-cell across slot ... to 4." That's motivation for *why* the freeze exists,
not a separate check to implement. The actual rejection condition is only
`phase !== 'grid'` — do not write slot-length-aware validation into
`applyGeometryEdit`. A geometry edit in `'grid'` phase that would shorten or
eliminate a slot is still accepted; slot-length policy is explicitly a
separate, not-yet-built validator per Group B's note, unrelated to phase
locking.

## Semantics

- **`applyGeometryEdit`, `'grid'` phase, state actually changes:** delegates
  to `toggleBlackSymmetric(puzzle.grid, coord)`; returns
  `{ ok: true, puzzle: { ...puzzle, grid: newGrid } }`. `hints` and `phase`
  are unchanged (same references).
- **`applyGeometryEdit`, `'grid'` phase, cell already matches requested
  `black`:** no-op. Returns `{ ok: true, puzzle }` with the *same* puzzle
  object passed in — `toggleBlackSymmetric` is not called.
- **`applyGeometryEdit`, `'hints'` phase:** always rejected, regardless of
  whether the requested change would be a no-op. Returns
  `{ ok: false, error, puzzle }` with a non-empty `error` string and the same
  puzzle object passed in.
- **`enterHintsPhase`:** sets `phase: 'hints'`. For every `HintRef` in
  `requiredHints(puzzle.grid)` (both `across` and `down`), if
  `hintKey(ref)` is not already a key in `puzzle.hints`, adds it with value
  `''`. Any key already present — whether it matches a required hint or not
  — is left exactly as it was; nothing is overwritten, nothing is pruned.
  Returns a new `Puzzle` (new `hints` object where anything changed; `grid`
  reference unchanged).
- **`applyLetterEdit`:** delegates to `withLetter(puzzle.grid, coord,
  letter)`; returns `{ ...puzzle, grid: newGrid }`. `hints` and `phase` are
  unchanged. Allowed in both phases — there is no phase check at all in this
  function. Inherits `withLetter`'s precondition: `coord` must be an active
  cell; a black or off-grid `coord` throws (caller bug, same class as
  `withLetter` itself — see Story G).
- **Purity.** None of the three functions mutate the input `puzzle`, its
  `grid`, or its `hints`. Rejected/no-op results return the identical input
  `puzzle` object (`===`), not a deep-equal copy.

### Boundary behavior

- `applyGeometryEdit` toggling a cell in `'grid'` phase also flips its
  symmetric counterpart (per Group A3) — including when the counterpart is
  the same cell (center, odd dimensions).
- `applyGeometryEdit` in `'hints'` phase, requested `black` state already
  matches the cell's current state → still rejected (`ok: false`), per the
  "phase gate first" decision above.
- `enterHintsPhase` on a fully-black grid (no slots) → `phase` becomes
  `'hints'`; `hints` is unchanged (`requiredHints` is empty, so nothing is
  added).
- `enterHintsPhase` when some required hints are already authored (e.g. a
  puzzle re-entering hints phase, or pre-filled hints) → existing text is
  preserved untouched; only missing keys get `''`.
- `enterHintsPhase` when `puzzle.hints` already has extra keys matching no
  slot → left alone, per Story D's "extras are ignored" rule.
- `applyLetterEdit` in `'hints'` phase changing one letter without altering
  any slot's length → accepted; the engine does not validate the resulting
  word against a dictionary (out of epic scope).
- `applyLetterEdit` at a black or off-grid `coord`, in either phase →
  throws.

## Scope discipline

- **No slot-length or word-validity checks anywhere in this story.** Not in
  `applyGeometryEdit` (see Decisions), not in `applyLetterEdit`.
- **No new primitive for non-mirrored geometry edits.** See Decisions.
- **No changes to `Puzzle`, `Phase`, `Grid`, `Cell`, or `Slot` types.**
- **No snapshotting of slots or numbering into `Puzzle`.** `extractSlots` /
  `slotsWithNumbers` remain the only source of truth; `enterHintsPhase`
  freezes geometry by refusing further geometry edits, not by storing
  derived data.
- **No caching or memoization** in any of the three functions.
- **No cursor/navigation logic.** That's Group F, and depends on this story
  only in that F1/F3 will themselves call `withLetter`/produce new grids —
  they do not call anything defined here.
- The engine imports no React and no database client — no need to
  re-demonstrate the lint boundary here.

## Acceptance examples

**E1 — `applyGeometryEdit`, phase gating**
- `'grid'` phase, cell currently active, `applyGeometryEdit(puzzle, coord,
  true)` → `ok: true`; that cell and its symmetric counterpart are now
  black in the returned puzzle's grid.
- The same edit (same starting puzzle, same coord, `black: true`) but with
  `phase: 'hints'` → `ok: false`, non-empty `error`, returned `puzzle` is
  the identical object passed in.
- `'grid'` phase, cell already black, `applyGeometryEdit(puzzle, coord,
  true)` (already matches) → `ok: true`, returned `puzzle` is the identical
  object passed in (no-op, `toggleBlackSymmetric` not invoked).
- `'hints'` phase, cell already matches the requested `black` (a would-be
  no-op) → still `ok: false` — the phase gate applies unconditionally.

**E2 — `enterHintsPhase`**
- Fully active 3x3 grid (3 across + 3 down slots, 5 numbered cells per
  Group C) → resulting `puzzle.hints` has exactly the 6 derived keys
  (`1-across`, `1-down`, `2-down`, `3-down`, `4-across`, `5-across`), each
  `''`.
- Same grid, `puzzle.hints` already has `{ '1-across': 'Existing clue' }`
  before the transition → after, `'1-across'` is still `'Existing clue'`;
  the other 5 keys are added as `''`.
- `puzzle.hints` has an extra key matching no slot (e.g. `'99-across'`)
  before the transition → still present, untouched, after.
- Fully black grid → `phase` becomes `'hints'`; `hints` unchanged (no keys
  added).
- `extractSlots(result.grid)` equals `extractSlots(puzzle.grid)` before the
  call — geometry itself is untouched by this function.

**E3 — `applyLetterEdit`, both phases**
- `'grid'` phase, active cell, `applyLetterEdit(puzzle, coord, 'A')` →
  accepted, letter written.
- `'hints'` phase, active cell, same call → also accepted — no phase check
  applies to letter edits.
- `'hints'` phase, changing one letter in a slot without touching any black
  cell (so the slot's length is unaffected) → accepted, matching the epic's
  worked example: a 5-cell across slot's letter at index 1 changes from
  `'I'` to `'Y'`, slot length unchanged.
- `applyLetterEdit(puzzle, blackCoord, 'A')` → throws, in either phase.
- `applyLetterEdit(puzzle, offGridCoord, 'A')` → throws.

**E4 — purity**
- None of the three functions mutate `puzzle`, `puzzle.grid`, or
  `puzzle.hints`. Two calls with the same inputs return deep-equal results.
- Rejected (`ok: false`) and no-op (`ok: true` but nothing changed) results
  from `applyGeometryEdit` return the exact same `puzzle` reference that was
  passed in, not a copy.

## Definition of done

1. `src/engine/phase.test.ts` passes unmodified.
2. `tsc --noEmit` is clean.
3. Lint is clean.
4. `npm run verify` exits 0.

Write the implementation to make the provided tests green. Do not edit the
tests to match your implementation — the tests are the specification.
