# Epic: Polish

**Draft, not approved (2026-10-27).** Drafted from the human's list of
design and UX issues of 2026-10-27 and the NYT-style Rebus mockup. Their
layout items (the 560px grid, the 1800px main area, the 32px gap and the
filling hint columns) went into [epic 15](../15-responsive-layout/EPIC.md)
instead, since it reworks the same containers. Nothing here is approved
until the human approves the EPIC; each story is then drafted and approved
on its own. Comes after epic 15. Its order against
[epic 16](../16-puzzle-lifecycle/EPIC.md) is the human's to choose.

Small builder and play fixes, plus rebus entry. More may be added before
approval.

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

## Scope

1. **Missing hints are marked** when Publish finds some missing.
2. **Play opens on the first empty cell,** with its hint showing.
3. **The Prominent Hint's text is `title-3`.**
4. **Play has no Reset and no "Puzzle options".**
5. **Rebus entry** with Escape, or the Rebus button.

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

**Rebus entry by Escape** *(human)*. With a cell selected, Escape opens
rebus entry for it, starting from the cell's current letters. Typing
builds the entry; Escape or Enter closes it and places the whole string in
the cell, which the engine already supports. *Proposed:* only letters and
digits, uppercase, as single-letter entry does; an empty entry clears the
cell; the cursor then advances as after a single letter; the cell's text
shrinks to fit.

**A Rebus button** *(human, mockup 2026-10-27)*. An outlined, pill-shaped
"Rebus" button at the top of the hints column, right of the Prominent
Hint, does what Escape does, for devices without a keyboard. *Proposed:*
it shows at every width (in narrow layouts, near the grid's buttons or
hint bar; values from the human in the story).

**No grid-engine change.** Rebus input is a new keyboard intent in
`src/lib/` and editor or player state; `place` already takes any string.

## Non-goals

- Checking, revealing or autochecking answers, a timer, or pencil mode.
- Rebus-specific answer matching (e.g. accepting the first letter only).
  Answers stay opaque, as `src/engine/play.ts` says.
- Grid-engine changes.
- Changes to the library, sign-in or the layout epic 15 owns.

---

## Stories

Order as listed. Story files are `stories/17-S<n>-<slug>.md`. Each lists
the frozen tests it supersedes.

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
`actions.ts`). Supersedes epic 11's reset tests. Depends on Pending
question 1.

### S4 — Rebus

Escape and the Rebus button, in each place letters can be typed (Pending
question 2): the entry state, its display in the cell, Enter or Escape to
close, and the cell's text fitting its letters.

---

## Pending questions

1. **Remove Reset entirely?** Reset only erases a player's own answers;
   it isn't on the builder page and never touches the puzzle. Without it,
   a player can't start over except by deleting letters by hand. Epic 16's
   "publish Unlisted, play and reset" for testing would become "play".
   *Proposed:* remove it as asked, and amend epic 16's sentence.
2. **Where can a rebus be typed?** Play needs it to solve a rebus puzzle,
   but a builder needs it first to put one in the grid. *Proposed:* the
   build phase, the hints phase while letters are editable (14-S12) and
   play.
3. **Order against epic 16.** Both come after epic 15. Which goes first?
