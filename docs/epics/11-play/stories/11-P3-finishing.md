# Story P3 — Finishing

Tell the player when a full grid is wrong, celebrate a correct finish, and
reopen a solved puzzle locked without repeating the celebration.

**Status:** complete, independently reviewed and merged in
[PR #22](https://github.com/akiryk/crossward-raptor/pull/22) at `4cfa4d7` on
2026-10-19. Specification and
acceptance were approved and frozen in `d1570e0`; the separately approved
one-line recovery-clock correction is refrozen on main in `dbc3ee8`.
P1/P2 acceptance remains immutable.
**Blast radius: high:** server write actions and pure engine comparisons.

## Decisions

Inspected the merged P1/P2 stories and frozen action/browser acceptance,
`PlayPuzzle`, `play-autosave`, `PuzzleGrid`, `Modal`, grid/cursor/serialization,
play actions and the existing `PlaySession` schema on 2026-10-19.
The existing schema already includes nullable `completedAt`; no migration is
needed. There is no existing correctness engine or confetti dependency.

### Comparison and authority

- Answers remain on the server. Use pure grid functions `isFull(grid)` and
  `isSolved(solution, entries)` from `src/engine/play.ts`. Full means at least
  one active cell, with a nonempty string in every active cell. Solved additionally
  requires identical dimensions and active/black geometry and exact equality
  of every active entry to its answer. Compare opaque strings, including stored
  rebus strings, without case normalization, trimming or partial matching.
  No active cells means neither full nor solved. Do not mutate either input.
- Correctness is derived from entries, never from `completedAt` alone. Frozen
  P1/P2 acceptance includes older incorrect rows with nonnull timestamps: they
  remain editable and retain that record. A correct row with a null timestamp
  locks and receives its first timestamp through an authenticated mutation.
- Preserve `PlayPuzzleView`, passive `loadPlayPuzzle`, conflict-safe
  `startPlaySession` and `savePlayEntries(...): Promise<void>` contracts.
  GET/prefetch neither creates a session nor stamps completion.
- Add `inspectPlayCompletion(id: string): Promise<PlayCompletionResult>`:

  ```ts
  type PlayCompletionResult =
    | { status: 'incomplete' | 'incorrect' }
    | { status: 'complete'; entries: SerializedGrid; completedAt: Date };
  ```

  Authenticate before any data access. Require an existing published puzzle
  and the authenticated user's existing session; never accept a player/session
  identity or client correctness claim. Missing/draft puzzles and missing own
  sessions reject. Public/private and builder/non-builder follow P1.
- Inspect the saved entries. Incomplete and full incorrect results write
  nothing and reveal only the overall state. Correct entries stamp
  `completedAt` only when null, preserving the first timestamp on repeated or
  concurrent requests. The completed result includes that player's saved grid
  so a stale tab can show the actual completed entries. Never return the answer
  grid, mismatched cells, answer lengths, counts, or per-cell correctness.
- Guard completion at mutation time by authenticated pair, publication and
  the exact entries inspected. A concurrent changed snapshot must not get a
  stale completion timestamp. Reject a changed/unavailable snapshot or return
  a freshly verified completed result; never fabricate success. Propagate
  database failures.
- Enforce the solved lock in `savePlayEntries` too. A stale tab or direct action
  cannot overwrite an actually solved saved grid, including a correct legacy
  grid with no timestamp. Preserve all original input validation and the
  mutation-time published-puzzle guard. An atomic guard against canonical
  solved entries, plus derived checking of the existing row, is sufficient;
  no revisions, schema changes or cross-tab subscription system are needed.
  An identical already-saved solved snapshot returns as an idempotent no-op;
  this must not alter its timestamp or permit changed entries through the lock.
- Preserve every puzzle field/timestamp, session ID and identity, `startedAt`,
  unrelated sessions and puzzles. The completion action changes only the own
  row's nullable completion record. Never clear an existing completion date.

### Feedback, saving and reopening

- Keep partial-grid typing, 500 ms debouncing, ordered saves, local recovery,
  storage warnings, Retry and cursor behavior from P2. Partial writes remain
  a single save action with no correctness request or feedback.
- After authenticated start, inspect only an initially full saved grid, before
  marking the player ready or recovering a local draft. An initially solved
  saved grid wins over any stale local draft and opens locked. An initially
  full incorrect grid opens editable without a modal. Partial and zero-active
  grids need no initial correctness action.
- A changed full snapshot is saved and then inspected within the existing
  serialized save workflow. Keep its local draft until the entire workflow
  succeeds. Do not celebrate or claim completion before server confirmation.
  A recovered full local draft uses that same workflow.
  If a new empty-to-full transition returns to an already-saved full snapshot
  within the debounce, inspect it without rewriting unchanged entries: the
  local transition still re-arms incorrect feedback even when saved bytes match.
- Briefly pause input while a full snapshot saves and checks. Preserve entries
  and Retry on failure; allow resumed
  editing when saving failed, but keep input paused with verification Retry
  when saving succeeded and inspection failed (the saved grid may already be
  solved and server-locked). An obsolete response
  cannot lock or judge a different current grid or discard pending edits.
- A failed full-snapshot save may
  have committed before its response was lost. Retry first inspects the saved
  state before resending edits after that full-snapshot failure, including when
  subsequent local edits became partial. Ordinary partial-save failures keep
  P2's single-save Retry without inspection. If complete, the canonical completed
  grid wins over stale local edits and locks; otherwise Retry saves the latest
  local entries and follows the ordinary full-grid workflow. A failed recovery
  inspection preserves the draft and Retry. This failure recovery is the only
  exception to a now-partial snapshot making a correctness request. A successful new
  finish recovered through Retry may celebrate once; no failed request may
  claim success. Inspection Retry after an acknowledged save does not rewrite
  the entries. Cover both abort-before-write and committed/lost-response saves.
- Show the generic “You're so close” modal only for a local transition from
  having an empty active cell to full and incorrect. Say at least one entry
  is incorrect without saying where. Dismissing it permits continued editing.
  Replacing letters while already full does not re-trigger it; erasing then
  filling the last blank again re-arms it. Initial/recovered full incorrect
  grids do not represent a newly typed transition and open silently.
- A correct result after a new full save shows confetti and a congratulations
  modal exactly once for that mounted finish, including correction of an
  already-full incorrect grid. Lock the canonical confirmed completed grid.
  A successful retry after a failed new finish may celebrate once.
- Initial correct saved grids, including null-timestamp legacy grids, reopen
  locked with no congratulations dialog or confetti. A pending full local
  draft recovered after leaving may celebrate when it first completes on the
  server; server-confirmed completion never replays on return.
- Locked means letter entry, deletion, cursor movement and active-cell clicks
  cannot edit/select the grid or queue writes. Clear selection/highlights.
  Keep the fixed geometry, numbering, static clues and white/black cell paint.
  Show an accessible success mark labelled “Completed” and visible read-only
  message explaining that the puzzle is complete. Dismissing congratulations
  leaves the completed grid and message visible.
- Use the existing `Modal` for both dialogs, preserving keyboard dismissal,
  focus trapping/restoration and backdrop behavior. Suggested stable hooks:
  `play-incorrect-dialog`, `play-completion-dialog`, `play-completed-mark`,
  `play-lock-message`, `play-confetti` and `play-completion-error`.
  Keep play-save-status for P2 save/error feedback. Cosmetic copy may vary
  except the meaning/accessible labels and dialog titles above.
- Confetti is decorative, ignores pointer input and assistive technology,
  ends without user interaction, and honors reduced-motion preferences.
  Use a small local CSS animation; do not add an animation dependency.
- A start/initial completion failure uses the existing start error and Retry;
  no editing or false completion before authenticated initialization succeeds.
  A save/finish failure keeps the latest entries recoverable, reports a visible
  failure and allows Retry. Do not leave the player permanently stuck waiting.

## Repo paths

New acceptance, authored during specification and immutable after freeze:

- `src/engine/play.test.ts` — pure fullness/correctness acceptance.
- `src/app/puzzles/actions.play-completion.test.ts` — authenticated inspection,
  timestamp preservation, isolation, server lock and concurrent-write guards.
- `e2e/play-completion.spec.ts` — full wrong/correct transitions, recovery,
  dialogs/locking, retry, reopening and answer redaction.

Runtime/editable paths:

- `src/engine/play.ts` — pure comparison helpers; existing engine stays intact.
- `src/app/puzzles/actions.ts` — completion inspection and solved save guard.
- `src/components/play/PlayPuzzle.tsx` — lifecycle, feedback and locked input.
- `src/components/play/play-autosave.ts` — ordered full-save workflow/recovery
  hooks as needed; preserve P2's synchronous local storage and acknowledgement.
- `src/components/play/PlayConfetti.tsx` and a colocated CSS module — optional
  small decorative animation, reduced motion and automatic cleanup.
- `e2e/helpers/play-route.ts` — editable synthetic fixture plumbing if needed;
  never alter frozen assertions or weaken the application for test setup.
- This story, `../EPIC.md` and `../HANDOFF.md` — decisions and delivery evidence.

Reference `src/components/ui/Modal.tsx`, `PuzzleGrid`, `PublishedLockMessage`,
`src/lib/{play-entries,puzzle-storage,require-session}.ts`. No serialization,
schema/migration, builder, library, auth, middleware or publication-lifecycle
change. Declare any additional path before editing it.

## Scope discipline

Only P3 completion/feedback/locking. No P4 reset or P5 library work, checking
tools, per-cell clues, timer, rebus input, mobile redesign, unpublish/edit/
republish protection or migrations. Do not inspect/edit environment files,
operate on inbox data, or alter development/production schema/data. The user
authorized necessary guarded local test resets and requested the standing grant
now recorded in [DEVELOPMENT](../../../DEVELOPMENT.md#e2e-environment).
Do not begin P4 without new authorization.

## Specification review and approval

On 2026-10-19 the user authorized resuming P3, then answered “Yes you may” to
the concrete request to approve the proposed specification/acceptance, delegate
freeze after independent review, and implement/deliver P3 through its required
PR/review gates. This approves the input/failure and Retry recovery decisions
above. The user subsequently explicitly authorized test-row deletion for test
runs and the lasting guarded local test-reset policy; see DEVELOPMENT above.

Independent read-only agent `p3_spec_review` reviewed the story, all three
candidate acceptance files, affected runtime and targeted P2 contracts. Its
final re-review found no specification/test blockers beyond the then-pending
human approval and reset authorization. Earlier findings were addressed by adding
pending/failure/initial-inspection coverage, reconciling committed full saves
whose response was lost, limiting that recovery to failed full snapshots to
preserve P2 partial Retry, and dismissing any permitted congratulations modal
before the lost-response locked-input assertion.

Approved acceptance: 28 engine, 39 server and 23 browser cases. At initial
freeze, parent TypeScript, focused candidate ESLint and browser listing passed;
runtime and browser execution were still pending. All 75 original acceptance
files remain immutable; resume hashes are recorded at
`/private/tmp/crossward-p3-resume-frozen-sha256.json`.

The initial full browser run exposed a test-clock omission in the two pending
full-draft recovery cases. Independent review confirmed the new page inherits
the paused context clock and must advance the specified 500 ms debounce. The
user explicitly approved adding only `await returned.clock.runFor(500);` before
checking Saved. Test-only main commit `dbc3ee8` refreezes that correction;
assertions, timeouts, Decisions and runtime behavior are unchanged. See the
[handoff](../HANDOFF.md) for current verification and delivery evidence.

## Definition of done

- Record the resolved UX decision, human approval and independent review;
  freeze specification/acceptance on main before runtime. Obtain explicit
  test-database reset authorization before browser execution.
- Confirm new tests discriminate missing behavior. Preserve all 75 existing
  acceptance files and all new frozen tests; stop on erroneous frozen tests.
- Separate implementation and verification; serialize browser suites.
  `npm run verify` exits 0 and the complete `npm run test:e2e -- --workers=2`
  suite exits 0. This existing resource cap changes no tests/retries/timeouts.
- Exercise wrong transition/re-arm, correction, locked reopen, failures/retry,
  full pending recovery and stale writes. Visually inspect both dialogs, the
  completed grid/message and confetti; demonstrate reduced motion and focus.
- Update the Play handoff with observed results, commit, open a PR, and obtain
  independent review/merge on the exact verified head with configured CI.
  P4/P5 and epic closeout remain pending.
