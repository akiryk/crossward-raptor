# Epic: Building refinements

**Approved by the human 2026-11-04**, including the proposed details
in Decisions. Each story's specification still needs the human's
approval before freeze.

Two refinements to the build phase (the grid step, before Create Hints):
a way to clear the grid and start over, and an explanation of Preview's
red and gold cells right on the cells.

## The human's request (2026-11-04)

Recorded as given:

1. As a puzzle builder in the building phase, I want a way to clear the
   grid of all letters so I can start over again without having to
   manually delete every cell. I want a subtle link style button that
   says "Start Over". It should use the same text size as "Preview" or
   "Rebus". Rather than making it red or blue, though, I want it to be an
   alternate color — a gray. I think we already have a style that will
   work — maybe muted-gray? When a user clicks it, we should show a
   confirm dialog. Title: Clear Puzzle. Body: "Are you sure? This will
   remove every letter from the grid." Buttons: "Clear Puzzle" and
   "Cancel".
2. As a builder in the building phase who has toggled the preview button
   on, I want it to be more obvious what the colored cells mean so I can
   fix it. I want cells to have a tooltip sort of popover that appears on
   hover when you hover over the red or gold squares. For two letter
   words, the message should be "Consider avoiding two-letter words." For
   missing letters (red): "Filling in these cells will result in a
   symmetrical puzzle."

The human doesn't want a way to clear all hints, or to clear the grid in
the hints phase.

Added after S2 shipped (2026-11-04), recorded as given:

3. The tool tip works as planned, but now that i see it in action I
   realize there's a problem. Let's say you have two gold cells next to
   each other. If I hover over one of them, I see the tooltip for
   2-character words (consider avoiding them). If I then hover over the
   next cell, the tooltip flashed out of visibility and a new one appears
   located anchored to the new cell. This creates an awkward jankiness.
   I'd like to have the tooltip appear once and then remain in place as
   long as I hover over one of the gold cells. Same goes for red cells.

Added after S3 shipped (2026-11-04), recorded as given:

4. before closeout i have yet another tweak. I don't like the link to
   "Start over" up by the "rebus" button. It's conceptually completely
   unrelated. Let's move it to be right aligned just like rebus -- but
   under the grid. It should baseline align with the text in the
   color-key legend. Instead of "Start Over" change to say "Reset Grid."

## What the code does today

- The build phase's toggle row (`ToggleRow`, `BuilderSteps.tsx`; 17-S8)
  holds the Preview toggle at the left and the Rebus link at the right
  (`justify-between`). Both labels are `text-label` (14px) in
  `link-muted`.
- There is no "muted-gray" style. The grays for text are `subtle`
  (gray-600, #757575, the alternate button's text) and `muted` (40%
  black).
- Dialogs use `Modal` and `ModalActions` (confirm, then cancel), e.g.
  `EnterHintsDialog`.
- Preview (`mode="preview"`) colors a cell in a two-letter word
  `preview-cell-warning` (gold) and an empty cell whose symmetric
  counterpart holds a letter `preview-cell-error` (red). Gold wins when
  both apply. `PreviewLegend` under the grid names the marks present:
  "Avoid breaking radial symmetry" and "Avoid two-letter words" (14-S5).
- The app has no tooltip or popover component yet.

## Stories (proposed order)

1. **S1 Start Over:** the link, its confirm dialog and clearing the grid.
2. **S2 Preview cell tooltips:** the hover popover on red and gold cells.
3. **S3 The tooltip stays over a group** (added 2026-11-04, after S2): it
   stays put while the mouse moves over touching cells of its color.
4. **S4 Reset Grid under the grid** (added 2026-11-04, after S3): S1's
   link renamed and moved under the grid, on the color key's line.

S1 and S2 are independent; S3 builds on S2 and S4 on S1. All are
expected to stay in `src/components/grid/` (plus a small `ui/`
primitive for S2), off the CODE-REVIEW risk paths, so direct delivery
to `main`. Each story checks this against its actual paths.

## Decisions

From the human's request:

- **Build phase only.** Start Over and the tooltips appear only in the
  grid step. The hints phase and a published puzzle are unchanged.
- **Start Over** is a button styled as a link, "Start Over", `text-label`
  like Preview and Rebus, in a gray rather than blue or red.
- **The confirm dialog:** title "Clear Puzzle"; body "Are you sure? This
  will remove every letter from the grid."; confirm "Clear Puzzle",
  cancel "Cancel".
- **Tooltip text:** gold (two-letter word) "Consider avoiding two-letter
  words."; red (missing symmetric letter) "Filling in these cells will
  result in a symmetrical puzzle." A cell that's gold shows only the gold
  text, matching its color.
- **The tooltip shows on hover**, only in Preview, only over a red or
  gold cell.

Proposed by the agent, approved with the EPIC:

- **The gray is `subtle`** (#757575), the closest existing style.
  Hovering or focusing Start Over by keyboard turns it `primary`, over
  150ms like the other links. No new color style.
- **Placement:** in the toggle row's right group, after Rebus with a 20px
  gap, so it sits apart from the Preview toggle.
- **Clearing** empties every cell's letter and makes every cell white,
  keeping the grid's size and the title. It autosaves like any edit
  (no undo). The cursor returns to the first cell, Across. An open rebus
  entry closes. Preview stays as it was. Cancel changes nothing and
  returns focus to the grid.
- **An empty grid:** Start Over is still enabled; clearing an empty grid
  does nothing visible.
- **The tooltip's look:** a small dark bubble (`preview-cell-off`
  background, `inverse` `text-label`), above the cell and centered on it,
  with no delay and no arrow. Mouse hover only: touch and keyboard rely
  on the legend.
- **The legend stays** under the grid, unchanged. It covers touch
  devices, where there's no hover.

From the human's answers for S3 (2026-11-04):

- **The tooltip stays** above the first cell hovered while the mouse is
  over touching cells (sharing a side) of the same color; crossing the
  line between them never hides it. Onto a touching cell of the other
  color it moves there with that text, never hidden in between. Over an
  unmarked cell or off the grid it goes at once; a separate group gets
  its own.

From the human's request and answers for S4 (2026-11-04), superseding
S1's name, dialog words and placement above:

- **Reset Grid** replaces "Start Over" on the link, the dialog's title and
  its confirm button; the body is unchanged.
- **Under the grid**, right-aligned, its baseline the color key's text
  baseline. It's always there in the build phase, in the same spot with
  or without the key. Rebus goes back to the toggle row's right end.

## Non-goals

- Clearing hints, or clearing anything in the hints phase or after
  publishing.
- Undo of a clear.
- Changing Preview's colors, the rules that mark a cell, or the legend.
- Tooltips outside Preview, or on touch or keyboard focus.
