# Story O2 — Display names

Ask for a builder name when an unnamed signed-in user opens New Puzzle.
Persist it once, then continue through the existing title/size dialog.

**Blast radius: high.** New authenticated Server Actions live in
`src/app/puzzles/actions.ts`; use an implementation branch, PR, independent
verification, and a final reviewer independent of implementation/verification.

## Decisions

The user confirmed these choices on 2026-10-17 after inspection of the actual
flow and existing frozen tests:

- A separate first step asks for **Your builder name**, with **Save and
  continue** and **Cancel**. Saving immediately persists the name, then opens
  today's puzzle title/size step. Saving alone creates no puzzle.
- Before submission, Cancel, Close, Escape, and backdrop dismissal close the
  whole flow, discard the unsaved name, create no puzzle, and return focus to
  New Puzzle. The next click asks again. During a save, disable submission,
  input, and dismissal: a committed server write cannot promise cancellation.
- After saving, cancellation of title/size retains the name. Reopening, page
  reload, and subsequent sign-in skip the name step. Users with a stored name
  keep today's creation behavior. No name is required merely to sign in or
  view the library.
- Trim surrounding whitespace. Accept 1–80 Unicode code points after trimming,
  including spaces, punctuation, non-Latin text, and duplicate names. Reject
  blank, overlong, and nonstring input on the server; matching client
  validation disables Continue and explains invalid input.
- Capture once; there is no profile editor. Concurrent saves must preserve
  the first persisted nonblank name and return that persisted value. Never
  replace an existing name through this action. Null or whitespace-only
  stored values count as missing.
- The name prerequisite applies to the supported **New Puzzle UI**. The
  authenticated low-level `createPuzzle({ title, size })` action retains its
  existing contract, including direct creation without a display name. The
  user explicitly accepted this boundary to preserve the frozen O1/session
  acceptance contracts. Do not add test-aware bypasses or weaken auth.
- Failed saves show an inline, readable error, retain input, allow retry, and
  neither advance nor create a puzzle. Guard duplicate submissions
  synchronously. Disable dismissal only while saving; release it on failure.

## Required behavior

### Server Actions

Add `getDisplayName(): Promise<string | null>` and
`saveDisplayName(input: { displayName: string }): Promise<{ displayName: string }>`.
Both call `requireSession()` before any database access. Use the trusted
`session.user.id`, ignoring extra client-supplied identity properties. Read
the persisted `User.displayName` directly; no auth/session schema changes.

The getter returns null for a missing/blank value and the stored value for
a nonblank name. The setter validates/trims input, updates only the signed-in
user's `displayName` (normal `updatedAt` maintenance is permitted), and returns
the stored winner. Use an atomic conditional write so concurrent prompts
cannot overwrite a saved name. Do not mutate User.name, email, role, other
users, sessions, puzzles, or inbox data. No migration or backfill is needed.
Preserve all existing puzzle actions and serialization behavior.

### Creation UI

Read the current persisted name for the library and pass it into the creation
flow. Keep the existing outer `new-puzzle-dialog` hook for both steps: frozen
A6 acceptance opens this flow for a fresh unnamed account. Give the name step
its own `display-name-step` hook, `display-name-input` accessible as
**Builder name**, `display-name-save`, and `display-name-cancel` hooks.
Use existing Modal styling, focus trapping, dismissal, and focus restoration.
Focus the name field on opening and puzzle-title field on advancing. Preserve
today's title/size selectors, defaults, validation, and single-create behavior.
Enter in the name input submits a valid name; click and keyboard submission
must share the same pending/duplicate guard.

Successful name capture is remembered in the mounted parent flow as well as
the database. Preserve the old title/size cancellation behavior. No attribution
or ownership-edit UI changes belong to this story.

### Fixtures

Keep all pre-existing acceptance files frozen. In editable fixture plumbing,
give the deterministic shared suite builder and `signInSeededUser` fixtures
a display name, so existing creation/session-denial tests still exercise
their original named-user flow. Do not give all newly signed-in users a name.
O2 acceptance uses fresh distinct unnamed
users and the real email-free test authentication path; never mutate the
shared suite user's name to exercise O2. Helpers must use the existing guarded
isolated E2E target. Do not alter timeouts, workers, retries, or frozen setup.

## Non-goals and preservation

O2 only. No O1 migration replay, schema changes, production data operations,
O3 ownership guards/library distinctions, invitations, profile editor, Play,
roles, or hydration investigation. Preserve existing puzzle/account data and
inbox messages; only normal isolated E2E resets are authorized. Do not inspect
or edit `.env*` files. Ordinary E2E remains production-build and email-free.

## Repo paths

New acceptance files drafted at the user's explicit request, reviewed and
frozen in a specification-only commit on main before implementation (the
explicit exception to STORY step 0a's relocation-only default):

- `src/app/puzzles/actions.display-name.test.ts` — authenticated read/write,
  validation, identity targeting, first-write preservation, concurrent winner,
  and no unrelated effects.
- `e2e/display-name.spec.ts` — fresh unnamed-user capture, dismissal, validation,
  focus, persistence, retry, duplicate/pending behavior, and existing creation.

Editable implementation/plumbing:

- `src/app/puzzles/actions.ts`, `src/app/puzzles/page.tsx`,
  `src/app/puzzles/NewPuzzleButton.tsx`,
  `src/components/puzzle/NewPuzzleDialog.tsx`.
- A focused name-step component and `src/lib/display-name.ts` if useful;
  no speculative generalization. Shared Modal/TextInput changes only if
  necessary for this flow, preserving existing contracts.
- `e2e/helpers/ownership.ts` — named shared suite builder fixture.
- `e2e/helpers/seed-session.ts` — named per-test seeded-user fixtures, preserving
  frozen expired/revoked-session creation tests; normal signup stays unnamed.
- `e2e/helpers/display-name.ts` — fresh-user authentication and guarded
  persisted-name/puzzle reads for O2; existing auth helpers remain reusable.
- This story, Ownership `EPIC.md` and maintained `HANDOFF.md`.

## Acceptance examples

1. Rejected sessions cannot read/write display names or cause other effects.
   Authenticated reads and writes select only the actual session user, even
   with a forged client user ID. Trimmed valid Unicode names persist; empty,
   whitespace-only, nonstring, and 81-code-point names do not write anything.
2. A stored nonblank name cannot be replaced. Two concurrent captures converge
   on the first persisted name. Only displayName/normal updatedAt may change.
3. Opening New Puzzle for a new unnamed user focuses Builder name and creates
   nothing. Each of the four idle dismissal paths closes the flow, leaves
   displayName null and no puzzles, restores focus, and prompts again empty.
4. Blank/overlong names cannot continue. A valid trimmed Unicode name can be
   submitted by Enter or click, persists before any puzzle is created, then
   focuses today's puzzle title with the usual daily default. Canceling there
   retains the name; reopening and reloading skip the prompt. A fresh sign-in
   to the same account also skips it.
5. After capture, normal mini creation persists the requested title/5×5 grid
   and actual signed-in builder. Later creation skips capture and retains the
   original name. A named shared fixture preserves every old UI acceptance.
6. A failed save retains entered text, exposes a readable retryable error,
   creates nothing, and a retry succeeds. A delayed save prevents duplicate
   writes and all dismissal while pending, then advances exactly once.

## Definition of done

1. Review story and both new acceptance files together, commit the immutable
   baseline on main, then branch `story/10-O2-display-names` before implementation.
   Demonstrate meaningful pre-implementation failures of new acceptance.
2. Separate implementation and verification agents; serialize E2E/build checks.
3. `npm run verify` and ordinary `npm run test:e2e` both exit 0. Preserve all
   old acceptance files and both O2 frozen files byte-for-byte against baseline.
4. Record exact verified tree/evidence and limitations in Ownership's maintained
   handoff. Keep O3 and Ownership closeout pending, without starting them.
5. Push branch, open PR, and obtain independent final review and normal reviewer
   merge after required checks pass on the reviewed head. Record production
   deployment status separately; no live schema/data operation is needed.
