# Story S5 — Play, narrow

Below a 1290px window, play gives up its title, its controls and its
hint lists. Only the masthead stays above a centered 560px grid, and
under the grid the play hint bar shows one hint at a time: the hint of
the word at the cursor, centered in a blue-medium bar with a 4px rule
along its top and arrows to the previous and next word. From 1290px up,
play is as in S2.

**Status: done** (2026-10-29). Approved *(human: "I approve S5")*. The
narrow-play mockup isn't in the repo, so the bar's measurements, what
shows above the grid, the spacing, the style's name and the arrows were
proposed; the human accepted all five proposals, the bar emptying when
the grid loses focus *(human, 2026-10-29)*. The spec file and amendments
are written and discriminate (below). Frozen in `6f91950`.
**Implemented** on `main`: `npm run verify` exit 0 (600 Vitest tests),
full `npm run test:e2e` 741 passed. The human's visual check passed
2026-10-29 *(human)*: **done**.

**Blast radius: small.** The client components `PlayPuzzle`, a new
`PlayHintBar`, and `HintBox` (its arrow shared, not changed); one
color style in `globals.css`; the style guide's catalog and a new sample.
No server, schema, engine or risk path, so delivery is direct on `main`
under CODE-REVIEW.

## Decisions

Inspected `PlayPuzzle` (its `lg` grid, `selectedKey`, `handleHintClick`,
the status messages, the lock), `ProminentHint`, `PlayerHints`,
`PlayReset`, `Masthead`, S4's `HintBox` and `hint-order`, the color
styles and their frozen lists (`globals-css.test.ts`,
`color-tokens.spec.ts`), `play-source.test.ts`, and every frozen spec
that opens play. All of them open play at 1440px or wider; none sees play
below 1290px.

### The threshold _(human, the epic's Decisions)_

- **Narrow below 1242px of room in play**, a 1290px window (the page's
  24px padding on each side), measured with a container query on play's
  content, as S3 does for the builder. It replaces play's `lg` (1024px)
  breakpoint: today a 1024–1289px window shows the wide arrangement and a
  narrower one stacks the lists under the grid; both become narrow.
- From 1290px up, S2's play holds unchanged: the title, the controls
  row, the Prominent Hint above the grid and the Player Hints beside it.
- Both arrangements are rendered and the container query hides one, as
  in S3 and S4, so the window can be resized freely.

### Above the grid _(human, the epic's Decisions)_

- **Only the masthead.** The title, "Reset puzzle" (the builder's
  shortcut) and "Puzzle options" don't show, so a reset isn't available
  narrow. The masthead is unchanged: its logo links home (the way back to
  the puzzles) and Sign out stays at its right.
- The grid is 24px under the masthead (the page's padding) and centered
  in play's width *(approved, question 3)*.
- **Messages still show when they occur** *(the epic's proposed
  detail, approved, question 2)*: "Starting your puzzle…", the start
  error and its Retry, a failed save or completion check and its Retry, the local-save
  warning, and the completed mark and message. They stack above the
  grid, at its width, 16px above it. The routine "Waiting to save…",
  "Saving…" and "Saved" don't show narrow.
- The incorrect and completion dialogs and the confetti are unchanged.

### The play hint bar _(human; measurements approved, question 1)_

- **Under the grid**, 0px from it, the grid's width.
- **The rule:** a 4px `hint-rule` bar along its top, S4's style. No
  other outline.
- **The fill:** blue-medium, a new color style `play-hint-bar` *(name
  approved, question 4)*. Play's other blue-medium surfaces have their
  own styles (`play-cell-selected-row`), and the builder's
  `hint-box-input` is the Hint Box's, so the bar takes its own.
- **Inside**, one row: the left arrow 12px from the bar's left, the
  hint, the right arrow 12px from its right; the hint has 12px to each
  arrow. 48px tall with the rule; a hint too long for one line wraps and
  the bar grows, the arrows staying vertically centered.
- **The hint** is `body-large`, `primary`, centered between the arrows,
  with no number or direction *(human)*.
- **The arrows** are the Hint Box's: the same inline SVG, `primary`, in
  24px buttons named "Previous word" and "Next word", with the focus
  ring. The SVG moves to a shared component both use; the Hint Box looks
  and behaves as before.

### Which hint it shows _(human; the empty bar approved, question 5)_

- **The word at the cursor in the cursor's direction**, the word the
  Prominent Hint shows wide (the cursor in Down on a cell of 7 Down
  shows 7 Down's hint) *(human)*. Clicking a cell, typing, the arrow
  keys and toggling direction all move it, as they move the Prominent
  Hint.
- **With no word selected** the bar keeps its height and shows no hint:
  on load (nothing has focus, 14-S7), when the grid loses focus, on a
  cell with no word in the cursor's direction, and once the puzzle is
  complete. This is the Prominent Hint's rule (14-S7-2); the bar and the
  grid's blue word then always agree.

### The arrows _(human; their effect approved, question 5)_

- **Order** *(human)*: S4's, from `hintOrder` in `src/lib/hint-order.ts`
  unchanged: every Across word by number, then every Down word, wrapping
  at both ends.
- **An arrow selects its word as a click on a Player Hint does**
  (14-S7): the cursor goes to the word's first empty cell, or its first
  cell when the word is full, in the word's direction, and focus returns
  to the grid, so typing fills the word and the bar shows its hint.
- The step is from the cursor's word, even though the click on the arrow
  took focus from the grid. With no cursor yet, or no word at it, Next
  goes to the first Across word and Previous to the last Down word.
- **Disabled while play isn't editable**: while starting or after a start
  error, while a full grid is being checked, while the reset dialog is
  open, and once the puzzle is complete. A Player Hint click does nothing
  in the same states today.

### The style guide _(human)_

- A new `sg-play-hint-bar` section: the bar at 560px with a sample hint
  and both arrows.
- The color catalog gains `play-hint-bar`.

### Not changed

- Wide play (S2) and its tests; the grid's look, the cursor, keyboard
  entry, saving, completion, reset and its dialog, the dialogs; the
  builder and its Hint Box (the shared arrow aside); the engine
  (`src/engine/**`).

## Non-goals

- The grid shrinking below 608px, and the bar's look there beyond not
  overflowing (S6).
- Any narrow way to reset or see the title (other links or controls may
  come later, outside this epic) *(human)*.
- Touch-specific input, and keyboard shortcuts for the arrows (Tab and
  Enter or Space on the buttons only).
- Changing the Prominent Hint's or Player Hints' look or behavior.

## Questions for the human

All answered *(human, 2026-10-29: "I accept all your suggestions")*:

1. **The bar's measurements:** as proposed from the Hint Box: 48px tall
   with the 4px rule, the arrows 12px from the sides, 12px between the
   arrows and the hint, the hint in `body-large`.
2. **What shows above the grid:** as proposed: only messages that need
   attention, 16px above the grid; "Waiting to save…", "Saving…" and
   "Saved" hidden narrow.
3. **Spacing:** as proposed: the grid 24px under the masthead, the bar
   directly under the grid.
4. **The new style's name:** `play-hint-bar` (blue-medium).
5. **Which hint and the arrows:** the bar empties when the grid loses
   focus (not keeping the last word's hint), and the arrows work as
   proposed *(human)*.

## Retired and amended acceptance

None retire: every frozen spec opens play at 1440px or wider, where play
is unchanged. Amended in the freeze commit:

- `src/app/globals-css.test.ts` and `e2e/color-tokens.spec.ts`: the
  styles lists gain `play-hint-bar` (blue-medium). With F1-4's catalog
  check, this also requires the catalog's `play-hint-bar` swatch.
- `src/components/play/play-source.test.ts`: `PLAY_FILES` gains
  `components/play/PlayHintBar.tsx`, so the bar paints only through the
  redesign's tokens like the rest of play.

## Acceptance

`e2e/narrow-play.spec.ts` (new), 21 cases, on a filled 5×5 with a hint
for every word (1 and 6–9 Across, 1–5 Down) unless named. The bar is
`play-hint-bar`, its hint `play-hint-bar-text`:

- **15-S5-1 the threshold (3):** at 1289 and 1024px the title, controls
  (Puzzle options and the builder's Reset), Prominent Hint and Player
  Hints hidden and the bar under the grid; at 1290px those visible and
  no bar.
- **15-S5-2 above the grid (2):** at 1024 and 768px, the masthead's logo
  link and Sign out, the grid 24px under the masthead, 560px and centered
  in play's width; no "Saved", "Saving…" or "Waiting to save…".
- **15-S5-3 messages (2):** at 768px, a failed save's alert 16px above
  the grid and within its width, and its Retry saves and clears it; a
  complete puzzle's mark and message 16px above the grid.
- **15-S5-4 the bar (2):** at 768px, directly under the grid at its
  width, 48px tall, a 4px gray-700 top and no other border, filled
  blue-medium; the 24px arrows 12px from its sides and vertically
  centered under the rule. A long hint wraps: the bar grows, the arrows
  stay centered and the hint stays inside.
- **15-S5-5 the hint (2):** after clicking 1 Across, the bar's text is
  exactly its hint, in `body-large` `primary`, 12px from each arrow, its
  text centered between them; on load empty and 48px tall.
- **15-S5-6 it follows the cursor (1):** clicking, clicking again
  (toggle), clicking 3 Down, Space and the arrow keys move it; it empties
  when the grid loses focus and keeps its height.
- **15-S5-7 the order (3):** from 1 Across, Next ten times visits 6–9
  Across, 1–5 Down and wraps to 1 Across, then Previous goes to 5 Down;
  with nothing selected Next shows 1 Across and (after a reload)
  Previous 5 Down; after the grid loses focus, Next steps from the
  cursor's word.
- **15-S5-8 an arrow selects its word (2):** the grid takes focus, the
  cursor at the word's first empty cell with the rest of the word
  highlighted, and typing fills it and advances; a full word's first
  cell; from 9 Across, Next goes down the first column to 1 Down.
- **15-S5-9 not editable (1):** a complete puzzle's bar is empty after a
  click on the grid and both arrows are disabled.
- **15-S5-10 the style guide (1):** `sg-play-hint-bar` shows a 560px bar
  with both arrows and a hint.
- **15-S5-11 no overflow (2):** at 640px and 375px, no horizontal
  overflow and the bar within the window.

Not covered by a browser case: the arrows disabled while starting,
during a completion check or with the reset dialog open (reset isn't
reachable narrow); the visual check covers the rest.

**Discrimination** (2026-10-29, before implementation):
`e2e/narrow-play.spec.ts` with `e2e/color-tokens.spec.ts` ran 23 failed,
7 passed. Every 15-S5 case failed except "at 1290px", which holds today
by design: no bar or `sg-play-hint-bar`, the title visible below
1290px, the grid 291px under the masthead, the messages 95–103px above
it. So did F1-2's two style cases and F1-4's catalog case on
`play-hint-bar`. In Vitest, `globals-css.test.ts` fails on
`--color-play-hint-bar` and `play-source.test.ts` on the missing
`PlayHintBar.tsx`. `tsc --noEmit` and ESLint pass on the new spec.

## Repo paths

Runtime: `src/components/play/PlayPuzzle.tsx`,
`src/components/play/PlayHintBar.tsx` (new),
`src/components/grid/HintBox.tsx` and a shared arrow component (say
`src/components/ui/HintArrow.tsx`, new), `src/app/globals.css`,
`src/components/style-guide/ColorSwatches.tsx`,
`src/app/style-guide/page.tsx`.

Acceptance: `e2e/narrow-play.spec.ts` (new); amended
`e2e/color-tokens.spec.ts`, `src/app/globals-css.test.ts`,
`src/components/play/play-source.test.ts`.

## Definition of Done

- The human answered the questions (2026-10-29) and approves this
  specification and its acceptance, recorded here and in the handoff.
  The spec file was written and its discrimination observed before
  freeze. Freeze on `main` in a specification-only commit with the
  amendments.
- Implement on `main` (no risk path); the frozen acceptance is unchanged
  after freeze.
- `npm run verify` exits 0 and the full `npm run test:e2e` passes.
- The human's visual check passes: play at 1289, 1024, 768 and 640px
  (the bar following the cursor, the arrows through a wrap, a complete
  puzzle, a failed save), the style guide's sample, and unchanged at
  1290px.
