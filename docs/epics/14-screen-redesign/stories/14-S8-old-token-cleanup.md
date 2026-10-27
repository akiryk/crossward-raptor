# Story S8 — Old-token cleanup

The last story of the epic. It deletes the pre-redesign tokens, moves
their last uses onto the redesign's tokens or removes them, and removes
three dead pieces of code: `google-font.ts`, the Masthead's `home-link`
branch and the uncalled `unpublishPuzzle` action.

**Status: approved and frozen** (2026-10-27). The human answered the
two questions this draft raised (below) and approved the Decisions and
acceptance, including the retirements and amendments ("I approve S8").
Frozen on `main` in a specification-only commit with the EPIC amendment.
A throwaway is kept outside the repo as
`/tmp/crossward-drafts/14-S8-throwaway.patch`.

**Blast radius: medium, with one risk path.** Removing `unpublishPuzzle`
touches `src/app/puzzles/actions.ts`, so S8 is a reviewed branch story
(`story/14-S8-old-token-cleanup`, PR, independent review) under
CODE-REVIEW. The rest is `globals.css`, the root layout, `PuzzleGrid`'s
fallback colors, the Masthead and Header, and the style guide. One
visible change outside the style guide: text that inherits the page color
turns from `#14151B` to black (`primary`). No schema, engine or server
behavior otherwise.

## Decisions

Inspected `globals.css`, every runtime use of an old token
(`layout.tsx`, `PuzzleGrid.tsx`, the style guide's `page.tsx`,
`GridExamples.tsx` and `ColorSwatches.tsx`), `Masthead.tsx` and
`Header.tsx`, `google-font.ts`, `unpublishPuzzle` and its tests, the
`cell-appearance` states that reach `PuzzleGrid`'s fallback, and every
frozen test that reads an old token.

### Which tokens are old *(agent, from the EPIC)*

The old tokens are the pre-redesign `@theme` block in `globals.css`.
Deleted:

- **The 23 old colors:** `background`, `foreground`, `ink-2`, `ink-3`,
  `rule`, `rule-strong`, `hover-tint`, `panel-tint`, `accent`,
  `accent-hover`, `ok-tint`, `grid-empty`, `grid-line-build`,
  `grid-line-play`, `cell-fill`, `selected`, `slot`, `slot-content`,
  `required`, `recommended`, `locked-letter`, `editable-letter`,
  `incomplete`.
- **`--font-display`** *(human, the EPIC)* and **`--font-data`** (no
  user; the grid letters use `cell-letter`).
- **The old radii** *(human, the EPIC)*: `--radius-btn`, `-sm`, `-md`,
  `-lg`, `-grid`. Corners are `rounded-pill` and `rounded-modal`.
- **The old type and weight tokens:** `--text-headline`, `--text-body`,
  `--text-help`, `--text-title`, `--weight-normal`, `--weight-bold`.

Kept, in a small `@theme` block that says why:

- **`--font-body`**, the app's one typeface (Inter), set on the page.
  Epic 13's convention is that no component hardcodes a font, and F2
  kept it as the body font; it isn't a pre-redesign look.
- **`--grid-line-width`** (1px), the grid's hairline. The same convention
  forbids hardcoding a border width, and five frozen geometry tests
  measure the grid against it.
- `--text-label` and the radii `pill` and `modal` are redesign tokens
  (F2, F3, F4) and stay where they are.

### Old tokens still in use, and what replaces them

The EPIC asks for a report of each old token still in use with no
replacement. Every runtime use is listed here with its replacement:

| Where | Old | Now |
| --- | --- | --- |
| Page (`layout.tsx`) | `text-foreground` (`#14151B`) | `text-primary` (black) *(agent)*. Text with no color of its own turns black. |
| Page | `bg-background` (white) | Nothing *(agent)*: the browser's canvas is already white. No replacement token is invented. |
| Grid, a black cell in a build-phase grid | `bg-foreground` | `build-cell-off` *(human, 2026-10-27)* |
| Grid, every other fallback | `grid-empty`, `background`, `required`, `recommended`, `locked-letter`, `slot`, `slot-content`, `selected` | Nothing: no mode reaches them now. Each mode has its own map (S5, S6, S7, S12). |
| Style guide section headings | `font-display text-headline` and `--weight-bold` | `text-title-2 text-primary` *(agent)* |
| Color catalog subheadings, names and values | `text-body` + `--weight-bold`, `text-help` | `text-title-3`, `text-body-normal` *(agent)* |
| Color catalog swatches | `rounded-md` (14px) | `rounded-modal` (10px) *(agent)* |
| Style guide's old samples | `sg-text`, `sg-confirmation`, `sg-error`, `sg-tooltip` | Removed *(agent)*. They show only old tokens, and nothing in the app uses those looks now: confirmations are dialogs, errors are `error` text lines (TextInput's sample), and there is no tooltip. |

**The build-phase black cell** *(human, 2026-10-27)*. `PuzzleGrid` still
falls back to the old map for any appearance a mode's own map lacks. Only
one case reaches it: a black cell in a build-phase grid. The app can't make
one now; a grid saved before S5 removed the '.' key can still have one.
S5 settled that a build grid has only on and off cells ("one black"), and
creating hints turns both black. Such a cell is drawn as an off cell,
`build-cell-off`. The fallback map is removed.

### Dead code

- **`google-font.ts` and its test** are removed; nothing has imported
  them since F2 (carried observation). The test's retirement is listed
  below.
- **The Masthead's `home-link` branch.** `Masthead` set the logo link's
  test id only when its own test id was `app-header`. It takes a
  `homeLinkTestId` prop instead, and `Header` passes `home-link`
  *(agent)*. The app header keeps `home-link`; the style guide's samples
  have none, as today.
- **`unpublishPuzzle` is removed** *(human, 2026-10-27)*. S4 made
  publishing final and left the action with no caller, noting its removal
  for S8. Removing it is the only change to `actions.ts`, and it makes S8
  a reviewed branch story.
- **`applyGeometryEdit` stays** *(agent)*. S5 left it with no app caller
  ("S8 can decide"), but the EPIC's Non-goals keep `src/engine/**`
  untouched.

### Not changed

- Every redesign token, and every screen's look apart from inherited text
  color (above).
- The component source tests' bans on old tokens
  (`*-source.test.ts`). They still hold and keep guarding against a
  return.

## Non-goals

- No new tokens, and no new look for any screen.
- No engine change (`applyGeometryEdit` stays).
- No other server change than removing `unpublishPuzzle`.
- No responsive or spacing work (epic 15).

## Pending questions

None. Answered by the human on 2026-10-27: remove `unpublishPuzzle` here
(a reviewed branch story), and draw a build-phase black cell as
`build-cell-off`.

## Retired and amended acceptance

Approving this story approves these, which land in the
specification-only freeze commit on `main`. Each pins an old token or
`unpublishPuzzle`.

- **`e2e/color-tokens.spec.ts`:** F1-3 "every old color token keeps its
  committed value" is **retired**, with its value table. The header
  comment says the old tokens are deleted.
- **`e2e/style-guide.spec.ts`:** D8-1's token list keeps only
  `--font-body`, `--grid-line-width` and `--text-label` (it listed the 23
  old colors and the other old tokens), and its section list drops
  `sg-text`, `sg-confirmation`, `sg-error` and `sg-tooltip`.
- **`e2e/shell.spec.ts`:** P0-3's list keeps only `--font-body` and
  `--grid-line-width`.
- **`e2e/typography.spec.ts`:** D9-1's list keeps only `--text-label`
  (the eyebrow check is unchanged).
- **`e2e/text-styles.spec.ts`:** "old display-font uses render in Inter"
  becomes "headings render in Inter": it no longer reads
  `--font-display`; the page heading and the header must still render in
  Inter. One header comment line follows.
- **`src/app/globals-css.test.ts`:** "has no @theme colors besides the
  old tokens and the new styles" becomes "…besides the new styles"; the
  old-token list and its header comment mention are removed.
- **`src/app/puzzles/actions.session.test.ts`:** `unpublishPuzzle` leaves
  the session-boundary call list.
- **`src/app/puzzles/actions.builder-edits.test.ts`:** `unpublishPuzzle`
  leaves the O3 call list, with its three per-action lines; "allows an
  owner to unpublish an already unpublished puzzle without changing its
  visibility" is **retired**.
- **`src/lib/google-font.test.ts`:** **retired** (deleted) with the
  module.

No other frozen test changes. The five geometry cases in
`style-guide.spec.ts`, and `build-grid`, `preview` and `editor-layout`,
read `--grid-line-width`, which stays.

## Acceptance

### `e2e/old-tokens.spec.ts` (7 cases, 1280×800)

1. **14-S8-1 old tokens (3 cases):** on `/`, `/puzzles` and
   `/style-guide`, none of the old tokens resolves, and `--font-body`,
   `--grid-line-width`, `--radius-pill` and `--radius-modal` do. The
   radii checked here are `btn` and `grid`: Tailwind emits its own
   default `--radius-sm/-md/-lg` (4px, 6px, 8px) whenever a scanned file,
   the docs included, mentions those utilities, so those three are
   checked in the source instead.
2. **14-S8-2 the page:** the body's text is `primary` (black) in Inter,
   and the body and root have no fill or a white one.
3. **14-S8-3 the style guide (2 cases):** the four old samples are gone;
   each section's first heading is 32px/600 `primary` (title-2), and the
   color catalog's two subheadings 18px/600 `primary` (title-3).
4. **14-S8-4 a build-phase black cell:** a seeded 5×5 build-phase grid
   with two black cells draws them, and an empty cell, in
   `build-cell-off`.

### `src/app/old-tokens-source.test.ts` (6 cases)

1. **14-S8-1 globals.css (2):** declares none of the old tokens; still
   declares `--font-body`, `--grid-line-width`, `--radius-pill` and
   `--radius-modal`.
2. **14-S8-2 runtime source:** no `.ts`, `.tsx` or `.css` file under
   `src` (tests excluded, comments ignored) names an old token or uses an
   old color, font, radius or type utility (including Tailwind's
   `rounded-sm/-md/-lg`).
3. **14-S8-3 removed code (3):** `google-font.ts` and its test are gone
   and nothing names them; nothing references `unpublishPuzzle`;
   `Masthead.tsx` names neither `app-header` nor `home-link`.

### Acceptance choices

- The browser spec covers what the user sees (tokens gone at runtime, the
  page color, the catalog, the legacy cell). The source test covers what
  only the source shows: no stray use, removed files and the Masthead
  branch.
- The amended lists keep their tests' purpose (the kept tokens still
  resolve) rather than retiring them whole.

### Discrimination (2026-10-27, observed)

- **Against `main`'s runtime** with the proposed acceptance: all 7
  browser cases fail, and all 6 source cases fail, plus the amended
  `globals-css.test.ts` case (it lists the 23 old colors). The source
  scan finds old tokens in `globals.css`, `layout.tsx`, `PuzzleGrid.tsx`
  and the three style-guide files, and nothing else. Every other amended
  spec and Vitest file passes on `main`.
- **Against the throwaway** (the patch above, reverted after):
  `npm run verify` exits 0 (47 files, 595 Vitest tests), and the full
  `npm run test:e2e` passes, 652 (the existing suite, less one retired
  case, plus the 7 new; S12 ended at 646).
- Drafting found two defects in the draft spec, fixed before the full
  run. The heading check also caught components' own headings (Row
  Heading, Player Hints), so it reads each section's first heading. And
  Tailwind's default radii (above).
- `tsc` found the two `unpublishPuzzle` uses in
  `actions.builder-edits.test.ts`, now in the amendments.

## EPIC amendment *(applied at freeze)*

- **S8's section** adds: "Removes the uncalled `unpublishPuzzle` (S4),
  so it's a reviewed story on a branch. Keeps `--font-body` and
  `--grid-line-width`."
- **Old tokens are deleted last:** add "`--font-body` (the one typeface)
  and `--grid-line-width` (the grid's hairline) stay (S8)."
- **Carried observations:** the Masthead `home-link` branch and
  `google-font.ts` are marked resolved by S8.

## Repo paths

- Runtime:
  - `src/app/globals.css`: the old block deleted; `--font-body` and
    `--grid-line-width` kept;
  - `src/app/layout.tsx`: the page's classes;
  - `src/components/grid/PuzzleGrid.tsx`: the fallback map removed,
    `black` in the build map;
  - `src/components/layout/Masthead.tsx` and `Header.tsx`;
  - `src/app/style-guide/page.tsx`,
    `src/components/style-guide/GridExamples.tsx` and `ColorSwatches.tsx`;
  - removed: `src/lib/google-font.ts`;
  - `src/app/puzzles/actions.ts`: `unpublishPuzzle` removed (risk path).
- Specification: this story, the EPIC and HANDOFF.
- Acceptance: new `e2e/old-tokens.spec.ts` and
  `src/app/old-tokens-source.test.ts`, and the retirements and
  amendments above.

Declare any other path before editing it.

## Definition of Done

- The human approves this specification and its acceptance, recorded here
  and in the handoff. Freeze on `main` in a specification-only commit
  with the EPIC amendment.
- Implement on `story/14-S8-old-token-cleanup` from the freeze commit;
  the frozen acceptance is unchanged after freeze.
- `npm run verify` exits 0 and the full `npm run test:e2e` passes.
- The PR is independently reviewed per CODE-REVIEW and merged.
- The human's visual check passes (the page text color, the style
  guide).
