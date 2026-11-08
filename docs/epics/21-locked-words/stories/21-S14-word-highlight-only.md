# Story S14 — Only the word is highlighted

With the cursor in a word, only that word is blue-medium; the rest of its
row or column stays as it would be. With the cursor in no word, the row
or column's off cells are dull blue, showing the direction.

**Status: approved by the human and frozen (2026-11-07), delegated details included.** From the
human's review after S12–S13 (EPIC "Changes from the human's review after
S12–S13 (2026-11-07)", item 1). Amends S1's and S8's "every other cell of
the row or column is dull blue". Depends on S1 and S8 (delivered).

**Blast radius: small, expected off the risk paths.** `src/lib/` and
`src/components/grid/`. No `src/engine/**`, `src/lib/puzzle-storage.ts`,
`src/app/puzzles/actions.ts` or `prisma/**` change (CODE-REVIEW "When
review applies"). Direct delivery to `main`.

## What the code does today

Inspected `src/lib/cell-appearance.ts`, `src/lib/build-word.ts`,
`PuzzleGrid.tsx` (`cursorWord`, `BUILD_BG`) and `PuzzleGridEditor.tsx`
(`highlights`, `cursorWord`).

- In the build phase with Preview off, the editor marks the cursor's
  whole row or column `slot` (`data-highlight="slot"`), and `cursorWord`
  holds the cursor's word (`buildWord`, S8: the run of cells Preview
  keeps white, 2 or more), empty when there's none.
- `cellAppearance` makes a word cell `slot-letter` (lettered) or
  `slot-required` (Preview-red), both blue-medium
  (`build-cell-selected-row-on`), and every other cell of the line
  `slot`, dull blue (`build-cell-selected-row-off`), lettered or not.
- Outside the line, a lettered cell is `letter` and a Preview-red one
  `symmetric-hint` (both white, `build-cell-on`); an off cell is `empty`
  (gray-200, `build-cell-off`).

## Decisions

From the human (2026-11-07, EPIC):

- **The cursor in a word** (in the cursor's direction): only the word is
  highlighted, blue-medium, the cursor yellow. Every other cell of the
  row or column is left as it is: an off cell gray, a lettered or
  Preview-red cell white.
- **The cursor in no word** (an off cell): the row or column's other off
  cells are dull blue; its white cells, lettered or Preview-red, stay
  white.
- **The direction decides:** a word across the cursor's direction isn't
  highlighted. The same rule holds down.

### Delegated details

Proposed by the drafting agent, approved by the human:

- **A lone white cell** (a run of 1, which S8 doesn't count as a word)
  counts as no word: the line's off cells are dull blue.
- **`data-highlight="slot"`** still marks the whole row or column; only
  the cells' look (`data-cell-state` and color) changes. A cell outside
  the cursor's word gets the state it would have outside the line
  (`empty`, `letter`, `symmetric-hint`); with no word, an off cell is
  `slot`.
- **The rule lives in `cellAppearance`**, with one new input,
  `hasCursorWord` (the cursor is in a word), passed by `PuzzleGrid`.
- **The style guide's build sample** is unchanged (its cursor is in a
  word), so it no longer shows a `slot` cell. D8-3's two cases are
  amended to match.
- **Preview, the hints phase, play and the colors** are unchanged.

## Non-goals

- Changing any color, or the highlight in Preview, the hints phase or
  play.
- Changing what a word is (S8).
- Adding a second style-guide sample for the no-word line.

## Acceptance (frozen)

### Unit: `src/lib/word-highlight-only.test.ts` (new, 4 cases)

1. **21-S14-1 the cell states of the cursor's line:** `cellAppearance`
   with `hasCursorWord`. In a word: `slot-letter` and `slot-required` as
   before. Outside it, with a word: `letter`, `symmetric-hint`, `empty`.
   With no word: an off cell `slot`, a lettered cell `letter`, a
   Preview-red cell `symmetric-hint`. The cursor stays `selected`;
   Preview, the hints phase and play are unchanged (2 guards).

### `e2e/word-highlight-only.spec.ts` (new, 5 cases)

The human's example on a daily's row 2: `x x x _ _ B A R x x x x x x x`
(the `_` cells Preview-red), and HI down column 6 below the A, which is
alone down. Each case checks every cell of the cursor's row or column:
its `data-cell-state` and background.

2. **21-S14-1 the cursor in an across word, going across** (2). On B,
   then on a `_` cell: `_ _ B A R` blue-medium (the cursor yellow); the
   row's off cells gray-200.
3. **21-S14-2 the cursor on an off cell** (1). Across, on (1,2): the
   row's other off cells dull blue; `_ _` and `B A R` white.
4. **21-S14-3 the other direction** (2). On A going down (alone down):
   the column's off cells dull blue, H and I white, and the row's
   `_ _ B A R` not highlighted. On H going down: only HI highlighted; the
   column's off cells gray-200 and A white.

### Amended frozen acceptance (6 specs)

Each amendment is marked "21-S14" in the file. No other assertion,
timeout or case changes.

- `e2e/word-highlight.spec.ts` (S1) 21-S1-2, -3, -4 and the header: the
  line's cells outside the word as outside the highlight; on a lone
  letter or an off cell, only the off cells dull blue.
- `e2e/word-shape.spec.ts` (S8) 21-S8-3: `expectWord`'s cells outside
  the word as outside the highlight; the first case's title.
- `e2e/build-grid-design.spec.ts` 14-S5-1 and
  `e2e/selection-colors.spec.ts` 17-S5-1: the symmetric hint and the off
  cell in the cursor's row, outside its word, white and gray-200. Then
  an added step, the cursor on an off cell: the row's off cells dull
  blue, its lettered cell and symmetric hint white.
- `e2e/style-guide.spec.ts` D8-3: "every build state" no longer lists
  `slot`. The second case becomes "the active word is highlighted, and
  nothing else in its line": its `slot-letter` cells hold letters, and
  no `slot` cell shows.
- `e2e/lock-tick-hover.spec.ts` (S11) 21-S11-5's first case (TANGENT's
  end cells gray-200), 21-S11-6's second case and 21-S11-7's touch case
  (TANGENT white with the cursor on its empty end cell). These are shared
  with S15's amendments of the same file.

### Discrimination (2026-11-07, observed)

- **Against a scratch S14–S16 implementation** (reverted, kept outside the
  repo as `../crossward-raptor-s14-s16-scratch.patch`): the full
  `npm run test:e2e` before any amendment had 87 failures, which pinned
  down the amendments here and in S15 and S16. Of these, 6 were outside
  the specs that S14–S16 touch: 5 `ECONNRESET`s (`delete-published`,
  `menu-reset` ×2, `play-entries`, `row-menu`) and one color read at a
  rounded corner (`done-icon` 18-S5-5). They will be rerun alone at
  implementation. With every amendment, the
  15 new and amended specs passed 201 of 201, and the unit test 4 of 4.
- **On `main` (856db3a), the new and amended tests:** the unit test
  fails 2 of 4, at the `hasCursorWord` rule, and `tsc` reports TS2353
  for `hasCursorWord`. The 2 guards pass. All 5 new E2E cases fail, as
  does every amended S14 case above.

## Repo paths

Acceptance: `src/lib/word-highlight-only.test.ts` (new),
`e2e/word-highlight-only.spec.ts` (new), and the amended specs above.

Runtime:

- `src/lib/cell-appearance.ts`: `hasCursorWord` and the rule.
- `src/components/grid/PuzzleGrid.tsx`: passes `hasCursorWord`.

Risk: all off the CODE-REVIEW risk paths. Docs: this story, `../EPIC.md`,
`../HANDOFF.md`. Declare any other path before editing it.

## Definition of done

- Approved by the human and frozen in a specification-only commit on
  `main` (with S15 and S16) before any runtime change. Frozen acceptance
  is unchanged after that.
- `npm run verify` exits 0 and the full `npm run test:e2e` exits 0.
- The human's visual check.
- Delivered on `main`; the handoff records observed results.
