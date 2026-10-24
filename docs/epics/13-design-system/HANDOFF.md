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

**F5 is done** and pushed on `main`. The human approved the
[story](stories/13-F5-input.md) as written on 2026-10-24, after settling
its questions (marked *(human)* in the story). It was frozen in
specification-only commit `065b887` with `e2e/inputs.spec.ts` and
`src/components/ui/input-source.test.ts`. No frozen test was retired.
`TextInput` is one underlined field: a 1px line, `line-muted` at rest,
`line-highlight` on focus, and `error` whenever an `error` message is set
(the message sits below). It has `regular` (`body-normal`) and `large`
(`body-large`) sizes and an optional `title-4` `<label>` above. The
`variant` prop is gone. Sign-in is large, and the new-puzzle and
builder-name dialogs pass their names as labels. `/style-guide` has four
`sg-input-*` samples.

**F6 is done** and pushed on `main`. The human supplied two mockups,
settled the questions recorded as *(human)* in the
[story](stories/13-F6-toggle-radio.md), then approved it as written on
2026-10-24, including the keyboard-focus rule. It was frozen in
specification-only commit `3c077fd` with `e2e/toggle-radio.spec.ts`,
`src/components/ui/radio-source.test.ts` and the EPIC's 2px ring
exception. No frozen test was retired. The Preview toggle is restyled in
place (`button-fill` off, `button-active` on, white knob, `label`
`link-muted`) with an optional test id. The new `RadioGroup`
(`src/components/ui/Radio.tsx`) is a native radio group with a 24px, 2px
ring and a 12px dot, in `form` (stacked, gray) and `nav` (row, blue)
variants. Hovering an unselected option or an off toggle, or keyboard
focus in any state, shows `button-hover`. The new-puzzle size picker is a
`form` RadioGroup, and `/style-guide` has `sg-toggles` and `sg-radios`.

**The F6 correction is done** and pushed on `main`. After delivery the
human asked for a 16px Radio ring (2px stroke) with an 8px dot, 8px label
gaps, the toggle label `button-active` when on, subtle hover transitions
and `button-fill` links. They approved the
[correction](stories/13-F6-toggle-radio.md#correction-2026-10-24) as
written on 2026-10-24, including the agent's choices (`body-normal` and
`title-4` Radio labels, 150ms `ease-out` transitions on buttons, toggle,
Radio and links, unchanged option spacing), after an independent review
whose six fixes were applied. It was refrozen in specification-only commit
`f4f9a19`. Style readers in `toggle-radio`, `buttons` and `controls` specs
wait for running transitions, with no F3 or D2 assertion changes, and the
new case F6-7 pins the transitions. The implementation commit follows it.

## Verification

F6 correction implementation (2026-10-24, on the refrozen baseline
`f4f9a19`): `npm run verify` exit 0 (598 tests, the known
`request-logger/render.ts` lint warning); full `npm run test:e2e` with
`--workers=4` (a disclosed resource cap; uncapped runs overload this
machine) exit 0, 495/495, under the standing guarded test-reset grant.
Frozen acceptance unchanged from `f4f9a19`. Visual check at 1280px and
375px was done on the same runtime before the refreeze: the catalog
toggles, radios and link and the new-puzzle dialog match the correction.

F6 implementation tree (2026-10-24, on the frozen baseline `3c077fd`):
`npm run verify` exit 0 (598 tests, the known `request-logger/render.ts`
lint warning); full `npm run test:e2e` exit 0, 494/494, under the standing
guarded test-reset grant. Frozen acceptance unchanged from `3c077fd`.
Visual check at 1280px and 375px: the catalog toggles and radios
(including nav hover), the editor's Preview toggle in place and the
new-puzzle dialog's size picker look as the story describes, with no
horizontal overflow. Seen, not F6's job: at 375px a long puzzle title in
the editor clips at the right edge.

F5 implementation tree (2026-10-24, on the frozen baseline `065b887`):
`npm run verify` exit 0 (595 tests, the known `request-logger/render.ts`
lint warning); full `npm run test:e2e` exit 0, 480/480, under the standing
guarded test-reset grant. Visual check at 1280px and 375px: the catalog,
sign-in, the new-puzzle and builder-name dialogs and the hint inputs all
look as the story describes, with no overflow. Sampled pixels confirmed the
focused line is `line-highlight` and the error line is `error`. Seen, not
F5's job (epic 14): the sign-in button sits right against the email line.

F4 (committed `7dccf78`) passed verify (592) and the full e2e suite
(463/463). Seen then, not F4's job: at 375px play's "Puzzle options"
button runs past the right edge, and the modal panel clips content taller
than the viewport (no current dialog is that tall).

## Next action

F6 is complete, including its correction. F7 (Title, Logo and Masthead)
follows; it isn't authorized until the human asks for it.

## Resume prompt

Read docs/epics/13-design-system/HANDOFF.md and the "F7 — Title, Logo and Masthead" section of docs/epics/13-design-system/EPIC.md. Draft the F7 story specification on main for the human's approval; do not freeze or implement it without that approval.
