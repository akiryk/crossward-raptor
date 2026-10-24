# Story F1 — Color tokens

Add the redesign's color palette alongside the old tokens, as two layers:
raw variables and use-named styles. Turn `/style-guide` into a plain catalog
that shows the new palette, retiring the live token editor and its frozen
acceptance.

**Status:** approved by the human on 2026-10-24, including the 28-test
retirement and the `--palette-` prefix (reconfirmed at freeze). Frozen on
`main` in the specification-only commit that adds this status line.
**Blast radius: low:** stylesheet, the style-guide page and its components.
No CODE-REVIEW risk path; direct delivery to `main`.

## Decisions

Inspected `src/app/globals.css`, `src/app/style-guide/`,
`src/components/style-guide/*`, `e2e/style-guide.spec.ts`,
`e2e/shell.spec.ts`, `e2e/typography.spec.ts` and the Playwright/Vitest
configs on 2026-10-24. Values and names come from the
[EPIC](../EPIC.md#color-variables) tables, which this story does not repeat.

### Tokens

- **Variables are `--palette-<name>`**, e.g. `--palette-gray-200: #DDE0E6`,
  declared in a plain `:root` rule outside any `@theme` block. The prefix
  keeps them greppable and keeps `--palette-text-error` from reading like a
  Tailwind `--text-*` font-size token. Tailwind generates no utility from them.
- **Styles are `--color-<token name>` inside `@theme`**, each exactly
  `var(--palette-<variable>)`, never a copied hex, so editing a variable in
  devtools repaints every style using it. Token names follow the EPIC's
  no-doubled-names column (`--color-primary`, not `--color-text-primary`).
- **`modal-backdrop` is black at 40%** through the variable, e.g.
  `color-mix(in srgb, var(--palette-black) 40%, transparent)`. Chromium reports
  that as `color(srgb 0 0 0 / 0.4)`; the acceptance accepts that or `rgba()`.
- **Every variable and style resolves on every page**, whether or not a
  utility uses it yet. Tailwind 4 may drop unused theme variables, so the new
  styles may need `@theme static` or an equivalent. This is the
  implementer's choice.
- **The old tokens are untouched:** same names, values and `@theme` placement.
  Nothing outside the style guide switches to a new token in this story.
  Mapping old tokens to new ones is out of scope. The only `@theme` colors
  are the 23 old tokens and the 33 new styles.

### The catalog

- Remove the token pane and its tabs, color pickers, font/size/weight and
  utility controls, and the Google Fonts URL loader. The page becomes a
  single scrolling column. Live tuning stays possible through devtools,
  using the CSS variables.
- Add a **Colors** section (`sg-colors`) first, with two groups:
  - **Variables:** one `sg-color-variable` row per variable, with
    `data-variable="<name>"`, showing the name, the hex value and a swatch
    (`sg-swatch`) painted with the variable.
  - **Styles:** one `sg-color-style` row per style, with
    `data-style="<token name>"`, showing the token name, the variable it
    references (for the backdrop, `black` and `40%`) and a swatch
    (`sg-swatch`) painted through the style, preferably its Tailwind utility
    (`bg-<token name>`). A swatch must stay visible against the page,
    for example with a `line-muted` border, so white swatches don't disappear.
- Keep every existing example section and its test id (`sg-text` through
  `sg-grid-hints-editing`) and the real grid samples unchanged. They show the
  current components, which later stories redesign in place. F2 adds text
  styles to the catalog; F3–F7 add components.
- Layout, swatch size and grouping are routine details. Use new tokens
  for the Colors section's own text and lines where a style fits.
- No horizontal overflow at 1280px or 375px.

### Retired acceptance

Approving this story approves retiring the following frozen tests in
`e2e/style-guide.spec.ts`. They pin the live editor, which the EPIC removes.
The retirement is **deletion-only** and lands in the story's
specification-only freeze commit on `main`. Also delete the helpers and
constants that become unused: `asRgb`, `picker`, `colorInput`, `setToken`,
`SIZE_TOKENS`, `WEIGHT_TOKENS` and `UTILITY_TOKENS`. No kept assertion
changes.

| Frozen block | Retired tests | Replacement |
| --- | --- | --- |
| D8-1 structure | `both panes render`, `three tabs render with colors selected by default`, `selecting another tab swaps the panel` | F1-5: editor is gone |
| D8-2 colour pickers | all 7 | F1-2 live-follow test and F1-4 catalog swatches |
| D9-2 fonts tab | all 5 | None; type tuning happens in devtools (F2 adds the text-style catalog) |
| D10-2 utility tab | all 4 | None; devtools |
| D10-3 font loading | all 6 | None; the font loader is removed |
| D8-4 pinned token pane | 1 | None; no pane |
| D8-5 responsive | 2 (each asserts `token-pane`) | F1-5 overflow at the same viewports |

That is 28 retired tests. These stay unchanged: D8-1 `every example section
still renders`, D8-1 `every token still resolves, including the newly
registered one`, and all of D8-3 real grid samples. No other frozen file is
affected. `shell.spec.ts` P0-3 and `typography.spec.ts` assert old tokens,
which F1 keeps. Typography retirements belong to F2.

## Acceptance

Frozen; do not edit:

- `e2e/color-tokens.spec.ts`: 10 browser cases.
  - F1-1: every variable resolves to its hex on `/puzzles`.
  - F1-2: every style resolves to its variable on `/puzzles`. On
    `/style-guide`, editing each style's variable live repaints the style
    and its catalog swatch, and removing the edit restores it.
  - F1-3: the 23 old color tokens keep their committed values.
  - F1-4: the catalog shows each variable with its name, hex and a swatch,
    and each style with its token name, variable and a swatch.
  - F1-5: no editor controls or color inputs remain, and there is no
    overflow at 1280px or 375px.
- `src/app/globals-css.test.ts`: 5 Vitest cases over the stylesheet
  source.
  - Each variable is declared once, outside `@theme`, with its hex.
  - No `--palette-*` is declared inside `@theme`.
  - Each style is declared in `@theme` as `var(--palette-<variable>)`.
  - The backdrop is `var(--palette-black)` at 40%, with no hex literal.
  - `@theme` declares no color besides the old tokens and the new styles.

Discrimination observed on 2026-10-24: the Vitest file fails 3 of 5 against
current `main`. The 2 guard cases pass, because no palette exists yet. A
scratch stylesheet that follows these Decisions (deleted afterwards) passed
all 5. A Chromium probe confirmed the `color(srgb … / 0.4)` backdrop form
and that it follows a live variable edit. The browser spec lists 10 cases,
type-checks and lints. It has not been run against the app, where every case
needs the missing palette or catalog.

## Repo paths

New acceptance, immutable after freeze:

- `e2e/color-tokens.spec.ts`
- `src/app/globals-css.test.ts`

Frozen acceptance, edited only by the deletion-only retirement above, in the
freeze commit:

- `e2e/style-guide.spec.ts`

Runtime:

- `src/app/globals.css`: add the palette `:root` rule and the style tokens.
  Old tokens unchanged.
- `src/app/style-guide/page.tsx`: drop the token pane and add the Colors
  section.
- `src/components/style-guide/ColorSwatches.tsx` (or a similar name):
  new, the Colors catalog.
- `src/components/style-guide/{TokenPane,ColorPicker,SizeControl,WeightControl,UtilityControl,FontLoader}.tsx`:
  removed.
- `src/components/style-guide/GridExamples.tsx`: unchanged.
- This story, `../EPIC.md` (status only) and `../HANDOFF.md`.

Declare any other path before editing it. No component, screen, font or
typography change.

## Scope discipline

Only F1. No new token is adopted outside the style guide. No old token is
removed or changed. No typography, font, radius, stroke or component work
(F2–F7). No screen redesign (epic 14).

## Definition of done

- Human approval of this specification, its acceptance and the 28-test
  retirement, recorded here and in the handoff. Freeze on `main` in a
  specification-only commit that adds the new acceptance and applies the
  retirement before any runtime change.
- Frozen acceptance is unchanged after freeze.
- `npm run verify` exits 0, and the full `npm run test:e2e` suite exits 0,
  including the kept style-guide tests and `shell.spec.ts`.
- Visually check the catalog at desktop and phone widths, including white
  swatches and the translucent backdrop swatch.
- Update the handoff with observed results, commit and push `main`. F2
  remains pending.
