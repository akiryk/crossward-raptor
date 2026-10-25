# Story F7 — Title, Logo and Masthead

Build the last three shared components. **Title** is a heading in one of
the four title styles and any text color style. **Logo** is the
boxed-letters CROSSWORD wordmark. **Masthead** is the app's header bar,
holding the logo (a link home) and, when signed in, a Sign out link. The
Masthead replaces today's dark header on every page, and `/style-guide`
catalogs all three. Title and a standalone Logo are adopted screen by
screen in epic 14.

**Status:** approved by the human as written on 2026-10-24, after they
settled the two [open points](#open-points), frozen on `main` in
`5509870`, and done. They
answered the six questions and supplied a masthead mockup the same day.
**Blast radius: low:** two new UI components, one restyled layout
component, the sign-out control's look, the root layout's header and the
style-guide page. No CODE-REVIEW risk path, so this is delivered directly
to `main`.

## Decisions

Inspected `src/components/layout/Header.tsx`, `src/app/layout.tsx`,
`SignOutButton`, `SessionRenewal`, `globals.css`, the style-guide page,
every frozen test touching `app-header`, `home-link`, `sign-out` or the
"Crossward" link, the Figma export, the human's
`~/Downloads/crossword-logo.svg` and their masthead mockup, on 2026-10-24.
The export says only "Title: color can be any of the text color tokens",
"Logo: this is the CROSSWARD logo" and "Masthead: the header with logo and
sometimes a signout button". Choices marked *(agent)* were approved with
the story.

### Title *(human: as proposed)*

- **A heading in a title style.** `Title` in `src/components/ui/Title.tsx`
  takes `size` 1 to 4, giving `title-1` (44px) to `title-4` (14px), all
  600. It renders `h1` to `h4` to match the size, and an `as` prop (`h1`
  to `h6`) overrides the element when the page outline needs a different
  level. The style follows `size`, never the element.
- **Any text color style** *(EPIC)*. A `color` prop takes one of the seven
  text color styles: `primary` (the default), `muted`, `link-muted`,
  `highlight`, `error`, `subtle` and `inverse`. No other color is possible.
- It passes through `id` and `data-testid`. No margins: callers lay it out.
- The editable puzzle title (`PuzzleTitle`) and the existing page headings
  are not changed here; they are epic 14's.

### Logo

- **The supplied SVG, inline** *(human)*. `Logo`
  (`src/components/ui/Logo.tsx`) renders the human's SVG inline, keeping
  its shapes: a 172×20 viewBox with nine square cells in one row (each
  cell a path marked `data-logo-cell`) and nine outlined letters reading
  C R O S S W O R D (each a path marked `data-logo-letter`). Neighbouring
  cells share their 1px stroke. The logo is the same size everywhere for
  now; epic 15 owns any scaling.
- **Colors come from styles, not the file** *(agent)*. The SVG's literal
  `white` and `#BABCBE` are replaced by utilities: cells
  `fill-logo-cell stroke-logo`, letters `fill-logo`. Letter shapes stay
  fixed; only their colors are live.
- **New color styles** *(human)*. `logo` (gray-400) for the strokes and
  letters and `logo-cell` (white) for the cells.
- **Accessible name** *(agent)*. The SVG is hidden from assistive
  technology, and visually hidden text reads "Crossward", the app's name.
  This keeps the frozen tests that find a link named exactly "Crossward"
  and a header containing "Crossward".
- The Logo isn't a link itself. The Masthead wraps it in one.

### Masthead

- **Replaces the header now** *(human)*. `Header` stays the session-aware
  wrapper in the root layout and renders a new presentational `Masthead`
  (`src/components/layout/Masthead.tsx`). It keeps the `app-header` test
  id, the `<header>` landmark and `SessionRenewal` when signed in. Today's
  dark bar with "Crossward" in display type goes.
- **Layout, from the mockup** *(human)*. A white bar (new style
  `masthead`, white, `bg-masthead`) across the full width, with a 1px
  `line-muted` hairline along its bottom edge, also full width. The logo
  has 20px between it and the window's top, left and the hairline, so the
  bar is 61px tall including the hairline. The Sign out link sits 20px
  from the right edge *(human: the stated 20px padding applies; the
  mockup's apparent gap doesn't override it)*.
- **The logo is the home link.** A link to `/` around the Logo, test id
  `home-link` (kept), accessible name "Crossward".
- **Logo link hover and focus** *(human: as proposed)*. Hovering the
  link, or keyboard focus on it, turns the logo's strokes and letters
  `button-hover`, over the 150ms `ease-out` color transition. The cells
  stay `logo-cell`. There is no focus ring.
- **Sign out is a link** *(human, mockup)*. When signed in, "Sign out"
  sits at the right, vertically centred on the logo. It looks like a link:
  `body-large` text in `link-muted` *(human: the color the styles and
  rules set, not one matched to the mockup)*, no underline, no fill, border, ring
  or shadow. Hover and keyboard focus turn it `button-hover` over the
  150ms `ease-out` transition *(agent)*. It stays a `<button>` (it acts,
  it doesn't navigate) with test id `sign-out`, and signs out as before.
  `Masthead.tsx` exports this look as `MastheadAction`, which
  `SignOutButton` renders, so the catalog sample can share it without
  signing anyone out. It replaces F3's alternate `Button` here, which
  retires one F3 case (below).
- **No old tokens.** The header drops `bg-foreground`, `text-background`,
  `font-display` and `text-xl`.

### The catalog

- A new `sg-titles` section shows `sg-title-1` to `sg-title-4` in
  `primary`, then one `title-3` sample per color style
  (`sg-title-<color>`). The `inverse` sample sits on a `primary`
  background so it's visible. `sg-title-as` is a `title-3` sample rendered
  as `h5`.
- A new `sg-logo` section shows the Logo.
- A new `sg-masthead` section shows `sg-masthead-signed-out` and
  `sg-masthead-signed-in`. The signed-in sample's Sign out is an inert
  `MastheadAction` (test id `sg-masthead-sign-out`).
- No horizontal overflow at 1280px or 375px.

### Retired acceptance

Approving this story approves two changes, made only in the
specification-only freeze commit on `main`:

1. **Retire `e2e/buttons.spec.ts` F3-9 `sign-out is an alternate
   button`** (deletion only). The mockup makes Sign out a link
   *(human)*; F7-4 replaces the case by pinning the link look. The other
   three F3-9 cases stay unchanged.
2. **Add the three new styles to the `STYLES` map** in
   `src/app/globals-css.test.ts` and `e2e/color-tokens.spec.ts`:
   `logo: 'gray-400'`, `'logo-cell': 'white'` and `masthead: 'white'`
   after `'modal-title-background'`. No other line changes. As in F3 and
   F4, F1's "no @theme colors besides…" check otherwise fails on them.

No other frozen test is expected to need changing. `shell.spec.ts` needs
`app-header` visible, containing "Crossward" and with a non-transparent
background: white satisfies it. `text-styles.spec.ts` needs `app-header`
to render in Inter, which it inherits. `play-entries.spec.ts` focuses the
link named exactly "Crossward", and `session-renewal.spec.ts` clicks
`home-link`; both are kept. `manual-login`, `route-protection`,
`session-renewal` and `session-validation` find, click or count
`sign-out`, which is kept. `style-guide.spec.ts` lists sections, and the
new ones add to it. The scratch implementation's full suite run confirms
this before approval.

## Acceptance

Proposed; frozen at approval, then immutable:

- `e2e/masthead.spec.ts`: 11 browser cases. SVG geometry is read from
  each element's own rect, since Playwright's box model widens SVG paths.
  - F7-1 Title (1): each size sample is the matching heading element in
    the matching title style (Inter, size, 600, the style's line height)
    and `primary`. Each color sample is an `h3` in `title-3` and its color
    style. The `as` sample is an `h5` in `title-3`.
  - F7-2 Logo (2): an SVG 172×20 with nine `data-logo-cell` paths, each
    19 to 20px square, left to right in one row, and nine
    `data-logo-letter` paths, each inside exactly one cell. Cells are
    `logo-cell` with a 1px `logo` stroke and letters are `logo`. The SVG is
    `aria-hidden` and the Logo's hidden text is "Crossward".
  - F7-3 Masthead signed out (1): on `/` signed out, `app-header` is the
    `banner` landmark, `masthead`, from the left edge across the full
    window, with only a 1px solid `line-muted` bottom border, 61px tall.
    The logo inside `home-link` (`href="/"`, name "Crossward") is 20px
    from the top, the left and the hairline, in its logo colors. There is
    no `sign-out`.
  - F7-4 Masthead signed in (1): on `/puzzles`, `sign-out` is a button
    reading "Sign out" in `body-large` `link-muted`, with a transparent
    background and no border, outline, shadow or underline. It's
    vertically centred on the logo (within 1.5px) and 20px from the
    right. The bar is still 61px tall.
  - F7-5 hover and focus (3): hovering `home-link` turns the logo's
    strokes and letters `button-hover` and leaves the cells `logo-cell`;
    keyboard focus does the same with no outline or shadow; leaving and
    blur restore. Sign out does the same in its text color. The logo's
    strokes and letters and Sign out's color transition over `0.15s`
    `cubic-bezier(0, 0, 0.2, 1)`.
  - F7-6 token-driven (1): live edits of `--palette-gray-400` repaint the
    logo's strokes and letters, and of `--palette-white` its cells and the
    bar, and both restore.
  - F7-7 catalog and overflow (2): the three new sections hold their
    samples, the signed-in sample has a Sign out and the signed-out one
    doesn't, and neither uses the `sign-out` test id. At 1280px and 375px,
    `/style-guide` has no horizontal overflow, and on `/puzzles` the
    masthead doesn't overflow and Sign out stays inside the window. The
    puzzle list's own overflow isn't F7's.
- `src/components/ui/title-source.test.ts`: 4 Vitest cases.
  - `Title.tsx`, `Logo.tsx` and `Masthead.tsx` have no literal color
    (including SVG `fill`/`stroke` attributes other than `none`), built-in
    `white`/`black`, old color or type token, `font-display`, `ring-`,
    `outline-*` other than `outline-none`/`outline-hidden`, `shadow`,
    radius or arbitrary weight. Title uses all four title utilities and
    all seven text color utilities. Logo uses `fill-logo-cell`,
    `stroke-logo`, `fill-logo`, `stroke-button-hover`,
    `fill-button-hover` and the two `data-logo-*` markers. Masthead uses
    `bg-masthead`, `border-line-muted`, `text-body-large`,
    `text-link-muted`, `text-button-hover` and defines `MastheadAction`.
  - `Header.tsx` renders `<Masthead` with no old tokens, and
    `SignOutButton.tsx` renders `<MastheadAction`, not `<Button`.
- The new styles' mappings are pinned by F1's amended style maps.

Discrimination observed on 2026-10-24:

- A scratch implementation of these Decisions changed every Runtime path
  below. With it, `npm run verify` exited 0 (602 tests, the known
  `request-logger/render.ts` lint warning), and the full
  `npm run test:e2e` suite with `--workers=4` passed 505/505, so no other
  frozen test needs changing.
- In an earlier full run, F7-7 also required `/puzzles` to have no page
  overflow at 375px. It failed because the shared user's long puzzle list
  overflows, not the masthead, so the case now checks only the masthead.
  The same run had one `play-entries.spec.ts` failure (a save wait timed
  out at 24s under load). That spec passed 28/28 alone and in the next
  full run.
- With the scratch runtime removed and the tests kept, all 4 F7 Vitest
  cases and all 11 F7 browser cases failed, along with F1's amended
  style-map checks (1 Vitest and 3 browser cases).
- Five targeted mutations of the scratch each failed only the expected
  cases:
  - cells turning `button-hover` on hover: only F7-5's logo case;
  - 24px side padding: only F7-3 and F7-4;
  - an underlined Sign out: only F7-4;
  - `Title` ignoring `as`: only F7-1;
  - no transition on Sign out: only F7-5's transition case.
- A screenshot at 1000px and 375px, signed in, matched the mockup's
  structure. Two differences are for the human (see
  [Open points](#open-points)).
- Browser runs used the standing guarded test-reset grant
  ([DEVELOPMENT](../../../DEVELOPMENT.md#e2e-environment)).

## Open points

Both settled by the human on 2026-10-24; the specification already matched:

1. **Sign out's color** *(human)*: `link-muted`, the color the styles and
   rules set. No new style.
2. **Right inset** *(human)*: 20px, the padding the human stated.

## Repo paths

New acceptance, immutable after freeze:

- `e2e/masthead.spec.ts`
- `src/components/ui/title-source.test.ts`
- The two amendments under [Retired acceptance](#retired-acceptance), in
  `e2e/buttons.spec.ts`, `e2e/color-tokens.spec.ts` and
  `src/app/globals-css.test.ts`.

Runtime:

- `src/components/ui/Title.tsx`: new.
- `src/components/ui/Logo.tsx`: new.
- `src/components/layout/Masthead.tsx`: new.
- `src/components/layout/Header.tsx`: renders the Masthead.
- `src/components/auth/SignOutButton.tsx`: renders `MastheadAction`.
- `src/app/globals.css`: the `logo`, `logo-cell` and `masthead` styles.
- `src/components/style-guide/ColorSwatches.tsx`: the three new styles.
- `src/app/style-guide/page.tsx`: the `sg-titles`, `sg-logo` and
  `sg-masthead` sections.
- This story, `../EPIC.md` (the new styles in the freeze commit; F7 and
  epic status at delivery) and `../HANDOFF.md`.

Declare any other path before editing it.

## Scope discipline

Only F7. No adoption of Title or a standalone Logo on any screen, no
`PuzzleTitle` or page-heading restyle, no front-door or sign-in redesign,
no logo scaling or responsive work, no username, and no old-token
deletion.

## Definition of done

- The human's approval of this specification, its acceptance and the
  retired case, recorded here and in the handoff. Freeze on `main` in a
  specification-only commit that adds the new acceptance, the two
  amendments and the EPIC's new styles before any runtime change.
- Frozen acceptance is unchanged after freeze.
- `npm run verify` exits 0, and the full `npm run test:e2e` suite exits 0.
- Visual check at desktop and phone widths, compared with the mockup: the
  catalog, the front door's masthead signed out and `/puzzles` signed in.
- Update the handoff with observed results, commit and push `main`. F7 is
  the epic's last story, so closeout follows the
  [epic index](../../README.md#close-an-epic) once it's authorized.
