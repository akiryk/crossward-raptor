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

### What exists

```
docs/epics/
  05-visual-design-epic.md          the visual-design epic, tracked
docs/stories/
  05-D1-tokens-style-guide.md        Story D1's specification, tracked
  05-D1b-style-guide-refinements.md  Story D1b's specification, tracked
  05-D2-core-controls.md             Story D2's specification, tracked
docs/handoffs/
  05-HANDOFF-visual-design.md       this file, tracked
e2e/
  style-guide.spec.ts   Story D1's acceptance test, extended by D1b
                         (hover, grid hairline, grid samples, the
                         --color-complete removal) — do not edit
  shell.spec.ts         Story P0's acceptance test; Story D1b removed
                         --color-complete from its pinned token list
                         (authorized one-line edit)
  controls.spec.ts      Story D2's acceptance test — do not edit
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
                 the real Button/TextInput
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
```

### The gate

`npm run verify` exits 0: `tsc --noEmit` clean, lint clean, **166 Vitest
tests passing across 14 files** (unchanged since Epic 04's PB1a — this
epic is Playwright-only so far). `npm run test:e2e` exits 0: **104
Playwright tests passing across 15 spec files**.

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
