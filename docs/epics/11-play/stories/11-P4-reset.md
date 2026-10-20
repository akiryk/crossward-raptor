# Story P4 — Reset

Let a player discard their own attempt, including a completed attempt, and
start again on the spot. Give builders a quiet shortcut for clearing test plays.

**Status:** specification and acceptance approved and frozen on `main` by
the human on 2026-10-19 (approval/freeze delegated to the agent after review;
the two review fixes, client initialization from the returned view and the
EPIC P5 untouched note, were approved). Runtime was authorized on 2026-10-20
and is implemented on `story/11-P4-reset`; it awaits independent review and
merge. P1–P3 acceptance remains frozen.
**Blast radius: high:** authenticated session deletion in `actions.ts`.

## Decisions

Inspected P4 in the epic, the current play route/actions, `PlayPuzzle`,
`play-autosave`, `Modal`/`ModalActions`, P1–P3 acceptance and the existing
`PlaySession` schema. No migration or new dependency is needed.

### Entry points and confirmation

- Every player has a small, keyboard-accessible **Puzzle options** disclosure
  on the play screen, containing **Reset puzzle**. This is the unobtrusive
  route. A library reset control is deferred to P5, which first teaches the
  library which puzzles the player has started (human decision, 2026-10-19).
- When the authenticated player is the puzzle's builder, additionally show a
  quiet visible **Reset puzzle** button outside the disclosure. Both controls
  open the same confirmation flow. Determine builder status on the server;
  pass only the needed boolean to the client. Preserve the exact existing
  `PlayPuzzleView` and load/start result shapes, which frozen P1 asserts.
  Route-level metadata/props can supply this boolean separately.
- Enable reset after successful session initialization, including for empty,
  partial, full incorrect and completed/locked attempts, pending/failed saves
  and pending completion inspection. Before initialization, and after a
  start failure until Retry succeeds, no reset control is enabled.
- P3 completion/incorrect feedback dialogs are modal; reset controls are
  reachable only after they close. Never stack the reset dialog with them.
- Use the existing `Modal`, title **Reset puzzle?**, with **Cancel** and
  **Reset puzzle** actions in its footer. Explain that this clears the
  player's entries and completion record, cannot be undone, and starts the
  puzzle over. Never use `window.confirm`.
- Opening the confirmation is not permission to delete or discard a draft.
  Cancel, Escape, backdrop and Close dismiss without resetting. Preserve
  Modal's named-dialog semantics, initial panel focus, focus trap and scroll
  lock. Grid keystrokes do not edit behind the dialog.
- Focus returns to the visible control that opened the flow: the builder
  button, or for the options route the **Puzzle options** button. Choosing
  the option closes the disclosure and focuses **Puzzle options** before the
  dialog opens, so unchanged `Modal` restoration lands there.

### Result and persistence

- On confirmed success, **stay on the play page** (same URL, no navigation)
  and show the fresh attempt: every active cell blank, geometry, numbering and
  clues unchanged, no lock message, completed mark, confetti or P3 dialog,
  editable, and no cell selected. The dialog closes and focus returns as above.
  Typing, saving and completing then work exactly as in P1–P3.
- The client initializes from the returned view exactly as it does after a
  successful start, because a stale-ID success (below) may return a partial
  or completed attempt rather than a blank one. A completed returned attempt
  shows locked with its completed mark, but without confetti or the P3
  dialog. Local draft recovery uses only the returned session ID.
- Add `resetPlaySession(id: string, sessionId: string): Promise<PlayPuzzleView>`.
  Authenticate before any puzzle/session access, including malformed calls.
  Validate nonempty string identifiers. Read the puzzle first; it must exist
  and be published. Public/private and builder/non-builder have identical
  permission.
- In one transaction: delete only the row matching **session ID +
  authenticated user + puzzle**, guarding publication in the delete itself;
  then create the caller's row for this puzzle if absent, with a new ID,
  fresh `startedAt`, null `completedAt` and blank active entries (as
  `startPlaySession` does). Never update entries/timestamps in place or touch
  the puzzle. A failure anywhere in the transaction leaves all data unchanged.
- Resolve with exactly the `startPlaySession` view of the caller's current
  row, so it contains the player's own entries and no solution. After a fresh
  reset these are blank.
- Requests whose session ID matches no row are a success that deletes
  nothing and returns the caller's current attempt, creating a blank one only
  if none exists. This covers duplicates, a retry after a committed reset
  whose response was lost (returns the attempt that reset created), an old
  request after a newer attempt exists (that attempt and its progress survive)
  and another user's or another puzzle's session ID (never deleted).
  Client-provided user IDs, builder status or extra arguments confer no rights.
- Missing/draft puzzles reject without changing data. If publication
  disappears between the read and the guarded delete, delete nothing, create
  nothing and reject. Propagate read, deletion and creation errors.
- Preserve every puzzle field, another player's session on this puzzle and all
  sessions on other puzzles. Invalidate the library's cached view after
  success without adding P5 cues/grouping/sorting.
- Reloading after reset shows the same fresh attempt (no further row).

### Pending work, local recovery and errors

- Confirming reset makes the flow pending immediately, pauses grid editing
  and disables duplicate confirmation and all dismissal routes until the
  request settles. Display visible pending feedback. Do not clear entries or
  recoverable edits before an acknowledged successful reset.
- Cancel the pending debounce and prevent new saves/inspection work from
  being queued during confirmation submission. Settle any already-running
  save/check before resetting, including its client response handling.
  `savePlayEntries`/`inspectPlayCompletion` are keyed by user and puzzle, so
  the client must guarantee that no save or inspection of the old attempt
  reaches the server after the reset request is sent: late responses must not
  restore old entries, write them to the fresh attempt, lock, celebrate or
  open feedback. Do not require pending edits to save as a prerequisite.
- On success, retire the old save workflow, start a new one bound to the
  returned session, and remove only the old session's
  `crossward:play-draft:v1:<sessionId>` recovery key. Preserve all unrelated
  local-storage keys/drafts. If storage removal fails, the reset still
  succeeds: the new session ID prevents recovering the obsolete draft.
- On failure, stay in the reset dialog with an error. Preserve entries, saved
  rows, lock state and recoverable local edits. Re-enable dismissal and the
  **Reset puzzle** confirmation to retry. On cancellation restore the normal
  save/retry workflow without retyping. A reset may fail after committing:
  the retry then returns the already-created fresh attempt.
- Other open tabs get no live notification in P4. An old tab still showing
  the previous attempt can save into the fresh attempt, because saves are not
  session-scoped; cross-tab/device coordination and session revisioning are
  out of scope.

## Acceptance

Frozen executable acceptance:

- `src/app/puzzles/actions.play-reset.test.ts`: authentication/validation,
  public/private and builder/non-builder reset of partial/completed attempts,
  delete-and-recreate with a new identity, the returned view, isolation,
  repeated/lost-response retries, newer attempt protection, foreign IDs,
  unavailable puzzles, mutation-time publication guard, transactional failure
  propagation, response redaction and library invalidation.
- `e2e/play-reset.spec.ts`: both entry points and builder-only shortcut,
  enablement only after successful start, shared Modal semantics/focus/
  dismissal, cancel preservation, empty/partial/incorrect/completed reset in
  place to a fresh blank editable attempt that survives reload, pending
  debounce/in-flight save/check ordering, save/reset errors, retry after lost
  acknowledgement, and local draft isolation/storage failure. Browser cases
  use synthetic fixtures and the guarded local E2E harness; no ad hoc
  existing-data cleanup.

Stable hooks: `play-options` (disclosure button), `play-reset-option`,
`play-reset-button` (builder shortcut), `play-reset-dialog`,
`play-reset-confirm`, `play-reset-cancel`, `play-reset-error`,
`play-reset-pending`. Accessible names and dialog title above are contractual;
body/error copy may vary while retaining the specified meaning.

## Non-goals / scope

P4 only. No library reset control or other P5 library state cues/sorting,
puzzle deletion/unpublishing, reset-all, undo/history, timer/stats,
checking/reveal tools, schema/migration, session-scoped save/inspect
signatures, new engine functions, builder editor changes, mobile redesign,
auth changes, or changes to previously frozen acceptance. Drafting authorizes
neither runtime work nor real user/session deletion. The standing test-reset
grant in [DEVELOPMENT](../../../DEVELOPMENT.md#e2e-environment) applies only
to necessary guarded local browser runs. Do not inspect/edit environment files.

## Repo paths

- New proposed acceptance: the two files listed under Acceptance.
- Future runtime: `src/app/puzzles/actions.ts`,
  `src/app/puzzles/[id]/play/page.tsx`,
  `src/components/play/PlayPuzzle.tsx`,
  `src/components/play/play-autosave.ts`; an optional colocated reset UI module.
- Reference/reuse `src/components/ui/{Modal,ModalActions,Button}.tsx`;
  no shared component behavior change is anticipated.
- Editable fixture plumbing only if needed: `e2e/helpers/play-route.ts`.
- Documentation: this story, `../EPIC.md`, `../HANDOFF.md`, `../HISTORY.md`
  (preserve the prior P3 handoff's verification provenance).

Implementation added the colocated `src/components/play/PlayReset.tsx`
(disclosure, shortcut and dialog) and a read-only `isPlayPuzzleBuilder`
action in `actions.ts` for the route's builder boolean.

Declare additional paths before editing. Future runtime requires a story
branch, PR and independent review per CODE-REVIEW; the specification baseline
belongs on main only after human approval/freeze.

## Draft review and checks (2026-10-19)

The first draft (library destination) was reviewed by separate read-only
agent `p4_spec_review`; its pending-ordering, cancellation/error and no-upsert
findings were carried into this revision where still applicable. A second
review in the human-facing session found the start-failure case could pass
without any reset feature, and three unstated test-implied contracts (option
focus target, foreign-ID success, read-before-delete); this revision fixes
the test and states those contracts. The human then chose an in-place fresh
attempt over the library destination, which this revision implements.
Check results for the revised draft are recorded in the handoff.

## Definition of done

- Obtain human approval for specification and acceptance; commit only the
  approved baseline on main before runtime.
- Show new tests discriminate missing reset behavior. Preserve P1–P3 and all
  other frozen acceptance; stop affected work on an erroneous frozen test.
- After separately authorized implementation, use separate implementation and
  verification agents where useful, keep review independent, and serialize
  shared-database browser runs. `npm run verify` and the complete
  `npm run test:e2e -- --workers=2` suite exit 0 without weakened assertions,
  retries or timeouts. Retain command/exit/exact-content evidence.
- Visually inspect the quiet builder button, unobtrusive non-builder options,
  destructive confirmation copy, pending/error states, and completed reset to
  a blank grid; demonstrate keyboard access, dismissal and focus restoration
  on both routes.
- Update the handoff with actual verification/delivery state; obtain required
  independent review, configured CI and normal merge of the verified head.
  P5 and epic closeout require separate authorization.
