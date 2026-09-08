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

### What exists

```
docs/epics/
  05-visual-design-epic.md          the visual-design epic, tracked
docs/stories/
  05-D1-tokens-style-guide.md       Story D1's specification, tracked
docs/handoffs/
  05-HANDOFF-visual-design.md       this file, tracked
e2e/
  style-guide.spec.ts   Story D1's acceptance test — do not edit
src/app/
  globals.css   Story D1 — @theme expanded from 10 to 27 tokens; P0's
                 ten names kept unchanged
  layout.tsx    Story D1 — loads Space Grotesk and Inter via
                 next/font/google, exposed as --font-space-grotesk/
                 --font-inter and referenced from --font-display/
                 --font-body/--font-data
src/app/style-guide/
  page.tsx      Story D1 — new; all twelve sections as static/
                 representative markup, renders <TokenPanel />
src/components/style-guide/
  TokenPanel.tsx   Story D1 — new; one token-row per declared token,
                    a color swatch/font sample/radius or size preview
                    per token kind
```

### The gate

`npm run verify` exits 0: `tsc --noEmit` clean, lint clean, **166 Vitest
tests passing across 14 files** (unchanged from Epic 04's PB1a — this
story added no Vitest coverage, it's Playwright-only). `npm run test:e2e`
exits 0: **82 Playwright tests passing across 14 spec files**.

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
