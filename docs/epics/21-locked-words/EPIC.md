# Epic: Locked words

**Decisions agreed with the human in an interview 2026-11-06** (recorded
below). **The human approved the written EPIC 2026-11-06.** S1–S11 are done;
the human's visual testing of S8–S11 (2026-11-07) added S12 and S13 (see
"Changes from the human's visual testing (2026-11-07)").

In the build phase, a builder can lock a finished word so its letters
can't be changed by accident while the rest of the grid is filled around
it (theme entries as a fixed armature). A first story makes the build
phase's highlight show which word the cursor is in, which locking relies
on.

## The human's request (2026-11-06)

Recorded as given (screenshots described in brackets):

> Enable puzzle builders to "lock" words in the grid as they form them.
> Let's say I'm making a puzzle whose theme is bird names. I come up with
> some names I like and then put them around the grid with the intention
> of filling in the remaining cells by using these bird names as a fixed
> armature. So the name KOOKABURRA should remain as it is; it shouldnt be
> possible for me to change a letter (which in practice happens a lot).
> If KOOKABURRA is an across word and I'm working on a down work starting
> with the second K, I might type KIND but then use the delete key to undo
> what I just did. If I'm not careful, I might delete the K as well. Or I
> might use the up arrow to go back and re-write the word but mistype and
> overwrite the K with M to write MIND instead of KIND. You get the
> picture. What I want is for locked words to prevent this. I could land
> on the letter cell with K but I wouldn't be able to change it.
>
> 1. To lock a word, I suggest selecting the word by clicking on any of
>    its letters while in the correct orientation (i.e. horizontal if the
>    word is an across word). Further, the word can only be selected for
>    locking if it is complete -- that is, a row of 4 empty cells can't be
>    selected for locking.
> 2. When a word is selected for locking, a "Lock Word" button on the UI
>    is enabled. My thinking on this is that it would work like this: user
>    selects a cell in a word. The cells in the word get highlighted in
>    light blue (this happens today). If the builder/user remains hovering
>    over the word for more than a second, a small lock/unlock icon button
>    appears to the right of the last letter for across words and just
>    below the last latter on down words. In addition, the word gets
>    outlined in a subtle way: just to a slightly darker gray (gray-500)
>    rather than the usual gray-400. I don't have a lock/unlock icon to
>    give you, so I'd like the story to make an svg or help me find one we
>    can use. [Screenshot: TANGENT highlighted, a gray rounded square with
>    a padlock just right of the T.] In this example, the icon is in the
>    locked state; that's a mistake, it should be in the unlocked state.
>    If a user hovers over that button, its colors change from background
>    of gray-500 to background of gray-700 and the icon fill colors become
>    white. A few other design details. The icon is in a small square
>    that's 66.66% of the height and width of the grid cell; it's
>    vertically centered against the cell for across words and
>    horizontally centereed next to down words (as in the screenhsot); it
>    has rounded corners on the far side of the grid cell and square
>    corners on the near side; the rounded corners use a radius of 4px.
> 3. If user hovers over the lock/unlock icon for a second or so, we show
>    a tooltip that says (for an unlocked word) "Lock this word so you
>    don't accidentally change it". For a locked word, it can just say
>    "Enable changing this word"
> 4. When a word is locked, the cells look the same as before, but the
>    letters display using gray-500.
> 5. If I put cursor on a cell/letter in a locked word, we should show the
>    unlock icon more quickly than we do for an unlocked word, maybe no
>    delay at all.

Added during the interview, as given:

> [Highlight] In this example [NOSYPARKER in a row: its letters
> blue-medium, the empty cells after it dull blue], NOSYPARKER is a "word"
> and is selected [...]. The remaining cells [...] are not part of the
> word. [A second screenshot: the cursor on an empty cell after ASNOT.]
> It's not selected because the selected cell is outside of the word.

> [End cells] When I'm selecting a word and the lock icon appears, we
> outline not just the cells with letters but the adjacent cell(s) too
> [screenshot: the outline takes in the empty cell before TANGENT]. Once a
> word is locked, we indicate the adjacent cell(s) are locked by
> maintaining that outline (gray-500, 1px stroke) and also having a small
> triangular tick mark in the same color as the stroke [screenshot:
> ABRAHAM at the grid's left edge, outlined with the empty cell after M,
> which has a small gray triangle in its top-right corner].

> [Reset] I'd like to have a variation of this popup for the case when a
> builder clicks reset on a grid that includes 1 or more locked words. In
> that case, the dialog should give one additional option. Change the body
> text in dialog to "Do you want locked words to remain or would you
> rather clear every cell?" Then have three buttons. 1. "Keep Locked
> Words" 2. "Clear Every Cell" 3. "Cancel". Clicking the first button
> would leave cells in locked words unchanged -- the builder would reset
> only cells in non-locked words. [Later: "Let's make Clear Every Cell
> button first and primary. The others are alt."]

> [Small screens] On smaller screens, let's replace the adjacent
> icon/button with a button that goes beside the rebus button. That button
> should say locked or unlocked depending on what's selected. If no word
> is selected, the button should use the muted gray color. Otherwise, it
> should be blue text, like rebus.

> [Preview] In preview mode, hide the lock icons and outline and tick
> mark. The idea is to show what the puzzle will look like more or less at
> the end state of play, so I don't want visual noise.

> [Highlight, raised as related] I'm in down mode and I've selected a cell
> in a column that includes two words and one letter that's part of an
> across word [DORY, an empty cell, ORATION, two empty cells, V]. It's
> confusing to have the word DORY and the letter V highlighted as though
> part of the selected word. [With the cursor on V] it's perhaps even more
> confusing, since both DORY and ORATION are highlighted. [With the cursor
> on an empty cell, DORY, ORATION and V are all highlighted.] I think the
> solution to this is to highlight a word using blue-medium only if one
> of the word's cells is selected. Otherwise, the color should be the dull
> blue color -- the one we currently use only on cells that are part of
> the selected row/column but are not part of a word. In the third
> example, therefore, we'd only see two colors for the selected column's
> cells: yellow and dull blue.

## What the code does today

- **The build phase's grid is all white cells.** With Preview off there
  are no black cells. Empty cells show `build-cell-off` (gray-200),
  lettered cells `build-cell-on` (white). Black cells come from
  `intendedGeometry` in Preview and at Create Hints.
- **The highlight** spans the cursor's whole row or column (its "slot",
  edge to edge). `cellAppearance` (`src/lib/cell-appearance.ts`) paints
  every lettered cell in it `slot-letter` (`build-cell-selected-row-on`,
  blue-medium) and every empty one `slot` (`…-row-off`, dull blue); the
  cursor is `selected` (yellow).
- **Keys** (`handleGridKeyDown`, `PuzzleGridEditor.tsx`): a letter calls
  the engine's `place` (overtype, advance). Backspace/Delete call
  `deleteAt`, which clears the cursor's letter or, on an empty cell,
  moves back one and clears that. Escape or the Rebus link opens a rebus
  entry on the cursor's cell.
- **Storage:** the grid is saved as `SerializedGrid` JSON
  (`src/lib/puzzle-storage.ts`) through `saveGrid`
  (`src/app/puzzles/actions.ts`) into `Puzzle.grid`, with a debounced
  autosave. There is no per-cell or per-word state beyond the letter.
- **Already called "lock":** the hints phase's "Lock Grid Letters" toggle
  (`lock-letters-toggle`, `isLettersLocked`), which freezes the whole grid
  there, and the hints phase's `locked-letter` cell appearance. Neither
  is this epic's word lock.
- **Palette:** gray-400 #babcbe (the build cell border), gray-500
  #8b909a, gray-700 #14151b (nearly black; Preview's black cells).
- **Tooltip** (`src/components/ui/Tooltip.tsx`, 20-S2) is the app's one
  tooltip: a dark bubble above its anchor. No icon library is installed.
- **Reset Grid** (`StartOverDialog`, 20-S1/S4) asks once, with "Reset
  Grid" and "Cancel", and clears every cell.
- The toggle row holds Preview at the left and Rebus at the right end.
  The grid is at most 700px wide (`GRID_MAX_PX`), shrinking only when the
  window is too narrow for that.

## Stories (proposed order)

1. **[S1 The word highlight](stories/21-S1-word-highlight.md):** only the
   cursor's word is blue-medium; the rest of its row or column is dull
   blue.
2. **[S2 Lock and unlock a word](stories/21-S2-lock-a-word.md):** the
   button beside the word, the outline and tick marks, gray letters, and
   locks saved with the puzzle. Touches stored puzzle data: branch, PR and
   independent review.
3. **[S3 Locked cells hold](stories/21-S3-locked-cells-hold.md):**
   typing, Backspace/Delete and Rebus can't change a locked word or its
   end cells.
4. **[S4 The lock button's tooltip](stories/21-S4-lock-tooltip.md).**
5. **[S5 Lock Word in the toggle row](stories/21-S5-toggle-row-lock.md)**
   when the grid has shrunk.
6. **[S6 Reset Grid with locked words](stories/21-S6-reset-with-locks.md):**
   the three-button dialog.

S7–S11 followed from the human's 2026-11-06 visual testing (HANDOFF).
From the 2026-11-07 visual testing:

12. **[S12 The button before the word](stories/21-S12-button-before-word.md):**
    left of an across word, above a down word, with room made for it.
13. **[S13 Tick hover shows the button](stories/21-S13-tick-hover-button.md).**

Between S2 and S3, locks show but don't yet protect; both ship before the
epic closes. Each story checks its actual paths against CODE-REVIEW. Only
S2 is expected on a risk path.

## Decisions

From the human's request and interview answers (2026-11-06):

**The word**

- **A word in the build phase** (Preview off) is the unbroken run of
  lettered cells through the cursor's cell, in the cursor's direction,
  ended by an empty cell or the grid's edge. With the cursor on an empty
  cell there's no word.
- **The highlight (S1):** the cursor's word is blue-medium. Every other
  cell in its row or column is dull blue, lettered or not, symmetric
  hints included (the human, at approval). The cursor stays yellow. A run of 2 or more letters counts as a word for the
  highlight; a lone letter doesn't. Preview and the hints phase are
  unchanged.
- **A lockable word** has at least **3** letters.
- **End cells:** the empty cell just before and just after a word, in its
  direction (none where the word touches the grid's edge).

**Locking**

- **The button beside the word** is the lock control. It is icon-only,
  named "Lock word" / "Unlock word" for assistive technology, with no
  separate toolbar button and no keyboard shortcut. It shows the **open**
  padlock on an unlocked word and the **closed** one on a locked word.
- **When it appears:** the cursor has stayed in an unlocked lockable word
  for 1 second (the timer restarts on every key or cursor move), or at
  once when the cursor is in a locked word. Mouse, keyboard and touch
  all work, since it follows the cursor. It and the timer go when the
  cursor leaves the word or the grid loses focus.
- **Look:** a square ⅔ of a cell's width and height, at most 32px (the
  human, at S2's approval). It sits just past the last letter: right of
  it and vertically centered for across, below it and horizontally
  centered for down. Its corners are square on the
  side touching the cell and rounded 4px on the far side. At rest it's a
  gray-500 background with a white icon; on hover, gray-700 with white.
- **The icon:** Heroicons solid `lock-closed` / `lock-open` (MIT), copied
  in as SVG, with no new dependency.
- **The outline:** 1px gray-500 around the word's letters and its end
  cells, instead of the usual gray-400. For an unlocked word it shows
  with the button. For a locked word it is **always** shown, wherever the
  cursor is. Crossing locked words' outlines simply overlap.
- **Tick marks:** each end cell of a locked word has a small filled
  gray-500 right triangle in its top-right corner, its two sides ¼ of
  the cell. The corner is the same for both ends and both directions.
- **Locked letters** show gray-500, including inside the blue highlight.
- **Using it:** clicking or tapping toggles the lock. Keyboard focus
  stays on the grid and the button stays, in its new state. By keyboard
  it's the next Tab stop after the grid while visible, and Enter or Space
  activates it.
- **Crossing words:** a cell is locked if any locked word contains it.
  Unlocking one word leaves a shared letter locked through the other.
- **Saved with the puzzle:** locks survive reloads and other devices.
  Puzzles saved before this epic load with no locks.

**Protection (S3)**

- **Typing** on a locked letter or a locked word's end cell changes
  nothing, and the cursor moves on as if it had typed. KIND typed down
  from KOOKABURRA's locked K gives K-I-N-D, and so does MIND.
- **Backspace and Delete** never clear a locked letter or end cell. On
  one, the cursor moves back a cell and clears nothing. Moving back onto
  one lands there and clears nothing.
- **Rebus** is disabled on a locked letter or end cell, both the link and
  Escape.

**Tooltip (S4)**

- After about 1 second of mouse hover over the button: "Lock this word so
  you don't accidentally change it" for an unlocked word, "Enable
  changing this word" for a locked one. It uses the existing Tooltip.
  Mouse only.

**Small screens (S5)**

- **When:** whenever the grid is narrower than its full 700px. Otherwise
  the button beside the word is used.
- **What:** a text button in the toggle row, left of Rebus with 20px
  between them, in Rebus's `text-label` style. It reads **"Lock Word" /
  "Unlock Word"** and is blue (like Rebus) whenever the cursor is in a
  lockable or locked word, with **no** delay. Otherwise it's muted gray,
  disabled and reads "Lock Word". The outline still follows the 1-second
  rule. A tap doesn't take focus from the grid. It has no tooltip, and
  the button beside the word doesn't appear.

**Reset Grid (S6)**

- With no locked words, today's dialog is unchanged.
- With one or more locked words, the title is still "Reset Grid" and the
  body reads "Do you want locked words to remain or would you rather
  clear every cell?". The buttons are **Clear Every Cell** (first,
  primary), **Keep Locked Words** and **Cancel** (both alternate). They
  stack if they don't fit on one line.
- **Clear Every Cell** clears everything and removes every lock.
  **Keep Locked Words** clears every cell outside a locked word, and those
  words stay locked. Either way the cursor goes to the first cell,
  Across, as today.

**Where it applies**

- **The build phase only.** With **Preview on**, the button (beside the
  word and in the toggle row), outline and tick marks are hidden, and
  locked letters show in normal black, so the grid looks like the
  finished puzzle. Locking and unlocking aren't possible there, but
  locked letters and end cells are still protected. A Preview-red end
  cell stays red.
- **The hints phase ignores word locks:** no button, outline, tick marks
  or gray letters. Its existing "Lock Grid Letters" is unchanged. Play is
  untouched.

## Changes from the human's visual testing (2026-11-06)

The human's findings after S1–S7, and their answers, recorded as given or
decided. They amend the Decisions above where they differ. Stories S8+
carry them.

> 5. When I select a cell in a word, the other cells in the word should
> be highlighted with blue-medium. [...] I want to include contiguous
> white cells in the "word" whether or not they have a letter. [...] Let's
> say I have a row of cells like this (X = a cell that would be black in
> preview; * = a cell that would be red in preview; a letter is a letter
> cell): X X X B I R D * * X X S O Y. [...] put focus on the cell with the
> letter Y. In that case, the cells with S and O should get the blue
> highlight treatment; all other cells would get the dull color. [...] put
> the cursor on the cell with B. I want the cells with I, R, D, and the
> two contiguous * cells to get the blue highlight. The reason is that I
> need to fill in those star cells in order to achieve symmetry.
>
> 6. [...] when the builder hovers/mouses over the triangle: the locked
> word cells should darken by a small amount, say 15%.
>
> 7. Don't let users lock incomplete words. In the example above, if I
> clicked on B, I, R, D, or one of the stars, I would not get a "lock"
> button or icon. Not until I completed the word.
>
> 8. We made the grid larger (from 620px to 700). The intention was to
> make Sunday crossward puzzles larger [...] 620px is just fine for daily,
> mini, and midi puzzles. [...] 620px not 700px for anything smaller than
> the Sunday version. Note that the control bar with the preview toggle
> and rebus buttons needs to be the same size as the grid. This rule
> applies to build, hint, and play phases.

- **The word (amends "A word in the build phase"):** the unbroken run
  of cells through the cursor that are not black in Preview's geometry
  (`intendedGeometry`), lettered or not, in the cursor's direction. A
  Preview-red cell is part of it. The cursor on a Preview-red cell
  selects its word too (the human chose this).
- **Lockable (amends "A lockable word"):** a complete word, every cell
  lettered, of at least 3 letters.
- **Mouse hover (item 2; adds to "When it appears"):** resting the mouse
  over a word for 1 second shows its button and outline. The word is the
  one in the cursor's direction through the hovered cell. Hover wins:
  one button at a time, the hovered word's replacing the cursor word's
  until the mouse leaves (the word or its button); then the cursor rules
  return. Clicking it toggles the hovered word without moving the
  cursor. It works whether or not the grid has focus (build phase,
  Preview off).
- **Tick hover (item 6):** hovering a tick mark darkens every cell of
  each locked word ending at that cell by about 15%, both words where
  two share it.
- **Grid size (item 8):** 620px for mini, midi and daily; 700px for
  Sunday only, in build, hints and play. The toggle row matches the
  grid's width. S5's "full width" becomes the puzzle's own full width.
  The page's layout breakpoints stay as they are for every size (the
  human). Below a 636px window a 620px grid shrinks with the window
  (window less 16px), as a 700px one does below 716px (the human).
- **Items 1, 3, 4** (toggle-row Lock Word on desktop, no button beside
  the word, label not flipping): not reproduced at 1280–1920px or 700px
  in the production test build, and on the human's retest on current code
  (dev server restarted) all three behaved as specified. Stale code; no
  change. The human also noted the tooltip doesn't show on keyboard
  focus; S4 specifies mouse only.

## Changes from the human's visual testing (2026-11-07)

The human's findings after S8–S11, and their answers, recorded as given.
They amend the Decisions above where they differ. S12 and S13 carry them.

> S11: the tick's whole top-right square counts as the hover area, not
> just the triangle. This works; however, I'd like the lock/unlock button
> to appear also, not just for the word cells to get darker. [...] I
> hover over the triangle or its cell. A moment later, both the cells in
> the word should darken AND the unlock icon should appear and remain up
> as it does if I click on a cell in the word. The idea is I should be
> able to hover over the triangle to get the icon to appear so that I can
> unlock the word.
>
> [...] as I type words from left to right or top to bottom, I
> occasionally click the lock button without meaning to -- because it
> appears in the direction I'm typing. We should have the icon appear on
> the opposite side of the word -- on the top for down words and on the
> left for across words.

- **The button's side (amends "Look"):** the button sits just before
  the word's first letter: left of it for across, above it for down.
  Its square corners face the word. For a word at the grid's left or top
  edge it sits outside the grid, as today's does at the right and bottom.
  The page makes room for it rather than letting it be cut off or cover
  the toggle row (the human: "If we need to add more margin, add more
  margin"; then "full room, amend thresholds"): at least 36px left of
  the grid wherever the button shows, and 36px between the toggle row
  and the grid. Layout thresholds and frozen tests that move with it are
  amended in S12.
- **Tick hover shows the button (amends "Tick hover (item 6)"):** the
  hover area is the whole ticked end cell. The darkening still shows at
  once. After a second of hover the button shows too, for the locked
  word in the cursor's direction where the cell ends two. It stays while
  the mouse is on that cell, the word's cells or the button, and goes when
  the mouse moves elsewhere (the human chose each of these).
- **S8–S10:** the human reported no other findings.

## Non-goals

- Locking single cells, black squares, or words shorter than 3 letters.
- Locking or unlocking with Preview on, in the hints phase or once
  published.
- A keyboard shortcut, a "lock all" or "unlock all", or a list of locked
  words.
- Changing the hints phase's "Lock Grid Letters".
- Undo of a reset.
- Changing the highlight in Preview, the hints phase or play.
