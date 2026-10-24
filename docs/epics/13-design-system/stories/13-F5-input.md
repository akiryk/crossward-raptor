# Story F5 — Input

Redesign the existing `TextInput` in place as the redesign's input: one
underlined field in two sizes, regular and large, with an optional
placeholder, an optional label above and an optional error below. Its
underline turns blue on focus and red on error. Every existing field takes
the new look, sign-in becomes large, the two naming dialogs pass their names
as labels, and `/style-guide` catalogs the variations.

**Status:** approved by the human as written (2026-10-24) and frozen;
implementation in progress.
**Blast radius: low:** one UI component, its five call sites (size, label
and the dropped variant only) and the style-guide page. No CODE-REVIEW risk
path, so this is delivered directly to `main`.

## Decisions

Inspected `src/components/ui/TextInput.tsx`, its call sites
(`SignInForm`, `NewPuzzleDialog`, `DisplayNameDialog`, `HintsPanel`, the
style-guide page), `src/app/globals.css`, every frozen browser spec that
touches those fields, and the Figma export, on 2026-10-24. The export says
only "Size: regular or large; some inputs have placeholder content (e.g.
when signing in) and others don't; some have label and some don't". The
human supplied three mockups (new-puzzle name, sign-in, hint making) and
answered the open points on 2026-10-24. Those answers are marked *(human)*.

### The field

- **An underline only** *(human mockups)*. The field has a 1px bottom line
  and no other border, fill, radius or focus ring. It fills its
  container's width. The old `box` and `underline` variants and the
  `variant` prop go away.
- **Underline colors** *(human)*. The line is `line-muted` at rest and
  `line-highlight` on focus, by click or keyboard. The human had pictured
  `line-dark` on focus and chose to try the more conventional blue.
  Hovering doesn't change the line, because the EPIC asks only for the
  focus change.
- **Text** is `primary`, and the placeholder is `muted` *(human
  mockups)*. The text starts 4px inside the line's left end, as in the
  mockups.
- **Disabled** keeps 50% opacity and a `not-allowed` cursor.
- **No old tokens.** `TextInput` drops `text-foreground`, `border-rule`,
  `border-accent`, `bg-background`, `rounded-md` and `ring-*`.

### Sizes

- **Regular:** `body-normal` (14px/400) *(human: "the placeholder text is
  body-text-normal")*, with 4px of padding above and below.
- **Large:** `body-large` (18px/400) *(human: sign-in "uses a larger
  version")*, with 6px above and below, so it's taller than regular.
- A `size` prop (`'regular' | 'large'`) defaults to regular.

### Label

- **Optional, above the field** *(human: the new-puzzle mockup's "Name
  it!")*: `title-4` (14px/600) in `primary`, left-aligned with the line,
  8px above it. It is a real `<label for>`, so clicking it focuses the
  field. It doesn't change on focus. It carries `<testid>-label`.
- The **hint row's answer**, shown below the line, right-aligned and
  letter-spaced, `muted` turning `primary` on focus *(human mockup)*, is
  not this label. It belongs to epic 14's **Hint Input**, which builds on
  this field.

### Error

- **Optional `error` message** *(human: the sign-in mockup's "Oops! You
  need to add a username.")*. While it's set, the line is `error`, and it
  stays `error` on focus. The message sits 8px below the line, left-aligned
  with it, in `body-normal` `error`, and carries `<testid>-error`.
- The field gets `aria-invalid="true"` and `aria-describedby` pointing at
  the message. A field without an error has neither attribute and shows no
  message.

### Call sites *(human: "sizes + labels")*

- **Sign-in email:** large, with its placeholder.
- **New-puzzle name** and **builder name:** their "Puzzle name" and
  "Builder name" spans become the Input's label, so they turn `title-4`.
  The fields stay regular. Their accessible names, test ids and initial
  focus don't change.
- **Hint inputs:** regular, with the `variant` prop dropped.
- **Messages stay where they are.** The builder-name dialog's validation
  and save messages and the sign-in failure alert keep their current
  markup. Moving them into `error` would open the builder-name field red,
  because an empty name is invalid. Epic 14 restyles the dialog and
  screen content.

### The catalog

- The `sg-inputs` section on `/style-guide` replaces its demo and its static
  old-style "focused example" with four samples:
  - `sg-input-regular`: regular, with a placeholder;
  - `sg-input-label`: regular, labelled "Name it!", with a placeholder;
  - `sg-input-large`: large, with a placeholder;
  - `sg-input-error`: large, with a placeholder and an error.
- No horizontal overflow at 1280px or 375px.

### Retired acceptance

None. No frozen test pins the old input look. `controls.spec.ts` D2-3
checks only that a hint input has a visible edge (still true).
`style-guide.spec.ts` checks that `sg-inputs` renders (it still does).
`hints-layout.spec.ts`, `display-name.spec.ts`, `new-puzzle.spec.ts`,
`modal-a11y.spec.ts`, `modal-design.spec.ts`, `front-door.spec.ts` and
`manual-login.spec.ts` pin positions, test ids, names and focus, which
are all kept. No frozen file changes in the freeze commit.

## Acceptance

Frozen at approval (2026-10-24); immutable:

- `e2e/inputs.spec.ts`: 17 browser cases.
  - F5-1 catalog (2): the four samples are text inputs inside `sg-inputs`.
    The regular and large samples have placeholders, the label sample has
    label text and the error sample has message text. There is no
    horizontal overflow at 1280px or 375px.
  - F5-2 underline (3): regular, labelled and large rest with only a 1px
    solid `line-muted` bottom border, with no radius, fill, outline or box
    shadow. Hover changes nothing. Focus by click and by Tab turns the line
    `line-highlight` with no ring, and blur restores it. Disabled is dimmed
    and `not-allowed`.
  - F5-3 sizes and text (3): regular is `body-normal` and large is
    `body-large` (Inter, the token line heights), both in `primary`, with
    large taller. Placeholders are `muted`. The text inset is 2–8px.
  - F5-4 label (2): the label is above the field, left-aligned with it,
    in `title-4` `primary`. Its text names the field, clicking it focuses
    the field, and its style doesn't change on focus.
  - F5-5 error (2): the line is `error` at rest and when focused. The
    message is below the line, left-aligned, `body-normal` in `error`.
    `aria-invalid` and `aria-describedby` point at the message. Fields
    without an error have neither attribute and no message.
  - F5-6 call sites (4): sign-in email is large with a `line-muted`
    underline and a placeholder. The builder-name and new-puzzle fields
    have `title-4` labels "Builder name" and "Puzzle name" above them, are
    regular, keep their accessible names and open focused with a
    `line-highlight` line. Hint inputs are regular, `line-muted`, and turn
    `line-highlight` on focus.
  - F5-7 token-driven (1): live edits of `--palette-gray-200` and
    `--palette-blue-bright` repaint the resting and focused line, and the
    line restores afterwards.
- `src/components/ui/input-source.test.ts`: 3 Vitest cases.
  - `TextInput.tsx` has no literal color, built-in `white`/`black`, old
    color or type token, `rounded`, `ring-` or arbitrary weight. It uses
    `border-line-muted`, `focus:border-line-highlight`, `border-error`,
    `text-error`, `text-primary`, `placeholder:text-muted`,
    `text-body-normal`, `text-body-large` and `text-title-4`.
  - No `<TextInput>` call site passes `variant`.
  - Sign-in passes `size="large"`. The new-puzzle and builder-name
    dialogs pass `label="Puzzle name"` and `label="Builder name"`.

Discrimination observed on 2026-10-24:

- A scratch implementation of these Decisions changed every Runtime path
  below. With it, `npm run verify` exited 0 (595 tests). One run of
  `inputs.spec.ts` with `controls.spec.ts`, `hints-layout.spec.ts`,
  `modal-design.spec.ts`, `display-name.spec.ts`, `new-puzzle.spec.ts`,
  `front-door.spec.ts`, `manual-login.spec.ts`, `style-guide.spec.ts`,
  `hints-panel.spec.ts` and `modal-a11y.spec.ts` passed 115/115.
  `inputs.spec.ts` then passed twice more (`--repeat-each=2`, 35/35 with
  setup).
  The full `npm run test:e2e` suite with the scratch passed 480/480,
  so no frozen test needs retiring.
- With the scratch runtime removed and the tests kept, all 3 F5 Vitest
  cases failed, and 16 of the 17 browser cases failed. The overflow case
  passes either way, because it guards the new catalog against overflow.
- Most of those fail at the missing catalog, so two targeted mutations of
  the scratch followed. A `hover:border-line-dark` line failed only F5-2's
  hover/focus case. Letting focus override the error line
  (`focus:border-line-highlight` on error) failed only F5-5's error-line
  case.
- Browser runs used the standing guarded test-reset grant
  ([DEVELOPMENT](../../../DEVELOPMENT.md#e2e-environment)).

## Repo paths

New acceptance, immutable after freeze:

- `e2e/inputs.spec.ts`
- `src/components/ui/input-source.test.ts`

Runtime:

- `src/components/ui/TextInput.tsx`: the redesign.
- `src/components/auth/SignInForm.tsx`: `size="large"`.
- `src/components/puzzle/NewPuzzleDialog.tsx`: the label.
- `src/components/puzzle/DisplayNameDialog.tsx`: the label.
- `src/components/grid/HintsPanel.tsx`: drop `variant`.
- `src/app/style-guide/page.tsx`: the `sg-inputs` samples.
- This story, `../EPIC.md` (F5 status) and `../HANDOFF.md`.

Declare any other path before editing it. `PuzzleTitle` is its own inline
field rather than a `TextInput`, so it stays as it is until epic 14.

## Scope discipline

Only F5. No Hint Input (with its answer label or skeleton), no message
moves, no restyle of dialog or screen content beyond the two labels, no
Radio or toggle work (F6), no old-token deletion and no responsive work.

## Definition of done

- Human approval of this specification and its acceptance, recorded here
  and in the handoff. Freeze on `main` in a specification-only commit that
  adds the new acceptance before any runtime change.
- Frozen acceptance is unchanged after freeze.
- `npm run verify` exits 0, and the full `npm run test:e2e` suite exits 0.
- Visual check at desktop and phone widths: the catalog, sign-in, the
  new-puzzle and builder-name dialogs and the hint inputs.
- Update the handoff with observed results, commit and push `main`. F6
  remains pending.
