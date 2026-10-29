# Story S6 — Small screens

Below a 608px window the grid shrinks to the window less the page's
padding, in the builder and in play; letters keep their ratio to the
cell and numbers shrink with small cells but never below 8px. Nothing is
cut off or runs past the right edge at 375px: the editor's title wraps,
the Hint Box shows its whole word and hint (stacking them when they
don't fit side by side), the wide Hint Inputs wrap a long hint, and the
builder's wrapped controls get a gap between rows.

**Status: approved and frozen** (2026-10-29) *(human: "I approve of S6
and I accept the decisions as made by the previous session's agent")*,
including the *(proposed)* 4px stacked-hint gap. The acceptance below is
frozen (`3132b12`). **Implemented** 2026-10-29 on `main`; awaiting the
human's visual check.

**Implementation notes.** The title and both hint fields are a new
shared `WrappingField` (`src/components/ui/WrappingField.tsx`, a
one-row textarea that grows to its content and rewraps on a width
change), a scope addition beside `TextInput`. It sets `tabIndex={0}`
explicitly, a textarea's default order, so it stays a Tab stop where
the input was for 14-S11-4's frozen `tabTo` helper, which collects
`input` and `[tabindex]` but not `textarea`. A word longer than the Hint
Box itself breaks between letters rather than run past it.

**Blast radius: small to medium.** The client components `CellNumber`
and `PuzzleGrid` (a number-size variable), `PuzzleTitle`, `HintBox`,
`HintsPanel` (its Hint Inputs) and `PuzzleGridEditor` (the controls
row's gap and the box's field ref). The title and both hint fields become
growing multi-line fields. No server, schema, engine or risk path, so
delivery is direct on `main` under CODE-REVIEW.

## What's there today

Measured in the browser at 320, 375, 414, 607 and 608px (5×5, 15×15
and 21×21, builder and play, 2026-10-29):

- **The grid already shrinks.** Since S1 and S3 both grids are 560px
  with `max-w-full`, so below a 608px window (the epic's "about 606px"
  is 560 + 2 × 24) they are the window less 48px, square, 24px in; the
  Hint Box and the play hint bar follow the grid's width.
- **Letters already scale** with the cell (14-S5's ratio, 16px in a 35px
  pitch): a 21×21 at 375px has 7.1px letters in 14.5px cells.
- **Numbers don't:** `cell-number` is 10px at every size, so in a
  21×21 at 375px the number's 12px box fills most of a 14.5px cell and
  overlaps the letter.
- **The editor's title** is a one-line input: a long title runs off its
  right edge, cut mid-letter (the carried "375px clipping").
- **The Hint Box overflows the window** with a long word: its word never
  shrinks, so a 21-letter word at 375 or 414px pushes the input and Next
  arrow up to 88px past the right edge (S4's tests used a 5×5). Its
  input, like the wide Hint Inputs', scrolls a long hint sideways out of
  sight at every width.
- **The narrow builder's controls wrap** at 375px (Publish onto a second
  row, the toggle onto a third) with no space between the rows: the
  toggle touches Publish.
- **Dialogs fit:** at 375×667 the tallest, New puzzle, is 369px; Publish
  with three findings and Create Hints are shorter. So the carried Modal
  clipping stays open, as the epic allows.
- Play narrow (S5) has no title or "Puzzle options", so play's half of
  the carried clipping is gone; its hint bar already wraps.
- At 320px the library's dates run 35px past the edge; nothing else
  measured overflows at 320.

## Decisions

### The grid _(human, the epic's Decisions)_

- **It shrinks last**: 560px down to a 608px window; narrower, the
  window less 48px (the page's 24px padding each side), square, 24px from
  the left, in the builder (both phases) and play. Already so; this story
  pins it.
- The Hint Box and the play hint bar stay at the grid's width.

### Letters _(human, question 2)_

- **Keep 14-S5's ratio** to the cell at every width (16px in a 35px
  pitch), in the builder and in play's guesses, **centered as today**.
  Already so; pinned. (At 375px a 21×21's 7.1px letters sit partly
  under the number; accepted.)

### Numbers _(human, question 1)_

- **10px (`cell-number`) in any cell at least as large as a 21×21's at
  560px** ((560 − 1) / 21 ≈ 26.6px pitch), so every grid at 560px is
  unchanged.
- **In a smaller cell they shrink in proportion to the pitch**,
  `10px × pitch / 26.6px`, **never below 8px**. At 375px: a 5×5's stay
  10px, a 15×15's are 8.2px, a 21×21's 8px.
- Their weight, color and 1px inset are unchanged.

### The editor's title wraps _(human, question 3)_

- **A title too long for its column wraps onto as many lines as it
  needs**, at every width, published or not, and the field grows; the
  numbered buttons (or "Published") keep their distance below it: 16px
  narrow (S3), 32px wide (14-S4). A title that fits is one line, as
  today.
- Its type (`title-3` narrow, `title-1` wide), its underline on hover and
  focus, and its column are unchanged; the underline runs under the
  field's last line.
- **Enter adds no line break** (a title is one line of text that may
  wrap); a pasted line break becomes a space.

### The Hint Box shows everything _(human, question 4: "no ellipses")_

- **The hint wraps** onto as many lines as it needs and the box grows;
  nothing is cut off or scrolled out of sight. A short hint and a word
  that fits keep S4's 48px box.
- **The word sits beside the hint while the hint keeps at least 120px**;
  when it doesn't, the word gets its own row and the hint goes under it,
  starting at the word's left and filling the room to the Next arrow's
  12px *(human chose "stack when needed")*. The word is never cut.
- **The arrows stay level with the first row** (the word's row when
  stacked, the hint's first line otherwise), as in the layout the human
  chose; the box grows downward.
- The spacing inside is S4's: 12px inside the outline, 12px between an
  arrow and the content, 8px between the word and the hint beside it.
  Stacked, the hint is 4px under the word, as the wide Hint Inputs'
  answer is 4px under its line *(proposed)*.
- Its colors, type, underline on focus and accessible name are S4's.
  **Enter adds no line break**; a pasted one becomes a space.

### The wide Hint Inputs wrap _(human)_

- **A long hint wraps** onto as many lines as it needs, the field grows,
  and the answer stays 4px under its last line; the rows below move down.
  Empty and one-line hints keep 14-S6's frame (lines 58px apart).
- The shared `TextInput` keeps its one-line behavior for its other uses
  (sign-in, the new puzzle's name); the Hint Input takes a wrapping
  variant with the same look (body-normal, the `line-muted` underline at
  rest, `line-highlight` on focus, the selected word's fill).
- **Enter adds no line break**; a pasted one becomes a space.

### The builder's wrapped controls _(human, question 5)_

- **10px between rows** when the numbered buttons and the toggle wrap,
  the same 10px the numbered buttons already have between their own
  rows. One row (768px, S3) is unchanged.

### The floor _(human, question 6)_

- **375px is the narrowest width this story covers.** At 375×667 nothing
  runs past the window's right edge (library, builder in both phases with
  a long title and a 21×21, play with a 21×21) and no dialog is taller
  than the window. 320px isn't covered; its library dates stay as they
  are.

### Not changed

- The grid at 560px and everything at 608px and wider other than the
  wrapping title and hints; the cell letter's ratio and position; play's
  hint bar (S5 covered it to 375px) and Player Hints; the dialogs; the
  Modal (its clipping stays open, no dialog is that tall); keyboard
  entry in the grid; the engine (`src/engine/**`).
- No style guide change: no new component. The Hint Box sample shows a
  short hint, as before.

## Non-goals

- Widths below 375px, and the library's 320px overflow.
- Touch input, landscape phones and the window's height (the page
  scrolls, per the epic).
- The Modal's tall-content clipping and its close button's transition
  (stay open, as epic 14 left them).
- Moving the cell letter or changing its ratio.
- Line breaks inside a title or hint, and limits on their length.

## Questions for the human

All answered *(human, 2026-10-29)*:

1. **Numbers:** 10px down to a 21×21-at-560 cell, then in proportion,
   8px minimum. "Yes, I agree."
2. **Letters:** centered at their ratio, unchanged. "Also yes."
3. **The title:** wraps ("wrap long title"), not an ellipsis.
4. **The Hint Box:** "If I write a long hint, I want to see it all
   written out, one way or another -- no ellipses." Asked again with
   mockups: the word and hint stack when they don't fit side by side
   ("Stack when needed"), and the wide Hint Inputs wrap too ("Yes, wrap
   them too").
5. **Wrapped controls:** 10px between rows. "yes"
6. **The floor:** 375px. "Yes"

## Retired and amended acceptance

None. Every frozen test that reads number sizes does so at 1440px
(`build-grid-design.spec.ts` 14-S5-4's 10px), where nothing changes. The
title's frozen tests (14-S4-2's 32px, S3's 16px, its type, underline,
focus and name, `rename.spec.ts`'s keystrokes) use short titles, which
stay one line. The Hint Box's (S4) and Hint Inputs' (14-S6, F-inputs)
frozen tests use empty or short hints and a 5×5, which keep their
one-row, 48px and 58px measurements, and read the fields by test id,
value and computed style, which a multi-line field also has.

## Acceptance

`e2e/small-screens.spec.ts` (new), 36 cases:

- **15-S6-1 the grid shrinks last (7):** at 608px both grids 560px; at
  607, 414 and 375px the builder's (hints phase) and play's grids are the
  window less 48px, square and 24px in, with the Hint Box and the hint bar
  at the grid's left and width.
- **15-S6-2 letters (2):** at 375px a 15×15's builder letters and play
  guesses are `(width − 1) / 15 × 16/35`.
- **15-S6-3 numbers (6):** in the builder, a 21×21 at 608px 10px; a
  15×15 at 414 and 375px in proportion; a 21×21 at 375px 8px; a 5×5 at
  375px 10px; in play, a 15×15 at 375px in proportion. All within 0.3px.
- **15-S6-4 the title wraps (4):** at 375px a long title is more than one
  `title-3` line, whole (nothing scrolled out of sight), in the grid's
  column, its value whole, the buttons 16px below; a short title is one
  line; at 1440px a very long title is more than one `title-1` line,
  whole, the buttons 32px below; Enter adds no line break.
- **15-S6-5 the Hint Box shows everything (5):** at 414 and 375px a
  21-letter word is whole on its own row, the hint field under it from
  its left, both arrows inside the box and level with the word, the box
  taller than 48px, no horizontal overflow; at 768px the same word fits
  beside a field of at least 120px in a 48px box; at 768px a long hint is
  whole, the box grows, and the word and both arrows are level with its
  first line; Enter adds no line break.
- **15-S6-6 wrapped controls (2):** at 375px in both phases the toggle's
  row 10px under the numbered buttons.
- **15-S6-7 nothing clips at 375×667 (7):** no horizontal overflow in the
  library, the builder (21×21, long title, both phases) and play (21×21);
  New puzzle, Publish (three findings) and Create Hints dialogs inside the
  window with nothing cut off.
- **15-S6-8 the Hint Inputs wrap (2):** at 1440px a long hint is whole,
  its field taller than an empty one, the answer 4px below, the next row
  below the answer; Enter adds no line break.

Not covered by a browser case: a pasted line break becoming a space, and
the underline under a wrapped title's last line; the visual check covers
them.

**Discrimination** (2026-10-29, before implementation): 13 failed, 23
passed. The failures: every number case below full size (10px today);
both long-title cases (one line); both stacked-word Hint Box cases (up to
88px of overflow) and the long-hint box (hint scrolled); the long Hint
Input (scrolled); both wrapped-row cases (0px); and the 21×21
hints-phase builder (overflow). The passes hold today by design: the
grid's shrinking, letters, 10px numbers at full size and in a 5×5, a
short title, the 768px word beside its field, the three Enter cases
(one-line inputs today; they guard the multi-line fields), the library,
the grid-phase builder, play and the dialogs. `tsc --noEmit` and ESLint
pass on the new spec.

## Repo paths

Runtime: `src/components/grid/CellNumber.tsx`,
`src/components/grid/PuzzleGrid.tsx` (a number-size variable beside the
letter's), `src/components/puzzle/PuzzleTitle.tsx`,
`src/components/grid/HintBox.tsx`, `src/components/grid/HintsPanel.tsx`,
`src/components/ui/TextInput.tsx` (a wrapping variant, its one-line use
unchanged), `src/components/ui/WrappingField.tsx` (new, the growing
field), `src/components/grid/PuzzleGridEditor.tsx` (the controls
row's gap, the box's field ref).

Acceptance: `e2e/small-screens.spec.ts` (new).

## Definition of Done

- The human answered the questions (2026-10-29) and approves this
  specification and its acceptance, recorded here and in the handoff.
  Freeze on `main` in a specification-only commit.
- Implement on `main` (no risk path); the frozen acceptance is unchanged
  after freeze.
- `npm run verify` exits 0 and the full `npm run test:e2e` passes.
- The human's visual check passes: the builder (both phases) and play at
  414 and 375px with 5×5, 15×15 and 21×21 grids (numbers and letters
  legible), a long title narrow and wide, a long word and a long hint in
  the Hint Box, a long hint in the wide Hint Inputs, the wrapped
  controls, and unchanged at 608px and wider with short text.
