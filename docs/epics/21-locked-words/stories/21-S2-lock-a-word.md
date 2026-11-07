# Story S2 — Lock and unlock a word

A button beside a finished word locks it. A locked word shows gray
letters and a gray outline around it and its end cells, with tick marks
in the end cells, and stays locked when the puzzle is reopened.

**Status: done 2026-11-06,** PR #33 independently reviewed (no blockers)
and merged to `main` as 693c02b. Approved and frozen at b45a4c6 (the human approved this
specification and acceptance, choosing ⅔ of a cell with a 32px cap).
Depends on S1's word run.

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
  focus. It's a square ⅔ of a cell, at most 32px: right of the last
  letter and vertically centered for across, below it and horizontally centered for
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

**The button's size** (the human, 2026-11-06, at approval): ⅔ of a
cell, capped at 32px. A daily's (~31px) and a Sunday's (~22px) are
unchanged; a mini's is 32px rather than ~93px.

## Non-goals

- Protection from typing, Backspace, Delete or Rebus (S3).
- The tooltip (S4), the toggle-row button (S5) and Reset Grid (S6).
- Locking with Preview on, in the hints phase or once published.

## Acceptance (frozen 2026-11-06)

The tests fix these names and hooks (delegated details):

- `src/lib/locked-words.ts`: `LockedWord` `{ col, row, orientation,
  length }`; `lockableWord(grid, cursor)` (S1's run of 3+ letters, or
  `null`); `endCells(grid, word)`; `isCellLocked(lockedWords, coord)` (a
  letter of any locked word); `lockedWordAt(lockedWords, cursor)`;
  `toggleLock(lockedWords, word)` (a new list).
- `src/lib/puzzle-storage.ts`: `serializeGrid(grid, lockedWords?)` writes
  `lockedWords` only when there are some, so a grid without locks saves
  exactly as before; `deserializeLockedWords(stored)` gives `[]` without
  the list.
- In the page: the button by role and name; its `<svg>` has `data-icon`
  `lock-open` / `lock-closed`; the outline is `data-testid="word-outline"`
  (its box the word and end cells', its border 1px gray-500); a tick is
  `data-testid="lock-tick"`.
- Create Hints drops the list (its `serializePuzzle` writes the grid
  alone), so `actions.ts` is untouched.

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
   cell, and 32px on a mini (the cap), the stated corners, gray-500 at
   rest, gray-700 on hover. Open padlock.
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

### Discrimination (2026-11-06, observed on `main`)

- 21-S2-1 fails (no `./locked-words` module). 21-S2-2: its round-trip and
  load-without-list tests fail (`deserializeLockedWords` is not a
  function); "saved as before, with no list" passes, as a guard.
- `e2e/lock-word.spec.ts`: 13 of 14 fail, each on the missing button
  (run before the mini case was added; it waits on the same button).
  "None for a 2-letter word or an empty cell" (21-S2-3) passes, as a
  guard.
- Not yet run against a throwaway implementation.

### Implementation notes (2026-11-06)

- **Scope additions:** the editor page loads through `loadPuzzle`, which
  returned the engine's `Puzzle` and lost the list, so a reload showed no
  locks (21-S2-9). `loadPuzzle` (`actions.ts`) now also returns the
  stored `lockedWords`, and `src/app/puzzles/[id]/page.tsx` passes them
  on. `GridCell.tsx` passes the gray letter through to `LetterCell`. Create
  Hints is unchanged and drops the list, and the editor clears its own.
- **Colors:** the lock UI uses the palette variables (`--palette-gray-500`,
  `-700`, `-white`) directly. A new `--color-*` style would have meant
  amending the frozen token lists in `globals-css.test.ts` and
  `color-tokens.spec.ts`.
- **Reset Grid** also removes every lock, as S6's Clear Every Cell will,
  so no outline is left on an empty grid before S6.
- **The icon's paths** are Heroicons v2 solid's, written from the
  published icons. Rendered, they show a closed and an open padlock.
  Fetching the originals to compare byte for byte was denied in this
  session.
- Tabbing from the grid to the button no longer counts as the editor
  losing focus. Before, the button went before it could take focus.

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
