# Story L3 — A library grouped by size

Final slice of the puzzle-library epic. L2 fixed the words and gave each
row a shape; this makes the page as a whole read well.

Three problems remain, all visible on a real screen:

- **The rows span the whole window.** The page has no width constraint,
  so on a wide display Edit sits roughly 2,500px from the title it edits.
  The eye can't connect them.
- **The metadata line is crowded.** Badge, dot and date sit at similar
  weights on one line, and the dot floats with uneven spacing. It reads
  as clumped rather than composed.
- **Everything is one list.** A 5×5 in progress, a published Sunday and
  a half-built daily all sit together, ordered only by date.

Repo paths:
- `src/lib/puzzle-groups.ts` — new: `sizeFor`, `groupPuzzles`
- `src/lib/puzzle-groups.test.ts` — new (**already provided — do not
  edit**)
- `src/app/puzzles/actions.ts` — edited: `listPuzzles` also returns each
  puzzle's dimensions and black-square pattern
- `src/components/puzzle/GridThumbnail.tsx` — new
- `src/app/puzzles/page.tsx` — edited: measure, groups, row layout
- `e2e/puzzle-groups.spec.ts` — new (**already provided — do not edit**)

**High blast radius** — `src/app/puzzles/actions.ts`. Opens a PR.

## Design

**A readable measure.** The page content — header and list together —
is constrained to `max-w-3xl` and centred. Edit now sits beside the
title it acts on rather than across the screen from it. New Puzzle stays
top-right, but of the content column rather than the window, so the
header and the list share one set of edges.

**Grouped by size.** One section per size, smallest to largest: Mini,
Midi, Daily, Sunday. Each heading names the size in the display face
with its dimensions beside it in tertiary ink — "Daily  15 × 15" — so the
label reads first and the measurement confirms it. Empty groups are
omitted. Grids that match no standard size (which the app never creates,
but which tests seed constantly) collect in a final "Other sizes" group
rather than disappearing.

**Work in progress first.** Within a group, puzzles still being built or
clued come before published ones, and within each of those, most
recently updated first. What needs attention sits at the top.

**A thumbnail of the actual grid.** Each row leads with a small square
drawn from the puzzle's real black-square pattern — black cells black,
every other cell white. It echoes the grid icons in the NYT app, it
shows the puzzle's shape before you read a word, and it makes two
puzzles of the same size distinguishable at a glance. It is derived from
the stored grid, never stored itself.

**The row reorganises.** Left to right: thumbnail, then the title with
the updated date on its own line beneath it, then the status badge and
Edit together on the right.

```
[▦]  Sparky Pluggy                         Writing clues   [ Edit ]
     Updated Sep 18, 2026
```

The badge moves next to the action it relates to — status and what you
can do about it are read together — and the date line stops competing
with it. The middle dot disappears because nothing is left for it to
separate. The title gets clearly more weight than the date: body size in
the display face against help size in secondary ink.

## Required contract

```ts
// src/lib/puzzle-groups.ts (new)
import type { PuzzleSize } from './puzzle-size';
import type { Phase } from '../engine/puzzle';

/** The standard size whose dimensions match exactly, or null. */
export function sizeFor(dimensions: { cols: number; rows: number }): PuzzleSize | null;

export interface GroupablePuzzle {
  cols: number;
  rows: number;
  phase: Phase;
  publishedAt: Date | null;
  updatedAt: Date;
}

export interface PuzzleGroup<T> {
  size: PuzzleSize | null;       // null = the "Other sizes" group
  label: string;                 // 'Mini' | 'Midi' | 'Daily' | 'Sunday' | 'Other sizes'
  dimensions: string | null;     // '15 × 15' (U+00D7), null for Other sizes
  puzzles: T[];
}

export function groupPuzzles<T extends GroupablePuzzle>(
  puzzles: readonly T[]
): PuzzleGroup<T>[];
```

`sizeFor` reads from `dimensionsFor` rather than restating the numbers,
so there is still exactly one place sizes are defined.

`groupPuzzles` is generic so the page keeps every field it passed in —
id, title, status inputs — without the grouping logic knowing about
them. Groups come back in size order with Other last and empties
omitted; within a group, unpublished before published, then
`updatedAt` descending. Input is not mutated.

```ts
// src/app/puzzles/actions.ts — listPuzzles gains three fields per row
cols: number;
rows: number;
black: boolean[][];   // black[row][col], true for a black cell
```

`listPuzzles` already reads each row's stored grid to summarise it; it
now also returns the dimensions and the black pattern from that same
read. No new query, no schema change.

```tsx
// src/components/puzzle/GridThumbnail.tsx (new)
export function GridThumbnail(props: {
  cols: number;
  rows: number;
  black: boolean[][];
}): React.JSX.Element;
```

A fixed-size square, decorative (`aria-hidden`) since the title already
names the puzzle.

## Markup contract

Unchanged, and relied on by seven specs: `puzzle-list`,
`puzzle-list-item` with all six of its data attributes,
`puzzle-list-title`, `puzzle-status-badge` with `data-status-kind`,
`puzzle-list-updated`, `puzzle-edit-link`, `puzzle-list-header`,
`page-heading`.

**`puzzle-list-item` keeps `text-body`**, for the same reason as L2b:
`typography.spec.ts` reads font size directly off it.

**Each row still contains exactly one link.** The thumbnail is not a
link — `puzzle-list-layout.spec.ts` asserts the count.

New:
- `data-testid="puzzle-group"` on each section, with `data-size` set to
  the `PuzzleSize` or to `other`.
- `data-testid="puzzle-group-heading"` and
  `data-testid="puzzle-group-dimensions"` inside it.
- `data-testid="puzzle-thumbnail"` on the thumbnail, containing one
  element per cell with `data-black="true"` or `"false"`.

`puzzle-list` becomes the wrapper around all groups rather than a single
`<ul>`; each group renders its own list.

## Decisions

**Size is derived, not stored.** The grid's dimensions already determine
it, so storing it would duplicate derived data — the same mistake the
engine's "slots are derived, never stored" rule exists to prevent.

**Grouping logic is a pure function, outside the page.** It is where the
ordering rules live, and it is testable in Vitest without a database or
a browser. The page just renders what it returns.

**"Other sizes" exists because tests need it, and says so plainly.** The
app only creates the four standard sizes, but nearly every spec seeds a
3×3. Without a catch-all those rows would silently vanish from the page
and break a dozen specs that look for them by title.

**Published puzzles sort below work in progress, not into their own
section.** Separate sections per status inside every size group would
double the number of headings on the page for a distinction the badge
already makes. Ordering carries it instead.

**No play-state grouping.** Unplayed, in play and played all describe a
player's relationship to a published puzzle, and nothing tracks that
yet. It waits for the play-mode epic; the row's right-hand cluster is
where a Play action and a progress state will go.

## Scope discipline

- No schema changes and no new stored fields.
- No changes to `puzzleStatus`, its labels, or `StatusKind`.
- No changes to `puzzle-size.ts` or its test — `sizeFor` lives in the
  new module and reads `dimensionsFor`.
- No changes to `NewPuzzleButton` or its `data-ready` wrapper.
- No empty state. With a shared test database there is never an empty
  list to test against, and an untested empty state is worse than none.
- No sorting or filtering controls.
- No mobile work.
- No new tokens.

## Acceptance examples

**L3-1 — grouping (Vitest, `src/lib/puzzle-groups.test.ts`)**
- `sizeFor` maps each standard size's dimensions to that size, and
  returns null for a 3×3 and for a non-square grid.
- Groups come back smallest to largest, with Other last and empty groups
  omitted.
- Each group carries its label and its dimensions string; Other has no
  dimensions.
- Within a group, an unpublished puzzle comes before a published one
  even when the published one is newer.
- Within the same status, most recently updated comes first.
- Extra fields on each puzzle survive grouping, and the input is not
  mutated.

**L3-2 — the page (Playwright, `e2e/puzzle-groups.spec.ts`)**
- A 5×5 puzzle appears inside the Mini group and a 15×15 inside Daily,
  each group headed by its label and dimensions.
- The Mini group comes before the Daily group on the page.
- A 3×3 appears in the Other sizes group.
- Within a group, a puzzle still being built appears above a published
  one, even when the published one was updated more recently.
- Each row's thumbnail has one cell per grid cell, and exactly the
  puzzle's black cells are black.
- The Edit link sits close to its title — within the content column, not
  across the window.

## Definition of done

1. `npx vitest run src/lib/puzzle-groups.test.ts` passes.
2. `e2e/puzzle-groups.spec.ts` passes: `npm run test:e2e`.
3. `e2e/puzzle-list.spec.ts`, `e2e/puzzle-list-layout.spec.ts`,
   `e2e/typography.spec.ts` and `e2e/controls.spec.ts` pass
   **unmodified**. They cover the row's attributes, shape, type scale
   and affordances, and this story restyles all four. If one fails, the
   implementation is wrong, not the spec — stop and report it.
4. Every other spec passes unmodified. Check this rather than assuming
   it.
5. `tsc --noEmit` is clean across the repo.
6. Lint is clean.
7. `npm run verify` exits 0.

Write the implementation to make the provided tests green. Do not edit
the tests to match your implementation — the tests are the
specification.
