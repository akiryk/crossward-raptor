# Visual Design — Handoff

Current state of the crossword-builder project's fifth epic, for an agent or
collaborator picking it up fresh. Read alongside
`docs/epics/05-visual-design-epic.md` and `AGENTS.md`, which remain
authoritative for scope and behavior. This document covers what has actually
happened and the decisions that live only in conversation. See
`01-HANDOFF-crossward.md`, `02-HANDOFF-builder-ui.md`,
`03-HANDOFF-puzzle-management.md`, and `04-HANDOFF-publishing.md` for the
first four epics' handoffs.

Repo: `crossward-raptor`. Branch `main`, tracking `origin/main`.

This epic pauses the publishing epic after its first story (PB1a, complete
— see `04-HANDOFF-publishing.md`). PB1b (the grid-phase preview toggle) is
absorbed into this epic as Story D4; PB2–PB5 resume once this epic
completes.

---

## Where things stand

**Story D1 (token vocabulary and style guide) is complete and committed.**
It's the epic's first slice, and everything after it styles against the
tokens it establishes.

`src/app/globals.css`'s `@theme` block expanded from P0's ten names to a
27-token vocabulary: typefaces, paper/ink at several weights, structural
rule colors, an accent pair, per-grid-phase cell fills, hint-status colors,
radii, and a couple of misc sizing values. All ten of P0's original names
are kept unchanged (`shell.spec.ts` pins them by name), only their values
and the surrounding set changed. `src/app/layout.tsx` now loads Space
Grotesk and Inter via `next/font/google` (re-adding the font-loading
boilerplate P0 deliberately removed), exposing them as `--font-space-grotesk`
and `--font-inter` CSS variables that `--font-display`/`--font-body`/
`--font-data` build on top of — editing `--font-display` etc. directly in
devtools still works, since it's just an ordinary custom property either
way.

A new `/style-guide` route (`src/app/style-guide/page.tsx`) renders all
twelve required sections — tokens, text, buttons, inputs, links, hint rows,
a confirmation, an error message, a tooltip, a stepper, and a build-phase
and preview-phase grid stub — as static markup, not by importing the real
`PuzzleGrid`/`HintsPanel` components (per the story's decision: a style
guide that depends on the component it's meant to inform is circular, and
D1 shouldn't be blocked on D3/D4). The grid sections are deliberately
representative stubs; D3 and D4 render the real thing later. The new
`TokenPanel` component (`src/components/style-guide/TokenPanel.tsx`) lists
every token from a hardcoded array mirroring `globals.css`'s `@theme`
block — there's no runtime-readable source of truth to generate this list
from, since Tailwind v4 compiles `@theme` into CSS at build time.

No test in this story pins a specific colour value, per the epic's
stated convention; assertions check that states are *distinguishable*
(different background, different cursor, a visible border, a focus-state
difference) rather than pinning exact tokens, so the token values stay
freely adjustable via the devtools iteration loop the epic's Conventions
section describes.

**Story D1b (style guide refinements) is complete and committed.** A
follow-up from looking at the rendered D1 output, three corrections to D1's
own output rather than new surface area. `--color-complete` is gone —
identical value to `--color-accent` (`#1F9D6B` under two names, inherited
from the mock), so hint completeness now reads `--color-accent` directly;
removed from `globals.css`, `TokenPanel`'s token list, the one style-guide
sample that referenced it, and (**authorized one-line edit to a committed
acceptance test**) `shell.spec.ts`'s pinned token list. Hover states landed
for the first time — `--color-accent-hover` was declared in D1 but never
used; the primary button, quiet button, and a link in the new `sg-hover`
section now use it (and `--color-hover-tint` for the quiet button), while
the disabled button deliberately gets no hover styling at all, since it
isn't interactive. `sg-hover` physically *contains* the same
`sg-button-primary`/`sg-button-disabled` elements D1's own unscoped
assertions already query — not a duplicate pair — since Playwright's
strict-mode `getByTestId` would otherwise resolve two elements for both
that query and D1b's own scoped one. The grid samples were rebuilt around
the technique the mock actually uses: a `data-testid="sg-grid"` container
painted `--color-grid-line` with `gap: var(--grid-line-width)`, and
`data-testid="sg-cell"` cells with no border of their own — the gap alone
is the hairline, exactly one pixel of one colour regardless of what's on
either side, which per-cell borders couldn't guarantee. Cells are fixed
squares (`h-10 w-10`) so letters and numbers never resize them. Both
samples now show identifiable states via `data-cell-state` (`empty`,
`letter`, `black`, `required`, `cursor`, `symmetric-hint`) with a
`data-testid="sg-cell-number"` badge on numbered cells, replacing D1's
blank placeholder cells. Still static markup — D3 and D4 render the real
thing.

**Story D2 (core controls) is complete and committed.** Applies D1's
tokens to the real app via two new shared components,
`src/components/ui/Button.tsx` (`primary`/`quiet`/`danger` variants) and
`src/components/ui/TextInput.tsx` — every existing button and text input
in the app now goes through one of these rather than growing its own
classes. Danger uses `--color-required` (already established as the
error/attention colour by D1b's `sg-error` sample) with a
`hover:brightness-90` filter rather than a dedicated hover token, since
`--color-required` has no `-hover` companion and this story adds no new
tokens. `TextInput`'s border is subtle (`--color-rule`) by default and
strengthens to `--color-accent` on both hover and focus, uniformly for
every instance — this is what makes the puzzle title's edit affordance
"always visible, not hover-only" per the story's decision, without
needing per-site typography overrides the component's contract has no
room for; the title lost its previous oversized heading-style type
(`font-display text-2xl font-bold`) as a direct consequence, since
`TextInput` has one canonical look and the story is explicit that this is
one styling decision made once, not per-site styling.

Delete moved out of the editor entirely into a `data-testid="danger-zone"`
region at the end of the puzzle detail page, now the only thing in it.
`data-testid="editor-actions"` groups the editor's ordinary controls
(`clear-letters-button`, `enter-hints-button`) with a real gap between
them. **`src/components/grid/PuzzleGridEditor.tsx` needed a small edit to
add that wrapper, despite not being listed in this story's Repo
paths** — `editor-actions` has to physically contain both testids, and
they're rendered as siblings only there (`PhaseControls` owns
`enter-hints-button`, `ClearLettersButton` owns `clear-letters-button`).
Confirmed via the story's own markup contract and acceptance tests before
making the change, not guessed.

`src/app/style-guide/page.tsx` became a client component (`useState` for
a real, controlled `sg-input` demo, since `TextInput.onChange` is a
required prop) and now renders the real `Button`/`TextInput` in every
place D1/D1b had hand-styled markup standing in for them (`sg-hover`'s
three buttons, `sg-input`, `sg-confirmation`'s confirm/cancel) — every
existing testid preserved exactly, `e2e/style-guide.spec.ts` passes
unmodified as the story required. `sg-input-focused-example` and
`sg-tooltip`'s trigger button were left as hand-styled markup: neither is
referenced by any test, and neither is one of the app's real migrated
controls (the focused-example is a decorative side-by-side demo,
sourced by neither `Button` nor `TextInput`'s contract).

**Story D1c (grid hairline: outer edge and real measurement) is complete
and committed.** A second D1 follow-up, from looking at the corrected D1b
samples: white cells against the white page had no visible edge at all,
since the inner hairline only ever showed up *between* cells, never around
the outside. Fixed with `padding: var(--grid-line-width)` on the `sg-grid`
container — its background now shows around the perimeter exactly as it
already did between cells, so every cell edge is bounded regardless of
what's adjacent to it or what the cell itself contains.

The more consequential change is in the tests, not the markup.
`e2e/style-guide.spec.ts`'s old hairline assertions checked
`getComputedStyle(container).gap` — CSS that was never actually wrong
(D1b's real bug left `rowGap`/`columnGap` both reporting a correct `1px`
the entire time the render was broken by ~13px). Those assertions are
**removed, not kept alongside**: a new `measureSample` helper reads
`getBoundingClientRect()` on the actual cells and container, checking the
real pixel distance between adjacent cells and between the outermost
cells and the container's edge, within half a pixel. That holds regardless
of *how* the spacing is achieved (gap, padding, track sizing), which is
what's actually worth testing — a declared-CSS assertion describes intent,
not result, and D1b proved intent and result can silently diverge.
`docs/LEARNINGS.md` gained entry 7 documenting the incident this story is
a direct response to.

**Story D3 (build-phase grid) is complete and committed.** Makes the real
grid look like the style guide's build sample. A new pure
`src/lib/cell-appearance.ts` exports `cellAppearance` (one derived
`CellAppearance` value per cell — `black` beats `selected` beats `slot`
beats the cell's own content — rather than a pile of booleans checked in
JSX) and `symmetricHintKeys` (Story A's `symmetricCounterpart`, unused by
any UI until now, applied per render: a lettered cell's empty counterpart
renders white as a suggestion, never stored). Numbering now derives from
the *effective* grid — `buildCellNumberLookup(convertEmptyCellsToBlack(
grid))` — computed at `PuzzleGrid`'s call site rather than inside
`buildCellNumberLookup` itself, so that function's own committed tests
(which assert over raw grids) stay meaningful. `PuzzleGrid` adopted D1c's
container-background hairline technique verbatim (`bg-grid-line`, `gap`
and `padding` both `--grid-line-width`, `grid-template-rows` added
alongside the existing `grid-template-columns` so row and column tracks
divide evenly the same way) — cells carry no border of their own.
Backgrounds live on the `grid-cell` wrapper `div`, not `GridCell`'s inner
leaf, since that wrapper is what the hairline's gap/padding surrounds and
the only element any geometry or background assertion has reason to
inspect; `GridCell`/`EmptyCell`/`LetterCell`/`BlackCell` dropped the
`highlight` prop entirely; `BlackCell` needed no functional change beyond
that (it already had no border).

Two contradictions surfaced during implementation, both resolved with the
user before proceeding rather than guessed past:

1. The Decisions section requires reusing `convertEmptyCellsToBlack`
   (PB1a, `src/engine/phase.ts`) at `PuzzleGrid`'s call site, but that
   function wasn't exported, and Scope discipline separately claimed "no
   changes to `src/engine/`... consumed as they are." Resolved by
   exporting it — a visibility-only change, no behavior difference, no
   existing test affected.
2. `e2e/grid-rendering.spec.ts` (Story P2's frozen test, not in this
   story's Repo paths) asserted 5 numbered cells under raw-grid numbering
   on a fixture where D3's own effective-geometry decision correctly
   produces exactly 1 (the fixture's two empty cells become black before
   numbering runs, per `convertEmptyCellsToBlack`, leaving one run in
   each direction, both starting at `(0,0)`) — contradicting D3's own
   Definition of Done ("every other spec passes unmodified"). The
   expected count and resolved coordinate were derived by hand from
   `convertEmptyCellsToBlack` and `numberGrid`'s rules, then confirmed
   against the actual render, before narrowing the assertion to match.
   Recorded in `docs/stories/05-D3-build-grid.md`'s new Test changes
   section.

**Story D4 (preview and published grid) is complete and committed.** It
absorbs PB1b from the publishing epic — the grid-phase preview toggle
showing the grid as it will look once published. `cellAppearance` gained
an optional `mode?: GridMode` parameter (`'build'` default) rather than a
second function, so D3's committed cases call it exactly as before;
preview mode ignores selection and slot entirely (the builder's cursor
state isn't the puzzle's), and answers only: black stays black, lettered
cells are letters, empty cells go black, and empty symmetric
counterparts become the new `required` appearance (`--color-required`,
already established, no new token). New `PreviewToggle.tsx` renders a
`<Button variant="quiet">`, shown only in grid phase (`PuzzleGridEditor`
gates it on `phase === 'grid'`, alongside the other `editor-actions`
controls); preview state is a plain `useState` in `PuzzleGridEditor`,
never persisted, so a reload always returns to build view. `PuzzleGrid`
gained a `mode?: GridMode` prop (default `'build'`), threading straight
into `cellAppearance` and onto a new `data-grid-mode` attribute on the
container.

D3's architecture — background centralized on the `grid-cell` wrapper
via a single `APPEARANCE_BG` lookup in `PuzzleGrid.tsx`, with
`GridCell`/`EmptyCell`/`LetterCell`/`BlackCell` reduced to pure
dispatch/layout — meant the `required` state needed only one new entry
in that lookup table. None of those four leaf components changed at
all, despite being named in this story's own Repo paths (an assumption
carried over from before D3's refactor); a `required` cell is still
content-wise just an empty active cell, so it still renders through the
same `EmptyCell` branch, only with a different background. No repeat of
D3's frozen-test surprise this time — `npm run test:e2e` passed clean on
the first run across every spec, `grid-rendering.spec.ts` included.

**Story D5a (editor layout) is complete and committed.** It fixes the
complaint that started the epic — a 15×15 ran off the bottom of the
screen, with hints further down still. `PuzzleGridEditor` now wraps the
grid and hints panel in a new `editor-layout` div (`flex flex-col
lg:flex-row`, `lg` = Tailwind's 1024px breakpoint: side by side above
it, stacked below). `grid-region` sizes the grid via a `min()` of a
height-based term (`calc((100vh - 260px) * cols/rows)`, the 260px
allowance reserved for the title/phase-line/editor-actions row above
it) and a hard maximum (640px) as an inline style, composed with a
responsive `max-width` class (`max-w-full` stacked, `lg:max-w-[45%]`
side-by-side) for the width-based term — CSS's own `min(width,
max-width)` resolution combines all three without needing them in one
expression. `hints-region` caps its own height to the same formula and
scrolls internally (`overflow-y-auto`), so a long hint list no longer
grows the page.

Neither `page.tsx` nor `HintsPanel.tsx` needed changes despite being
named in the story's Repo paths — sizing and scrolling are fully owned
by the two new wrapper divs in `PuzzleGridEditor.tsx`, the same
centralize-in-the-wrapper pattern D3 established for cell appearance.
One real bug surfaced only at the phone viewport: `PuzzleGrid`'s grid
tracks were bare `repeat(n, 1fr)`, and `1fr` tracks carry an implicit
`min-height: auto` sized to their content — at small enough cell sizes,
a letter's default line-height forced rows taller than the width,
breaking squareness. Fixed by switching to `repeat(n, minmax(0, 1fr))`,
the standard fix for this class of bug (same family as the column-
shrink issue D1c fixed for the style guide, now hitting rows in the
real grid).

**Story D5b (stepper navigation) is complete and committed.** It adds
the build → clues → publish header and makes its labels the primary
navigation, alongside (not replacing) the existing continue button. New
`src/lib/stepper.ts` exports `stepStates`, a pure function of `{ phase,
hintsComplete }` returning the three steps in order, each carrying a
derived `status` and — only when `unavailable` — a `reason` explaining
why. New `Stepper.tsx` renders them, revealing a step's reason on click
rather than hover (touch devices have no hover), and calling back up to
`PhaseControls` only for clicks on a non-unavailable step. `PhaseControls`
now computes `hintsComplete` via the engine's existing `hintsComplete
(puzzle)` (already used by `puzzle-summary.ts` for the list page) rather
than a new rule, and the continue button drops to the `quiet` variant —
it's no longer the most prominent thing on the page during the phase
where leaving is least wanted.

Adding the stepper grew the header above `editor-layout`, which broke
D5a's own frozen fit test at 1280×800 by a few pixels — `grid.bottom`
exceeded the viewport because D5a's `VERTICAL_ALLOWANCE_PX` constant
didn't anticipate the new row. Bumped from 260 to 300; this is the
exact class of thing D5b's own DoD item 3 says to check for, not a
layout redesign (D5a's arrangement itself is untouched). Separately,
`persistence.spec.ts`'s new-puzzle test failed under direct `npx
playwright test` invocation, mid-session, with no network request ever
firing on the button click — bisected via `git stash` to rule out a
D5b regression, then traced to a stale `next dev -p 3100` process left
over from bypassing `npm run test:e2e`'s `pretest:e2e` port/lock-clearing
hook (see the port/lock note earlier in this file and in `AGENTS.md`).
Running through `npm run test:e2e` as intended made it disappear —
no code was at fault.

### What exists

```
docs/epics/
  05-visual-design-epic.md          the visual-design epic, tracked
docs/stories/
  05-D1-tokens-style-guide.md        Story D1's specification, tracked
  05-D1b-style-guide-refinements.md  Story D1b's specification, tracked
  05-D2-core-controls.md             Story D2's specification, tracked
  05-D1c-grid-hairline.md            Story D1c's specification, tracked
  05-D3-build-grid.md                Story D3's specification, tracked;
                                       gained a Test changes section for
                                       the grid-rendering.spec.ts edit
  05-D5a-editor-layout.md             Story D5a's specification, tracked
  05-D5b-stepper.md                    Story D5b's specification, tracked
docs/handoffs/
  05-HANDOFF-visual-design.md       this file, tracked
docs/
  LEARNINGS.md   Story D1c — entry 7, measuring rendered geometry
                  instead of declared CSS for visual bugs
e2e/
  style-guide.spec.ts   Story D1's acceptance test, extended by D1b
                         (hover, grid hairline, grid samples, the
                         --color-complete removal). Story D1c — the
                         gap/background-based hairline assertions
                         replaced with a measureSample helper reading
                         getBoundingClientRect — do not edit
  shell.spec.ts         Story P0's acceptance test; Story D1b removed
                         --color-complete from its pinned token list
                         (authorized one-line edit)
  controls.spec.ts      Story D2's acceptance test — do not edit
  build-grid.spec.ts    Story D3's acceptance test — do not edit
  grid-rendering.spec.ts  Story P2's acceptance test; Story D3 narrowed
                         its numbered-cell assertion from 5 (raw-grid
                         numbering) to 1 at (0,0) (effective-geometry
                         numbering) -- authorized edit, derived and
                         confirmed against the render, not guessed
  editor-layout.spec.ts  Story D5a's acceptance test — do not edit
  stepper.spec.ts        Story D5b's acceptance test — do not edit
src/app/
  globals.css   Story D1 — @theme expanded from 10 to 27 tokens; P0's
                 ten names kept unchanged. Story D1b — removed
                 --color-complete (identical value to --color-accent)
  layout.tsx    Story D1 — loads Space Grotesk and Inter via
                 next/font/google, exposed as --font-space-grotesk/
                 --font-inter and referenced from --font-display/
                 --font-body/--font-data
src/app/style-guide/
  page.tsx      Story D1 — new; all twelve sections as static/
                 representative markup, renders <TokenPanel />. Story
                 D1b — sg-hover wraps the primary/quiet/disabled buttons
                 and a link with hover styling; grid samples rebuilt on
                 a shared GridSample helper using the container-gap
                 hairline technique with real per-state cells; the
                 --color-complete hint-row reference fixed to
                 --color-accent. Story D2 — client component now
                 (useState for a controlled sg-input demo); sg-hover's
                 buttons, sg-input, and sg-confirmation's buttons render
                 the real Button/TextInput. Story D1c — sg-grid gains
                 padding: var(--grid-line-width) so the hairline
                 surrounds the outside too, not just divisions between
                 cells
src/app/puzzles/
  page.tsx            Story D2 — page-heading testid + heading styling;
                       list rows get cursor-pointer and a hover state
  NewPuzzleButton.tsx  Story D2 — renders <Button>
  [id]/page.tsx        Story D2 — DeletePuzzleButton moved into a new
                       danger-zone region at the end of the page
src/components/style-guide/
  TokenPanel.tsx   Story D1 — new; one token-row per declared token,
                    a color swatch/font sample/radius or size preview
                    per token kind. Story D1b — --color-complete entry
                    removed
src/components/ui/
  Button.tsx      Story D2 — new; primary/quiet/danger variants, no
                   hover classes at all when disabled
  TextInput.tsx   Story D2 — new; subtle border strengthening to
                   --color-accent on hover and focus, uniformly
src/components/puzzle/
  PuzzleTitle.tsx        Story D2 — renders <TextInput>, dropped its
                          previous oversized heading-style typography
  DeletePuzzleButton.tsx Story D2 — renders <Button variant="danger">
                          (trigger, confirm) / quiet (cancel)
src/components/grid/
  ClearLettersButton.tsx Story D2 — renders <Button variant="quiet">
                          (trigger) / danger (confirm) / quiet (cancel)
  PhaseControls.tsx      Story D2 — renders <Button> (enter-hints) /
                          danger (confirm) / quiet (cancel)
  HintsPanel.tsx         Story D2 — hint inputs render <TextInput>
                          with a derived "N Across/Down clue" aria-label
  PuzzleGridEditor.tsx   Story D2 — adds the editor-actions wrapper div
                          around PhaseControls/ClearLettersButton;
                          not listed in the story's Repo paths but
                          required for editor-actions to physically
                          contain both testids (see "Where things
                          stand" above)
  PuzzleGrid.tsx         Story D3 — container-background hairline
                          (bg-grid-line, gap + padding, grid-template-
                          rows added); numbers from
                          buildCellNumberLookup(convertEmptyCellsToBlack(
                          grid)); computes cellAppearance/
                          symmetricHintKeys per cell and puts the
                          resulting background on the grid-cell wrapper
  GridCell.tsx           Story D3 — dropped the highlight prop; no
                          longer needs appearance either, since
                          background moved to PuzzleGrid's wrapper
  EmptyCell.tsx          Story D3 — dropped highlight and its own
                          background/border; pure layout now
  LetterCell.tsx         Story D3 — same as EmptyCell
  BlackCell.tsx          Story D3 — dropped its own bg-foreground
                          (now on the wrapper); otherwise unchanged
  PreviewToggle.tsx      Story D4 — new; <Button variant="quiet">,
                          toggles build/preview
  PuzzleGrid.tsx         Story D4 — adds mode? prop (default 'build'),
                          threaded into cellAppearance and onto a new
                          data-grid-mode attribute
  PuzzleGridEditor.tsx   Story D4 — adds isPreviewing useState (not
                          persisted); renders PreviewToggle in
                          editor-actions, gated on phase === 'grid'
  PuzzleGrid.tsx         Story D5a — grid-template-columns/rows switched
                          from bare 1fr to minmax(0, 1fr), so a small
                          cell's letter text can't force a track past the
                          aspect-ratio-derived square size
  PuzzleGridEditor.tsx   Story D5a — grid and hints wrapped in a new
                          editor-layout div (grid-region, hints-region);
                          grid-region sizes via min(height-based term,
                          640px hard max) composed with a responsive
                          max-width class; hints-region caps height to
                          the same formula and scrolls internally
  Stepper.tsx            Story D5b — new; renders the three steps,
                          reveals a step's reason on click (not hover)
  PhaseControls.tsx      Story D5b — renders <Stepper>; continue button
                          drops to the quiet variant; now takes a
                          hintsComplete prop
  PuzzleGridEditor.tsx   Story D5b — passes hintsComplete (via the
                          engine's hintsComplete(puzzle)) to
                          PhaseControls; VERTICAL_ALLOWANCE_PX bumped
                          260 -> 300 for the taller header
src/engine/
  phase.ts   Story D3 — convertEmptyCellsToBlack (PB1a) exported;
              visibility only, no behavior change, no existing test
              affected (see "Where things stand" above)
src/lib/
  cell-appearance.ts   Story D3 — new; cellAppearance, symmetricHintKeys
                        Story D4 — cellAppearance gains optional mode?
                        param ('build' default); preview mode ignores
                        selection/slot, adds the 'required' appearance
  stepper.ts           Story D5b — new; pure stepStates(phase,
                        hintsComplete) -> readonly Step[]
```

### The gate

`npm run verify` exits 0: `tsc --noEmit` clean, lint clean, **196 Vitest
tests passing across 16 files**. `npm run test:e2e` exits 0: **136
Playwright tests passing across 19 spec files**.

---

## Current status

Story D1 is complete. Still open in this epic, per
`docs/epics/05-visual-design-epic.md`'s suggested build order: D7 (remove
duplicate — next, since it's a deletion and doing it early saves D2/D5
from styling a button about to disappear), then D2 (core controls), D3
(build-phase grid, including the numbering-from-effective-geometry fix
via `numberGrid(convertEmptyCellsToBlack(grid))`), D4 (preview/published
grid, absorbing PB1b), D5 (page layout), and D6 (new-puzzle creation
dialog, last).
