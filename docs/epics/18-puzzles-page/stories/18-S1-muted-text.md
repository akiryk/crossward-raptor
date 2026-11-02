# Story S1 — Muted text

The `muted` color style becomes black at 40% opacity, app-wide, so muted
text takes on the background it sits on. `gray-500` stays in the palette
for its other styles.

**Status: done** (2026-11-02). The human approved the specification,
its small calls, its acceptance and the ten amendments ("I approve S1");
frozen on `main` in specification-only commit `1acb507`, then
implemented and delivered on `main`.

**Blast radius: small.** One color style's value in `globals.css` and its
style-guide catalog row. No component changes, and no schema, server
action, storage or engine change, so no CODE-REVIEW risk path: direct
delivery on `main`.

## What the code does today

Inspected `src/app/globals.css`, `src/components/style-guide/ColorSwatches.tsx`,
every `text-muted`/`bg-muted` use under `src`, and every test that pins
`muted` or gray-500's value (`grep` for `muted`, `8B909A` and
`rgb(139, 144, 154)` over `src` and `e2e`).

- `--color-muted: var(--palette-gray-500)` (#8B909A). `modal-backdrop`
  is the one translucent style today:
  `color-mix(in srgb, var(--palette-black) 40%, transparent)`.
- Components use `muted` only as text (`text-muted`,
  `placeholder:text-muted`, `hover:`/`focus-visible:text-muted`), in
  `Title` (`color="muted"`), `TextInput`'s placeholder, `Menu`'s three-dot
  button at rest, `Modal`'s close control on hover and focus, the
  library's dimensions, builder names, dates and empty line, the hints
  panel's and Hint Box's answers, the hint skeleton's labels, play's save
  status and messages, sign-in's heading, help and alerts, the gone page,
  and the style guide's hex and variable text. The style guide's swatch
  (`bg-muted`) is its only fill use. They sit on white, the library's
  faint rows, the missing hint's pink row and the modal's yellow header.
- `gray-500` also backs `preview-cell-border`, `play-cell-border`,
  `hint-cell-border`, `button-alternate-border` and
  `button-alternate-hover`; those don't change.
- **Chromium computes a `color-mix()` color as `color(srgb 0 0 0 / 0.4)`**,
  not `rgb()`/`rgba()` (observed 2026-11-02; a relative
  `rgb(from … / 40%)` computes the same). So frozen tests that write out
  `rgb(139, 144, 154)` for muted text, or parse only `rgb()`, need
  amending.

## Decisions

### The value *(human, 2026-11-02; mechanism approved with the EPIC)*

- `--color-muted: color-mix(in srgb, var(--palette-black) 40%, transparent)`,
  the same form as `modal-backdrop`. No new palette variable; it follows
  `--palette-black` when that is edited live.
- Wherever `muted` applies today, it applies after; no component changes.
- `gray-500` (#8B909A) stays in the palette and the catalog, still
  backing its five other styles.

### Small calls *(approved by the human, 2026-11-02)*

- The catalog's `muted` row names its variable "black at 40%", as the
  backdrop's row does, swatched in the translucent color over the
  catalog's usual `line-muted`-bordered swatch.
- **Contrast, for information.** On white, black at 40% paints #999999,
  a little lighter than #8B909A (about 2.8:1 against white, was about
  3.2:1). On the library's faint row it paints about #939496. The
  human's value is used as given.
- Historical stories and EPICs (13, 14) that name `muted` as gray-500
  stay as written; they record what was true then.

## Acceptance

*Approved and frozen 2026-11-02.* One new file and ten amended files.

### e2e/muted-text.spec.ts

Colors are the human's values written out, not read from the styles.

1. **18-S1-1** muted text is black at 40%: on `/puzzles` with one Mini,
   `var(--color-muted)` resolves to black at alpha 0.4; the size group's
   dimensions (on white), and a row's builder name and date (on the row's
   opaque, non-white fill) compute to black at 0.4.
2. **18-S1-2** gray-500 keeps its other styles: `--palette-gray-500` is
   still #8B909A and the five styles above still resolve to it; the
   catalog's `muted` row reads "black at 40%", not "gray-500", and its
   swatch is black at 0.4.

### Amended acceptance

Amended in the specification-only freeze commit. Every other frozen test
is unchanged.

| File | Case | Was | Becomes |
| --- | --- | --- | --- |
| `src/app/globals-css.test.ts` | `STYLES` (F1 color styles); "has no @theme colors besides the new styles" | `muted: 'gray-500'`; allowed = `STYLES` + backdrop | `muted` removed from `STYLES`; new case "declares muted as black at 40% through the black variable" (the backdrop's checks); allowed adds `muted` |
| `e2e/color-tokens.spec.ts` | `STYLES`, the backdrop constants (F1-2 both cases, F1-4 styles) | `muted: 'gray-500'`; one translucent style | a `TRANSLUCENT` map: `modal-backdrop` and `muted`, both black at 0.4; F1-4's "40%" text check runs for both rows |
| `e2e/build-grid-design.spec.ts` | 14-S5-6 "labels are title-4 muted" | `MUTED` `rgb(139, 144, 154)` | `MUTED` `color(srgb 0 0 0 / 0.4)` |
| `e2e/play-design.spec.ts` | 14-S7-4 "the save status is body-small, muted, …" | as above | as above |
| `e2e/hint-phase-design.spec.ts` | 14-S6-4 "the answer is label, …, muted, …" and "the answer turns primary while its input has focus, …" | as above | as above |
| `e2e/missing-hints.spec.ts` | 17-S1-1, 17-S1-2 (both), 17-S1-3 (unmarked words) | as above | as above |
| `e2e/hints-grid-editing.spec.ts` | 14-S12-6 "while the grid has focus, …" (its answer) | as above | as above |
| `e2e/hint-box.spec.ts` | 15-S4-3 "at 768px: the word in label, 0.1em, muted; …" | as above | as above |
| `e2e/row-menu.spec.ts` | `rgbOf` (16-S2-1's at-rest and hover colors, and every other `token` comparison) | parses `rgb()` only, RGB without alpha | also parses `color(srgb …)`, and compares alpha |
| `e2e/delete-published.spec.ts` | `rgbOf` (the gone page's "detail is muted", and every other `token` comparison) | as above | as above |

### Acceptance choices *(approved by the human, 2026-11-02)*

- Six files change only the `MUTED` constant and its comment. Chromium's
  computed form is pinned exactly, as those files already pin `rgb()`
  strings; the suite runs only Desktop Chrome.
- `row-menu` and `delete-published` compare a muted element with the
  `muted` token. Their parsers throw on `color(srgb …)`, and without alpha
  muted would read as {0, 0, 0}, the same as `primary`. So they gain
  alpha. Their assertions are unchanged.
- `inputs`, `modal-design`, `sign-in` and `puzzle-library` compare with
  the `muted` token through parsers that already read `color(srgb …)`
  and alpha; they need no change.
- Not covered by new cases: each remaining `text-muted` surface (the same
  style; the amended files cover ten of them), narrow widths (the same
  style).

### Discrimination (2026-11-02, observed)

- **Current `main` with the proposed tests:** Vitest's new muted case
  fails (1 of 6 in `globals-css.test.ts`). The 14 affected browser files
  (the new file, the ten amended files and the four unchanged
  token-comparing files): 15 failed, 215 passed. The failures are
  18-S1-1 and 18-S1-2, F1-2 (both), F1-4 styles, and the six `MUTED`
  files' cases. The `row-menu` and `delete-published` parser amendments
  pass on `main`. 18-S1-1 was then fixed to seed a Mini (a 3×3 lands in
  "Other sizes", which has no dimensions), and it was re-run on `main`:
  it fails at "the muted style".
- **Throwaway implementation** (`globals.css` and `ColorSwatches.tsx`
  only, patch kept outside the repo at `/tmp/18-s1-throwaway.patch`),
  then reverted: `npm run verify` exit 0 (Vitest 641 of 641, including
  `tsc` and ESLint over the proposed tests); full `npm run test:e2e`:
  913 passed, 1 failed (18-S1-1, before the Mini fix). After the fix,
  `muted-text.spec.ts` passed (3 with setup), under the guarded harness's
  standing reset grant.
- **Mutations on the throwaway:** `muted` at 50% fails 18-S1-1 and
  18-S1-2. `muted` as opaque `var(--palette-black)` passes `row-menu`
  and `delete-published`: their frozen cases never assert that muted
  differs from primary. That case is caught by F1-2, 18-S1-1 and the
  `MUTED` files.

### Implementation (2026-11-02, observed)

Runtime is `globals.css` and `ColorSwatches.tsx` only, the drafting
throwaway re-applied. Frozen acceptance is unchanged from `1acb507`.
`npm run verify` exit 0 (Vitest 641 of 641). Full `npm run test:e2e`
exit 0, 914 passed, under the guarded harness's standing reset grant.

## Repo paths

Acceptance (immutable after freeze): `e2e/muted-text.spec.ts`,
`src/app/globals-css.test.ts`, `e2e/color-tokens.spec.ts`,
`e2e/build-grid-design.spec.ts`, `e2e/play-design.spec.ts`,
`e2e/hint-phase-design.spec.ts`, `e2e/missing-hints.spec.ts`,
`e2e/hints-grid-editing.spec.ts`, `e2e/hint-box.spec.ts`,
`e2e/row-menu.spec.ts` and `e2e/delete-published.spec.ts`.

Runtime:

- `src/app/globals.css`: `--color-muted` re-pointed.
- `src/components/style-guide/ColorSwatches.tsx`: the `muted` row's
  variable text.
- This story and `../HANDOFF.md`.

Declare any other path before editing it.

## Scope discipline

Only S1. Out of scope: the greens (S2), status icons and green rows
(S3), filters (S4), and any other color.

## Definition of done

- The human approves this specification, its acceptance and the ten
  amendments, recorded here and in the handoff. Freeze on `main` in a
  specification-only commit before any runtime change.
- Frozen acceptance is unchanged after freeze.
- `npm run verify` exits 0, and the full `npm run test:e2e` suite exits 0.
- Delivered on `main` and the handoff updated with observed results.

## Pending questions

None. The human approved the specification, the small calls and the ten
amendments on 2026-11-02.
