# Story S6 — Narrow right margin

Below the two-column breakpoint, `/puzzles` gets a right margin that
matches its left one. The Create A Puzzle and Filters row, the open
Filters panel and the puzzle rows no longer touch the window's right
edge. A narrower row keeps a usable title, and its date wraps to fit
before its menu and Reset. The two-column layout does not change.

**Status: approved and frozen** (2026-11-02). Drafted under the
orchestration the human delegated on 2026-11-02 and extended to S5–S8 the
same day (see the [handoff](../HANDOFF.md)). An independent specification
review approved it with should-fix items, which are applied here:

- The margin formula.
- The narrow date, an orchestrator decision: S6 fixes it.
- Observed discrimination.
- Nits: the narrow-width test list, concrete margin pairs and a 710px
  width.

A re-review approved it with further should-fix items, also applied:

- Titles take priority over the date, an orchestrator decision.
- An in-progress row in 18-S6-4.
- Nits: the narrow-width claim's wording, `rightRoom`'s Reset condition,
  the Reset headroom and the observing runs.

The same reviewer's final confirmation pass approved it with nothing
blocking or should-fix remaining. The orchestrator approved it under that
delegation and froze it on `main` in a specification-only commit.

**Blast radius: small.** Two components change:

- `PuzzleLibrary.tsx` gets a wrapper element with one responsive padding.
- `PuzzleRow.tsx` puts its date in the row's flow, gives the title column
  a 90px minimum and keeps room on the right for the row's controls.

It adds one spec file and amends no frozen test. No schema, server
action, storage, query, filter or engine change.

**CODE-REVIEW risk classification:** none of the declared Repo paths is a
risk path (`src/engine/**`, `src/lib/puzzle-storage.ts`,
`src/app/puzzles/actions.ts`, `prisma/**`). The acceptance file's helpers
use `src/lib/puzzle-storage.ts` indirectly but don't change it. So this
story is delivered directly on `main`.

## What the code does today

I inspected these files:

- `src/components/puzzle/PuzzleLibrary.tsx`, `LibraryFilters.tsx`,
  `PuzzleRow.tsx`, `PuzzleRowMenu.tsx`, `LibraryPlayControls.tsx`,
  `StatusIcon.tsx` and `library-row.ts`.
- `src/app/puzzles/page.tsx` and `src/app/layout.tsx`.
- `src/components/layout/Masthead.tsx`.

I also grepped `e2e` for:

- The library's test ids, `setViewportSize`/`viewport` and `scrollWidth`.
- Right-edge checks.
- `212`, `280` and `puzzle-list-updated`.

### The layout

- `layout.tsx`'s `main` is `mx-auto w-full max-w-[1800px]`, with no
  padding. The masthead has its own 20px padding.
- The library (`data-testid="puzzle-library"`) is
  `mx-auto w-full max-w-[700px] border-l pl-5`, with
  `min-[948px]:left-[100px]`. On desktop, the 200px filters column is
  absolutely positioned left of it.

### Root cause

The column's left side has a 1px hairline and 20px of padding, so its
content starts 21px inside the column. Its right side has neither, so the
content runs to the column's right edge. Three things end there:

- the rows (`PuzzleRow`, full width)
- the Create A Puzzle and Filters row (`justify-between`)
- the panel

The only right margin comes from centering: (W − 700) / 2 for a window
W wide.

- **Below a 700px window**, the column is the window's width. The left
  margin is 21px and the right margin is 0. At 375 it is 21/0.
- **From 700 to 947px**, the right margin is 21px less than the left
  one: 26/5 at 710, 120.5/99.5 at 899 and 144.5/123.5 at 947.

So the content touches the right edge on phones, and the margins differ
across the whole one-column range. That matches the human's "below
about 900px".

### The row

- The icon's margin box is 34px (46px with `-mx-[6px]`), so the title
  column (`w-[212px]`) starts 56px in.
- The date is `absolute left-[280px] top-[11px]`, on line 1, with no
  right bound.
- The menu sits 12px in from the right and is 24px wide. The play Reset
  sits 12px in, or 48px beside the menu.
- **Observed on `main`** at 375px, in the patch-free 18-S6-4 runs (see
  Discrimination): a long date ("September 30, 2026") was 40px tall.
  The absolute date is only as wide as the space left in the row after
  280px, so it wraps to two lines. Its box ran to the window's edge (375),
  past the menu (left edge at 339.5).
- **Epic 15's open item:** at 320px the dates run past the window.

### Tests pinning what changes

- **`library-filters.spec.ts`:**
  - 18-S4-8's 947px case puts Create A Puzzle on the content edge
    (`c.x + 21`).
  - 18-S4-9 (375 and 947px) puts Create A Puzzle on the content edge and
    the Filters button's right edge on the column's right edge
    (`c.x + c.width`). It also keeps the groups inside the column and
    checks for horizontal overflow.

  These checks measure from the column box, so the fix keeps the column
  box's right edge as the content's right edge.
- **`puzzle-library.spec.ts` at 1280px:** 14-S2's "the date … 280px in
  on line 1", "title clear of the date" (a long title) and "the right
  control … 12px from the right on line 1".
- **`status-icons.spec.ts` 18-S3-4 at 1280px:** "clear of the date".

None of these is below 948px, and the desktop row is unchanged.

Other specs that open `/puzzles` or a dialog below 948px:

- `small-screens.spec.ts`: 15-S6-7's library overflow check and New
  puzzle dialog test, both at 375.
- `masthead.spec.ts` (around line 470): `/puzzles` at 375. It checks
  only the masthead.
- `no-play-reset.spec.ts` at 768: play only. Its library part runs at
  1440.

None of them pins the column's right inset or the row's insides. No
other spec measures the library's layout below 948.

## Decisions

### From the EPIC *(human, 2026-11-02)*

- Below the two-column breakpoint (948px, 18-S4), `/puzzles` has a right
  margin like its left one ("it could be exact or it could be similar").
  The rows and the Filters button no longer touch the window's edge.
- Only `/puzzles`. Other pages' layouts are a non-goal.

### Orchestrator decision *(2026-11-02, from the specification review)*

- **S6 fixes the narrow date** (first review). It doesn't just record
  the problem, because the narrower rows make it worse. From 375px up, a
  row's contents stay inside the row and don't overlap: the title, the
  builder name, the in-play marker, the date, the menu and the play
  Reset. Desktop stays pixel-identical. 320px stays epic 15's non-goal.
- **Titles take priority over the date** (re-review). This overrides an
  earlier draft that kept the date on one line and shrank the title
  column to about 35px at 375 on rows with both a menu and Reset. Below
  948px:
  - The title column has a minimum width, so every row type shows a
    usable title at 375. The target was about 90px.
  - The date takes the rest and may wrap to two lines, as it already
    does on `main` at 375.
  - Desktop stays the same: the date 280px in, 11px from the top, on one
    line.

### Delegated decisions *(orchestrator, 2026-11-02; for the human's end-of-epic review)*

- **Exact, not similar.** At every one-column width the content's right
  margin (window edge to the content's right edge) equals its left
  margin (window edge to the content's left edge):
  - 21px below a 721px window.
  - (W − 679) / 2 from 721 to 947px, so the content is centered. For
    example 110/110 at 899 and 134/134 at 947.

  Matching the margin only below 700px would leave the margins unequal
  between 700 and 947px, which is part of what the human reported.
- **How: the margin.** `PuzzleLibrary` wraps its column in a `div` with
  `pr-[21px] min-[948px]:pr-0`. The column keeps `mx-auto` and
  `max-w-[700px]`, so it centers within the window less 21px:
  - Below 721px the column is the window less 21px, and its rows are
    21px narrower.
  - From 721px it keeps its 700px and sits 10.5px further left.

  The column's box, its hairline and everything inside it are otherwise
  unchanged. Its right edge is still the content's right edge, so 18-S4-8
  and 18-S4-9 hold unchanged.

  Rejected: right padding on the column itself. It would move the
  Filters button 21px inside the column's box, which breaks 18-S4-9's
  "Filters on the right edge".
- **The hairline stays at the window's left edge** below 721px. On the
  left, the human sees the 20px between the hairline and the content as
  the margin. The right side matches that, plus the hairline's 1px. There
  is no hairline on the right.
- **How: the date.** In `PuzzleRow`, the date leaves absolute
  positioning and joins the row's flow after the title column:
  - It is `ml-3 mt-[11px] self-start`, so it lands 12px after the title
    column and 11px from the top. That is 280px in and on line 1, as
    before. `min-[948px]:whitespace-nowrap` keeps it on one line on
    desktop.
  - The row gets right padding (`rightRoom`) that keeps room for its
    controls, 12px clear of each:
    - nothing: 12px
    - the menu: 48px
    - the play Reset: 64px
    - both: 100px

    Reset counts when `LibraryPlayControls` shows it: the attempt is
    completed and has a session id. The menu-and-Reset figure leaves 52px
    (100 − 48) for Reset and its gap. Reset measured 37.1px, so the gap
    is 14.9px.
- **The title column's minimum is 90px** (`min-w-[90px]`, replacing
  `min-w-0`). In a narrow row the date gives way first:
  - Its `shrink-[1000]` against the column's default shrink of 1 means
    it shrinks down to its widest word ("September", 72.6px) and wraps.
  - Only then does the title column shrink, and not below 90px.
  - The date never needs a third line, since "30, 2026" is narrower than
    "September".
  - In a wide row nothing shrinks, so every position is the same as
    today: date 280px in, top 11px, one line, title column 212px. The
    1280px frozen cases above confirm this.

  **Worst case at 375px** (row 333px wide; date "September 30, 2026",
  observed):

  | Row type | Right room | Title column | Date |
  | --- | --- | --- | --- |
  | own, menu and Reset (completed) | 100px | 92.4px | 72.6px, 2 lines |
  | foreign, Reset only (completed) | 64px | 128.4px | 72.6px, 2 lines |
  | own, menu only (draft, unlisted) | 48px | 144.4px | 72.6px, 2 lines |
  | foreign, in play (`[in-play]`) | 12px | 180.4px (title text 119.2px, then the marker) | 72.6px, 2 lines |
  | foreign, untouched | 12px | wider than the in-play row (not seeded) | 2 lines |

  At 600 and 899px every row keeps its 212px column and a one-line date
  (136.2px).

  Rejected:
  - A breakpoint-only absolute position for the date. It can't know the
    date's width, so it can't keep the title clear of it.
  - Keeping the date on one line. It leaves about 35px for the title.
- **Rows are narrower only below 721px.** Their icon and title start
  don't move. The menu and Reset keep their insets from the row's right
  edge.
- **Desktop is unchanged** from 948px: same column, same centered pair,
  same rows.
- **At 320px only the margins are checked**, not overflow or the row's
  insides. That width is epic 15's non-goal.

## Acceptance

*Approved and frozen.* One new file. No frozen test is amended.

### e2e/narrow-margin.spec.ts

Four numbered cases, sixteen tests. Each test signs in a fresh builder
and seeds six puzzles, all last updated "September 30, 2026" (the
longest month):

- a grid draft, a hints draft and an unlisted published puzzle (menu)
- their own completed puzzle (menu and Reset)
- another builder's puzzle they completed (Reset only)
- another builder's puzzle they have started, one letter short
  (`[in-play]`)

The test then opens
`/puzzles?play=underway,complete&create=build,hint,unlisted`, so the
list holds only those rows.

1. **18-S6-1** equal margins in one column, at 320, 375, 600, 710, 899
   and 947px (six tests):
   - Create A Puzzle is at least 21px from the left edge.
   - The Filters button's right edge is as far from the window's right
     edge as Create A Puzzle is from the left edge.
   - Each row starts on that left content edge, and its right margin
     equals the left one.
   - With the panel open, the Play, Create and Size groups and the panel
     stay inside both margins.
2. **18-S6-2** nothing runs past the window in one column, at 375, 600,
   710, 899 and 947px, with the panel closed and open (five tests).
3. **18-S6-3** two columns unchanged, at 948 and 1280px (two tests):
   - The list column is 700px and the 900px pair is centered.
   - Create A Puzzle is 200px left of the hairline, and the Filters
     button is hidden.
   - Rows start 21px inside the hairline and end at the column's right
     edge.
   - Nothing overflows.
4. **18-S6-4** a row's contents stay inside it in one column, at 375,
   600 and 899px (three tests). For each of the six rows:
   - The date reads "September 30, 2026" in at most two 20px lines,
     with its text inside its box and its box inside the row.
   - The title column (the builder-name block) is at least 90px.
   - The title starts inside the row.
   - The title, the builder name and the `[in-play]` marker (on the
     in-play row only) end before the date.
   - The menu (if any) and Reset (if any) are inside the row, and Reset
     ends before the menu.
   - The date ends before the first of them, or before the row's right
     edge.

### Amended acceptance

None. Every frozen test is unchanged:

- No frozen test checks the column's right inset below 948px. The
  18-S4-8 and 18-S4-9 checks measure from the column box, and the fix
  keeps that box's right edge as the content edge.
- No frozen test checks the title column or the date below 948px. The
  1280px checks of the date's 280px inset, line and clearances still
  pass.

### Acceptance choices *(delegated, orchestrator)*

- Margins are measured from the window (`clientWidth`), not from the
  column box, since the human's complaint is about the window's edge.
- 18-S6-2 and 18-S6-3 pass on `main` by design, as regression guards.
  18-S6-2 checks that the change adds no overflow, and 18-S6-3 that
  desktop is unchanged. 18-S6-1 and 18-S6-4 are the discriminating cases.
- The widths: 899 stands in for the human's "about 900", 947 is the
  widest one-column width, and 710 falls between 700 and 721.
- The filter query keeps the shared database's other puzzles out of the
  measured rows. The fixtures cover every right-control combination.

### Discrimination (2026-11-02, observed)

Observed on the re-review's revision (the title-priority row), one suite
at a time on a quiet machine. Load averages (`uptime`) were 3.4 to 12
during the runs.

- **Throwaway implementation**, then removed. It touches
  `PuzzleLibrary.tsx` and `PuzzleRow.tsx`.
  - The patch is kept outside the repo at `/tmp/18-S6-throwaway.patch`.
    It matches the diff that was tested (`cmp`), and it applies cleanly
    to this tree (`git apply --check`).
  - `npm run verify` exit 0: Vitest 656 of 656, with `tsc` and ESLint
    over the proposed spec. The only warning is the existing `reqJson`
    unused-variable one.
  - `npm run test:e2e --` over `narrow-margin`, `library-filters`,
    `small-screens`, `status-icons`, `done-icon` and `masthead`: 93
    passed, 0 failed (with setup), in one run. This ran under the
    guarded harness's standing reset grant.
  - **Extra checks for the row change:** `puzzle-library`,
    `library-play`, `puzzle-list-layout`, `row-menu`, `muted-text`,
    `builder-edits`, `no-play-reset` and `focus-ring`: 99 passed, 0
    failed, in one run.
  - The 375px widths in the worst-case table came from a temporary
    logging line in 18-S6-4, removed afterwards.
- **Current `main` with the proposed spec:** 7 failed, 10 passed (with
  setup).
  - 18-S6-1 failed at all six widths, at "Filters as far from the right
    edge as Create A Puzzle from the left". The left/right margins were
    21/0 at 320, 375 and 600, 26/5 at 710, 120.5/99.5 at 899 and
    144.5/123.5 at 947.
  - 18-S6-4 failed at 375, at "date before the row's controls": the
    date's box reached 375 against a limit of 339.5.
  - The passes were 18-S6-2, 18-S6-3, and 18-S6-4 at 600 and 899.
- **Mutation:** with the margin fix and without the row change, 18-S6-4
  gave 1 failed and 3 passed. At 375 the date reached 373.6 against
  318.5, so the margin alone isn't enough.
- **Infrastructure noise, not test failures:**
  - On the earlier revision, runs had `ECONNRESET`s from
    `/api/auth/get-session` and 30s timeouts. Their reruns passed.
  - On this revision, two attempts failed to start the web server
    (Turbopack: `next/font/google` resolution failed, likely a network
    fetch of the font). The next attempt started normally.
  - None of the runs recorded above hit either.
- The full `npm run test:e2e` suite was not run while drafting. With the
  implementation it should be the suite on S5's commit plus 16.

## Repo paths

Acceptance (immutable after freeze): `e2e/narrow-margin.spec.ts`.

Runtime:

- `src/components/puzzle/PuzzleLibrary.tsx`: the wrapper and its
  one-column right padding.
- `src/components/puzzle/PuzzleRow.tsx`: the date in the row's flow,
  the title column's 90px minimum, and the row's right padding for its
  controls.
- This story and `../HANDOFF.md`.

Declare any other path before editing it.

## Scope discipline

Only S6. These stay out of scope:

- Other pages' layouts and the masthead.
- The two-column layout and the desktop row.
- The row menu's and Reset's own positions.
- The 320px overflow (epic 15).
- The filters' behavior.
- The hint preview (S7) and the audit cleanups (S8).

## Definition of done

- The orchestrator approves this specification and its acceptance after
  an independent specification review, under the human's delegation.
  The approval is recorded here and in the handoff. Freeze on `main` in
  a specification-only commit before any runtime change.
- Frozen acceptance is unchanged after freeze.
- `npm run verify` exits 0, and the full `npm run test:e2e` suite exits 0.
- Delivered on `main` and the handoff updated with observed results.

## Pending questions

None material. The EPIC settles the scope ("exact or similar"), and the
orchestrator settled the narrow date and the title priority. The other
choices are routine, reversible calls, recorded under Delegated
decisions for the reviewer and the human: exact equality, the wrapper,
the hairline's place, the in-flow date, its control room and the 90px
title minimum.
