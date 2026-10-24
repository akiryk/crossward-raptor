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
was frozen in `c5e5d7a`. It added the `--palette-*` variables and the 33 color
styles to `globals.css`, and replaced the live token editor on `/style-guide`
with the `ColorSwatches` catalog. The old tokens are unchanged.

**F2 is done** and pushed on `main`. The human approved the
[story](stories/13-F2-typography.md) in full on 2026-10-24, including the
default line heights and the no-retirement finding. It was frozen in
specification-only commit `4b8c401` with `e2e/text-styles.spec.ts` and
`src/app/typography-source.test.ts`. No frozen test was retired. The runtime
loads only Inter, at 400 and 600, and drops Space Grotesk. `--font-display`
now points at Inter. A second `@theme static` block holds the 13 text-style
triples (size, weight, line height) at the story's default line heights, and
the new `label` replaces the old 12px `--text-label`. `/style-guide` gains
the `TextStyles` catalog after Colors. Other old type tokens are unchanged.

**F3 is approved and frozen; implementation in progress.** The human
settled the [story](stories/13-F3-button.md)'s pending questions and
approved it on 2026-10-24. The settled values: pill ends (new
`--radius-pill`), sizes from the mockups, a white number circle in
numbered buttons, and gray alternate colors. Alternate's selected style is
the same as its hover style. Three new color styles: `inverse`,
`line-dark` and `button-alternate-hover`. The freeze commit adds
`e2e/buttons.spec.ts` and `src/components/ui/button-source.test.ts`,
retires one D2-1 case, amends F1's two style maps and updates the EPIC.

## Verification

For the F2 implementation tree, before the commit:

- `npm run verify`: exit 0, 586 Vitest tests passed. The existing lint
  warning in `request-logger/render.ts` remains.
- First full `npm run test:e2e` run: 426 passed, 3 failed in library specs
  unrelated to type (`library-play` P5 row click and Back-to-library,
  `new-puzzle` D6-3 list). Both spec files then passed alone (32/32).
- Second full `npm run test:e2e` run: 429/429 passed.
- These runs used the standing guarded local test-reset grant
  ([DEVELOPMENT](../../DEVELOPMENT.md#e2e-environment)).
- Frozen acceptance is unchanged since `4b8c401`.
- Visual check at 1280px and 375px: the catalog, `/puzzles`, the builder and
  play. Bold text renders with the 600 face, labels are 14px, and the
  stepper badges keep computed weight 700. The catalog's 44px sample wraps
  at 375px.
- Play at 375px already overflowed before F2, checked on the pre-F2 tree:
  the clue columns overlap past the right edge. This is responsive layout
  (epic 15), not F2.

## Next action

Implement F3 against the frozen acceptance on `main`, run `npm run
verify`, the full `npm run test:e2e` and the visual checks, then update
this handoff and push `main`.

## Resume prompt

Read docs/epics/13-design-system/HANDOFF.md and docs/epics/13-design-system/stories/13-F3-button.md. Settle F3's pending questions with the human; after approval, freeze and implement F3 on main and push main.
