# Epic: Build progress

**Approved by the human 2026-11-08**, including the agent's proposed
details under Decisions. Rewritten to repo standards from an outside
draft (below); the human answered its open questions and supplied a
mockup the same day. The human delegated each story's approval and
freeze to the orchestrating session (see the [handoff](HANDOFF.md#orchestration));
the human does a visual check before closeout.

In the build phase of a daily or Sunday puzzle, with Preview on, the
toggle row shows how much of the grid holds letters: a message ("Keep
building." or "Ready to create hints!"), a slim bar marking the 80–85%
range NYT-style grids conventionally reach, and "N% complete". With
Preview off, nothing changes.

## The human's request

Recorded as given (2026-11-08):

> The main idea is to add information to the UI that helps builders know
> when they have completed enough of the puzzle grid to consider it
> "done", according to standards used by the NY Times. [...] it's
> important that the UI changes affect only the UI when in preview mode.
> That is, we only see the percent complete information if the preview
> toggle is on.

The outside draft (`EPIC-crossword-build-progress.md`, 2026-11-06)
records decisions from a mockup discussion with another agent. Those the
human's later answers didn't replace, as that agent recorded them:

- The bar takes the place of Rebus in the toggle row.
- A fixed 80–85% target zone in the bar: about the share of white cells
  in a conventional NYT 15×15. It never moves.
- The bar's look changes at 80%, where "Ready to create hints!" shows.
- No 5% tick marks (an early mockup had them; the human removed them).
- Only cells holding letters count.
- The mockup's slider was for demonstration only.

The human's answers to the open questions (2026-11-08), as given:

> 1. Yes [hide Rebus with Preview on]
> 2. Round down
> 3. Only show the progress info for two sizes: daily and Sunday; it's
>    not needed for mini or midi
> 4. Move the text "ready to create..." above the bar. If the text is
>    still too much, make the font size smaller
> 5. I put some mockups in `/Downloads/progress.png`. The background is
>    the same background as we have now for the preview and rebus
>    buttons. In my mocks, the alignemnt might be screwy -- don't change
>    alignment, I want elements vertically aligned so it looks neat and
>    clean. Colors: light gray bar is gray-200; orange is orange; dark
>    blue is interactive dark. The text to the left of the progress bar
>    is body-text-normal and color is text-primary. The text to the right
>    is body-text-small and text-muted. The progress bar graph can be
>    responsive — if the screen gets narrower, don't squeeze the size of
>    the entire top area equally. Leave the text and preview button as is
>    but shrink how much space the progress graph gets until it is 80px.

[The [mockup](assets/progress-mockup.png): three toggle rows, Preview on at the left. At the right, on
one line: the message, the bar, the percentage. 41%: "Keep building.",
a gray fill to 41% on a white, thinly bordered track, an orange block at
80–85%. 80%: "Ready to create hints!", a dark blue fill to 80%, the
orange block. 88%: the same, the dark blue continuing past the orange
block to 88%.]

Then, to the agent's follow-up questions: the message is left of the bar
and moves above it only on narrow screens; the bar is about 180px wide
as mocked; and 12px high as mocked.

## What the code does today

- **The build phase's grid is all white.** A cell is empty or holds a
  letter (`Cell` in `src/engine/grid.ts`; a rebus cell holds a
  multi-character `letter`). Preview (`mode="preview"`) shows
  `intendedGeometry` (`src/engine/puzzle-geometry.ts`): a cell is black
  unless it or its symmetric counterpart holds a letter. Grids saved
  before the all-white model can still hold black cells.
- **Letters can be typed, deleted and rebus-entered with Preview on**
  (`previewKey`, `canRebus` in `PuzzleGridEditor.tsx`). Preview isn't
  saved; the grid autosaves on every edit.
- **The toggle row** (`ToggleRow`, `BuilderSteps.tsx`; used in
  `PuzzleGridEditor.tsx`) is the grid's width (at most 700px),
  `bg-toggle-row`, 40px high and 48px from 748px wide. In the build
  phase it holds the Preview toggle at the left and, at the right, Lock
  Word (21-S5, only where the grid has no room for the lock button,
  already hidden with Preview on) and Rebus (17-S10). The Rebus link is
  the way to open a rebus without a keyboard (Escape does it with one).
- **The hints phase's** toggle row holds Lock Grid Letters; a published
  puzzle's holds nothing in this row.
- **Sizes** (`src/lib/puzzle-size.ts`): mini 5×5, midi 9×9, daily 15×15,
  Sunday 21×21.
- **Create Hints** (step 2) opens `EnterHintsDialog`; it has no
  fill-level check, and this epic adds none.
- **Tokens** the mockup names: palette `gray-200` #dde0e6, `orange`
  #ef9d05, `interactive-dark` #005b8c, `white`; colors `primary`,
  `muted` (40% black); text styles `body-normal` (14px) and
  `body-small` (12px).
- [NYT reference](../../NYT-CROSSWORD-REFERENCE.md): black squares
  historically about 16% of the grid, i.e. about 84% white.

## Stories (proposed order)

1. **S1 The completion count:** a pure engine function giving a grid's
   lettered cells and total cells. `src/engine/**`: branch, PR and
   independent review.
2. **S2 The progress bar:** with Preview on, in a daily or Sunday
   puzzle's build phase, the message, the bar and the percentage take
   Rebus's place, below and at 80%, at every width. Off the risk paths.

S2 builds on S1. S2 covers its own edit paths, widths and accessibility
in its acceptance. Each checks its actual paths against CODE-REVIEW. If
S2's specification grows too large, the narrow-screen layout can become
an S3.

## Decisions

From the human:

- **Preview only.** The progress shows only in the build phase with
  Preview on. With Preview off the toggle row is exactly as today. Not
  in the hints phase, a published puzzle or play.
- **Daily and Sunday only.** Only 15×15 and 21×21 grids show it; a mini
  or midi with Preview on looks as today, Rebus included.
- **Rebus is hidden with Preview on** wherever the progress shows (the
  human accepted that a device without a keyboard then can't open a
  rebus in Preview; Escape still opens one).
- **Lettered cells over all cells.** Progress = 100 × lettered cells ÷
  all the grid's cells (225 for 15×15, 441 for 21×21), whatever Preview
  would show black. A rebus cell counts once. Example: 90 of 225 is 40%.
- **Only letters move it.** Typing into an empty cell raises it, deleting
  a letter lowers it, overtyping a letter leaves it. Load, Reset Grid
  and every edit path recompute it from the grid. Toggling Preview never
  changes the grid or the count.
- **Rounded down.** "N% complete" shows the whole percentage rounded
  down, so it never reads 80% before the ready state: 179 of 225 is
  79%.
- **Ready at 80%:** 180 of 225, 353 of 441. Below it the message is
  "Keep building."; at or above it, "Ready to create hints!".
- **Layout.** Preview toggle at the left, unchanged. At the right, on
  one line: the message, the bar, then "N% complete". Every element is
  vertically centered on the row's line, neat and even (the mockup's
  alignment isn't to be copied exactly). The row's background is the
  existing `bg-toggle-row`.
- **Text.** The message is `body-normal`, `primary`. The percentage is
  `body-small`, `muted`.
- **The bar** is 12px high and about 180px wide on a wide row. Its track
  is white with a thin border. The fill runs from 0 to the exact value:
  `gray-200` below 80%, `interactive-dark` at 80% and above. The 80–85%
  zone is an `orange` block drawn over the fill, so it always shows. No
  tick marks, no slider or other control.
- **Narrower rows.** The Preview toggle, the message and the percentage
  keep their size; free space goes first, then the bar shrinks, down to
  80px. Where even that doesn't fit, the message moves above the bar
  (the row grows taller there); if it still doesn't fit, the message's
  font gets smaller.
- **Encouragement, not a gate.** The zone is a convention, not a rule;
  80% is of all cells, not of white cells. Create Hints, its dialog, the
  phase change and grid checks are unchanged.

Proposed by the agent, approved by the human with the EPIC:

- **Progress isn't stored.** Derived from the grid on each render; no
  storage or server change.
- **Locked words** count like any other letters.
- **The bar's details:** the track's border 1px `gray-200`, square
  corners as mocked; the fill's width and color change at once, no
  animation.
- **An open rebus entry** when Preview is turned on behaves as today: it
  stays open and closes with Enter or Escape.
- **Accessibility:** the bar is a `progressbar` (`aria-valuenow` the
  rounded percentage, an accessible name such as "Grid completion"); the
  ready state is in the message's text, not only in color.
- **New semantic color tokens** for the track, fill, ready fill and
  zone, over the existing palette values; no new palette color.
- **The narrow layouts' breakpoints** and the smaller font are set in
  S2's specification from the measured widths of the message and the
  percentage, using an existing text style.

## Non-goals

- Anything with Preview off, in a mini or midi, in the hints phase,
  after publishing or in play.
- A second measure (share of white or playable cells), word count,
  density or other NYT rule checks.
- Tick marks, a slider or any way to set the value by hand.
- Gating Create Hints, moving to the hints phase automatically, or
  changing its dialog or checks.
- Changing how Preview derives black squares, or Locked words' behavior.
