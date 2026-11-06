# Story S3 — Locked cells hold

Typing, Backspace, Delete and Rebus can't change a locked word's letters
or fill its end cells.

**Status: done 2026-11-06,** independently reviewed (no blockers) and
delivered on `main` as 6e20297. Approved and
frozen 2026-11-06 at 3dc7c6b by the orchestrating agent, under the
human's delegation (HANDOFF). Depends on S2.

**Blast radius: small to medium, expected off the risk paths.** The rules
wrap the engine's `place`/`deleteAt` from `src/lib/` and the editor;
`src/engine/` isn't changed. If the drafting phase finds an engine change
is needed, this story moves to a branch and PR (CODE-REVIEW).

## What the code does today

`place` overtypes the cursor's cell and advances. `deleteAt` clears the
cursor's letter, or on an empty cell moves back one and clears that.
Escape or Rebus opens a rebus entry on the cursor's cell. Nothing knows
about locks (S2 only shows them).

## Decisions

From the human (2026-11-06, EPIC "Protection"):

- **Protected cells** are every locked word's letters and its end cells.
- **Typing** on a protected cell changes nothing, and the cursor advances
  as if it had typed. KIND or MIND typed down from a locked K gives
  K-I-N-D.
- **Backspace / Delete** never clear a protected cell. On one, the cursor
  moves back a cell and clears nothing. Moving back onto one lands there
  and clears nothing. Backspacing out KIND clears D, N and I, rests on
  the K, then walks back past it.
- **Rebus** (the link and Escape) is disabled on a protected cell.
- **Preview on:** still protected, though not marked (EPIC).

### Delegated decisions

Proposed by the drafting agent, for the human's visual check:

- **Advancing past a protected cell** follows `place`'s rule: one cell in
  the cursor's direction if that cell is there, otherwise stay.
- **Moving back off a protected cell** follows `deleteAt`'s rule: one
  cell back if that cell is there, otherwise stay. On an end cell this
  clears nothing, not even the cell it moves onto (the engine, on an
  empty cell, would clear it).
- **Backspace from an empty unprotected cell** whose previous cell is
  protected lands there and clears nothing. Elsewhere both keys act as
  `place` and `deleteAt`.
- **An end cell holding a letter** (possible only in a grid locked
  before S3) is never cleared.
- **Nothing changed** means the same grid object, so no autosave runs.
- **Delete** is not a builder key today (`keyToIntent` maps only
  Backspace), so it already changes nothing. S3 doesn't add it.
- **Rebus:** the link is disabled while the cursor is on a protected
  cell. An entry can't be open on one, since the cursor can't move while
  it's open and locking needs the entry closed.
- **Preview on:** the same rules, with the cursor moving over Preview's
  words as it does today.
- **Reset Grid** is S6's.

## Non-goals

- New visual marks (S2 owns the look).
- Protection in the hints phase (ignored) or play.

## Acceptance (frozen 2026-11-06)

The tests fix these names and hooks (delegated details):

- `src/lib/locked-keys.ts` (new, pure): `isCellProtected(grid,
  lockedWords, coord)` (a letter or end cell of any locked word);
  `placeProtected(grid, lockedWords, cursor, letter)` and
  `deleteProtected(grid, lockedWords, cursor)`, each `{ grid, cursor }`
  like the engine's `place` and `deleteAt`, the same `grid` when nothing
  changed.
- In the page: the Rebus link is `data-testid="rebus-control"`
  (`disabled`), an open entry `rebus-entry`. Words are locked through
  S2's button.

### Unit: `src/lib/locked-keys.test.ts` (new)

1. **21-S3-1 typing:** a locked letter (either direction) and an end cell
   are unchanged and the cursor advances; at the grid's edge or a black
   cell it stays; elsewhere it places as before; KIND and MIND down from
   a locked K both give K-I-N-D. Also which cells are protected.
2. **21-S3-2 deleting:** on a locked letter or an end cell nothing is
   cleared (not even the cell before an end cell) and the cursor moves
   back, or stays at the edge; an end cell's stray letter is kept; from
   an empty cell after a locked letter the cursor lands on it; elsewhere
   as before; Backspace ×5 after KIND.

### `e2e/locked-cells.spec.ts` (new, 1440px)

KOOKABURRA across row 3 of a daily, locked with its button.

3. **21-S3-3 KIND / MIND:** down from its second K, typing KIND, and
   (separately) MIND, both leave K-I-N-D, the cursor past the D.
4. **21-S3-4 Backspace through:** after KIND, Backspace ×5 clears D, N
   and I, rests on the K, and ends above it. Across the word, Backspace
   walks back clearing nothing.
5. **21-S3-5 end cells:** typing across into either end cell leaves it
   empty and the cursor moves on. Typing down through one does too, and
   KOOKABURRA is still the locked word. Backspace on one moves back onto
   the letter above and keeps it.
6. **21-S3-6 Rebus:** on a locked letter and on an end cell the link is
   disabled and Escape opens nothing. On an empty cell it works.
7. **21-S3-7 Preview:** with Preview on, typing on and backspacing
   through locked letters change nothing.
8. **21-S3-8 unlocked again:** after unlocking, the same keys change the
   letters and end cells as before.

### Discrimination (2026-11-06, observed on `main`)

- 21-S3-1 and 21-S3-2 fail to load (no `./locked-keys` module). Not run
  against a throwaway implementation (that run was denied).
- `e2e/locked-cells.spec.ts`: 8 of 10 fail, each on the missing
  protection (M overtypes the K, the K or A is cleared, an end cell
  takes S or B, the Rebus link stays enabled, X overtypes U in Preview,
  Backspace clears instead of moving). "Typing KIND" (21-S3-3, K over K)
  and 21-S3-8 pass, as guards.

### Implementation notes (2026-11-06)

- **Paths:** `src/lib/locked-keys.ts` (new) and `PuzzleGridEditor.tsx`
  only. No risk path, and `src/engine/` is unchanged. `RebusControl.tsx`
  already took `disabled`.
- The editor's letter and Backspace keys go through `placeProtected` /
  `deleteProtected`, Preview's too (protection is checked on the real
  grid's locks; the cursor still moves over Preview's words). A Backspace
  in Preview that only moves the cursor now moves it (only possible on
  or onto a protected cell; unlocked cells behave as before).
- Rebus: `canRebus` (Escape and the link) is false on a protected cell,
  and the link is disabled there while no entry is open.
- **Visual check:** the Rebus link greys out (50% opacity) on a locked
  letter or end cell. Typing over a locked word skips it silently, with
  no other feedback, as the EPIC says.

## Repo paths

Acceptance: the files above. Runtime: `src/lib/locked-keys.ts` (new),
`src/components/grid/PuzzleGridEditor.tsx`,
`src/components/grid/RebusControl.tsx` (if needed). Docs: this story,
`../EPIC.md`, `../HANDOFF.md`.

## Definition of done

- Frozen acceptance unchanged after freeze.
- `npm run verify` exits 0 and the full `npm run test:e2e` exits 0.
- Delivered on `main` (or reviewed and merged if escalated); the handoff
  records observed results.
