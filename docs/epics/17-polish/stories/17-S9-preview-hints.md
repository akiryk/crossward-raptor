# Story S9 — Preview Hints

In the hints phase, a "Preview Hints" toggle shows the builder the
player's view in place: play's grid without its letters, play's Player
Hints with every hint in full, and play's Prominent Hint. Selecting works
as in play; nothing can be typed. Off returns to editing as before.

**Status: approved and frozen** (drafted 2026-11-01; the human approved
the story, its acceptance and both pending questions as proposed the same
day).

**Blast radius: small.** `PuzzleGridEditor` (state, keys, clicks and
layout) and `PreviewToggle` (an inactive state). It reuses play's
`PlayerHints`, `ProminentHint` and `PlayHintBar` unchanged, and the
engine's existing `clearLetters`. No schema, server action, storage or
engine change, so no CODE-REVIEW risk path: direct delivery on `main`.

## What the code does today

I inspected `PuzzleGridEditor.tsx`, `BuilderSteps.tsx` (`ToggleRow`),
`PreviewToggle.tsx`, `HintsPanel.tsx`, `HintBox.tsx`, `PuzzleGrid.tsx`,
`cell-appearance.ts`, play's `PlayPuzzle.tsx`, `PlayerHints.tsx`,
`ProminentHint.tsx` and `PlayHintBar.tsx`, and the human's
`hint-step-controls.png`.

- The hints phase shows only the editor: the grid with its letters, the
  hints list's inputs (`HintsPanel`, wide) or the Hint Box (narrow, below
  a 1140px window), and Lock Grid Letters on S8's `toggle-row` panel at
  the grid's width. There is no player's view in the builder; a published
  puzzle has "Play it!".
- Play's wide layout puts the Prominent Hint over the grid, 16px above
  it, at the grid's width, and the Player Hints beside the grid in a box
  at the grid's height. Narrow play shows a hint bar under the grid
  instead (15-S5). Play's grid (`mode="play"`) takes play's colors, and
  its numbering is the published one.
- `PlayerHints` wraps every hint in full; nothing in it truncates.
- `clearLetters` (`src/engine/grid.ts`) already gives a grid's shape
  without its letters.

## Decisions

### The human's direction *(human, 2026-10-31, with the mockup)*

From the EPIC's Preview Hints decision and `hint-step-controls.png`:

- **A "Preview Hints" toggle above the hints**, like the existing ones.
  At desktop sizes it lines up vertically with Lock Grid Letters and
  horizontally with the hints' left column ("Across").
- **On, it shows the player's view in place**: the grid without answer
  letters, the hints read-only as play's Player Hints with full text, and
  the Prominent Hint as in play. Off returns to editing as before.

### Wide: its own panel *(measured from the mockup)*

The mockup puts the toggle on a second panel over the hints list, at the
same height and on the same line as the grid's panel. It's S8's
`toggle-row` panel again (`preview-hints-row`):

| | Value |
| --- | --- |
| Line | the toggle row's: same top, **48px** tall |
| Left edge | the hints list's left edge, which is the Across column's |
| Right edge | the hints list's right edge |
| Corners, fill | **10px** (`rounded-modal`), `toggle-row` |
| The toggle | F6's toggle, labeled "Preview Hints", **16px** in, centered |

The grid's panel keeps its place and width, so the grid doesn't move when
the hints phase starts.

### Narrow *(human-approved 2026-11-01; the EPIC leaves the values to this story)*

Below a 1140px window there is no hints list beside the grid, so the
toggle follows Lock Grid Letters in the grid's toggle row: **20px**
after it, **12px** below a 748px window (S8's label-to-button gaps),
centered on the same line. Both fit on one line at a 320px window
(observed), so the row keeps S8's 48px and 40px heights. S10's Rebus link
takes the row's right end.

### On: the player's view

- **The grid** is play's (`data-grid-mode="play"`, play's colors and
  numbers) over the hints-phase grid with its letters cleared
  (`clearLetters`), rebus cells included.
- **The hints** are `PlayerHints` in the hints list's box, two columns
  as in play, each hint in full and wrapped, with no input and no answer
  word. A blank hint shows only its number, as a player would see it.
- **The Prominent Hint**, wide: play's, at the grid's width, **16px**
  over the grid as in play, and under the toggle row. Both the grid and
  the hints list start below it, as in play, so they move down while
  Preview Hints is on (Pending question 1, approved as proposed). It's empty until a word is
  selected, as in play.
- **Narrow**: play's hint bar (`PlayHintBar`) takes the Hint Box's place
  under the grid, and its arrows step through the words as in play. There
  is no Prominent Hint, as in narrow play.

### Selecting as in play; typing does nothing *(EPIC, human-approved)*

- A cell click selects as in play (17-S6's word rule): its word in play's
  colors (`play-cell-selected-cell` and `play-cell-selected-row`), the
  Player Hint marked, and the Prominent Hint showing it. Clicking the
  cursor cell again, arrows and the direction key work as in play.
- A Player Hint click selects its word from its first cell (play's
  "first empty cell", and in this view every cell is empty) and focuses
  the grid.
- Letters and Backspace do nothing: nothing changes, shown or saved.
- The cursor is the editor's own. Turning the view on or off keeps it,
  so the word selected while previewing is the one being edited
  afterwards.

### Editing pauses *(EPIC, human-approved)*

- **Lock Grid Letters is inactive** while Preview Hints is on: its
  checkbox is disabled and its state is kept, shown at **50% opacity**
  with a not-allowed cursor, as the Hint Box's disabled input
  (`disabled:opacity-50`) (Pending question 2, approved as proposed). Locked or not, the
  player's view selects. Off, Lock Grid Letters is as it was.
- **S10's Rebus** is inactive too (S10 applies it).
- **3 Publish works as before.** If it opens "Not quite!", Preview Hints
  turns off so S1's marks are visible. The marks themselves are kept
  while the view is on, since nothing can change them.
- **Not saved**, as Preview and Lock Grid Letters: a reload is back to
  editing.

### Not shown *(human-approved)*

The build phase has no Preview Hints, since it has no hints yet; it keeps
its own Preview. Neither does a published puzzle: its "Play it!" opens
the real thing. Wide, a published puzzle's `preview-hints-row` is
invisible and empty, as S8's grid panel is, so nothing moves.

### Unchanged

The hints-phase editor (inputs, Hint Box, Lock Grid Letters' own
behavior, S1's marks), the step row, play itself and its components, the
toggle's on, off, hover and focus looks (F6), and the style guide (the
inactive toggle is the only new look; see Pending question 2).

## Acceptance

*Frozen* (human-approved 2026-11-01). One new file; no frozen test is amended or retired (the
full suite passes against the throwaway; see Discrimination).

### e2e/preview-hints.spec.ts (new)

The 3×3 word square (CAT / ARE / TEA), its six hints, with a long
1-Across hint that wraps several times.

1. **17-S9-1 the toggle** at 1280px: "Preview Hints", off, on the
   `preview-hints-row` panel: on the toggle row's line, 48px tall, from
   the hints list's (and Across column's) left edge to its right edge,
   `toggle-row`, 10px corners, the toggle 16px in and centered. The build
   phase and a published puzzle have none *(guard)*. A reload is back to
   editing.
2. **17-S9-2 the player's view** at 1280px: on, the grid is play's with
   its numbers and no letters, in `play-cell-on`; the hints list has two
   Player Hint columns and six hints, no input and no answer word; the
   long hint is shown in full, wrapped and not clipped; the Prominent
   Hint is 16px over the grid, at the grid's width and under the toggle
   row. Off, the letters, inputs and hint text are back, with no Player
   Hints or Prominent Hint.
3. **17-S9-3 selecting as in play**: a cell click colors the cursor
   `play-cell-selected-cell` and its word `play-cell-selected-row`, marks
   its Player Hint and shows "1A" and its hint in full in the Prominent
   Hint; clicking it again turns Down ("2D"); an arrow moves the cursor.
   A Player Hint click selects its word from its first cell and focuses
   the grid. Letters and Backspace change nothing, on screen or after a
   reload past the autosave.
4. **17-S9-4 editing pauses**: with Lock Grid Letters on, turning Preview
   Hints on leaves it checked, disabled, at 50% opacity, and a click
   doesn't change it; the grid still selects; off, it's enabled, still
   checked, at full opacity. 3 Publish with a hint missing opens "Not
   quite!" and turns Preview Hints off, so the hint's row is marked.
5. **17-S9-5 narrow** at 1000px, 375px and 320px: no
   `preview-hints-row`; the toggle is in the toggle row 20px (12px) after
   Lock Grid Letters, centered, inside the panel, which stays 48px (40px)
   tall. On, no letters, no Hint Box, no Prominent Hint, and play's hint
   bar under the grid, whose arrows step through the words. No horizontal
   overflow. Off, the Hint Box is back.

### Acceptance choices *(drafting)*

- There are two `preview-hints-toggle` elements, one per layout, and a
  container query shows one, as play renders both of its arrangements.
  The tests read the visible one and require exactly one.
- "Full text" is checked by the text itself, no clipping (scroll size
  within client size), no ellipsis or line clamp, and more than one
  line.
- Typing is checked on screen and after a reload past the 500ms
  autosave, so a letter placed in the hidden real grid fails.
- Not covered: the cursor surviving the toggle in each direction,
  beyond what 17-S9-4's selection exercises. Independent review checks
  it.

### Discrimination (2026-11-01, observed)

- **Current `main` with the proposed test**: 11 of the 12 cases fail; the
  one guard (build phase and published have none) passes.
- **Throwaway implementation** of the Decisions (since reverted; patch
  at `/tmp/s9/throwaway.patch`, not in the repo): the 12 cases pass, the
  full `npm run test:e2e` had 897 passed, and `npm run verify` exited 0
  (Vitest 626/626). An earlier throwaway run failed three frozen 17-S8-2
  and 15-S3-8 cases, a bug in the throwaway itself (an empty wrapper
  added a gap for a published puzzle in one column), not in the tests.
  No frozen test needed amending.

## Repo paths

Acceptance (immutable after freeze): `e2e/preview-hints.spec.ts` (new).

Runtime:

- `src/components/grid/PuzzleGridEditor.tsx`: the Preview Hints state, its
  keys and clicks, the toggle row's line with the second panel, the
  Prominent Hint, and the player's grid, hints and hint bar.
- `src/components/grid/PreviewToggle.tsx`: a `disabled` (inactive) state.
- This story and `../HANDOFF.md`.

Declare any other path before editing it.

## Scope discipline

Only S9. Out of scope: the Rebus link and its inactive state (S10), the
toggles' own colors (F6), play, the build phase's Preview, and any change
to `PlayerHints`, `ProminentHint` or `PlayHintBar`.

## Definition of done

- The human approves this specification, its acceptance and the pending
  questions, recorded here and in the handoff. Freeze on `main` in a
  specification-only commit before any runtime change.
- Frozen acceptance is unchanged after freeze.
- `npm run verify` exits 0, and the full `npm run test:e2e` suite exits 0.
- Delivered on `main` and the handoff updated with observed results.
- The human's visual check at desktop sizes.

## Pending questions

*Answered 2026-11-01: the human approved both as proposed.*

1. **Where the Prominent Hint goes.** The EPIC says "the Prominent Hint
   as in play", and play has it over the grid. The builder's space over
   the grid is the toggle row, which stays because the toggles do.
   *Proposed:* between the toggle row and the grid, 16px over the grid as
   in play. The grid and the hints list move down (68px or more) while the
   view is on. *Alternative:* the Prominent Hint takes the grid panel's
   place while the view is on, since everything there is inactive, so the
   grid barely moves. But Lock Grid Letters (and S10's Rebus) disappear
   instead of showing as inactive.
2. **Lock Grid Letters' inactive look.** F6's toggle has no disabled
   state. *Proposed:* 50% opacity and a not-allowed cursor, as the Hint
   Box's disabled input, with no new color style and no style-guide
   sample. *Alternative:* hide it while Preview Hints is on.
