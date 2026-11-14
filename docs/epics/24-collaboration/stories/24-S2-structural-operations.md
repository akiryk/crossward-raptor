# Story S2 — Phase changes, locks, Start Over and Publish

The commit path learns the structural operations: `lock` and `unlock`
(lockability enforced by the server as `lockableWord` does), `enterHints`
(the server's current state converted atomically, blank hints seeded,
`gridBeforeHints` written once) and the owner's `startOver` (a new reset
epoch, with or without the locked words). Later Build operations are
validated against Hints. Publishing is pinned to the version the owner's
readiness check saw, refusing with an outcome the Publish dialog can show.
Every stale-operation rule is tested at the commit path. Nothing a builder
sees changes: the editor keeps the old actions until S3.

**Status: approved and frozen 2026-11-13** by the agent under the human's
delegation of every story's approval and freeze in this epic
([HANDOFF](../HANDOFF.md)). The baseline is the specification-only commit
on `epic/24-collaboration` that adds this file ("24-S2: freeze …"); its
hash is recorded in the handoff.

**Blast radius: risk story.** `src/lib/collab/**` and
`src/app/puzzles/actions.ts`. Branch `story/24-S2-structural-operations`
from the baseline, a PR into `epic/24-collaboration` and independent
review ([CODE-REVIEW](../../../CODE-REVIEW.md)). No migration: S1's
`version`, `resetEpoch` and log are all S2 needs.

## The human's request

[EPIC](../EPIC.md), Stories item 2, "Multi-user testing" (S2's row:
pre-reset, post-lock, post-Hints, post-publication), D3–D7,
"Implementation details" (Operations; Enter Hints and late Build edits;
Start Over) and Invariants 1–8, 13.

## What the code does today

`epic/24-collaboration` at `6a5c3af` (S1 merged).

- S1's commit path (`src/lib/collab/commit.ts`) commits `cells`, `hint` and
  `title`: authorize with `editableBy`, deduplicate by `opId`, validate
  purely (`apply.ts`) against the current state (publication, epoch, phase,
  locks), then compare-and-swap on `version` and log in one transaction,
  with bounded retry. Nothing increments `resetEpoch`.
- Locks live in the grid JSON (`lockedWords`); `lockableWord`
  (`src/lib/locked-words.ts`) needs a complete, Preview-white word of 3 or
  more from the cursor; the editor toggles them locally (`toggleLock`).
- The snapshot `enterHints` action converts with `enterHintsPhase`, drops
  the locks (`serializePuzzle`), seeds blank hints and writes
  `gridBeforeHints` (the pre-conversion cells, no locks) only on the
  Build → Hints crossing. A second call is a no-op.
- Start Over is the editor's `handleConfirmStartOver` (Build only):
  `clearOutsideLockedWords`, keeping the locks or not, saved by the grid
  autosave. It doesn't touch the title or hints.
- `publishPuzzle` is owner-only, from Hints with every required hint, the
  hints guarded by value; it doesn't know any version. All three snapshot
  writes are fenced to version 0 (S1).

## Decisions

From the EPIC (not restated): D3 (whole-burst refusal), D4 (any builder
enters Hints; later operations fit Hints or fail), D5 (Start Over
owner-only; the epoch refuses every earlier operation), D7 (publish pinned,
owner-only), the operation kinds and the envelope.

Drafting decisions (routine, made under the delegation):

1. **Shapes** (`parseOperation`). `lock` and `unlock` carry
   `word: { col, row, orientation: 'across'|'down', length }` (as
   `LockedWord` stores it; `length` 1–1024); `enterHints` has no body;
   `startOver` carries `keepLockedWords: boolean`. Malformed → `invalid`,
   not recorded (S1 decision 3). Publishing isn't an operation kind.
2. **Rules** (`validateOperation`, after S1's `published` then `epoch`):
   - **Owner-only**: `startOver` from someone not the owner → new code
     `owner`. `validateOperation` and `evaluateOperation` take an optional
     `committer: { isOwner }`; without it, the committer isn't the owner
     (safe default; S1's callers pass none and use no owner-only kind). The
     commit path passes `builderId === userId` and also puts `ownedBy` in
     the compare-and-swap's WHERE for owner-only kinds (Invariant 5).
     `ownedBy` (`access.ts`) is `{ builderId }` and stays so when S5 widens
     `editableBy`. Until S5 a non-owner gets `not-found` first, so the
     `owner` code is tested purely; S5 adds the collaborator case.
   - **lock**: Build only (`phase` in Hints). Accepted if the word is
     already locked (nothing changes); otherwise it must equal
     `lockableWord` from its first cell and direction in the current grid,
     else `invalid` (a word not lockable there, or changed since the lock
     was made).
   - **unlock**: Build only. Accepted whether or not the word is locked
     (two builders unlocking at once both succeed; the second changes
     nothing).
   - **enterHints**: Build only; in Hints → `phase` (S3 can read its own
     `phase` refusal as "already in Hints"). Not owner-only (D4).
   - **startOver**: owner-only, Build only (as the editor offers it).
3. **Application** (`applyOperation`, pure, reusing the engine and the
   locked-word helpers; the engine is unchanged):
   - lock/unlock change only `lockedWords` (absent when none).
   - enterHints is `serializePuzzle(enterHintsPhase(…))` of the current
     content: empty cells black, blank hints seeded for missing keys,
     existing hints kept, locks dropped, title kept.
   - startOver is `clearOutsideLockedWords` with the kept locks (all or
     none), title and hints kept.
   - **Previous values** (logged): `{ kind: 'lock'|'unlock', locked }` (was
     it locked); `{ kind: 'enterHints', lockedWords }` (the dropped locks;
     the grid before is `gridBeforeHints`); `{ kind: 'startOver', cells,
     lockedWords }` (each changed cell's previous value, row-major, and the
     locks before).
   - **The epoch**: `epochAfter(epoch, op)` is `epoch + 1` for startOver,
     else unchanged; `evaluateOperation`'s acceptance carries the new
     `resetEpoch`. S3/S4 clients use it to follow a reset from the log.
4. **Commit** (`commit.ts`): the changed columns per kind are lock/unlock
   `grid`; enterHints `grid`, `hints`, `phase` and `gridBeforeHints` (the
   pre-conversion cells without locks, `gridBeforeHints()`, as the snapshot
   action stores it), in the one compare-and-swap update; startOver `grid`
   and `resetEpoch` (the CAS already requires the operation's epoch). Since
   enterHints is accepted only from Build, `gridBeforeHints` is written once.
   Everything else is S1's: deduplication, recorded refusals, retries, the
   log, pruning, expiry. Each accepted structural operation advances the
   version by one.
5. **Publishing** (`src/lib/collab/publish.ts`, `publishPuzzleAt(db,
   userId, { puzzleId, version, visibility })`):
   - Not an operation: no `opId`, no log record, the version doesn't
     advance (Invariant 1 stays "operations"). S4's catch-up reports
     publication from the puzzle row; the commit path already refuses
     everything once published.
   - Owner-only: `editableBy` and `ownedBy` in the read and the write.
   - Checks in order: already published → if at the given version, the
     stored publication (a retry after a lost response succeeds); else
     `published`. Version differs → `stale`. Build → `phase`. A required
     hint missing → `incomplete`.
   - The write's WHERE repeats the version, Hints, unpublished, ownership
     and the hints by value (a version-0 snapshot save changes hints without
     a version). If it matches nothing, it re-reads once to name the
     refusal, else `stale`.
   - Outcomes: `published` (`publishedAt`, `visibility`, `version`),
     `refused` (`code`), `invalid` (malformed), `not-found`.
   - The action `publishAtVersion(input)` in `actions.ts`: `requireSession`,
     then publish as the session's account. S3's Publish dialog calls it in
     place of `publishPuzzle`, and words the codes.
6. **Old actions stay.** `enterHints`, `publishPuzzle` and the snapshot
   saves are unchanged and still fenced to version 0 (S1); the editor keeps
   using them until S3. `publishAtVersion` and the structural kinds are, like
   S1's commit path, used only by tests until S3: deliberate, not dead code.
7. **Tests.** A pure suite (parsing, rules, application, a randomized replay
   with structural kinds) and database suites in throwaway schemas (S1's
   `src/test-support/database.ts`). The racing client S1's commit test
   defines inline moves to `src/test-support/racing.ts` for the new suites
   (S1's frozen file is left as it is).

## Non-goals

- Any editor change: S3 sends these operations, shows outcomes and wires
  `publishAtVersion` into the Publish dialog.
- Wording the refusal codes; notes in the session panel (S3, S7).
- Catch-up reads and polling (S4); how a client learns of publication.
- Collaborators (S5): `editableBy` stays owner-only; `owner` refusals by a
  real collaborator are S5's to test.
- A way back from Hints to Build; changing who may publish.
- Removing `enterHints`, `publishPuzzle` or the snapshot saves (S3).
- Migrations: none.

## Acceptance (frozen)

New files; IDs in `describe` names.

### `src/lib/collab/structural.test.ts`

1. **24-S2-1 parsing:** lock, unlock, enterHints and startOver accepted with
   only known fields, as copies, input unchanged; 13 malformed shapes
   (missing or malformed words, orientations, lengths, `keepLockedWords`,
   a `publish` kind) refused.
2. **24-S2-2 lock and unlock:** a lockable word locks, keeping cells, other
   locks, hints and title, with previous `locked: false`; DOG (runs on into
   an empty cell), a 2-letter word, a word from its second cell, the wrong
   length or direction, and one outside the grid → `invalid`; relocking a
   locked word (even one no longer lockable) changes nothing; unlocking
   keeps letters, and of an unlocked word changes nothing; a lock then
   refuses a burst into its letter or end cell (`locked`) and unlocking
   frees it; in Hints both → `phase`; frozen inputs, idempotent.
3. **24-S2-3 enterHints:** the engine's conversion (empty cells black,
   hints seeded, an existing hint kept, locks dropped, previous locks);
   `phase` in Hints, any committer in Build; `gridBeforeHints()` is the
   cells without locks; afterwards letters into active cells fit, a clear
   or a black cell refuses the whole burst (`phase`), and lock and
   startOver → `phase`.
4. **24-S2-4 startOver:** `owner` without the owner or with a collaborator;
   clears every cell and lock, keeps title and hints, epoch 0 → 1, previous
   cells and locks; Keep Locked Words keeps letters and locks; epoch 4 → 5,
   and no other kind changes the epoch; after it every earlier-epoch kind →
   `epoch` (even into an untouched cell) while the new epoch fits; `phase`
   in Hints.
5. **24-S2-5:** every structural kind → `published` once published (Build
   and Hints) and `epoch` from an older or newer epoch.
6. **24-S2-6 replay (randomized, 300 seeds):** cells, title and every
   structural kind from tabs in the current or the previous epoch; never
   mutates; only current-epoch operations are accepted; replaying the
   accepted operations (`applyOperation` + `epochAfter`) from any version
   reaches the server's content and epoch; every kind is accepted
   somewhere.

### `src/lib/collab/structural.db.test.ts`

7. **24-S2-7 lock and unlock committed:** one version each, the stored
   locks and unchanged cells, log records with operation and previous; an
   unlockable word, and a word made unlockable by a burst committed after
   the lock was made → `invalid`, recorded, nothing written.
8. **24-S2-8 enterHints committed:** converts the server's current state
   (including a burst committed after the operation was made), writing
   grid, hints, phase and `gridBeforeHints` (without locks) at one version;
   a second is `phase` and leaves `gridBeforeHints` and the grid alone; a
   burst landing between its read and write is converted too (retry).
9. **24-S2-9 startOver committed:** from epoch 2 and version 3: version 4,
   epoch 3, the grid cleared, the log record; Keep Locked Words; `phase` in
   Hints with the row unchanged.
10. **24-S2-10 stale operations** (the EPIC's S2 row):
    - **pre-reset:** a burst into a cell the reset didn't clear, and every
      other kind made before it → `epoch`, recorded, the row unchanged, the
      same on resend; the same cell written in the new epoch is accepted. A
      reset landing between a burst's read and write refuses the burst.
    - **post-Hints:** an unlock and a lock made in Build → `phase`, a burst
      clearing a cell → `phase` (whole), the row unchanged; a late burst
      writing a letter is accepted.
    - **post-lock:** bursts made before a lock into its letter and its end
      cell → `locked`, whole; a same-value write beside a new cell is
      accepted; a lock landing between a burst's read and write refuses it.
    - **post-publication:** cells, hint, title, lock, unlock, enterHints and
      both startOvers → `published`, recorded, the row unchanged.

### `src/lib/collab/publish.db.test.ts`

11. **24-S2-11 publishing pinned:** at the current version: published
    (`publishedAt`, visibility), version unchanged, nothing logged; a repeat
    at that version returns the stored publication, at an earlier one →
    `published`; a version the puzzle has moved past → `stale`, the row
    unchanged, then publishing at the new version succeeds; a letter or a
    hint committed between its read and write → `stale`; a hint blanked
    between them without a version → `incomplete`; Build → `phase`; a
    missing hint → `incomplete`; another builder's or a missing puzzle →
    `not-found`; nine malformed inputs → `invalid`, nothing written.

### `src/app/puzzles/actions.publish-at-version.db.test.ts`

12. **24-S2-12 the action** publishes as the session account (an input
    `userId` ignored); a stale version → `{ refused, stale }`; another
    builder's puzzle → `not-found`; no session or no username → refused
    before writing.

### Support (frozen with the acceptance)

`src/test-support/racing.ts` (decision 7).

### Discrimination

2026-11-13, with a prototype of the decisions above (set aside until the
freeze). The four files against the prototype with one rule removed at a
time; each fails at least one case:

- owner check: 1 failed; lockability: 2; the lock's phase rule: 3; the
  unlock/enterHints/startOver phase rule: 7; the epoch bump (pure): 7; the
  epoch bump written: 4; `gridBeforeHints` written: 2; Keep Locked Words
  ignored: 2; enterHints keeping locks: 3; the word's length limit: 3;
  publish: version in the write's WHERE: 1, hints guard: 1, the repeat's
  stored answer: 1, the hints check: 2, the phase check: 1, ownership: 2.
- Not discriminated, by design: publishing's version pre-check alone (the
  write's WHERE and the re-read still answer `stale`, the same outcome);
  `ownedBy` in the startOver CAS (indistinguishable from `editableBy` until
  S5).
- Without the runtime (the baseline): every new file fails to import or
  type-check its module (`publish.ts`, `epochAfter`, `gridBeforeHints`, the
  new kinds).
- With the prototype: `npm run verify` exited 0 (1156 tests).

## Repo paths

Acceptance: the files above. Runtime: `src/lib/collab/{operation,apply,
access,commit,publish}.ts`, `src/app/puzzles/actions.ts`. Docs: this story,
`../EPIC.md` (the story link), `../HANDOFF.md`, `../../README.md`.

## Definition of done

- Frozen acceptance unchanged after the freeze.
- `npm run verify` exits 0. The full `npm run test:e2e`, under the epic's
  evidence policy (HANDOFF, "Verification"): one run with `--workers=2`
  and every failing file rerun alone after `npm run pretest:e2e`. The
  editor is untouched, but `actions.ts` is on its save path.
- A PR into `epic/24-collaboration`, independently reviewed and merged by
  the reviewer; the handoff records observed results.
