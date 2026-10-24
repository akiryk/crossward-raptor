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

**F3 is done** and pushed on `main`. The human settled the
[story](stories/13-F3-button.md)'s pending questions and approved it on
2026-10-24. It was frozen in specification-only commit `58cc471`, which
added `e2e/buttons.spec.ts` and `src/components/ui/button-source.test.ts`,
retired the D2-1 danger case, amended F1's two style maps and updated the
EPIC. `Button` now has four types (normal, numbered, large, alternate) and a
`selected` prop. All buttons are pills (new `--radius-pill`), 32px tall,
and large is 50px. Numbered buttons show a white number circle. Alternate
is gray, and its selected look matches its hover. There are three new
color styles: `inverse`, `line-dark` and `button-alternate-hover`. Danger
is gone, and every call site uses the new variant names.

**F4 is approved and frozen; implementation in progress** (2026-10-24).
The human approved the [story](stories/13-F4-modal.md) as written on
2026-10-24. It is frozen in a specification-only commit on `main` with
`e2e/modal-design.spec.ts`, `src/components/ui/modal-source.test.ts`, the
one-line `STYLES` amendment in `e2e/color-tokens.spec.ts` and
`src/app/globals-css.test.ts`, and the EPIC's `modal-background` row and
2px modal-border exception. The runtime starts from the drafting scratch.

## Verification

For the F3 implementation tree, before the commit:

- `npm run verify`: exit 0, 589 Vitest tests passed. The existing lint
  warning in `request-logger/render.ts` remains.
- Full `npm run test:e2e`: 448/448 passed on the first run, using the
  standing guarded local test-reset grant
  ([DEVELOPMENT](../../DEVELOPMENT.md#e2e-environment)).
- Frozen acceptance is unchanged since `58cc471`.
- Visual check at 1280px and 375px (Playwright screenshots): the catalog
  idle and hovered, `/puzzles`, the new-puzzle dialog, and the builder's
  delete and clear-letters confirmations. All match the mockups. Not
  visually checked: publish/unpublish and play's reset confirmation. They
  use the same alternate and normal types that F3-9 asserts.
- Seen, not F3's job: the delete confirmation's two buttons touch, because
  that container has no gap, and they touched before F3 too. Epic 14
  moves delete into a dialog.

## Next action

Show the human the F4 story and get their approval, or revise it. After
approval, freeze on `main` with a specification-only commit: the story
marked approved, the two new test files, the `STYLES` amendment and the
EPIC update. Then commit the runtime, run the full `npm run verify` and
`npm run test:e2e` and the story's visual checks, update this handoff and
push `main`. F5 needs its own go-ahead.

## Resume prompt

Read docs/epics/13-design-system/HANDOFF.md. Get the human's approval of the drafted Design system story F4 (Modal) in docs/epics/13-design-system/stories/13-F4-modal.md; after approval, freeze and implement F4 on main from the uncommitted scratch and push main.
