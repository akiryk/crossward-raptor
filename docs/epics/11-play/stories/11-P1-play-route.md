# Story P1 — A play route

Give a signed-in player a read-only view of a published puzzle, with their own
entries and numbered clues. Actually opening the screen starts their session;
loading or prefetching its server response does not.

**Status:** independently reviewed; frozen with the acceptance baseline in
the specification-only commit containing this revision. Implementation pending.
**Blast radius: high:** Prisma schema/migration and puzzle Server Actions.

## Decisions

Inspected on 2026-10-18: `PuzzleGrid` and its cell/appearance helpers;
`grid`, `numbering`, `slots`, and `cursor` engine modules; Prisma schema and
serialization; middleware, `requireSession`, puzzle actions and editor route;
Ownership's frozen contracts; PB3's private/unlisted decision. Ownership is
closed. No Play runtime or schema exists at this specification checkpoint.

The user confirmed these product choices on 2026-10-18:

- Opening the mounted play screen counts as starting, even with no letters.
  A server GET or background prefetch does not. An opened empty puzzle will
  therefore count as in progress when P5 adds library cues.
- Include static numbered Across and Down clues in P1.
- Deleting a puzzle also deletes its sessions. Preserve the builder's existing
  ability to delete a published puzzle; another player's progress does not
  introduce a deletion prohibition.

### Route and access

- `/puzzles/{id}/play` is distinct from `/puzzles/{id}`, the owner-only editor.
  Any signed-in user can play any published puzzle, including their own.
- `publishedAt !== null` determines publication eligibility. Both `public`
  and `private` are playable by URL. PB3 already defines private as unlisted;
  it does not mean owner-only. Do not filter or otherwise change the library.
- Missing and unpublished puzzles use the existing `puzzle-not-found` page,
  including an owner's draft and a draft with an existing session. An existing
  session cannot grant access to an unpublished puzzle.
- Both play operations validate the actual Better Auth session through
  `requireSession()` before puzzle/session database access. Absent, fabricated,
  expired, or revoked sessions redirect to `/`. Middleware's cookie-presence
  check is insufficient. The session user's ID is the only player identity;
  never accept a player ID from the client.
- Keep the editor loader, ownership enforcement, publication controls and
  existing puzzle write contracts unchanged.

### Session lifecycle and schema

Add `PlaySession`, distinct from Better Auth's `Session`, with:

| Field | Contract |
| --- | --- |
| `id` | String primary key, generated with `cuid()` |
| `userId` | Required relation to User; cascade on user deletion |
| `puzzleId` | Required relation to Puzzle; cascade on puzzle deletion |
| `entries` | Required JSON using the existing `SerializedGrid` format |
| `startedAt` | Required timestamp, default now; set only on creation |
| `completedAt` | Nullable timestamp, initially null; P3 writes completion |

Enforce a database unique constraint on `(userId, puzzleId)`. Add reverse
relations to User and Puzzle. The migration is additive: no backfill, puzzle
or auth rewrites, timestamp changes, or data deletion. Preserve every existing
row. This task specifies the migration; it does not apply it to any database.

The server loader is read-only. Without a row it returns a transient entries
grid made by clearing every active answer cell to null, keeping dimensions
and black cells exactly. With a row it returns that player's saved entries,
including wrong guesses, multi-character entries and blanks, unchanged.

On browser mount, call the authenticated start operation with the puzzle ID.
It independently checks publication and loads or creates the session. A new
row stores the cleared grid, never the solution or another player's entries.
Repeated mounts, reloads, concurrent first opens and retries converge on one
row per pair. Preserve the winner's ID, entries, `startedAt`, and `completedAt`;
opening is never a reset, progress save or completion operation. A unique
constraint alone is insufficient if a concurrent loser reaches the player as
an error: use a conflict-safe operation and return the existing winner.

The normal browser result must use the start operation's returned view, so a
concurrent winner is not overwritten by a stale blank loader result. Mark the
view ready only after this succeeds. On failure, keep the view read-only,
show a start failure and a Retry control; do not present session creation as
successful. Retry repeats the same idempotent operation. Detailed wording is
not prescribed. Missing/draft targets reject without creating a row.

Unpublishing/editing/republishing while play is open, and session geometry
after a builder edits a previously published puzzle, remain the epic's
deferred lifecycle question. P1 rechecks access on every loader/start call;
it adds no publication lock, polling, snapshot, migration or automatic reset
for those later transitions. Do not claim a race guarantee against a
simultaneous unpublish. Ordinary concurrent opens are in scope.

### Fixed geometry, numbering and player content

- Use the published grid's dimensions and active/black pattern as the fixed
  entries geometry. Existing `clearLetters` and grid serialization suffice.
  Do not introduce a new stored numbering or correctness flag.
- Reuse `PuzzleGrid` and its cell leaves with an explicit `play` mode.
  In that mode derive numbers from active/black geometry directly. Empty and
  wrong entries cannot change numbering or turn active cells black.
- Active play cells are white whether empty or filled; black cells stay
  black. Suppress construction symmetry, required/recommended and editing
  warnings. Preserve existing build/preview/hints appearances and their
  intentional conversion of builder empties when calculating numbering.
- Send only player entries, title, clues and session metadata to the play
  client. Keep answer letters on the server, including in initial HTML/RSC
  props and action responses. This applies to the play path; it does not
  redesign the builder's authorized answer access.
- Show the title as text. Show visibly headed Across and Down lists in engine numbering
  order, with the stored clue text and number for each slot. Shared starts
  use the same number in both lists and on the grid. No answer labels,
  answer strings, editable clue inputs or builder controls. The existing
  `HintsPanel` displays answers and is unsuitable as a play clue list.
- P1 installs no grid typing, deletion, cursor navigation or save handler.
  Existing cursor functions already accept an entries grid; P2 will wire
  them without changing engine semantics. Do not add placeholder input code.

## Server contract

Add the following exports to `src/app/puzzles/actions.ts`:

```ts
interface PlayPuzzleView {
  id: string;
  title: string;
  entries: SerializedGrid;
  hints: Record<string, string>;
  session: {
    id: string;
    startedAt: Date;
    completedAt: Date | null;
  } | null;
}

loadPlayPuzzle(id: string): Promise<PlayPuzzleView | null>;
startPlaySession(id: string): Promise<PlayPuzzleView>;
```

The loader returns null for missing/draft targets. Start rejects them. Auth
failure follows `requireSession`'s redirect contract. Returned objects contain
exactly the above data, with no solution grid or other session's metadata.
Database errors propagate rather than fabricating a successful start. Do not
fix the implementation to one Prisma query spelling: preserve these behaviors
and demonstrate actual database uniqueness/concurrent-open success.

## Markup contract

- `play-puzzle`: screen root, `data-session-state="starting|ready|error"`.
- `play-title`: visible, static puzzle title.
- Shared `puzzle-grid`, `grid-cell`, `cell-number` hooks remain in use;
  `data-grid-mode="play"`, `data-coord="col,row"`, and cell kinds describe
  the actual player grid.
- `play-clues`: static clue area; `play-clue-column` identifies each list
  with `data-orientation="across|down"`; `play-clue` has
  `data-clue-key="{number}-{across|down}"` and visible number and clue text.
- Keep the inherited global header/library navigation. No library Play link
  is added until P5; use a direct URL for P1.

## Acceptance examples

Use this small synthetic published fixture to expose numbering mistakes:

```text
Answers     First open     Existing player entries
C A T       _ _ _          Z QU _
A # A       _ # _          _ #  _
T E N       _ _ _          M _  _
```

All three have precisely these cell numbers: `1` at `(0,0)`, `2` at `(2,0)`,
`3` at `(0,2)`. All other active cells are unnumbered. Across clues are 1 and
3; Down clues are 1 and 2. These expected values are literal test examples,
not calculated by the numbering implementation under test.

Frozen automated acceptance covers:

1. Trusted authentication before data access; own/foreign and public/private
   published access; missing/draft refusal, even with an existing session.
2. Read-only loading/HTTP GET creates no session, while a mounted successful
   visit creates one with exact cleared geometry and server-derived identity.
3. Repeat opens preserve entries and timestamps; users and puzzles are
   isolated. Concurrent first browser opens both succeed with exactly one
   persisted row, including its original start timestamp.
4. Fresh blanks and seeded wrong/multi-character entries display with the
   literal numbering above. Blank cells are white; black cells remain black.
   Construction warnings are absent, including for a short-slot fixture.
5. Static title and numbered clues omit answers and builder editing controls;
   the play response and client data contain no answer grid. Passive visits
   do not mutate puzzle fields/timestamps or existing entries/completion.
6. Database uniqueness and cascading puzzle deletion operate on synthetic
   test rows, preserving an unrelated puzzle/session. Unit mocks alone do
   not prove database constraints.

At the P1 implementation checkpoint, manually demonstrate that typing,
Backspace/Delete, arrow keys and cell clicks cannot edit entries or the
puzzle; demonstrate a failed start and successful retry. Record the result.
Do not freeze a permanent assertion forbidding player typing: P2 deliberately
adds it. Likewise P1's tests must not prohibit P3/P4's completion/reset UI.
Passive-view invariants and the prohibition on builder editing remain valid.

## Repo paths

Acceptance files supplied before implementation, immutable after the freeze:

- `src/app/puzzles/actions.play-route.test.ts` — **already provided; frozen**.
- `e2e/play-route.spec.ts` — **already provided; frozen**.

Expected implementation paths:

- `prisma/schema.prisma` and one additive `prisma/migrations/**/migration.sql`.
- `src/app/puzzles/actions.ts` — scoped play read/start exports and view type.
- `src/app/puzzles/[id]/play/page.tsx` — new authenticated server route.
- `src/components/play/**` — new play view/mount lifecycle/static clues.
- `src/components/grid/PuzzleGrid.tsx`, `src/lib/cell-appearance.ts` — shared
  play rendering mode; existing modes retain their contracts.
- `e2e/helpers/play-route.ts` — **editable fixture plumbing**, supplied with
  acceptance; validates the isolated test target. It is not frozen acceptance.
- `scripts/reset-test-db.mjs` — only if the additive relations require fixture
  cleanup changes; cascade should preserve the current puzzle-first order.
- This story, parent epic and `HANDOFF.md` — specification/delivery evidence.

Reference existing `src/engine/{grid,numbering,slots,cursor}.ts`,
`src/lib/{puzzle-storage,cell-number-lookup}.ts`, `src/lib/require-session.ts`,
and the inherited not-found route. No engine or serialization format change
is required. Declare any additional runtime path needed before broadening
implementation; do not opportunistically change adjacent code.

## Scope discipline

No typing/autosave/navigation integration (P2), completion detection/feedback/
locking (P3), reset (P4), library Play links/state/sorting/filtering (P5),
unpublish protection, answer-checking tools, timer, mobile layout, invitations,
or auth redesign. No existing-data deletion or live migration is authorized
by this specification task. Later migration application/deployment requires
the repository's reviewed, explicitly authorized operation; do not replay old
migrations or touch `.env*`, inbox messages, or production data.

## Definition of done

- Story and new acceptance independently reviewed together and frozen in a
  specification-only commit on main before runtime edits.
- On the implementation branch, acceptance passes; `npm run verify` exits 0
  and ordinary `npm run test:e2e` exits 0 after authorization for its isolated
  test-data reset. Serialize browser suites sharing that database.
- Record the manual P1-only input/start-failure demonstrations above and
  confirm every pre-existing and newly frozen acceptance file is unchanged.
- Verify additive schema constraints and preservation with isolated synthetic
  data; no destructive reset is a production migration strategy.
- Update the Play handoff with actual evidence; deliver through a PR and
  independent review/merge under `docs/CODE-REVIEW.md`. Do not begin P2 merely
  because P1 specification was authorized.
