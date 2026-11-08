# Epic: Build progress

**Draft, not yet approved by the human (2026-11-08).** Rewritten to
repo standards from an outside draft (below). The Open questions must be
settled, by interview, mockups or discussion, before the human approves
the EPIC and any story is written.

In the build phase, with Preview on, the toggle row shows how much of the
grid holds letters: "N% complete" and a slim bar marking the 80–85% range
that NYT-style grids conventionally reach. At 80% a "Ready to Create
Hints!" label appears over the bar. With Preview off, nothing changes.

## The human's request

Recorded as given (2026-11-08):

> The main idea is to add information to the UI that helps builders know
> when they have completed enough of the puzzle grid to consider it
> "done", according to standards used by the NY Times. [...] it's
> important that the UI changes affect only the UI when in preview mode.
> That is, we only see the percent complete information if the preview
> toggle is on.

The outside draft (`EPIC-crossword-build-progress.md`, 2026-11-06)
records the human's decisions from a mockup discussion with another
agent. In summary, as that agent recorded them:

- One horizontal bar in the toggle row, in the space Rebus otherwise
  uses, as in the agreed interactive mockup, not a taller or shorter
  redesign.
- "40% complete" (for example) to the left of the bar.
- The bar about 18px high, filling the row's free width, on a light,
  neutral track.
- A fixed 80–85% target zone in the track: about the share of white
  cells in a conventional NYT 15×15. It never moves.
- The fill light blue from the left, turning darker blue at 80%.
- At 80%, a bordered "Ready to Create Hints!" label centered over the
  bar, overlapping it, not beneath it (as in the human's wireframe).
- No 5% tick marks (an early mockup had them; the human removed them).
- Only cells holding letters count.
- The mockup's slider was for demonstration only.

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
  `PuzzleGridEditor.tsx`) is the grid's width (at most 700px), 40px high
  and 48px from 748px wide. In the build phase it holds the Preview
  toggle at the left and, at the right, Lock Word (21-S5, only where the
  grid has no room for the lock button, already hidden with Preview on)
  and Rebus (17-S10). The Rebus link is the way to open a rebus without a
  keyboard (Escape does it with one).
- **The hints phase's** toggle row holds Lock Grid Letters; a published
  puzzle's holds nothing in this row.
- **Sizes:** mini 5×5, midi 9×9, daily 15×15, Sunday 21×21.
- **Create Hints** (step 2) opens `EnterHintsDialog`; it has no
  fill-level check, and this epic adds none.
- **Blues** in the palette: `blue-bright` #4bc0ff, `blue-medium`
  #cfeeff, `blue-dull` #cadae2. Grays 200–700.
- [NYT reference](../../NYT-CROSSWORD-REFERENCE.md): black squares
  historically about 16% of the grid, i.e. about 84% white.

## Stories (proposed order)

1. **S1 The completion count:** a pure engine function giving a grid's
   lettered cells and total cells. `src/engine/**`: branch, PR and
   independent review.
2. **S2 The progress bar:** with Preview on in the build phase, the
   label, the bar, the target zone and the light fill take Rebus's
   place in the toggle row. Off the risk paths.
3. **S3 Ready to Create Hints:** at 80% the darker fill and the label
   over the bar; both go again below 80%. Off the risk paths.

S2 builds on S1, S3 on S2. Each story covers its own edit paths, widths
and accessibility in its acceptance, rather than a separate integration
story. Each checks its actual paths against CODE-REVIEW.

## Decisions

From the human (the request above and the outside draft):

- **Preview only.** The label, bar and milestone show only in the build
  phase with Preview on. With Preview off the toggle row is exactly as
  today. Not in the hints phase, a published puzzle or play.
- **Lettered cells over all cells.** Progress = 100 × lettered cells ÷
  all the grid's cells (225 for a 15×15), whatever Preview would show
  black. A rebus cell counts once. Example: 90 of 225 lettered is 40%.
- **Only letters move it.** Typing into an empty cell raises it, deleting
  a letter lowers it, overtyping a letter leaves it. Load, Reset Grid and
  every edit path recompute it from the grid. Toggling Preview never
  changes the grid or the count.
- **The bar** takes the place of the toggle row's right group: Preview
  toggle, then "N% complete", then the bar filling the rest of the row.
  About 18px high, a neutral track, a fixed 80–85% zone in a muted
  darker blue-gray, a light-blue fill from 0 to the exact value that
  covers the zone where it reaches it. No tick marks. No slider or other
  control.
- **The milestone at 80%,** by the exact ratio (180 of 225): the fill
  turns darker blue and "Ready to Create Hints!" appears, a small
  bordered label with a solid background, centered over the bar and
  overlapping it, never below it and never clipped. Below 80% both go.
- **Encouragement, not a gate.** The zone is a convention, not a rule;
  80% is of all cells, not of white cells. Create Hints, its dialog, the
  phase change and grid checks are unchanged.

Proposed by the agent, pending the human's approval with the EPIC:

- **Progress isn't stored.** Derived from the grid on each render; no
  storage or server change.
- **Locked words** count like any other letters.
- **The same zone and threshold for every size** (see Open questions).
- **Accessibility:** the bar is a `progressbar` with the percentage as
  its value and an accessible name; the ready state is in the label's
  text, not only in color.
- **Colors from existing tokens** where they fit (new semantic tokens
  over palette values, no new palette color unless the mockups need
  one).

## Open questions

For the human, before approval:

1. **Rebus with Preview on.** The bar takes Rebus's place, so a device
   without a keyboard can't open a rebus in Preview (Escape still works
   with one). Accept that, or keep Rebus beside the bar? And if a rebus
   entry is open when Preview is turned on, does it close?
2. **The display at 79.5–79.9%.** Rounding shows 179 of 225 (79.6%) as
   "80% complete" without the milestone. The agent suggests rounding
   down, so the label never reads 80% before the milestone shows.
3. **Other sizes.** The 80–85% zone describes a 15×15. Same zone and
   threshold for mini, midi and Sunday, or a different one (or none) for
   some sizes?
4. **Narrow screens.** The row can be under 320px wide, holding the
   toggle, the label, the bar and a "Ready to Create Hints!" label wider
   than a short bar. Shorten the label, wrap it, or let the bar go no
   shorter than some width?
5. **The look.** The agreed mockup isn't in the repo. Exact sizes, colors
   (which blues and grays), the label's border, radius and text style,
   and whether the fill or color change animates. Mockups would settle
   these.

## Non-goals

- Anything with Preview off, in the hints phase, after publishing or in
  play.
- A second measure (share of white or playable cells), word count,
  density or other NYT rule checks.
- Tick marks, a taller or redesigned bar, or the label below the bar.
- A slider or any way to set the value by hand.
- Gating Create Hints, moving to the hints phase automatically, or
  changing its dialog or checks.
- Changing how Preview derives black squares, or Locked words' behavior.
