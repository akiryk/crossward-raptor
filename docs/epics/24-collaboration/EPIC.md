# Epic: Collaborative puzzle construction

**Draft; direction approved, story split under review.** Written 2026-11-09
from the human's draft epic, the agent's technical investigation and the
human's decisions on it (D1–D9, 2026-11-09). On 2026-11-12 the human
approved the architecture, the product decisions and the general order, and
asked for smaller stories, the open questions folded into the decisions, and
explicit plans for old browser tabs and multi-user testing. This revision
does that and awaits the human's review of the new split. Each story's
specification and acceptance are then drafted, approved and frozen on their
own ([STORY](../../process/STORY.md)). Approving the epic authorizes no
implementation, migration, service or production change.

A puzzle's owner invites collaborators by email. Collaborators open the
puzzle and edit its grid and hints alongside the owner. Each builder sees
the others' changes within about a second, with no refresh, Save button,
word reservation or conflict dialog. When two builders write the same
cells, the edit the server commits last wins. A builder whose recent work
is replaced sees a brief red outline and an informational note in a
session activity panel. Construction stays the same for someone working
alone, but it saves more reliably.

## The human's request

Restated from the human's draft epic, decisions (2026-11-09) and review
(2026-11-12):

1. **Per-puzzle collaboration.**
   - A puzzle has one owner and any number of collaborators.
   - The owner adds and removes collaborators by email. An invitee may not
     have an account yet. Storing the address is enough; sending an
     invitation email is optional.
   - Once an invitee signs in with that address (and has a username), the
     puzzle is in their library.
   - Collaborators have equal authority over the grid, the hints and
     locks, including unlocking another builder's lock.
   - Only the owner manages collaborators, deletes, publishes or starts
     over.
2. **Live editing.**
   - Changes reach other open editors almost immediately, without a
     refresh.
   - Edits go up in short completed bursts.
   - Remote changes never interrupt typing or move anyone's cursor,
     selected cell, direction or focus.
   - The server's state is authoritative.
   - Edits are durable once acknowledged.
   - Failures are visible and recoverable.
   - Reconnecting restores a consistent state.
3. **Conflicts.**
   - The edit committed last wins, with no exclusive word ownership, no
     reservations and no dialogs.
   - A builder whose recent work was replaced sees a red outline (fading
     in, about 1–2 s, fading out) and a timestamped note such as
     "10:22 — Jay changed 2-Down from MASKS to MAGIC."
   - Routine remote edits sync silently.
4. **Session activity panel.**
   - The panel appears, animated, when a second builder joins. It sits
     between the toolbar and the grid, as in the mockups.
   - It holds timestamped notes of meaningful events only (joins, leaves,
     superseded work), not an edit log.
5. **Presence.** Builders can see who else is in the puzzle, by username,
   with internal identity by account ID.
6. **Keep the existing construction model**: the phases, locking,
   rebus, the engine's invariants and purity, Preview and publishing.
7. **Safe persistence is a core requirement, not an enhancement.**
   - Snapshot autosaves are replaced by semantic operations.
   - Commits are server-ordered, per-puzzle versioned and compare-and-swap.
   - Operation IDs make retries safe.
   - There is one saving system for single and shared editing.
   - The server validates operations and enforces permissions and locks.
   - A stale or out-of-order request can never destroy unrelated work.
8. **Use the finished account system** (epic 23):
   - magic-link sign-in;
   - the required username;
   - stable account IDs;
   - non-unique usernames;
   - verified email changes;
   - the server-side username gate.
9. **Reviewable delivery** (2026-11-12).
   - Stories small enough to review and test on their own.
   - Tabs still running the old editor during the switch from snapshot
     saves can't overwrite work, and their builders aren't left silently
     losing edits.
   - Explicit multi-user tests of overlapping edits, permission revocation
     and reconnecting.

Mockups (2026-11-08), consecutive moments of one session:

- [01 Open grid](assets/01-open-grid.png): the build phase, ABRAHAM in
  1-Across and its M starting 2-Down. One builder; no activity panel.
- [02 Jay joins](assets/02-jay-joins.png): a panel between the Preview row
  and the grid, with a date heading ("Nov 8, 2026") and
  "10:17 Jay just joined the session!".
- [03 MASKS](assets/03-masks.png): MASKS typed into 2-Down. The cursor is
  on the last S (yellow); the rest of the word is light blue. The panel
  shows no new message.
- [04 MAGIC wins](assets/04-magic-wins.png): 2-Down reads MAGIC, outlined
  in red, with the selection unchanged, and the panel adds
  "10:22 Jay changed 2-Down from MASKS to MAGIC."

The four screens show the intended experience, not the implementation.

## What the code does today

- **Ownership.**
  - `Puzzle.builderId` is the only owner (`prisma/schema.prisma`; the
    `20261017220000_add_puzzle_builders` migration).
  - Every read and write repeats `builderId: session.user.id` in its own
    `WHERE` (`src/app/puzzles/actions.ts`); there's no shared
    authorization helper.
  - The library lists the caller's own puzzles plus published ones
    (`listPuzzles`). Its row menu (Duplicate, visibility, Delete) and the
    Create filters (`src/lib/puzzle-filters.ts`) key on
    `builderId === userId`.
- **Accounts** (epic 23, closed 2026-11-09).
  - The username is `User.displayName`, which is nullable and not unique.
  - `requireSession()` (`src/lib/require-session.ts`) admits only an
    account with a username, and every puzzle page and action uses it.
  - Email is unique on `User`. An email change is confirmed by the new
    address (`src/lib/auth.ts`).
- **Editor state.**
  - `PuzzleGridEditor.tsx` holds one React `EditorState`: grid, locked
    words, cursor, phase, hints, title, publication and visibility.
  - Edits are `setState` updaters calling pure helpers (`withLetter`, the
    cursor functions, `toggleLock`, `clearOutsideLockedWords`).
  - Preview, Lock Grid Letters and Preview Hints are local view state.
- **Saving.**
  - Three effects diff the state against the last-saved value. Each
    debounces 500 ms (trailing, with no maximum wait), then sends a whole
    snapshot:
    - `saveGrid`: every cell, plus `lockedWords`, into the `grid` JSON;
    - `saveHints`: the whole clue map;
    - `saveTitle`.
  - There is no version, and saves can complete out of order.
  - The server doesn't validate the grid or hints shape.
  - Failures only `console.error`.
  - Leaving the page can drop the last edit.
  - `flushPendingSaves` re-sends all three before entering Hints or
    publishing.
- **Build-phase words are derived, not stored.**
  - Every cell is active.
  - A word (`buildWord`, `src/lib/build-word.ts`) is a run of cells that
    `intendedGeometry` (`src/engine/puzzle-geometry.ts`) keeps white: those
    with a letter, or whose 180° counterpart has one.
  - One letter can merge or split words and renumber later entries,
    including through its counterpart.
- **Locks** (21-S2, 21-S3).
  - A lock is `{col, row, orientation, length}`, stored in the grid JSON.
  - Its letters and end cells are protected (`isCellProtected`,
    `src/lib/locked-keys.ts`), on the client only.
  - Locking needs a complete, Preview-white word of 3 or more letters
    (`lockableWord`).
- **Entering Hints.**
  - `enterHints` reads the puzzle, converts empty cells to black
    (`enterHintsPhase`), seeds blank hints and writes `gridBeforeHints`
    once.
  - The write has no version guard, so a save landing between its read
    and write is lost.
  - The Hints phase has no locks.
  - There's no way back to Build.
- **The Hints phase.**
  - The geometry is fixed and deleting letters is blocked, so numbering
    and hint keys (`"<n>-across"`, `src/engine/hints.ts`) are stable.
  - Letters, including rebus, can still change unless Lock Grid Letters
    is on.
  - Clues are edited only here.
- **Publishing** (`publishPuzzle`) is owner-only, from the Hints phase,
  with every required hint written. The update is guarded on the hints by
  value, but not on the grid. A published puzzle accepts no edits.
- **Start Over** (`StartOverDialog`, `handleConfirmStartOver`) clears the
  grid, optionally keeping locked words, and is saved by the grid
  autosave.
- **Deployment.**
  - Vercel, with Neon in production over `PrismaNeon` and local Docker
    Postgres over `PrismaPg` (`src/lib/prisma.ts`).
  - `main` deploys automatically.
  - Migrations are a separate, authorized step
    ([DEVELOPMENT](../../DEVELOPMENT.md)).
  - There is no real-time transport.
- **Browser tests** sign in one seeded user (`e2e/auth.setup.ts`).
  `e2e/helpers/ownership.ts` can seed another builder.

## Stories (proposed order)

The persistence stories come first. Once a second person can open the
editor, today's whole-snapshot saves would overwrite each other's work,
so membership waits until saving is safe and live. Every story touches
`prisma/**`, `src/app/puzzles/actions.ts`, the editor's save path or another
authenticated write path, so each one gets a branch, a PR and independent
review ([CODE-REVIEW](../../CODE-REVIEW.md)). A story with a migration
merges only after that migration is applied to production, with
authorization (DEVELOPMENT, "Production database migrations"). Only S1 and
S5 have migrations; S7 has one if presence needs its own table.

Nothing a builder can see changes until S3, and no second person can reach
a puzzle until S6 lets the owner invite them. S1, S2, S4 and S5 can
therefore merge and deploy without changing anyone's experience.

1. **S1 Operations and the commit path (C2a).**
   - Schema: `Puzzle.version`, `Puzzle.resetEpoch` and the operation log.
     These are the epic's only puzzle columns, so S2 needs no migration.
   - The operation envelope and the content kinds: `cells`, `hint` and
     `title`. Pure application and validation in `src/lib/collab/`, with a
     randomized convergence test.
   - Validation against the current state: phase (including the Hints
     rules for existing Hints-phase puzzles), publication, the epoch, and
     cells protected by existing locks (D3's whole-burst rejection).
     Existing puzzles already have locks, so a `cells` validator that
     ignored them would be wrong from its first commit.
   - The commit path: compare-and-swap, `opId` deduplication, one
     transaction for the puzzle row and its log record, bounded retry on a
     lost race, and log pruning.
   - The snapshot fence for old tabs (see "Retiring snapshot saves").
   - Adds `src/lib/collab/**` and the commit route to CODE-REVIEW's risk
     paths.
   - The snapshot save actions stay until S3. Until then only tests use the
     commit path; that is deliberate, not dead code.
   - Depends on: nothing.
2. **S2 Phase changes, locks, Start Over and Publish.**
   - The structural operations: `lock` and `unlock`, `enterHints` and
     `startOver` (owner-only, incrementing `resetEpoch`).
   - Enter Hints converts the server's current state atomically; late Build
     operations are then validated against Hints.
   - Publishing pinned to the version the owner's readiness check saw.
   - Every stale-operation rule tested at the commit path: an operation
     from before a reset, a lock or unlock from Build arriving in Hints, a
     burst into a cell locked after it was made, anything after
     publication.
   - These touch the destructive and one-way transitions, so they get their
     own review rather than riding with S1's ordering machinery.
   - Depends on: S1.
3. **S3 The editor saves by operations (C2b).**
   - The editor dispatches operations over a confirmed state plus pending
     operations.
   - Bursts, with a maximum wait; one in-flight operation per tab, in order.
   - Retries; the save status; refused edits explained, with the input kept.
   - The `localStorage` journal, the `beforeunload` warning and the
     keepalive send.
   - Enter Hints, Start Over and Publish move to S2's operations.
   - Removes `saveGrid`, `saveHints` and `saveTitle`, and handles tabs still
     running the old editor (see "Retiring snapshot saves").
   - Single-builder behavior is otherwise unchanged; the full browser suite
     proves it.
   - Depends on: S2.
4. **S4 Live sync by polling (C3a).**
   - Catch-up "operations since version N" about once a second while the
     editor is visible, and at once on becoming visible again.
   - Remote operations of every kind, phase changes and resets included,
     applied to the confirmed state without touching local view state.
   - Recovery after a disconnection; a snapshot reload past the log's
     retention.
   - Latency and request-cost measurements recorded for the push decision.
   - Proven with two browser contexts of one account, which needs no
     membership: overlapping edits converge, compatible edits both survive,
     and a context taken offline and back catches up.
   - Depends on: S3.
5. **S5 Collaborator membership and authorization (C1a, server side).**
   - Schema: the collaborator and invitation tables.
   - One "editable by" predicate in every write's own `WHERE`: the commit
     path, the catch-up read, the editor page and every remaining action.
   - Owner-only Start Over, Publish, Delete and collaborator management,
     enforced on the server.
   - Invitation rules and claiming, as server functions with integration
     tests; the add, remove and revoke actions without their UI.
   - The editor for a collaborator: it opens a shared puzzle and hides the
     owner-only controls.
   - Losing access while open (removal, deletion, publication): the queue
     stops and the editor becomes read-only, with unsaved input copyable.
   - A second seeded user for browser tests. Tests seed membership
     directly, since S6 adds the way to invite.
   - Depends on: S4, so that shared editing is safe and live once
     reachable, and so an open editor learns of removal by polling.
6. **S6 Collaborator management and the library (C1a, UI).**
   - The owner's "Collaborators…" dialog from the row menu and the editor:
     an email field, the list, pending invitations, remove and revoke.
   - The library: shared rows with the owner's username, Create filters
     counting editable puzzles, and Duplicate as a collaborator's only row
     action.
   - The first story that lets a second person reach a puzzle.
   - Depends on: S5.
7. **S7 Presence, the session panel and conflicts (C4a).**
   - The presence heartbeat; join and leave notes.
   - The activity panel and its animation.
   - Conflict outlines and clue highlights by the D2 rule; notes for phase
     changes, Start Over and refused edits.
   - The four-screen scenario and the rest of the two-user browser tests
     (see "Multi-user testing").
   - Depends on: S6.

**Why not other boundaries.**

- *Lock enforcement sits in S1, the lock operations in S2.* Validating a
  burst means checking it against the locks already stored; a
  lock-blind S1 would commit edits the server must refuse.
- *The client journal and leave protection stay in S3.* They only make
  sense once the editor sends operations, and S3's single-builder browser
  suite is what proves them.
- *Collaborator-side editor changes sit in S5, not S6.* The server refusing
  Start Over to a collaborator and the editor hiding it belong together;
  S6 is the purely additive management UI.
- S5 and S6 could be one story, and S1 and S2 could merge back. Both
  splits follow the human's request for smaller reviews and leave every
  story testable alone.

Push transport (WebSockets or a hosted service) is outside this epic
unless S4's measurements show polling can't meet "almost immediate".
That would then be a separately approved story, needing no persistence
redesign.

## Retiring snapshot saves (old tabs)

A tab loaded before S3 deploys keeps running the old editor, possibly for
hours. It sends whole-snapshot saves, and its failures only reach the
console. The transition must never let such a tab overwrite committed
operations, and must not leave its builder silently losing work.

- **The fence (S1).** Every snapshot write (`saveGrid`, `saveHints`,
  `saveTitle`, the old `enterHints` and `publishPuzzle`) adds `version = 0`
  to its `WHERE`. Until S3 no real client commits an operation, so every
  puzzle stays at version 0 and today's editor is unaffected. After S3 the
  first committed operation moves a puzzle off 0, and from then on any
  snapshot write to it matches no row and changes nothing.
- **S1 deploys well before S3.** If the deployment keeps old clients on
  their own build (Vercel Skew Protection), a tab could still reach
  pre-fence code. S3 checks the project's setting. If it is on, S3 deploys
  only after its maximum age has passed since S1 deployed.
- **Old tabs reload (S3).** S3 removes the snapshot actions. A call from an
  old tab then fails rather than writing. S3 also makes an old tab reload
  into the new editor at its next server call, where Next.js supports that
  (a deployment ID or an equivalent version check). It then specifies, and
  tests, what an old tab's builder sees. At most the burst that triggered
  the reload is lost, and the reload makes that visible.
- If reloading old tabs requires a Vercel project setting, that is an
  infrastructure change. It needs the human's authorization at S3.
- **Tests.** S1 proves a snapshot write to a puzzle at version 1 or more
  changes nothing. S3 proves the removed actions are gone and that a
  version-0 puzzle edited by the new editor then refuses snapshot writes.

## Multi-user testing

Concurrency is proved at two levels. Integration tests drive the commit
path with interleaved requests. Browser tests use separate contexts that
poll for real. The suites share one database, so they run serially
([AGENTS](../../../AGENTS.md)).

| Behavior | Integration (commit path) | Browser |
| --- | --- | --- |
| Overlapping edits | S1: interleaved bursts, commit order wins per cell; compatible edits both survive | S4: two contexts of one account converge; S7: Adam and Jay, the four-screen scenario and the MAGKS variant |
| Stale and invalid operations | S2: pre-reset, post-lock, post-Hints, post-publication | S4: a Start Over or Enter Hints from another context; S7: the notes Jay sees |
| Permission revocation | S5: a removed collaborator's operations and catch-up are refused | S5: removal (seeded) while Jay's editor is open; S6: Adam removes Jay in the dialog while Jay edits |
| Reconnect | S1: resending an `opId` returns its first outcome | S3: reload with journaled operations; S4: offline, edit elsewhere, back online; S7: Jay reconnects mid-session and sees no false conflict |

Each story's acceptance carries its rows. None is deferred to a manual
check.

## Decisions

### From the human

**Architecture (approved direction).**

- Next.js, React, Prisma, PostgreSQL/Neon and Vercel stay.
- PostgreSQL is the source of truth.
- Semantic operations replace snapshot saves.
- Commits are server-ordered, with a per-puzzle version and
  compare-and-swap.
- Operations carry unique IDs, for retry and deduplication.
- The engine is preserved.
- Clients keep the confirmed state separate from pending operations.
  Remote operations apply to the confirmed state, with pending edits
  reapplied for display.
- Bursts start from today's 500 ms debounce, plus a maximum wait.
- One saving system serves single and shared editing alike.

**D1 — What a burst overwrites.**

- A burst writes only the cells its builder changed. It never writes a
  whole entry as that builder saw it.
- The server applies a burst's writes atomically, in commit order; on
  overlapping cells the later commit wins.
- MASKS, then Jay typing MAG over its first three cells, gives MAGKS. In
  the mockups Jay changes every cell under the M, so MAGIC replaces
  MASKS.
- Crossward doesn't check words. The UX may still describe and outline
  entries.

**D2 — When a conflict is shown.**

- Another builder's committed edit supersedes me when it changes a cell
  I recently edited to a different value. That covers:
  - the cells of my latest burst, while my cursor stays in the entry
    holding them;
  - after I move away, those cells for about **3 s** after that burst
    completed (a tunable starting value).
- After that, and for anything else, remote edits sync silently.
- A conflict shows a red outline on the affected entry or cells (fade in,
  about 1–2 s, fade out) and a timestamped note.
- Neither changes my selection, cursor, direction or focus.
- When the entry's number or shape has changed, the note describes the
  affected cells accurately, rather than inventing a before-and-after
  entry.

**D3 — Editing into a lock.**

- A burst that would change a protected cell, as the server sees it at
  commit, is **rejected whole**, never partly applied.
- The builder's attempted input is kept for recovery, with a non-blocking
  explanation such as "This answer was locked while you were editing.
  Unlock it to make changes."
- Any collaborator can unlock.
- Operations that become invalid between sending and commit are handled
  the same safe way.

**D4 — Entering Hints.**

- Any collaborator may move the shared puzzle into Hints.
- The server converts its current state atomically.
- Everyone's editor updates, and the panel notes "Jay moved the puzzle to
  Create Hints."
- Later pending operations are validated against the Hints phase; those
  that don't fit fail visibly.
- The initiating browser doesn't assume success until the server
  confirms.
- (There is no way back to Build today, and this epic adds none.)

**D5 — Start Over is owner-only, always.**

- The owner's confirmation says that the shared puzzle, including
  collaborators' work, will be reset.
- Connected builders are told, and their editors update.
- A reset generation (the epoch) refuses every operation created before
  the reset, so a late edit can never rebuild cleared content. This rule
  is not left to last-writer-wins.

**D6 — Duplicate.**

- Collaborators may duplicate a shared puzzle. The copy is theirs alone,
  with no collaborators or invitations, and the original is untouched.
- The library shows the original owner's username on the shared puzzle.

**D7 — Publishing is owner-only.**

- Publishing is pinned to the version the owner's readiness check saw.
  If the puzzle changed since then, publishing stops with a message in
  the existing Publish dialog.
- Once published, every editor shows the read-only published state.
  Pending edits that can't be accepted fail visibly.

**D8 — Smaller conventions.**

- **Join notes.** Others see "Jay joined the session." Jay sees "You
  joined. Adam is here." Both use real usernames.
- **Panel placement.**
  - Build: between the Preview row and the grid.
  - Hints: in the same place, under the Lock Grid Letters row.
- **Panel behavior.**
  - It respects the responsive layouts and carries the mockups' date
    heading.
  - It animates in when another builder joins, then stays for the
    session.
  - New notes don't shift the grid; the panel scrolls once full.
- **Clue conflicts.** A superseded clue I recently edited gets a brief
  highlight on its input and a note, by the D2 rule.
- **Same account, two tabs.** These sync correctly but raise no conflict
  alerts.
- **Routine remote changes.** These are silent. The panel holds
  meaningful session events, not revision history.

**D9 — Polling first.**

- Each visible editor checks for committed changes about once a second,
  and immediately when its tab becomes visible.
- Bursts are sent as soon as they complete.
- Missed operations are recovered after a disconnection.
- The transport stays separate from persistence.
- S4 measures latency and cost before any push transport is considered.
- No WebSockets, Redis, CRDTs or hosted collaboration service in this
  epic.

**Saving status.**

- A restrained indicator shows "Saving…", "Saved" or "Not saved —
  retrying".
- There are no dialogs for ordinary transient failures.
- A permanently refused edit gets a clear, non-blocking explanation, with
  the input kept where practical.

**Leaving with unsaved edits.**

- A keepalive request may be attempted, but it is never treated as proof
  of saving.
- Unsaved work needs a warning or recovery strategy (proposed below).

**Data and the solo experience.**

- Migrations are additive and preserve every puzzle, owner, auth record
  and puzzle content. Production migrations are never part of routine
  deployment.
- A builder working alone sees no collaboration-specific complications.

**Membership by account.**

- Invitations are addressed to emails. Established membership is keyed
  by `User.id`.
- Changing an email or username never removes access.
- Usernames are display only, never authorization.

### Resolved with the epic's approval (2026-11-12)

The human approved the architecture and product decisions as drafted. The
draft's open questions are therefore settled as it suggested:

- **Remote selections are out of this epic.** Polling would make them lag
  about a second. A later push transport can revisit them.
- **Collaborator management** is a "Collaborators…" item in the owner's
  row menu and in the editor. It opens the existing modal with an email
  field and the list (S6). A mockup from the human, if any, settles the
  look in S6's specification.
- **The implementation details below are approved**, including:
  - the 2 s maximum wait;
  - the 30-day invitation expiry;
  - binding an invitation at once to an existing account;
  - the `localStorage` journal with a `beforeunload` warning.

  The tunable values (the maximum wait, D2's 3 s, the expiry, the presence
  window and the log's retention) are starting points that a story may
  adjust with a recorded reason.
- **Risk paths.** S1 adds `src/lib/collab/**` and the commit route to
  CODE-REVIEW's risk paths. Every story here is reviewed either way.
- **Smaller stories.** The five stories became seven, and the transition
  from snapshot saves and the multi-user tests are now explicit plans
  (Stories, "Retiring snapshot saves", "Multi-user testing").

### Implementation details (approved 2026-11-12)

**Operations.**

- **Kinds:**
  - `cells`: a burst's writes, each a cell and its new value (a letter, a
    rebus string or null);
  - `lock` and `unlock` (a word);
  - `hint` (a key and its whole text);
  - `title`;
  - `enterHints`;
  - `startOver` (keep locked words or not).
- **Envelope:** each operation carries an `opId` (a client UUID), the
  tab's `clientId`, the `resetEpoch` it was made in, and the version it
  was made against.
- **Purity:** application and validation are pure functions over the
  stored puzzle in `src/lib/collab/`, reusing the engine and the
  locked-word helpers. A helper that belongs in the engine (a batched
  `withLetter`, say) goes in `src/engine/**`, keeping the engine pure.
- **A burst** finalizes on any of:
  - 500 ms idle;
  - a 2 s maximum wait;
  - the cursor leaving the word or changing direction;
  - the grid losing focus;
  - Start Over, a step button or Publish;
  - the page being hidden or closed.

  Typing a letter a cell already holds isn't a change. A hint or title
  burst is that field's own 500 ms debounce, 2 s maximum or blur.

**The commit path.**

- A server action, plus a route handler for keepalive sends on leaving.
- It authorizes, then deduplicates: a known `opId` returns its recorded
  outcome.
- It reads the puzzle and its version, then checks the epoch, the phase,
  publication and every rule against the current state.
- It applies the operation purely, then writes it with
  `updateMany({ where: { id, version, publishedAt: null, …editableBy } })`,
  incrementing `version` and recording the operation in the same
  transaction.
- If no row matched, it retries from the read a few times.
- The version an operation was made against is used for detecting
  conflicts, never for refusing an edit. That is why compatible edits
  always both survive.

**The operation log.**

- Each record: puzzle, version, `opId` (unique), user, client, the
  operation, the cells' previous values (for "from MASKS") and the time.
- It serves catch-up, deduplication and conflict notes, and is pruned to
  a bounded window (for example, 24 h or the last 500 per puzzle).
- A client behind the window reloads the snapshot.
- It is synchronization metadata, not revision history: nothing reads it
  as history and nothing restores from it.

**Client order.** One tab sends its operations one at a time, in order.
The acknowledgment carries the new version and the outcome.

**Unsaved work on leaving.**

- Pending operations are also journaled in `localStorage`, per puzzle and
  epoch, until acknowledged.
- `beforeunload` warns while anything is unacknowledged.
- On the next open, journaled operations are re-sent with their original
  `opId`s, so one that did land isn't applied twice. One that's now
  invalid fails visibly.
- A keepalive send is attempted on leaving, and counts for nothing until
  acknowledged.

**Rejected bursts are recoverable.**

- The refused input appears in the note (for example, "Your MAGIC in
  2-Down wasn't saved: the word was locked") and stays copyable for the
  session.
- The grid shows the authoritative cells, not the unsaved letters.

**Enter Hints and late Build edits.**

- After Enter Hints, a pending burst is accepted only if every cell it
  writes is still active and it clears none, which the Hints phase
  forbids. Otherwise it is rejected whole (D3's all-or-nothing) and
  reported.
- A lock or unlock made in Build fails in Hints.

**Start Over.**

- The owner's Start Over increments `resetEpoch`.
- An operation from an earlier epoch is refused, even one touching cells
  the reset didn't clear. Its author is told: "Not saved: Adam started
  over."
- The Start Over control isn't shown to collaborators, and the server
  refuses it from them.

**Invitations.**

- Emails are stored trimmed and lowercased.
- If an account already has the address, the invitation binds to that
  account at once.
- Otherwise it is claimed the first time a username-gated request comes
  from an account whose current email matches.
- An unclaimed invitation expires after 30 days.
- The owner sees each one as pending, or by the claimer's username, and
  can revoke either. The owner never sees a collaborator's later email.

**Losing access while editing.**

- Removal, deletion and publication all stop the edit queue.
- The editor shows a non-blocking explanation and becomes read-only.
  Unsaved input stays copyable.

**Presence.**

- Each tab sends a heartbeat with its catch-up request: its account,
  `clientId` and last-seen time.
- A builder is present if seen within about 15 s. A tab that is closing
  sends an explicit leave.
- Builders are shown once per account, however many tabs.
- Join and leave notes come from changes to the present set.

**The save status** shows for everyone, solo builders included. Its exact
place and look are set in S3's specification, with a mockup if the human
wants one.

**The library.**

- Shared puzzles appear in a collaborator's library.
- Create filters count puzzles the caller can edit.
- A collaborator's row menu offers Duplicate only. Visibility and Delete
  stay with the owner.

## Invariants

Each story's acceptance pins the invariants it introduces.

1. **One order.**
   - Every accepted operation advances its puzzle's `version` by exactly
     one, under compare-and-swap.
   - The puzzle row and the operation record are written in one
     transaction.
   - The server's commit order is the only order.
2. **Exactly once.** An `opId` is applied at most once. Resending returns
   its first outcome.
3. **Current state.**
   - Operations are validated against the server's current state, never
     the sender's view.
   - A burst writes only its own cells, so edits to other cells are
     never lost.
4. **All or nothing.** A burst, Enter Hints and Start Over each apply
   entirely or not at all.
5. **Authority.**
   - Permission is checked in the write's own `WHERE`, by `User.id`.
   - Start Over, Publish, Delete and collaborator management are
     owner-only.
   - A username is never an identifier.
6. **Locks hold on the server.**
7. **Resets are boundaries.** An operation made before a reset is never
   accepted after it.
8. **Phases and publication.**
   - Enter Hints converts the state as committed at that moment.
   - Later operations must fit the Hints phase.
   - Nothing is accepted after publication.
   - Publishing commits only the version the owner checked.
9. **Local stays local.** Cursor, selected cell, direction, focus,
   Preview, Lock Grid Letters, Preview Hints and open dialogs are never
   synchronized or changed by a remote operation.
10. **Nothing lost silently.** Every operation ends acknowledged or
    visibly refused. Unacknowledged operations survive a reload.
11. **Convergence.** Clients that have applied the same versions show the
    same puzzle, apart from their own pending edits.
12. **Old clients can't overwrite.** Once a puzzle has a committed
    operation, no snapshot write changes it.
13. **A pure engine.** No React, DOM, database, network or hidden state in
    `src/engine/**`.

## The four-screen scenario (key acceptance example)

S7's two-user browser test plays this sequence. Adam owns the puzzle and
Jay is a collaborator.

1. Adam opens a Build-phase puzzle with ABRAHAM in 1-Across. There is no
   activity panel.
2. Jay opens it.
   - Adam's panel animates in between the Preview row and the grid, with
     the date heading and "HH:MM Jay joined the session."
   - Jay's panel says "You joined. Adam is here."
3. Adam types MASKS down from the M. His burst commits and is
   acknowledged, and Jay's grid shows MASKS within about a second. Adam
   sees no outline and no new note.
4. Jay types MAGIC over the same cells, and his burst commits after
   Adam's.
   - Within about a second, Adam's grid shows MAGIC.
   - 2-Down's cells are outlined in red, which fades in, holds about 1–2 s
     and fades out.
   - Adam's panel adds "HH:MM Jay changed 2-Down from MASKS to MAGIC."
   - Adam's cursor stays on the last cell, his direction stays Down and
     focus stays on the grid. Typing continues with no dismissal.
   - Jay sees no outline.
5. Variant: Jay types only MAG. The result is MAGKS, and Adam's note
   reads "… from MASKS to MAGKS."
6. Variant: Jay changes 1-Across elsewhere while Adam types in an
   unrelated word. Both edits persist, with no outline and no note.

## Non-goals

- Collaborative solving.
- Showing which entry another builder has selected.
- Revision history, restoring versions, collaborative undo.
- Chat or comments.
- Exclusive editing locks or word reservations.
- Conflict dialogs or manual conflict resolution.
- A note for every remote edit, or any comprehensive activity log. The
  panel isn't persisted.
- Relationships between users outside a puzzle.
- Unique usernames, avatars or profiles.
- WebSockets, Redis, CRDTs, a hosted collaboration service or another
  database.
- Sending invitation emails (optional in the request; deferred).
- A way back from Hints to Build.
- Changing who may publish or delete.
- Rewriting the engine.
- A collaborator leaving a puzzle on their own (the owner removes them).
