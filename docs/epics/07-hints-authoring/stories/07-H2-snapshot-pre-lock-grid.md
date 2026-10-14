# Story H2 — Snapshot the grid before locking it

Second slice of the hints-authoring epic, and the other half of what H1
started. Entering hints phase runs `convertEmptyCellsToBlack`, which
blackens every unfilled square. Afterward a black square the builder
chose deliberately is indistinguishable from one the conversion
produced, so the original grid is gone for good.

This story preserves it: one nullable column, written once at the
transition, read by nothing. It is insurance for a future "reopen the
grid, lose your clues" affordance — not a commitment to build one.

Repo paths:
- `prisma/schema.prisma` — edited: new nullable `gridBeforeHints` column
- `prisma/migrations/**` — new: the generated migration
- `src/app/puzzles/actions.ts` — edited: `enterHints` writes the
  snapshot
- `e2e/helpers/read-puzzle-row.ts` — new (**already provided — do not
  edit**): test-only read-back helper
- `e2e/enter-hints-snapshot.spec.ts` — new (**already provided — do not
  edit**)

## Required contract

```prisma
model Puzzle {
  // ... existing fields unchanged
  gridBeforeHints Json?
}
```

Nullable, with no default. Null means one of two things, and this story
deliberately does not distinguish them: the puzzle is still in grid
phase, or it transitioned before this column existed. Nothing reads the
column yet, so nothing needs to tell those apart.

```ts
// src/app/puzzles/actions.ts (edited)
export async function enterHints(
  id: string
): Promise<{ phase: Phase; hints: Record<string, string>; grid: SerializedGrid }>;
```

Signature and return value unchanged. The only change is that when the
loaded puzzle is in `'grid'` phase, the same `prisma.puzzle.update` also
writes `gridBeforeHints` with the serialized grid **as it was before**
`enterHintsPhase` ran.

## Decisions

**The snapshot is written only when the puzzle was actually in grid
phase.** `enterHintsPhase` returns the puzzle untouched if it is already
in hints phase, but `enterHints` writes unconditionally today. Without a
guard, a second call would store the already-converted grid over the
original — silently destroying the one thing this column exists to
protect, while leaving a non-null value that looks correct. So the
snapshot field is included in the update's `data` only when
`puzzle.phase === 'grid'`; otherwise the update proceeds exactly as it
does now and the existing value is left alone.

**One update, not two.** The snapshot goes into the same
`prisma.puzzle.update` call that already writes grid, hints, and phase,
so a puzzle can never end up converted-but-unsnapshotted or the reverse.

**The pre-conversion grid comes from the loaded puzzle, not from a
re-read.** `enterHints` already holds it in `puzzle.grid` before calling
`enterHintsPhase`; serializing that is exact and needs no extra query.

**`Json?`, matching the existing `grid` column.** Same shape, same
serializer, same `SerializedGrid` type. No new format to maintain.

**Nothing reads it, and no UI changes.** Resisting the temptation to add
a "restore" path now is the point — that decision needs its own story,
and this column has to exist first so the data is there when it's made.

## Scope discipline

- No changes to `enterHintsPhase` or anything in `src/engine/`.
- No changes to `loadPuzzle`, `PuzzleWithMeta`, `StoredPuzzle`,
  `serializePuzzle`, or `deserializePuzzle` — the snapshot is written
  and read as raw JSON at the Prisma layer only.
- No UI changes of any kind. No restore, no indicator, no button.
- No backfill for puzzles already in hints phase — their originals are
  already gone and inventing one would be worse than null.
- `seedPuzzle` is not modified; it keeps writing only the columns it
  writes today, leaving `gridBeforeHints` null.

## Acceptance examples

**H2-1 — the snapshot (Playwright,
`e2e/enter-hints-snapshot.spec.ts`)**
- A puzzle in grid phase has `gridBeforeHints` null before the
  transition.
- After confirming the transition, `gridBeforeHints` is non-null and has
  the same dimensions as the live grid.
- A cell that was empty-and-active before the transition is `black` in
  the live grid afterward, and still `active` in the snapshot — the
  assertion that the stored grid is genuinely the pre-conversion one and
  not a copy of the converted result.
- A cell the builder blackened before the transition is `black` in both.
- Letters present before the transition are present in the snapshot.

## Definition of done

1. `e2e/enter-hints-snapshot.spec.ts` passes: `npm run test:e2e`.
2. Every other spec passes unmodified, including
   `e2e/enter-hints.spec.ts` from H1. **Check this rather than assuming
   it.**
3. The migration applies cleanly to a database created from the previous
   schema — this is an additive nullable column, so existing rows need
   no backfill.
4. `tsc --noEmit` is clean across the repo.
5. Lint is clean.
6. `npm run verify` exits 0.

**Not covered by a test, by design:** the already-in-hints-phase guard.
`enterHints` is only reachable from the UI in grid phase, so the
double-call path cannot be driven from Playwright. It is a correctness
guard enforced by review, not by a spec — see Decisions. Do not add a
UI path to make it testable.

Write the implementation to make the provided tests green. Do not edit
the tests to match your implementation — the tests are the
specification.
