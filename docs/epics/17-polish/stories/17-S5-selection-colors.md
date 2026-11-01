# Story S5 — Selection colors

The word around the cursor turns blue, so the yellow-bright cursor cell
stands out on large puzzles. In the build phase (and S4's Preview word)
`build-cell-selected-row-on` becomes `blue-medium` and
`build-cell-selected-row-off` a new `blue-dull` (#CADAE2). In the hints
phase, `hint-cell-cursor-word` becomes `blue-medium` too. `yellow-medium`
and `yellow-dull` are removed from the palette and the style guide.

**Status: approved** by the human (2026-11-01), including the proposed
small calls and the four amendments; frozen on `main` (specification
only).

**Blast radius: small.** Three color styles' variables and one new
palette variable in `globals.css`, the style guide's catalog, and one
comment in `PuzzleGrid.tsx`. No schema, server action, storage or engine
change, so no CODE-REVIEW risk path: direct delivery on `main`.

## What the code does today

Inspected `src/app/globals.css`, `src/components/style-guide/ColorSwatches.tsx`,
`src/components/grid/PuzzleGrid.tsx` (`BUILD_BG`, `hintsHighlightBg`,
`PREVIEW_HIGHLIGHT_BG`), `GridExamples.tsx`, and every test that names or
pins a yellow value (`grep` for the names and their hex and `rgb()`
forms over `src` and `e2e`).

- `globals.css` declares `--palette-yellow-medium` (#FEFFB0) and
  `--palette-yellow-dull` (#E6E6D1). `build-cell-selected-row-on` and
  `hint-cell-cursor-word` reference yellow-medium;
  `build-cell-selected-row-off` references yellow-dull. Nothing else uses
  either variable.
- Components use only the styles: the build phase's slot cells
  (`BUILD_BG`), Preview's selected word (`PREVIEW_HIGHLIGHT_BG`, 17-S4)
  and the hints phase's grid-focused word (`hintsHighlightBg`). So
  changing the three styles' variables repaints all of them; no
  component changes. The cursor cell styles stay `yellow-bright`.
- The style guide's Colors catalog (`ColorSwatches.tsx`) lists every
  variable with its hex and every style with its variable; its grid
  samples paint through the same styles.
- The yellow values are pinned in `src/app/globals-css.test.ts`,
  `e2e/color-tokens.spec.ts`, `e2e/build-grid-design.spec.ts` and
  `e2e/hints-grid-editing.spec.ts`, exactly the four files the EPIC
  names. `e2e/preview-selection.spec.ts` reads its colors from the
  styles, so it needs no change.

## Decisions

### The values *(human, 2026-10-28)*

| Style | Was | Becomes |
| --- | --- | --- |
| `build-cell-selected-cell` | `yellow-bright` | unchanged |
| `build-cell-selected-row-on` | `yellow-medium` | `blue-medium` (#CFEEFF) |
| `build-cell-selected-row-off` | `yellow-dull` | `blue-dull` (#CADAE2, new) |
| `hint-cell-cursor` | `yellow-bright` | unchanged |
| `hint-cell-cursor-word` | `yellow-medium` | `blue-medium` |

- The style names don't change (the human's
  "build-cell-selected-cell-on/-off" name the `-row-` styles).
- They apply wherever those styles do: the build phase, S4's Preview
  word, and the hints phase with the grid focused. With the grid
  focused, the cursor's word is now the same blue as a focused hint
  input's word (`hint-cell-selected`); the yellow-bright cursor cell is
  what tells them apart *(human)*.
- `yellow-medium` and `yellow-dull` are removed from `globals.css` and
  the style guide's catalog *(human)*. `blue-dull` is added to both,
  after `blue-medium`.

### Small calls *(drafting; approved by the human 2026-11-01)*

- `blue-dull` (#CADAE2) and `build-cell-off` (gray-200, #DDE0E6) are
  close, but distinct, and an off cell in the selected word was already
  only slightly darker than an off cell outside it (yellow-dull against
  gray-200). The human's value is used as given.
- `PuzzleGrid.tsx`'s comment "shows the cursor and its word in yellow"
  becomes "the cursor in yellow and its word in blue". No other runtime
  change.
- Historical stories and EPICs (13, 14) that mention the yellow values
  stay as written; they record what was true then.

## Acceptance

*Approved and frozen 2026-11-01.* One new file and four amended files.

### e2e/selection-colors.spec.ts

Colors are the human's values written out (not read from the styles),
so the new values themselves are under test.

1. **17-S5-1** the build phase: on a 15×15, the cursor cell is
   yellow-bright; a lettered cell and a symmetric hint in its word are
   blue-medium; an off cell in its word is blue-dull; cells outside it
   keep white and gray-200.
2. **17-S5-2** Preview: S4's mixed word selected; the cursor
   yellow-bright, the error and warning cells of its word blue-medium.
3. **17-S5-3** the hints phase: with the grid focused, the cursor
   yellow-bright and its word blue-medium; and the grid-focused word is
   the same color as the word of a focused hint input.
4. **17-S5-4** the palette: `--palette-blue-dull` is #CADAE2;
   `--palette-yellow-medium` and `--palette-yellow-dull` are undefined at
   runtime; the catalog has no yellow-medium or yellow-dull row or text;
   the three styles' catalog rows name blue-medium, blue-dull and
   blue-medium, swatched in those colors.

### Amended acceptance

Amended in the specification-only freeze commit. Every other frozen test
is unchanged.

| File | Case | Was | Becomes |
| --- | --- | --- | --- |
| `src/app/globals-css.test.ts` | `VARIABLES`, `STYLES` (F1 palette variables, F1 color styles) | `yellow-medium` #FEFFB0 and `yellow-dull` #E6E6D1; row-on and cursor-word → yellow-medium, row-off → yellow-dull | no yellow-medium or yellow-dull; `blue-dull` #CADAE2 added; row-on and cursor-word → blue-medium, row-off → blue-dull |
| `e2e/color-tokens.spec.ts` | `VARIABLES`, `STYLES` (F1-1, F1-2, F1-4) | as above | as above (so the catalog's variable count drops by one) |
| `e2e/build-grid-design.spec.ts` | 14-S5-1 "on, off, the selected cell, the selected word on and off, and the lines" | `ROW_ON` rgb(254, 255, 176), `ROW_OFF` rgb(230, 230, 209) | `ROW_ON` rgb(207, 238, 255), `ROW_OFF` rgb(202, 218, 226) |
| `e2e/hints-grid-editing.spec.ts` | 14-S12-5 "with the grid focused: the cursor yellow-bright, its word yellow-medium, …" and 14-S12-7 (its `CURSOR_WORD`) | `CURSOR_WORD` rgb(254, 255, 176); header and title say yellow-medium | `CURSOR_WORD` rgb(207, 238, 255); header and title say blue-medium |

### Acceptance choices *(drafting)*

- The amendments change only values, names and comments; no assertion is
  added or removed. The new file carries the story's own rules, including
  the one no frozen test states: the grid-focused word and the hint-
  focused word match.
- `globals-css.test.ts` checks listed variables exist but not that no
  others do, so the removal is asserted at runtime in 17-S5-4.
- Not covered: play (unchanged; already yellow-bright and blue-medium),
  narrow widths (the same styles), the Hint Box (unchanged
  `hint-box-input`).

### Discrimination (2026-11-01, observed)

- **Current `main` with the proposed tests:** the six new cases and the
  eight amended cases fail; the 52 others in that run (those four
  browser files and the setup project) pass.
- **Throwaway implementation** (`globals.css` and `ColorSwatches.tsx`
  only), then reverted (patch kept outside the repo,
  `/tmp/s5/throwaway.patch`): `npm run verify` exit 0 (Vitest 620 of
  620, including `tsc` and ESLint over the proposed tests) and full
  `npm run test:e2e` exit 0 (836 passed), under the guarded harness's
  standing reset grant.
- **Two mutations on the throwaway,** each caught by
  `selection-colors`: `hint-cell-cursor-word` left yellow-medium
  (4 failed: 17-S5-3 and 17-S5-4); `build-cell-selected-row-off` on
  gray-200 (2 failed: 17-S5-1 and 17-S5-4).

## Repo paths

Acceptance (immutable after freeze): `e2e/selection-colors.spec.ts`,
`src/app/globals-css.test.ts`, `e2e/color-tokens.spec.ts`,
`e2e/build-grid-design.spec.ts` and `e2e/hints-grid-editing.spec.ts`.

Runtime:

- `src/app/globals.css`: `blue-dull` added, the two yellows removed, the
  three styles re-pointed.
- `src/components/style-guide/ColorSwatches.tsx`: the catalog's
  variables and styles to match.
- `src/components/grid/PuzzleGrid.tsx`: the `hintsHighlightBg` comment
  only.
- This story and `../HANDOFF.md`.

Declare any other path before editing it.

## Scope discipline

Only S5. Out of scope: play's colors, the word rule (S6), grid size
(S7), step controls (S8), Preview Hints (S9) and rebus (S10).

## Definition of done

- The human approves this specification, its acceptance and the four
  amendments, recorded here and in the handoff. Freeze on `main` in a
  specification-only commit before any runtime change.
- Frozen acceptance is unchanged after freeze.
- `npm run verify` exits 0, and the full `npm run test:e2e` suite exits 0.
- Delivered on `main` and the handoff updated with observed results.

## Pending questions

None. The human approved the small calls above on 2026-11-01.
