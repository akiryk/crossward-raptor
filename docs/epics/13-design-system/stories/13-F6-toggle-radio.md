# Story F6 — Preview toggle and Radio

Restyle the existing Preview toggle in place with the redesign's colors and
type, keeping its behavior, and build the new Radio for one-of-several
choices in two variants: `form` (stacked, the new-puzzle size) and `nav` (a
row, Build/Play). The new-puzzle size picker adopts Radio now, and
`/style-guide` catalogs both components. Build/Play itself is adopted on
`/puzzles` in epic 14.

**Status:** approved by the human as written (2026-10-24), including the
keyboard-focus rule; frozen in `3c077fd`; delivered in `6b21489`.
**Correction approved by the human as written (2026-10-24)**, including
the agent's choices: see [Correction](#correction-2026-10-24). Refrozen in
`f4f9a19` and delivered in the following commit.
**Blast radius: low:** one restyled component, one new UI component, one
call site (the size picker) and the style-guide page. No CODE-REVIEW risk
path, so this is delivered directly to `main`.

## Correction (2026-10-24)

After delivery the human reviewed `/style-guide` and asked for these
changes. The Decisions and Acceptance below are amended in place.

- **Radio size** *(human)*. The ring is 16×16 with a 2px stroke. The dot
  is 8×8, which leaves a 2px white inner ring. (Was 24px and 12px, read
  from the mockups.)
- **Gaps** *(human)*. The label sits 8px from the Radio ring and from the
  toggle (was 12px and 10px).
- **Toggle label** *(human)*. "Preview" is `link-muted` when off and
  `button-active` when on (was `link-muted` in both). It doesn't change on
  hover or focus.
- **Radio labels** *(agent, the human called the type "way too big")*.
  `form` labels are `body-normal` (14px/400) and `nav` labels `title-4`
  (14px/600) (were `body-large` and `title-3`, both 18px). The spacing
  between options is unchanged: 12px stacked, 24px in a row.
- **Color transitions** *(human: "a subtle transition", agent: scope and
  duration)*. Buttons, the toggle (pill, knob outline, label), Radio
  (ring, dot, label) and links change color over 150ms, `ease-out`.
  This reverses "color changes are instant" and amends F3. The knob's
  slide takes the same 150ms. F6-7 pins the duration and the timing
  function (`ease-out` computes to `cubic-bezier(0, 0, 0.2, 1)`) for each
  listed color and for the knob's `translate`.
- **Links** *(human: not green; agent: `button-fill`/`button-hover`)*.
  The style guide's link samples were still the old
  green `accent`. They become `button-fill`, turning `button-hover` on
  hover. No frozen test pins them, and links elsewhere are epic 14's.
- **Test correction.** With transitions, a style read right after hover,
  focus, a click or a variable edit sees a color mid-change. The style
  readers in `e2e/toggle-radio.spec.ts` and `e2e/buttons.spec.ts`, and
  the D2-1 hover read in `e2e/controls.spec.ts`, now wait for the
  element's running transitions to finish and then assert the settled
  color. The D2-1 read once failed that way in a full run, catching a
  transition's first frame. No F3 or D2 assertion changes. The F6
  assertions change only for the values above, plus the toggle label's
  hover and focus checks and F6-5's label placement, and a new case,
  F6-7, pins the 150ms `ease-out` transitions.

## Decisions

Inspected `src/components/grid/PreviewToggle.tsx`, its call site in
`PuzzleGridEditor`, the size picker in `NewPuzzleDialog`, `globals.css`,
the style-guide page, every frozen browser spec touching
`preview-toggle` or `new-puzzle-size`, and the Figma export, on
2026-10-24. The export has no Radio or toggle visuals. The human supplied
two mockups (the size picker and Build/Play) and answered the open points
on 2026-10-24. Those answers are marked *(human)*.

### Preview toggle

- **Colors** *(EPIC)*. The pill and the knob's 1px outline are
  `button-fill` when off and `button-active` when on. The knob is white
  (`inverse`). The "Preview" label is `label` (14px/400), `link-muted`
  when off and `button-active` when on *(correction)*, 8px from the pill.
- **Hover and keyboard focus** *(human)*. Hovering an off toggle turns the
  pill and knob outline `button-hover`. An on toggle doesn't change on
  hover. Keyboard focus (`:focus-visible`) turns both states
  `button-hover`, so focus is always visible (see the note below). There
  is no focus ring. The label keeps its off or on color on hover and focus
  *(correction)*.
- **Shape** *(human: keep today's size)*. A 40×24 pill (`rounded-pill`)
  with a 20px round knob that sits left when off and right when on. Colors
  and the knob's slide change over 150ms *(correction)*.
- **Behavior is unchanged.** It stays a visually hidden checkbox inside a
  `<label data-testid="preview-toggle">`, and the editor still renders it
  only in the grid phase. A new optional `data-testid` prop (default
  `preview-toggle`) lets the catalog show two toggles.
- **No old tokens.** It drops `bg-rule-strong`, `bg-accent`,
  `bg-background`, `shadow`, `text-body`, `text-ink-2` and the
  `outline-accent` focus ring.

### Radio

- **A native radio group.** `RadioGroup` in `src/components/ui/Radio.tsx`
  renders `role="radiogroup"` with an accessible name, and each option is a
  `<label>` around a real `<input type="radio">` sharing one `name`. Click,
  label click, Tab and the arrow keys work as native radios do. Options can
  pass `data-*` attributes to their input, which keeps the size picker's
  test hooks.
- **The ring** *(human, correction)*: a 16px circle with a **2px** ring
  and nothing inside. When selected, it shows an 8px dot, leaving a 2px
  white inner ring. The selected ring and dot are `button-active`. The
  label sits 8px right of the ring, centred on it. Colors change over
  150ms.
- **2px ring** *(human)*. The mockups' rings are 2px, so this is the
  EPIC's second stroke exception after the modal border.
- **Two variants** *(human: "two variants")*:
  - **`form`** (stacked, 12px apart): unselected ring `line-dark`
    (gray-600), labels `body-normal` (14px/400) in `primary` whether
    selected or not.
  - **`nav`** (a row, 24px apart): unselected ring and label `link-muted`,
    selected label `button-active` *(EPIC)*, labels `title-4`
    (14px/600).
- **Hover** *(human)*. Hovering an unselected option turns its ring
  `button-hover`, plus its label in `nav`. A selected option doesn't
  change on hover.
- **Keyboard focus** shows `button-hover` on the focused option's ring,
  dot and (in `nav`) label, selected or not. There is no focus ring.

**Keyboard focus on a selected or on control.** The human settled hover
only. Tab always lands on a group's selected radio, and on the toggle in
either state. Unchanged selected and on looks would make keyboard focus
invisible there, which breaks the EPIC's focus rule. So keyboard focus,
but not mouse hover, shows `button-hover` in every state. This needs the
human's approval as part of this story. *(Approved with the story,
2026-10-24.)*

### Size picker *(human: adopt now)*

- The new-puzzle size picker becomes a `form` `RadioGroup` with the same
  `new-puzzle-size` test id, `Puzzle size` name, option labels, default
  (daily) and `data-size`/`data-selected` hooks on the inputs. Its look
  changes from browser-default radios with `label` text to the `form`
  look. The mockup's "And pick a size!" heading is epic 14's.

### The catalog

- A new `sg-toggles` section shows `sg-toggle-off` and `sg-toggle-on`.
  A new `sg-radios` section shows `sg-radio-form` (the four sizes, mini
  selected) and `sg-radio-nav` (Build and Play, Build selected). All of
  them are interactive.
- No horizontal overflow at 1280px or 375px.

### Retired acceptance

None. No frozen test pins the toggle's or the size picker's look.
`preview.spec.ts`, `locked-grid.spec.ts`, `grid-focus.spec.ts` and
`play-route.spec.ts` click or count `preview-toggle`, which is kept.
`new-puzzle.spec.ts`, `display-name.spec.ts` and `ownership.spec.ts`
click and check `[data-testid="new-puzzle-size"] [data-size]` inputs,
which are kept. `style-guide.spec.ts` lists sections, and the new ones
add to it. No frozen file changes in the freeze commit.

## Acceptance

Approved and frozen (2026-10-24); immutable. The correction is approved
(2026-10-24) and refrozen with these lists:

- `e2e/toggle-radio.spec.ts`: 15 browser cases. All style reads wait for
  the element's running transitions to finish.
  - F6-1 catalog (2): both toggles show "Preview", one off and one on.
    Both radio groups are named radiogroups with 4 and 2 radios, one
    selected each, and the nav options read Build and Play. There is no
    horizontal overflow at 1280px or 375px.
  - F6-2 toggle (3): the off toggle is `button-fill` and the on toggle
    `button-active`, in the pill and the 1px solid knob outline. The knob
    is `inverse`, there are no outlines or shadows, the pill and knob are
    fully round, the knob is left when off and right when on, and the
    label is `label`, 8px from the pill, `link-muted` when off and
    `button-active` when on. Hover turns off `button-hover` and
    leaves on unchanged. Keyboard focus turns both `button-hover`, and
    blur restores them. The label doesn't change on off-hover or keyboard
    focus. Clicking switches it, and the look, label
    included, follows.
  - F6-3 form Radio (3): the options are stacked and left-aligned. Rings
    are 16px, round, 2px solid and transparent inside, with no outline
    or shadow: `button-active` with a centred 8px `button-active` dot when
    selected, and `line-dark` with no dot when not. Labels are
    `body-normal` `primary`, 8px right of the ring and centred on it. Hover
    turns an unselected ring `button-hover`, not its label, and leaves a
    selected option unchanged. Keyboard focus turns the selected ring and
    dot `button-hover`. Clicking an option or its label selects only it,
    and ArrowDown moves selection and focus.
  - F6-4 nav Radio (3): the options sit in one row. Selected is
    `button-active` (ring, dot, label), unselected `link-muted` (ring,
    label), and labels are `title-4`, 8px right of the ring. Hover turns an unselected ring and
    label `button-hover` and leaves the selected one unchanged. Keyboard
    focus turns the selected ring, dot and label `button-hover`. Clicking
    the other option moves the selection and the colors.
  - F6-5 size picker (2): `new-puzzle-size` is a radiogroup named
    "Puzzle size" with the four labelled options in order and their
    `data-size` hooks, in the `form` look with daily selected and each
    label 8px right of its ring. Clicking a
    size label selects it, updates `data-selected` and moves the look.
  - F6-6 token-driven (1): live edits of `--palette-interactive-dark`
    repaint the on pill, the selected ring and the dot, and edits of
    `--palette-gray-600` repaint an unselected form ring. Both restore.
  - F6-7 color transitions (1) *(correction)*: the catalog's button
    (fill, border, text), toggle pill, knob outline and label, form ring
    and dot, nav label and link each transition their colors, and the
    knob its `translate`, over `0.15s` with `cubic-bezier(0, 0, 0.2, 1)`.
- `src/components/ui/radio-source.test.ts`: 3 Vitest cases.
  - `PreviewToggle.tsx` and `Radio.tsx` have no literal color, built-in
    `white`/`black`, old color or type token, `ring-`, `outline-*` other
    than `outline-none`/`outline-hidden`, `shadow`, radius other than
    `rounded-pill`, or arbitrary weight. Each uses its listed new
    utilities (for example `bg-button-fill`, `bg-inverse` and
    `text-link-muted`, `text-button-active`; `border-2`,
    `border-line-dark`, `text-body-normal`, `text-title-4`).
  - `NewPuzzleDialog.tsx` renders `<RadioGroup … data-testid="new-puzzle-size">`
    and no hand-written `type="radio"` or `role="radiogroup"`.
- `e2e/buttons.spec.ts` (F3) *(correction)*: its two style readers wait
  for the element's running transitions to finish. No assertion changes.
- `e2e/controls.spec.ts` (D2) *(correction)*: the D2-1 hover read waits
  for the button's running transitions to finish. No assertion changes.

Discrimination observed on 2026-10-24:

- A scratch implementation of these Decisions changed every Runtime path
  below. With it, `npm run verify` exited 0 (598 tests), and the full
  `npm run test:e2e` suite passed 494/494, so no frozen test needs
  retiring.
- With the scratch runtime removed and the tests kept, all 3 F6 Vitest
  cases and all 14 browser cases failed.
- Three targeted mutations of the scratch:
  - letting an on toggle react to hover failed only F6-2's hover/focus
    case;
  - dropping keyboard focus from a selected ring failed only the three
    keyboard-focus cases (F6-3 hover/focus, F6-3 arrow keys, F6-4
    hover/focus);
  - giving the form variant blue unselected rings failed only the six
    form-ring cases (F6-3 ×3, F6-5 ×2, F6-6).
- The scratch first animated the pill's color, and three cases read it
  mid-transition. That is why color changes are instant.
- Browser runs used the standing guarded test-reset grant
  ([DEVELOPMENT](../../../DEVELOPMENT.md#e2e-environment)).

Correction discrimination, observed on 2026-10-24:

- With the scratch correction (Runtime paths below plus `Button.tsx`), the
  full suite with the *uncorrected* tests failed 19 cases: 7 in
  `buttons.spec.ts`, all from reading mid-transition, and 12 in
  `toggle-radio.spec.ts`. No other frozen spec failed.
- With the corrected tests, `buttons.spec.ts` and `toggle-radio.spec.ts`
  pass 35/35 on the scratch.
- On the delivered runtime (`6b21489`), the corrected tests fail the 12
  F6 cases that pin a changed value (F6-2 look and click, F6-3 ×3, F6-4
  ×3, F6-5 ×2, F6-6, F6-7). All 20 `buttons.spec.ts` cases still pass,
  since their only change is waiting for transitions. The corrected source
  test fails its toggle and Radio cases.
- Removing the Button transition and restoring the toggle's 10px gap
  failed only F6-7 and F6-2's look case.
- After the review fixes, `verify` exited 0 (598) and the three
  corrected specs passed 45/45 on the scratch. Mutations: the off label
  turning `button-hover` on hover failed only F6-2's hover/focus case; the
  on label turning `button-hover` on keyboard focus failed only that case;
  a 12px Radio label gap failed only F6-3's and F6-4's look cases and
  F6-5's look case; a `linear` knob transition failed only F6-7.

## Repo paths

New acceptance, immutable after freeze:

- `e2e/toggle-radio.spec.ts`
- `src/components/ui/radio-source.test.ts`
- `e2e/buttons.spec.ts` (F3's, corrected only in its style readers)
- `e2e/controls.spec.ts` (D2's, corrected only in the D2-1 hover read)

Runtime:

- `src/components/grid/PreviewToggle.tsx`: the restyle and the optional
  test id.
- `src/components/ui/Radio.tsx`: new.
- `src/components/puzzle/NewPuzzleDialog.tsx`: the size picker.
- `src/app/style-guide/page.tsx`: the `sg-toggles` and `sg-radios`
  sections; the link samples *(correction)*.
- `src/components/ui/Button.tsx`: the color transition *(correction)*.
- This story, `../EPIC.md` (the 2px ring exception in the freeze commit;
  F6 status at delivery; the correction's transition rule and toggle
  label), `13-F3-button.md` (the correction note) and `../HANDOFF.md`.

Declare any other path before editing it.

## Scope discipline

Only F6. No Build/Play on `/puzzles`, no "And pick a size!" heading or
other dialog restyle, no Title, Logo or Masthead (F7), no old-token
deletion and no responsive work.

## Definition of done

- Human approval of this specification and its acceptance, recorded here
  and in the handoff. Freeze on `main` in a specification-only commit that
  adds the new acceptance and the EPIC's ring exception before any runtime
  change.
- Frozen acceptance is unchanged after freeze.
- `npm run verify` exits 0, and the full `npm run test:e2e` suite exits 0.
- Visual check at desktop and phone widths: the catalog, the editor's
  Preview toggle and the new-puzzle dialog.
- Update the handoff with observed results, commit and push `main`. F7
  remains pending.
