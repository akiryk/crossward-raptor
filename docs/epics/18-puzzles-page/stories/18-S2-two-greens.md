# Story S2 — Two greens

Two new palette variables, `green-faint` (#F0F5E5) and
`green-faint-hover` (#EAF0DB), and two color styles referencing them,
`puzzle-row-play` and `puzzle-row-play-hover`, mirroring `puzzle-row` and
`puzzle-row-hover`. All four appear in the style guide's catalog. No
component uses the styles yet; S3's green play rows are their first user.

**Status: approved and frozen** (2026-11-02). Drafted under the
orchestration the human delegated on 2026-11-02 (see the
[handoff](../HANDOFF.md)). An independent specification review approved
it (three wording nits, applied); the orchestrator froze it on `main` in
a specification-only commit under that delegation.

**Blast radius: small.** Two palette variables and two color styles in
`globals.css`, and four catalog rows in `ColorSwatches.tsx`. No component,
schema, server action, storage or engine change, so no CODE-REVIEW risk
path: direct delivery on `main`.

## What the code does today

Inspected `src/app/globals.css`, `src/components/style-guide/ColorSwatches.tsx`,
`src/components/puzzle/PuzzleRow.tsx`, and every test that lists the
palette or the catalog (`grep` for `sg-color`, `interactive-faint`,
`puzzle-row` and `EBEFF7` over `src` and `e2e`).

- The palette (`:root`, outside `@theme`) has 21 variables; none is
  green. The styles live in `@theme static` and each references one
  variable (`muted` and `modal-backdrop` mix `black` with transparency).
- `puzzle-row` and `puzzle-row-hover` reference `interactive-faint` and
  `interactive-faint-hover`; `PuzzleRow.tsx` uses them as the row's fill
  at rest and on hover or keyboard focus. `toggle-row` also uses
  `interactive-faint`.
- The catalog lists each variable (name, hex, swatch) and each style
  (name, variable, swatch painted through its Tailwind utility, so a live
  variable edit repaints it).
- `src/app/globals-css.test.ts` and `e2e/color-tokens.spec.ts` (F1) pin
  every variable and style: the source must declare no `@theme` color
  outside their lists, and the catalog's row counts must equal them. Both
  must list the new four. `selection-colors.spec.ts`, `old-tokens.spec.ts`
  and `muted-text.spec.ts` check individual catalog rows or headings and
  are unaffected.

## Decisions

### The values *(human, 2026-11-02; styles approved with the EPIC)*

- `--palette-green-faint: #f0f5e5` and `--palette-green-faint-hover:
  #eaf0db`, plain palette variables like the others.
- `--color-puzzle-row-play: var(--palette-green-faint)` and
  `--color-puzzle-row-play-hover: var(--palette-green-faint-hover)`, in
  `@theme static`, so their utilities exist before S3 uses them.
- Both variables and both styles are in the style guide's catalog.
- `puzzle-row`, `puzzle-row-hover` and every other style are unchanged.

### Delegated decisions *(orchestrator, 2026-11-02; for the human's end-of-epic review)*

- **Catalog order.** The greens follow `pink` at the end of the variable
  list (the newest variables go last, as `cyan` and `pink` did); the two
  styles follow `puzzle-row-hover`, mirroring the rows they parallel.
  S3 decides where `green` goes. Reversible; tests don't pin order.
- **Source comments.** One `/* the play rows (Story 18-S2) */` comment
  above the styles, as other recent styles have. No comment on the
  variables, as in the rest of the palette.
- **No component change.** S2 only declares and catalogs; applying the
  styles to rows is S3's (the EPIC's "S3 is their first user").
- **Contrast, for information.** The greens are fills behind the row's
  primary and muted text; #F0F5E5 and #EAF0DB are about as light as
  `interactive-faint` (#F5F7FA) and `interactive-faint-hover` (#EBEFF7),
  so text legibility on rows is unchanged in practice. The human's values
  are used as given.

## Acceptance

*Proposed.* One new file and two amended files.

### e2e/two-greens.spec.ts

Colors are the human's values written out, not read from the styles.

1. **18-S2-1** green-faint and green-faint-hover are palette variables:
   on `/style-guide`, each `--palette-*` is declared on `:root` as its hex
   and resolves to it; each has a catalog row showing its name and hex,
   swatched in its color.
2. **18-S2-2** puzzle-row-play and puzzle-row-play-hover reference the
   greens, in three cases: each style resolves to its green and follows
   its variable when the variable is edited live (and back when cleared);
   the four row styles (`puzzle-row`, `puzzle-row-hover` and the two play
   styles) are four distinct colors; each play style has a catalog row
   showing its name and variable, swatched in its green.

### Amended acceptance

Amended in the specification-only freeze commit. Every other frozen test
is unchanged. The amendments only add entries; no existing entry or
assertion changes.

| File | Case | Was | Becomes |
| --- | --- | --- | --- |
| `src/app/globals-css.test.ts` | `VARIABLES` (F1 palette variables; "declares each variable once, outside @theme, with its hex value") | 21 variables, ending `pink` | adds `green-faint: '#F0F5E5'`, `green-faint-hover: '#EAF0DB'` |
| `src/app/globals-css.test.ts` | `STYLES` (F1 color styles; "declares each style in @theme as a reference to its variable" and "has no @theme colors besides the new styles") | no play row styles | adds `puzzle-row-play: 'green-faint'`, `puzzle-row-play-hover: 'green-faint-hover'` |
| `e2e/color-tokens.spec.ts` | `VARIABLES` (F1-1; F1-4 variables, including its row count) | as above | as above |
| `e2e/color-tokens.spec.ts` | `STYLES` (F1-2 both cases; F1-4 styles, including its row count) | as above | as above |

### Acceptance choices *(delegated, orchestrator)*

- The F1 lists must grow: without the amendments, "has no @theme colors
  besides the new styles" and F1-4's row counts fail on a correct
  implementation. Adding the entries also brings the four under F1's
  existing checks (hex values, references, live editing, catalog).
- The new file restates the four values so the story's acceptance reads
  on its own with 18-S2 ids, and adds what F1 doesn't: the play styles
  are distinct from `puzzle-row` and `puzzle-row-hover` and from each
  other.
- Not covered: any component using the styles (S3), order within the
  catalog (a delegated, reversible choice).

### Discrimination (2026-11-02, observed)

- **Current `main` with the proposed tests:** `npx vitest run
  src/app/globals-css.test.ts`: 2 failed, 4 passed (F1 palette variables
  and F1 color styles, at `--palette-green-faint` and
  `--color-puzzle-row-play` missing). `npm run test:e2e --
  e2e/two-greens.spec.ts e2e/color-tokens.spec.ts
  e2e/selection-colors.spec.ts e2e/old-tokens.spec.ts
  e2e/muted-text.spec.ts e2e/style-guide.spec.ts`: 9 failed, 31 passed.
  The failures are all four 18-S2 cases, F1-1, F1-2 (both) and F1-4
  (both), each at a missing green variable, style or catalog row.
- **Throwaway implementation** (`globals.css` and `ColorSwatches.tsx`
  only, patch kept outside the repo at `/tmp/18-s2-throwaway.patch`),
  then reverted: `npm run verify` exit 0 (Vitest 641 of 641, including
  `tsc` and ESLint over the proposed tests); full `npm run test:e2e`:
  918 passed, 0 failed, under the guarded harness's standing reset grant.
- **Mutation on the throwaway:** `puzzle-row-play-hover` pointed at
  `green-faint`: `two-greens.spec.ts` 3 failed (18-S2-2's three cases),
  2 passed (18-S2-1 and setup).

## Repo paths

Acceptance (immutable after freeze): `e2e/two-greens.spec.ts`,
`src/app/globals-css.test.ts` and `e2e/color-tokens.spec.ts`.

Runtime:

- `src/app/globals.css`: two palette variables and two color styles.
- `src/components/style-guide/ColorSwatches.tsx`: two variable rows and
  two style rows.
- This story and `../HANDOFF.md`.

Declare any other path before editing it.

## Scope discipline

Only S2. Out of scope: applying the styles to rows, the status icons and
the `green` variable (S3), filters (S4), and any other color.

## Definition of done

- The orchestrator, under the human's delegation, approves this
  specification, its acceptance and the four amendments after an
  independent specification review, recorded here and in the handoff.
  Freeze on `main` in a specification-only commit before any runtime
  change.
- Frozen acceptance is unchanged after freeze.
- `npm run verify` exits 0, and the full `npm run test:e2e` suite exits 0.
- Delivered on `main` and the handoff updated with observed results.

## Pending questions

None. The EPIC settles the values, names and catalog presence; the
remaining choices are recorded under Delegated decisions.
