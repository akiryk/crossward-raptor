# Story S7 — Play

Play gets the redesign. The grid takes its `play-cell-*` colors, with the
cursor in yellow and its word in blue. A Prominent Hint bar above the grid
shows the selected word's hint. The Across and Down lists become compact
Player Hints, the selected word's hint is blue, and a click on a hint
selects its word. The title, controls, save status and completion line
take the new text styles and Buttons.

**Status: done** (2026-10-27). Implemented on `main` in `32e2e8a`,
frozen in `5f2afc2`; the human's visual check passed.

Earlier: approved and frozen (2026-10-27). The human approved the
Decisions, the *(agent)* choices and the acceptance, including the P2
amendment ("I approve S7"). Implemented on `main` on top of freeze commit `5f2afc2`: the
drafting throwaway unchanged. The human's visual check passed
(2026-10-27: "I approve S7"), so S7 is done.

**Blast radius: medium.** Client components `PlayPuzzle`, `PlayReset`,
`PuzzleGrid` (play's colors) and the style guide's `GridExamples`; two
new ones, `ProminentHint` and `PlayerHints`; and a small extension to the
shared `Button`. No server, schema, token or risk path, so delivery is
direct on `main` under CODE-REVIEW. One frozen test is amended.

## Decisions

Inspected `PlayPuzzle`, `PlayReset`, `PlayConfetti`, the play route,
`PuzzleGrid` and `cell-appearance` (play mode), `HintsPanel` and the
editor's layout (the frame Player Hints follow), `Button`, `Modal`,
`Title`, the `play-cell-*` styles, the style guide's grid samples and the
frozen specs that read play (`play-route`, `play-entries`,
`play-completion`, `play-reset`, `play-reset-settling`, `library-play`,
`modal-design`, `style-guide`).

The human answered four questions (2026-10-27): the Prominent Hint takes
the proposed NYT-like default; Player Hints are a compact list; a click on
a hint selects its word, in this story; and play mirrors the builder. They
then supplied a desktop mockup of the play grid and the Across list, with
14 Across selected: the cursor cell yellow-bright, its word and its hint
in light blue. It doesn't show the Prominent Hint. "When a hint is
selected I want the background to be the same color as the
play-cell-selected-row." The mockup's values below are read at 1x from
its 2x export.

### The play grid *(human, the epic's Decision; the mockup)*

| Cell | Fill |
| --- | --- |
| On | `play-cell-on` (white) |
| Off | `play-cell-off` (gray-700) |
| The cursor | `play-cell-selected-cell` (yellow-bright) |
| The rest of its word | `play-cell-selected-row` (blue-medium) |

- **Lines:** `play-cell-border` (gray-500), replacing the old
  `grid-line-play`.
- **No inset rings** *(agent)*. The fills replace today's accent and
  `ink-3` box-shadows, which are old tokens.
- **Selection shows while the grid has focus**, as today, and never on a
  completed (read-only) puzzle.
- **Size:** at most 526px wide, as the build grid *(human: mirror the
  builder; the mockup's 15×15 is 525px)*, and shorter to fit the window's
  height. Letters and numbers already scale and are `primary` (S5, S6).

### Prominent Hint *(human: the proposed default)*

A bar directly above the grid, NYT-style:

- **The grid's width**, 16px above it *(agent)*.
- **Fill `play-cell-selected-row`** (blue-medium) *(agent: the proposal
  said blue-medium; using the selected row's style ties it to the grid's
  word and the selected hint, as the human asked for the hint)*. 10px
  corners; 12px top and bottom, 16px left and right.
- **Content:** the word's number and direction, "14A" or "14D", in
  `title-4` `primary`, then 12px later its hint in `body-large`
  `primary`, on one baseline. A long hint wraps and the bar grows.
- **With no word selected** (nothing clicked yet, the grid without focus,
  a completed puzzle) the bar stays, empty, at its one-line height of
  52px, so the grid doesn't move *(agent)*.
- It isn't a live region *(agent: the grid and the selected hint already
  say where the cursor is; announcing every move would be noisy)*.

### Player Hints *(human: compact; the mockup)*

Play's Across and Down lists, beside the grid:

- **"Across" and "Down"** in `title-4` `primary`, level with the grid's
  first row, as the builder's labels.
- **Each hint** is its number in `title-4` `primary` in a fixed 18px
  column (wider only for three digits), then 6px later the hint in
  `body-normal` `primary`, so every hint starts 24px after its number's
  left edge *(mockup)*.
- **Rows 32px apart** (one line each; a long hint wraps), the first
  hint's text 17px below its label *(mockup; the builder's 17px)*.
- **The numbers and labels sit 72px right of the grid** *(mockup; the
  builder's 72px)*. The columns are up to 270px wide, Down 32px right of
  Across *(mockup)*.
- **The selected word's hint** has a `play-cell-selected-row` background
  *(human)*, the full row, reaching 6px left of the number *(mockup)*,
  square corners *(mockup)*. It follows the cursor's word and shows only
  while the grid shows its selection. This replaces the epic's
  `hint-cell-selected`, which is the hints phase's style.
- **The lists scroll in their own box** at the grid's height, as the
  builder's hints do. Below `lg` they stack under the grid (epic 15 owns
  mobile).

### A click on a hint selects its word *(human, 2026-10-27)*

New play behavior, amending the epic's Non-goal *(see the EPIC
amendment)*:

- The cursor goes to the word's **first empty cell**, or its **first
  cell** when the word is full, in the hint's direction, and the grid
  takes focus, so typing fills the word *(agent: NYT's behavior)*.
- It does nothing while play isn't editable (starting, checking,
  resetting, or a completed puzzle).
- **Pointer only** *(agent)*. The hints are not Tab stops; keyboard
  players move with the grid's arrows and Space, as today. Making every
  hint a Tab stop would add dozens of stops before the grid's.

### Title, controls and status *(human: mirror the builder)*

- **The title** is an `h1` in `title-1` `primary` (read-only), 32px above
  the controls row, as the builder's title is above its buttons.
- **The controls row** (32px tall): the builder's "Reset puzzle" and every
  player's "Puzzle options" as alternate Buttons, left-aligned, the menu
  opening below them. Its item is `body-normal` `primary` on the modal's
  white, with `line-muted` border, 10px corners and the Puzzle Row's
  hover fill. Behavior is unchanged.
- **The save status** at the row's right end in `body-small` `muted`;
  `error` when a save or check fails, with its Retry a link in the
  links' style. The completion-check and local-save notes sit below the
  row in `body-small` (`error` and `muted`).
- **Starting and start failure:** "Starting your puzzle…" in
  `body-normal` `muted`; the failure in `error` with a Retry Button.
- **A completed puzzle:** the ✓ in `title-3` `highlight` and "This puzzle
  is complete. Your entries are read-only." in `body-normal` `primary`,
  below the controls *(agent)*.
- The Prominent Hint is 27px below the controls row *(agent: the
  builder's distance to its Preview row)*.

### Dialogs *(the epic's Decision)*

The incorrect, complete and reset dialogs already use the redesigned
Modal; their copy stays. The reset dialog's two old tokens change: the
puzzle's name (in the library) is `primary` semibold and the failure line
`error`. The confetti keeps its own colors.

### `Button` *(named, per the epic's Non-goals)*

Reset and Puzzle options become the shared Button, which gains an
optional `ref`, `aria-expanded` and `aria-controls`, and passes the click
event to `onClick`, which the disclosure needs. Its look is unchanged.

### Style guide

A new `sg-grid-play` sample: the Prominent Hint, the sample grid
converted (as a player sees it) with the cursor in a down word, and its
Player Hints with that word's hint selected.

### Not changed

- What play does, apart from the hint click: typing, the cursor rules,
  saving, completion, reset and the dialogs' behavior.
- The test ids the frozen specs use (`play-title`, `play-clues`,
  `play-clue`, `play-clue-column`, `play-save-status`, `play-options`,
  `play-reset-button`, …), and a hint's text "1 Feline".
- The library, the builder and the hints phase.

## Non-goals

- A keyboard path to the hints, NYT's crossing-word highlight, or
  auto-advancing to the next word.
- Mobile layout (epic 15), including the carried 375px "Puzzle options"
  overflow.
- Deleting old tokens (S8). `grid-line-play` loses its last user here;
  S8 deletes it.

## Pending questions

None. Choices marked *(agent)* are open to the human's review with the
rest of the draft.

## Retired and amended acceptance

Approving this story approves this, which lands in the
specification-only freeze commit on `main`.

**Amended:** `e2e/play-entries.spec.ts`, P2 "typing after selection uses
uppercase guesses, advances across, overtypes, and preserves white
numbered geometry". It required every active cell white while a word was
selected, and an inset ring (box-shadow or outline) on the cursor and its
word. Now the active cells outside the word are white, the cursor is
yellow-bright and its word blue-medium: the selection is still painted,
by fill instead of a ring.

No other frozen test breaks: the throwaway passed the full suite (below).

## Acceptance

`e2e/play-design.spec.ts`, 21 cases, at 1440×1000 (1280×800 for the
style guide), on the play fixture (a 3×3) and a 15×15:

- **14-S7-1 the play grid (3):** unselected, on cells white, the off cell
  gray-700, lines gray-500, 526px wide; selected, the cursor
  yellow-bright, the rest of its word blue-medium, other cells
  unchanged, no box-shadow; the selection goes when the grid loses
  focus.
- **14-S7-2 the Prominent Hint (4):** the grid's width and left edge, 16px
  above it, 52px tall, blue-medium, 10px corners, 12px/16px padding,
  empty with nothing selected; "1A" 14px/600/20px and "Feline"
  18px/400/28px, `primary`, on one baseline; it follows the cursor (1A,
  1D, 2D, 3A); it empties at 52px when the grid loses focus, and the grid
  doesn't move.
- **14-S7-3 Player Hints (7):** labels, numbers 14px/600 and hints
  14px/400 in `primary`; numbers 72px right of the grid, the hint 24px
  after the number (one- and two-digit), rows 32px apart, the first hint
  17px below its label, labels' text level with the numbers; columns 270px,
  32px apart, labels within the grid's first row; the selected word's hint
  blue-medium (6px past the number) and the others transparent, following
  the cursor and going on blur; a click on a hint focuses the grid and
  selects its word at its first empty cell (3A at (0,2); 2D at (2,0), then
  (2,1) once (2,0) is filled); a full word's hint selects its first cell;
  on a completed puzzle a click selects nothing.
- **14-S7-4 title, controls and status (5):** the title 44px/600/54px
  `primary`, 32px above the controls; Reset and Puzzle options alternate
  Buttons 32px tall, the menu item 14px/400 `primary`; "Saved" 12px/400/16px
  `muted`, centred on the controls row; a failed save's status in
  `error`; a completed puzzle's message 14px/400 `primary`, the ✓
  `highlight`, and a click selects nothing.
- **14-S7-5 style guide (1):** `sg-grid-play` is a play grid with
  yellow-bright, blue-medium, white and gray-700 cells, a Prominent Hint
  label and one selected (blue-medium) Player Hint.

And `src/components/play/play-source.test.ts` (2 cases):

- the play page, `PlayPuzzle`, `PlayReset`, `PlayerHints` and
  `ProminentHint` use only the redesign's tokens (no literal colors, old
  color tokens, old text sizes, `font-display`, old radii or shadows);
- `PuzzleGrid` paints play from the five `play-cell-*` styles, with no
  `grid-line-play` and no box-shadow.

### Acceptance choices

- Colors are the tokens' hex values, which `color-tokens` pins.
- Lengths use `toBeCloseTo(…, 0)` (±0.5px).
- "One baseline" is read with a zero-size inline-block probe in each
  element. A label's x is its text's, not its block's.
- Grid and hint colors after a focus change use `expect.poll`.
- The hint rows mark the selected hint `data-active`, not
  `data-selected`, which the frozen play specs count as the grid's
  cursor.

### Discrimination (2026-10-27, observed)

- **Against `main`:** all 21 new browser cases, both source cases and
  the amended P2 case fail.
- **Against the throwaway** (`/tmp/crossward-drafts/14-S7-throwaway.patch`,
  reverted): all 21 and both source cases pass. Without the amendment,
  the full `npm run test:e2e` failed only the P2 case amended above (616
  of 621 passed; the 4 others were the throwaway's own `data-selected`
  collision, since fixed). With the new spec and the amendment,
  `npm run verify` exited 0 (47 files, 610 Vitest tests) and the full
  `npm run test:e2e` passed 641 of 641.

## EPIC amendment *(applied at freeze)*

- **Prominent Hint:** the grid's width, 16px above it, filled
  `play-cell-selected-row`, 10px corners; the number and direction ("14A")
  in `title-4`, the hint in `body-large`, `primary`; empty, at its
  one-line height, with no word selected.
- **Player Hint:** a compact list (rows 32px apart, numbers 72px right of
  the grid, hints 24px after the number, columns up to 270px); the
  selected word's hint has a `play-cell-selected-row` background *(human,
  2026-10-27)*, replacing `hint-cell-selected`. A click on a hint selects
  its word.
- **Non-goals:** "No new puzzle, publishing or play behavior" gains S7's
  hint click.

## Repo paths

Runtime: `src/components/play/PlayPuzzle.tsx`, `PlayReset.tsx`,
`PlayerHints.tsx` (new), `ProminentHint.tsx` (new),
`src/components/grid/PuzzleGrid.tsx`, `src/components/ui/Button.tsx` and
`src/components/style-guide/GridExamples.tsx`.

Acceptance: `e2e/play-design.spec.ts` and
`src/components/play/play-source.test.ts` (new), and the amendment to
`e2e/play-entries.spec.ts`.

## Definition of Done

- The human approves this specification and its acceptance, recorded here
  and in the handoff. Freeze on `main` in a specification-only commit
  with the EPIC amendment.
- Implement on `main` (no risk path); the frozen acceptance is unchanged
  after freeze.
- `npm run verify` exits 0 and the full `npm run test:e2e` passes.
- The human's visual check passes.
