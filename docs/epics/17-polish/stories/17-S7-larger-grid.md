# Story S7 — Larger grid

The builder's and play's grids grow from 560px to 700px at most, held as
long as the window allows, and the layout's thresholds move by the same
140px. A Sunday's letters and numbers take the NYT's proportions of the
cell, measured from the human's screenshot, so a number never touches
its cell's letter at any width; the other sizes keep their type. Below a
748px window the page's side padding is 8px (the correction below).

**Status: approved and frozen** (drafted and approved by the human
2026-11-01, with both pending questions as proposed), in a
specification-only commit on `main` (3152562). Implemented on `main`;
`npm run verify` and the full `npm run test:e2e` (862 passed) exit 0.
Awaiting the human's visual check.

**Correction approved** (2026-11-01, after the human's visual check of
8cf2828): approved by the human and independently reviewed the same day,
then frozen in its own specification-only commit (86497f2) before its
runtime change. Implemented on `main`; `npm run verify` and the full
`npm run test:e2e` (875 passed) exit 0 (73ad3c0). The human's visual
check passed (2026-11-01). **Done.** Where the text below the
Correction differs, the Correction governs.

## Correction (2026-11-01) *(human; approved)*

The human's visual check: the scaled-up numbers look wrong on a Mini and
on every size but the Sunday, and on a phone the page's padding leaves
the grid smaller than it needs to be. Their answers (the same day):

1. **The NYT's letters and numbers are a Sunday's (21×21) only**, as in
   "Letters and numbers as the NYT" below, with no floor or cap. A Mini,
   Midi and Daily keep their type from before S7 exactly: the letter
   centered, `cell-letter`'s 16px in a 35px pitch, scaled with the
   pitch; the number `cell-number`'s 10px at the top left with 1px
   padding, shrinking in a cell smaller than a 21×21's at 560px
   ((560 − 1) / 21) to an 8px floor (14-S5, 15-S6). The grid stays 700px.
2. **Below a 748px window the page's padding is 8px on each side**, in
   the builder and play (the pages whose grid shrinks), so the grid is
   700px down to a 716px window and narrower is the window less 16px,
   8px in. The top and bottom padding stay 24px (the human asked about
   the grid's width; approved with the correction). The Hint Box and
   the hint bar stay at the grid's width. The library and the other pages are unchanged.
3. **S7 is corrected, not followed by a new story**, since its visual
   check had not passed.

The Sunday's values are unchanged, but the throwaway implementation
moves within their 0.03*p* tolerance for clear space at phone sizes. At
a 375px window a Sunday's pitch is 17px, and pixel snapping took the
first values' nominal 0.10*p* (1.7px) gap to nothing. Digits about
0.225*p* tall and capitals about 0.466*p*, bottom 0.90*p*, measured gaps of
1 to 3px at windows of 320 to 600px.

### The correction's acceptance

Amended in a specification-only commit. Counts are the corrected ones:

| File | Case | Frozen (3152562) | Corrected |
| --- | --- | --- | --- |
| `e2e/larger-grid.spec.ts` | 17-S7-2 "at 747px both are the window less 48px, 24px in" (3) | 1 case | three: at 748px both 24px in; at 716px still 700px, 8px in; at 715px the window less 16px, 8px in |
| | 17-S7-5 (3) | a 21×21 and a 15×15 at 700px, a 15×15 at 375px, a played letter on a 15×15 | a Sunday's only (3): a 21×21 at 700px, a 21×21 at a 600px window (numbers under 10px), a played letter on a 21×21 |
| | **17-S7-8** (new, 3) | — | a 5×5, 9×9 and 15×15 at 700px: the letter 16/35 of the pitch, its ink centered both ways within 0.06*p*; the number 10px, its ink within 5px of the cell's top left |
| `e2e/small-screens.spec.ts` | 15-S6-1 (8) | the window less 48px, 24px in, at 747, 414 and 375px | a new "at 716px still 700px, 8px in"; the window less 16px, 8px in, at 715, 414 and 375px |
| | 15-S6-2 (2) | retired by S7 | restored unchanged |
| | 15-S6-3 (5) | retired by S7 | restored without its two 21×21 cases (608px: 10px; 375px: the 8px floor), with "a 15×15 at 320px: the 8px minimum" in their place |
| `e2e/build-grid-design.spec.ts` | 14-S5-4 (4) | weight, uppercase and family only, for 15, 5 and 21 | the 15×15's and 5×5's sizes restored at a 700px pitch (letters 699 / size × 16/35, numbers 10px); the 21×21 keeps weight, uppercase and family only; "letters shrink with the grid on a shorter screen" restored |

17-S7-6's guards (a 5×5 and 15×15 at 700px clear) and every other case
are unchanged. Each file's header comment says the same.

### The correction's discrimination (2026-11-01, observed)

- **Throwaway implementation** of the correction on 8cf2828, then
  reverted (patch outside the repo, `/tmp/s7/correction-throwaway.patch`):
  the full `npm run test:e2e` with the corrected tests had 875 passed;
  `npm run verify` exit 0.
- **8cf2828 with the corrected tests** (the three files): 22 failed, 71
  passed: every new, restored and changed case except 17-S7-5's Sunday
  cases (values unchanged), 17-S7-2's 748px boundary guard and
  14-S5-4's renamed 21×21 weight and family case.
- The first throwaway (S7's own values with only the padding changed)
  failed 17-S7-6 at 375px: a Sunday's numbers touching their letters at
  a 17px pitch. Gaps were 0 to 1px at windows of 360 to 600px. This
  prompted the tighter values above.

**Blast radius: small.** Client components only: the grid's cell
typography (`PuzzleGrid`, `LetterCell`, `CellNumber`), the grid width and
container thresholds in `PuzzleGridEditor`, `PlayPuzzle`, `PuzzleTitle`
and `HintSkeleton`, and the style guide. No schema, server action,
storage, token or engine change, so no CODE-REVIEW risk path: direct
delivery on `main`.

## What the code does today

Inspected `PuzzleGrid.tsx`, `LetterCell.tsx`, `CellNumber.tsx`,
`EmptyCell.tsx`, `PuzzleGridEditor.tsx`, `PlayPuzzle.tsx`,
`PuzzleTitle.tsx`, `HintSkeleton.tsx`, `HintsPanel.tsx`, the style guide
(`GridExamples.tsx`, `style-guide/page.tsx`), `playwright.config.ts`, the
15-S1, S2, S3, S5 and S6 stories and every frozen spec that measures the
grid, its cells or a threshold.

- **Width.** `GRID_MAX_PX = 560` in `PuzzleGridEditor` and `PlayPuzzle`;
  the narrow editor column is `max-w-[560px]`. Below a 608px window the
  grid is the window less 48px (15-S6).
- **Thresholds** (container queries, so each is room, not window):
  the builder is narrow below 952px of room in `@container/editor` (a
  1000px window: 560 + 32 + a 360px hint column), in `PuzzleGridEditor`,
  `PuzzleTitle` and `HintSkeleton`; play is narrow below 1242px of room in
  `@container/play` (a 1290px window); the builder's Across and Down
  columns stack below 650px of their own room (`HintsPanel`,
  `HintSkeleton`), which beside a 560px grid is a 1290px window.
- **Cell type.** Letters are 16px in a 35px pitch, scaled with the pitch,
  centered both ways. Numbers are 10px at a 21×21's 560px pitch, shrinking
  with smaller cells to an 8px floor and never growing, at the top left
  with 1px padding (15-S6).
- **The collision.** Measured from the human's
  `crossward-raptor-sunday.png` (21×21 at 560px, 2× density): the
  number's ink runs to 0.36 of the pitch down and the vertically centered
  letter's capitals start at 0.30, so "10" and "S" overlap.
- **The style guide** shows the Hint Box and the play hint bar at 560px,
  "at the grid's width".

## The NYT's measurements

From the human's `nyt-sunday-535px.png`: a 21×21 at 535px, captured at 2×
(1070px). The pitch is 50.5 device px (25.3 CSS px); white cells are 48px
inside their lines. Ink (luminance under half), as fractions of the
pitch, from the cell's inner top left:

| | NYT | Today (560px) |
| --- | --- | --- |
| Number: digit height | 0.24 | 0.26 (10px) |
| Number: top of digits | 0.10 | 0.09 |
| Number: left of digits | 0.08–0.12 | 0.06 |
| Number: a three-digit number's width | 0.47 | — |
| Letter: capital height | 0.475 | 0.34 |
| Letter: bottom of capitals | 0.91 | 0.64 |
| Letter: across | centered | centered |
| Clear space, number to letter | 0.10 | none |

So the NYT's letter is **larger** relative to the cell than ours, not
smaller, and sits low; the number is about a quarter of the cell, and
the two never share a row of pixels. Numbers and letters overlap across
(a three-digit number reaches past the letter's left edge); only height
separates them.

## Decisions

### 700px *(human, the EPIC)*

- **Every grid is at most 700×700px**, in the build phase (Preview
  included), the hints phase and play, superseding 15-S1's 560px. Cells
  share 1px lines as today: a pitch of 699px / size (a Sunday's 33.3px,
  a Daily's 46.6px, a Mini's 139.8px).
- **It shrinks last:** 700px down to a 748px window (700 + 2 × 24);
  narrower, the window less 48px, as 15-S6 has it. *Corrected
  2026-11-01: below 748px the page's side padding is 8px, so 700px down
  to a 716px window, then the window less 16px.* A short window still
  scrolls the page (15-S1).

### The thresholds move by 140px *(the EPIC's proposal, settled here)*

Each threshold keeps its content's minimum (the 360px hint column, the
650px of two hint columns), so each moves by the grid's 140px:

| Threshold | Room (container) | Window | Was |
| --- | --- | --- | --- |
| Builder narrow (title `title-3`, Hint Box, one column) | below 1092px | below 1140px | 952px / 1000px |
| Builder's Across and Down stack | below 650px beside the grid (unchanged) | below 1430px | 1290px |
| Play narrow (no title or hint lists, hint bar) | below 1382px | below 1430px | 1242px / 1290px |
| Grid shrinks with the window | — | below 748px | 608px |

At the default 1440px test viewport the builder keeps two hint columns
(660px beside the grid) and play stays wide. Between 1140 and 1429px the
builder's hints are one column beside the grid, as between 1000 and
1289px today; between 748 and 1139px the narrow builder's column is the
grid's 700px.

### Letters and numbers as the NYT *(human, the EPIC; values measured)*

*Corrected 2026-11-01: a Sunday's (21×21's) only; the other sizes keep
their type from before S7 (the correction above).*

In a cell of pitch *p*, wherever a grid is drawn (build, Preview, hints,
play, the style guide):

- **The number's digits** are 0.24*p* tall, their top 0.10*p* from the
  cell's top and their left about 0.08*p* from its left (within 0.15*p*).
- **The letter's capitals** are 0.475*p* tall, centered across the cell,
  their bottom 0.91*p* from the cell's top.
- **Both scale with the pitch** at every grid size and width, as letters
  do today, so the 0.10*p* of clear space holds everywhere. In Inter,
  that is a letter about 0.65*p* and a number about *p*/3 in font size; the
  exact CSS is the implementer's, checked against the ink.
- The acceptance measures ink with a tolerance of 0.03*p*, about 1px on a
  Sunday at 700px.
- Weight, family, color and uppercase are unchanged (`cell-letter`,
  `cell-number`, `primary`).

### Small calls *(proposed)*

- **No number floor or cap** *(human, 2026-11-01)*. 15-S6's 8px floor
  can't stay: on a phone a Sunday's pitch is 15.5px, and an 8px number
  reaches the letter. The NYT's board scales as one drawing. *Corrected
  2026-11-01: on a Sunday only; the other sizes keep 15-S6's 8px floor,
  and with 8px padding a Sunday's pitch at a 375px window is 17px.*
- **The style guide's Hint Box and play hint bar samples** move to 700px,
  since they show those bars at the grid's width.
- **A new style-guide sample, `sg-grid-corner`:** the bottom-left 7×5
  cells of a lettered 21×21 at the 700px grid's pitch, with three-digit
  numbers (104 to 111) over letters. It is the clipping box itself, so
  only those cells show.
- `--text-cell-letter` (16px) and `--text-cell-number` (10px) stay as
  tokens: their weights still apply, and `CellNumber` falls back to them
  outside a grid. Inside a grid the sizes come from the pitch, as
  letters' already did.
- The EPIC's "smaller relative to the cell" is corrected to the
  measurement (larger, lower) in the specification-only freeze commit
  *(human, 2026-11-01)*.

## Acceptance

*Approved 2026-11-01.* One new file, nine amended files.

### e2e/larger-grid.spec.ts

At twice the pixel density. Ink is read from screenshots that paint the
cells white without lines and show only the numbers, or only the
letters, in black.

1. **17-S7-1** a 5×5, 15×15 and 21×21 in the build phase are 700px at a
   699 / size pitch; a 15×15 is 700px in the hints phase, Preview and
   play (5 cases).
2. **17-S7-2** at 748px the builder's and play's grids are 700px; at
   747px the window less 48px, 24px in (2). *Corrected 2026-11-01: 24px
   in at 748px; 700px, 8px in at 716px; the window less 16px, 8px in at
   715px (3).*
3. **17-S7-3** the builder: at 1430px two hint columns 32px from a 700px
   grid; at 1429px one column beside it; at 1140px still beside it, no
   Hint Box, title `title-1`; at 1139px one centered 700px column with the
   Hint Box under the grid and the title `title-3` (4).
4. **17-S7-4** play: at 1430px wide (title, two columns 32px from a 700px
   grid, no bar); at 1429px narrow (no title or columns, the bar under a
   centered 700px grid) (2).
5. **17-S7-5** the NYT's proportions in cell (0,0): a 21×21 and a 15×15
   at 700px, a 15×15 at 375px (numbers under 8px) and a player's typed
   letter in play (4). *Corrected 2026-11-01: a Sunday's only (3), and
   17-S7-8 checks the other sizes' type (the Correction).*
6. **17-S7-6** numbers never touch letters, and stay inside their cells:
   every numbered cell of a 21×21 lattice (111 numbers, lettered Q, W, O
   and M) in the hints phase at 700px and at 375px, and in play from a
   saved session; a 5×5 and a 15×15 at 700px *(guards; pass today)* (5).
7. **17-S7-7** `sg-grid-corner` shows cells at the 700px grid's pitch and
   three-digit numbers clear of their letters (1).

### Amended and retired acceptance

Amended in the specification-only freeze commit. Every other frozen test
is unchanged.

| File | Case | Was | Becomes |
| --- | --- | --- | --- |
| `e2e/build-grid-design.spec.ts` | 14-S5-3 size (4) | "is 560px wide", pitch 559 / size | "is 700px wide", pitch 699 / size |
| | 14-S5-4 letters and numbers (3) | letters (559 / size) × 16/35 px, numbers 10px, plus weight, uppercase, family | renamed "…letters are cell-letter's weight, uppercase, in the body's family": the size checks go (sizes are 17-S7-5's) |
| | 14-S5-4 "letters shrink with the grid on a shorter screen" | the 16/35 ratio at 1280×720 | **retired**, replaced by 17-S7-5 *(restored by the Correction)* |
| `e2e/grid-size.spec.ts` | 15-S1-2 (3), 15-S1-3 sizes (3) and "a 15×15 stays…" | 560px | 700px |
| | 15-S1-3 "clicking a cell leaves the page where it was" | clicks (3,7), the last row in view at 1440×600 | clicks (3,5), the last row in view with a 700px grid |
| `e2e/hint-box.spec.ts` | 15-S4-1 (2) | the box at 999px, none at 1000px | at 1139px, none at 1140px |
| | 15-S4-9 the style guide | sample 560px | 700px |
| `e2e/narrow-builder.spec.ts` | 15-S3-1 (4), 15-S3-3 and 15-S3-4's wide cases | 1000 and 999px | 1140 and 1139px |
| | 15-S3-2 one centered column (6) | 999, 768 and 640px, a 560px column | 1139, 768 and 748px, a 700px column |
| | 15-S3-8 published state | a 560px grid | 700px |
| `e2e/narrow-play.spec.ts` | 15-S5-1 (2) | narrow at 1289px, wide at 1290px | 1429px, 1430px |
| | 15-S5-2 (2), 15-S5-10 | 560px | 700px |
| `e2e/play-design.spec.ts` | 14-S7-1 unselected | at most 560px | 700px |
| `e2e/play-opening.spec.ts` | 17-S2-2 the Prominent Hint's text | its `tokenPx` probe sits in the body's flex column, which shrinks it to 0px once the 700px grid makes the page taller | the probe is `position: absolute`; no assertion changes |
| `e2e/small-screens.spec.ts` | 15-S6-1 (3) | 560px at 608px; the window less 48px at 607px | 700px at 748px; at 747px |
| | 15-S6-2 (2) and 15-S6-3 (6) | letters 16/35 of the pitch; numbers 10px, 8px floor | **retired**, replaced by 17-S7-5 and 17-S7-6 *(restored by the Correction, 15-S6-3 without its 21×21 cases)* |
| `e2e/wide-layout.spec.ts` | 15-S2-2, 15-S2-3 (6) | a 560px grid at 1440, 2400 and 1290px | 700px at 1440, 2400 and 1430px |
| | 15-S2-4 (7) "one column below 1290px" | 1289, 1100 and 1024px (scroll case 1100px) | "below 1430px": 1429, 1240 and 1164px (scroll case 1240px) |
| | 15-S2-5 (2), 15-S2-6 (2) | 560px; the legend at 1100px | 700px; at 1240px |

Each file's header comment is updated to match.

### Acceptance choices *(drafting)*

- Ink, not boxes: an element's box includes the font's empty ascent and
  descent, so boxes overlap even where nothing touches. Screenshots at 2×
  show what a reader sees.
- Hiding by injected test styles (the number by `cell-number`, the letter
  as the rest of the cell's text) doesn't depend on how the letter is
  marked up.
- The proportions are checked on capitals with flat tops and bottoms
  (M); the no-touch cases use Q, W and O, the letters with the most ink.
- 17-S7-5's narrow case is a 15×15 at 375px (pitch 21.8px): a Sunday
  there (15.5px) renders its 5px numbers too coarsely to measure to
  0.03*p*, so only 17-S7-6 checks it, for clearance. *Superseded
  2026-11-01: the narrow case is a Sunday at a 600px window (the
  Correction).*
- Not covered: Preview's and the hints phase's colors over the new
  layout (unchanged; their frozen tests pass), and rebus text (S10).

### Discrimination (2026-11-01, observed)

- **Throwaway implementation** of the Decisions (the 700px width,
  the moved thresholds, the pitch-based letter and number, and the style
  guide), then reverted; patch kept outside the repo
  (`/tmp/s7/throwaway.patch`). Measured at 700px on a 21×21: digits
  0.240*p*, top 0.09*p*; capitals 0.466*p*, bottom 0.901*p*.
- **Before the amendments,** the full `npm run test:e2e` with the
  throwaway failed 63: 62 frozen cases in the nine files above, and one
  of its own cases, since revised. **With the amendments,** the full
  suite had 861 passed and 1 failed: `session-renewal` A4 on
  `ECONNRESET`, the transient S6 also saw, which passed 8 of 8 on rerun.
- **Current `main` with the proposed tests,** across the ten files: 67
  failed and 131 passed. 21 of `larger-grid`'s 23 cases failed; the two
  guards passed. Every amended case failed.
- **Two mutations on the throwaway,** each caught: keeping an 8px number
  floor (2 failed: 17-S7-5 at 375px and 17-S7-6 at 375px); the letter
  vertically centered, as today, at the new sizes (10 failed: every
  17-S7-5, -6 and -7 case, the two guards included).
- `tsc` and ESLint pass on the proposed and amended tests.

## Repo paths

Acceptance (immutable after freeze): `e2e/larger-grid.spec.ts` and the
nine amended specs above.

Runtime:

- `src/components/grid/PuzzleGrid.tsx`: the pitch, letter and number
  sizes.
- `src/components/grid/LetterCell.tsx` and `CellNumber.tsx`: their
  positions in the cell.
- `src/components/grid/PuzzleGridEditor.tsx`, `PuzzleTitle.tsx`
  (`src/components/puzzle/`) and `HintSkeleton.tsx`: 700px and the
  1092px threshold.
- `src/components/play/PlayPuzzle.tsx`: 700px and the 1382px threshold.
- `src/components/style-guide/GridExamples.tsx` and
  `src/app/style-guide/page.tsx`: `sg-grid-corner` and the 700px samples.
- `playwright.config.ts`: a comment only ("about 1290px").
- The correction: `src/app/puzzles/[id]/page.tsx` (the builder page's
  padding) and `PlayPuzzle.tsx` (play's), and the three files above.
- This story, `../EPIC.md` (the letter wording, at freeze, if agreed) and
  `../HANDOFF.md`.

Declare any other path before editing it.

## Scope discipline

Only S7. Out of scope: the step controls (S8), Preview Hints (S9), rebus
entry and a rebus's text fitting the letter area (S10), the 1800px main
area, and any layout change other than the grid's width, the thresholds
that follow from it and the correction's narrow side padding.

## Definition of done

- The human approves this specification, its acceptance, the amendments
  and retirements, recorded here and in the handoff. Freeze on `main` in
  a specification-only commit before any runtime change.
- Frozen acceptance is unchanged after freeze.
- `npm run verify` exits 0, and the full `npm run test:e2e` suite exits 0.
- The correction approved, independently reviewed and frozen in its own
  specification-only commit before its runtime change.
- The human's visual check of every size at 700px and on a phone.
- Delivered on `main` and the handoff updated with observed results.

## Pending questions

None. Both were answered by the human on 2026-11-01: numbers scale with
the cell with no floor and no cap, as the NYT's board does; the EPIC's
wording is corrected to the measurement at freeze. The human approved
the draft as a whole the same day.
