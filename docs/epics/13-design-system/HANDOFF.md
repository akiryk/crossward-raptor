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

**F4 is done** and pushed on `main`. The human approved the
[story](stories/13-F4-modal.md) as written on 2026-10-24. It was frozen in
specification-only commit `b2dfa65` with `e2e/modal-design.spec.ts`,
`src/components/ui/modal-source.test.ts`, the one-line `STYLES` amendment
(`modal-background`) in F1's two style maps, and the EPIC's new style row
and 2px modal-border exception. No frozen test was retired. `Modal` is a
white panel with a 2px white border and 10px corners (new
`--radius-modal`), a yellow header with the `title-3` title and the ✕,
`body-normal` content and a left-aligned footer, confirm first, over
`modal-backdrop`. `ModalActions` renders only its two buttons. Play
reset's footer is confirm first, the builder-name buttons moved into the
footer (save submits via a new `form` pass-through on `Button`), and
play's incorrect and completion dialogs gained an OK button.
`/style-guide` has an `sg-modal` sample.

## Verification

For the F4 implementation tree, before the commit:

- `npm run verify`: exit 0, 592 Vitest tests passed. The existing lint
  warning in `request-logger/render.ts` remains.
- Full `npm run test:e2e`: exit 0, 463/463 passed on the first run, using
  the standing guarded local test-reset grant
  ([DEVELOPMENT](../../DEVELOPMENT.md#e2e-environment)).
- Frozen acceptance is unchanged since `b2dfa65`.
- Visual check at 1280px and 375px (Playwright screenshots from a
  temporary, uncommitted spec): the catalog sample, new-puzzle,
  builder-name, enter-hints, play's incorrect, completion and reset
  dialogs, and the library's reset dialog. All match the story.
- Seen, not F4's job: on the play page at 375px the "Puzzle options"
  button runs past the right edge. The panel clips content taller than
  the viewport (`max-h-full` with the frozen `overflow: hidden`); before
  F4 such a panel overflowed the locked viewport instead. No current
  dialog is that tall.

## Next action

Draft F5 (Input): the story and its proposed acceptance, with
discrimination evidence. Get the human's approval before freezing. Starting
F5 needs the human's go-ahead.

## Resume prompt

Read docs/epics/13-design-system/HANDOFF.md. Draft Design system story F5 (Input) with its proposed acceptance and settle its questions with the human; after approval, freeze and implement F5 on main and push main.
