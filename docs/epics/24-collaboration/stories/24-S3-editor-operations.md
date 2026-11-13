# Story S3 — The editor saves by operations

The editor stops sending snapshots. It keeps a confirmed state (what the
server acknowledged) apart from its pending operations, and turns the
builder's edits into operations in bursts. One operation is in flight per
tab, in order, retried with its `opId`. A quiet status says "Saving…",
"Saved" or "Not saved — retrying". A refused edit is explained above the
grid with its input kept. Unacknowledged operations are journaled in
`localStorage` and re-sent on the next open, leaving warns, and a keepalive
send is attempted. Enter Hints, Start Over, locks and Publish use S2's
operations and `publishAtVersion`. The snapshot actions are removed, and an
editor tab of an earlier build reloads into the current one at its next
server action.

**Status: approved and frozen 2026-11-13** by the agent under the human's
delegation of every story's approval and freeze in this epic
([HANDOFF](../HANDOFF.md)). The baseline is the specification-only commit
on `epic/24-collaboration` that adds this file ("24-S3: freeze …"); its
hash is recorded in the handoff.

**Blast radius: risk story.** `src/app/puzzles/actions.ts`,
`src/lib/collab/**` and the editor's save path, plus `src/middleware.ts`
and `next.config.ts` (the old-tab reload). Branch
`story/24-S3-editor-operations` from the baseline, a PR into
`epic/24-collaboration` and independent review. No migration.

## The human's request

[EPIC](../EPIC.md), Stories item 3, "Retiring snapshot saves", "Multi-user
testing" (S3's row: reload with journaled operations), Decisions (Saving
status; Leaving with unsaved edits; D3, D4, D5, D7; Implementation details:
a burst, client order, unsaved work on leaving, rejected bursts, Enter Hints
and late Build edits, Start Over) and Invariants 9–13.

## What the code does today

`epic/24-collaboration` at `0ded6ae` (S2 merged, PR #40).

- `PuzzleGridEditor` diffs its state against the last-saved value in three
  effects and sends whole snapshots (`saveGrid`, `saveHints`, `saveTitle`)
  after a trailing 500 ms debounce with no maximum wait. Failures only
  `console.error`. `flushPendingSaves` re-sends all three before Enter Hints
  and Publish; `enterHints` and `publishPuzzle` are snapshot actions. All
  five are fenced to version 0 (S1).
- The commit path (`commitOperation`, the keepalive route) and
  `publishAtVersion` exist (S1, S2) but only tests call them.
- `loadPuzzle` returns neither `version` nor `resetEpoch`.
- `next.config.ts` sets no deployment ID; the middleware only gates the
  session cookie.

## Decisions

From the EPIC (not restated): the burst rules and their 500 ms / 2 s
starting values, one in-flight operation per tab, the journal, the
`beforeunload` warning, the keepalive send counting for nothing, rejected
bursts kept and copyable with the authoritative cells shown, D3, D4, D5, D7,
and the plan for old tabs.

Drafting decisions (routine, made under the delegation):

1. **Client model** (`src/lib/collab/outbox.ts`, pure). An outbox is the
   confirmed state (`content`, `version`, `resetEpoch`) and the pending
   operations. The projection applies the pending operations in order
   (`evaluateOperation`, owner), leaving out any that wouldn't fit. A new
   operation's epoch is the projection's (after a pending Start Over, the
   new epoch) and its base version the confirmed one. An acceptance at a
   version past the confirmed one applies the operation to the confirmed
   state; one at or below it (a resend whose first commit the confirmed
   state already holds) only drops it; a refusal only drops it.
   `rebaseView(oldBase, view, newBase)` keeps the draft (cells, hints, title
   the view changed from the old base) over the new base; S4 uses it for
   remote operations.
2. **Bursts.** The editor's state is the view. A burst's operation is the
   difference between the view and the projection when it finalizes:
   `cells` (each active cell whose value differs, so a letter the cell
   already holds is no change), one `hint` per changed key (Hints only), and
   `title` (compared as the server normalizes it). `BurstClock`
   (`burst.ts`): 500 ms idle, 2 s after the burst's first edit, or
   finalized by the editor. The grid's clock also finalizes when the cursor
   turns or leaves the burst's word (the words, in the cursor's direction,
   of each edited cell and of the cursor after it, as `wouldBeWord`), when
   the grid loses focus, on a step button, on Reset Grid (opening and
   confirming), on Publish and on the page being hidden or closed. Hints
   and the title have one clock each, finalized by a text field's blur too.
   Locks, unlocks, Enter Hints and Start Over are operations of their own,
   made after the grid's burst is finalized.
3. **The queue** (`queue.ts`). One operation in flight; the next only once
   it is answered. `accepted` and `refused` settle it; `invalid` and
   `not-found` are refusals (codes `invalid`, `not-found`); `busy` or a
   failed send is re-sent with the same operation after 1 s, 2 s, 4 s, 8 s,
   then every 15 s. A Next.js redirect thrown by the action (no session, an
   out-of-date tab) means the page is going: no retry, the operation stays
   journaled, and leaving doesn't warn. The queue keeps answers by `opId`
   for waiters (Enter Hints, Publish).
4. **The journal** (`journal.ts`): `crossward:journal:v1:<puzzle>:<epoch>:
   <tab>`, one entry per tab and epoch (two tabs never overwrite each other),
   rewritten on every change of the pending list and removed once empty.
   On open, the editor adopts every entry for the puzzle (older epochs
   first, then by when written; each operation once), shows them at once
   over the server's state, re-sends them unchanged and removes the other
   tabs' entries. A storage failure is swallowed: the journal is a safety
   net.
5. **Leaving.** `visibilitychange` to hidden and `pagehide` finalize every
   burst and send the first pending operation to the keepalive route (S1),
   which proves nothing; it stays journaled. `beforeunload` finalizes and
   warns while anything is unacknowledged. Leaving the editor within the
   app finalizes too; the queue carries on sending.
6. **The save status** (`SaveStatus`): at the end of the step row,
   right-aligned, in the `label` style, `subtle` ("Saving…", "Saved") or
   `error` ("Not saved — retrying"). Empty until the first edit but always
   in place, so nothing moves. "Saving…" while a burst is open with a
   change or anything is unacknowledged. Not shown once published. **Needs
   the human's visual check.**
7. **Refusals** (`notice.ts`, `SaveNotices`). A note between the toggle
   row and the grid (where S7's session panel will sit), on the toggle row's
   panel color: the message, the refused input in a read-only field
   (selected on focus) with Copy, and Dismiss. Messages: "Your COT in
   1-Across wasn't saved: the word was locked." (the entry as the builder
   saw it; "in the grid" when the cells span no one entry; deletions keep
   no input), "Your hint for 1-Across wasn't saved: …", "Your title wasn't
   saved: …", "1-Across wasn't locked: …", "Reset Grid wasn't saved: …".
   Reasons: locked, "the puzzle was started over" (S7 names who), "moved to
   Create Hints", "was published", "it no longer fits the puzzle", owner,
   expired ("Reload the page to continue"), not found. The view is rebased:
   the grid shows the authoritative cells, edits still being typed stay.
   **Needs the human's visual check.**
8. **Enter Hints** finalizes every burst, queues `enterHints`, and changes
   the editor's phase only once the server accepts it (D4), showing the
   projection (converted grid, seeded hints) with the cursor at the Hints
   phase's start. Refused: a note, the editor stays in Build.
9. **Start Over** finalizes the grid's burst, queues `startOver` (Keep
   Locked Words or not) and clears the view at once, as today; later edits
   belong to the new epoch.
10. **Publish** (D7). Opening the dialog (step 3, every hint written)
    finalizes every burst and records the operations then pending and the
    confirmed version. Confirming waits (up to 10 s) for those to be
    answered: all accepted → `publishAtVersion` at the version the last was
    committed as (or the recorded one if none were pending); any refused →
    "Some of your changes weren't saved, so it wasn't published. …"; no
    answer in time or the server unreachable → the dialog's existing
    "Couldn't publish. Try again." A refusal shows in the dialog in place
    of that line: `stale` → "This puzzle changed after you checked it, so
    it wasn't published. Reload the page to see the changes, then publish
    again." (S4's catch-up will let the editor see the change itself.)
11. **Removed:** `saveGrid`, `saveHints`, `saveTitle`, the snapshot
    `enterHints`, `publishPuzzle`, `updateUnlessPublished`,
    `SNAPSHOT_FENCE`, `flushPendingSaves` and the editor's save effects and
    timers. No snapshot write remains, so the fence has nothing left to
    guard: every content write is an operation (Invariant 12).
    `loadPuzzle` adds `version` and `resetEpoch`.
12. **Old tabs reload.** `next.config.ts` sets Next.js's `deploymentId`:
    `NEXT_DEPLOYMENT_ID` when Vercel sets it (Skew Protection; it must win
    or the build fails), else `VERCEL_DEPLOYMENT_ID`, else
    `VERCEL_GIT_COMMIT_SHA`, else `git-<HEAD>` locally (the same at build
    and at `next start`). Next.js sends it with every server action as
    `x-deployment-id`. In production builds the middleware
    (`stale-editor.ts`) answers a server action posted to the editor's page
    (`/puzzles/<id>`) without this deployment's ID with an empty
    `x-action-redirect: <same page>;replace`, which Next.js's client turns
    into a full page load. A cookie (60 s) stops a reload loop should the
    IDs ever disagree. What an old tab's builder sees:
    - a tab of the snapshot editor (no deployment ID): at its next save the
      page reloads into the new editor, showing the server's state; the
      burst that triggered it is lost (it has no journal), and the reload
      makes that visible. Its other actions are gone (404) anyway;
    - a tab of this editor after a later deploy: the same reload, with no
      `beforeunload` warning, and its journal re-sends the burst, so
      nothing is lost.
13. **Vercel Skew Protection: not determined.** The available `vercel`
    CLI (37.4.2, authenticated) has no project-settings inspection;
    `vercel inspect` and the build logs don't show it, and fetching the
    production HTML (a `data-dpl-id` attribute would reveal it) was not
    permitted in this session. **The human must check it (Project
    Settings → Advanced → Skew Protection) before the epic merges to
    `main`.** Implication: production runs the pre-epic `main`, with no
    fence, and the whole epic deploys at once. If Skew Protection is on, an
    old tab keeps reaching the old deployment (its own deployment ID routes
    it there) for the maximum age, where its snapshot saves overwrite
    committed operations. Then either turn it off for the cutover, or first
    deploy only S1's fence to `main` and wait the maximum age before the
    rest. If it is off, the reload above covers old tabs and the epic can
    deploy at once (after the migration).
14. **Input limits** stay the server's (S1 decision 3): a hint over 2000
    characters or a title over 500 is refused as `invalid` with the text
    kept; no new UI limits.

## Non-goals

- Catch-up, remote operations, polling (S4); collaborators and losing
  access (S5); names in notes and the session panel (S7).
- A way back from Hints; undo.
- Changing the commit path, the route or `publishAtVersion` (S1, S2).
- Vercel settings and production migrations (the human's).

## Acceptance (frozen)

IDs in `describe` names.

### Unit (`npm run verify`)

1. `src/lib/collab/outbox.test.ts` — **24-S3-1** the projection, envelopes
   (epoch after a pending Start Over, base version), no mutation, unfit
   pending operations left out; **24-S3-2** settling: acceptance applied
   once at its version (structural epochs too), a resend at or below the
   confirmed version not reapplied, refusal dropped with later ones kept;
   **24-S3-3** what a burst writes (same letter no change; clears, rebuses;
   black cells and locks aren't cell writes), hint and title changes, and
   `rebaseView` keeping the draft.
2. `src/lib/collab/burst.test.ts` — **24-S3-4** 500 ms idle, 2 s maximum
   wait, finalize and cancel.
3. `src/lib/collab/queue.test.ts` — **24-S3-5** one in flight, in order;
   refusals (with the outbox before and after), `invalid` and `not-found`;
   waiters and idle; **24-S3-6** retries with the same operation and growing
   delays, nothing else sent meanwhile; a redirect stops the queue, the
   operation kept; **24-S3-7** the journal on every change; adoption
   unchanged, once, first; the keepalive send of the first pending
   operation.
4. `src/lib/collab/journal.test.ts` — **24-S3-8** per puzzle, epoch and
   tab; reading order and de-duplication across tabs; malformed entries;
   failing storage.
5. `src/lib/collab/notice.test.ts` — **24-S3-9** the messages and kept
   input; the stale Publish message.
6. `src/lib/stale-editor.test.ts` — **24-S3-10** the reload rule: this
   deployment passes; another or none → `x-action-redirect` to the page
   with the cookie; GETs, the play page, the library and non-actions
   untouched; the loop breaker; the middleware and the config wire it.
7. `src/app/puzzles/actions.snapshot-removed.test.ts` — **24-S3-11** the
   removed actions aren't exported or referred to anywhere in the app; the
   editor commits, publishes at a version, sends keepalive to the route and
   warns on leaving; `loadPuzzle` gives `version` and `resetEpoch`.

### Database (`npm run verify`)

8. `src/lib/collab/queue.db.test.ts` — **24-S3-12** a queue on the real
   commit path: a session of every kind in order leaves the confirmed state
   equal to the server's; Start Over moves the tab's later edits to the new
   epoch; a lost acknowledgment is applied once, and a re-sent journal
   changes nothing; a burst into a lock committed elsewhere is refused
   whole; publishing at the settled version succeeds, and is `stale` after
   another commit.

### Browser (`npm run test:e2e`)

9. `e2e/editor-operations.spec.ts` with `e2e/helpers/operations.ts`:
   - **24-S3-E1** a word is one operation, the status Saving… then Saved,
     the same letter again sends nothing; another word finalizes; a long
     run is cut at the maximum wait; hint and title bursts end on blur.
   - **24-S3-E2** a failing send shows "Not saved — retrying" and recovers;
     **reload with journaled operations** warns (`beforeunload`), restores
     them and saves them, the journal emptied; an operation that landed
     without its answer is re-sent after reload and applied once.
   - **24-S3-E3** **a refused burst** (a lock committed elsewhere) is
     explained, its input kept, the grid showing the saved letter; **Publish
     refused at a stale version** shows the message in the Publish dialog
     and publishes nothing.
   - **24-S3-E4** lock, Reset Grid, Enter Hints and Publish go through
     operations (the log's kinds, epoch 1, version = accepted operations).
   - **24-S3-E5** **a version-0 puzzle edited by the editor refuses
     snapshot writes**: an old tab's save (an action ID this build doesn't
     have) is a 404 with this deployment's ID and a reload without it, the
     row unchanged (**the removed actions are gone**); an editor tab of
     another build reloads into this one at its next save, keeping the burst.

### Amended acceptance

Earlier frozen tests asserting the removed actions; each change keeps the
intent that remains and carries a note citing 24-S3:

- `src/app/puzzles/actions.snapshot-fence.db.test.ts` (24-S1-16) —
  **deleted.** It called the five snapshot actions, which S3 removes as the
  EPIC requires. Superseded by 24-S3-11 (gone from the module and the app)
  and 24-S3-E5 (an old tab's save to a puzzle with a committed operation
  changes nothing).
- `src/app/puzzles/actions.publish-hints.test.ts` (14-S4: publishing needs
  every hint) — **deleted.** Only `publishPuzzle`, now removed. Its rules
  are pinned for `publishAtVersion` by 24-S2-11 (`incomplete`, a hint
  blanked between read and write) and by the engine's `hintsComplete`
  tests (missing, empty, whitespace-only).
- `src/app/puzzles/actions.builder-edits.test.ts` (O3) — the five snapshot
  actions leave its tables and their own cases go (publishing an eligible
  puzzle, publish rejections, the repeat Enter Hints snapshot, Enter Hints
  between read and write). `deletePuzzle` and the loader keep every case.
  The authority they checked is pinned on the commit path by 24-S1-8/13/17
  and 24-S2-8/11/12.
- `src/app/puzzles/actions.session.test.ts` — the five rows become
  `commitOperation` and `publishAtVersion`, refusing an invalid session
  before any data access.
- `src/app/puzzles/actions.username-gate.test.ts` (23-S3-U5) — the known
  actions lose the five and list `commitOperation` and `publishAtVersion`
  (already enumerated from the module).

### Discrimination

2026-11-13, with a prototype of the decisions above (set aside until the
freeze).

- With the prototype: every new unit and database case passed, and
  `e2e/editor-operations.spec.ts` alone passed 12 of 12 (with the setup).
- One rule removed at a time, the relevant unit files fail at least one
  case each: a resend reapplied (2 failed), the epoch not projected (2),
  the same letter counted as a change (2), the rebase dropping the draft
  (1), no maximum wait (3), several in flight (6), `busy` not retried (1),
  a redirect retried (1), no journal (1), no keepalive (1), journal order
  (1), stale epochs kept (1), no deployment-ID check (1), no loop breaker
  (1), any path redirected (1), the notice without the word (2), the
  loader without the version (1).
- In the browser, with journal adoption and the old-tab reload both
  disabled: exactly the four cases they serve fail (reload with journaled
  operations, the lost acknowledgment, the old tab's save, the old tab's
  reload); the other eight pass.
- Without the runtime (the baseline): the new unit and database files fail
  to import their modules (`outbox`, `burst`, `queue`, `journal`, `notice`,
  `stale-editor`); 24-S3-11 fails (the snapshot actions are exported); the
  browser cases fail (no save status, no operation log from the snapshot
  editor). The amended files pass both with and without the runtime.

## Repo paths

Acceptance: the files above. Runtime: `src/lib/collab/{outbox,burst,queue,
journal,notice}.ts`, `src/lib/stale-editor.ts`, `src/middleware.ts`,
`next.config.ts`, `src/app/puzzles/actions.ts`,
`src/app/puzzles/[id]/page.tsx`, `src/components/grid/{PuzzleGridEditor,
BuilderSteps,PublishDialog,SaveStatus,SaveNotices}.tsx`,
`src/components/grid/{editor-saver,useOperationSaving}.ts`,
`src/app/style-guide/page.tsx` (the dialog's new contract). Docs: this
story, `../EPIC.md` (the story link), `../HANDOFF.md`, `../../README.md`.

## Definition of done

- Frozen acceptance unchanged after the freeze.
- `npm run verify` exits 0; the full `npm run test:e2e` under the epic's
  evidence policy (one `--workers=2` run, every failing file rerun alone
  after `npm run pretest:e2e`).
- A PR into `epic/24-collaboration`, independently reviewed and merged by
  the reviewer. The human's visual check of the save status and the
  refusal note, and the Skew Protection check, are recorded as pending in
  the handoff.
