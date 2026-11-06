# Story S3 — Locked cells hold

Typing, Backspace, Delete and Rebus can't change a locked word's letters
or fill its end cells.

**Status: drafted 2026-11-06; acceptance tests not yet written; not
approved.** Depends on S2.

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

Delegated details, proposed:

- **Advancing past a protected cell** follows `place`'s rule: one cell in
  the cursor's direction if that cell is there, otherwise stay.
- **Backspace from an empty unprotected cell** whose previous cell is
  protected moves onto it and clears nothing. That's the same rule.
- **A rebus already open** when its cell becomes protected can't happen,
  since locking happens with the entry closed. If it could, closing it
  changes nothing.
- **Reset Grid** is S6's.

## Non-goals

- New visual marks (S2 owns the look).
- Protection in the hints phase (ignored) or play.

## Acceptance (proposed, to be written)

### Unit: `src/lib/locked-words.test.ts` (extended) or a new `locked-keys.test.ts`

1. **21-S3-1 typing:** over a locked letter and over an end cell the grid
   is unchanged and the cursor advances. At the grid's edge it stays.
2. **21-S3-2 deleting:** on a locked letter, on an end cell, and from an
   empty cell after a locked one: nothing is cleared, and the cursor
   moves back.

### `e2e/locked-cells.spec.ts` (new)

3. **21-S3-3 KIND / MIND:** across KOOKABURRA locked. Down from its second
   K, typing KIND and (after clearing) MIND both leave K-I-N-D, with the
   K unchanged.
4. **21-S3-4 Backspace through:** after KIND, Backspace ×5 clears D, N
   and I and leaves the K. The cursor ends above the K.
5. **21-S3-5 end cells:** typing into a locked word's end cell (across
   and down) leaves it empty, and the word doesn't grow.
6. **21-S3-6 Rebus:** on a locked letter, the Rebus link is disabled and
   Escape opens nothing.
7. **21-S3-7 Preview:** with Preview on, typing on and backspacing
   through a locked letter change nothing.
8. **21-S3-8 unlocked again:** after unlocking, the same keys change the
   letters as before.

## Repo paths

Acceptance: the files above. Runtime: `src/lib/locked-words.ts`,
`src/components/grid/PuzzleGridEditor.tsx`,
`src/components/grid/RebusControl.tsx` (if needed). Docs: this story,
`../EPIC.md`, `../HANDOFF.md`.

## Definition of done

- Frozen acceptance unchanged after freeze.
- `npm run verify` exits 0 and the full `npm run test:e2e` exits 0.
- Delivered on `main` (or reviewed and merged if escalated); the handoff
  records observed results.
