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

Small builder and play fixes, plus rebus entry.

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

## Scope

1. **Missing hints are marked** when Publish finds some missing.
2. **Play opens on the first empty cell,** with its hint showing.
3. **The Prominent Hint's text is `title-3`.**
4. **Play has no Reset and no "Puzzle options".**
5. **Selection shows in Preview,** over Preview's own words.
6. **Rebus entry** with Escape, or the Rebus button.
7. **The build and hints phases' word highlight is blue,** so the cursor
   cell stands out.

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
A player starts over by deleting letters by hand. Epic 16's test-before-
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

**Rebus can be typed wherever letters can** *(human, 2026-10-27)*: the
build phase, the hints phase while letters are editable (14-S12) and play.
Since S4, that includes Preview.

**A Rebus button** *(human, mockup 2026-10-27)*. An outlined, pill-shaped
"Rebus" button at the top of the hints column, right of the Prominent
Hint, does what Escape does, for devices without a keyboard. *Proposed:*
it shows at every width (in narrow layouts, near the grid's buttons or
hint bar; values from the human in the story).

**No grid-engine change.** Preview selection uses existing engine
functions over `intendedGeometry`. Rebus input is a new keyboard intent in
`src/lib/` and editor or player state; `place` already takes any string.

## Non-goals

- Checking, revealing or autochecking answers, a timer, or pencil mode.
- Rebus-specific answer matching (e.g. accepting the first letter only).
  Answers stay opaque, as `src/engine/play.ts` says.
- Grid-engine changes.
- Changes to the library, sign-in or the layout epic 15 owns.

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

Removes "Puzzle options", its Reset dialog, the builder's quiet Reset
button and, if nothing else calls it, `resetPlaySession` (a risk path,
`actions.ts`). Supersedes epic 11's reset tests.

### S4 — Selection in Preview

Preview's cursor and word highlight over Preview's own words (error,
warning and lettered cells together), Preview-black cells unselectable,
and the cursor's typing and arrow-key movement within them. Supersedes
05-D4's unit tests that Preview ignores selection. Adds a style-guide
sample of a selected Preview word mixing error, warning and lettered
cells.

### S5 — Rebus

Escape and the Rebus button in the build phase, the hints phase and
play: the entry state, its display in the cell, Enter or Escape to
close, and the cell's text fitting its letters.

### S6 — Selection colors

The `blue-dull` palette variable, `build-cell-selected-row-on`,
`build-cell-selected-row-off` and `hint-cell-cursor-word` on blue, the
style guide's swatches and the removal of `yellow-dull` and
`yellow-medium`. Supersedes the yellow
values frozen in `globals-css.test.ts`, `e2e/color-tokens.spec.ts`,
`e2e/build-grid-design.spec.ts` and `e2e/hints-grid-editing.spec.ts`.

---

## Pending questions

None. The draft's three questions were answered 2026-10-27 *(human)* and
are recorded in Decisions: Reset is removed entirely, rebus can be typed
in the build phase, the hints phase and play, and the order is 15, 16, 17.
