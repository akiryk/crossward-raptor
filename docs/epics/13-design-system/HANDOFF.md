# Design system — Handoff

## Read first

1. This handoff; AGENTS only if not already supplied.
2. [EPIC](EPIC.md), especially its Decisions.

**Only if needed:** [epic 05](../05-visual-design/EPIC.md) for the token
conventions this epic keeps; `src/app/globals.css` for the old tokens.

## Current state (2026-10-24)

The epic is **approved** by the human (2026-10-24), including its proposals,
with the changes recorded in the EPIC: Preview stays a one-label toggle,
Build/Play becomes a radio choice (new Radio component, story F6), the style
guide becomes a plain catalog, `label` replaces the old 12px label now,
default line heights, 10px radii and 1px strokes, and the accepted contrast.
Inputs came from a redesign backlog, a Figma export
(`~/Downloads/components-colors-text-styles.pdf`) and desktop mockups.
Epics 14, 15 and the username epic are outlined in the EPIC but not created.

**F1 is done** and pushed on `main`. The [story](stories/13-F1-color-tokens.md)
was approved by the human (2026-10-24, reconfirmed at freeze) and frozen in
specification-only commit `c5e5d7a`. That commit added
`e2e/color-tokens.spec.ts` and `src/app/globals-css.test.ts` and retired 28
live-editor tests from `e2e/style-guide.spec.ts`, deletion only. The runtime
adds the `--palette-*` `:root` rule and the 33 styles in `@theme static` to
`globals.css`, and replaces the token pane with the `ColorSwatches` catalog.
The six editor components are removed. The old tokens are unchanged. The only
other `globals.css` edit is a `--text-title` comment that named the removed
`SizeControl`. F2 (typography) has no story yet.

## Verification

For the F1 implementation tree, before the commit:

- `npm run verify`: exit 0, 584 Vitest tests passed. One existing lint
  warning remains in `request-logger/render.ts`.
- First full `npm run test:e2e` run: 417 passed, 2 failed in unrelated library
  specs (`library-play` P5 row click, `puzzle-list-layout` L2b-1 publish).
  Both passed when rerun alone.
- Second full `npm run test:e2e` run: 419/419 passed, exit 0.
- These runs used the standing guarded local test-reset grant
  ([DEVELOPMENT](../../DEVELOPMENT.md#e2e-environment)).
- Frozen acceptance is unchanged since `c5e5d7a`.
- The `/style-guide` catalog was checked visually at 1280px and 375px: white
  swatches stay visible, the backdrop swatch reads as translucent gray, and
  nothing overflows.

## Next action

Draft the F2 story (typography) with proposed acceptance on `main`, naming any
frozen tests it supersedes (`typography.spec.ts` and the kept style-guide
token checks). Don't freeze or commit before human approval.

## Resume prompt

Read docs/epics/13-design-system/HANDOFF.md and the F2 section of docs/epics/13-design-system/EPIC.md. Write the F2 story specification and proposed acceptance on main; do not freeze or commit before human approval.
