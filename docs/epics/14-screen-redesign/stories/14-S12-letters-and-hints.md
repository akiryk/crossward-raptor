# Story S12 — Letters and hints together

The hints phase loses its EDIT GRID mode. Once the builder creates hints,
the grid's shape stays locked, but its letters stay editable: a click on a
cell and a typed letter fix a word, and a click on a hint goes back to
writing it, with no mode to switch. In the hints phase "1 Build the
Grid" turns into a done button, gray with a check, and a Lock Grid Letters
toggle takes the Preview toggle's place.

**Status: done** (2026-10-27). Implemented on `main` in `b93794c`,
frozen in `2b61fd2`; the human's visual check passed.

Earlier: approved and frozen (2026-10-27). The human approved the
revised draft, its acceptance and its retirements and amendments ("I
approve the revised S12 draft"), frozen on `main` in a
specification-only commit with the EPIC amendment. Implemented on `main`
on top of freeze commit `2b61fd2`: the v2 throwaway unchanged. The human's visual
check passed (2026-10-27: "I approve S12. It looks good!"), so S12 is
done.

The human asked for it while reviewing S7's draft (2026-10-27): "Say I
click 'Create Hints.' Now I can write in a hint for the words. Say the
first across word is 'DRUG.' I start to write a hint but realize I hadn't
meant to write 'DRUG'; I'd meant to write 'DRAG.' … I need to click 'Edit
the Grid' in order to change it. … Now I move back to the hint … I need
to click 'CREATE HINTS' in order to edit them. This becomes tiresome and
doesn't seem to accomplish anything." They want to keep the locking ("black
squares get fixed as black and white squares get fixed as white"), and
"once a user clicks 'Create Hints' there's never a need to click the edit
grid button. We'd just make the edit grid button disabled." They accepted
the agent's four proposals: the hints phase's colors with the cursor in
yellow, no fade, the selected word's hint highlighted, and 1 reading
"Build the Grid"; and removing EDIT GRID's styles here rather than in S8.

**The human's review** (2026-10-27) did not approve the first draft and
asked for two changes, below:

- "Rather than show a disabled 'Build the Grid' button show a gray button
  with a checkmark." When the builder creates hints, the label fades out
  and a check fades in (Material Design's, or similar). The fill becomes
  gray-400, the "1" stays in its circle but turns gray, and the button is
  70px wide at its usual height. They supplied a mockup of the three
  buttons.
- "Add a toggle in the same place as the preview toggle." When the builder
  creates hints, Preview is replaced by "Lock Grid Letters", which
  prevents accidental letter changes. Turning it on makes "all the white
  cells gray-200": the builder "cannot select, give focus to, or edit any
  letters. However, the selected hint word will continue to get
  highlighted with hint-cell-selected."

**Run after S7, before S8**, so it is listed out of numeric order. S7
also changes `PuzzleGrid` (play's colors) and `GridExamples` (the play
sample); the revised throwaway is already rebased onto S7's `main`.

**Blast radius: medium.** Client components `PuzzleGridEditor`,
`BuilderSteps`, `HintsPanel`, `PuzzleGrid`, `PreviewToggle` (its label),
the shared `Button` (a done state, a named change per the epic's
Non-goals), `cell-appearance.ts`, and the style guide's `GridExamples`,
`ColorSwatches` and `page.tsx`; five color styles out and four in, in
`globals.css`. No server, schema, engine or risk
path, so delivery is direct on `main` under CODE-REVIEW. `saveGrid`
already accepts hints-phase letters (EDIT GRID uses it). 23 frozen cases
are retired and 20 amended, and two styles lists and two style-guide
section lists changed, across 12 test files.

## Decisions

Inspected `PuzzleGridEditor` (EDIT GRID's state, the key and click
handlers, focus tracking, the publish flush), `BuilderSteps`, `Button`'s
disabled look, `HintsPanel`, `PuzzleGrid`, `cell-appearance.ts`, the
engine's `place`/`moveTo`/`arrowKey`, `keyboard-intent`, the style guide's
hint-phase samples and swatches, and every frozen test that reads EDIT
GRID, button 1 in the hints phase, the hints-phase grid's focus or the
`hint-cell-edit-*` styles (`locked-grid`, `builder-controls`,
`enter-hints`, `enter-hints-preview`, `hints-panel`, `phase-controls`,
`published-lock`, `hint-phase-design`, `style-guide`, `color-tokens`,
`globals-css.test.ts`, `cell-appearance.test.ts`; `focus-ring`,
`persistence` and `modal` only read the build phase's 1).

### Why EDIT GRID can go *(agent, confirmed by the human)*

EDIT GRID was a view state, never saved. It never unlocked the shape:
the shape is fixed at "Yes, create hints", and in the hints phase the
cursor only reaches on cells (`moveTo` and `arrowKey` skip off cells), so
a typed letter can only overtype. A changed letter makes an already
written hint stale in either design. The only thing the mode did was stop
accidental typing.

### The numbered buttons *(human, review 2026-10-27; the mockup)*

- In the hints phase **1 is done**, not selected, and a click does
  nothing. 2 Create Hints is selected throughout the hints phase; 3
  Publish is unchanged. The build phase is unchanged. "Edit the Grid" no
  longer appears anywhere.
- **The done look:** fill and border `button-done` (gray-400, a new
  style) *(human)*; 70px wide, 32px tall as before *(human)*; the number's
  white circle stays where it is, its "1" in `button-done` *(human)*; in
  place of the label, Material Icons' "check" *(human: "from material
  design")*, 16px wide and white (`inverse`), centred in the 40px right
  of the circle, so 12px either side *(mockup, read at 1x from its 2x
  export)*. Full opacity and a default cursor, with no hover or press
  response *(agent: it isn't a disabled-looking button)*.
- **It stays disabled** *(agent)*: no Tab stop, no click. Its accessible
  name stays "1 Build the Grid": the label is faded out, not removed, and
  the check is hidden from assistive technology.
- **The change** *(human: fades; agent: times)*. When the hints phase
  begins (after "Yes, create hints", once the conversion is saved), the
  label fades out over 150ms, then the check fades in over 150ms; the
  fill, border, width and number color change over the whole 300ms, all
  ease-out. Under reduced motion it changes at once *(agent, as S9)*. A
  page that loads in the hints phase shows 1 done, with nothing
  animating.
- The width animates from the label's width to 70px with CSS
  `interpolate-size` *(agent)*; a browser without it changes the width at
  once, while the fades still run.

### Lock Grid Letters *(human, review 2026-10-27)*

- **A toggle in the Preview toggle's row**, the same F6 toggle labelled
  "Lock Grid Letters". When the hints phase begins, Preview gives way to
  it. A published puzzle shows neither: the row stays empty, so the grid
  doesn't move.
- **Off by default, and not saved** *(agent: like Preview, a way of
  working rather than part of the puzzle)*: each load starts with it off.
- **On:** every on cell is `hint-cell-locked-on` (gray-200, a new style);
  off cells and lines are unchanged. The grid takes no focus, clicks or
  keys: no Tab stop, a click selects nothing, and a typed letter changes
  nothing. The hint inputs stay enabled, and a focused hint's word is
  still `hint-cell-selected` (blue) *(human)*. The grid's mode is
  `hints-locked`.
- **Off again**, the grid is white and takes focus and letters as
  below.

### The hints phase, one mode *(human)*

With Lock Grid Letters off:

- **The shape stays locked**, as today: no '.' key, no Backspace.
  Backspace does nothing in the hints phase, as in EDIT GRID (H4: a
  cleared cell could only leave a hole). A letter typed over another
  overtypes it, and the cursor advances as in the build phase.
- **The grid takes focus** like the build grid: it is a Tab stop, a click
  on a cell focuses it and moves the cursor there (a second click on the
  cursor cell turns its direction), and the arrow keys and Space move and
  turn the cursor. The active hint follows the cursor's word, as today.
  This supersedes S6's "the locked grid takes no focus".
- **Nothing has focus on load** in the hints phase *(agent: S6's rule,
  kept; the build phase still focuses its grid)*.
- **The hint inputs stay enabled** throughout. Focusing a hint still moves
  the cursor to its word's first cell, so the grid is ready for that word.
- **A published puzzle's grid takes no focus** *(agent: its letters and
  hints are already frozen, so a cursor would suggest editing)*: no Tab
  stop, a click selects nothing, no keys, as S6's locked grid. Its
  disabled hint inputs keep TextInput's 50%.
- Letters save on the existing 500ms autosave, and publishing still
  flushes them first.

### The grid's colors *(human, from the agent's proposal)*

The hints phase keeps S6's locked colors: on cells `hint-cell-on`
(white), off cells `hint-cell-off` (gray-700), lines `hint-cell-border`
(gray-500). What has focus decides the highlight:

| Focus | The cursor cell | The rest of its word |
| --- | --- | --- |
| The grid | `hint-cell-cursor` (yellow-bright) *(new)* | `hint-cell-cursor-word` (yellow-medium) *(new)* |
| A hint input | `hint-cell-selected` (blue-medium), as in S6 | `hint-cell-selected` |
| Neither | no highlight | no highlight |

With Lock Grid Letters on, every on cell is `hint-cell-locked-on`
(gray-200) and only a focused hint input highlights its word, in
`hint-cell-selected`.

- The two cursor styles replace `hint-cell-edit-selected-cell` and
  `hint-cell-edit-selected-row` (the same palette values), renamed since
  there is no edit mode *(agent)*. `hint-cell-edit-on`, `-off` and
  `-border` (EDIT GRID's build-like look) are deleted *(human: here, not
  S8)*. `hint-cell-locked-on` (gray-200) and `button-done` (gray-400) are
  new. The catalog's swatches follow.
- Moving focus from the grid to a hint turns the yellow into that hint's
  word in blue; moving it to the title or a button removes the highlight.
- Cells' `data-cell-state` stays `locked-letter` (the shape is locked);
  the highlight is on `data-highlight`, as today *(agent: fewer retired
  unit cases)*. The `editable-letter` appearance and the `isEditingGrid`
  flag are removed. The old `--color-locked-letter` and
  `--color-editable-letter` tokens stay for S8, which reports unused old
  tokens.

### The hints *(human, from the agent's proposal)*

- **Nothing fades**: the labels and every hint are at full opacity in
  every state. This replaces the S6 correction's 0.4 fade.
- **The selected word's hint**: while the grid has focus, the hint of the
  cursor's word has its input filled `hint-cell-cursor` (yellow-bright),
  the S6 correction's look, now on an enabled input. Its answer stays
  `muted`. The fill follows the cursor's word, and goes when the grid
  loses focus, including to that hint's own input (which then shows its
  usual focus: the `line-highlight` line and the `primary` answer, and
  its word in blue). It doesn't scroll into view *(agent, as in S6)*.

### Style guide *(agent)*

- `sg-grid-hints-editing` becomes **`sg-grid-hints-selected`**, "Grid
  (hints phase, grid focused)": the converted sample grid with the cursor
  in yellow, its word in yellow-medium, and the locked colors.
- `sg-grid-hints` is retitled "Grid (hints phase, a hint focused)" and is
  otherwise unchanged.
- A new **`sg-grid-hints-locked`**, "Grid (hints phase, letters locked, a
  hint focused)": gray-200 on cells and that hint's word in blue.
- `sg-builder-steps` drops its EDIT GRID group: the build phase and the
  hints phase, its 1 done.
- The catalog gains the `button-done` and `hint-cell-locked-on` swatches.

### Not changed

- Entering the hints phase, its dialog and Preview in the build phase
  (S10); hint saving and
  completeness; the Hint Input's look (S6) apart from the fade; the
  publish rules and dialogs (S4); the build phase; play.

## Non-goals

- Changing the shape after Create Hints, or any route back to the build
  phase.
- Marking a hint as stale when its word's letters change.
- Scrolling the selected hint into view.
- Saving Lock Grid Letters, or locking the hints.
- Deleting old tokens (S8).

## Pending questions

None. The *(agent)* choices above are the human's to overrule at review.

## Retired and amended acceptance

Approving this story approves these, which land in the
specification-only freeze commit on `main`. Each retired case keeps a
comment in its file naming the replacement.

**Retired (23):**

- `e2e/locked-grid.spec.ts`, H4-2: "typing a letter does nothing while
  locked" and "clicking a cell selects nothing while locked" (the grid
  takes letters and focus; 14-S12-4), and all six "H4-2 EDIT GRID mode"
  cases (14-S12-1, 14-S12-4, 14-S12-6; "Backspace does nothing while
  locked" stays and now runs on a focused grid).
- `e2e/builder-controls.spec.ts`, 14-S4-3: "in the hints phase, 1 turns
  EDIT GRID on and 2 turns it off" (14-S12-1, 14-S12-4).
- `e2e/hint-phase-design.spec.ts`: 14-S6-1 "the locked grid takes no
  focus…" (14-S12-4, which keeps "not on load"; Lock Grid Letters,
  14-S12-3, brings the no-focus grid back as a choice); 14-S6-3 "EDIT
  GRID" (1) and 14-S6-8 "EDIT GRID hints" (4) (14-S12-5, 14-S12-6);
  14-S6-4 "in EDIT GRID the inputs are disabled" (14-S12-4, 14-S12-6).
- `e2e/style-guide.spec.ts`, H5-2: "the editing sample shows the EDIT GRID
  states together" (14-S12-7).
- `src/lib/cell-appearance.test.ts`, H4-1: "cellAppearance hints phase,
  EDIT GRID mode" (5) and "isEditingGrid alone, without isHintsPhase,
  changes nothing" (1). The flag and the `editable-letter` appearance no
  longer exist.

**Amended (20 cases, two styles lists and two style-guide section
lists):** each keeps what it checks, minus EDIT GRID. 1 keeps "Build the
Grid" as its accessible name and text (faded out), so cases reading its
label are unchanged.

- `e2e/locked-grid.spec.ts`: the `step` comment; "the preview toggle is
  replaced by the Edit the Grid button" becomes "the preview toggle is
  replaced by Lock Grid Letters and 1 is done" (the toggle visible; 1
  disabled, done, named "Build the Grid").
- `e2e/phase-controls.spec.ts` P4-2 "letter editing still works normally
  in hints phase", `e2e/hints-panel.spec.ts` P5-2 "typing highlights the
  exact cursor cell…" and `e2e/published-lock.spec.ts` PB4-3 "no lock
  message, and editing works as before": the click on 1 before typing is
  removed, with its comment.
- `e2e/enter-hints.spec.ts` H1-1: the `step` comment; "confirming moves
  the puzzle into hints phase" and "the transition survives a reload"
  expect 1 disabled instead of reading "Edit the Grid"; "the build step
  cannot take you back afterward" expects 1 disabled, forces a click, and
  expects the `hints` grid mode and "Build the Grid".
- `e2e/enter-hints-preview.spec.ts` 14-S10-4 "with Preview already on: the
  same": its EDIT GRID click and check are removed.
- `e2e/builder-controls.spec.ts`: the header comment and `expected()`'s
  label type; 14-S4-1 "labels, numbers and the selected button in each
  state" (the hints phase reads "Build the Grid" with 1 disabled; the
  EDIT GRID state is removed); 14-S4-2 "the hints phase keeps the
  toggle's row empty, so the grid stays put" becomes "the hints phase
  puts Lock Grid Letters in the toggle's row, so the grid stays put" (it
  sits where Preview was); 14-S4-3 "clicking the selected button does
  nothing" (its EDIT GRID half removed); "in the build phase, 2 opens the
  enter-hints dialog…" and 14-S4-5 "closing it in each way…" (the label);
  "Not quite! whenever a required hint is blank, writing or editing the
  grid" becomes "Not quite! whenever a required hint is blank" (its EDIT
  GRID half removed); "publishing from EDIT GRID saves the latest letter
  first and ends EDIT GRID" becomes "publishing saves the latest letter
  first" (the letter typed straight into the grid); 14-S4-8 "the
  builder-steps … samples" (two groups, the hints one's 1 disabled).
- `e2e/hint-phase-design.spec.ts`: the header comment and its now-unused
  constants and `drawnOpacity`; 14-S6-2 "the blue goes when focus leaves
  the hint inputs" (comment only: the grid click now focuses the grid and
  selects 7 Across, outside 1 Across); 14-S6-6 "the Hint Input sample and
  the hints-phase grid samples" (its EDIT GRID sample half removed).
- `e2e/style-guide.spec.ts`: the section and grid-sample lists name
  `sg-grid-hints-selected` instead of `sg-grid-hints-editing` and add
  `sg-grid-hints-locked` (which renames one "geometry holds" case and adds
  another).
- `e2e/color-tokens.spec.ts` and `src/app/globals-css.test.ts`: the styles
  lists lose the five `hint-cell-edit-*` styles and gain
  `hint-cell-cursor` (yellow-bright), `hint-cell-cursor-word`
  (yellow-medium), `hint-cell-locked-on` (gray-200) and `button-done`
  (gray-400).
- `src/lib/cell-appearance.test.ts`: "omitting both flags behaves exactly
  as build mode" becomes "omitting isHintsPhase…", without
  `isEditingGrid`.

## Acceptance

`e2e/hints-grid-editing.spec.ts` (new), 21 cases, at 1440×1000 (1280×800
for the style guide), on S6's 5×5 corners grid (1 Across CATS, 1 Down
CART).

- **14-S12-1 the numbered buttons (4):** in the hints phase 1 is
  disabled, done (`data-done`), named "Build the Grid" and not selected,
  2 is selected, 3 enabled, "Edit the Grid" appears nowhere; 1's look:
  70px by 32px, fill and border gray-400, opacity 1, a default cursor,
  "1" in gray-400 on its white circle, a 16px white check 12px from the
  circle and 12px from the inner right edge, centred vertically, the
  label at opacity 0; all of it after a reload. A forced click on 1 opens
  nothing and leaves the `hints` grid mode, 2 selected and the hint inputs
  enabled. In the build phase 1 isn't done: enabled, not gray-400, its
  label showing and no check. Under reduced motion, confirming Create
  Hints makes 1 done with no transitions, and nothing runs after a reload.
- **14-S12-2 the change (1, full motion):** confirming Create Hints runs
  the label's opacity over 150ms, the check's over 150ms after a 150ms
  delay, the fill, width and number color over 300ms; at 75ms the label
  is mid-fade, the check still hidden and the width between; at 225ms the
  label is gone and the check mid-fade; at the end 1 has the done look.
- **14-S12-3 Lock Grid Letters (4):** confirming Create Hints replaces
  Preview with "Lock Grid Letters", off, at Preview's place; a published
  puzzle shows neither toggle. On: grid mode `hints-locked`, every on cell
  gray-200, the off cell gray-700, lines gray-500, no `tabindex`, a click
  neither focuses nor selects, a typed letter changes nothing, the hints
  enabled. On, a focused hint's word is blue-medium and the other cells
  gray-200. Off again: white, a click focuses the grid and a letter is
  typed and saved; after a reload it is off.
- **14-S12-4 the grid takes focus and letters (5):** the grid region has
  `tabindex="0"`, isn't focused on load, and a click on a cell focuses it,
  selects the cell and makes its word the active hint; a typed letter
  overtypes and advances, the answer under the hint follows (CATS to
  CUTS), Backspace changes nothing, and the letter is saved and survives a
  reload; the arrow keys turn and move the cursor and the active hint
  follows; the DRUG-to-DRAG flow: write a hint, click a cell, type a
  letter, click the hint again and rewrite it, with both saved; a
  published puzzle's grid has no `tabindex` and a click neither focuses it
  nor highlights anything.
- **14-S12-5 the grid colors (3):** with the grid focused, the cursor cell
  yellow-bright, the rest of its word yellow-medium, an on cell outside it
  white, an off cell gray-700, lines gray-500, grid mode `hints`; focus
  moved from the grid to a hint turns the hint's word blue-medium and the
  old cursor and word white; no highlight once focus moves to the title.
- **14-S12-6 the selected word's hint (3):** while the grid has focus, its
  word's hint input is filled yellow-bright and enabled, its answer
  `muted`, another hint unfilled, and the labels and every hint's number,
  input and answer drawn at opacity 1; the fill follows the word (1 Across
  to 1 Down); it goes when focus moves to the title, and when it moves to
  that hint's own input.
- **14-S12-7 style guide (1):** no `sg-grid-hints-editing`;
  `sg-grid-hints-selected` is in grid mode `hints` and shows yellow-bright,
  yellow-medium, white and gray-700 cells, no gray-200, gray-500 lines;
  `sg-grid-hints-locked` is in grid mode `hints-locked` and shows gray-200,
  blue-medium and gray-700 cells, no white, gray-500 lines; the hints-phase
  `sg-builder-steps` group's 1 is done.

### Acceptance choices

- Colors are the tokens' hex values, which `color-tokens` pins; colors
  after a focus change use `expect.poll`. Lengths use `toBeCloseTo(…, 0)`.
- The transition is read as S9's entrance is: a watcher pauses 1's
  transitions the moment it becomes done, then seeks them to chosen times.
  The full-motion case opts out of the suite's reduced motion itself.
- The forced click on the disabled 1 checks that nothing happens, since a
  disabled button fires no click.
- "Saved" is read from the database, polled past the 500ms autosave.
- `data-done` and the button's `data-button-label` and
  `data-button-check` are the test hooks for the done state.
- One case is a guard that `main` also passes: the published grid (S6's
  locked grid already takes no focus).

### Discrimination (2026-10-27, observed, on S7's `main`)

- **Against `main`'s runtime** (`32e2e8a`), with every retirement and
  amendment, the 11 affected browser specs fail 40 cases: 20 of the 21
  new ones (the published guard passes) and 20 existing ones that click
  or read 1 in the hints phase, read the toggle row, or read the new or
  renamed styles and samples. Vitest fails the two `globals-css.test.ts`
  styles cases.
- **Against the revised throwaway**
  (`/tmp/crossward-drafts/14-S12-throwaway-v2.patch`, reverted; 11
  runtime files, 192 lines in, 134 out): the 21 new cases passed alone
  after one runtime fix (the done button had to pack from the start, or
  its overflowing label pushed the number out of view). `npm run verify`
  exited 0 (47 files, 604 Vitest tests; the one pre-existing lint warning
  in `request-logger/render.ts`) and the full `npm run test:e2e` passed
  646 of 646.

## EPIC amendment *(applied at freeze)*

- **Story list:** add "S12 — Letters and hints together": the hints phase
  loses EDIT GRID; letters stay editable beside the hints, the shape stays
  locked, 1 is done, and Lock Grid Letters replaces Preview. Added at S7's
  review and run after S7, before S8.
- **No stepper / Publish is a third numbered button:** "1 reads 'Edit the
  Grid' in the hints phase" becomes "in the hints phase 1 is done: gray
  (`button-done`), 70px, a check in place of its label, and disabled
  (S12)".
- **Grid colors per phase, hints phase:** one bullet replaces "locked" and
  "EDIT GRID": on cells `hint-cell-on`, off cells `hint-cell-off`, lines
  `hint-cell-border`; with the grid focused, the cursor `hint-cell-cursor`
  and its word `hint-cell-cursor-word`, and that word's hint input filled
  `hint-cell-cursor`; with a hint input focused, its word
  `hint-cell-selected`. The grid takes focus and letters, the shape stays
  locked, nothing fades. With Lock Grid Letters on, on cells are
  `hint-cell-locked-on` and the grid takes no focus; a published puzzle's
  grid takes no focus (S12).

## Repo paths

Runtime: `src/components/grid/PuzzleGridEditor.tsx`, `BuilderSteps.tsx`,
`HintsPanel.tsx`, `PuzzleGrid.tsx`, `PreviewToggle.tsx`;
`src/components/ui/Button.tsx`; `src/lib/cell-appearance.ts`;
`src/app/globals.css`; `src/components/style-guide/GridExamples.tsx`,
`ColorSwatches.tsx`; `src/app/style-guide/page.tsx`.

Acceptance: `e2e/hints-grid-editing.spec.ts` (new), and the retirements
and amendments above in `e2e/locked-grid.spec.ts`,
`e2e/builder-controls.spec.ts`, `e2e/enter-hints.spec.ts`,
`e2e/enter-hints-preview.spec.ts`, `e2e/hints-panel.spec.ts`,
`e2e/phase-controls.spec.ts`, `e2e/published-lock.spec.ts`,
`e2e/hint-phase-design.spec.ts`, `e2e/style-guide.spec.ts`,
`e2e/color-tokens.spec.ts`, `src/app/globals-css.test.ts` and
`src/lib/cell-appearance.test.ts`.

## Definition of Done

- The human approves this specification and its acceptance, recorded here
  and in the handoff. Freeze on `main` in a specification-only commit
  with the EPIC amendment, separate from S7's.
- Implement on `main` (no risk path); the frozen acceptance is unchanged
  after freeze.
- `npm run verify` exits 0 and the full `npm run test:e2e` passes.
- The human's visual check passes.
