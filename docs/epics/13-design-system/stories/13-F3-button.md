# Story F3 — Button

Redesign the existing `Button` in place as the redesign's button: four
types (normal, numbered, large, alternate), each with normal, hover and
selected states. Hover's look also shows on keyboard focus, and there is no
focus ring. Every existing button use takes the new look, and `/style-guide`
catalogs the types.

**Status:** approved by the human on 2026-10-24 and frozen on `main`.
The human settled the pending questions the same day (sizes, pill ends,
the numbered circle and alternate's colors), and the proposed acceptance
was revised to match before approval.
**Blast radius: low:** one UI component, its call sites (variant names
only), the stylesheet and the style-guide page. No CODE-REVIEW risk path;
direct delivery to `main`.

## Decisions

Inspected `src/components/ui/Button.tsx`, all 11 files that render it,
`src/app/globals.css`, `src/app/style-guide/page.tsx`, `Stepper.tsx`, every
frozen browser spec that reads a button's computed style, and the Figma
export (`components-colors-text-styles.pdf`), on 2026-10-24. The export
names the four types and three states but gives no sizes or per-state
colors. Answers from the human on 2026-10-24 are marked *(human)*.

### Types and API

- **One component, redesigned in place.** `Button` keeps its props (`type`,
  `disabled`, `onClick`, `children`, `data-testid`) and gains:
  - `variant: 'normal' | 'alternate'` (default `normal`);
  - `size: 'normal' | 'large'` (default `normal`);
  - `number?: number`: makes a numbered button;
  - `selected?: boolean` (default `false`).
- **The four types:** normal; numbered (normal plus `number`); large
  (normal with `size="large"`); alternate (`variant="alternate"`, the gray
  cancel-style button). The button renders `data-button-type` set to one
  of `normal`, `numbered`, `large` or `alternate`. Other combinations
  aren't needed yet and aren't specified.
- **Numbered** shows the number in a circle, then the label (see Shape,
  type and size). The stepper adopts it in epic 14.

### Old variants go away

- `primary` becomes `normal` and `quiet` becomes `alternate`.
- **`danger` is removed** and its uses become `normal` *(human: "I don't
  like the danger button as designed")*. Context: epic 14 removes "clear
  letters", and moves reset-play and delete to `/puzzles`, where each opens
  a confirm dialog. Until then, delete-puzzle, clear-letters confirm and
  play-reset confirm are normal blue buttons, and their cancels are
  alternate.
- Every call site switches to the new variant names in this story, so no
  old name survives. These are `ModalActions`, `DeletePuzzleButton`,
  `ClearLettersButton`, `PlayReset`, `DisplayNameDialog`, `EditGridToggle`,
  `SignOutButton`, `PublishControls` and the style guide. `NewPuzzleButton`
  and `SignInForm` already use the default. No call site changes behavior,
  test id or label.

### Colors per state

Normal, numbered and large share one look:

| State | Fill and stroke | Text |
| --- | --- | --- |
| normal | `button-fill` | `inverse` (white) |
| hover / keyboard focus | `button-hover` | `inverse` |
| selected / pressed | `button-active` | `inverse` |

Alternate is gray *(human)*:

| State | Fill | Stroke | Text |
| --- | --- | --- | --- |
| normal | `fill-muted` (gray-200) | `button-alternate-border` (gray-500) | `subtle` (gray-600) |
| hover / keyboard focus | `button-alternate-hover` (gray-500) | `line-dark` (gray-600) | `inverse` |
| selected / pressed | same as hover | same as hover | same as hover |

- **Alternate has a selected style, for consistency, and it is the same
  as its hover style** *(human, at approval)*. So alternate has one active
  look, shared by hover, keyboard focus, selected and pressed. Unlike the
  filled types, alternate's selected look doesn't differ from its hover
  look.
- **Three new color styles.** No existing style names their uses, and
  components may not use a variable or Tailwind's built-in `white`:
  - `inverse` → `white`: text on a filled button, and the numbered circle.
    Goes in F1's "text" group.
  - `line-dark` → `gray-600`: alternate's active stroke *(human-named)*.
    Goes in the "lines and fills" group.
  - `button-alternate-hover` → `gray-500`: alternate's active fill. Goes
    after `button-alternate-border`.

  The EPIC's Color styles table gains three `*(new)*` rows and then has 36
  styles. The F1 catalog (`ColorSwatches`) lists them like every other
  style.
- **No hardcoded colors.** The component uses only color styles. It drops
  `text-white`, the old tokens (`accent`, `rule-strong`, `required`,
  `hover-tint`, `background`) and the danger `brightness` filter.

### States

- **Selected is a prop plus the pressed look** *(human)*. `selected` marks
  the current choice persistently. For example, while the build phase is
  on, the "Build" step is selected. The button exposes it as
  `aria-current="true"`. The same look shows while any enabled button is
  pressed (`:active`) and goes away on release.
- A selected button **keeps its look** under hover, keyboard focus and
  press.
- **Hover's look on keyboard focus only** (`:focus-visible`), per the
  EPIC. A mouse click leaves the button focused but, once the pointer
  leaves, it looks normal.
- **No focus ring.** The browser's default focus outline is suppressed
  (Tailwind `outline-hidden`). The hover look is the focus indicator.
- **Disabled** isn't in the design, and existing uses need it, so it stays
  as it was: 50% opacity, a `not-allowed` cursor, and no hover, focus or
  press change. It keeps its type's colors and shape.

### Shape, type and size

From the human's mockups (the stepper's "1 Edit the Grid / 2 Create Hints
/ 3 Publish" and a large "Send Sign-in Link"), 2026-10-24:

- **Pill ends** *(human)*, via a new token `--radius-pill: 9999px` in its
  own `@theme static` block (Tailwind `rounded-pill`), declared once. This
  replaces the EPIC's 10px corners for buttons only. The 10px corners
  still apply elsewhere; F4 (Modal) and F5 (Input) add their own token.
  The old `--radius-btn` (also 999px) stays for its other, older uses
  until epic 14. The new token keeps `Button` off the old tokens.
- **1px solid stroke on every type** (Tailwind `border`). Filled types draw
  it in their fill color, so all types share a box size.
- **Text:** `text-button-normal` (14px/600) for normal, numbered and
  alternate; `text-button-large` (18px/600) for large. Inter, with the
  tokens' line heights.
- **Sizes** *(human)*:
  - normal and alternate: 32px (2rem) tall, 20px side padding;
  - numbered: 32px tall, 4px left inset, 8px gap, 20px right padding;
  - large: 50px tall, 30px side padding;
  - no minimum width.

  The acceptance pins only that large is taller than normal and that
  normal, numbered and alternate share a height. Tuning sizes needs no
  acceptance change.
- **Numbered** *(human)*: the number sits in a 24px **white circle**
  (`inverse`, `rounded-pill`), inset 4px, followed by the label. The
  number is drawn in the button's current fill color: `button-fill`,
  `button-hover` on hover and keyboard focus, and `button-active` when
  selected or pressed. The circle carries `data-button-number`. The number
  stays in the button's text, so its accessible name reads "1 Edit the
  Grid".

### The catalog

- The existing `sg-buttons` section and its `sg-hover` wrapper stay (frozen
  `style-guide.spec.ts` D8-1 requires both). Their contents become, for
  each type, one unselected and one selected button
  (`data-testid="sg-button"`, `type="button"`), plus a disabled button
  (`sg-button-disabled`). The hover-link sample stays.
- `sg-button-primary` and `sg-button-quiet` go away. No frozen test reads
  them.
- The `sg-confirmation` example's danger/quiet pair becomes normal and
  alternate. Section headings stay as they are; restyling the old
  sections isn't F3's job.
- No horizontal overflow at 1280px or 375px.

### Retired acceptance

Approving this story approves two changes, made only in the
specification-only freeze commit on `main`:

1. **Retire `e2e/controls.spec.ts` D2-1 `the danger button looks
   different from the primary button`** (deletion only). The new design
   has no danger type *(human)*; F3-9 replaces it by asserting which type
   each builder action uses. The other two D2-1 cases stay unchanged and
   pass against the scratch: pointer cursor and non-transparent background,
   and new-puzzle hover changes its background.
2. **Add the three new styles to the `STYLES` map** in
   `src/app/globals-css.test.ts` and `e2e/color-tokens.spec.ts`:
   `inverse: 'white'` after `subtle`, `'line-dark': 'gray-600'` after
   `'line-highlight'`, and `'button-alternate-hover': 'gray-500'` after
   `'button-alternate-border'`. No other line changes. This extends F1's
   style set to the EPIC's amended table. Without it, F1's "no @theme
   colors besides…" check fails on the new styles. With it, the F1
   catalog, resolve and live-follow cases also cover them.

No other frozen test pins button styling. `style-guide.spec.ts` lists
`--radius-btn` among tokens that must resolve, and F3 keeps it.

## Acceptance

Proposed; frozen at approval, then immutable:

- `e2e/buttons.spec.ts`: 20 browser cases.
  - F3-1 catalog (3): each type appears once unselected and once selected
    as a real `<button type="button">`, plus a disabled button. A numbered
    button's text starts with its number, then its label; the other types
    don't start with a digit. No horizontal overflow at 1280px or 375px.
  - F3-2 shape and type (3): every type, selected or not, is a pill
    (every corner radius at least half its height) with a 1px solid
    stroke on all sides. Each uses its button text style in Inter with the
    token's line height. Large is taller than normal; normal, numbered and
    alternate share a height. A numbered button's number sits in a round
    `inverse` circle smaller than the button. The number's color equals
    the button's fill when normal, hovered, keyboard-focused and selected.
    Other types have no circle.
  - F3-3 normal state (2): filled types are `button-fill` with `inverse`
    text. Alternate is `fill-muted` with a `button-alternate-border`
    stroke and `subtle` text. Every type shows a pointer cursor and no
    outline.
  - F3-4 hover (1): hover changes every type. Filled types turn
    `button-hover`. Alternate turns `button-alternate-hover` with a
    `line-dark` stroke on all sides and `inverse` text. Each restores when
    the pointer leaves.
  - F3-5 keyboard focus (2): Tab focus looks exactly like hover, with no
    outline. Mouse-click focus looks normal once the pointer leaves.
  - F3-6 selected (3): selected differs from normal. Filled types are
    `button-active` with `inverse` text, unlike their hover. Alternate's
    selected look equals its hover look. A selected button doesn't change
    under hover or keyboard focus. Pressing any button shows its type's
    selected look until release.
  - F3-7 disabled (1): opacity below 1, a `not-allowed` cursor, the same
    shape, and no change under hover or press.
  - F3-8 token-driven (1): live edits of `--palette-interactive-light`,
    `--palette-gray-200`, `--palette-white`, `--palette-gray-600`,
    `--palette-gray-500` (alternate hovered) and `--radius-pill` repaint
    or reshape the buttons, and they restore afterwards.
  - F3-9 adoption (4): `new-puzzle-button` is a normal button with the
    new shape and 14px text. In the builder, delete and both confirms are
    filled and clear-letters and both cancels are alternate. In the
    new-puzzle dialog, create is filled and cancel is alternate. Sign-out
    is alternate.
- `src/components/ui/button-source.test.ts`: 3 Vitest cases.
  - `Button.tsx` has no literal color, built-in `white`/`black`, old color
    token, `rounded-btn`, arbitrary `rounded-[…]` or `brightness`, and
    uses `rounded-pill`.
  - No `<Button>` under `src/` passes `variant` `primary`, `quiet` or
    `danger`.
  - `--radius-pill` is declared exactly once in `globals.css`, inside
    `@theme`, as `9999px`.
- The two amendments under Retired acceptance.

Discrimination observed on 2026-10-24, after revising the acceptance for
the human's answers:

- A scratch implementation of these Decisions changed `Button.tsx`,
  `globals.css`, `ColorSwatches.tsx`, the style guide and the call sites.
  With it and the two amendments, `npm run verify` exited 0 (589 tests).
  One run of `buttons.spec.ts` with `controls.spec.ts`,
  `style-guide.spec.ts`, `color-tokens.spec.ts`, `text-styles.spec.ts`,
  `modal.spec.ts` and `modal-a11y.spec.ts` passed 81/81 (with setup).
  Then `buttons.spec.ts` passed twice more (`--repeat-each=2`, 41/41).
- With the scratch runtime stashed and the tests kept, all 3 F3 Vitest
  cases failed, and so did F1's amended `declares each style in @theme…`
  check. 19 of 20 browser cases failed; F3-1's overflow case passed, as a
  guard against regression.
- Browser runs used the standing guarded test-reset grant
  ([DEVELOPMENT](../../../DEVELOPMENT.md#e2e-environment)).

## Repo paths

New acceptance, immutable after freeze:

- `e2e/buttons.spec.ts`
- `src/components/ui/button-source.test.ts`

Frozen acceptance changed in the freeze commit only (see Retired
acceptance): `e2e/controls.spec.ts`, `e2e/color-tokens.spec.ts`,
`src/app/globals-css.test.ts`.

Runtime:

- `src/components/ui/Button.tsx`: the redesign.
- `src/app/globals.css`: add `--color-inverse`, `--color-line-dark`,
  `--color-button-alternate-hover` and `--radius-pill`. Nothing else
  changes.
- `src/components/style-guide/ColorSwatches.tsx`: list the three new
  styles.
- `src/app/style-guide/page.tsx`: the button catalog and the
  confirmation example.
- Call sites, variant names only: `src/components/ui/ModalActions.tsx`,
  `src/components/puzzle/DeletePuzzleButton.tsx`,
  `src/components/puzzle/DisplayNameDialog.tsx`,
  `src/components/grid/ClearLettersButton.tsx`,
  `src/components/grid/EditGridToggle.tsx`,
  `src/components/grid/PublishControls.tsx`,
  `src/components/play/PlayReset.tsx`,
  `src/components/auth/SignOutButton.tsx`.
- This story, `../EPIC.md` (the three new style rows and the pill
  exception to 10px corners) and
  `../HANDOFF.md`.

Declare any other path before editing it. Elements styled like buttons
that don't render `Button` (the `/puzzles` row links, `LibraryPlayControls`,
`PlayReset`'s menu control, `PlayPuzzle`'s plain button, the stepper and the
style-guide tooltip target) stay as they are. Epic 14 redesigns them with
their screens.

## Scope discipline

Only F3. No screen layout change, no stepper or Build/Play adoption of
numbered or selected (epic 14), no modal, input, toggle or radio work
(F4–F6), no old-token deletion, no responsive work. Destructive buttons
don't move; epic 14 handles clear-letters, reset and delete.

## Definition of done

- Human approval of this specification, its acceptance and the retired
  acceptance, recorded here and in the handoff. Freeze on `main` in a
  specification-only commit that adds the new acceptance, makes the two
  amendments and updates the EPIC, before any runtime change.
- Frozen acceptance is unchanged after freeze.
- `npm run verify` exits 0, and the full `npm run test:e2e` suite exits 0.
- Visually check at desktop and phone widths: the catalog in every state
  (including Tab focus), `/puzzles`, the new-puzzle dialog, the builder's
  danger zone and its confirmations, publish/unpublish, and play's reset
  confirmation.
- Update the handoff with observed results, commit and push `main`. F4
  remains pending.
