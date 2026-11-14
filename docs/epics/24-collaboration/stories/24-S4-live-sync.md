# Story S4 — Live sync by polling

Each open editor learns of operations committed elsewhere. While its page
is visible it asks, about once a second, for the operations committed since
its confirmed version, and asks at once on becoming visible again, coming
back online, or learning it is behind. Remote operations of every kind,
Start Over and Enter Hints included, are applied to the confirmed state;
the builder's pending edits stay shown over them, and nothing local moves.
A tab too far behind for the log reloads the puzzle as stored. Latency and
request cost are measured for the push decision.

**Status: approved and frozen 2026-11-13** by the agent under the human's
delegation of every story's approval and freeze in this epic
([HANDOFF](../HANDOFF.md)). The baseline is the specification-only commit
on `epic/24-collaboration` that adds this file ("24-S4: freeze …"); its
hash is recorded in the handoff.

**Blast radius: risk story.** `src/lib/collab/**`,
`src/app/puzzles/actions.ts` (a new authenticated read),
`src/app/api/puzzles/[id]/operations/**` (its GET) and the editor's save
path. Branch `story/24-S4-live-sync` from the baseline, a PR into
`epic/24-collaboration` and independent review. No migration: the log's
`(puzzleId, version)` unique index (S1) serves the read.

## The human's request

[EPIC](../EPIC.md), Stories item 4, "Multi-user testing" (S4's cells:
two contexts of one account converge; a Start Over or Enter Hints from
another context; offline, edit elsewhere, back online), Decisions (the
architecture's confirmed state and pending operations; D4, D5, D8's same
account in two tabs, D9; the operation log's retention and snapshot
reload) and Invariants 9–11.

## What the code does today

`epic/24-collaboration` at `1f24309` (S3 merged, PR #41).

- The editor (`EditorSaver`, `useOperationSaving`) keeps an outbox
  (`outbox.ts`): the confirmed state and the pending operations. It hears
  only its own acknowledgments. `settle` applies an acceptance at any
  version past the confirmed one, so a version committed by another tab in
  between would be skipped for good once catching up starts.
- The route `/api/puzzles/[id]/operations` has only POST (keepalive).
  Its comment reserves GET for this story.
- S3's reviewer noted (`editor-saver.ts`, `adoptJournal`): a newly opened
  editor adopts every journal of the puzzle, including a live tab's, and
  deletes the other tabs' entries. With live sync, the adopted operations
  also reach the adopting tab through catching up.
- `PuzzleOperation` holds accepted records with their version (refused ones
  with none) and is pruned to the last 500 accepted or 24 h, always keeping
  the newest accepted one.

## Decisions

From the EPIC (not restated): about once a second while visible, at once
on becoming visible; remote operations applied to the confirmed state with
pending ones reapplied for display; recovery after a disconnection; the
snapshot past the log's retention; no conflict alerts (S7); no push
transport.

Drafting decisions (routine, made under the delegation):

1. **The read** (`src/lib/collab/catchup.ts`, `readOperationsSince`, the
   database client passed in). Input `{ puzzleId, since }`. It authorizes
   with `editableBy` in its own `WHERE`, as the commit path does. Answers:
   - `ops`: every accepted operation with a version after `since`, in
     version order, each as committed (its envelope and body) with its
     version. When the puzzle is still at `since`, none, after reading only
     the puzzle's version (the usual, idle answer).
   - `snapshot`: the puzzle as stored (grid, hints, title, phase, version,
     epoch) when `since` is null (asked for), when the log can't give every
     version after `since` contiguously (pruned), when more than 200 behind
     (cheaper), or when `since` is past the puzzle's version.
   - `not-found` (no puzzle the caller can edit) and `invalid`.
   Refused records are never sent: they change nothing. Publication isn't
   an operation and isn't reported (S5's losing access).
2. **Its entries.** `catchUpOperations(input)` in `actions.ts`, gated by
   `requireSession` like every action. The editor polls the route's GET,
   which wraps it, with `since` in the `x-catch-up-since` header (none: the
   snapshot): a route request doesn't queue behind the editor's commits as
   a server action would, and the URL stays the route's own. 400 for
   malformed input, 404 for not found, `cache-control: no-store`.
3. **The poller** (`src/lib/collab/poller.ts`, pure, timers and visibility
   passed in). One request at a time; the next 1 s after an answer, while
   visible. Hidden: no new request. Visible again, back online (`online`),
   or behind (an acceptance ahead of the confirmed version): at once, or
   right after the one in flight. A failed request is tried again after
   1 s, 2 s, 4 s, 8 s, then every 15 s. `not-found` or `invalid` stops it
   (S5 decides what the editor then shows). The editor checks the answer's
   shape (`parseCatchUp`); anything else is a failure.
4. **Applying committed operations** (`outbox.ts`, `applyCommitted`). Each
   operation at the next version is validated against the confirmed state
   and applied to it (its epoch and phase too); earlier versions are
   skipped; a gap stops the batch. An operation that doesn't fit means the
   confirmed state diverged: the editor asks for the snapshot. One of this
   tab's own operations in the batch (pending, adopted from a journal, or
   acknowledged ahead) is applied from the log and leaves the pending list,
   is answered as accepted (its waiters, such as Publish, resolve) and is
   never sent again; a retry waiting on it is called off. Its answer
   arriving later changes nothing.
5. **An acceptance ahead.** `settle` now applies an acceptance only as the
   version after the confirmed one. One further ahead (others committed in
   between) is kept as `acknowledged`: still shown (projected before the
   pending operations), not sent, and replaced by the log's copy when
   catching up reaches it. The editor polls at once. S3's frozen settling
   cases (the next version, and at or below the confirmed one) are
   unchanged.
6. **The snapshot** (`applySnapshot`) replaces an older confirmed state,
   keeping the pending operations (any that had landed are answered with
   their first outcome on resend and then only dropped) and the
   acknowledged ones it doesn't hold yet. An older snapshot changes nothing.
7. **Showing it.** The view is rebased from the old projection to the new
   (`rebaseView`): what the builder is typing and anything pending stays
   shown; the rest is the server's. The cursor, direction, focus, Preview,
   Lock Grid Letters, Preview Hints and open dialogs are local and aren't
   touched (Invariant 9). The cursor moves only if its cell turned black.
   Moved into Create Hints from elsewhere, the cursor turns only where its
   direction has no word (17-S6), and Preview, which the hints phase lacks,
   is off. A remote change shown under the burst being typed neither
   extends the burst nor joins its word. While this tab's own Enter Hints
   awaits the server, remote changes wait for its answer, which shows the
   projection.
8. **Another tab's Start Over or Enter Hints.** Before applying one, every
   burst finalizes, so the draft becomes operations of the state it was
   made in and the server judges them: after a reset they are refused
   (`epoch`, D5: a late edit never rebuilds cleared content), after Enter
   Hints they are kept only if they fit (D4). Each refusal is explained as
   S3's are, with the input kept: the note shows the refused letters as
   typed (the refused writes over the view), not the view after the reset.
9. **Journal adoption with live sync** (S3's reviewer note). A new editor
   still adopts every journal of the puzzle, including a live tab's, and
   re-sends its operations with their own `opId`s: exactly once holds on
   the server, and both tabs show them at once. Whichever tab commits one,
   the other learns of it by catching up (decision 4) and treats it as its
   own acknowledgment, so it is neither applied twice nor re-sent, and the
   live tab's status settles. The adopting tab journals the adopted
   operations as its own, so the live tab's entries being removed loses
   nothing. If the server refuses one, both tabs may show the note (one
   account, one browser); accepted.
10. **Same account, two tabs** (D8): they sync; no conflict alerts (none
    exist until S7).
11. **Measurements** (D9, EPIC: before any push transport). The browser
    test 24-S4-E4 measures, on the local production build: commit-to-shown
    latency over eight commits, catch-up requests while idle and visible,
    their answer size, none while hidden, and the request at once on
    becoming visible. The implementation records the numbers, the queries
    per request and a cost estimate under "Measurements" below.

## Non-goals

- Conflict outlines and notes, names, presence, the session panel (S7).
- Collaborators, and what an editor shows on losing access or on
  publication elsewhere (S5); the catch-up only stops on `not-found`.
- Push transport, WebSockets or a hosted service (D9).
- Changing the commit path, the log's retention, `publishAtVersion` or the
  Publish dialog's messages.

## Acceptance (frozen)

IDs in `describe` names.

### Unit (`npm run verify`)

1. `src/lib/collab/sync.test.ts` — **24-S4-1** committed operations
   applied in order without mutation; held versions skipped, a gap stops;
   pending edits shown over remote ones; a tab's own operation in the log
   applied once, settled, its later answer changing nothing; Start Over and
   Enter Hints followed (epoch, phase, old-epoch pending work left out); a
   divergence reported. **24-S4-2** an acceptance ahead kept as
   acknowledged, shown, applied once catching up reaches it; the snapshot
   (newer replaces, pending kept, older changes nothing); rebasing over a
   remote change. **24-S4-3** a seeded randomized run of three polling tabs
   (lost answers, resends, Start Over) converges to the server's puzzle.
2. `src/lib/collab/poller.test.ts` — **24-S4-4** at once, then every
   second from the confirmed version, one at a time; none while hidden, at
   once when visible; asking during a request asks again after it;
   retries with growing delays, at once back online; a divergence asks for
   the snapshot; stopping. **24-S4-5** the answer's shape checked.
   **24-S4-6** the queue: an acceptance ahead asks to catch up and is
   applied once; an operation shown committed answers its waiters, isn't
   re-sent, calls off a retry; a later answer or failure for it changes
   nothing; the snapshot kept with pending work.

### Database (`npm run verify`)

3. `src/lib/collab/catchup.db.test.ts` — **24-S4-7** the operations since
   a version, as committed, refused ones left out; the snapshot when asked,
   past retention, too far behind, or ahead; only for a builder who can
   edit; malformed input. **24-S4-8** two tabs' queues on the commit path,
   catching up from the read, converge: overlapping (MASKS, then MAG, is
   MAGKS), compatible edits, a Start Over refusing the other tab's late
   edit, Enter Hints.
4. `src/app/api/puzzles/[id]/operations/route.catchup.db.test.ts` —
   **24-S4-9** the action as the session account; GET by the header's
   version, `no-store`, the snapshot without it; 400 and 404; no usable
   session redirected to `/`.

### Browser (`npm run test:e2e`)

5. `e2e/live-sync.spec.ts` with `e2e/helpers/live-sync.ts`:
   - **24-S4-E1** **two contexts of one account converge**: each sees the
     other's words; overlapping edits end as the later commit (MASK then
     MAG is MAGK); compatible edits made at once both survive; the cursor
     and focus stay. Remote changes keep unsaved edits shown, the cursor and
     focus.
   - **24-S4-E2** **a Start Over from another context** clears this
     editor, and its edit made before hearing is refused with "Your DOG in
     n-Across wasn't saved: the puzzle was started over.", the input kept;
     **Enter Hints from another context** moves this editor to Create
     Hints with Preview off, and its hints then save and sync back.
   - **24-S4-E3** **offline, edit elsewhere, back online**: both
     converge, the offline edit committed last; past the log's retention
     the editor reloads the puzzle as stored and carries on; a tab adopting
     a live tab's journal: committed once, both show it, journals empty,
     both carry on in step.
   - **24-S4-E4** the measurements: commit-to-shown latency (median ≤ 2 s,
     each ≤ 4 s), 5–12 catch-up requests in 10 idle seconds, answers under
     100 bytes, none while hidden, one within 0.5 s of becoming visible.

### Amended acceptance

- `e2e/editor-operations.spec.ts` (24-S3-E3, the burst into a word locked
  elsewhere): catching up is held off (`blockCatchUp`) before the lock is
  committed elsewhere. With S4 the editor would otherwise see the lock
  within a second and protect the word before any burst, so the refusal
  the test is about could not happen; held off, it is the same case, an
  edit made before the editor heard of the lock. Its assertions are
  unchanged. Note in the file cites 24-S4.
- `src/app/route-guard-source.test.ts` (23-S3-U7, amended by 24-S1): the
  operations route may import `catchUpOperations` beside
  `commitOperation`, and must call it; still the only two route handlers,
  importing only the checked actions and `next/server`. Its GET is gated
  by the same `requireSession` (24-S4-9). Note in the file cites 24-S4.

### Discrimination

2026-11-13, with a prototype of the decisions above (set aside in a WIP
commit on the story branch until the freeze).

- With the prototype: every new unit and database case passes, and the
  whole unit suite with the two amendments; `e2e/live-sync.spec.ts` and
  `e2e/editor-operations.spec.ts` alone pass 9 of 9 and 11 of 11 (with the
  setup).
- Without the runtime (the baseline): the new unit and database files fail
  to import (`poller`, `catchup`, `applyCommitted`, `catchUpOperations`,
  the route's `GET`); the amended route-guard case fails (no
  `catchUpOperations` import); the browser cases that wait for a remote
  change fail (nothing polls). The amended 24-S3-E3 passes with and
  without the runtime.
- Which tests each rule is caught by (one rule disabled at a time) is
  recorded by the implementation below.

### What the tests catch

2026-11-13, on the implementation (`172c9d8`), one rule disabled at a time
and restored (logs `/tmp/s4-rules.log`, `/tmp/s4-browser-rules.log`).

Unit and database files (`src/lib/collab`, `src/app/api`, the route-guard
and `src/app/puzzles` tests):

| Rule disabled | Failing |
| --- | --- |
| An acceptance ahead applied at once (no `acknowledged`) | 9: 24-S4-2, -3, -6, -8 |
| Catching up keeps this tab's own pending operations | 3: 24-S4-1, -6 |
| Catching up applies across a gap | 1: 24-S4-1 |
| No divergence check | 1: 24-S4-1 |
| An older snapshot replaces a newer state | 1: 24-S4-2 |
| Caught-up operations don't answer waiters | 1: 24-S4-6 |
| A waiting retry isn't called off | 1: 24-S4-6 |
| A caught-up operation's failed send is retried | 1: 24-S4-6 |
| No poll on an acceptance ahead (`onBehind`) | 1: 24-S4-6 |
| No retry backoff | 1: 24-S4-4 |
| Asking during a request is dropped | 1: 24-S4-4 |
| No snapshot after a divergence | 1: 24-S4-4 |
| Both guards against a pruned log (index and count) | 1: 24-S4-7 |
| The read not authorized by `editableBy` | 3: 24-S4-7, -9 |
| The route ignores the header | 2: 24-S4-9 |
| The route's answer cacheable | 1: 24-S4-9 |
| `parseCatchUp` accepts another puzzle's operations | 1: 24-S4-5 |

Browser (`e2e/live-sync.spec.ts` alone):

| Rule disabled | Failing |
| --- | --- |
| No polling at all | all 8 cases (E1 ×2, E2 ×2, E3 ×3, E4); only the setup passed |
| The refusal note from the view, not the letters typed | 1: 24-S4-E2 Start Over |
| Preview kept on into Create Hints | 1: 24-S4-E2 Enter Hints |

Not caught by the frozen acceptance (recorded, not hidden):

- Either one of the two pruned-log guards alone (they are redundant: each
  catches pruning by itself; only removing both fails 24-S4-7).
- The 200-operation limit (a cost bound; without it a long catch-up is
  served as operations, still correct).
- A `pollNow` while hidden (the `online` event on a hidden page would then
  poll once; the schedule still stops while hidden, which 24-S4-4 and
  24-S4-E4 check).
- Finalizing the burst before another tab's Start Over or Enter Hints
  (24-S4-E2 holds the edit as a pending operation, not a draft). In that
  run 24-S4-E4 failed once, a timing read unrelated to the rule; E4 then
  passed 3 of 3 alone.
- A remote change extending the burst (only its timing differs).

## Measurements

2026-11-13, local production build (`next start`, local Docker
PostgreSQL over `PrismaPg`), Chromium, one worker, a 15×15 puzzle, three
runs (`/tmp/s4-measure.log`, a temporary measuring spec not committed;
24-S4-E4 also passed 3 of 3 in that run).

- **Commit to shown** (a commit elsewhere until the editor shows it), 20
  commits a run: median 0.80 s, p90 1.30 s, max 1.31 s (min 0.03 s). As
  expected for a 1 s interval after each answer.
- **Keystroke to the other context** (a letter typed in one context until
  the other shows it, 500 ms burst idle included), 10 a run: median 1.31 s,
  max 1.33 s (min 0.80 s).
- **Requests**: exactly 1.0 catch-up request a second per visible editor
  (30 in 30 s), none while hidden; 0 bytes up beyond headers, a 25-byte
  answer when idle (`{"status":"ops","ops":[]}`).
- **Server time per idle request**: median 17–21 ms, p90 23–32 ms, max
  35–54 ms (request start to response end, local).
- **Database work per idle request**: 3.8–4.0 transactions (from
  `pg_stat_database.xact_commit`): Better Auth's session and user reads,
  and the puzzle's version. Changes add one log read.

Cost, per visible editor: 3,600 function invocations and about 14,000
small queries an hour. For example, 10 builders with an editor open 2 h a
day is about 2.2 M invocations a month, and keeps the Neon compute awake
while any editor is open (no scale to zero then). Each invocation is short
(tens of ms locally; Neon's network adds latency to each of its ~4
queries). Compare with the plan's quotas rather than list prices, which
weren't checked here.

**For the push decision:** polling meets "within about a second" (median
0.8 s from commit, 1.3 s from keystroke, under 1.4 s worst). Push transport
isn't needed for latency now. Its case would be cost at scale (invocations
and an always-awake database grow with open editor-hours), or S7's
remote-selection wish; revisit then, as a separately approved story.

## Repo paths

Acceptance: the files above. Runtime: `src/lib/collab/{catchup,poller,
outbox,queue}.ts`, `src/app/puzzles/actions.ts`,
`src/app/api/puzzles/[id]/operations/route.ts`,
`src/components/grid/{editor-saver.ts,PuzzleGridEditor.tsx}`. Docs: this
story, `../EPIC.md` (the story link), `../HANDOFF.md`.

## Definition of done

- Frozen acceptance unchanged after the freeze.
- `npm run verify` exits 0; the full `npm run test:e2e` under the epic's
  evidence policy (one `--workers=2` run, every failing file rerun alone
  after `npm run pretest:e2e`).
- Which tests catch each rule, recorded; the measurements recorded.
- A PR into `epic/24-collaboration`, independently reviewed and merged by
  the reviewer.
