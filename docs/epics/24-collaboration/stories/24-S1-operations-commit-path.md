# Story S1 — Operations and the commit path

The server learns to commit semantic operations: a per-puzzle `version`
advanced by exactly one per accepted operation under compare-and-swap, a
reset epoch, an operation log with unique `opId`s, pure validation and
application of the content kinds (`cells`, `hint`, `title`) in
`src/lib/collab/`, and a commit path (a server action plus a keepalive
route handler). Snapshot saves are fenced to puzzles still at version 0.
Nothing a builder sees changes: until S3 only tests commit operations.

**Status: approved and frozen 2026-11-12** by the orchestrating agent under
the human's delegation of every story's approval and freeze in this epic
([HANDOFF](../HANDOFF.md)). The baseline is the specification-only commit
on `epic/24-collaboration` that adds this file ("24-S1: freeze …"); its
hash is recorded in the handoff.

**Blast radius: risk story.** `prisma/**` (a migration),
`src/app/puzzles/actions.ts`, a new authenticated route handler and the new
`src/lib/collab/**`. Branch `story/24-S1-operations-commit-path` from the
baseline, a PR into `epic/24-collaboration` and independent review
([CODE-REVIEW](../../../CODE-REVIEW.md)). The migration must be applied to
production (by the human) before the epic merges to `main`.

## The human's request

[EPIC](../EPIC.md), Stories item 1, "Retiring snapshot saves", "Multi-user
testing" (S1's rows), Decisions ("Implementation details": Operations, The
commit path, The operation log) and Invariants 1–8, 11–13.

## What the code does today

`epic/24-collaboration` at 0bb0224 (= `main`).

- `Puzzle` has no version or epoch. Saves (`saveGrid`, `saveHints`,
  `saveTitle`) write whole snapshots through `updateUnlessPublished`
  (`WHERE id, builderId, publishedAt: null`); `enterHints` writes through
  it too; `publishPuzzle` writes with `WHERE eligible + hints equal`.
- Locks are stored in the grid JSON (`lockedWords`), enforced only by the
  client (`isCellProtected`).
- There are no database-backed unit tests: action tests mock Prisma with
  in-memory stores. The migration proofs (`scripts/check-*-migration.mjs`)
  run in random schemas of the validated local test database.
- 23-S3-U7 (`src/app/route-guard-source.test.ts`) pins Better Auth's as
  the only route handler and the database client's importers.

## Decisions

From the EPIC (not restated): the kinds, the envelope, D1, D3, the Hints
rules, the commit path's shape, the log's purpose, the fence.

Drafting decisions (routine, made under the delegation):

1. **Schema.** `Puzzle.version Int @default(0)`, `Puzzle.resetEpoch Int
   @default(0)` and `PuzzleOperation`: `puzzleId` (cascade with the
   puzzle), `opId` (unique), `userId` (nullable, set null if the account is
   deleted, so others' catch-up keeps its versions), `clientId`, `epoch`,
   `baseVersion`, `status` (`accepted`/`refused`), `code` (a refusal's),
   `version` (an accepted one's; unique per puzzle), `operation` (the body,
   no envelope), `previous` (the replaced values) and `createdAt`; indexed
   by `(puzzleId, createdAt)`. Migration
   `20261112120000_add_puzzle_operations`: two constant-default columns (no
   rewrite, no `UPDATE`, `updatedAt` preserved) and a new table.
2. **Pure modules.** `src/lib/collab/operation.ts` (`parseOperation`: shape
   only, a fresh copy with known fields), `apply.ts` (`validateOperation`,
   `applyOperation`, `evaluateOperation` over `PuzzleState`: the stored
   grid JSON, hints, title, phase, `resetEpoch`, `published`), `access.ts`
   (`editableBy(userId)`, the one predicate; owner-only `{ builderId }`
   now, wrapped in `AND` so S5 widens it in one place). The engine is
   unchanged. `commit.ts` is the database side: it takes the Prisma client
   as a parameter and is not pure.
3. **Input limits** (shape, refused as `invalid`, not recorded): `opId`,
   `puzzleId`, `clientId` 1–100 of `[A-Za-z0-9_-]`; `epoch` and
   `baseVersion` non-negative integers; a burst 1–1024 writes, each cell
   once, a value `null` or `^[A-Z0-9]{1,10}$` (the editor's letters and
   `rebusText`); a hint key `<n>-across|down`, text ≤ 2000; a title ≤ 500,
   normalized as `saveTitle` does. Generous; S3 may add matching input
   limits.
4. **Rules against the current state**, in order: `published`, then
   `epoch` (any other epoch), then kind rules: a cell outside the grid, or
   black in Build, is `invalid`; in Hints a burst writing a black cell or
   clearing any cell is `phase`; a burst that would *change* a protected
   cell (a locked word's letter or end cell, `isCellProtected`) is `locked`
   — writing the value a cell already holds is not a change; a hint is
   `phase` in Build and `invalid` for a key the grid doesn't number; a
   title fits any phase. Every refusal is whole. The base version never
   refuses (but see 6).
5. **Outcomes.** `accepted` (`opId`, `version`), `refused` (`opId`,
   `code`), `busy` (lost every race; nothing written; resend the same
   `opId`), `invalid` (malformed, or an `opId` already used for another
   puzzle or account), `not-found` (no puzzle the caller can edit). Codes:
   `published`, `epoch`, `phase`, `locked`, `invalid`, `expired`; S3 words
   them. **Refusals are recorded** in the log (status `refused`, no
   version), so a resend returns the first outcome even once the operation
   would fit (Invariant 2). Authorization, malformed input and `busy` are
   not recorded.
6. **Expiry.** Deduplication can only cover what the log keeps. An
   operation made against a version older than the oldest kept accepted
   record minus one (`baseVersion < oldest − 1`) could have been committed
   and pruned, so it is refused as `expired` (the EPIC's "a client behind
   the window reloads the snapshot"). This is about retention, not
   conflicts. With no accepted record kept, nothing was ever pruned.
7. **Commit order.** Authorize (`findFirst` with `editableBy`) → known
   `opId`? return its outcome → validate (+ expiry) → refusal: record it →
   apply purely → one transaction: `updateMany WHERE id, version (read),
   resetEpoch (op's), publishedAt null, AND editableBy` setting the
   changed field and `version + 1`; no row → lost race; create the log
   record; prune. A lost race or a unique `opId` collision re-runs from the
   read (a collision first returns the recorded outcome). **5 attempts**:
   with n concurrent commits one loses at most n − 1 races. Default
   isolation (read committed) suffices: the compare-and-swap re-checks
   after the row lock.
8. **Pruning** in the commit's transaction (and after a refusal): keep the
   last **500** accepted records per puzzle, and nothing older than
   **24 h** except the newest accepted record. Both are the EPIC's starting
   values, overridable per call (with the commit time) for tests.
9. **Entries.** `commitOperation(input)` in `actions.ts`: `requireSession`,
   then the commit as the session's account (never the input's). The
   keepalive route `POST /api/puzzles/[id]/operations` only parses the body
   (≤ 200 000 characters, JSON, `puzzleId` equal to the path's, otherwise
   passes null) and calls `commitOperation`, so the gate is the action's
   (no session or no username is sent to `/`) and the database client stays
   imported only by the action modules. Status 400 for `invalid`, 404 for
   `not-found`, else 200 with the outcome. S4 adds the catch-up read there.
10. **The fence**: `SNAPSHOT_FENCE = { version: 0 }` spread into
    `updateUnlessPublished`'s WHERE (`saveGrid`, `saveHints`, `saveTitle`,
    `enterHints`) and `publishPuzzle`'s. `setPuzzleVisibility`,
    `duplicatePuzzle` and `deletePuzzle` aren't snapshot writes and stay
    as they are.
11. **Database tests** run with the unit tests (`*.db.test.ts`, inside
    `npm run verify`). `src/test-support/database.ts` creates a random
    `vitest_*` schema in the validated local test target
    (`scripts/e2e-env.mjs`), applies every migration's SQL and gives a
    Prisma client confined to it (`PrismaPg`'s `schema`), then drops it.
    Public tables are never touched, so no reset is needed and browser runs
    aren't disturbed. `verify` therefore needs the Docker test database
    (`npm run db:up`); a clear error says so. Recorded in DEVELOPMENT.
12. **Risk paths**: CODE-REVIEW gains `src/lib/collab/**` and
    `src/app/api/puzzles/[id]/operations/**`.

## Non-goals

- Any editor change; S3 sends operations. The snapshot actions stay.
- `lock`, `unlock`, `enterHints`, `startOver` operations and publishing
  pinned to a version (S2). Nothing increments `resetEpoch` yet.
- Catch-up reads, polling, presence, conflict notes (S4, S7).
- Collaborators (S5): `editableBy` is owner-only.
- Production migration (the human's, before the epic merges to `main`).

## Acceptance (frozen)

New files; IDs in `describe` names. `*.db.test.ts` run against the local
test database as decision 11 describes.

### `src/lib/collab/operation.test.ts`

1. **24-S1-1 parsing:** each kind accepted with only known fields, a copy,
   input unchanged; 29 malformed shapes refused; the limits themselves
   accepted.

### `src/lib/collab/apply.test.ts`

2. **24-S1-2 a burst writes only its cells:** other cells, locks, hints and
   title kept; previous values in write order; idempotent; frozen input.
3. **24-S1-3 locks (D3):** changing or clearing a locked letter, writing
   its end cell, or any burst including one → `locked`, whole; the same
   value on a locked cell is no change; no locks, no refusal.
4. **24-S1-4 Hints:** letters and rebus change; clearing or a black cell →
   `phase`, whole; hints written with previous text (null when missing);
   an unnumbered key → `invalid`; a hint in Build → `phase`.
5. **24-S1-5 publication and epoch:** every kind `published`; an older or
   newer epoch → `epoch`, even into untouched cells; the base version
   never refuses.
6. **24-S1-6:** outside the grid and black-in-Build → `invalid`; the title
   normalized in either phase, previous recorded.

### `src/lib/collab/convergence.test.ts`

7. **24-S1-7 convergence (randomized, 300 seeds, Build with a lock and
   Hints):** three tabs' operations committed in random interleavings.
   Replaying the accepted operations from any version's state reaches the
   server state; each cell holds the last accepted write in commit order
   (or its original), so compatible edits all survive; the title likewise;
   evaluation never mutates; refused bursts change nothing; both
   acceptance and refusal are exercised.

### `src/lib/collab/commit.db.test.ts`

8. **24-S1-8 a commit:** version 0 → 1, cells written, locks kept, the log
   record's every field; hints and titles each advance one version with
   their previous values; another builder's puzzle and a missing one →
   `not-found`, malformed → `invalid`, nothing written or logged.
9. **24-S1-9 exactly once:** a resend returns its first acceptance after
   later commits and after publication; a recorded refusal is returned even
   once the lock is gone; five concurrent resends commit once and all
   answer the same; an `opId` reused for another puzzle → `invalid`.
10. **24-S1-10 one transaction:** a failing log write leaves the puzzle row
    unchanged.
11. **24-S1-11 bounded retry:** two racing commits after the read, then
    success with both kept and contiguous log versions; a racing writer
    with no log record (the compare-and-swap itself); racing forever →
    `busy` within `MAX_ATTEMPTS` (3–10) reads, nothing of its own written,
    committing later on resend; five concurrent bursts → versions 1–5, all
    cells.
12. **24-S1-12 interleaved bursts:** MASKS then MAG (made against version
    0) → MAGKS; the other order → MASKS; compatible bursts against the
    same version both survive.
13. **24-S1-13 current-state rules:** a burst into a lock refused whole and
    recorded, a same-value one accepted; the Hints rules; a hint in Build;
    everything refused once published, and when published between read and
    write; another epoch refused (and one changed between read and write),
    the right one accepted.
14. **24-S1-14 pruning:** by count (`retainCount` 3 → versions 3–5); by
    age, refusals included, always keeping the newest accepted record;
    `expired` below the kept window, the same on resend, and acceptance at
    its edge.

### `src/lib/collab/migration.db.test.ts`

15. **24-S1-15 the migration** is the newest; applied to synthetic rows it
    preserves every puzzle, user and play-session row (timestamps
    included), adds version 0 and epoch 0 and an empty log; the log's
    unique `opId` and `(puzzleId, version)`, null user on account deletion,
    cascade with its puzzle.

### `src/app/puzzles/actions.snapshot-fence.db.test.ts`

16. **24-S1-16 the fence:** `saveGrid`, `saveHints`, `saveTitle`,
    `enterHints` and `publishPuzzle` write a version-0 puzzle as today;
    after one committed operation each throws and the row is unchanged
    (every column); any version past 0 likewise.

### `src/app/api/puzzles/[id]/operations/route.db.test.ts`

17. **24-S1-17 the action** commits as the session account (an input
    `userId` ignored); another builder's puzzle → `not-found`; no session
    or no username → refused before writing.
18. **24-S1-18 the route** answers outcomes (the same on resend, a refusal
    with its code); no usable session → the action's redirect to `/`,
    nothing written; malformed, wrong-puzzle, empty or oversized bodies →
    400; another builder's puzzle → 404.

### Support (frozen with the acceptance)

`src/test-support/database.ts` (decision 11).

### Amended acceptance

Required by the EPIC's approved decisions; each keeps its intent and
carries a note citing 24-S1.

- `src/app/puzzles/actions.builder-edits.test.ts` (O3) and
  `actions.publish-hints.test.ts` (14-S4-9): their in-memory stores model
  the puzzle row, which now has `version`; the fixture rows gain
  `version: 0` (the stored default). No assertion changes. Without it the
  fence's `version: 0` matches none of their rows (11 cases fail).
- `src/app/route-guard-source.test.ts` (23-S3-U7): the EPIC requires a
  keepalive route handler. "The only route handler is Better Auth's"
  becomes those two, and the commit route may import only `next/server`
  and `commitOperation` from the checked action module, which it must
  call. The other guard cases, including the database client's importers,
  are unchanged.

### Discrimination

2026-11-12, with a prototype of the decisions above (set aside until the
freeze). `npx vitest run` of the acceptance against the prototype with one
rule removed at a time; each line fails at least one case:

- fence removed: 6 failed; lock check: 9; Hints clear rule: 2; epoch
  check: 4; publication check: 5; no retry: 4; `MAX_ATTEMPTS` 50: 1; no
  deduplication: 6; no `version` in the CAS: 1; no `publishedAt` in the
  CAS: 1; no epoch in the CAS: 1; no pruning: 3; no expiry: 1; refusals
  not recorded: 3; account from the input: 1; route without the path
  check: 1.
- Without the runtime (the baseline): every new file fails to import its
  module or the schema's `version`; the amended 23-S3-U7 fails (one route
  handler). The amended O3/14-S4-9 fixtures pass both with and without the
  runtime.
- With the prototype: `npm run verify` exited 0 (1078 tests).

## Repo paths

Acceptance: the files above. Runtime: `prisma/schema.prisma`,
`prisma/migrations/20261112120000_add_puzzle_operations/migration.sql`,
`src/lib/collab/{operation,apply,access,commit}.ts`,
`src/app/puzzles/actions.ts`, `src/app/api/puzzles/[id]/operations/route.ts`.
Docs: this story, `../EPIC.md`, `../HANDOFF.md`, `../../README.md`,
`docs/CODE-REVIEW.md` (risk paths), `docs/DEVELOPMENT.md` (database tests).

## Definition of done

- Frozen acceptance unchanged after the freeze.
- `npm run verify` exits 0 and the full `npm run test:e2e` exits 0 (the
  fence touches the editor's save path).
- The migration applied only to local databases (development, test).
- A PR into `epic/24-collaboration`, independently reviewed and merged by
  the reviewer; the handoff records observed results. The migration
  reaches production, by the human, before the epic merges to `main`.
