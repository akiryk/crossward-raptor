# Story S5 — Collaborator membership and authorization (server side)

A puzzle gains collaborators. The owner adds one by email: an address that
already has an account becomes a collaborator at once; any other address
is stored as an invitation, claimed when an account with that email next
loads a puzzle page, or expiring after 30 days. The owner removes
collaborators and revokes invitations. One "editable by" condition (the
owner or a collaborator) sits in the `WHERE` of every puzzle read and write
that needs it: the commit path, the catch-up read (its log read included),
the editor page, Duplicate and the owner-only actions. Start Over, Publish,
Delete, visibility and collaborator management are owner-only on the
server. A collaborator's editor opens the shared puzzle and hides Reset
Grid and Publish. An editor that loses access while open (removal,
deletion, publication) stops polling and sending, explains why, becomes
read-only and keeps the unsaved input copyable. A signed-out editor stops
too and reloads. The management dialog and the library's shared rows are
S6's.

**Status: approved and frozen 2026-11-13** by the agent under the human's
delegation of every story's approval and freeze in this epic
([HANDOFF](../HANDOFF.md)). The baseline is the specification-only commit
on `epic/24-collaboration` that adds this file ("24-S5: freeze …"); its
hash is recorded in the handoff.

**Blast radius: risk story.** `prisma/**` (a migration),
`src/lib/collab/**`, `src/app/puzzles/actions.ts`, the operations route's
callers and the editor's save path. Branch
`story/24-S5-collaborator-membership` from the baseline, a PR into
`epic/24-collaboration` and independent review. The migration must be
applied to production, by the human, before the epic merges to `main`.

## The human's request

[EPIC](../EPIC.md): Stories item 5; "Multi-user testing" (S5's cells: a
removed collaborator's operations and catch-up are refused; removal,
seeded, while Jay's editor is open); Decisions (the human's request 1;
D5, D6, D7; "Membership by account"; Implementation details:
"Invitations", "Losing access while editing", "Start Over", "The
library"); Invariants 5 and 10. Carried from the S4 review
([HANDOFF](../HANDOFF.md)):

- a test that the half-typed word is saved, as an operation of the state
  it was made in, before another tab's Start Over or Enter Hints is
  applied (`editor-saver.ts`, `caughtUp`);
- losing access while the editor is open stops the polling and the queue
  and makes the editor read-only (today a catch-up 400 is retried, and a
  lost session is retried every 15 s);
- the catch-up's log read is itself authorized by the one predicate.

## What the code does today

`epic/24-collaboration` at `5176189` (S4 merged, PR #42).

- `editableBy(userId)` and `ownedBy(userId)` (`src/lib/collab/access.ts`)
  are both `{ builderId }`. The commit path, the catch-up's puzzle reads
  and `publishPuzzleAt` use them; the commit path adds `ownedBy` to the
  compare-and-swap for Start Over.
- The catch-up's log read (`catchup.ts`, `puzzleOperation.findMany`) has
  only `puzzleId` and the versions in its `WHERE`; it relies on the puzzle
  read before it. A published puzzle is answered like any other, so an
  open editor never learns of a publication made elsewhere.
- `loadPuzzle`, `duplicatePuzzle`, `deletePuzzle` and
  `setPuzzleVisibility` (`src/app/puzzles/actions.ts`) repeat
  `builderId: session.user.id`.
- The editor (`EditorSaver`) stops polling on a catch-up `not-found`, but
  keeps its queue: every later operation is sent and refused one by one,
  and the editor stays editable. A catch-up 400 or a redirect (no session)
  is treated as a failure and retried, every 15 s at most.
- Browser tests sign in one seeded account (`e2e/auth.setup.ts`).

## Decisions

From the EPIC (not restated): one owner, any number of collaborators;
invitations by email, trimmed and lowercased, binding at once to an
existing account, otherwise claimed by the account whose current email
matches, expiring after 30 days; membership keyed by `User.id`, kept
across email and username changes; collaborators' equal authority over the
grid, hints and locks, Enter Hints included (D4); owner-only Start Over,
Publish, Delete and collaborator management; Duplicate open to
collaborators, the copy theirs alone (D6); losing access stops the queue,
explains, makes the editor read-only and keeps unsaved input copyable.

Drafting decisions (routine, made under the delegation):

1. **Schema** (migration `20261113120000_add_puzzle_collaborators`, additive:
   two new tables, no change to existing rows).
   - `PuzzleCollaborator`: `puzzleId`, `userId`, `createdAt`; primary key
     `(puzzleId, userId)`, indexed by `userId`; cascades with its puzzle
     and with its user.
   - `PuzzleInvitation`: `id`, `puzzleId`, `email` (normalized),
     `createdAt`, `expiresAt`; unique `(puzzleId, email)`, indexed by
     `email`; cascades with its puzzle.
   - A claimed invitation becomes a collaborator row and is deleted; a
     collaborator keeps no email (the owner never sees a later one).
2. **The predicate** (`access.ts`). `editableBy(userId)` is
   `{ OR: [{ builderId: userId }, { collaborators: { some: { userId } } }] }`,
   always placed inside `AND: [...]` (S1 decision 2). `ownedBy(userId)`
   stays `{ builderId: userId }`. An owner-only read or write carries both,
   `AND: [editableBy(userId), ownedBy(userId)]`. Where each goes:
   - the commit path: the authorizing read and the compare-and-swap,
     `editableBy`; Start Over also `ownedBy` (unchanged from S2);
   - the catch-up: both puzzle reads, and **the log read**, through its
     relation (`puzzle: { AND: [editableBy(userId)] }`), so a removal
     between the two reads returns nothing from the log (the answer is
     then the snapshot read's `not-found`);
   - `publishPuzzleAt`: both, read and write (unchanged);
   - `loadPuzzle` (the editor page) and `duplicatePuzzle`'s source read:
     `editableBy`;
   - `deletePuzzle` and `setPuzzleVisibility` (read and write): both;
   - membership: every owner read and every delete, both, through the
     puzzle relation. Inserts have no `WHERE`: the owner is checked in
     the same transaction, ownership never changes (no transfer exists),
     and a puzzle deleted meanwhile fails the insert's foreign key.
   - Unchanged: `listPuzzles` (S6), `createPuzzle` and the play actions
     (published puzzles, not editing).
3. **Owner-only on the server.** A collaborator's Start Over is refused
   `owner` and recorded (S2's code; S2 tested it purely). A collaborator's
   Publish, Delete, visibility change and every membership action answer
   as for a puzzle they can't see (`not-found`, or the action's existing
   error), and change nothing.
4. **Membership functions** (`src/lib/collab/membership.ts`, the database
   client passed in, as for `commit.ts`):
   - `normalizeEmail(input)`: trimmed and lowercased; one `@` with
     something on each side, no spaces, at most 254 characters; otherwise
     null.
   - `addCollaborator(db, ownerId, { puzzleId, email }, { now })`:
     `invalid` (malformed input or address); `not-found` (no puzzle the
     caller owns); `refused` with code `owner` (the owner's own address);
     `added` with `userId` and `username` (an account has the address:
     the membership is made, idempotently, and a pending invitation for
     the address on this puzzle is deleted); otherwise `invited` with the
     `email` and `expiresAt` (`now` + 30 days; inviting the same address
     again renews it). The account is matched case-insensitively.
   - `removeCollaborator(db, ownerId, { puzzleId, userId })` and
     `revokeInvitation(db, ownerId, { puzzleId, email })`: `removed` /
     `revoked` (also when already gone), `not-found` (not the owner), or
     `invalid`. Removing deletes only that membership.
   - `listCollaborators(db, ownerId, { puzzleId }, { now })`: `ok` with
     `collaborators` (`userId`, `username`, oldest first) and the
     unexpired `invitations` (`email`, `expiresAt`); `not-found`;
     `invalid`. No collaborator's email is returned.
   - `claimInvitations(db, { id, email }, { now })`: in one transaction,
     every unexpired invitation for the account's normalized current
     email becomes a membership (skipping duplicates, and the owner's own
     puzzles) and is deleted. Returns the number of memberships made.
     Expired invitations are left (not claimable; not listed; renewed by
     inviting again).
5. **Actions** (`actions.ts`, each `requireSession` first, as the session's
   account, never the input's): `addCollaborator(input)`,
   `removeCollaborator(input)`, `revokeInvitation(input)`,
   `listCollaborators(input)` and `claimInvitations()` (the session's
   email). S6 adds their UI.
6. **When invitations are claimed.** The EPIC says the first
   username-gated request from the matching account. Claiming on every
   request would add a query to every catch-up poll (one a second per
   editor). Instead the two pages a shared puzzle is reached from claim
   before reading: the editor page (`/puzzles/[id]`, before
   `loadPuzzle`) and the library (`/puzzles`, before `listPuzzles`). Every
   way to a shared puzzle passes one of them, so the result is the same.
   `listPuzzles` itself is unchanged (S6 shows shared rows).
7. **The editor page** (`loadPuzzle`) answers `isOwner`. For a
   collaborator the editor hides Reset Grid and, in Create Hints, the
   3 Publish button; everything else is the owner's editor (Enter Hints,
   locks, unlocking anyone's lock, hints, title). Someone neither owner
   nor collaborator gets the existing not-found page.
8. **The catch-up reports publication.** For a published puzzle the read
   answers `published`, with the puzzle as stored (`version`,
   `resetEpoch`, `content`) and `publishedAt` and `visibility`, whatever
   `since` is. `parseCatchUp` accepts it (`publishedAt` an ISO string or
   a date, read as a date). The route answers it with 200.
9. **Losing access while open** (`EditorSaver`). The editor loses access
   when:
   - the catch-up answers `not-found` (removal or deletion; they aren't
     told apart) or `invalid` (the route's 400, which the editor now reads
     rather than retrying), or a commit answers `not-found`: **removed**;
   - the catch-up answers `published`: **published** (the editor first
     shows the stored puzzle). A commit refused `published` stops the
     queue the same way and asks the catch-up at once, which brings the
     publication's details.

   Then, once: the poller stops; the queue halts (nothing more is sent, a
   waiting retry is called off, a late answer is ignored); every burst
   finalizes; and every pending operation, the half-typed word and the
   one the server just refused included, is dropped and explained as
   S3's refusals are ("Your DOG in 1-Across wasn't saved: this puzzle is
   no longer available." / "…: the puzzle was published."), its input
   kept to copy. The journal is emptied (the notes hold the input). A note
   explains the loss: first, for a removal; for a publication learned
   from a refused commit, once the catch-up has confirmed it:
   - removed: "This puzzle is no longer available to you: it was deleted,
     or you were removed from it. Nothing more can be saved here."
   - published: "This puzzle was published, so it can't be edited any
     more."

   `EditorSaver` reports it through `onAccessLost({ kind: 'removed' })` or
   `onAccessLost({ kind: 'published', publishedAt, visibility })`. The
   editor then becomes read-only: published, it shows the published state
   (as after publishing); removed, the step row reads "No longer
   available" (`data-testid="access-lost-state"`), and, as when published,
   the toggle row is empty, the grid takes no focus or keys, and the
   title and hints are disabled. Nothing reloads.
10. **The editor's own Publish** isn't a loss. `beginPublish()` before
    `publishAtVersion` and `endPublish(published)` after it: while it is
    in flight a `published` catch-up answer is ignored (polled again); once
    published, the poller stops and the queue halts with no note. An
    editor opened on a published puzzle (`published: true`) doesn't poll.
11. **A lost session.** A catch-up answered with a redirect (the session
    gate's, seen as `opaqueredirect` with `redirect: "manual"`) isn't
    retried. The poller stops, every burst finalizes into the journal, the
    queue halts without dropping anything, leaving doesn't warn, and
    `onSignedOut()` is called; the editor reloads the page, which the
    session gate sends to `/`. The journal re-sends the work at the next
    open (S3), as for a redirected commit.
12. **The draft before a remote reset** (carried from S4). Unchanged
    behavior, now tested: before another tab's Start Over or Enter Hints
    is applied, the half-typed word is sent as an operation of the state
    it was made in (its epoch and base version), so the server judges it
    (refused `epoch` after a reset) rather than it being rebased into the
    new state.
13. **A second seeded account for browser tests.** The setup project
    signs in a deterministic second user, "Jay"
    (`crossward-e2e-collaborator@example.test`, username `Jay`), and saves
    `e2e/.auth/collaborator.json`. Tests make Jay a collaborator by
    writing the membership row directly (S6 adds the way to invite), and
    remove, delete or publish directly too.

## Non-goals

- The "Collaborators…" dialog, the library's shared rows, the owner's
  username on them, Create filters counting editable puzzles and the
  collaborator's Duplicate-only row menu (S6). No library UI change.
- Presence, names in notes, the session panel, conflict outlines (S7).
- Sending invitation emails; a collaborator leaving on their own;
  transferring ownership; roles beyond owner and collaborator.
- Telling removal apart from deletion in the editor.
- Changing the commit path's rules, the log, the poller's timing or
  `publishAtVersion`'s checks beyond the predicate.
- Production migration (the human's, before the epic merges to `main`).

## Acceptance (frozen)

IDs in `describe` names. `*.db.test.ts` run against the local test
database in throwaway schemas (S1 decision 11).

### Database (`npm run verify`)

1. `src/lib/collab/membership.db.test.ts`
   - **24-S5-1 adding:** the address normalized; an existing account
     (any case) becomes a collaborator at once, idempotently, and its
     pending invitation goes; another address becomes an invitation
     expiring in 30 days, renewed when invited again; the owner's own
     address refused `owner`; malformed input and addresses `invalid`; a
     collaborator or stranger adding → `not-found`, nothing written.
   - **24-S5-2 claiming:** an invitation is claimed by the account whose
     current email matches (any case and spacing), once, becoming a
     membership and leaving the invitations; not by another address; not
     once expired; never on the owner's own puzzle; concurrent claims make
     one membership; a revoked invitation can't be claimed.
   - **24-S5-3 removing, revoking, listing:** only the owner; removing one
     collaborator leaves the others and the puzzle; removed or revoked
     twice is still `removed`/`revoked`; the list shows collaborators by
     username and unexpired invitations by email, never a collaborator's
     email, even after it changes; an email or username change keeps
     access.
2. `src/lib/collab/authority.db.test.ts`
   - **24-S5-4 the commit path:** a collaborator's cells, hint, title,
     lock, unlock (of the owner's lock) and Enter Hints are accepted; their
     Start Over refused `owner` and recorded; a stranger and a removed
     collaborator get `not-found` with nothing written or logged; removal
     between the authorizing read and the write → `not-found`, nothing
     written (the compare-and-swap's own `editableBy`); a Start Over by a
     non-owner whose read claimed ownership is never written (the
     compare-and-swap's own `ownedBy`).
   - **24-S5-5 the catch-up:** a collaborator catches up; a stranger and
     a removed collaborator get `not-found`; removal between the puzzle
     read and the log read returns no operation (the log read's own
     predicate); a published puzzle answers `published` with the stored
     puzzle, whatever `since` is.
   - **24-S5-6 publishing:** a collaborator's `publishPuzzleAt` →
     `not-found`, nothing published; a non-owner whose read claimed
     ownership publishes nothing (the write's own `ownedBy`).
3. `src/app/puzzles/actions.collaborators.db.test.ts`
   - **24-S5-7 the actions as the session account:** `loadPuzzle` for the
     owner (`isOwner` true), a collaborator (`isOwner` false), null for a
     stranger and a removed collaborator; `duplicatePuzzle` by a
     collaborator makes their own copy with no collaborators or
     invitations, the original untouched; a collaborator's
     `deletePuzzle` and `setPuzzleVisibility` throw and change nothing;
     the owner's delete takes the memberships and invitations with it; the
     membership actions act for the session's account (an input owner is
     ignored), refuse a collaborator, and `claimInvitations` claims by the
     session's email; `commitOperation` and `catchUpOperations` serve a
     collaborator.
4. `src/lib/collab/membership-migration.db.test.ts` — **24-S5-8 the
   migration** is the newest; applied to synthetic rows it preserves every
   puzzle, user, play session and operation (timestamps included) and
   adds two empty tables; one membership per account and puzzle, one
   invitation per address and puzzle; memberships go with their puzzle or
   user, invitations with their puzzle.

### Unit (`npm run verify`)

5. `src/components/grid/editor-saver.test.ts` (Node, with the page's
   globals stubbed and the commit action mocked):
   - **24-S5-9 the draft before a remote reset:** the half-typed word is
     sent with the epoch and base version it was made in before another
     tab's Start Over is applied, and its `epoch` refusal is explained with
     the input kept; likewise before another tab's Enter Hints, and before
     a reset that arrives as the stored puzzle (past the log's retention).
   - **24-S5-10 losing access:** a catch-up `not-found`, a 400, a commit
     `not-found` each stop the polling and the queue for good, explain,
     drop and explain every pending operation and the draft with their
     input, empty the journal and report `removed`; a catch-up
     `published` reports `published` with its date and visibility and
     shows the stored puzzle; a commit refused `published` stops the queue
     and asks the catch-up at once; the editor's own Publish is not
     reported; an editor opened published doesn't poll.
   - **24-S5-11 a lost session:** a redirected catch-up isn't retried;
     the queue halts, the work stays journaled, and `onSignedOut` is
     called once.

### Browser (`npm run test:e2e`)

6. `e2e/collaborators.spec.ts` with `e2e/helpers/collaborators.ts`; the
   setup project gains Jay (`e2e/auth.setup.ts`,
   `e2e/helpers/seed-session.ts`, `e2e/helpers/ownership.ts`):
   - **24-S5-E1 a collaborator edits the shared puzzle:** Jay opens Adam's
     puzzle; each sees the other's words; Jay has no Reset Grid, Adam has;
     in Create Hints Jay has no 3 Publish and his hints save, Adam has it.
     Someone not a collaborator gets the not-found page.
   - **24-S5-E2 removal while Jay's editor is open:** with nothing
     pending, his editor shows the note and "No longer available" within a
     few seconds, stops polling, and takes no keys; with an edit made
     before he heard, the edit is refused, kept to copy, and the editor
     is read-only.
   - **24-S5-E3 deletion and publication while open:** deleting the
     puzzle does the same; publishing it (by Adam, in his editor) shows
     Jay the published state with the note, his unsent hint kept to copy,
     and stops his polling; Adam's editor shows no such note.
   - **24-S5-E4 a lost session:** with the session's cookies gone, the
     editor lands on `/` within a few seconds.

### Amended acceptance

- `src/lib/collab/migration.db.test.ts` (24-S1-15): S1's migration is no
  longer the newest. It holds back S1's migration and every later one,
  and checks S1's is among them; the rows-preserved assertions are
  unchanged. Note in the file cites 24-S5.
- `src/app/puzzles/actions.builder-edits.test.ts` (O3): its in-memory
  store's `matches` learns the relation filter
  `collaborators: { some: { userId } }`, matched against a row's
  collaborators (none in its fixtures). Without it the store throws on
  the widened `WHERE` of `loadPuzzle` and `deletePuzzle`. No assertion
  changes. Note in the file cites 24-S5.

### Discrimination

2026-11-13, against the baseline (`5176189`, no S5 runtime), with the
proposed files above.

- Fail without the runtime: every case of 24-S5-1 to 24-S5-8 (the
  `membership` module, the two tables and the actions don't exist;
  `addCollaborator is not a function`; the migration isn't the newest),
  and every case of 24-S5-10 and 24-S5-11 (no loss is reported; a 400 and
  a redirect are retried; a published editor polls; `beginPublish` is
  missing; after a `published` refusal the next operation is still sent).
- 24-S5-9 pins existing behavior (S4's finalizing before a remote reset)
  and passes on the baseline. With the finalizing removed from the
  operations path, both of its operation cases fail; removed from the
  snapshot path, its snapshot case fails. Logged in the run notes
  (`/tmp/s5-discrimination.log`).
- The amended 24-S1-15 and O3 pass on the baseline.
- The browser cases need the runtime (without it Jay gets the not-found
  page for every shared puzzle, so each fails at its first step); they run
  with the implementation.
- Which tests catch each authorization rule (one disabled at a time) is
  recorded by the implementation below.

## Implementation

Runtime head `f514378` on `story/24-S5-collaborator-membership` (frozen at
`e29e562`; frozen acceptance unchanged since).

- **Migration** `20261113120000_add_puzzle_collaborators`, generated with
  `prisma migrate diff` from the previous schema to the new one: two new
  tables and their indexes and foreign keys, no change to an existing
  table. Applied to the local development database (`prisma migrate
  deploy`, localhost:5432/crossward) and to the local test database (the
  E2E preparation's migrate). **Not applied to production**: the human
  applies it, with S1's `20261112120000_add_puzzle_operations`, before the
  epic merges to `main`.
- `loadPuzzle` and `duplicatePuzzle` read with `findUnique` and the
  predicate (an ID plus `AND`), which the frozen in-memory stores of
  24-S3-11 and 16-S4-5 already model.
- **A signed-out editor reloads after 2 s**, not at once (decision 11).
  The first full run failed 23-S3-7 ("an open editor's grid save is
  refused"): its username was removed and the next poll, about a second
  later, reloaded the page before the test's click reached the grid. With
  the delay, an action already being redirected by the session gate
  navigates first; 24-S5-E4 still lands on `/` within its 8 s. The queue
  halts at once, so nothing is sent meanwhile; edits made in those 2 s are
  journaled.
- `prisma format` realigned `schema.prisma`'s existing columns
  (whitespace only).
- **Evidence** on `f514378`: `npm run verify` exit 0, 103 files, 1234
  tests (`/tmp/s5-verify-f514378.log`); full `npm run test:e2e --
  --workers=2` 1380 passed, 1 failed (`/tmp/s5-e2e-full-f514378.log`):
  `menu-reset.spec.ts` 19-S3-1, an `ECONNRESET` on its magic-link sign-in
  request, not on this story's paths; that file rerun alone after
  `pretest:e2e`: 9 passed (`/tmp/s5-e2e-rerun-menu-reset-f514378.log`).
  `e2e/collaborators.spec.ts` alone: 10 passed
  (`/tmp/s5-e2e-focused.log`, with `username-step`, `session-validation`
  and `route-protection`: 48 passed).

### What the tests catch

2026-11-13, one rule disabled at a time and restored; the whole unit and
database suite each time (logs `/tmp/s5-rules.log`, counts
`/tmp/s5-rules-counts.log`), and `e2e/collaborators.spec.ts` alone for the
editor's controls (`/tmp/s5-browser-rules.log`).

| Rule disabled | Failing |
| --- | --- |
| `editableBy` without the collaborator clause | 11: 24-S5-1, -2, -3, -4, -5, -7 |
| `editableBy` matching anyone | 23: 24-S5-2 to -5, -7; 24-S1-8, -17, -18; 24-S4-7, -9; O3; 16-S4-5 |
| Commit: the authorizing read without `editableBy` | 6: 24-S5-4, -7; 24-S1-8, -17, -18 |
| Commit: the compare-and-swap without `editableBy` | 2: 24-S5-4 |
| Commit: the compare-and-swap without `ownedBy` (Start Over) | 1: 24-S5-4 |
| Validation without the owner check (Start Over) | 2: 24-S5-4, 24-S2-4 |
| Catch-up: the version read without `editableBy` | 3: 24-S5-5, 24-S4-7, -9 |
| Catch-up: **the log read without `editableBy`** | 1: 24-S5-5 |
| Catch-up: the snapshot read without `editableBy` | 4: 24-S5-5, 24-S4-7, -9 |
| Catch-up: publication not reported | 1: 24-S5-5 |
| Publish: read and write without `ownedBy` | 2: 24-S5-6 |
| Publish: the write without `ownedBy` | 1: 24-S5-6 |
| `loadPuzzle` without the predicate / owner-only | 5: 24-S5-7, O3 / 2: 24-S5-7 |
| `duplicatePuzzle` without the predicate | 2: 24-S5-7, 16-S4-5 |
| `deletePuzzle` without `ownedBy` | 1: 24-S5-7 |
| `setPuzzleVisibility` without `ownedBy` | 1: 24-S5-7 |
| Membership's owner condition without `ownedBy` | 5: 24-S5-1, -3, -7 |
| Remove's delete without the owner condition | 1: 24-S5-3 |
| Revoke's delete without the owner condition | 1: 24-S5-3 |
| Binding at once leaves the invitation | 1: 24-S5-1 |
| The account matched by the raw address (case) | 3: 24-S5-1, -7 |
| Addresses not normalized | 7: 24-S5-1, -2, -7 |
| Invitations never expire | 3: 24-S5-1, -2, -3 |
| Claiming ignores expiry | 1: 24-S5-2 |
| Claiming the account's own puzzle | 1: 24-S5-2 |
| Claiming keeps the invitation | 2: 24-S5-2 |
| The list shows expired invitations | 1: 24-S5-3 |
| `claimInvitations` by an address other than the session's | 1: 24-S5-7 |
| Loss: the poller not stopped | 1: 24-S5-10 |
| Loss: the queue not halted | 2: 24-S5-10 |
| Loss: pending work not dropped (input not kept) | 3: 24-S5-10 |
| Loss: no explaining note | 4: 24-S5-10 |
| A catch-up 400 retried | 1: 24-S5-10 |
| A redirected catch-up retried | 1: 24-S5-11 |
| The editor's own Publish taken for a loss | 1: 24-S5-10 |
| An editor opened published polls | 1: 24-S5-10 |
| A commit `not-found` not a loss | 2: 24-S5-10 |
| A `published` refusal doesn't ask the catch-up | 1: 24-S5-10 |
| The published puzzle not shown | 1: 24-S5-10 |
| A halted queue still sends | 4: 24-S5-10, -11 |
| The `published` answer not parsed | 2: 24-S5-10 |
| Finalizing before a remote reset (operations / snapshot path) | 24-S5-9 (2 / 1; at the freeze) |

Browser (`e2e/collaborators.spec.ts` alone):

| Rule disabled | Failing |
| --- | --- |
| Reset Grid shown to a collaborator | 24-S5-E1 (Build) |
| 3 Publish shown to a collaborator | 24-S5-E1 (Create Hints) |
| Removal leaves the editor editable | 24-S5-E2 ×2, 24-S5-E3 (deleted) |

Not caught by the frozen acceptance (recorded, not hidden):

- Either one of the two owner-address guards in `addCollaborator` alone
  (the owner's address, and an account found that is the owner): each
  catches it by itself; removing both fails 24-S5-1.
- Halting the queue on a lost session. 24-S5-11's in-flight operation
  never answers, so nothing else would be sent either way; unhalted, the
  next send meets the same session gate and redirects (S3).
- In the "invitations never expire" run 24-S1-7 (the randomized
  convergence test) also failed once, a timeout under load unrelated to
  the rule; it passes in every other run.

## Repo paths

Acceptance: the files above. Runtime: `prisma/schema.prisma`,
`prisma/migrations/20261113120000_add_puzzle_collaborators/migration.sql`,
`src/lib/collab/{access,catchup,membership,poller,queue}.ts`,
`src/app/puzzles/actions.ts`, `src/app/puzzles/page.tsx`,
`src/app/puzzles/[id]/page.tsx`,
`src/components/grid/{editor-saver.ts,useOperationSaving.ts,PuzzleGridEditor.tsx,BuilderSteps.tsx}`.
Docs: this story, `../EPIC.md` (the story link), `../HANDOFF.md`.

## Definition of done

- Frozen acceptance unchanged after the freeze.
- `npm run verify` exits 0; the full `npm run test:e2e` under the epic's
  evidence policy (one `--workers=2` run, every failing file rerun alone
  after `npm run pretest:e2e`).
- Which tests catch each authorization rule (one disabled at a time),
  recorded.
- The migration applied only to the local development and test
  databases, recorded for the human before `main`.
- A PR into `epic/24-collaboration`, independently reviewed and merged by
  the reviewer.
