# Story S6 — Only real words

In the hints phase and play, the cursor's direction is always one with a
word through its cell. A click on a cell with a word one way only takes
that way; clicking the cursor cell again, Space or a cross-axis arrow
does nothing where no word runs the other way, so no lone cell is ever
highlighted. The build phase is unchanged.

**Status: approved** by the human (2026-11-01), including the settled
items, both pending questions as proposed and the two amendments; frozen
on `main` (specification only).

**Blast radius: small.** One new pure helper in `src/lib/`, the hints
phase's cursor in `PuzzleGridEditor` and play's cursor in `PlayPuzzle`.
No schema, server action, storage or engine change, so no CODE-REVIEW
risk path: direct delivery on `main`.

## What the code does today

Inspected `src/engine/cursor.ts`, `src/engine/slots.ts`,
`src/engine/phase.ts` (`enterHintsPhase`), `src/lib/hint-lookup.ts`,
`src/lib/publish-readiness.ts`, `PuzzleGridEditor.tsx` (start cursor,
`handleGridKeyDown`, `handleCellClick`, `handleConfirmEnterHints`, the
Hint Box's `boxKey`), `PlayPuzzle.tsx` (`openingCursor`, `orient`,
`handleKeyDown`, `handleCellClick`, `handleHintClick`) and the frozen
browser tests that click, toggle or arrow in the hints phase and play.

- The engine's `moveTo` (a click on the cursor cell), `toggleOrientation`
  (Space) and `arrowKey` (a cross-axis arrow) turn the direction on any
  active cell. With no word that way, only the cursor cell is highlighted
  (the human's `broken-down-word.png`). The editor and play call them
  directly, in every phase.
- A click on another cell keeps the cursor's direction, word or not.
- Typing, Backspace and same-axis arrows can't leave a word: they move
  only between neighbouring white cells, which are always a word in that
  direction. Only the four actions above can reach a wordless direction.
- **Starting cursors.** The editor starts on the first white cell,
  Across, in either phase. Play opens on the first empty cell, Across,
  or Down where it has no Across word (17-S2's `orient`). Entering the
  hints phase (2 Create Hints, confirmed) keeps the build phase's cursor,
  even on a cell the conversion has just turned black.
- **A cell with no word either way can exist.** `enterHintsPhase` turns
  every empty cell black, and nothing prevents a lettered cell with black
  on all four sides (publish readiness is advisory). Such a cell is still
  in play's entries and must be filled to solve the puzzle. The EPIC's
  "every white cell in a valid grid has at least one" holds only for
  valid grids, which aren't enforced.
- In the hints phase, the narrow Hint Box keeps showing its last word
  while the cursor's cell has no word in its direction (15-S4, `boxKey`).

## Decisions

### The rule *(human, 2026-10-31)*

In the hints phase and play:

- **A click on another cell** keeps the cursor's direction if a word runs
  that way through the cell, and otherwise takes the direction of the
  word it is in.
- **A click on the cursor cell, Space or a cross-axis arrow** turns the
  direction only where a word runs the new way. Elsewhere it does
  nothing: no lone highlighted cell. A cross-axis arrow never moves the
  cursor, either way.
- Where words run both ways, all of these turn the direction as before.
- Typing, Backspace, same-axis arrows and a hint click (which selects
  that hint's word) are unchanged; they already stay within words.
- **The build phase is unchanged** (Preview included, 17-S4): its words
  are still being made.

### Settled here *(approved 2026-11-01)*

- **A cell with no word either way** can still be selected, alone: a
  click selects it, keeping the cursor's direction, and a second click,
  Space or arrows do nothing there. Typing fills it. It's the only lone
  highlighted cell, and in play it's the only way to fill it, so the
  puzzle can still be completed. The narrow Hint Box keeps its last
  word there, as 15-S4 has it for any wordless direction.
- **The hints phase's starting cursor** follows the rule too: the first
  white cell, Across, or Down where it has no Across word, as play opens
  (17-S2). That holds on load and on entering the hints phase, which
  moves the cursor there rather than leaving it where the build phase
  had it (possibly on a cell the conversion turned black). The grid
  still isn't focused on entering, as today.
- **The words are the grid's own**, `extractSlots` of the hints-phase or
  play grid: the same words the hint list numbers (the EPIC's "the
  published puzzle's").
- **Where it lives:** one pure helper, `src/lib/word-cursor.ts`, wrapping
  the engine's `moveTo`, `toggleOrientation` and `arrowKey` and choosing
  a starting direction, used by the hints phase in `PuzzleGridEditor` and
  by `PlayPuzzle` (whose `orient` it can replace). No engine change.
- Play with nothing selected (a cursor of `null`, before a click): a click
  takes the cell's word direction, Across first, as the opening cursor.

## Acceptance

*Approved 2026-11-01 and frozen.* One new file and two amended files.

### e2e/real-words.spec.ts

A 5×5 hints-phase puzzle, also published for play:

```
A # # # #     1-Down  ABED (0,0)–(0,3)
B L U E #     2-Across BLUE (0,1)–(3,1)
E # # R #     3-Down  ERA  (3,1)–(3,3)
D # # A #
# # I # #     (2,4): no word either way
```

Each case checks exactly one selected cell and exactly its word's other
cells highlighted.

1. **17-S6-1** the hints phase's cursor starts Down on (0,0): focusing the
   grid highlights ABED.
2. **17-S6-2** in the hints phase, clicks on Down-only and Across-only
   cells take their words' directions.
3. **17-S6-3** in the hints phase, on an Across-only and a Down-only cell,
   a second click, Space and both cross-axis arrows change nothing.
4. **17-S6-4** in the hints phase, where words run both ways, a second
   click, a cross-axis arrow and Space turn the direction *(guard; passes
   today)*.
5. **17-S6-5** in the hints phase, the wordless cell is selected alone,
   ignores a second click, Space and arrows, takes a typed letter, and a
   click on a word's cell from there selects that word *(guard)*.
6. **17-S6-12** narrow (768px), the Hint Box keeps 2 Across's hint on the
   wordless cell *(guard; keeps the case 15-S4-6's amendment below
   replaces)*.
7. **17-S6-6** entering the hints phase with the cursor on an empty cell
   (which turns black) starts the cursor Down on (0,0).
8. **17-S6-7** play opens Down on (0,0); a second click, Space and both
   cross-axis arrows keep ABED, with the Prominent Hint "1D".
9. **17-S6-8** in play, a click on an Across-only cell while Down takes
   BLUE ("2A"), and Space and the vertical arrows keep it.
10. **17-S6-9** in play, where words run both ways, a second click, an
    arrow and Space turn the direction *(guard)*.
11. **17-S6-10** in play, the wordless cell is selected alone, ignores a
    second click, Space and arrows, and can be filled *(guard)*.
12. **17-S6-11** the build phase, same black cells: a second click and a
    cross-axis arrow still turn onto a lone cell, and Space back *(guard)*.

### Amended acceptance

Amended in the specification-only freeze commit. Every other frozen test
is unchanged.

| File | Case | Was | Becomes |
| --- | --- | --- | --- |
| `e2e/hint-box.spec.ts` | 15-S4-6 "on a cell with no word in the cursor's direction, the box keeps its word" | with the cursor Down, clicks (1,0) of CAT / A#A / TEN (Across only) and expects the box to keep 1 Down | renamed "on a cell with a word one way only, the cursor takes it and the box shows it": the same clicks, and the box shows 1 Across. The box keeping its word is now reachable only on a wordless cell: 17-S6-12. |
| `e2e/play-entries.spec.ts` | P2 "Backspace clears before retreating and never crosses black cells or the grid edge" | clicks (2,1) with the cursor Across, presses Backspace and expects it to stay ("black (1,1) blocks retreat"), then ArrowDown to turn Down before typing | the click selects (2,1) Down (it has no Across word), so the Backspace and ArrowDown are dropped; typing and the Backspace that retreats within 2 Down stay. In this 3×3, a black cell can no longer be behind the cursor in its direction; a word's start stops Backspace as the grid's edge does, which the case's first half still checks. |

### Acceptance choices *(drafting)*

- One fixture holds every case: a cell in a word each way, Across-only
  and Down-only cells, a wordless cell, and a first white cell with no
  Across word, so the starting rule is visible.
- Play's tests seed the same puzzle published, played by its builder.
- 17-S6-6 enters the hints phase through 2 Create Hints
  (`[data-step-id="hints"]`); S8, which replaces the step buttons, will
  name it among the tests it amends.
- Not covered: Lock Grid Letters and published puzzles (clicks select
  nothing there, unchanged; their frozen tests stay), play's narrow hint
  bar (the same cursor; its frozen tests stay) and hint clicks (they set
  the hint's own direction).

### Discrimination (2026-11-01, observed)

- **Throwaway implementation** of the Decisions (the helper and its use in
  the editor's hints phase and play), then reverted; patch kept outside
  the repo (`/tmp/s6/throwaway.patch`, `/tmp/s6/word-cursor.ts`). With
  it, before the amendments: the full `npm run test:e2e` had 845 passed
  and 2 failed, the two frozen cases above. With the amendments,
  `real-words`, `hint-box` and `play-entries` passed 57 of 57 (including
  the setup project).
- **Current `main` with the proposed tests:** of those three specs, 8
  failed and 49 passed. The failures were 17-S6-1, -2, -3, -6, -7 and
  -8, plus both amended cases. Every guard passed.
- **Two mutations on the throwaway,** each caught: cross-axis arrows not
  wrapped (3 failed: 17-S6-3, -7, -8); a click on another cell keeping
  its direction (6 failed).
- `tsc` and ESLint pass on the proposed and amended tests.

## Repo paths

Acceptance (immutable after freeze): `e2e/real-words.spec.ts`,
`e2e/hint-box.spec.ts` and `e2e/play-entries.spec.ts`.

Runtime:

- `src/lib/word-cursor.ts` (new) and its unit tests,
  `src/lib/word-cursor.test.ts`.
- `src/components/grid/PuzzleGridEditor.tsx`: the hints phase's clicks,
  Space and arrows, and its starting cursor on load and on entering the
  phase.
- `src/components/play/PlayPuzzle.tsx`: play's clicks, Space and arrows,
  and `orient` by way of the helper.
- This story, `../EPIC.md` (the S6 line, if the settled items need it, at
  freeze) and `../HANDOFF.md`.

Declare any other path before editing it.

## Scope discipline

Only S6. Out of scope: the build phase and Preview's cursor (17-S4),
selection colors (S5), Preview Hints' selection (S9, which follows play's
rule when built) and rebus entry (S10).

## Definition of done

- The human approves this specification, its acceptance and the two
  amendments, recorded here and in the handoff. Freeze on `main` in a
  specification-only commit before any runtime change.
- Frozen acceptance is unchanged after freeze.
- `npm run verify` exits 0, and the full `npm run test:e2e` suite exits 0.
- Delivered on `main` and the handoff updated with observed results.

## Pending questions

Both answered as proposed: the human approved the draft (2026-11-01).

1. A cell with no word either way stays selectable, alone (needed to fill
   it in play). The alternative, unselectable, would leave such a puzzle
   unsolvable.
2. The hints phase starts its cursor by play's rule, and entering the
   hints phase moves the cursor there.
