# Story S2 — Orange completed rows, room below the puzzles, a smaller Sign out

**Status: implemented on `main` (frozen 57e32e9); full e2e pending.** The human added this story to the epic on
2026-11-03, during S1, with its values stated; the orchestrator applied
S1's delegated approval and freeze to it (recorded as an assumption in
the handoff). Frozen on `main` in a specification-only commit.

**Blast radius: small, no risk path.** Styles and two components; direct
delivery to `main`.

## The human's request (2026-11-03)

1. Add two new colors and use them for the background of the row for
   complete puzzles. The faint green doesn't work well with the orange
   icon. Use `orange-faint` #F9F2E6 and `orange-hover` #F7ECD7, just
   like green-faint and green-hover.
2. On the puzzles page, the last row butts up against the bottom with no
   space. Use a 32px bottom margin for the div holding all the rows, and
   a 32px bottom margin for `puzzle-library`, so there's space below the
   vertical hairline.
3. The masthead's "Sign out" is too large: make it `button-normal`
   (14px, semibold).

## Decisions

- **Names as stated:** palette variables `orange-faint` #F9F2E6 and
  `orange-hover` #F7ECD7; styles `puzzle-row-complete` and
  `puzzle-row-complete-hover`, mirroring `puzzle-row-play(-hover)`, in
  the style guide's catalog.
- **Which rows:** those drawing DONE (`play.state === 'completed'`, 18-S5),
  including the style guide's sample. Hover and keyboard focus use
  `puzzle-row-complete-hover`, as play rows do. A reset row returns to
  green.
- **Bottom space:** `mb-8` on `puzzle-list` (the rows' container, the
  human's "might be better") and on `puzzle-library`, at every width.
- **Sign out:** `text-button-normal` (14px, 600, 20px line); colors,
  position and the 61px bar unchanged.

## Acceptance

*Frozen 2026-11-03.*

- **New `e2e/library-bottom-space.spec.ts`**, 19-S2-1 at 1280px and
  400px: both margins 32px; the page ends 32px below `puzzle-library`; in
  a long list the last row ends the list and sits 32px above the
  hairline's end.
- **Amended:**

| File | Case | Was | Becomes |
| --- | --- | --- | --- |
| `e2e/done-icon.spec.ts` (18-S5) | header; 18-S5-2 DONE icons and style-guide sample; 18-S5-4; 18-S5-5 | DONE rows green (`#F0F5E5`/`#EAF0DB`) | DONE rows `#F9F2E6`, hover `#F7ECD7`; Play rows unchanged |
| `e2e/status-icons.spec.ts` (18-S3) | 18-S3-5 first case | Play- and DONE-icon rows green | Play rows green, the DONE row orange |
| `e2e/color-tokens.spec.ts` (F1) | `VARIABLES`, `STYLES` | — | add the two variables and two styles |
| `src/app/globals-css.test.ts` (F1) | `VARIABLES`, `STYLES` | — | the same |
| `e2e/masthead.spec.ts` (F7) | header; F7-4 | Sign out `body-large` 18/400 | `button-normal` 14/600 |
| `src/components/ui/title-source.test.ts` (F7) | Masthead utilities | `text-body-large` | `text-button-normal` |

### Discrimination (2026-11-03, observed)

On 15eca84 (S1, no S2 runtime): the five e2e files ran 15 failed, 25
passed, the failures being every new and amended case; Vitest's two
amended files ran 3 failed, 7 passed.

### Implementation verification (2026-11-03, observed)

Frozen acceptance unchanged from 57e32e9. `npm run verify` exit 0 (Vitest
656 of 656). Lint has two warnings: `request-logger/` (pre-existing) and
`e2e/done-icon.spec.ts` `PLAY_ROW_HOVER` unused, left by this story's
amendment (a spec-only cleanup, not done). The five S2 e2e files plus
`two-greens` and `puzzle-library`: 66 passed. The full `npm run
test:e2e` has not run on this tree.

## Repo paths

Acceptance (immutable after freeze): the new spec and the six amended
files above. Runtime: `src/app/globals.css`,
`src/components/puzzle/PuzzleRow.tsx`,
`src/components/puzzle/PuzzleLibrary.tsx`,
`src/components/layout/Masthead.tsx`,
`src/components/style-guide/ColorSwatches.tsx`. Docs: this story,
`../EPIC.md`, `../HANDOFF.md`.

## Definition of done

- Frozen acceptance unchanged after freeze; `npm run verify` and the full
  `npm run test:e2e` exit 0; delivered on `main`.
