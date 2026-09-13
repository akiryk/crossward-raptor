# Story F2r — Cursor direction handling

A correction to Story F's cursor rules, to match standard crossword
convention. Arrow keys currently do two things at once — set orientation
*and* move — which makes it impossible to change direction without also
moving, and impossible to move without possibly changing direction.

The convention every major solver follows is that an arrow key does one
thing: it moves along the current orientation, or it changes orientation
without moving. Space flips orientation. Clicking the already-selected cell
flips orientation. See `docs/NYT-CROSSWORD-REFERENCE.md`.

**High blast radius** per `docs/CODE-REVIEW.md` — this changes
`src/engine/cursor.ts`. Branch and PR, don't merge.

Repo paths:
- `src/engine/cursor.ts` — edited: `arrowKey`, `moveTo`
- `src/engine/cursor.test.ts` — **rewritten F2 and F4 cases** (**already
  provided — do not edit**; see Test changes)
- `src/lib/keyboard-intent.ts` — edited: space maps to a toggle intent
- `src/lib/keyboard-intent.test.ts` — extended (**already provided — do
  not edit**)
- `src/components/grid/PuzzleGridEditor.tsx` — edited: handles the toggle
  intent
- `e2e/cursor-direction.spec.ts` — new Playwright tests (**already
  provided — do not edit**)
- `docs/NYT-CROSSWORD-REFERENCE.md` — edited: two open questions answered,
  the vague arrow-key line made specific

## Required contract

```ts
// src/engine/cursor.ts

/**
 * One action per press:
 *  - along the current orientation  -> move one active cell, orientation
 *    unchanged. Blocked by a black cell or the grid edge means no move.
 *  - perpendicular to it            -> set orientation to that axis and
 *    do NOT move.
 */
export function arrowKey(grid: Grid, cursor: CursorState, direction: ArrowDirection): CursorState;

/**
 * Clicking the cell the cursor already occupies toggles orientation.
 * Clicking a different active cell moves there, orientation unchanged.
 * Clicking a black or off-grid coord is still a no-op.
 */
export function moveTo(grid: Grid, cursor: CursorState, coord: Coord): CursorState;

/** across <-> down, position unchanged. */
export function toggleOrientation(cursor: CursorState): CursorState;
```

```ts
// src/lib/keyboard-intent.ts
export type Intent =
  | { type: 'letter'; letter: string }
  | { type: 'delete' }
  | { type: 'arrow'; direction: ArrowDirection }
  | { type: 'toggleBlack' }
  | { type: 'toggleOrientation' };   // new: ' '
```

## Decisions

**Arrows do one thing.** The current behaviour means a builder who wants to
switch from across to down also moves down a row, then has to move back.
Splitting it is what the convention does and what makes direction changes
cheap during construction.

**A blocked move is still a no-op, not a direction change.** Pressing Right
at the right edge in across mode does nothing at all. It does *not* fall
back to changing orientation — that would reintroduce the two-things
problem in a less predictable form.

**Space toggles orientation only.** NYT's app overloads space to also clear
the current square and advance. Not adopted: a builder changes direction
constantly and would lose letters by accident, and `deleteAt` already owns
clearing. One key, one meaning.

**Single click on the current cell toggles; not double-click.** The
convention is click-again, and double-click would be a second interaction
vocabulary for no gain. This supersedes Story F's explicit decision that
`moveTo` never changes orientation — that decision was made for a builder
with no other way to toggle, and space plus click-again now provide two.

**`toggleOrientation` is its own exported function.** Both the space intent
and `moveTo`'s same-cell case need it, and duplicating a two-line flip in
two places is how they drift.

**Out of scope:** Shift+arrow (perpendicular movement without changing
orientation), `[` / `]`, and Tab between clues. All real conventions, none
needed yet.

## Test changes (read before implementing)

`src/engine/cursor.test.ts`'s F2 block asserts the old behaviour directly
and is rewritten, not adjusted:

- "'down' from (0,0): orientation becomes 'down', cursor moves to (0,1)" —
  the cursor must now stay at (0,0).
- "'right' from (0,0): orientation becomes 'across', cursor moves to
  (1,0)" — from a `'down'` cursor, Right is perpendicular, so it now only
  changes orientation.
- "blocked by the grid edge: orientation still updates, position stays" and
  "blocked by a black cell: orientation still updates, position stays" —
  both premises are gone. A blocked move along the orientation changes
  nothing; a perpendicular press was never a move.

F4's `moveTo` cases gain the same-cell toggle; the black-cell and off-grid
no-op cases are unchanged.

`e2e/editing.spec.ts` ("arrow keys move selection and update orientation")
and `e2e/hints-panel.spec.ts` ("arrow key navigation updates the active
hint row") both press ArrowDown from an across cursor and expect movement.
**Check every spec that presses an arrow key**, not only these two, and
report what changed.

## Scope discipline

- **No changes to `place`, `deleteAt`, or letter handling.**
- **No changes to `extractSlots`, numbering, or hints.**
- **No Tab, Shift+arrow, or bracket keys.**
- **No change to what clicking a black or off-grid cell does** — still a
  no-op.
- **No UI beyond wiring the new intent.**

## Acceptance examples

**F2r-1 — `arrowKey` (Vitest)**
- Across cursor at (2,2), Right → moves to (3,2), orientation still
  `'across'`.
- Across cursor at (2,2), Left → moves to (1,2), orientation unchanged.
- Across cursor at (2,2), Down → orientation becomes `'down'`, cursor
  stays at (2,2).
- Down cursor at (2,2), Right → orientation becomes `'across'`, cursor
  stays.
- Down cursor at (2,2), Down → moves to (2,3).
- Across cursor at the right edge, Right → nothing changes at all.
- Across cursor with a black cell to the right, Right → nothing changes.
- Across cursor at the right edge, Down → orientation still becomes
  `'down'` (a perpendicular press isn't a move, so nothing can block it).
- Purity: input cursor is never mutated; two calls are deep-equal.

**F2r-2 — `moveTo` and `toggleOrientation` (Vitest)**
- `moveTo` onto the cursor's own coord flips orientation, position
  unchanged.
- `moveTo` onto a different active cell moves there, orientation
  unchanged.
- `moveTo` onto a black or off-grid coord is still a no-op, including when
  it's the current coord's neighbour.
- `toggleOrientation` flips across↔down and leaves `current` untouched;
  applied twice it returns the original.

**F2r-3 — `keyToIntent` (Vitest)**
- `' '` → `{ type: 'toggleOrientation' }`. Every existing case unchanged.

**F2r-4 — in the editor (Playwright)**
- From the initial across cursor, ArrowDown changes the highlighted slot
  to the down word through that cell without moving the selected cell.
- A second ArrowDown then moves the selection down one.
- Pressing space flips the highlighted slot between across and down with
  the selected cell unchanged.
- Clicking the already-selected cell flips the highlighted slot.
- Clicking a different cell moves selection without flipping.
- Typing still writes and advances along the current orientation.

## Definition of done

1. `npx vitest run src/engine/cursor.test.ts src/lib/keyboard-intent.test.ts`
   passes.
2. `e2e/cursor-direction.spec.ts` passes, and every other spec passes —
   **check rather than assume**; report any that needed authorized edits.
3. `tsc --noEmit` is clean across the repo.
4. Lint is clean.
5. `npm run verify` exits 0 and `npm run test:e2e` exits 0.
6. Opened as a PR, not merged.

Write the implementation to make the provided tests green. Do not edit the
tests to match your implementation — the tests are the specification.
