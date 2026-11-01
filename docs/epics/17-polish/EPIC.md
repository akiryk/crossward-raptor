# Epic: Polish

**Approved by the human 2026-10-27.** Drafted the same day from the
human's list of design and UX issues and the NYT-style Rebus mockup. Their
layout items (the 560px grid, the 1800px main area, the 32px gap and the
filling hint columns) went into [epic 15](../15-responsive-layout/EPIC.md)
instead, since it reworks the same containers; the human confirmed that
amendment, including S2 becoming "Wide layout". Every pending question was
answered before approval *(human)* and is recorded in Decisions; items
still marked *proposed* are settled in their stories. Stories are drafted
and approved one at a time. Comes after epics 15 and
[16](../16-puzzle-lifecycle/EPIC.md), in that order *(human)*.
**Amended 2026-10-28** with S4, selection in Preview, from the human's
notes of that day; Rebus moved from S4 to S5. S6, the build phase's
selection colors, was added the same day.
**Amended 2026-10-31** from the human's addendum of that day: S6 (only
real words), S7 (larger grid), S8 (step controls) and S9 (Preview
Hints), plus the rebus cell's look. Selection colors became S5 and Rebus
S10, after the controls row and cell size it depends on. The human
approved this amendment the same day.
The addendum's selection-colors story repeated the old S6 and added
nothing. Its file was folded in here and deleted.

Small builder and play fixes, a larger grid, clearer builder steps and
rebus entry.

---

## The human's details (2026-10-27)

Recorded as given; the Decisions below are drawn from them.

- **Hint phase, missing hints:** when the user clicks Publish but hasn't
  filled in all the hints, highlight the missing hints in the Across and
  Down columns with a light red background. It's a new color, called
  "pink", #FFE4E2. Also change these to the error red: the 1px input
  line, the number, and the label (the word under and to the right of the
  input). As soon as the user starts to type in one of these fields, its
  colors go back to normal.
- **Play:** remove the Reset and "Puzzle options" buttons.
- **Play:** unlike the builder, play opens with the first open cell
  selected (left to right, top to bottom), so a hint is selected and shown
  in the Prominent Hint at once.
- **Play:** the Prominent Hint's text uses `title-3`.
- **Rebus:** the Escape key enters or edits a rebus on a desktop or laptop.
  Escape or Enter closes it. For touch devices, a "Rebus" button, like the
  NYT's, above the hints (mockup: an outlined pill-shaped "Rebus" button at
  the top of the hints column, right of the Prominent Hint).

## The human's details (2026-10-28)

- **Preview, selection:** filling the right cells is easier while they're
  highlighted, as in Preview. Letters can already be edited in Preview,
  but it isn't obvious. Clicking a warning cell in Preview colors it
  `build-cell-selected-cell` (yellow-bright), and the other cells of its
  word "build-cell-selected-cell-on". No cell takes the "off" color. The
  black (off) cells stay black and unselectable. Direction matters as in
  the build phase: in Across, the word is horizontal.
- **The same for an error cell.** An unfinished word can mix error,
  warning and lettered cells; they all change color together. Example:
  three cells across, A, B and C. A is red (error); B has a letter, so
  it's white; C is a warning, as part of a two-letter Down word. Clicking
  A, B or C colors all three: the clicked one `build-cell-selected-cell`,
  the others "build-cell-selected-cell-on".
- **Selection colors** (with the answers that followed): as a builder, I want the difference between the
  selected cell and the rest of its word to be more obvious, so I know
  where my cursor is. Yellow-bright and yellow-medium are too alike on
  Sunday puzzles. The three colors are "build-cell-selected-cell"
  (yellow-bright, unchanged), "build-cell-selected-cell-on" (now
  blue-medium) and "build-cell-selected-cell-off" (now blue-dull, a new
  color, #CADAE2). The hints phase's colors match the build phase's;
  remove yellow-dull and yellow-medium.

## The human's details (2026-10-31)

From the addendum, condensed; every value is the human's. Mockups are in
the human's `~/Downloads`.

- **Rebus cell:** while a rebus is being entered, its cell enlarges by
  about a third (36px to 48px in the mockup) and has a subtle drop
  shadow: x 0, y 4, blur 4, spread 0, rgb(0 0 0 / 0.25) (`rebus.png`).
- **Hints phase, word directions:** as a builder adding hints, I want to
  select only words. A cell in only an Across word (the B of 1-Across
  BLUE, starting no Down word) should only be Across, with that word
  highlighted. A second click or the Down arrow is ignored because there
  is nothing to do Down. Today it can switch to Down and highlight one
  lone yellow cell (`broken-down-word.png`, versus `across-mode-word.png`).
  *(Answer, 2026-10-31: the same in play.)*
- **Preview Hints:** as a builder, I want to see what the hints and puzzle
  will look like to the player, e.g. that long hints aren't truncated. A
  Preview toggle like the existing one, above the hints section: at
  desktop sizes it aligns vertically with Lock Grid Letters and
  horizontally with the hints' left column (the word "Across").
  *(Answer: on, it shows the player's view in place.)*
- **Larger grid:** Sunday puzzles must be readable without zooming. The
  grid's 560px maximum becomes 700px, kept as long as possible. The
  numbers must stop overlapping the letters. Emulate the NYT, which is
  readable even at 535px (`nyt-sunday-535px.png` versus
  `crossward-raptor-sunday.png` at 560px).
- **Step controls:** as a builder, I want to know what step I'm on and
  what's next. Replace the three step buttons. The build step shows a
  "Build the Grid" label, left, and one button for the next step,
  "2 Create Hints", right (`build-step-controls.png`). The hints step shows
  a "Create Hints" label and "3 Publish" (`hint-step-controls.png`).
  The buttons behave as today, e.g. Publish's confirmation. A hairline
  separates them from the grid's own controls below (Preview or Lock
  Grid Letters, and Rebus). Use only existing styles: the hairline takes
  the color of similar hairlines, the labels are `title-4`, and other
  colors are the implementer's call, for the human to amend. The mockups
  show the toggle text gray and "Rebus" as a blue text link.
  *(Answer: the link is the builder's Rebus control; play keeps S10's
  pill.)*

## What the code does today (2026-10-27)

- **Publishing with missing hints** opens the "Not quite!" too-early
  dialog (14-S4, `TooEarlyDialog.tsx`) and marks nothing. Each hint row
  already carries `data-complete` (`HintsPanel.tsx`). The hint number is
  `hint-label`, the answer word under the input is `hint-answer`, and the
  input is `TextInput`. The error red is the `error` color style.
- **Play opens with nothing selected.** The cursor starts null. A cell
  click or a Player Hint click selects a word, and the Prominent Hint
  shows only while the grid has focus (`PlayPuzzle.tsx`). Its text is
  `body-large` (`ProminentHint.tsx`).
- **Reset** erases only the player's own answers: it deletes their play
  session and starts a blank one (epic 11). It isn't on the builder page
  and never touches the puzzle's letters or hints. Every player reaches it
  under "Puzzle options"; a puzzle's builder playing it also sees a quiet
  "Reset" button. Epic 15's S5 already hides "Puzzle options" in narrow
  play.
- **Rebus:** the data model, storage and rendering already accept
  multi-letter cells; only input is missing (the reference doc's Open
  questions). `keyToIntent` (`src/lib/keyboard-intent.ts`) emits single
  letters, and the engine's `place` takes the letter as an opaque string.
- **Preview shows no selection.** `cellAppearance` ignores selection and
  slot membership in Preview (05-D4: "what will this look like
  published"), but the cursor still moves on a click and typing still
  places letters, invisibly. Preview's cells come from
  `intendedGeometry` (`src/engine/puzzle-geometry.ts`): an empty cell is
  black unless it's a symmetric hint (`required`, the error color); a
  cell in a two-letter word is `recommended` (the warning color,
  05-D6), lettered or not. The engine cursor moves over every active
  cell, including those Preview shows black.
- **Build selection colors** (`globals.css`, 13's color styles): the
  cursor cell is `build-cell-selected-cell` (yellow-bright); the rest of
  its slot is `build-cell-selected-row-on` (yellow-medium) where a cell
  holds a letter or is a symmetric hint, and `build-cell-selected-row-off`
  (yellow-dull) otherwise. Nothing else uses yellow-dull. With the grid
  focused, the hints phase's cursor is `hint-cell-cursor` (yellow-bright)
  and its word `hint-cell-cursor-word` (yellow-medium); with a hint input
  focused, its word is `hint-cell-selected` (blue-medium) (14-S6,
  14-S12). Nothing else uses yellow-medium. Play already pairs a
  yellow-bright cell with a blue-medium word.

Added 2026-10-31:

- **Direction switches anywhere.** The engine's `moveTo` (clicking the
  cursor cell again), `toggleOrientation` and `arrowKey` (a cross-axis
  arrow) change orientation on any active cell, whether or not it has a
  word that way. The same holds in the build phase, the hints phase
  (`PuzzleGridEditor.tsx`) and play (`PlayPuzzle.tsx`).
- **Grid size.** `GRID_MAX_PX = 560` in both `PuzzleGridEditor.tsx` and
  `PlayPuzzle.tsx` (15-S1), and the editor's `max-w-[560px]`.
  `PuzzleGrid.tsx` scales letters (16px at a 35px pitch) centered in the
  cell, and numbers (10px, at least 8px) at the top left
  (`CellNumber.tsx`), so on a 21×21 grid they collide.
- **Step buttons.** `BuilderSteps.tsx` (14-S4, 14-S12) shows three
  numbered buttons. In the build phase, 3 Publish opens the "lol" or
  "nope" too-early dialog. In the hints phase, 1 is done and disabled
  (there is no way back) and 3 Publish opens "Not quite!" or the Publish
  dialog. Below them, one toggle row holds Preview (build) or Lock Grid
  Letters (hints). A published puzzle shows `PublishedState` instead.
- **No player's-view preview in the builder.** The hints phase shows only
  editable hint inputs.

## Scope

1. **Missing hints are marked** when Publish finds some missing.
2. **Play opens on the first empty cell,** with its hint showing.
3. **The Prominent Hint's text is `title-3`.**
4. **Play has no Reset and no "Puzzle options".**
5. **Selection shows in Preview,** over Preview's own words.
6. **Rebus entry** with Escape, or the Rebus button.
7. **The build and hints phases' word highlight is blue,** so the cursor
   cell stands out.
8. **The hints phase and play select only real words.**
9. **The grid grows to 700px,** with numbers clear of the letters.
10. **The builder's step controls** show the current step and the next.
11. **Preview Hints** shows the player's view in the hints phase.

## Decisions

**Epics 13 and 14's Decisions carry over** *(human)*: components use color
styles, never palette variables; exact values come from the human per
story, with the mockups as the default; a story that replaces frozen
behavior names each superseded test and its replacement, retired in its
specification-only freeze commit; tests assert structural properties.

**Missing hints** *(human)*. Clicking 3 Publish while required hints are
missing marks each missing hint's row: a `pink` background (#FFE4E2, a new
palette variable and a new color style), and the `error` color on the 1px
input line, the hint number and the answer word. A row's mark clears at
its first keystroke *(human)*. *Proposed:* the "Not quite!" dialog still
opens; the marks show with it and stay after it closes. A hint emptied
again isn't re-marked until the next Publish click. In epic 15's narrow
Hint Box, the box's input gets the same marks while its word's hint is
marked.

**Play opens on the first empty cell** *(human)*. In reading order (left
to right, top to bottom), Across, with the Prominent Hint showing that
word's hint. *Proposed:* the grid takes focus on open so typing works at
once; a full but unsolved grid opens on its first white cell; a completed
(read-only) puzzle opens with nothing selected, as today. The builder is
unchanged.

**Prominent Hint text in `title-3`** *(human)*. Wide play's Prominent Hint.
Epic 15's narrow play hint bar takes its own values in 15-S5.

**Play has no Reset** *(human, 2026-10-27)*. "Puzzle options", its
Reset dialog and the builder's quiet Reset button are removed, not hidden.
A player starts over by deleting letters by hand. *Amended (human,
2026-11-01):* Reset is only in the library: its small Reset button on a
completed Play row (14-S2) and its confirmation dialog stay, unchanged,
and nothing in the builder or play resets. Epic 16's test-before-
sharing step is now "publishes Unlisted and plays" (amended there).

**Selection in Preview** *(human, 2026-10-28)*. In Preview, clicking a
cell Preview shows as white, error or warning selects it, and its word in
the cursor's direction (Across or Down, as in the build phase) is
highlighted: the cursor cell is `build-cell-selected-cell`, the rest of
the word `build-cell-selected-row-on` (yellow-medium; the human's
"build-cell-selected-cell-on" names this existing style). Nothing in
Preview takes `build-cell-selected-row-off`. A word is a run of
Preview's non-black cells, i.e. a slot of `intendedGeometry`, so error,
warning and lettered cells highlight together. Preview's black cells stay
black and can't be selected. Unselected cells keep Preview's colors, and
the highlight shows only while the grid has focus, as in the build
phase. *Proposed:* clicking a Preview-black cell does nothing; clicking
the cursor cell again toggles direction, as in the build phase; typing
advances only within the Preview word and stops at its end; arrow keys
skip Preview-black cells; a cell emptied so that Preview would show it
black stays selected until the cursor leaves it; turning Preview on
while the cursor is on a Preview-black cell shows no highlight until a
cell is clicked. Supersedes 05-D4's "Preview ignores selection" unit
tests. Cursor rules reuse the engine's pure functions over
`intendedGeometry`; no engine change.

**Build selection colors** *(human, 2026-10-28)*.
`build-cell-selected-row-on` becomes `blue-medium` and
`build-cell-selected-row-off` a new palette variable, `blue-dull`
(#CADAE2); `build-cell-selected-cell` stays `yellow-bright`. The human's
"build-cell-selected-cell-on/-off" name these existing styles; the style
names don't change. They apply wherever those styles do, including S4's
Preview word. **The hints phase matches** *(human, 2026-10-28)*:
`hint-cell-cursor-word` becomes `blue-medium` too, so with the grid
focused the cursor's word is the same blue as a focused hint input's
word, and the yellow-bright cursor cell is what tells them apart.
**`yellow-dull` and `yellow-medium` are removed** *(human, 2026-10-28)*
from the palette and the style guide; nothing uses them after this. Supersedes the frozen values in `globals-css.test.ts`,
`e2e/color-tokens.spec.ts`, `e2e/build-grid-design.spec.ts` and
`e2e/hints-grid-editing.spec.ts`.

**Rebus entry by Escape** *(human)*. With a cell selected, Escape opens
rebus entry for it, starting from the cell's current letters. Typing
builds the entry; Escape or Enter closes it and places the whole string in
the cell, which the engine already supports. *Proposed:* only letters and
digits, uppercase, as single-letter entry does; an empty entry clears the
cell; the cursor then advances as after a single letter; the cell's text
shrinks to fit.

**The rebus cell while entering** *(human, mockup 2026-10-31)*. The cell
being entered enlarges by about a third of a grid cell (36px to 48px in
the mockup), centered on its cell and above its neighbors, white, with
the drop shadow x 0, y 4, blur 4, spread 0, rgb(0 0 0 / 0.25). It
returns to normal when entry closes. *Proposed:* the shadow is a new
shadow token, used only through a style.

**Rebus can be typed wherever letters can** *(human, 2026-10-27)*: the
build phase, the hints phase while letters are editable (14-S12) and play.
Since S4, that includes Preview.

**The Rebus control** *(human, 2026-10-31)*. It does what Escape does,
for devices without a keyboard. **In the builder** (build and hints
phases), it is a "Rebus" text link at the right of S8's toggle row,
aligned with the grid's right edge, as in the step-controls mockups. **In
play** *(human, mockup 2026-10-27)*, it is an outlined, pill-shaped
"Rebus" button at the top of the hints column, right of the Prominent
Hint. *Proposed:* it shows at every width (in narrow layouts, near the
grid's buttons or hint bar; values from the human in the story) and is
inactive while letters can't be typed (Lock Grid Letters, Preview Hints,
published).

**Only real words can be selected** *(human, 2026-10-31)*. In the hints
phase and play, the cursor's direction is always one with a word through
the cursor cell. Clicking a cell that has a word in one direction only
takes that direction. Clicking the cursor cell again, or pressing the
cross-axis arrow, does nothing there (no lone highlighted cell). A
cross-axis arrow only changes direction where a word runs that way; it
never moves the cursor. The build phase is unchanged, since its words are
still being made. *Proposed:* the hints phase's words are the published
puzzle's (as its hint list); every white cell in a valid grid has at
least one. Built from `extractSlots` outside the engine.

**The grid is at most 700px** *(human, 2026-10-31)*, up from 560px (15-S1),
in the build phase, the hints phase and play. It stays 700px as long as
the window allows before shrinking. *Proposed:* epic 15's wide and
narrow breakpoints move by the same 140px so the hints columns keep their
minimum widths. The story records the new breakpoints and supersedes the
560px tests it replaces.

**Numbers clear of letters, as the NYT** *(human, 2026-10-31)*. Measured
from the NYT screenshot in the story: the number stays at the top left,
and the letter sits lower in the cell, smaller relative to the cell, so
two-digit and three-digit numbers never touch it at any grid size from
5×5 to 21×21. The values come from the measurements, scaled with the
cell as today (`PuzzleGrid.tsx`). A rebus's letters shrink within the
same letter area.

**Step controls** *(human, mockups 2026-10-31)*. The three step buttons
give way to one row: a label for the current step on the left, `title-4`,
with its step number (as in the mockup), and a button for the next step
on the right, aligned with the grid's right edge: "Build the Grid" with
"2 Create Hints", then "Create Hints" with "3 Publish". The buttons do
what 2 and 3 do today. A full-width hairline, in the color of the app's
other hairlines, separates this row from the grid's toggle row below. All
styles are existing ones. A published puzzle keeps `PublishedState`.
**The build phase has no Publish button**, so its "lol" and "nope"
too-early dialogs (14-S4) are removed. "Not quite!" (and S1's marks) stay.
*Proposed:* the labels keep today's text ("Build the Grid"); the
mockup's "Lock the Grid" stays "Lock Grid Letters". Supersedes 14-S4's
step-button tests, named in the story.

**Preview Hints** *(human, 2026-10-31)*. In the hints phase, a "Preview
Hints" toggle sits above the hints columns. In the wide layout it is on
the toggle row's line and aligned with the Across column's left edge. On,
the grid and hints show the player's view in place: the grid without
answer letters, the hints read-only as play's Player Hints with full text
(nothing truncated), and the Prominent Hint as in play. Off returns to
editing as before. *Proposed:* selecting a cell or hint works as in play,
but typing does nothing. Lock Grid Letters and Rebus are inactive while
it's on. It isn't saved. In the narrow layout it sits in the toggle row
(values in the story).

**No grid-engine change.** Preview selection uses existing engine
functions over `intendedGeometry`. Rebus input is a new keyboard intent in
`src/lib/` and editor or player state; `place` already takes any string.
The word-direction rule wraps the engine's cursor functions with existing
slot data.

## Non-goals

- Checking, revealing or autochecking answers, a timer, or pencil mode.
- Rebus-specific answer matching (e.g. accepting the first letter only).
  Answers stay opaque, as `src/engine/play.ts` says.
- Grid-engine changes.
- Changes to the library or sign-in. Layout changes beyond S7's grid
  size and the breakpoints that follow from it. (Epic 15, which owns the
  layout, is closed.)
- Going back from the hints phase to the build phase.

---

## Stories

Order as listed. The epic starts after epics 15 and 16 *(human)*. Story
files are `stories/17-S<n>-<slug>.md`. Each lists the frozen tests it
supersedes.

### S1 — Missing hints

The `pink` palette variable and color style, the marks on 3 Publish, the
per-row clearing and the Hint Box case. Adds a style-guide sample of a
marked hint row.

### S2 — Play opens on the first empty cell

The opening cursor and focus, the Prominent Hint showing at once, and its
text in `title-3`. Supersedes 14-S7's and epic 11's expectations that play
opens with nothing selected.

### S3 — No Reset in play

Removes "Puzzle options", its Reset dialog and the builder's quiet Reset
button. The library's Reset still calls `resetPlaySession`, so it stays
*(human, 2026-11-01)*; removing the builder check `isPlayPuzzleBuilder`
still touches `actions.ts` (a risk path). Supersedes epic 11's play reset
tests.

### S4 — Selection in Preview

Preview's cursor and word highlight over Preview's own words (error,
warning and lettered cells together), Preview-black cells unselectable,
and the cursor's typing and arrow-key movement within them. Supersedes
05-D4's unit tests that Preview ignores selection. Adds a style-guide
sample of a selected Preview word mixing error, warning and lettered
cells.

### S5 — Selection colors

The `blue-dull` palette variable, `build-cell-selected-row-on`,
`build-cell-selected-row-off` and `hint-cell-cursor-word` on blue, the
style guide's swatches and the removal of `yellow-dull` and
`yellow-medium`. Supersedes the yellow
values frozen in `globals-css.test.ts`, `e2e/color-tokens.spec.ts`,
`e2e/build-grid-design.spec.ts` and `e2e/hints-grid-editing.spec.ts`.

### S6 — Only real words

The hints phase and play take a word's direction on a click, ignore a
second click or cross-axis arrow where no word runs that way, and never
show a lone highlighted cell. The build phase is unchanged. Supersedes any
frozen hints-phase or play test that toggles onto a wordless direction.

### S7 — Larger grid

The 700px maximum in the build phase, the hints phase and play, the
breakpoints that follow, and the NYT-measured letter and number sizes and
positions that keep numbers clear of letters at every grid size. Includes
a style-guide sample of a 21×21 corner with three-digit numbers.
Supersedes 15-S1's 560px tests and 15-S6's cell type sizes.

### S8 — Step controls

The current-step label and next-step button row, its hairline, the toggle
row below with S10's Rebus link slot, and the removal of the build phase's
3 Publish, with its "lol" and "nope" dialogs. Supersedes 14-S4's
step-button and too-early tests, which the story names.

### S9 — Preview Hints

The hints phase's Preview Hints toggle, its position over the Across
column, and the player's view it shows: the grid without letters,
read-only Player Hints with full text and the Prominent Hint. Editing
pauses while it's on.

### S10 — Rebus

Escape and the Rebus control (S8's link in the builder, the pill in play)
in the build phase, the hints phase and play: the entry state, the
enlarged, shadowed cell while entering (the human's `rebus.png` mockup),
Enter or Escape to close, and the cell's text fitting its letters.

---

## Pending questions

None. The draft's three questions were answered 2026-10-27 *(human)* and
are recorded in Decisions: Reset is removed from play (only the library
keeps it, 2026-11-01), rebus can be typed in the build phase, the hints
phase and play, and the order is 15, 16, 17.
The 2026-10-31 amendment's questions were answered that day *(human)*:
fold the addendum into this EPIC, the word rule covers the hints phase and
play, Preview Hints shows the player's view in place, and the Rebus
control is a link in the builder and a pill in play.
