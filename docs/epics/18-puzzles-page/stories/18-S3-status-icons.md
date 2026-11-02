# Story S3 — Status icons and green play rows

A library row's icon shows the puzzle's status: Play for a published
puzzle, Build for an unpublished grid-phase one, Hint for an unpublished
hints-phase one. The icons are the human's exports, cleaned and drawn
with color styles. Play's green becomes a new palette variable, `green`,
and a `status-play` style. Each row names its status in visually hidden
text. The `[grid]`, `[hint]` and `[published]` markers go. Rows with the
Play icon are green. All of this stays within today's Build | Play views,
so S4 only changes the list and layout.

**Status: approved and frozen** (2026-11-02). Drafted under the
orchestration the human delegated on 2026-11-02 (see the
[handoff](../HANDOFF.md)). An independent specification review approved
it (wording nits applied); the orchestrator froze it on `main` in a
specification-only commit under that delegation. For the human's
end-of-epic review: the gray-style pairing and a completed row's link
reading "Title Ready to play [complete]".

**Blast radius: medium.** The change touches one new component, the row,
one palette variable, one color style and two catalog rows. It also
amends eleven frozen test files, mostly to swap a marker for its hidden
status text. No schema, server action, storage or engine change.
**CODE-REVIEW risk classification:** none of the declared Repo paths is a
risk path (`src/engine/**`, `src/lib/puzzle-storage.ts`,
`src/app/puzzles/actions.ts`, `prisma/**`). The acceptance files import
`src/lib/puzzle-storage.ts` but don't change it. So this story is
delivered directly on `main`.

## What the code does today

I inspected `src/components/puzzle/PuzzleRow.tsx`, `CrosswordIcon.tsx`,
`PuzzleLibrary.tsx`, `src/lib/puzzle-status.ts`'s `StatusKind`,
`src/app/globals.css`, `src/components/style-guide/ColorSwatches.tsx`,
the style guide's sample rows, the human's
`~/Downloads/{build,hint,play}-icon.svg`, `play-row-mock.png`,
`play-row-hover-mock.png` and `puzzles-page-mock.png`. I also grepped
every test that pins the icon, markers, link names or row colors
(`puzzle-icon`, `puzzle-status-badge`, `status-kind`, `[grid]`, `[hint]`,
`[published]`, `toHaveAccessibleName`, `puzzle-row`, `CrosswordIcon`)
over `e2e` and `src`.

- `PuzzleRow` starts with `CrosswordIcon`: an inline 34px SVG, 10px into
  the row, the same on every row, `aria-hidden`, `data-testid="puzzle-icon"`,
  clipped with a `useId` clip id. The title column starts 12px after it
  (56px in), and the date is 280px in.
- The row's link wraps the title and a marker. In Build that marker is
  `puzzle-status-badge` (`[grid]`, `[hint]`, `[published]`, with
  `data-status-kind`). In Play it is `puzzle-play-state` (`[in-play]`,
  `[complete]`, or none). So the link's accessible name is "Title [grid]",
  "Title [in-play]" or "Title".
- Every row is `bg-puzzle-row`, turning `puzzle-row-hover` on hover and
  while its link has keyboard focus (`has-[a:focus-visible]`), over 150ms.
  S2 declared `puzzle-row-play` and `puzzle-row-play-hover`, but nothing
  uses them yet.
- `statusKind` (`grid`, `hints`, `published`; published outranks phase)
  already reaches the row in both views.
- **The exports:** each is 46×34, with a 34px grid at x 5.7019 under a
  42×12 band at x 1.7019 (the band starts 0.2981 left of center). The
  label is outlined text. The exports have hardcoded colors, a duplicated
  cell and a fixed clip id. The cell at (0,1) is black but sits entirely
  under the band. Build is #8B909A (`gray-500`) throughout. Hint has
  #14151B (`gray-700`) with a black band. Play is #84C600.
- **The mocks:** the icon overhangs the old icon's spot by a few pixels
  on each side. The title stays about 56px in and the date 280px in.
  `play-row-hover-mock.png`, which the EPIC recorded as missing, is now
  in `~/Downloads`. It is #EAF0DB, `green-faint-hover`.
- Tests pinning what changes: `puzzle-library.spec.ts` (the icon case,
  the text block, the long title, 14-S2-3 and 14-S2-4's link names),
  `library-play.spec.ts`, `puzzle-list.spec.ts`, `publish-status.spec.ts`,
  `builder-edits.spec.ts`, `duplicate.spec.ts`, `row-menu.spec.ts`,
  `puzzle-list-layout.spec.ts` and `library-source.test.ts` (it names
  `CrosswordIcon.tsx`). The F1 lists in `globals-css.test.ts` and
  `color-tokens.spec.ts` must gain `green` and `status-play`.
  `focus-ring.spec.ts` uses the style guide's first (grid) sample row and
  is unaffected. `unlisted.spec.ts` checks `[in-play]`, which stays.

## Decisions

### From the EPIC *(human, approved 2026-11-02)*

- **Which icon a row gets** follows `statusKind`. A published puzzle
  (public or unlisted, whoever built it) gets Play. An unpublished
  grid-phase puzzle gets Build, and an unpublished hints-phase puzzle
  gets Hint. This applies in both views.
- **One inline component**, 46×34 as exported and cleaned: no offset, no
  duplicate cell, a unique clip id, drawn with color styles. Build and
  Hint use existing gray styles. Play uses a new palette variable,
  `--palette-green: #84c600`, through a new style,
  `--color-status-play: var(--palette-green)`. Both appear in the style
  guide's catalog. The icon stays `aria-hidden`.
- **Visually hidden status text** on each row: "Ready to play", "Build
  phase" or "Hint phase".
- **Markers:** `[grid]`, `[hint]` and `[published]` are removed.
  `[in-play]` and `[complete]` stay on play rows.
- **Green play rows:** a row with the Play icon is `puzzle-row-play`, and
  turns `puzzle-row-play-hover` on hover and while its link has keyboard
  focus. Other rows keep `puzzle-row` and `puzzle-row-hover`. The 150ms
  transition and the "not on mouse focus" behavior are unchanged.

### Delegated decisions *(orchestrator, 2026-11-02; for the human's end-of-epic review)*

- **Cleaning means centering.** The 34px grid sits at x 6 and the band at
  x 2, both whole pixels inside the 46×34 box. The exported label
  outlines move 0.2981 right (one `transform`), so they keep their place
  on the band. The covered cell (0,1) takes the grid's color like the
  other two dark cells. The dark cells are left as the grid's backdrop,
  so only the six white cells are drawn. Reversible.
- **Placement from the mocks:** the icon box is 4px into the row
  (`-mx-[6px]`), so its grid is 10px in, where the old icon was. The
  band overhangs the grid by 4px on each side, and the title and date
  don't move (56px and 280px in). Without this, the 46px box would push
  the 212px title column into the date.
- **Which gray styles.** The EPIC says "the existing gray styles" without
  naming them. Build uses `preview-cell-border` (`gray-500`, the
  builder's preview grid). Hint's grid uses `hint-cell-off` (`gray-700`,
  the hints grid's dark cells) and its band uses `primary` (black). The
  white cells and labels use `inverse`. No new gray styles. The tests pin
  the colors, not the style names, so this choice is reversible. The
  reviewer may prefer a different pairing.
- **Catalog order.** `green` goes before `green-faint` in the palette and
  the catalog, base before tints. `status-play` follows
  `puzzle-row-play-hover`, with a `/* the Play status icon (Story 18-S3) */`
  source comment. The tests don't pin order.
- **Where the hidden text sits.** It goes inside the row's link, right
  after the title, where the marker was. So the link still names the
  status: "Title Build phase", or "Title Ready to play [in-play]" when a
  play marker follows. It is a Tailwind `sr-only` span with
  `data-testid="puzzle-status"` and `data-status-kind`, which replace
  the badge's test hooks. The span holds exactly the EPIC's text, so
  there is no comma separator. Accessible-name computation already
  separates the title and the status with a space.
- **Build view shows no visible marker at all.** Its phase markers are
  gone, and it never showed play markers. Play view keeps
  `[in-play]`/`[complete]` with their typography and placement.
- **New file** `src/components/puzzle/StatusIcon.tsx`
  (`StatusIcon({ status })`) keeps `data-testid="puzzle-icon"` and adds
  `data-status`. `CrosswordIcon.tsx` is deleted because nothing else
  uses it.
- **The style guide** needs no change. Its two sample rows (grid in
  Build, completed in Play) now show the Build icon and a green Play row.

## Acceptance

*Proposed.* One new file and eleven amended files.

### e2e/status-icons.spec.ts

The colors are the human's values written out, not read from the
styles. The icons are checked by their screenshot pixels, so the cases
pin the drawing, not the markup.

1. **18-S3-1** `green` is a palette variable and `status-play`
   references it. `--palette-green` is #84C600, `status-play` resolves
   to it and follows it when it is edited live, and both have catalog
   rows swatched in green.
2. **18-S3-2** the icon follows the status, in three cases:
   - In Build, the caller's grid, hints, unlisted and public puzzles draw
     Build, Hint, Play and Play. The cell pattern, outline, rounded
     corners, band position and band color are checked by pixel, and the
     white label width is BUILD > PLAY > HINT. In Play, own and foreign
     published rows (untouched, in play, complete) all draw Play. There
     is no thumbnail.
   - The box is 46×34, 4px in and vertically centered, and the title is
     56px in.
   - Every icon's clip id is unique on the page and belongs to its own
     SVG.
3. **18-S3-3** each row names its status in visually hidden text inside
   its link: at most a 1px clipped box, exactly "Build phase", "Hint
   phase" or "Ready to play". The link's accessible name is
   "Title Status", plus " [in-play]" where shown.
4. **18-S3-4** the markers, in two cases:
   - Build rows contain no `[grid]`, `[hint]` or `[published]`, no
     badge and no play marker.
   - Play's `[in-play]` and `[complete]` keep the title's text style and
     color, sit on the title line, and stay whole and clear of the date
     beside a truncated long title. An untouched row has none.
5. **18-S3-5** green rows, in two cases:
   - An own published row (in Build and in Play) and a foreign completed
     row are #F0F5E5 at rest. They turn #EAF0DB on hover and on keyboard
     focus, not on mouse focus, with the 150ms transition.
   - Grid and hints rows stay #F5F7FA and #EBEFF7.

### Amended acceptance

These are amended in the specification-only freeze commit. Every other
frozen test is unchanged.

| File | Case | Was | Becomes |
| --- | --- | --- | --- |
| `e2e/puzzle-library.spec.ts` | header comment | — | adds an 18-S3 note pointing to `status-icons.spec.ts` |
| `e2e/puzzle-library.spec.ts` | 14-S2-2 "the icon: 34px, 10px in and centered, an outlined 3×3 grid with three dark cells, the same on every row", and its `iconPixels` helper | the fixed 34px icon, pixel-checked | **retired** (comment left in place); replaced by 18-S3-2 |
| `e2e/puzzle-library.spec.ts` | 14-S2-2 "the text block: title and marker title-4 primary over the title-4 muted username, 12px after the icon, centered" | checks the `[grid]` marker's text, style, color and line; title 12px after the icon box | renamed "the text block: title title-4 primary over the title-4 muted username, 12px after the icon's grid, centered"; marker checks removed; title 12px after the icon's grid (`i.x + i.width - 6`) |
| `e2e/puzzle-library.spec.ts` | 14-S2-2 "a long title truncates with an ellipsis while its marker and the date stay whole" | the `[hint]` marker visible, whole and clear of the date | renamed "a long title truncates with an ellipsis while the date stays whole"; the marker checks become "title clear of the date" (Play's marker is covered by 18-S3-4) |
| `e2e/puzzle-library.spec.ts` | 14-S2-3 "lists only the caller's puzzles, every phase, with markers, the row menu and the editor link" | `puzzle-status-badge` with `[grid]`/`[hint]`/`[published]`; link named "Title [marker]" | renamed "… with their status, …"; `puzzle-status` with "Build phase"/"Hint phase"/"Ready to play" (same `data-status-kind`); link named "Title Status" |
| `e2e/puzzle-library.spec.ts` | 14-S2-4 "lists every published puzzle, …" | link named "Title" or "Title [marker]" | "Title Ready to play" or "Title Ready to play [marker]" |
| `e2e/library-play.spec.ts` | P5 "every listed published row offers Play to every player; unpublished rows do not" | play link named "Title"; Build links "Title [published]", "Title [hint]" | "Title Ready to play"; "Title Ready to play", "Title Hint phase" |
| `e2e/puzzle-list.spec.ts` | M3-2 grid-phase, complete-hints and incomplete-hints cases | row contains `[grid]` / `[hint]` / `[hint]` | row contains "Build phase" / "Hint phase" / "Hint phase" |
| `e2e/publish-status.spec.ts` | PB5-2 private and public cases | row contains `[published]` | row contains "Ready to play" |
| `e2e/builder-edits.spec.ts` | O3 "the library gives only owners Edit, …" (the Build listing loop) | `puzzle-status-badge` visible | `puzzle-icon` visible |
| `e2e/duplicate.spec.ts` | 16-S4-2 "opens an unpublished copy …" | badges `[hint]` / `[published]` | `puzzle-status` "Hint phase" / "Ready to play" |
| `e2e/row-menu.spec.ts` | 16-S2-7 "Make public, then Make unlisted …" | badge `[published]` | `puzzle-status` "Ready to play" |
| `e2e/puzzle-list-layout.spec.ts` | L2b-1 "a row shows its title and a metadata line"; "the badge reports the kind of a grid-phase / hints-phase puzzle"; "a published puzzle reads as published, and looks different" | `puzzle-status-badge` visible / its `data-status-kind` / texts `[published]`, `[grid]` | `puzzle-icon` visible / `puzzle-status`'s `data-status-kind` / texts "Ready to play", "Build phase" (titles unchanged) |
| `src/components/puzzle/library-source.test.ts` | `LIBRARY_FILES` (all four 14-S2 source cases) | `components/puzzle/CrosswordIcon.tsx` | `components/puzzle/StatusIcon.tsx` |
| `src/app/globals-css.test.ts` | `VARIABLES`, `STYLES` (F1) | no `green`, no `status-play` | adds `green: '#84C600'` and `'status-play': 'green'` |
| `e2e/color-tokens.spec.ts` | `VARIABLES`, `STYLES` (F1-1, F1-2, F1-4) | as above | as above |

### Acceptance choices *(delegated, orchestrator)*

- The markers carried both the status text and the test hook. The
  amendments move each assertion to the hidden text (`puzzle-status`,
  same `data-status-kind`) or to the visible icon, so every frozen
  check keeps its intent. Retiring the 14-S2 icon case is the one
  removal. Its geometry and drawing move to 18-S3-2.
- The 14-S2-2 row-color case uses a grid draft, so it is unchanged and
  still pins `puzzle-row`. The `focus-ring` cases use the grid sample
  row and are unchanged too.
- Three new cases pass on `main` by design, as regression guards: unique
  clip ids, Play's markers kept, and Build and Hint rows kept on
  `puzzle-row`. Each pins behavior the EPIC says must survive.
- Not covered: the style guide's rows (unchanged code) and narrow widths
  (the row layout is unchanged; S4 handles small screens).

### Discrimination (2026-11-02, observed)

- **Current `main` with the proposed tests:** `npx vitest run
  src/app/globals-css.test.ts src/components/puzzle/library-source.test.ts`
  gives 2 failed, 4 passed. F1 variables and styles fail at
  `--palette-green` and `--color-status-play`. `library-source` fails
  with ENOENT on `StatusIcon.tsx`.
- `npm run test:e2e --` over `status-icons`, `puzzle-library`,
  `library-play`, `puzzle-list`, `publish-status`, `builder-edits`,
  `duplicate`, `row-menu`, `puzzle-list-layout`, `color-tokens`,
  `two-greens` and `focus-ring` gives 25 failed, 98 passed. The failures
  are six 18-S3 cases (missing `--palette-green`, icon width 34 not 46,
  no `puzzle-status`, `[grid]` present, the published row not green) and
  every amended frozen case except `builder-edits`, which also passes on
  `main` because the old icon is visible. All fail at the missing hidden
  text or icon, or at the changed link names and color lists.
- **Throwaway implementation**, then reverted. It touches `globals.css`,
  `ColorSwatches.tsx` and `PuzzleRow.tsx`, adds `StatusIcon.tsx` and
  deletes `CrosswordIcon.tsx`. The patch is kept outside the repo at
  `/tmp/18-s3-throwaway.patch` and applies cleanly to this tree.
  - `npm run verify` exit 0 (Vitest 641 of 641, including `tsc` and
    ESLint over the proposed tests).
  - The same twelve browser files: 120 passed, 3 failed, all in the new
    file and all test defects. I fixed them (sign in before the style
    guide, scroll a row into view before hovering, sample the right
    outline below its rounded corner), then `status-icons.spec.ts` gave
    10 passed (with setup). The `main` run above uses the fixed file.
  - Full `npm run test:e2e` exit 0: 926 passed, 0 failed, under the
    guarded harness's standing reset grant. That is 918, minus the
    retired case, plus 9.
- **Mutations on the throwaway** (`status-icons.spec.ts`, each reverted):
  - Play rows painted `puzzle-row`: 2 failed (18-S3-2 at the green
    background around the Play icon, 18-S3-5 at rest).
  - Build rows drawing the Hint icon: 1 failed (18-S3-2,
    "build cell 1,0 dark" is #14151B).
  - The status text not `sr-only`: 1 failed (18-S3-3, "visually hidden:
    at most a 1px box").

## Repo paths

Acceptance (immutable after freeze): `e2e/status-icons.spec.ts`,
`e2e/puzzle-library.spec.ts`, `e2e/library-play.spec.ts`,
`e2e/puzzle-list.spec.ts`, `e2e/publish-status.spec.ts`,
`e2e/builder-edits.spec.ts`, `e2e/duplicate.spec.ts`,
`e2e/row-menu.spec.ts`, `e2e/puzzle-list-layout.spec.ts`,
`src/components/puzzle/library-source.test.ts`,
`src/app/globals-css.test.ts` and `e2e/color-tokens.spec.ts`.

Runtime:

- `src/components/puzzle/StatusIcon.tsx` (new): the three icons.
- `src/components/puzzle/CrosswordIcon.tsx` (deleted).
- `src/components/puzzle/PuzzleRow.tsx`: the icon, the hidden status
  text, the removed markers and the green row.
- `src/app/globals.css`: `--palette-green` and `--color-status-play`.
- `src/components/style-guide/ColorSwatches.tsx`: the `green` and
  `status-play` rows.
- This story and `../HANDOFF.md`.

Declare any other path before editing it.

## Scope discipline

Only S3. These stay out of scope: filters, the single list, `Checkbox`,
the left column, the Filters panel, Reset, URL state and the
"Open in builder" menu item (all S4); any change to `listPuzzles`,
`puzzleStatus` or play state; other colors.

## Definition of done

- The orchestrator approves this specification, its acceptance and the
  amendments after an independent specification review, under the
  human's delegation. The approval is recorded here and in the handoff.
  Freeze on `main` in a specification-only commit before any runtime
  change.
- Frozen acceptance is unchanged after freeze.
- `npm run verify` exits 0, and the full `npm run test:e2e` suite exits 0.
- Delivered on `main` and the handoff updated with observed results.

## Pending questions

None material. The EPIC settles the icons, the variable, the text, the
markers and the rows. The gray style pairing and the hidden text's place
in the link name are routine, reversible calls, recorded under
Delegated decisions for the reviewer and the human.
