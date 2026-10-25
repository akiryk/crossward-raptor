# Design system — History

Historical evidence, not startup reading or current instructions. Use
[HANDOFF.md](HANDOFF.md) for the current state.

- [Closeout audit (2026-10-24)](#closeout-audit-2026-10-24)
- [F1–F3 verification](#f1f3-verification)
- [Handoff snapshot before closeout](#handoff-snapshot-before-closeout)

# Closeout audit (2026-10-24)

Independent, report-only audit per [AUDIT](../../process/AUDIT.md), by a
fresh agent that authored none of F1–F7, on `main` at `171d839`. The session
that started it edited none of the audited work before the audit; it
recorded the result and applied the dispositions below. The auditor edited
nothing.

**Coverage:**
- Frozen acceptance against every baseline (`c5e5d7a`, `4b8c401`,
  `58cc471`, `b2dfa65`, `065b887`, `3c077fd`, `f4f9a19`, `5509870`): each
  freeze commit changes only tests and docs, no implementation commit
  (`d5beab1`, `88004db`, `5af2850`, `7dccf78`, `fb18f20`, `6b21489`,
  `a4dae9d`, `67e8ebc`) touches a test file, and every later test change is
  a documented retirement, style-map amendment or refreeze. F1's 28
  retirements recounted.
- Counts in `globals.css`: 20 palette variables, 40 styles plus the 23 old
  color tokens, 13 text styles; the EPIC's style table diffed against it.
- Each story's promised removal (token editor, old button variants,
  TextInput `variant`, dark header, Space Grotesk).
- `npm run verify` exit 0 (602 tests, the known `request-logger/render.ts`
  lint warning), auditor's own run.

**Not covered:** e2e (not rerun; the F7 run of 505/505 stands), visual
match against the Figma export and mockups (outside the repo), the F6
correction's independent review (handoff and story text only), an
inventory of old-token use (epic 14's job), `.claude/settings.json`, shared
skills and `.env*`.

**Verdict:** no blockers; closable.

**Findings and disposition** (numbers are the auditor's):

1. *Wrong:* F1 says `e2e/color-tokens.spec.ts` has 10 cases; it has 9
   (confirmed with `playwright test --list`). Corrected in F1.
2. *Wrong:* EPIC says `e2e/typography.spec.ts` asserts Space Grotesk; only
   `text-styles.spec.ts` mentions it. Corrected in the EPIC.
3. *Wrong:* EPIC says interactive colors transition over 150ms; the
   correction covers buttons, toggle, Radio and links, and the modal close
   button has none (`Modal.tsx:167`). EPIC narrowed to match.
4. *Wrong:* EPIC says Radio, Title, Logo and Masthead are adopted in epic
   14, but F6 adopted Radio for the size picker and F7 put the Masthead on
   every page. Corrected in the EPIC.
5. *Wrong:* the hint answer under the Hint Input is described differently
   in F5 (letter-spaced, `muted` turning `primary` on focus) and in the
   EPIC's epic 14 entry (`label` `muted`, right-aligned). Recorded in the
   epic 14 entry as a question for its drafting.
6. *Stale:* F1 says 33 new styles; there are 40 after F3, F4 and F7.
   Annotated in F1.
7. *Stale:* F3 still lists 20 cases and "Sign-out is alternate", retired
   by F7. Annotated in F3.
8. *Stale:* F3 and F7 acceptance say "Proposed". Changed to "Frozen".
9. *Stale:* F6 keeps "That is why color changes are instant", reversed by
   its correction, and lists the existing `buttons.spec.ts` and
   `controls.spec.ts` as new acceptance. Both annotated in F6.
10. *Stale:* F1–F3 point to the handoff for verification that was later
    compressed out. Recovered below; the links now point here.
11. *Stale:* the handoff ran ~1500 words as a per-story journal. Archived
    verbatim below; the handoff is rewritten.
12. *Stale:* the epic index listed the epic as active. Flipped to closed.
13. *At risk:* observations recorded only in the handoff (375px editor
    title clip, sign-in button against the email line, "Puzzle options"
    overflow at 375px, modal clipping tall content, F3's touching delete
    buttons). Moved into the EPIC's epic 14/15 entries.
14. *At risk:* `src/lib/google-font.ts` and its test are unused, deferred
    by F2 with no owner. Recorded for epic 14's old-token cleanup story.
15. *At risk:* `Masthead.tsx:16` derives `home-link` from the caller's
    `app-header` test id, which no story specifies. Recorded for epic 14.
16. *At risk:* `modal-design.spec.ts:385-387` reads the close button's
    color right after Tab without waiting for transitions; it would flake
    if the close button gained a transition. Recorded for epic 14 with
    finding 3.
- *Prunable:* handoff restatements now enforced by the source tests and F2
  specs; resolved by the handoff rewrite. LEARNINGS unchanged by this epic;
  a mid-transition style-read entry was suggested as optional and not
  added.

# F1–F3 verification

Recovered verbatim from the handoff at each implementation commit.

## F1 (`d5beab1`)

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

## F2 (`88004db`)

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

## F3 (`5af2850`)

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

# Handoff snapshot before closeout

Archived on 2026-10-24 from `171d839`, verbatim apart from "(snapshot)" in
its headings, including then-current statuses and next steps. Its links are
relative to this directory.

## (snapshot) Read first

1. This handoff; AGENTS only if not already supplied.
2. [EPIC](EPIC.md), especially its Decisions.

**Only if needed:** [epic 05](../05-visual-design/EPIC.md) for the token
conventions this epic keeps; `src/app/globals.css` for the old tokens.

## (snapshot) Current state (2026-10-24)

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

**F7 is done** and pushed on `main`. The human answered the six
questions and supplied a masthead mockup, then settled the two open
points: Sign out uses `link-muted`, the color the styles set, and sits
20px from the right, the padding they stated. Both matched the
specification. They approved the
[story](stories/13-F7-title-logo-masthead.md) as written on 2026-10-24,
including the retirement of F3-9's `sign-out is an alternate button`.
It was frozen in specification-only commit `5509870` with
`e2e/masthead.spec.ts`, `src/components/ui/title-source.test.ts`, that
retirement, F1's two style-map amendments and the EPIC's three new
styles (`logo`, `logo-cell`, `masthead`). `Title` renders the four title
styles in any of the seven text color styles. `Logo` is the human's SVG
inline, colored from styles, with hidden text "Crossward". `Masthead`
replaces the dark header: a white bar with a `line-muted` hairline, 20px
padding, the logo as the home link and, when signed in, a link-looking
Sign out (`MastheadAction`). `/style-guide` has `sg-titles`, `sg-logo` and
`sg-masthead`.

## (snapshot) Verification

F7 implementation (2026-10-24, on the frozen baseline `5509870`):
`npm run verify` exit 0 (602 tests, the known `request-logger/render.ts`
lint warning); full `npm run test:e2e` with `--workers=4` exit 0, 505/505,
under the standing guarded test-reset grant. Frozen acceptance unchanged
from `5509870`. Visual check at 1280px and 375px against the mockup: the
front door signed out, `/puzzles` signed in (via the local inbox) and the
three new catalog sections look as the story describes, with no
horizontal overflow.

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

## (snapshot) Next action

All seven stories are done. After F7, the human reviewed `/style-guide`
and found the hint-row, stepper and grid samples wrong. They are
pre-redesign samples on old tokens, already epic 14's scope, not F1–F7
defects. Their details (and the stepper's removal) are recorded in the
EPIC's epic 14 entry for its drafting. Epic closeout follows the
[epic index](../README.md#close-an-epic); it isn't authorized until the
human asks for it.

## (snapshot) Resume prompt

Read docs/epics/13-design-system/HANDOFF.md and the closeout section of docs/epics/README.md. Close out the Design system epic as that section describes; do not start epics 14 or 15.
