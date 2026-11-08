# Story S2 — The progress bar

With Preview on, in a daily or Sunday puzzle's build phase, the toggle
row shows a message, a slim bar with the 80–85% zone and "N% complete"
in Rebus's place, at every width.

**Status: Approved and frozen 2026-11-08** by the orchestrating
session under the human's delegation, after an independent review of
the draft whose findings were all addressed ([handoff](../HANDOFF.md#orchestration)).
Builds on S1 (`src/engine/completion.ts`, merged 310bc94).

**Blast radius: medium, off the risk paths.** One new component in
`src/components/grid/`, the editor's toggle row, four color styles and
their style-guide swatches. Direct delivery to `main`.

## What the code does today

- **The toggle row** (`ToggleRow`, `BuilderSteps.tsx`) is the grid's
  width (`--grid-max`: 620px for mini, midi and daily, 700px for Sunday,
  `src/lib/grid-max.ts`), `bg-toggle-row`, `flex items-center
  justify-between`, 48px tall with 16px padding from a 748px window, 40px
  with 12px below. Below 748px the page has 8px of padding a side, so the
  row is the window less 16px below 636px (daily) or 716px (Sunday).
- In the build phase (`PuzzleGridEditor.tsx`) it holds `PreviewToggle`
  at the left and, at the right, Lock Word (`LockWordControl`, 21-S5,
  only without the lock button's room; with Preview on it's `invisible`,
  keeping its room) and `RebusControl` (`link`). The hints phase holds
  Lock Grid Letters and Rebus; a published puzzle's row holds nothing.
- `isPreviewing` is editor state, not saved; `previewKey` and
  `closeRebusEntry` place letters and rebuses with Preview on. Every
  edit, load and Reset Grid (`handleConfirmStartOver`) changes
  `state.grid`, which S1's `completionCount` reads.
- Colors: palette variables and `@theme` styles in `src/app/globals.css`,
  each style listed in `src/app/globals-css.test.ts`,
  `e2e/color-tokens.spec.ts` and the style guide
  (`src/components/style-guide/ColorSwatches.tsx`).

## Decisions

From the EPIC (human):

- **Preview only, daily and Sunday only,** build phase only. With Preview
  off, in a mini or midi, the hints phase or a published puzzle, the row
  is as today (Rebus included).
- **Rebus is hidden with Preview on** wherever the progress shows.
- **Lettered cells over all cells,** rounded down, recomputed from the
  grid on every edit path; toggling Preview never changes it.
- **Ready at 80%:** "Keep building." below, "Ready to create hints!" at
  and above.
- **Layout:** Preview at the left, unchanged; at the right on one line the
  message, the bar, "N% complete"; everything vertically centered; the
  row's `bg-toggle-row`.
- **Text:** the message `body-normal`, `primary`; the percentage
  `body-small`, `muted`.
- **The bar:** 12px high, about 180px wide on a wide row, a white track
  with a thin border; the fill from 0 to the exact value, `gray-200`
  below 80%, `interactive-dark` at and above; the 80–85% zone an
  `orange` block over the fill. No ticks, no control.
- **Narrower:** free space goes first, then the bar shrinks to 80px; then
  the message moves above the bar (the row grows taller); then the
  message's font gets smaller.

Proposed by the agent, approved with the EPIC:

- Not stored; locked words count like other letters; the track's border
  1px `gray-200`, square corners; no animation; an open rebus entry
  behaves as today; a `progressbar` named "Grid completion" with
  `aria-valuenow` the shown percentage, the ready state in text; new
  semantic color styles, no new palette color; breakpoints and the
  smaller font set here from measured widths.

### Delegated decisions (drafting agent)

**S1's functions, not new rules.** The percentage text, `aria-valuenow`,
the message and the fill's ready color come from S1's
`completionPercent` and `isReadyForHints` (`READY_PERCENT`) in
`src/engine/completion.ts`; the fill's width from `completionCount`'s
`lettered / total`. No rounding or threshold is reimplemented in the
component.

**Measured widths.** Measured on `main` (68dfe95) in the E2E harness's
Chromium with the app's Inter, by a throwaway Playwright test (not kept)
that read the toggle row and `PreviewToggle` boxes at 13 window widths
and laid out spans in the `--text-body-*` sizes:

| Item | Width |
| --- | --- |
| Preview toggle (pill, 8px, "Preview") | 100.5px |
| "Keep building." / "Ready to create hints!", `body-normal` | 94.2 / 143.7px |
| the same, `body-small` | 80.7 / 123.2px |
| "N% complete", `body-small`, widest (100%) / 0% | 87.8 / 75.4px |

**Sizes and gaps** (from the mockup at its 2× scale: about 12px from the
message to the bar, 8–10px from the bar to the percentage):

- The message is in a **144px box**, text right-aligned (so it ends 12px
  before the bar, as mocked); the percentage in an **88px box**, text
  left-aligned, the box at the row's right padding. The boxes hold the
  widest texts, so **the bar never moves or resizes** when the message
  or the percentage changes (no jump at 80%).
- **12px** from the message box to the bar, **8px** from the bar to the
  percentage box, **at least 16px** between Preview and the message box
  (the free space).
- One line needs Preview + 16 + 144 + 12 + bar + 8 + 88 = 368.5px + bar.
- The message and the percentage are `whitespace-nowrap`: neither wraps,
  whatever the font's metrics.

**Breakpoints** (the row width; window widths for both sizes, since the
row is the window less 16px there):

| Row (window) | Layout |
| --- | --- |
| ≥ 474px (≥ 490px) | One line. Bar = min(180, content − 368.5): 180px wherever the row is 620/700px (every window from 589px), 131.5px at 540px, 81.5px at 490px. The 81.5px at the switch is a deliberate ~1.5px margin over the 80px minimum, so rounding or a slightly wider font never pushes the bar below it. |
| 288–473px (304–489px) | Two lines, message font `body-normal`. |
| < 288px (< 304px) | Two lines, the message `body-small` in a 124px box. |

**Two lines** (the "message above the bar" layout):

- The row is **64px** tall: 8px padding, a 24px line, 8px, a 16px line,
  8px. Line 1: Preview at the left (where a 40px row has it: centered
  20px down), the message box at the right edge, centered with Preview.
  Line 2: the bar and the percentage box at the right edge, centered with
  each other; the bar min(180, content − 96).
- **Why not Preview beside a two-line message-and-bar stack:** measured,
  that needs 100.5 + 16 + 80 + 8 + 88 = 292.5px of content (a 333px
  window) with the bar at its 80px floor, so at 320px (a width the suite
  tests) the bar would fall below 80px; making the message smaller
  wouldn't help, since the bar line is the wider one. With the bar on its
  own line, every supported width keeps the bar at 180px (164px at
  300px), and the message's width is what binds, so the human's last
  step, a smaller font, is the one that applies.
- **The tradeoff:** both lines are right-aligned, so "Keep building."
  (94.2px, ending at the edge) starts 1.8px right of the bar's end (which
  is 96px in from the edge): at 375px, and at every two-line width, it
  sits above the 8px gap and the percentage rather than over the bar.
  "Ready to create hints!" (143.7px) reaches about 48px over the bar's
  right end. Putting the message over the bar would mean aligning it to
  the bar rather than the edge, beside Preview, which is the stacked
  alternative above that can't keep the bar's 80px minimum at 320px.
  Chosen for that minimum, and because a right edge shared by the
  message and the percentage keeps both lines neat.
- **The smaller font** is the existing `body-small` (12px/16px), below a
  288px row (304px window), where `body-normal` stops fitting beside
  Preview (it needs a 284.2px row). It fits down to a 264px row (280px
  window), narrower than any width the suite tests (320px).

**Other details:**

- **Rebus and Lock Word** aren't rendered (no room kept) wherever the
  progress shows; in a mini or midi with Preview on, Lock Word stays
  `invisible` as today.
- **Fill and zone** are drawn inside the track's 1px border: the fill
  from the inside's left edge, width = lettered ÷ total of the inside
  (exact, not the rounded percentage), the zone at 80–85% of the inside,
  both the inside's full 10px height; at 0% the fill takes no room. No
  transition on the fill, under any motion preference.
- **Color styles** (new, in `@theme`): `progress-track` → white,
  `progress-fill` → gray-200, `progress-fill-ready` → interactive-dark,
  `progress-zone` → orange. The border uses the existing `line-muted`
  (gray-200). Added to the style guide's swatches.
- **Accessibility:** `aria-valuemin` 0, `aria-valuemax` 100, no
  `aria-valuetext`; no live region (it would announce every keystroke);
  DOM order message, bar, percentage. Fill and zone are inside the
  progressbar, presentational.
- **An unplaced rebus entry** doesn't count until placed (the grid
  doesn't change until then).
- **Hooks:** `build-progress` (the group) holding
  `build-progress-message`, `build-progress-bar` (the progressbar, the
  track), `build-progress-percent`; the bar holds `build-progress-fill`
  and `build-progress-zone`. Not rendered at all where not shown.
- **A frozen test changes:** 21-S5-4 (`e2e/lock-word-toggle-row.spec.ts`)
  expected Rebus still shown with Preview on in a daily; the EPIC hides
  it, so S2's acceptance amends that one assertion to `toHaveCount(0)`
  (as 18-S5 amended earlier specs at its freeze). The amendment rests on
  the human's EPIC answer #1 ("Yes [hide Rebus with Preview on]"), the
  approved EPIC, and the independent review of this specification. Nothing else in the
  suite checks the row with Preview on in a daily or Sunday.

## Non-goals

- Anything with Preview off, in a mini or midi, in the hints phase,
  after publishing or in play.
- A second measure, word counts or other NYT checks; gating Create Hints
  or changing its dialog.
- Ticks, a slider or any way to set the value; animation.
- Changing Preview's black squares, Locked words, Rebus's behavior (Escape
  still opens a rebus with Preview on) or the engine (S1's module is used
  as is).

## Acceptance (frozen 2026-11-08)

Viewports: 1440px wide unless stated; 375px a phone. Grids are seeded
with their first N cells (reading order) lettered. Opening a puzzle
waits for `document.fonts.ready` after the editor is ready, since text
widths are measured. The saved count is read with S1's
`completionCount`. Do not edit these
files to match an implementation.

### `e2e/build-progress.spec.ts` (new)

1. **22-S2-1 where it shows:** a daily and a Sunday (90 letters), at
   1440px and 375px: Preview off, no progress, Rebus (and Lock Word at
   375px) shown. Preview on: `build-progress` in the toggle row, the
   progressbar shown, right of Preview, its parts in the order message,
   bar, percentage; Rebus and Lock Word take no room. Preview off again:
   gone, Rebus (and Lock Word) back.
2. **22-S2-2 not elsewhere:** a full mini and midi with Preview on: no
   progress, Rebus shown. A daily in the hints phase, Lock Grid Letters
   off and on: none, Rebus shown. A full daily with Preview on (100%)
   through 2 Create Hints and the dialog's confirm: none in the hints
   phase. A published daily: none.
3. **22-S2-3 the message and the percentage:** daily 0, 2, 3, 90, 179,
   180, 224, 225 letters → 0, 0, 1, 40, 79, 80, 99, 100%; Sunday 352,
   353, 441 → 79, 80, 100%. "Keep building." below 80, "Ready to create
   hints!" from 80; "N% complete"; the progressbar named "Grid
   completion", `aria-valuenow` N, min 0, max 100.
4. **22-S2-4 the bar:** at 0, 90, 179, 180, 200, 225 of 225: 12px tall,
   1px solid gray-200 border, white, square corners; the fill from the
   inside's left edge to lettered ÷ 225 of it (none at 0), 10px tall,
   gray-200 below 180 and interactive-dark from 180, no transition; the
   zone at 80–85% of the inside, 10px, orange, and the element at its
   center (drawn over the fill, at 88.9% and 100% too). No transition
   with `reducedMotion` emulated as `no-preference` (the suite otherwise
   runs reduced). The message 14px / 20px / 400 `primary`; the
   percentage 12px / 16px / 400 `muted`; both `white-space: nowrap`.
5. **22-S2-5 edit paths** (daily, 179, Preview on): 79%; typing into
   empty 14,11 → 80% ready; deleting it → 79%; overtyping 0,0 → 79%; a
   rebus HEART at 14,11 → still 79% while the entry is open, 80% once
   placed; Preview off and on → 80% (and none while off); a Backspace at
   0,0 with Preview off → 79% once back on; after the autosave (179
   saved), a reload: no progress until Preview on, then 79%; Reset Grid
   → 0%, no fill.
6. **22-S2-6 wide:** daily at 1440px and 760px (row 620px, 48px), Sunday
   at 1440px (700px), daily at 600px (584px, 40px): one line, every part
   centered on the row; bar 180 × 12px; message box 144px, its text
   ending at the box's right, 12px before the bar; percentage box 88px,
   8px after the bar, its text at its left, the box at the row's right
   padding; at least 16px between Preview and the message box; nothing
   outside the row's content box; no row overflow.
7. **22-S2-7 narrower:** daily at 540px and 490px: one line as in 6, the
   bar the room left (131.5 and 81.5px, under 180 and at least 80);
   typing the 180th letter shows "Ready to create hints!" and leaves the
   bar's box exactly where it was. Sunday at 540px the same.
8. **22-S2-8 two lines:** daily at 489, 375, 320 and 304px, Sunday at
   375px (at 80%): the row 64px; Preview and the message centered 20px
   down, the message box (144px, 14px text, right-aligned) at the right
   edge, clear of Preview by 16px; the bar and percentage centered 48px
   down, the percentage box at the right edge, 8px after the bar, the
   bar min(180, content − 96) and at least 80px, below the message;
   nothing outside the row. Preview off: the 40px row, Rebus back.
9. **22-S2-9 the smaller font:** daily at 300px: two lines as in 8, the
   message 12px / 16px in a 124px box; the percentage still 12px.

### Amended acceptance

- `src/app/globals-css.test.ts` and `e2e/color-tokens.spec.ts`: the four
  styles above added to `STYLES` (the style guide's swatch count follows).
- `e2e/lock-word-toggle-row.spec.ts`, 21-S5-4 "hidden with Preview on":
  Rebus `toHaveCount(0)` with Preview on (was 1), and a header note.

### Discrimination (2026-11-08, observed on `main` at 68dfe95)

Final run, after the review's revisions:
`npm run test:e2e -- e2e/build-progress.spec.ts
e2e/lock-word-toggle-row.spec.ts -g "22-S2|21-S5-4"`: 10 failed, 2
passed (setup and the guard).

- Fail: 22-S2-1 to 9 (no `build-progress` / progressbar: "element(s) not
  found" or no bounding box). 22-S2-2's mini, midi, hints-phase and Lock
  Grid Letters parts pass first; it fails at the Create Hints part, which
  first expects the progress in the build phase. 21-S5-4 "hidden with
  Preview on" (Rebus is still shown).
- Pass, as a guard: 21-S5-4 "absent in the hints phase".
- `npx vitest run src/app/globals-css.test.ts`: 1 failed ("declares each
  style", `--color-progress-track` missing), 5 passed. An earlier run of
  `e2e/color-tokens.spec.ts`: F1-2 (both) and F1-4 styles fail on the
  missing styles and swatch count, the rest pass.
- Throwaway checks on `main`, none kept in the repo: with the progress
  assertions stubbed out, 22-S2-5's edit steps (save poll and reload
  included) and 22-S2-2's Create Hints steps pass. The layout helpers of
  22-S2-3, 4, 6, 8 and 9 pass against a static mock of this layout
  injected into the row (7 and 8's remaining steps need a live
  component).
- `npx eslint` on the four test files and `npx tsc --noEmit` are clean.

## Repo paths

Acceptance: `e2e/build-progress.spec.ts` (new); amended
`e2e/color-tokens.spec.ts`, `src/app/globals-css.test.ts`,
`e2e/lock-word-toggle-row.spec.ts`. Runtime: a new
`src/components/grid/BuildProgress.tsx`,
`src/components/grid/PuzzleGridEditor.tsx`,
`src/components/grid/BuilderSteps.tsx` (the row's two-line height),
`src/app/globals.css`, `src/components/style-guide/ColorSwatches.tsx`.
Docs: this story, `../HANDOFF.md` (and `../EPIC.md` only if a decision
changes).

**CODE-REVIEW:** none of these is a risk path (S1's engine module is only
imported), so direct delivery to `main`. If the actual diff touches
`src/engine/**` or another risk path, it moves to a branch and PR.

## Definition of done

- Frozen acceptance unchanged after freeze.
- `npm run verify` exits 0 and the full `npm run test:e2e` exits 0.
- Delivered on `main`; the handoff records observed results.
- The human's visual check at the epic's end (HANDOFF), including the
  two-line layout and the decisions above.
