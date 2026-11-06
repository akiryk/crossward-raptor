# Story S2 — Lock and unlock a word

A button beside a finished word locks it. A locked word shows gray
letters and a gray outline around it and its end cells, with tick marks
in the end cells, and stays locked when the puzzle is reopened.

**Status: drafted 2026-11-06; acceptance tests not yet written; not
approved.** Depends on S1's word run.

**Blast radius: medium, risk path.** Saving locks changes
`src/lib/puzzle-storage.ts` (stored serialization). It may also touch
`src/app/puzzles/actions.ts` if `saveGrid` or Create Hints needs to
change. Branch `story/21-S2-lock-a-word`, a PR and independent review
(CODE-REVIEW).

## What the code does today

See the EPIC. Cells hold only a letter, with no per-word state. The
saved grid is `{ cols, rows, cells }`. Nothing is shown beside the grid.

## Decisions

From the human (2026-11-06, EPIC "Locking" and "Where it applies"), in
brief:

- A **lockable word** is S1's run, at least 3 letters. **End cells** are
  the empty cells just before and after it (none at the grid's edge).
- **The button** appears after the cursor has stayed 1 second in an
  unlocked lockable word (the timer restarts on each key or move), or at
  once in a locked word. It goes when the cursor leaves or the grid loses
  focus. It's a square ⅔ of a cell: right of the last letter and
  vertically centered for across, below it and horizontally centered for
  down. Its near corners are square and its far corners rounded 4px. At
  rest it's gray-500 with a white icon; on hover, gray-700 (#14151b) with
  white. It shows the open padlock when unlocked and closed when locked
  (Heroicons solid `lock-open` / `lock-closed`, MIT). It's named "Lock
  word" / "Unlock word".
- **Clicking** toggles the lock. Focus stays on the grid and the button
  stays in its new state. By keyboard it's the next Tab stop after the
  grid, and Enter or Space activates it.
- **Outline:** 1px gray-500 around the letters and end cells. For an
  unlocked word it shows with the button. A locked word's outline is
  always shown.
- **Tick marks:** a filled gray-500 right triangle in each end cell's
  top-right corner, its sides ¼ of the cell.
- **Locked letters** are gray-500, including inside the highlight.
- **Crossing words:** a cell is locked if any locked word holds it.
- **Saved** with the puzzle; older puzzles load with none.
- **Preview on:** no button, outline or ticks, and letters show in normal
  black. The **hints phase** ignores locks. Play is untouched.

Delegated details, proposed:

- **Where a lock is stored:** a word `{ col, row, orientation, length }`
  in an optional `lockedWords` list in the saved grid JSON, saved by the
  same debounced `saveGrid`. A missing list means none, so no migration
  and no `prisma/**` change. The editor state holds the list beside the
  grid. Lock rules live in pure `src/lib/` helpers (not `src/engine/`):
  is this cell locked, which locked word is under the cursor, a word's
  end cells.
- **Create Hints** keeps or drops the list harmlessly. The hints phase
  never reads it. The drafting phase picks whichever leaves
  `actions.ts`'s conversion untouched.
- **A locked word that no longer matches its run** (e.g. a crossing
  letter typed into an end cell, which S3 blocks) is still drawn from its
  stored cells. S3 makes this unreachable.
- **The icon file:** `src/components/ui/LockIcon.tsx`, the two Heroicons
  paths with an MIT credit comment.
- **Overlap:** the button floats over whatever lies past the grid (the
  hints panel's gap, the line under the grid) and takes no layout space.
  It shows only while the grid is at its full 700px (narrower is S5's).

**Pending for the human at drafting:** at ⅔ of a cell, the button is
~31px on a daily grid but **~93px on a mini** (5×5, 140px cells), and
it would cover part of the hints panel in the wide layout. Options: keep
⅔ at every size, or ⅔ with a cap (e.g. 32px).

## Non-goals

- Protection from typing, Backspace, Delete or Rebus (S3).
- The tooltip (S4), the toggle-row button (S5) and Reset Grid (S6).
- Locking with Preview on, in the hints phase or once published.

## Acceptance (proposed, to be written)

### Unit

1. **21-S2-1 `src/lib/locked-words.test.ts`:** a cell is locked by any
   locked word holding it; end cells at and away from edges; the locked
   word under a cursor by direction; toggling adds and removes one word.
2. **21-S2-2 `src/lib/puzzle-storage.test.ts` (amended):** locked words
   round-trip; a stored grid without the list loads with none.

### `e2e/lock-word.spec.ts` (new, 1440px)

3. **21-S2-3 appears after a second:** the cursor in a 3+ letter word
   shows no button before ~1s and shows it after (with the outline taking
   in the end cells). It doesn't appear for a 2-letter run, an empty
   cell, or after the cursor leaves or the grid blurs.
4. **21-S2-4 placement and look:** across, right of the last letter and
   vertically centered. Down, below it and horizontally centered. ⅔ of a
   cell, the stated corners, gray-500 at rest, gray-700 on hover. Open
   padlock.
5. **21-S2-5 lock:** a click locks. Letters are gray-500, the outline
   stays after the cursor leaves, the end cells have ticks, the grid
   keeps focus. Returning to the word shows the closed padlock at once.
6. **21-S2-6 unlock:** clicking again unlocks. Letters are back to
   normal, with no outline or ticks once the cursor leaves.
7. **21-S2-7 keyboard:** Tab from the grid reaches the button, and Enter
   toggles it.
8. **21-S2-8 crossing:** two crossing locked words. Unlocking one keeps
   the shared letter gray.
9. **21-S2-9 saved:** after a reload the lock, outline and ticks are back.
10. **21-S2-10 Preview and the hints phase:** with Preview on, no button,
    outline or ticks, and letters are black. In the hints phase the same.

## Repo paths

Acceptance: the files above. Runtime: `src/lib/locked-words.ts` (new),
`src/lib/puzzle-storage.ts`, `src/components/ui/LockIcon.tsx` (new),
`src/components/grid/PuzzleGridEditor.tsx`, `PuzzleGrid.tsx`,
`LetterCell.tsx`/`EmptyCell.tsx`, `src/lib/cell-appearance.ts`, maybe
`src/app/globals.css` (tokens) and `src/app/puzzles/actions.ts`. Docs:
this story, `../EPIC.md`, `../HANDOFF.md`.

## Definition of done

- Frozen acceptance unchanged after freeze.
- `npm run verify` exits 0 and the full `npm run test:e2e` exits 0.
- PR independently reviewed and merged; the handoff records observed
  results.
