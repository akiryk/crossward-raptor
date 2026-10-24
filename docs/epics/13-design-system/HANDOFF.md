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

**F5 is approved and frozen; implementation in progress** (2026-10-24).
The human approved the [story](stories/13-F5-input.md) as written on
2026-10-24, after settling its questions (marked *(human)* in the story).
It is frozen in a specification-only commit on `main` with
`e2e/inputs.spec.ts` and `src/components/ui/input-source.test.ts`. No
frozen test is retired and no other frozen file changes. The runtime
starts from the drafting scratch (`TextInput.tsx`, `SignInForm.tsx`,
`NewPuzzleDialog.tsx`, `DisplayNameDialog.tsx`, `HintsPanel.tsx`,
`style-guide/page.tsx`), uncommitted on `main`.

## Verification

F5 scratch tree (uncommitted, observed 2026-10-24; see the story's
discrimination evidence): `npm run verify` exit 0 (595 tests, the known
`request-logger/render.ts` lint warning); full `npm run test:e2e` exit 0,
480/480, under the standing guarded test-reset grant. Not yet run on a
frozen baseline; the visual check is not done.

F4 (committed `7dccf78`) passed verify (592) and the full e2e suite
(463/463). Seen then, not F4's job: at 375px play's "Puzzle options"
button runs past the right edge, and the modal panel clips content taller
than the viewport (no current dialog is that tall).

## Next action

Commit the F5 runtime, run `npm run verify`, the full `npm run test:e2e`
and the story's visual check, update this handoff and push `main`. F6
needs its own go-ahead.

## Resume prompt

Read docs/epics/13-design-system/HANDOFF.md and docs/epics/13-design-system/stories/13-F5-input.md. Get the human's approval of the drafted F5 (Input) story; after approval, freeze and implement F5 on main and push main.
