# Story S2 — Play opens on the first empty cell

Play opens with the cursor on the first empty cell, Across, and the grid
focused, so its word is highlighted, its hint shows in the Prominent Hint
and the player can type at once. The Prominent Hint's text becomes
`title-3`.

**Status: done** (2026-10-31). The human approved this specification,
its acceptance, the amendments and the proposed Decisions on 2026-10-31;
frozen on `main` in 316c7f6 (specification only) and delivered directly
on `main`.

**Blast radius: small.** The opening cursor and focus in `PlayPuzzle` and
one class in `ProminentHint`. No schema, server action, storage or engine
change, so no CODE-REVIEW risk path: direct delivery on `main`.

## What the code does today

Inspected `PlayPuzzle.tsx` (`beginSession`, the cursor, focus and
highlight state, `handleCellClick`, `handleHintClick`, `handleStep`),
`ProminentHint.tsx`, `PlayHintBar.tsx`, `src/engine/cursor.ts`,
`src/lib/hint-lookup.ts`, and every frozen browser test that opens play.

- `beginSession` (a start, a Retry after a failed start, and today's
  Reset) shows the attempt with `cursor` null and `isFocused` false.
  Nothing is selected until a cell, a Player Hint or a hint-bar arrow is
  clicked.
- The highlight, the Prominent Hint and the narrow hint bar show only
  while the grid region has focus and the puzzle isn't locked.
- The engine's `moveTo` toggles the direction when the clicked cell is
  the cursor cell. With no cursor, the first click selects Across.
- A completed puzzle opens locked, with nothing selected and clicks
  ignored.
- The Prominent Hint's text is `body-large` (18px, 400, 28px); its label
  is `title-4`. `title-3` is 18px, 600, 24px, so the 52px bar keeps its
  height.
- The narrow hint bar's text is `body-large` (15-S5) and stays so; the
  EPIC gives it its own values.

## Decisions

### The opening cursor *(human)*

Once a session is ready and the puzzle isn't complete:

- the cursor is on the **first empty cell** of the player's entries as
  shown (saved entries, or a recovered device draft), in reading order:
  left to right along a row, rows top to bottom;
- its direction is **Across**. *Proposed:* where that cell has no Across
  word (a one-cell run between black cells or the edge), it is Down, so
  a word is always highlighted and its hint shown;
- a full but unsolved grid opens on its first white cell *(EPIC
  proposed, settled here)*, by the same direction rule;
- a completed (read-only) puzzle opens with nothing selected and the grid
  unfocused, as today *(EPIC proposed, settled here)*.

This applies to every start that shows an attempt: opening, reloading,
reopening, Retry after a failed start and, until S3 removes it, Reset.

### Focus *(EPIC proposed, settled here)*

- The grid region takes focus when the attempt is shown, so the cursor
  and its word are highlighted, the Prominent Hint (wide) or the hint bar
  (narrow) shows the word's hint, and typing places letters without a
  click.
- *Proposed:* taking focus doesn't scroll the page (`preventScroll`); on
  a short window the page stays at the top.
- Nothing changes after opening: the selection still hides when the grid
  loses focus, and returns when it regains it.

### The opening cursor is an ordinary cursor *(proposed)*

Clicking the opening cursor cell toggles the direction, as clicking any
cursor cell does (and as the NYT does). Arrows, Space, Player Hint
clicks and the hint-bar arrows behave as from any cursor; from 1 Across,
the bar's Next goes to the next word. Epic 11's rule that "the first
click is selection, even at (0,0)" existed only because there was no
cursor before it; it is retired with its test.

### The Prominent Hint's text *(human)*

`prominent-hint-text` is `title-3` primary, on the label's baseline. The
label stays `title-4`, and the bar's size, fill and padding are
unchanged. The narrow hint bar keeps `body-large`.

### No other change

The builder (build and hints phases) is unchanged. No engine change: the
opening cursor is computed in `PlayPuzzle` from the shown grid and
`buildSlotLookup`/`activeHintKey`. Player Hint clicks, the hint bar's
order, autosave and completion are unchanged.

## Acceptance

*Frozen 2026-10-31.* One new file and four amended files.

### e2e/play-opening.spec.ts

The play fixture (CAT / A#A / TEN, black (1,1)) at 1440×1000 unless
named; (0,1) and (2,1) are in no Across word.

1. **17-S2-1 play opens on the first empty cell**
   - A new session: (0,0) selected with 1 Across highlighted, the grid
     focused, the Prominent Hint "1A Feline" without a click; typing "c"
     places C and advances to (1,0).
   - A saved session with only (0,0) filled opens on (1,0), 1 Across;
     typing "at" fills the row, and after the save a reload opens on
     (0,1), Down (1 Down), focused.
   - Only (2,1) empty: opens on (2,1), Down, "2D A shade of brown".
   - Full of wrong letters: opens on (0,0), 1 Across, focused.
   - Clicking the opening cell toggles to Down (1 Down highlighted, "1D").
   - A completed puzzle: nothing selected, the grid unfocused, the bar
     empty *(guard; passes today)*.
   - On a 1440×600 window with a blank 15×15 (the page scrolls): (0,0)
     selected and focused, and the page still at the top.
   - At 768px: the hint bar shows "Feline" on open, and typing works.
2. **17-S2-2 the Prominent Hint's text**: `title-3` (size and line
   height from the tokens, weight 600), primary, on the label's
   baseline, the bar 52px tall.

### Retired and amended acceptance

Each amendment is retired in the specification-only freeze commit. The
recurring cause: these cases click (0,0) right after opening, which now
toggles the opening cursor to Down, or assert nothing is selected on
open. Every other frozen test is unchanged.

| File | Case | Was | Becomes |
| --- | --- | --- | --- |
| `e2e/play-entries.spec.ts` (11-P2) | helper `openPlay` | clicks (0,0) | clicks (0,0) only if it isn't already the cursor; the cases using it keep their start, (0,0) Across and focused |
| | "opening and reopening leave the puzzle unselected until the player clicks an active cell" | nothing selected on open, reload or focus | **retired**, replaced by 17-S2-1 |
| | "pending and failed starts cannot type or select; Retry enables the successful session" | after Retry nothing selected; focusing and typing does nothing until a click | after Retry (0,0) is selected and focused, and typing "a" places it |
| | "pending letters and deletion survive immediate …" (3 cases) | the reopened puzzle has nothing selected and an unfocused grid | it opens on (0,0), its first empty cell, focused |
| | "local recovery waits for successful authenticated start …" | nothing selected after Retry | it opens on (1,0), the first cell the recovered draft leaves empty |
| `e2e/play-design.spec.ts` (14-S7) | header comment | body-large; no opening selection | title-3; play opens on 1 Across |
| | 14-S7-1 "unselected: …" | checks the colors on open | blurs the grid first |
| | 14-S7-1 "selected: …" | clicks (0,0) first | starts from the opening cursor |
| | 14-S7-2 "… 52px tall and empty with nothing selected" | the bar empty on open | "… showing 1A on open": "1A Feline" |
| | 14-S7-2 "… its hint in body-large …" | clicks (0,0); body-large 18px 400 28px | "… in title-3 …"; no click; 18px 600 24px |
| | 14-S7-2 "follows the cursor's word", "empties … when the grid loses focus" | click (0,0) first | start from the opening cursor |
| | 14-S7-3 "the selected word's hint has the selected row's background …" | every hint transparent on open, then clicks (0,0) | 1 Across's hint selected on open, no click |
| | 14-S7-3 "a click on a full word's hint selects its first cell" | clicks (0,0) first | starts from the opening cursor |
| `e2e/narrow-play.spec.ts` (15-S5) | header comment | the bar empty on load | the bar shows 1 Across's hint on load |
| | 15-S5-4 "a long hint wraps …", 15-S5-5 "… body-large primary …", 15-S5-6 "… clicks, the toggle and the arrow keys …", 15-S5-7 "from 1 Across, Next visits …" | click (0,0) first | start from the opening cursor |
| | 15-S5-5 "on load: empty, 48px tall" | empty | "on load: 1 Across's hint, 48px tall" |
| | 15-S5-7 "with nothing selected, Next shows 1 Across and Previous 5 Down" | Next from no cursor shows 1 Across | "on open, at 1 Across, Next shows 6 Across and Previous 5 Down" |
| `e2e/play-route.spec.ts` (11-P1) | "actual browser opening creates one blank session …", "wrong and rebus entries retain …", "two-cell words do not inherit builder recommendation colors in play" | check every cell white on open | blur the grid first; the check is for builder colors, not selection |

### Acceptance choices *(drafting)*

- The fixture's one-cell Across runs at (0,1) and (2,1) test the Down
  fallback and reading order in one small grid.
- Focus is checked directly (`toBeFocused`) and through its effect: the
  Prominent Hint and typing without a click.
- The play-entries helper is amended once instead of each case that uses
  it; it keeps those cases' exact starting state on both `main` and S2.
- `e2e/grid-size.spec.ts` 15-S1-3 "clicking a cell leaves the page where
  it was" isn't amended: it caught a throwaway that scrolled on focus,
  and passes once focus doesn't scroll.
- Not covered: the builder (unchanged; its frozen tests stay) and Reset
  (S3 removes it; its tests passed on the throwaway).

### Discrimination (2026-10-31, observed)

- **Throwaway implementation** of the Decisions, then reverted (patch kept
  outside the repo). Before the amendments, the 19 browser specs that
  open play ran 311 passed, 31 failed; every failure was one of the
  table's causes, plus the grid-size case above (the throwaway's focus
  scrolled; fixed with `preventScroll`). With the proposed tests:
  `play-opening`, `play-entries`, `play-design`, `narrow-play`,
  `play-route` and `grid-size` 107 of 107 (including the setup
  project); `npm run verify` exit 0 (Vitest 620 of 620).
- **Current `main` with the proposed tests:** 25 failed, 82 passed: every
  17-S2 case but the completed guard, and every amended case except
  the four that only blur the grid and 14-S7-3 "a click on a full word's
  hint …" (on `main` its typing does nothing without a cursor, and the
  hint click still selects (0,0)). The helper's other users pass on
  either side.
- **Three mutations on the throwaway,** each caught by `play-opening`:
  no focus on open (8 failed), always Across (2 failed: the Down and
  reload cases), focus that scrolls (1 failed: the short window).
- `tsc` and ESLint pass on the proposed tests. The full
  `npm run test:e2e` was not run while drafting.

## Repo paths

Acceptance (immutable after freeze): `e2e/play-opening.spec.ts` and the
four amended files above.

Runtime:

- `src/components/play/PlayPuzzle.tsx`: the opening cursor in
  `beginSession`, and focus without scrolling.
- `src/components/play/ProminentHint.tsx`: `title-3`.
- This story, `../EPIC.md` and `../HANDOFF.md`.

Declare any other path before editing it.

## Scope discipline

Only S2. Out of scope: Reset and "Puzzle options" (S3), the narrow hint
bar's type, the word-direction rule beyond the opening cursor (S6), the
builder, and the grid size (S7).

## Definition of done

- The human approves this specification, its acceptance and the
  amendments, recorded here and in the handoff. Freeze on `main` in a
  specification-only commit before any runtime change.
- Frozen acceptance is unchanged after freeze.
- `npm run verify` exits 0, and the full `npm run test:e2e` suite exits 0.
- Delivered on `main` and the handoff updated with observed results.
