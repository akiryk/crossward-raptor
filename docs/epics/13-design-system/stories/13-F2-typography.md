# Story F2 — Typography

Make Inter the app's only typeface, loaded at 400 and 600, and add the
redesign's text styles as Tailwind `--text-*` tokens. The new 14px `label`
replaces the old 12px label. `/style-guide` gains a text-style catalog.

**Status:** approved by the human on 2026-10-24 in full, including the
default line heights and the finding that no frozen test is retired. Frozen
on `main` in a specification-only commit.
**Blast radius: low:** stylesheet, root layout font loading and the
style-guide page. No CODE-REVIEW risk path; direct delivery to `main`.

## Decisions

Inspected `src/app/globals.css`, `src/app/layout.tsx`,
`src/app/style-guide/page.tsx`, every `font-display`, `text-label` and weight
use under `src/`, `e2e/typography.spec.ts`, `e2e/style-guide.spec.ts`,
`e2e/shell.spec.ts` and the built font CSS on 2026-10-24. Sizes and weights
come from the [EPIC](../EPIC.md#typography) table, which this story does not
repeat.

### Typeface

- **Remove Space Grotesk** from `layout.tsx` (import, instance, class
  variable) and from `globals.css`. Neither file mentions it afterwards,
  comments included.
- **Load Inter at exactly 400 and 600** via `next/font/google`
  (`weight: ["400", "600"]`), keeping `--font-inter`, `subsets` and
  `display: "swap"`. The browser then knows only `Inter` faces weighted
  `400` and `600`. next/font's metric-matched `Inter Fallback` face is fine.
- **`--font-display` stays** as `var(--font-inter), system-ui, sans-serif`, so
  its existing uses (headings, the header, row titles) render in Inter until
  epic 14 removes them. `--font-body` and `--font-data` are unchanged.
- **Consequence of no 700 face:** old uses of `--weight-bold` (700) and
  `font-bold` now render with the 600 face. The tokens are unchanged, so
  computed weights still read 700. This is an accepted visible change from
  the font swap; check it visually.

### Text-style tokens

- **One token triple per style** in `@theme static` (so every style
  resolves on every page whether or not a utility uses it yet):
  `--text-<name>` (size), `--text-<name>--font-weight` and
  `--text-<name>--line-height`. Tailwind 4 then makes `text-<name>` apply
  all three. Names follow the EPIC's no-doubled-names column
  (`text-body-large`, `text-button-normal`). None collides with a
  `--color-*` style or an old `--text-*` token.
- **Sizes in rem** at the 16px root (`0.875rem` = 14px), matching the old
  tokens' convention, so user zoom still scales type. Weights are the
  numbers `400` and `600`.
- **Default line heights**, tuned later by the user. Proposed values:

  | Style | Size / line height (px) |
  | --- | --- |
  | title-1 | 44 / 52 |
  | title-2 | 32 / 40 |
  | title-3, button-large | 18 / 24 |
  | body-large | 18 / 28 |
  | label, title-4, button-normal, body-normal, hint-number | 14 / 20 |
  | body-small | 12 / 16 |
  | cell-letter | 16 / 16 |
  | cell-number | 10 / 10 |

  Cell letter and number are 1:1 because they sit inside a sized cell. The
  acceptance only requires each line height to be between 1× and 2× its size,
  so tuning needs no acceptance change.
- **Letter spacing stays normal**; no letter-spacing tokens. The
  letter-spaced builder answer is settled when that screen is redesigned.
- **`cell-letter` is uppercase**, which a font-size token can't carry.
  Whatever uses the style adds Tailwind's `uppercase`; the catalog sample
  does. The grid adopts the style in epic 14.
- **`label` replaces the old label now.** The old `--text-label: 0.75rem` is
  replaced by the new triple at 14px/400, declared once. Every existing
  `text-label` use grows from 12px to 14px. Uses that set their own weight
  (the stepper badges' `[font-weight:var(--weight-bold)]`) must keep it.
  Check that visually.
- **Other old type tokens are untouched:** `--text-headline`, `--text-body`,
  `--text-help`, `--text-title`, `--weight-normal`, `--weight-bold`. No
  screen switches to a new text style in this story.

### The catalog

- Add a **Text styles** section (`sg-text-styles`) right after Colors, with
  one `sg-text-style` row per style, `data-text-style="<name>"`. Each row
  shows the name, its size in px and its weight, and a sample
  (`sg-text-sample`) set with the style's utility (`text-<name>`), plus
  `uppercase` for `cell-letter`. The sample must read the token, so a live
  devtools edit of `--text-<name>` resizes it.
- Keep the Colors section, every existing example section and its test id,
  and the grid samples unchanged. The old `sg-text` section stays because it
  shows the old tokens that current screens still use.
- Use the new color and text styles for the section's own text where one
  fits. Layout and sample text are routine details.
- No horizontal overflow at 1280px or 375px. The 44px sample must wrap or
  fit at 375px.

### Retired acceptance

**None.** The handoff expected F2 to supersede `typography.spec.ts` and the
kept style-guide token checks. On inspection, no frozen test asserts Space
Grotesk or the 12px label size. `typography.spec.ts` D9-1/D9-3,
`style-guide.spec.ts` D8-1 and `shell.spec.ts` P0-3 check only that
`--font-display`, `--text-label` and the other old tokens resolve and that the
app reads them. F2 keeps all of those tokens. A scratch implementation of
these Decisions passed all of them unchanged (see Acceptance). They pin old
tokens, so epic 14's token-deletion story retires them. The EPIC's line
saying `typography.spec.ts` asserts Space Grotesk is inaccurate. This story
leaves the EPIC unchanged apart from its status.

## Acceptance

Frozen at approval; immutable:

- `e2e/text-styles.spec.ts`: 10 browser cases.
  - F2-1: on `/puzzles`, each of the 13 styles resolves to its exact size and
    weight and a line height between 1× and 2× its size. A hint-row label
    renders at 14px.
  - F2-2: on `/puzzles` and `/style-guide`, no font face mentions Grotesk,
    and the `Inter` faces are weighted exactly `400` and `600`. The page
    heading and the header (old `font-display` uses) render in Inter. On the
    style guide both Inter weights actually load.
  - F2-3: the catalog has one row per style with its name, size, weight and
    a sample. The sample renders that size, weight and line height in Inter,
    and is uppercase for `cell-letter`. Each sample follows a live edit of
    its `--text-*` token and restores without it. No overflow at 1280px or
    375px.
- `src/app/typography-source.test.ts`: 2 Vitest cases over the source.
  - `layout.tsx` and `globals.css` don't mention Space Grotesk.
  - Each style's three tokens are declared exactly once inside `@theme`.

Discrimination observed on 2026-10-24:

- Against current `main`, both Vitest cases and all 10 browser cases fail.
  The browser run used the standing guarded test-reset grant
  ([DEVELOPMENT](../../../DEVELOPMENT.md#e2e-environment)).
- A scratch implementation of these Decisions changed `globals.css` and
  `layout.tsx` and added a minimal catalog section. Against it, both Vitest
  cases passed, along with all 5 F1 Vitest cases.
- In the same browser run, all 44 cases passed: the 10 new ones plus
  `typography.spec.ts`, `style-guide.spec.ts`, `shell.spec.ts` and
  `color-tokens.spec.ts`.
- The scratch was then reverted; `git status` showed only the two new test
  files. The new files type-check and lint.

## Repo paths

New acceptance, immutable after freeze:

- `e2e/text-styles.spec.ts`
- `src/app/typography-source.test.ts`

Runtime:

- `src/app/layout.tsx`: drop Space Grotesk; Inter at 400 and 600.
- `src/app/globals.css`: re-point `--font-display`, add the text-style
  tokens and replace the old `--text-label`. Nothing else changes.
- `src/app/style-guide/page.tsx`: add the Text styles section.
- `src/components/style-guide/TextStyles.tsx` (or a similar name): new,
  the text-style catalog.
- This story, `../EPIC.md` (status only) and `../HANDOFF.md`.

Declare any other path before editing it. No component, screen, color,
radius or stroke change. `src/lib/google-font.ts` and its test have been
unused since F1 removed the font loader. Leave them alone; removing them is
separate cleanup.

## Scope discipline

Only F2. No screen or component adopts a new text style, and no old type
token is removed or retuned except `--text-label`. No letter-spacing tokens.
No color, radius, stroke or component work (F3–F7). No responsive type
scaling (epic 15).

## Definition of done

- Human approval of this specification and its acceptance, including the
  finding that no frozen test is retired, recorded here and in the handoff.
  Freeze on `main` in a specification-only commit that adds the new
  acceptance, before any runtime change.
- Frozen acceptance is unchanged after freeze.
- `npm run verify` exits 0, and the full `npm run test:e2e` suite exits 0.
- Visually check at desktop and phone widths: the catalog; `/puzzles`, the
  builder and play now that bold text renders at 600 and labels at 14px;
  and the stepper badges keep their weight.
- Update the handoff with observed results, commit and push `main`. F3
  remains pending.
