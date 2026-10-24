# Story F4 — Modal

Redesign the existing `Modal` in place as the redesign's modal: a white
panel with a 2px white border and 10px corners, a yellow header holding
the title and the close control, the content, and a footer of buttons, over
the `modal-backdrop`. Its accessibility behavior doesn't change. Every
existing dialog takes the new look, and `/style-guide` catalogs a sample.

**Status:** approved by the human as written (2026-10-24), frozen in `b2dfa65`, and done.
**Blast radius: low:** one UI component, its footer helper, a `form`
pass-through on `Button`, the dialogs that render it (footer placement
only, plus two OK buttons), the stylesheet and the style-guide page. No CODE-REVIEW risk path; direct
delivery to `main`.

## Decisions

Inspected `src/components/ui/Modal.tsx`, `ModalActions.tsx`, the six
dialogs that render `Modal`, `src/app/globals.css`, the style-guide page,
every frozen browser spec that touches a dialog, and the Figma export
(`components-colors-text-styles.pdf`), on 2026-10-24. The export says only
"Header (with the yellow background and title); Content; Footer: buttons".
The human supplied a mockup of the new-puzzle modal and answered the
open points on 2026-10-24; those answers are marked *(human)*.

### Shape and color

- **Panel** *(human)*: white, 10px corners, and a **2px white border** on
  every side. "The yellow header has a white border around it that follows
  the curved top corners", so the header sits inside the border and its
  top corners follow the panel's curve. This is the one exception to the
  EPIC's 1px strokes.
- **New color style `modal-background` → `white`** *(human)*. It paints the
  panel's fill and its border, and pairs with `modal-title-background`.
  It goes after `puzzle-row-hover`, before `modal-title-background`. The
  EPIC's Color styles table gains a `*(new)*` row and then has 37 styles;
  `ColorSwatches` lists it.
- **New radius token `--radius-modal: 10px`** (Tailwind `rounded-modal`),
  declared once, in the shape `@theme static` block beside `--radius-pill`.
  F3 left 10px corners to each later component's own token. The header's
  inner corners (8px) come from the panel clipping its content inside the
  border, not from a second token.
- **Backdrop:** `modal-backdrop` (black at 40%), replacing
  `bg-foreground/50`.
- **No old tokens.** `Modal` drops `rounded-md`, `border-rule-strong`,
  `bg-background`, `bg-foreground/50`, `text-ink-2`, `text-foreground`,
  `font-display`, `text-headline`, `text-body` and the `--weight-bold`
  arbitrary weight.

### Size

- **Width fits the content, between 300px and 500px** *(human: "we can
  revisit that")*. On a screen too narrow for 300px plus the backdrop's
  16px margin, the panel shrinks to fit rather than overflow. Height fits
  the content.

### Header

- **The full-width yellow band** (`modal-title-background`) inside the
  border, sized by padding rather than a fixed height *(human)*: 12px top
  and bottom, 16px at the sides (implementer default, from the mockup).
- **Title:** `title-3` (18px/600) in `primary`, left-aligned *(human)*.
  It stays the `h2` that labels the dialog (`modal-title`).
- **Close control kept** *(human)*, in the header at its right, vertically
  centered. It is the existing `modal-close` button: accessible name
  "Close", disabled while `dismissalDisabled`. A ✕ in `primary`, turning
  `muted` on hover and on keyboard focus (`:focus-visible`), with no focus
  ring (EPIC). Disabled keeps 50% opacity and a `not-allowed` cursor with
  no hover change. The header carries `data-testid="modal-header"`.

### Content

- `body-normal` (14px/400) in `primary`, replacing the gray `text-ink-2`.
  16px at the sides, as the title, and 16px below the header. It carries
  `data-testid="modal-content"`. What the content holds is the dialogs'
  own business: the new-puzzle dialog's "Name it!" and "And pick a size!"
  labels are `title-4` and its size options `body-small` *(human)*, but
  epic 14 restyles that content with the new Input and Radio.

### Footer

- **Buttons, left-aligned, confirm first** *(human mockup: Create, then
  Cancel)*. The footer renders only when a dialog passes one, in a
  `data-testid="modal-footer"` row below the content, 12px apart, with the
  content's 16px side inset, 24px above it and 24px below. Buttons keep
  F3's normal size.
- **`ModalActions` renders only the two buttons**, confirm (normal) then
  cancel (alternate), and the `Modal` footer row lays them out. Its props
  and test ids don't change.
- **Every dialog with buttons puts them in the footer**, in the same order:
  - enter-hints and new-puzzle already pass `ModalActions`;
  - play reset's footer becomes confirm, then cancel;
  - the builder-name dialog moves its two buttons out of its content into
    the footer. The save button stays the form's submit button through the
    `form` attribute, so Enter in the name field still submits.
- **Play's two message dialogs get an OK button** *(human)*. "You're so
  close" (`play-incorrect-ok`) and "Congratulations!"
  (`play-completion-ok`) each get one normal "OK" footer button that
  closes the dialog. They still close with the ✕, Escape and the backdrop,
  and nothing else about them changes.

### Accessibility behavior (unchanged)

Portal into `body`, one fixed overlay, `role="dialog"`, `aria-modal`,
`aria-labelledby` on the title, initial focus (the panel unless a child
marks `data-modal-initial-focus`), the Tab trap, focus restore, scroll lock
and every dismissal route (✕, Escape, backdrop, `dismissalDisabled`) stay
as they are. The new OK buttons don't take initial focus: the panel does,
so a screen reader reads the message first.

### The catalog

- A new `sg-modal` section on `/style-guide`, after the buttons, with an
  "Open modal" button (`sg-modal-open`). It opens a sample modal
  (`sg-modal-dialog`) with a title, a short paragraph and a `ModalActions`
  footer; either button closes it.
- No horizontal overflow at 1280px or 375px, open or closed.

### Retired acceptance

None. No frozen test pins the modal's look. Frozen dialog tests
(`modal.spec.ts`, `modal-a11y.spec.ts`, `display-name.spec.ts`,
`play-reset.spec.ts`, `library-play.spec.ts`, `play-completion.spec.ts`)
pin behavior, test ids and the "Close" button name, all kept.

One amendment to frozen acceptance, made only in the
specification-only freeze commit on `main`: **add
`'modal-background': 'white'` to the `STYLES` map** in
`src/app/globals-css.test.ts` and `e2e/color-tokens.spec.ts`, before
`'modal-title-background'`. No other line changes. As in F3, this extends
F1's style set to the EPIC's amended table; without it F1's "no @theme
colors besides…" check fails on the new style.

## Acceptance

Frozen at approval (2026-10-24); immutable:

- `e2e/modal-design.spec.ts`: 15 browser cases.
  - F4-1 catalog (2): the sample opens from `sg-modal-open` as a dialog
    with a header, content and a two-button footer, and closes from
    either button. No horizontal overflow at 1280px or 375px, open or
    closed.
  - F4-2 panel (3): the backdrop covers the viewport in `modal-backdrop`.
    The panel is `modal-background` with a 2px solid `modal-background`
    border on every side and 10px corners. Its width is between 300px and
    500px at 1280px for both a short dialog (the catalog) and a long one
    (enter-hints), and it fits a 375px viewport.
  - F4-3 header (3): the header is `modal-title-background`, fills the
    panel's width inside the border and starts at the border, and is
    clipped to the panel's curve. It is taller than the title (padding),
    with the title vertically centered. The title is `title-3` in Inter
    and `primary`, left-aligned in the header. The ✕ sits in the header to
    the right of the title, is `primary`, turns `muted` on hover and Tab
    focus with no outline, and restores.
  - F4-4 content (1): `body-normal` in `primary`, its left edge aligned
    with the title's.
  - F4-5 footer (3): in the enter-hints, new-puzzle, play-reset and sample
    dialogs, the footer sits below the content, holds the confirm (normal)
    and then the cancel (alternate), and its first button's left edge
    aligns with the content's. The builder-name dialog's save and cancel
    are in its footer in the same order, and Enter in the name field still
    saves.
  - F4-6 OK buttons (2): the incorrect and completion dialogs each have a
    footer with one normal "OK" button. The panel, not OK, has focus on
    open. OK closes the dialog, and the puzzle stays editable (incorrect)
    or locked (completion).
  - F4-7 token-driven (1): live edits of `--palette-yellow-bright`,
    `--palette-white` and `--radius-modal` repaint or reshape the open
    modal, and they restore afterwards.
- `src/components/ui/modal-source.test.ts`: 3 Vitest cases.
  - `Modal.tsx` has no literal color, built-in `white`/`black`, old color
    token, `font-display`, `text-headline`, arbitrary `rounded-[…]` or
    weight, and uses `rounded-modal`, `bg-modal-background`,
    `border-modal-background`, `bg-modal-title-background`,
    `bg-modal-backdrop` and `text-title-3`.
  - `ModalActions.tsx` renders the confirm button before the cancel button
    and no wrapper layout of its own.
  - `--radius-modal` is declared exactly once in `globals.css`, inside
    `@theme`, as `10px`.
- The `STYLES` amendment under Retired acceptance.

Discrimination observed on 2026-10-24:

- A scratch implementation of these Decisions changed every Runtime path
  below. With it and the amendment, `npm run verify` exited 0 (592
  tests). One run of `modal-design.spec.ts` with `modal.spec.ts`,
  `modal-a11y.spec.ts`, `display-name.spec.ts`, `play-completion.spec.ts`,
  `play-reset.spec.ts`, `library-play.spec.ts`, `color-tokens.spec.ts`,
  `buttons.spec.ts`, `enter-hints.spec.ts` and `style-guide.spec.ts`
  showed the other specs green. Its 4 F4 failures came from a proposed
  test that measured the content's outer edge rather than where its text
  starts. That test was corrected, and then `modal-design.spec.ts` passed
  15/15, then twice more (`--repeat-each=2`, 31/31 with setup).
- With the scratch runtime removed and the tests kept, all 3 F4 Vitest
  cases failed, as did F1's amended `declares each style in @theme…`
  check. All 15 F4 browser cases failed, as did the three F1 browser
  cases the amendment extends.
- Most of those fail at the missing catalog, so two targeted mutations of
  the scratch followed. A 1px panel border failed F4-2's border case and
  F4-3's header-inset case, and nothing else. Cancel-first in play reset
  failed only F4-5's play-reset case.
- Browser runs used the standing guarded test-reset grant
  ([DEVELOPMENT](../../../DEVELOPMENT.md#e2e-environment)).

## Repo paths

New acceptance, immutable after freeze:

- `e2e/modal-design.spec.ts`
- `src/components/ui/modal-source.test.ts`

Frozen acceptance changed in the freeze commit only (see Retired
acceptance): `e2e/color-tokens.spec.ts`, `src/app/globals-css.test.ts`.

Runtime:

- `src/components/ui/Modal.tsx`: the redesign.
- `src/components/ui/ModalActions.tsx`: buttons only, confirm first.
- `src/components/ui/Button.tsx`: a pass-through `form` prop only, so the
  builder-name save button can submit its form from the footer.
- `src/app/globals.css`: add `--color-modal-background` and
  `--radius-modal`. Nothing else changes.
- `src/components/style-guide/ColorSwatches.tsx`: list the new style.
- `src/app/style-guide/page.tsx`: the `sg-modal` section.
- `src/components/play/PlayReset.tsx`: footer order.
- `src/components/puzzle/DisplayNameDialog.tsx`: buttons into the footer.
- `src/components/play/PlayPuzzle.tsx`: the two OK footers.
- This story, `../EPIC.md` (the new style row and the 2px border
  exception) and `../HANDOFF.md`.

Declare any other path before editing it. The dialogs' content (labels,
inputs, radio options, messages) stays as it is until epic 14.

## Scope discipline

Only F4. No content restyle inside dialogs, no Input or Radio work (F5,
F6), no new dialogs (epic 14 moves delete and reset into dialogs), no
old-token deletion, no responsive work beyond fitting a phone width.

## Definition of done

- Human approval of this specification and its acceptance, recorded here
  and in the handoff. Freeze on `main` in a specification-only commit that
  adds the new acceptance, makes the `STYLES` amendment and updates the
  EPIC, before any runtime change.
- Frozen acceptance is unchanged after freeze.
- `npm run verify` exits 0, and the full `npm run test:e2e` suite exits 0.
- Visually check at desktop and phone widths: the catalog sample, the
  new-puzzle and builder-name dialogs, enter-hints, play's incorrect,
  completion and reset dialogs, and the library's reset dialog.
- Update the handoff with observed results, commit and push `main`. F5
  remains pending.
