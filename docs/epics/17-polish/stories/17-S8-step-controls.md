# Story S8 — Step controls

The builder's three step buttons give way to a step row: the current step
as a label and one button for the next step. Below it, the grid's own
controls (Preview, or Lock Grid Letters) sit on a rounded panel, the
toggle row, at the grid's width. The build phase has no Publish, so its
"Lol." and "Nope." dialogs go.

**Status: approved and frozen** (drafted 2026-11-01). The human approved
this specification, its acceptance, the amendments and the EPIC amendment
on 2026-11-01, with the pending question as proposed.

**Blast radius: small.** `BuilderSteps`, the builder's layout in
`PuzzleGridEditor`, `TooEarlyDialog`, `Button` (the "done" look goes), one
color style and the style guide. No schema, server action, storage or
engine change, so no CODE-REVIEW risk path: direct delivery on `main`.

## What the code does today

I inspected `BuilderSteps.tsx`, `PuzzleGridEditor.tsx` (`handleStep` and
the layout), `TooEarlyDialog.tsx`, `Button.tsx`, `PreviewToggle.tsx`,
`globals.css`, the style guide and every frozen test that names
`builder-steps`, `data-step-id`, `data-done` or `too-early-dialog`.

- `BuilderSteps` renders three numbered Buttons, 10px apart: "1 Build
  the Grid", "2 Create Hints", "3 Publish" (`data-step-id` build, hints,
  publish). The current one is selected (`aria-current`). In the hints
  phase 1 is "done" (14-S12): gray (`button-done`), 70px, a check in
  place of its label, disabled.
- 3 Publish in the build phase opens "Lol.", then "Nope." for every
  later click until a reload; in the hints phase "Not quite!" (with
  S1's marks) while a required hint is blank, otherwise the Publish
  dialog. 2 in the build phase opens the enter-hints dialog.
- The toggle row is a bare 24px line 27px under the buttons and 12px
  above the grid (14-S4). Narrow (below 1092px of editor), the toggle
  sits beside the buttons, wrapping under them (15-S3, 15-S6).
- A published puzzle shows `PublishedState` ("Published", "Play it!") in
  the buttons' place; wide, the toggle row stays, empty, so the grid
  doesn't move; narrow, it's hidden.
- The "done" look is `Button`'s only use of its `done` prop, the check,
  the 70px width and the `button-done` style.

## Decisions

### The human's direction *(human, 2026-11-01, with the mockups)*

From `build-step-controls.png` and `hint-step-controls.png` and the
human's notes of 2026-11-01:

- **At desktop sizes the current step is a label, as in the mockups, in
  `title-4`.** There is one button, the one to the next step: "1 Build
  the Grid" with **2 Create Hints**, then "2 Create Hints" with **3
  Publish**. The buttons do what 2 and 3 do today.
- **The step row sits above the grid's own controls**: the toggle and
  (from S10) a Rebus link, on a panel with 10px rounded corners in the
  interactive faint color (`interactive-faint`).
- **Smaller screens are the implementer's call**, with no further
  approval needed, aiming for consistency with existing styles and
  economy of space.

This amends the EPIC's Step controls decision in two places, recorded
there at freeze: the button follows the label as in the mockups (not at
the grid's right edge), and the panel replaces the full-width hairline
(the mockups' only hairline is the masthead's).

### Measured from the mockups *(drafting)*

The mockups predate S7 (their grids are 560px wide), at about 1.9×
(build) and 1.65× (hints). Measured and rounded to the nearest existing
step:

| | Mockup | Value |
| --- | --- | --- |
| The panel | 46 to 48px tall | **48px**: the 24px toggle, 12px above and below |
| The panel's sides | toggle and Rebus 15.5 to 17px in | **16px** |
| The panel's corners | (human) | **10px**, `rounded-modal` |
| The panel's fill | `#F5F7FA` | **`toggle-row`**, a new style on `interactive-faint` |
| The step row's inset | the circle 16px right of the grid, over the toggle | **16px**, so the circle lines up with the toggle |
| Label to button | 17 to 24px | **20px** (as Published to Play it!) |
| Circle to name | about 10px | **8px**, as in a numbered Button |
| Step row to panel, panel to grid | 18 to 19px | **20px** each |
| The button | about 31px tall | today's numbered **Button** (32px), unchanged |

The title stays above, 32px over the step row as today (the mockups
leave it out). The panel runs the grid's width, and only the grid
column's: in the hints phase the hints list's column is S9's (Preview
Hints).

### The label

`builder-step-current`, a paragraph, not a control: a 24px circle filled
`primary` with its number in `inverse`, then the step's name, all
`title-4` `primary` (the mockup's black circle and black text). It's not
focusable, and the next step's Button is the row's only Tab stop.

*Proposed:* the label keeps the current step's `data-step-id` (build or
hints) and `aria-current="true"`, as the selected button had. It still
names where the builder is, and the many frozen tests that read the
phase from `[data-step-id="build"][aria-current="true"]` keep their
meaning unchanged. Clicking it does nothing, as clicking the selected
button did.

### Smaller screens *(implementer's call, delegated by the human)*

- **One column** (below the wide layout's 1140px window): the title, the
  step row, the panel and the grid are **16px** apart, epic 15's narrow
  gap (15-S3-5), in place of the wide 32px and 20px. Otherwise the
  desktop values: there's room, and it keeps one look for tablets and
  small laptops.
- **Below a 748px window** (S7's phone threshold, where the page's
  padding is 8px): the step row and the panel's content are inset
  **12px**, the label and button are **12px** apart and the panel is
  **40px** tall (8px above and below the toggle). That saves 8px of
  height and keeps "1 Build the Grid" and "2 Create Hints" on one line
  at a 320px window (about 300px of the 304px available). If a font
  renders wider, the button wraps under the label, 10px down (15-S6's
  wrap gap).
- **Published, narrow**: no panel, as today (15-S3), so "Published" is
  16px over the grid (15-S3-8, unchanged).

### A published puzzle

`PublishedState` replaces the step row, unchanged (14-S4-6's frozen
tests stand: 32px under the title, "Play it!" 20px after "Published").
Wide, the panel keeps its space, invisible and empty, and the
published row is held at the step row's 32px, so the grid doesn't move
from the hints phase to published. Narrow, there is no panel.

### Removed

- **The build phase's Publish** and its "Lol." and "Nope." dialogs, with
  the click counter. `TooEarlyDialog` keeps only "Not quite!" (same test
  id, title, text and OK), and the style guide's sample only its button.
- **1 in the hints phase** (the disabled, "done" button). Going back to
  the build phase is a Non-goal, and the label says where the builder
  is.
- *Proposed:* the code only the "done" look used, so nothing is left
  orphaned: `Button`'s `done` prop, its check, its 70px width and
  transitions, and the `button-done` color style (and its swatch). The
  `gray-400` palette variable stays (the logo and cell borders use it).
  `Button`'s `selected` look stays: F3's catalog shows it.

### Unchanged

The toggles themselves (F6, including their blue labels; see Pending
question 1), the enter-hints dialog, "Not quite!" and S1's marks, the
Publish dialog, the title, `PublishedState`, the grid, the hints list,
the Hint Box and play.

## Acceptance

*Proposed.* One new file and the amendments below.

### e2e/step-controls.spec.ts (new)

The 3×3 word square (CAT / ARE / TEA).

1. **17-S8-1 the step row** at 1280px. In each phase, the label's number
   and name, and exactly one button, with its `data-step-id`, number and
   name, not selected; the label carries the current step's
   `data-step-id` and `aria-current="true"`; in the build phase no
   Publish at all, in the hints phase no `data-step-id="build"`. The label is `title-4` `primary`, its circle 24px
   `primary` with an `inverse` number, the name 8px after it on its
   line. 2 opens the enter-hints dialog, 3 "Not quite!" or the Publish
   dialog *(guard)*. The button is the Tab stop after the title and
   Enter presses it. A published puzzle shows `PublishedState` and no
   step row *(guard)*.
2. **17-S8-2 layout** at 1280px (wide), 1000px (one column), 375px and
   320px, in both phases (8 cases): the step row 32px (16px in one
   column) under the title; the circle inset 16px (12px on a phone) from
   the grid's left edge; label to button 20px (12px); the button inside
   the grid's width; the panel at the grid's left and right edges, 48px
   (40px) tall, `toggle-row`, 10px corners, 20px (16px) under the step
   row and over the grid; the toggle inset the same as the circle,
   under it, centred in the panel. Wide, the grid and panel stay put
   across the build phase, the hints phase and published, where the
   panel is hidden. At 375px and 1000px a published puzzle has no panel
   and "Published" is 16px over the grid *(guards)*. No horizontal
   overflow at 320px *(guard)*.
3. **17-S8-3 no Publish in the build phase**: no button named Publish,
   no too-early dialog, no "Lol." or "Nope."; the style guide's sample
   offers only "Not quite!".
4. **17-S8-4 style guide**: `sg-builder-steps` shows each phase's step
   row over a `toggle-row` panel, and `PublishedState`.

### Amended and retired acceptance

Found by running the full suite against a throwaway implementation
(Discrimination). Each is amended or retired in the specification-only
freeze commit; every other frozen test is unchanged.

| File | Case | Was | Becomes |
| --- | --- | --- | --- |
| `e2e/builder-controls.spec.ts` (14-S4) | header, `readSteps`, `expected` | three buttons, one selected | the label (current) and the one button; `expected(phase)` |
| | 14-S4-1 "labels, numbers and the selected button in each state" | three buttons; 1 disabled in the hints phase | "the current step's label and the next step's button in each state"; no `build` in the hints phase |
| | 14-S4-2 "title, buttons, Preview toggle and grid in the build phase" | buttons 10px apart, toggle 27px under, grid 12px under | **retired**, replaced by 17-S8-2 |
| | 14-S4-3 "clicking the selected button does nothing" | clicks the selected button | "clicking the current step's label does nothing" (same body) |
| | 14-S4-4 "Lol., then Nope. …" | the build phase's 3 Publish | **retired**, replaced by 17-S8-3 |
| | 14-S4-8 style guide | three buttons per group, 1 disabled; the sample's first button opens "Lol." | a label and a button per group; the first opens "Not quite!" |
| | 14-S4-3 (2 opens the dialog), 14-S4-5 (closing it) | through `readSteps`/`expected` | unchanged bodies; pass through the amended helpers |
| `e2e/hints-grid-editing.spec.ts` (14-S12) | 14-S12-1 (4 cases), 14-S12-2 (1 case), their helpers, `DONE` | 1's "done" look and its transition | **retired**, with the header's paragraph; replaced by 17-S8-1 |
| | 14-S12-7 "… the done 1, and no EDIT GRID sample" | the sample's 1 is done | "…, and no EDIT GRID sample"; the hints sample has no `build` |
| `e2e/enter-hints.spec.ts` (H1-1) | header; "confirming …", "… survives a reload" | `build` disabled after | `build` absent |
| | "the build step cannot take you back afterward" | clicks the disabled 1 | no `build` and no Build the Grid button; clicking the label does nothing |
| `e2e/locked-grid.spec.ts` (H4-2) | "… and 1 is done" | 1 disabled and done | "… and 2 is the current step"; no `build` |
| `e2e/duplicate.spec.ts` (16-S4) | 16-S4-2, 16-S4-3 | `build` disabled (hints) or enabled (grid) | `hints` current and `build` absent, or `build` current |
| `e2e/publish.spec.ts` (PB3-2) | "a grid-phase puzzle cannot be published" | 3 opens a too-early dialog | there is no Publish button |
| `e2e/narrow-builder.spec.ts` (15-S3) | header; 15-S3-4 (3 cases) | the toggle beside the buttons, 20px after | **retired**, replaced by 17-S8-2 |
| | 15-S3-5 (2 cases) "16px from the title to the buttons and from the buttons to the grid" | buttons to grid | "… to the step row, to the toggle row and to the grid", 16px each |
| `e2e/small-screens.spec.ts` (15-S6) | 15-S6-6 (2 cases), `WRAP_GAP_PX`, header | the toggle's row 10px under the wrapped buttons | **retired**, replaced by 17-S8-2 |
| `e2e/focus-ring.spec.ts` (14-S11-4) | the editor case | Tabs to 1 | Tabs to 2, the build phase's button |
| `e2e/controls.spec.ts` (D2-1) | "buttons report a pointer cursor …" | 2 and 3 | 2 only |
| `e2e/buttons.spec.ts` (F3-9) | "builder actions: the steps are numbered …" | 1, 2 and 3 numbered | 2 numbered |
| `e2e/color-tokens.spec.ts`, `src/app/globals-css.test.ts` (F1) | the styles map | `button-done` (gray-400) | `button-done` removed; `toggle-row` (interactive-faint) added |

### Acceptance choices *(drafting)*

- The label's absence of a control is checked by role and by test id,
  so a label rendered as a disabled button still fails.
- Layout is checked at four widths because the values change at the
  748px window and the wide layout changes at 1140px; 320px is the
  narrowest supported window.
- The step row's height is not frozen, only the gaps around it, so the
  label's line height and the Button's 32px can settle it.
- Not covered: the removed dead code. Independent review checks it, and
  `tsc` and ESLint catch dangling uses.

### Discrimination (2026-11-01, observed)

- **Current `main` with the proposed tests** (the 13 browser files):
  35 failed and 144 passed. The failures are 17 of the 22 17-S8 cases
  (the 5 guards pass) and 18 amended cases in eight files; the amended
  cases that only re-point a selector pass (guards). `globals-css.test.ts`
  fails both F1 style cases.
- **Throwaway implementation** of the Decisions (since reverted; patch
  at `/tmp/s8/throwaway.patch`, not in the repo) with the proposed
  tests: the same files ran 199 passed (with `enter-hints-preview`,
  `modal` and `persistence`, which read the phase through
  `[data-step-id="build"]`). The full `npm run test:e2e` had 885
  passed, and `npm run verify` exited 0 (Vitest 626/626, with the
  amended `globals-css.test.ts`).
- An earlier throwaway, without the label's `data-step-id`, failed 46
  frozen cases in 16 files; keeping the id on the label avoided 13 of
  those amendments.

## Repo paths

Acceptance (immutable after freeze): `e2e/step-controls.spec.ts` (new),
and amended `e2e/builder-controls.spec.ts`,
`e2e/hints-grid-editing.spec.ts`, `e2e/enter-hints.spec.ts`,
`e2e/locked-grid.spec.ts`, `e2e/duplicate.spec.ts`,
`e2e/publish.spec.ts`, `e2e/narrow-builder.spec.ts`,
`e2e/small-screens.spec.ts`, `e2e/focus-ring.spec.ts`,
`e2e/controls.spec.ts`, `e2e/buttons.spec.ts`,
`e2e/color-tokens.spec.ts` and `src/app/globals-css.test.ts`.

Runtime:

- `src/components/grid/BuilderSteps.tsx`: the step row and a new
  `ToggleRow`.
- `src/components/grid/PuzzleGridEditor.tsx`: `handleStep`, the removed
  click counter, the layout.
- `src/components/grid/TooEarlyDialog.tsx`: "Not quite!" only.
- `src/components/ui/Button.tsx`: the "done" look removed.
- `src/app/globals.css`: `toggle-row` added, `button-done` removed.
- `src/components/style-guide/ColorSwatches.tsx`, `src/app/style-guide/page.tsx`:
  the catalog and samples to match.
- This story, `../EPIC.md` (the Step controls decision and the S8 line,
  at freeze) and `../HANDOFF.md`.

Declare any other path before editing it.

## Scope discipline

Only S8. Out of scope: Preview Hints and its panel over the hints
(S9), the Rebus link in the toggle row (S10, which takes the panel's
right end), the toggles' own look (F6), the published row and play.

## Definition of done

- The human approves this specification, its acceptance, the amendments
  and the EPIC amendment, recorded here and in the handoff. Freeze on
  `main` in a specification-only commit before any runtime change.
- Frozen acceptance is unchanged after freeze.
- `npm run verify` exits 0, and the full `npm run test:e2e` suite exits 0.
- Delivered on `main` and the handoff updated with observed results.
- The human's visual check at desktop sizes.

## Pending questions

Answered (human, 2026-11-01): approved as proposed.

1. **The toggle's label color.** Both mockups show the off toggle and
   its label gray (`#8B909A`, `gray-500`, the `muted` style); F6's toggle
   is blue (`button-fill`, label `link-muted`). *Proposed:* keep F6's
   toggle unchanged here. Changing it restyles every toggle (Preview,
   Lock Grid Letters, S9's Preview Hints) and supersedes F6's frozen
   toggle tests, so it would need its own decision on the on, hover and
   focus colors.
