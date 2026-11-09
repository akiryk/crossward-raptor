# Epic: Build progress

**Approved by the human 2026-11-08**, including the agent's proposed
details under Decisions. Rewritten to repo standards from an outside
draft (below); the human answered its open questions and supplied a
mockup the same day. The human delegated each story's approval and
freeze to the orchestrating session (see
[HISTORY](HISTORY.md#orchestration)); the human does a visual check
before closeout. **Closed 2026-11-09**: S1–S6 done
([handoff](HANDOFF.md)).

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

The human's visual check of S2 (2026-11-08), as given (items 1–4 are
S3's, item 5 S4's):

> It looks good! A few changes:
> 1. Make the progress bar have a height of 16px rather than whatever it is today
> 2. Give the bar rounded corners like the preview toggle -- 20px should do it.
> 3. Make the light gray bar that fills as progress continues a bit darker. Use gray-500
> 4. Have the progress part of the bar animate in. That is, the gray part should start from 0 width and animate up to its correct width so we draw the user's eye. Once it reaches the target zone, it should transition to the blue-color (interactive-dark)
> 5. Add a tooltip that appears when user hovers over the progress bar. The tooltip should appear after a moment. What's typical? The tool tip appears over the red and orange cells in the grid right away. This feels too quick. We should create a single tooltip component that we can control the behavior for in one place so that app is consistent. This may require additional work if there are more than one tooltip already. For the tooltip above the progress bar, have the text say "Aim to use about 80-85% of the cells to make a standard puzzle" (I'm not sure about the 80-85 part; correct those numbers is necesssary).

The human's small changes before the final visual check (2026-11-08), as
given (S5; the screenshots are not kept):

> 1. When I turn preview on and off, I don't want the cells to just snap to black or to gray -- I want there to be a transition over, say half a second or so (something that feels natural but quick)
>
> 2. I want to change the rule about what we choose to highlight when a cell is selected during the build phase. Currently, if I click on a cell inside a word (meaning, inside a cell that's white either because it has a letter or because it *should* have a letter for symmetry) AND my direction mode aligns with the word's direction (e.g. they are both horizontal) THEN we highlight the word by making its cells blue-medium. This is great. Here is an example screenshot. [screenshot]. Now, imagine I click on the cell between CRAP and APE while remaining in horizontal mode. This is what we see: [screenshot]. It's not as helpful as it could be, because -- were I to add a letter to this cell -- both CRAP and APE would be included. Therefore, we should highlight both of those words in blue. Another example: [screenshot]. I've selected the cell below SIR while in vertical mode. If I add a ltter, the word SIR would be affected. Therefore, we should highlight the word SIR in medium blue. Does this provide enough for you to come up with a rule?

These reach beyond the epic's "Preview only" scope (the word highlight is
Preview off); the human asked for them within this epic.

The human's changes after the visual check of S3–S5 (2026-11-08, S6):

1. **The lock button's tooltip names the word:** "Lock ARRAY" on an
   unlocked word, "Unlock ARRAY" on a locked one, where ARRAY is the
   word.
2. **The lock button appears after 2 seconds,** not 3.
3. **Hovering the lock button outlines its word** in a 2px black line,
   as hovering the word's tick mark does.

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

3. **S3 The bar's look** (from the human's visual check of S2): 16px,
   20px corners, a gray-500 fill, the fill animating in. Off the risk
   paths.
4. **S4 One tooltip behavior:** every tooltip's timing in one place (a
   500ms hover delay, a 300ms skip delay), the Preview cell and lock
   button tooltips moved onto it, and a tooltip over the bar. Off the
   risk paths.

5. **S5 Preview's fade and the would-be word** (from the human's small
   changes): Preview on and off fade the grid's colors over 500ms; in the
   build phase with Preview off, the cursor's word is the word its cell
   would belong to if it held a letter. Off the risk paths.

6. **S6 The lock button's word** (from the human's changes after the
   visual check of S3–S5): the lock button's tooltip names the word
   ("Lock ARRAY", "Unlock ARRAY"), the button appears after 2 seconds
   instead of 3, and hovering it outlines the word as the tick's hover
   does. Off the risk paths.

S2 builds on S1, S3 on S2, S4 on S3, S5 on S4 (22-S4-13b) and S6 on
S4 (it amends 22-S4's specs). S2 covers its own edit paths, widths and accessibility
in its acceptance. Each checks its actual paths against CODE-REVIEW.

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
- **The bar** is 16px high (S3; was 12px) with 20px corners (S3), about
  180px wide on a wide row. Its track is white with a thin border. The
  fill runs from 0 to the exact value: `gray-500` (S3; was `gray-200`)
  below 80%, `interactive-dark` at 80% and above. The 80–85% zone is an
  `orange` block drawn over the fill, so it always shows. No tick marks,
  no slider or other control.
- **The fill animates in** (S3): from 0 width to its value when the
  progress appears, turning `interactive-dark` once it reaches the zone.
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
- **The bar's details:** the track's border 1px `gray-200`. (Square
  corners and no animation were superseded by the human's visual check of
  S2; S3 sets 20px corners, the fill and zone clipped to them, and a
  700ms ease-out animation of the fill's width on appearing and on every
  change, its color following the drawn width at 80%, the texts at once,
  none with reduced motion.)
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

From the human's visual check of S2 (2026-11-08), with the
orchestrator's details:

- **One tooltip behavior.** Every tooltip's delay, skip delay,
  placement and look are set in one shared module
  (`src/components/ui/`); no other code keeps tooltip timers or
  delays. Every tooltip shows after 500ms of mouse hover (was at once
  for Preview's red and gold cells, after 1s for the lock button);
  while one shows, or within 300ms of one hiding, the next shows at
  once; each hides at once when the mouse leaves. Mouse only, as before.
  This supersedes Epic 20 S2's "no hover delay" and Epic 21 S4's
  1-second delay.
- **The bar's tooltip:** "Aim to use about 80–85% of the cells to make
  a standard puzzle." on mouse hover over the bar, above it. The bar
  stays out of the Tab order; no `aria-describedby`.

From the human's small changes (2026-11-08), with the orchestrator's
details (S5):

- **Preview fades.** Turning Preview on or off moves the grid's colors
  (cells, letters whose color changes, the lines) to the new ones over
  500ms, ease-in-out; every other change stays instant outside that
  window (one inside it may ease with the fade); none with reduced
  motion.
- **The would-be word.** In the build phase with Preview off, the cursor's
  word is the word its cell would belong to, in its direction, if it held
  a letter: on an off cell between or beside words, those words and the
  cell. Shown as any word; a cell no letter touches that way keeps the
  no-word look. Where a letter can't be typed (a locked word's letter or
  end cell), the word is today's: on an end cell, none (the orchestrator's
  choice, for the visual check). Preview, the hints phase and locks are
  unchanged.

From the human's changes after the visual check (S6), with the
orchestrator's details:

- **The lock button's tooltip names its word:** "Lock " or "Unlock " and
  the word's letters, uppercase, a rebus cell's letters all included
  ("Lock PARTY"); no closing period on either (the orchestrator's choice,
  for the visual check). The word is the button's word: the hovered
  word's when the hover's button shows (Epic 21 S10, S13), not the
  cursor's. Timing, placement and look as S4; the button's
  accessible name stays "Lock word" / "Unlock word".
- **2 seconds** (was 3, Epic 21 S16) before the button beside an unlocked
  word shows, for the cursor and for the mouse resting on a word: the one
  wait. Everything shown at once stays at once.
- **The mouse on the button outlines its word** with the tick hover's
  2px black outline around its letters (Epic 21 S15, S17): at once, not
  after the tooltip's delay; while the mouse is on the button, through a
  click that locks or unlocks it; gone at once when the mouse leaves or
  the button goes. One outline per word where a tick hover already
  outlines it. Mouse only: not for keyboard focus, touch or the toggle
  row's Lock Word.

## Non-goals

- Anything with Preview off, in a mini or midi, in the hints phase,
  after publishing or in play, except S5 (the fade and the build-phase
  word highlight, at every size) and S6 (the lock button).
- A second measure (share of white or playable cells), word count,
  density or other NYT rule checks.
- Tick marks, a slider or any way to set the value by hand.
- Gating Create Hints, moving to the hints phase automatically, or
  changing its dialog or checks.
- Changing how Preview derives black squares, or Locked words' behavior
  beyond S6's (the lock button's tooltip text, its 2-second wait and its
  hover outline): what can lock, the button's name, look and placement,
  the ticks and the toggle row's Lock Word stay.
- New tooltips other than the bar's; changing tooltip texts other than
  the lock button's (S6); touch, keyboard or focus tooltips; changing the
  tooltip's look.
