# Story S6 — Hint phase

The hints phase gets its own colors and Hint Inputs. The locked grid is
white and gray-700 with gray-500 lines, takes no focus, and a focused hint
shows its word in blue. EDIT GRID adds yellow for the cursor and its
word. Each hint is a Hint Input in the build skeleton's frame, so nothing
moves when the builder creates hints.

**Status: implemented on `main`** (2026-10-26), on top of freeze commit
`53e28fe`. It is the drafting throwaway unchanged. Next: the human's
visual check.

Approved and frozen earlier the same day: the human approved the
Decisions and acceptance, including the D8-3 and P5-2 retirements and the
token-list amendments.

Earlier: drafted the same day. The human answered the questions and
supplied a desktop mockup (hints phase, locked, 1 Across focused). On
review they chose a locked grid that takes no focus, `primary` cell
letters and numbers in every phase, and the hints phase's own
`hint-cell-*` tokens.

**Blast radius: small to medium.** Five new color styles in
`globals.css` and their swatches in the style guide's `ColorSwatches.tsx`;
client components `HintsPanel`, `PuzzleGrid`, `PuzzleGridEditor` (the
locked grid's focus and one gap class), `LetterCell`, `CellNumber` and the
style guide's `GridExamples.tsx` and `page.tsx`. No palette value, server,
schema or risk path, so delivery is direct on `main` under CODE-REVIEW.
Two frozen tests are retired and two frozen token lists amended.

## Decisions

Inspected `HintsPanel`, `HintSkeleton`, `PuzzleGrid`, `cell-appearance.ts`,
`PuzzleGridEditor` (focus, highlights and the hints region), `TextInput`,
the `play-cell-*` and `hint-cell-selected` tokens in `globals.css`, the
style guide's hint-row and hints-grid samples, and the frozen specs that
read the hints panel or the hints-phase grid (`hints-panel`,
`hints-layout`, `locked-grid`, `style-guide`, `inputs`, `typography`,
`text-styles`).

### The locked grid *(human)*

The hints phase, outside EDIT GRID. Every cell is one of:

| Cell | Fill |
| --- | --- |
| On (holds a letter) | `hint-cell-on` (white) |
| Off (black) | `hint-cell-off` (gray-700) |
| In the word of the hint input that has focus | `hint-cell-selected` (blue-medium) |

- **Borders:** every line is `hint-cell-border` (gray-500), whatever the
  cell's fill, the same value as play's and Preview's lines.
- **The focused hint's word** *(human, 2026-10-26)*. While a hint input
  has focus, every cell of its word is `hint-cell-selected`, the first
  cell included. There is no separate cursor cell. The blue goes when
  focus leaves the hint inputs.
- **The locked grid takes no focus** *(human, 2026-10-26)*. It is not a
  Tab stop, a click on it doesn't focus it, and no key reaches it, so the
  arrow keys no longer move the hidden cursor or the active hint. A click
  on it still selects nothing (H4) and takes focus from a hint input,
  which removes the blue. On load in the hints phase nothing has focus
  *(agent: autofocusing the first hint would be new behavior)*. In EDIT
  GRID the grid takes focus as in the build phase.

### The hints phase's own tokens *(human, 2026-10-26)*

Every hints-phase cell color has its own `hint-cell-*` style, even where
it shares a palette value with play or Preview, so the hints phase's
colors can change without touching another phase. This replaces the
earlier answer to reuse the `play-cell-*` and `build-cell-*` styles.

| Style | Variable | Used for |
| --- | --- | --- |
| `hint-cell-on` *(new)* | white | on cells, locked and EDIT GRID |
| `hint-cell-off` *(new)* | gray-700 | off cells |
| `hint-cell-border` *(new)* | gray-500 | every line |
| `hint-cell-selected` | blue-medium | the focused hint's word (locked) |
| `hint-cell-edit-selected-cell` *(new)* | yellow-bright | EDIT GRID's cursor cell |
| `hint-cell-edit-selected-row` *(new)* | yellow-medium | the rest of its word |

The names follow the existing `build-cell-selected-*` pattern *(agent)*.
The color catalog gains a swatch for each new style.

### EDIT GRID *(human, the epic's Decision)*

- The locked colors, with the cursor cell `hint-cell-edit-selected-cell`
  (yellow-bright) and the rest of its word `hint-cell-edit-selected-row`
  (yellow-medium). Lines stay `hint-cell-border`. A hints-phase word has
  no off cells (geometry is frozen), so there is no `-row-on`/`-row-off`
  pair.
- Selection shows while the grid has focus, as today.
- **The hint inputs stay disabled at 50% opacity** *(human)*, TextInput's
  disabled look, as today.

### Cell letters and numbers *(human, 2026-10-26)*

`primary` in every phase: build, Preview, the hints phase (locked and
EDIT GRID) and play. Set once on `LetterCell` and `CellNumber`, which
today inherit the page's old `foreground` (`#14151b`). Their sizes
(`cell-letter`, `cell-number`) are unchanged.

### Hint Input *(human, from the mockup)*

Builders, hints phase. One per word, in the build skeleton's place.

- **The number** in `title-4` `primary`, where the skeleton's dot was. It
  sits on the input text's baseline *(mockup)*.
- **The number's column is fixed width** *(human)*: the dot's 18px, so the
  line starts 12px after it, 30px into the column, as the skeleton's does.
  It widens only if a three-digit number (a large Sunday) needs it, and
  then every row in both columns widens the same *(agent: 18px fits two
  digits, and every line keeps one x)*.
- **The input** is F5's regular TextInput: the 1px `line-muted` line,
  `line-highlight` on focus, text in `body-normal` `primary`, no
  placeholder *(human: blank)*.
- **The answer** is the slot's word below the line: `label` (14px/400,
  20px line height), letter-spaced 10% (1.4px) *(human: Figma's 10%)*,
  `muted`, turning `primary` while its input has focus. It's 4px below the
  line *(human)* and right-aligned with the line's right end *(agent: the
  mockup draws it a few pixels past the line, read as imprecision)*.
- **An unfilled cell in the answer is `_`, as today** *(agent)*. A real
  hints-phase grid has a letter in every on cell, so only seeded data
  shows it.
- **No background on the active hint** *(human)*. The answer's color and
  the line are the only focus signal.
- **Accessible name:** "1 Across hint" (was "clue", per the epic's "one
  word: hints") *(agent)*.

### The skeleton's frame *(human: "It shouldn't feel like it changes")*

The Hint Inputs reuse S5's skeleton layout, so at Create Hints the dots
become numbers, the answers and any hint text appear, and nothing else
moves:

- "Across" and "Down" labels in `title-4`, but **`primary`** *(human: the
  mockup)*. The skeleton's labels stay `muted`, so the labels darken at
  Create Hints.
- 72px between the grid and the Across column; Down 32px right of the
  Across line's end; lines up to 320px (the column up to 350px).
- The first line 45px below the label's bottom (the skeleton's 32px to its
  row plus the 13px from row to line); lines 58px apart. With the answer
  under each line, that leaves about 5px between an answer and the next
  input's text, as the mockup shows.
- The labels sit level with the grid's first row, as the skeleton's do.
- **The hints scroll in their own box** *(human: as today)*, its top level
  with the grid's and its height the viewport's less the editor's
  allowance, so the grid stays in view.
- **Narrow screens** *(agent: unchanged)*. Below `lg` the hints stack
  under the grid, as today. Epic 15 owns mobile.

### Style guide *(the epic's Decision)*

- `sg-hint-rows` (today two old-token divs) becomes the **Hint Input**
  sample: the real `HintsPanel` for the converted sample grid, one hint
  written.
- `sg-grid-hints` shows the locked grid with a focused hint's word in
  blue (GRID, across); `sg-grid-hints-editing` is unchanged and shows the
  EDIT GRID colors.

### Not changed

- What the hints phase does, apart from the locked grid's focus: hint
  saving, completeness, the cursor moving to a hint's word on focus, a
  click on the locked grid selecting nothing, EDIT GRID's overtype-only
  editing, publishing.
- The build phase, Preview and its legend, and play, apart from their
  letters' and numbers' color. There is no Preview
  in the hints phase, so no legend there (S5 left it to S6).
- `cellAppearance` and its states: the colors change in `PuzzleGrid`,
  so the `locked-letter` and `editable-letter` names stay.

## Non-goals

- Play's grid, Player Hint and Prominent Hint (S7); deleting old tokens
  (S8).
- A mobile hint layout (epic 15).
- Any other change to hints-phase behavior.

## Pending questions

None.

## Retired and amended acceptance

Approving this story approves these, which land in the
specification-only freeze commit on `main`.

**Retired:**

- `e2e/style-guide.spec.ts`, D8-3: "the two hints samples differ only in
  their lettered-cell state". Locked and EDIT GRID letters are both
  `hint-cell-on` now. Replaced by 14-S6-6. The now-unused `bgOf` helper
  goes with it.
- `e2e/hints-panel.spec.ts`, P5-2: "arrow key navigation updates the
  active hint row". The locked grid takes no focus, so no key reaches it.
  Replaced by 14-S6-1's no-focus case.

**Amended:**

- `src/app/globals-css.test.ts` and `e2e/color-tokens.spec.ts`: the
  styles list gains `hint-cell-on` (white), `hint-cell-off` (gray-700),
  `hint-cell-border` (gray-500), `hint-cell-edit-selected-cell`
  (yellow-bright) and `hint-cell-edit-selected-row` (yellow-medium).

No other frozen test breaks: the throwaway passed the full suite (below).
`hints-layout` H5-1's "every answer starts at the same offset" still
holds, since each answer's box spans its column's width.

## Acceptance *(frozen)*

`e2e/hint-phase-design.spec.ts`, 22 cases, at 1440×1000 (1280×800 for
the style guide).

- **14-S6-1 the locked grid (2):** on cells white, off cells gray-700,
  lines gray-500, a letter and a number `primary`; the grid region has no
  `tabindex` and isn't focused on load or after a click on a cell, and an
  ArrowDown then leaves the active hint and every cell's color unchanged.
- **14-S6-2 the focused hint's word (3):** a focused hint input turns its
  word's cells (and only those) blue-medium, with off cells and lines
  unchanged; the blue follows focus to another hint; it goes on a click on
  the grid or the title.
- **14-S6-3 EDIT GRID (1):** the cursor cell yellow-bright, its word
  yellow-medium, an on cell outside it white, an off cell gray-700, lines
  gray-500, letters `primary`.
- **14-S6-4 Hint Input (7):** the number 14px/600 `primary`, on the input
  text's baseline; the text 14px/400 `primary`; no placeholder; the answer
  14px/400/20px, letter-spacing 1.4px, `muted`, right-aligned, 4px below
  the line and ending at its right end; the answer `primary` only while
  its own input has focus; no background on the active row; in EDIT GRID
  the inputs disabled at opacity 0.5.
- **14-S6-5 the skeleton's frame (5):** labels 14px/600 `primary`; the line
  30px into the column and 320px wide, the first 45px below the label,
  lines 58px apart, all at one x; the Across column 72px right of the
  grid, Down 32px right of the Across line, labels level with the grid's
  first row; **nothing moves at Create Hints**: the labels and the first
  two lines of each column keep the skeleton's positions and widths
  through the enter-hints dialog; the hints region scrolls
  (`overflow-y: auto`), its top level with the grid's.
- **14-S6-6 style guide (1):** `sg-hint-rows` holds a real Hint Input
  (number, input, answer); `sg-grid-hints` shows blue, white and gray-700
  cells; `sg-grid-hints-editing` shows yellow-bright, yellow-medium, white
  and gray-700.
- **14-S6-7 cell letters and numbers in every phase (3):** a letter and a
  number `primary` in the build phase, in Preview and in play (a typed
  letter). The hints phase's are in 14-S6-1 and 14-S6-3.

### Acceptance choices

- Colors are the tokens' hex values, which `color-tokens` pins.
- Lengths use `toBeCloseTo(…, 0)` (±0.5px). A line is its input's bottom
  1px border.
- "On the input text's baseline" is checked as equal box bottoms (the
  number's and the input's text area). Both are 14px with a 20px line
  height.
- Grid colors after a focus change use `expect.poll`, since the highlight
  follows a React state update.
- Five cases are guards that `main` also passes: the body-normal text, no
  placeholder, no row background, the 50% disabled inputs and the scroll
  box.

### Discrimination (2026-10-26, observed)

- **Against `main`:** 17 of the 22 cases fail; the 5 that pass are the
  guards above.
- **Against the throwaway** (`/tmp/crossward-drafts/14-S6-throwaway.patch`,
  reverted), after the human's two choices: all 22 pass. With the
  throwaway, the D8-3 retirement and the new spec, before the P5-2
  retirement, `npm run verify` exited 0 (608 Vitest tests) and the full
  `npm run test:e2e` passed 617, failing only the P5-2 case retired
  above. After the `hint-cell-*` tokens, with every retirement and
  amendment, `npm run verify` exited 0 and the full suite passed 617 of
  617.

## EPIC amendment *(applied at freeze)*

In the Decisions:

- **Hint Input:** the number on the input text's baseline in a fixed
  18px column; no placeholder; the answer letter-spaced 10%, 4px below the
  line, right-aligned; no active background; the skeleton's frame, labels
  `primary`.
- **Grid colors per phase, hints phase:** locked, on cells `hint-cell-on`,
  off cells `hint-cell-off`, lines `hint-cell-border`, a focused hint
  input's word `hint-cell-selected`, and the grid takes no focus; EDIT
  GRID, the cursor cell `hint-cell-edit-selected-cell` and its word
  `hint-cell-edit-selected-row`. Each phase has its own cell styles.
- **Cell letters and numbers** are `primary` in every phase.

## Repo paths

Runtime: `src/components/grid/HintsPanel.tsx`, `PuzzleGrid.tsx`,
`PuzzleGridEditor.tsx`, `LetterCell.tsx`, `CellNumber.tsx`, `src/components/style-guide/GridExamples.tsx` and
`src/app/style-guide/page.tsx`.

Runtime also: `src/app/globals.css` and
`src/components/style-guide/ColorSwatches.tsx`.

Acceptance: `e2e/hint-phase-design.spec.ts` (new), the retirements in
`e2e/style-guide.spec.ts` and `e2e/hints-panel.spec.ts`, and the
amendments to `e2e/color-tokens.spec.ts` and
`src/app/globals-css.test.ts`.

## Definition of Done

- The human approves this specification and its acceptance, recorded here
  and in the handoff. Freeze on `main` in a specification-only commit
  with the EPIC amendment.
- Implement on `main` (no risk path); the frozen acceptance is unchanged
  after freeze.
- `npm run verify` exits 0 and the full `npm run test:e2e` passes.
- The human's visual check passes.
