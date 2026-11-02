# Story S5 — DONE icon

A published puzzle the signed-in player has completed gets a fourth
status icon, DONE, so it stands apart from puzzles still in play. The
icon is the human's export, cleaned like S3's three and drawn with a new
palette variable, `orange`, through a new `status-complete` style. The
row's hidden status text names the state ("Complete"), and the visible
`[complete]` marker goes. `[in-play]` stays. The row stays green.

**Status: done** (2026-11-02). Drafted under the
orchestration the human delegated on 2026-11-02 and extended to S5–S8 the
same day (see the [handoff](../HANDOFF.md)). An independent specification
review approved it with one should-fix (the variable and style names
were credited to the human; now a delegated decision) and nits (the
case count, applied; a stale `[complete]` sentence in
`status-icons.spec.ts`'s header, left for S8). The orchestrator approved
and froze it on `main` in specification-only commit `3b647f4` under that
delegation; a frozen-test correction was refrozen in `758f7a6`. It was
then implemented and delivered on `main`.

**Blast radius: small.** The change touches the status icon (one more
entry), the row (which icon, which hidden text, one marker fewer), one
palette variable, one color style and two catalog rows. It adds one spec
file and amends seven frozen test files (one by correction). No schema, server action, storage,
query or engine change.
**CODE-REVIEW risk classification:** none of the declared Repo paths is a
risk path (`src/engine/**`, `src/lib/puzzle-storage.ts`,
`src/app/puzzles/actions.ts`, `prisma/**`). The acceptance files import
`src/lib/puzzle-storage.ts` but don't change it. So this story is
delivered directly on `main`.

## What the code does today

I inspected `src/components/puzzle/StatusIcon.tsx`, `PuzzleRow.tsx`,
`src/lib/puzzle-status.ts`, `src/lib/library-play.ts`,
`src/app/globals.css`, `src/components/style-guide/ColorSwatches.tsx`,
the style guide's sample rows (`src/app/style-guide/page.tsx`) and the
human's `~/Downloads/complete-icon.svg` beside `play-icon.svg`. I also
grepped `e2e` and `src` for `[complete]`, `Ready to play`,
`puzzle-play-state`, `puzzle-status`, `data-status`, `status-kind`,
`puzzle-icon`, `status-play` and the F1 color lists.

- `StatusIcon({ status })` takes `puzzleStatus`'s `StatusKind` (`grid`,
  `hints`, `published`) and draws one of three cleaned icons from a
  table: grid, outline and band color styles plus the label's outline
  path, moved 0.2981 right onto the centered band. `data-status` is the
  kind.
- `PuzzleRow` passes `puzzle.statusKind` to the icon and to the hidden
  `puzzle-status` text (`data-status-kind`, "Build phase", "Hint phase",
  "Ready to play"). A published row's `play` is the caller's own attempt
  (`classifyLibraryPlay`: `untouched`, `in-progress`, `completed`). Its
  marker is `[in-play]` or `[complete]` (`puzzle-play-state`). A
  completed row also has Reset. Rows whose `statusKind` is `published`
  are `puzzle-row-play`.
- The style guide's second sample row is a foreign completed puzzle, so
  it shows `[complete]` today.
- **The export:** the same geometry as `play-icon.svg` (46×34, the
  grid at x 5.7019, the band at x 1.7019, the duplicated cell, the
  fixed clip id), all in #EF9D05, which is in no palette. Its label is
  outlined text reading DONE.
- **Tests pinning what changes:** `status-icons.spec.ts` (18-S3-2 expects
  a foreign completed row to draw Play; 18-S3-4 expects `[complete]`),
  `library-play.spec.ts` (`expectState`'s `[complete]`, reached by nine P5
  cases), `puzzle-library.spec.ts` (14-S2-4's `[complete]` and link
  name), `library-filters.spec.ts` (18-S4-3's `[complete]` and link
  names) and the F1 lists in `globals-css.test.ts` and
  `color-tokens.spec.ts`. 18-S3-5 checks a foreign completed row is
  green, which stays true. `no-play-reset.spec.ts` resets a completed
  row through test ids only and is unaffected. `focus-ring.spec.ts` uses
  the style guide's grid sample row and is unaffected.

## Decisions

### From the EPIC *(human, 2026-11-02)*

- **Which rows get DONE:** published puzzles the signed-in player has
  completed, whoever built them (public or unlisted). Other published
  puzzles keep Play. "Completed" is the caller's own attempt as the
  library already classifies it (`play.state === 'completed'`), so a
  puzzle only someone else has completed is Play for the caller.
- **The icon** is the human's `complete-icon.svg` (orange #EF9D05,
  label DONE), cleaned and drawn as S3's icons are: same component,
  geometry, placement and `aria-hidden`.
- **The row stays green:** `puzzle-row-play`, `puzzle-row-play-hover` on
  hover and keyboard focus, as S3 specified.
- **Markers:** the visible `[complete]` marker is removed; the hidden
  status text names the state instead. `[in-play]` stays.
- The orange, #EF9D05, is drawn through a color style, following S3's
  pattern (the names are a delegated decision below).

### Delegated decisions *(orchestrator, 2026-11-02; for the human's end-of-epic review)*

- **The hidden text is "Complete"**, matching the Complete filter and the
  old marker, so a completed row's link reads "Title Complete". It
  replaces "Ready to play", not adds to it.
- **Names.** The variable is `orange` (`--palette-orange: #ef9d05`)
  and the style `status-complete`
  (`--color-status-complete: var(--palette-orange)`), both in the style
  guide's catalog
  (the play state's name, as the filter uses it), mirroring `green` and
  `status-play`. `orange` goes after `green-faint-hover` in the palette
  and the catalog. `status-complete` follows `status-play`, with a
  `/* the DONE status icon (Story 18-S5) */` source comment. The tests
  don't pin order.
- **The icon's status.** `StatusIcon` takes `StatusKind | 'complete'`
  (an `IconStatus` type exported from `StatusIcon.tsx`); `PuzzleRow`
  passes `'complete'` when the row's play state is completed, otherwise
  its `statusKind`. `puzzleStatus` and `StatusKind` don't change. The
  icon's `data-status` and the hidden text's `data-status-kind` read
  `complete` on such rows. These hooks aren't pinned by the tests.
- **Cleaning** is S3's: the grid at x 6, the band at x 2, the DONE label
  outlines moved 0.2981 right, the covered cell in the grid's color, only
  the six white cells drawn, a `useId` clip id. Grid, outline and band
  use `status-complete`; the white cells and label use `inverse`.
- **The green row** still follows `statusKind === 'published'`, so a
  completed row needs no change there.
- **The style guide** needs no change. Its completed sample row now shows
  DONE with no marker, which 18-S5-2 checks.
- **A solved but unstamped attempt counts as completed** (as
  `classifyLibraryPlay` already reads it), so its row also gets DONE and
  "Complete". Noted by the specification review; no test pins its icon.

## Acceptance

*Approved and frozen 2026-11-02.* One new file and seven amended files
(`duplicate.spec.ts` by the correction below).

### e2e/done-icon.spec.ts

Five numbered cases, seven tests (18-S5-2 has three). The colors are the human's values written out; the icons
are checked by their screenshot pixels, as in S3.

1. **18-S5-1** `orange` is a palette variable and `status-complete`
   references it. `--palette-orange` is #EF9D05, `status-complete`
   resolves to it and follows it when it is edited live, and both have
   catalog rows swatched in orange.
2. **18-S5-2** the icon, in three cases:
   - The caller's own completed puzzle, a foreign public one and a
     foreign unlisted one draw DONE: the cell pattern, outline, rounded
     corners, band position and band color in orange, a white label, on
     the green row. Own untouched, foreign untouched, foreign in-play,
     and own and foreign puzzles completed only by another player draw
     Play. DONE's label pixels differ from PLAY's by more than 20.
   - The DONE icon is 46×34, 4px in and vertically centered, and the
     title is 56px in.
   - The style guide's completed sample row draws DONE.
3. **18-S5-3** an own and a foreign completed row name "Complete" in
   visually hidden text inside the link (at most a 1px clipped box); the
   link's accessible name is "Title Complete"; the row has no
   `[complete]` and no play marker, and keeps Reset. An in-play row
   still shows `[in-play]` ("Title Ready to play [in-play]"); an
   untouched row reads "Title Ready to play".
4. **18-S5-4** the caller's own completed row is #F0F5E5 at rest and
   #EAF0DB on hover and on keyboard focus, not on mouse focus, with the
   150ms transition.
5. **18-S5-5** resetting a completed row from the library turns its
   DONE icon back to Play and its hidden text to "Ready to play".

### Amended acceptance

Amended in the specification-only freeze commit (`duplicate.spec.ts` in
the later correction commit). Every other frozen test
is unchanged.

| File | Case | Was | Becomes | Reason |
| --- | --- | --- | --- | --- |
| `e2e/status-icons.spec.ts` | header comment | play rows keep `[complete]` | adds an 18-S5 note pointing to `done-icon.spec.ts` | the comment would be stale |
| `e2e/status-icons.spec.ts` | 18-S3-2 "… every published row draws Play" | a foreign completed row draws Play | renamed "… every published row still to finish draws Play"; the completed fixture is dropped | a completed row draws DONE (18-S5-2) |
| `e2e/status-icons.spec.ts` | 18-S3-4 "Play rows keep [in-play] and [complete]: …" | checks both markers | renamed "Play rows keep [in-play]: …"; the `[complete]` fixture and loop entry are dropped | `[complete]` is removed (18-S5-3) |
| `e2e/status-icons.spec.ts` | 18-S3-5 "a Play-icon row is puzzle-row-play, …" | title only | renamed "a Play- or DONE-icon row is puzzle-row-play, …"; assertions unchanged | its completed fixture now draws DONE; keeps the title accurate |
| `e2e/library-play.spec.ts` | `expectState` (the P5 helper; nine cases reach its completed branch) | a completed row's cue is visible `[complete]` | a completed row has no cue, and its `puzzle-status` reads "Complete"; `[in-play]`'s visibility check moves into its branch | `[complete]` is removed; the hidden text names the state |
| `e2e/puzzle-library.spec.ts` | 14-S2-4 "lists every published puzzle, …" | the completed row's marker `[complete]`, link "Title Ready to play [complete]" | no marker; link "Title Complete" (a status column added to the table) | as above |
| `e2e/library-filters.spec.ts` | 18-S4-3 "with no filter it lists …" | own and foreign completed rows: `[complete]`, link "Title Ready to play [complete]"; Reset keyed on the marker | no marker; link "Title Complete"; Reset keyed on the status | as above |
| `src/app/globals-css.test.ts` | `VARIABLES`, `STYLES` (F1) | no `orange`, no `status-complete` | adds `orange: '#EF9D05'` and `'status-complete': 'orange'` | the new variable and style |
| `e2e/color-tokens.spec.ts` | `VARIABLES`, `STYLES` (F1-1, F1-2, F1-4) | as above | as above | as above |
| `e2e/duplicate.spec.ts` | 16-S4-2 "duplicating a published puzzle" | the source row's `puzzle-status` reads "Ready to play" | reads "Complete" | its seeded caller session is solved, so the row is completed; added by correction (below) |

### Correction (2026-11-02)

The full browser suite on the implementation (943 passed, 1 failed)
found `duplicate.spec.ts` 16-S4-2, missing from the table above: it
seeds the caller a solved session on the source, then expected "Ready to
play". The human approved the correction ("Expect \"Complete\"");
independently reviewed; frozen in a separate specification-only commit
before the implementation was committed.

### Acceptance choices *(delegated, orchestrator)*

- The 18-S3 amendments only drop the completed fixture from cases about
  Play and `[complete]`; their checks of every other row are unchanged.
  The completed row's icon, text and color move to `done-icon.spec.ts`.
  So these amended cases pass on `main` by design.
- Two new cases pass on `main` by design, as regression guards: the DONE
  icon's geometry (unchanged from S3's) and the completed row's green
  (18-S5-4). Each pins behavior the EPIC says must survive.
- DONE's label is checked against PLAY's pixel mask, not by width; the
  two labels are within 2px in width.
- Not covered: the filters. Complete still selects by play state, which
  doesn't change.

### Discrimination (2026-11-02, observed)

- **Throwaway implementation**, then reverted. It touches `globals.css`,
  `ColorSwatches.tsx`, `StatusIcon.tsx` and `PuzzleRow.tsx`. The patch is
  kept outside the repo at `/tmp/18-s5-throwaway.patch` and applies
  cleanly to this tree (`git apply --check`).
  - `npm run verify` exit 0 (Vitest 656 of 656, including `tsc` and
    ESLint over the proposed tests; only the existing `request-logger`
    warning).
  - `npm run test:e2e --` over `done-icon`, `status-icons`,
    `library-play`, `puzzle-library`, `library-filters`, `color-tokens`,
    `no-play-reset` and `focus-ring`: 107 passed, 0 failed (with setup),
    under the guarded harness's standing reset grant.
- **Mutations on the throwaway** (`done-icon.spec.ts`, each reverted):
  - DONE drawn with PLAY's label outlines: 1 failed (18-S5-2, "DONE's
    label differs from PLAY's").
  - Completed rows drawing the Play icon: 3 failed (18-S5-2's list and
    style-guide cases, 18-S5-5, at "done cell 1,0 dark" being #84C600).
  - The old marker and "Ready to play" kept: 1 failed (18-S5-3,
    `toHaveText`).
- **Current `main` with the proposed and amended tests:**
  - `tsc --noEmit` passes. `npx vitest run src/app/globals-css.test.ts`
    gives 2 failed, 4 passed (F1 at `--palette-orange` and
    `--color-status-complete`).
  - The same eight browser files: 21 failed, 86 passed. The failures are
    five of the seven new cases (no `--palette-orange`, completed rows
    drawing green, "Ready to play" and `[complete]`), five F1 cases in
    `color-tokens`, nine `library-play` cases through `expectState`,
    14-S2-4 and 18-S4-3. The passes are unaffected cases, the two
    regression guards and the 18-S3 amendments noted above.
- The full `npm run test:e2e` suite was not run while drafting. With the
  implementation it should be S4's 937 plus 7.

### Implementation (2026-11-02, observed)

Runtime is the declared paths only: `globals.css`, `ColorSwatches.tsx`,
`StatusIcon.tsx` and `PuzzleRow.tsx`. The drafting throwaway was applied
unchanged; it matches the Decisions and Delegated decisions. Frozen
acceptance is unchanged from `758f7a6`; no CODE-REVIEW risk path in the
actual diff. `npm run verify` exit 0 (Vitest 656 of 656). Full
`npm run test:e2e` exit 0, 944 passed, 0 failed (S4's 937 plus 7), under
the guarded harness's standing reset grant. Three earlier full runs failed
only on timeouts and `ECONNRESET` while another repository's test suite
loaded the machine (load average 20–35); the passing run was on a quiet
machine.

## Repo paths

Acceptance (immutable after freeze): `e2e/done-icon.spec.ts`,
`e2e/status-icons.spec.ts`, `e2e/library-play.spec.ts`,
`e2e/puzzle-library.spec.ts`, `e2e/library-filters.spec.ts`,
`src/app/globals-css.test.ts` and `e2e/color-tokens.spec.ts`.

Runtime:

- `src/components/puzzle/StatusIcon.tsx`: the DONE icon and the
  `IconStatus` type.
- `src/components/puzzle/PuzzleRow.tsx`: which icon and hidden text a
  completed row gets; `[complete]` removed.
- `src/app/globals.css`: `--palette-orange` and
  `--color-status-complete`.
- `src/components/style-guide/ColorSwatches.tsx`: the `orange` and
  `status-complete` rows.
- This story and `../HANDOFF.md`.

Declare any other path before editing it.

## Scope discipline

Only S5. These stay out of scope: `puzzleStatus`, `StatusKind`,
`classifyLibraryPlay`, `listPuzzles` and the filters; the builder's
published status; play's own completion mark; the narrow margin (S6), the
hint preview (S7) and the audit cleanups (S8).

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

None material. The EPIC settles which rows get DONE, the icon, the green
row and the markers. The hidden text, the variable and style names and
the hooks are routine, reversible calls, recorded under Delegated
decisions for the reviewer and the human.
