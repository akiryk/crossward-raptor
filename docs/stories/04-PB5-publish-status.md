# Story PB5 — Published status in the list

Final slice of the publishing epic. The builder's list shows which puzzles
are published, when, and whether they're private or public.

Repo paths:
- `src/lib/puzzle-status.ts` — new
- `src/lib/puzzle-status.test.ts` — Vitest acceptance tests (**already
  provided — do not edit**)
- `src/app/puzzles/actions.ts` — edited: `listPuzzles` returns
  `publishedAt` and `visibility`
- `src/app/puzzles/page.tsx` — edited: renders the status
- `e2e/publish-status.spec.ts` — Playwright acceptance tests (**already
  provided — do not edit**)

**High blast radius** — `actions.ts`. Branch and PR.

## Required contract

```ts
// src/lib/puzzle-status.ts
import type { Phase } from '../engine/puzzle';

export type Visibility = 'private' | 'public';
export type StatusKind = 'grid' | 'hints' | 'published';

export interface PuzzleStatus {
  readonly kind: StatusKind;
  /** What the builder reads, e.g. "Published — private". */
  readonly label: string;
}

export function puzzleStatus(args: {
  phase: Phase;
  hintsComplete: boolean;
  publishedAt: Date | null;
  visibility: Visibility;
}): PuzzleStatus;
```

`listPuzzles`'s returned rows gain `publishedAt: Date | null` and
`visibility: Visibility`.

## Decisions

**Published outranks phase.** A published puzzle reads as published, not as
"Hints — complete". Phase describes where a puzzle is in authoring;
publishing is what happened at the end of it, and it's the more useful fact
at a glance.

**Display logic moves out of the page into a pure function.** Story M3 put
the phase-aware status inline in `page.tsx`, which was fine with two
branches. With publishing it has four, and branching that decides what a
builder reads is worth testing. `puzzleStatus` takes the same inputs the
row already has.

**`summarizePuzzle` is unchanged.** It derives phase and hint completeness
from the stored JSON; `publishedAt` and `visibility` are columns on the
row, not inside that JSON. Widening it would mean passing it data it
doesn't need.

**The publish date is shown, the publish time isn't.** Same treatment as
the updated date M3 added — an absolute date, formatted server-side to
avoid a hydration mismatch, with the raw value in a data attribute so tests
assert on something stable rather than locale-dependent text.

**Sorting stays most-recently-updated first.** Publishing doesn't reorder
the list. Grouping published puzzles separately is a plausible future
preference, not something to decide here.

**Visibility still filters nothing.** No solver-facing list exists yet, so
private versus public is displayed and stored and nothing more — as PB3
recorded. The browse view that respects it belongs to the play epic.

## Markup contract

Each `puzzle-list-item` gains:

- `data-published="true" | "false"`
- `data-visibility="private" | "public"`
- `data-published-at` — the ISO timestamp, present only when published
- Visible text carrying the status label, and a formatted publish date when
  published

M3's existing attributes — `data-phase`, `data-hints-complete`,
`data-updated-at` — are unchanged.

## Scope discipline

- **No filtering, sorting, or grouping by published state.**
- **No solver-facing browse list.** Play epic.
- **No changes to publishing, unpublishing, or the read-only lock.**
- **No changes to `summarizePuzzle` or its tests.**
- **No changes to `src/engine/`.**

## Acceptance examples

**PB5-1 — `puzzleStatus` (Vitest)**
- Grid phase, unpublished → kind `'grid'`.
- Hints phase, unpublished, hints incomplete → kind `'hints'`, label
  mentioning incompleteness.
- Hints phase, unpublished, hints complete → kind `'hints'`, label
  mentioning completeness.
- Published and private → kind `'published'`, label mentioning private.
- Published and public → kind `'published'`, label mentioning public.
- Published outranks phase: a published puzzle in hints phase with
  incomplete hints still reports `'published'`.
- Every label is non-empty.
- Purity: two calls with the same input are deep-equal.

**PB5-2 — the list (Playwright)**
- An unpublished puzzle's row reports `data-published="false"` and has no
  `data-published-at`.
- After publishing it privately, its row reports `data-published="true"`,
  `data-visibility="private"`, a parseable `data-published-at`, and visible
  text naming it as published and private.
- After publishing publicly, the row reports
  `data-visibility="public"` and says so.
- After unpublishing, the row returns to `data-published="false"` with no
  `data-published-at`.
- M3's `data-phase`, `data-hints-complete` and `data-updated-at` are still
  present and correct on every row.

## Definition of done

1. `npx vitest run src/lib/puzzle-status.test.ts` passes (covered by
   `npm run verify`).
2. `e2e/publish-status.spec.ts` passes.
3. Every other spec passes unmodified, `puzzle-list.spec.ts` included.
   **Check rather than assume** — that spec asserts on the very row markup
   this story changes.
4. `tsc --noEmit` is clean across the repo.
5. Lint is clean.
6. `npm run verify` exits 0.
7. Opened as a PR, not merged.

Write the implementation to make the provided tests green. Do not edit the
tests to match your implementation — the tests are the specification.
