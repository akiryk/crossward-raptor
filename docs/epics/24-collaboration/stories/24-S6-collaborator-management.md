# Story S6 — Collaborator management and the library (UI)

The owner manages a puzzle's collaborators in a "Collaborators…" dialog,
reached from the row menu of an unpublished puzzle and from its editor: an
email field, the collaborators by username, the pending invitations by
address, Remove and Revoke. A collaborator's library lists the puzzles
shared with them, each showing its owner's username; its Create filters
count every puzzle they can edit; and the row menu of a shared puzzle
offers Duplicate only. This is the first story that lets a second person
reach a puzzle. Two carry-overs from the S5 review are tightened: claiming
an invitation can no longer race a revocation or a deletion, and an editor
whose puzzle is published elsewhere explains every edit it can't save.

**Status: approved and frozen 2026-11-13** by the agent under the human's
delegation of every story's approval and freeze in this epic
([HANDOFF](../HANDOFF.md)). The baseline is the specification-only commit
on `epic/24-collaboration` that adds this file ("24-S6: freeze …"); its
hash is recorded in the handoff.

**Blast radius: risk story.** `src/app/puzzles/actions.ts` (the library
query and one new action), `src/lib/collab/membership.ts` (claiming) and
the editor's save path (`editor-saver.ts`). Branch
`story/24-S6-collaborator-management` from the baseline, a PR into
`epic/24-collaboration` and independent review. No migration.

## The human's request

[EPIC](../EPIC.md): Stories item 6; "Multi-user testing" (S6's cell: Adam
removes Jay in the dialog while Jay edits); Decisions (the human's request
1; D6; "Resolved with the epic's approval": collaborator management;
Implementation details: "Invitations", "The library", "Losing access while
editing"); Invariant 5. No mockup was supplied, so this specification sets
the look from the existing modal, menu and link styles. Carried from the S5
review ([HANDOFF](../HANDOFF.md)):

- `claimInvitations` (`src/lib/collab/membership.ts`) reads the
  invitations and then inserts memberships under READ COMMITTED: a
  revocation committed in between still makes a membership, and a puzzle
  deleted in between makes the foreign-key error escape and the page fail;
- `EditorSaver.lose()` (`src/components/grid/editor-saver.ts`) drops the
  pending work on the published path only when the queue isn't already
  halted, so edits typed after a commit is refused `published` and before
  the catch-up confirms it are neither dropped nor explained then.

## What the code does today

`epic/24-collaboration` at `b64519f` (S5 merged, PR #43).

- The membership actions exist without UI: `addCollaborator`,
  `removeCollaborator`, `revokeInvitation`, `listCollaborators` and
  `claimInvitations` (`src/app/puzzles/actions.ts`, over
  `src/lib/collab/membership.ts`). The library and editor pages claim
  before reading.
- `listPuzzles` lists the caller's own puzzles (`builderId`), public
  published ones and published ones the caller has played. A shared
  unpublished puzzle isn't listed for its collaborator; a shared published
  one only if public or played.
- Every library row shows its builder's username under the title
  (`builderName`, `puzzle-builder-name`). The row menu
  (`PuzzleRowMenu`) shows on the caller's own rows only: Duplicate, then
  Open in builder and the visibility item when published, Reset when the
  caller completed it, then Delete after a hairline.
- The Create filters (`src/lib/puzzle-filters.ts`) match
  `builderId === userId` only.
- The editor shows the owner's editor to a collaborator, without Reset
  Grid or Publish (S5). It has no collaborator management.

## Decisions

From the EPIC (not restated): owner-only collaborator management, enforced
on the server (S5); invitations by email, binding at once to an existing
account, otherwise pending until claimed or expired; the owner sees
collaborators by username and invitations by address, never a
collaborator's email; Duplicate open to collaborators, the copy theirs
alone (D6); the owner's username on the shared puzzle (D6); Create filters
count puzzles the caller can edit; a collaborator's row menu offers
Duplicate only; removal while open stops and explains (S5).

Drafting decisions (routine, made under the delegation):

1. **Where "Collaborators…" is.**
   - **Row menu:** on the owner's **unpublished** rows, second, after
     Duplicate and before the hairline and Delete: Duplicate,
     Collaborators…, Delete (`data-testid="puzzle-menu-collaborators"`,
     primary). Published rows' menus are unchanged: a published puzzle
     accepts no edits, so there is nothing left to collaborate on. Its
     collaborators stay members (the row stays in their library and they
     can still duplicate it); the server still lets the owner manage them.
   - **Editor:** for the owner of an unpublished puzzle whose access isn't
     lost, a quiet "Collaborators…" button at the end of the step row,
     after the save status (`data-testid="editor-collaborators"`), in
     Reset Grid's look: the label size, `subtle`, `primary` on hover and
     keyboard focus. Build and Create Hints alike. Not shown to a
     collaborator, nor once published or lost.
   - Both open the same dialog; closing it returns focus to what opened
     it (the Modal's own restore; from the row menu, the menu button).
2. **The dialog** (`src/components/puzzle/CollaboratorsDialog.tsx`), the
   existing `Modal`, title "Collaborators"
   (`data-testid="collaborators-dialog"`), in this order:
   - the line "Collaborators can edit the grid and hints with you. Only you
     can publish, reset, delete or manage collaborators.";
   - a form: one `TextInput` (`aria-label="Email address"`, placeholder
     `name@example.com`, `data-testid="collaborators-email"`), which takes
     the initial focus, and an "Add" button
     (`data-testid="collaborators-add"`, type submit; Enter in the field
     submits). Add is disabled while the field is blank or a change is
     being sent;
   - one line for the latest outcome, under the form: a status
     (`role="status"`, `data-testid="collaborators-message"`) or an error
     (`role="alert"`, `text-error`, `data-testid="collaborators-error"`);
   - the list (`data-testid="collaborators-list"`): collaborators oldest
     first, by username (`data-testid="collaborator-row"`,
     `data-user-id`), each with "Remove"
     (`data-testid="collaborator-remove"`); then pending invitations
     (`data-testid="invitation-row"`, `data-email`): the address, the
     muted word "Pending" and "Revoke"
     (`data-testid="invitation-revoke"`). Remove and Revoke are text
     buttons in the label size, `error`, underlined on hover and focus. A
     collaborator without a username shows "(no username)". With nobody:
     "No collaborators yet." (`data-testid="collaborators-empty"`).
     While the first read is outstanding: "Loading…";
   - the footer: one "Done" button (`data-testid="collaborators-done"`),
     closing it, as do ✕, Escape and the backdrop.
3. **What each action says.** The list is read from the server
   (`listCollaborators`) on every opening and after every change; nothing
   is shown optimistically.
   - added: the field clears; "Added Jay. They can edit this puzzle now."
     (the username; "Added." without one);
   - invited: the field clears; "Invited name@example.com. The puzzle will
     be in their library once they sign in with that address.";
   - invalid: "Enter a valid email address." (the field keeps its text);
   - refused `owner`: "That's your own address.";
   - removed: "Removed Jay."; revoked: "Revoked the invitation to
     name@example.com.";
   - `not-found` from any action or the list: "This puzzle is no longer
     available." and the form and list are disabled;
   - a thrown action: "Could not save the change. Please try again." (the
     list read: "Could not load the collaborators. Please try again.").
   Remove and Revoke act at once, without a confirmation: both are undone
   by adding again, and the removed collaborator's open editor explains
   (S5). After either, focus moves to the email field (the row's button is
   gone).
4. **The library lists shared puzzles.** `listPuzzles`'s first clause
   becomes `editableBy(caller)` (the owner or a collaborator), so a shared
   puzzle is listed for its collaborator in every state, published unlisted
   included. Its returned fields are unchanged. A new action,
   `listSharedPuzzleIds()`, returns the IDs of the puzzles the session's
   account is a collaborator of (membership function
   `sharedPuzzleIds(db, userId)`); the library page marks those rows
   `shared` (`data-shared="true"` on the row). The owner's username already
   shows under every row's title (`builderName`), which for a shared row is
   the owner.
5. **A shared row** links as an own row does (unpublished: the editor;
   published: play). Its menu offers **Duplicate** only, plus Reset when
   the collaborator has completed the published puzzle (the player's own
   progress, the play action every completed row offers; on rows with a
   menu it is in the menu). No Collaborators…, Open in builder, visibility
   or Delete. Duplicate opens the collaborator's own copy (S5's
   `duplicatePuzzle`).
6. **Create filters count editable puzzles.** A puzzle counts for Build
   Phase, Hint Phase and Unlisted when the caller owns it or it is shared
   with them (`FilterablePuzzle.shared`); the rest of each rule is
   unchanged. Play and Size are unchanged.
7. **Claiming is safe against a revocation or a deletion**
   (`claimInvitations`). For each unexpired invitation to the account's
   email, in one transaction:
   - an invitation to the account's own puzzle is deleted, nothing made;
   - otherwise the membership is inserted first (skipping a duplicate). Its
     foreign-key check takes a key-share lock on the puzzle row, so a
     concurrent deletion of the puzzle either waits for this transaction or
     has already removed the puzzle;
   - then the invitation is deleted by its ID, still unexpired. If that
     deletes nothing (revoked or claimed meanwhile), a membership this
     claim just made is deleted again; one that already existed is left.
   - A puzzle deleted meanwhile (`P2003`) or a write conflict (`P2034`)
     retries the whole claim, up to three attempts; after that it returns 0
     rather than throwing, and the next page load claims again. Any other
     error is thrown as before.
   The library and editor pages therefore never fail on a claim race.
8. **Every unsaved edit is explained when a publication is confirmed**
   (`lose`). On the published path the saver now always finalizes every
   burst and drops every pending operation, as on the removed path, even
   when a `published` refusal has already halted the queue. Edits made in
   the window between that refusal and the confirming catch-up are
   explained then ("Your … wasn't saved: the puzzle was published."), with
   their input kept; the journal is emptied; the read-only view shows the
   stored puzzle without them.

## Non-goals

- Presence, the session panel, names in notes, conflict outlines (S7).
- Sending invitation emails, invitation links, a collaborator leaving on
  their own, transferring ownership, roles beyond owner and collaborator.
- Showing a collaborator's email, or which collaborator made which edit.
- Managing collaborators of a published puzzle from the UI (decision 1).
- A confirmation before Remove or Revoke.
- A style-guide entry for the dialog.
- Changing `listPuzzles`'s returned fields, the play actions, the server
  membership rules (S5) or the commit path.

## Acceptance (frozen)

IDs in `describe` names. `*.db.test.ts` run against the local test
database in throwaway schemas (S1 decision 11).

### Database (`npm run verify`)

1. `src/lib/collab/membership-claim.db.test.ts` — **24-S6-1 claiming
   races** (a client whose invitation read inside the claim is followed by
   a racing write on another connection):
   - a revocation landing between the read and the insert makes no
     membership, and the claim returns 0;
   - an invitation revoked meanwhile leaves a membership that already
     existed;
   - the puzzle deleted between the read and the insert: the claim
     resolves (no error), makes no membership of it, and still claims the
     account's other invitations;
   - the claim through the action (`claimInvitations()`) resolves too.
2. `src/app/puzzles/actions.library-shared.db.test.ts` — **24-S6-2 the
   library as a collaborator** (the session gate real, Better Auth's
   session read stubbed):
   - `listPuzzles` for Jay lists Adam's shared puzzles in Build, in Create
     Hints and published unlisted, each with Adam's username as
     `builderName` and with exactly the fields it returned before; not a
     puzzle of Adam's that isn't shared; not after Jay's removal;
   - `listSharedPuzzleIds` returns exactly the puzzles Jay is a
     collaborator of: not his own, not others'; for Adam, none of his own.

### Unit (`npm run verify`)

3. `src/lib/puzzle-filters.shared.test.ts` — **24-S6-3 Create filters
   count editable puzzles:** a shared puzzle counts for Build Phase, Hint
   Phase and Unlisted as an own one does; another builder's unshared
   puzzle doesn't; Play filters treat shared puzzles as any other; a
   puzzle without `shared` is judged as before.
4. `src/components/grid/editor-saver.publish-window.test.ts` (Node, the
   page's globals stubbed, the commit action mocked) — **24-S6-4 edits in
   the publication window:** after a commit is refused `published` and
   before the catch-up confirms it, a title and grid letters typed are not
   sent; once confirmed, each is explained with its input kept, the
   journal is empty, and the view shows the stored puzzle without them.

### Browser (`npm run test:e2e`)

5. `e2e/collaborator-management.spec.ts` with
   `e2e/helpers/collaborator-management.ts`; Adam is the suite's builder,
   Jay the second seeded account:
   - **24-S6-E1 adding from the row menu:** Adam's unpublished row offers
     Duplicate, Collaborators…, Delete; the dialog opens with the field
     focused and "No collaborators yet."; adding Jay's address (any case,
     spaced) lists Jay with Remove and says so; Escape returns focus to the
     menu button. Jay's library then lists the puzzle as shared, under
     Adam's username, and opening it shows the editor.
   - **24-S6-E2 invitations and refusals:** an address without an account
     is listed as Pending and stored; Revoke removes it from the list and
     the database; a malformed address and Adam's own address are refused
     with their messages and change nothing.
   - **24-S6-E3 the editor's Collaborators…:** Adam's editor has it in
     Build and in Create Hints and it opens the same dialog; Jay's editor
     has none; a published puzzle's editor has none.
   - **24-S6-E4 removal in the dialog while Jay edits:** Jay's editor is
     open and he types a word; Adam removes him in the editor's dialog;
     Jay's editor shows the removal note and "No longer available" within
     a few seconds and is read-only; his library no longer lists the
     puzzle.
   - **24-S6-E5 Jay's library:** the shared draft is listed under the
     Build Phase filter; its menu offers Duplicate only; Duplicate opens
     Jay's own copy, with no collaborators, and Adam's puzzle is
     unchanged.

### Amended acceptance

Consequences of the EPIC's decisions on earlier frozen tests. No
assertion's meaning changes; each file gets a note citing 24-S6.

- **The library query's fixtures** (decision 4). The in-memory stores of
  `src/app/puzzles/actions.unlisted.test.ts`,
  `actions.library-play.test.ts` and `actions.ownership.test.ts` learn the
  relation filter `collaborators: { some: { userId } }`, matched against a
  row's collaborators (none in their fixtures), as S5 did for O3. Without
  it the first two throw on the widened `WHERE` and the third's matcher,
  which ignores unknown keys, lists every puzzle.
- **The owner's unpublished row menu** (decision 1) gains Collaborators…
  as its second item. Expected item lists for unpublished rows become
  `['Duplicate', 'Collaborators…', 'Delete']` in `e2e/row-menu.spec.ts`
  (16-S2-3, whose check of the second item's test ID learns
  `puzzle-menu-collaborators`), `e2e/delete-published.spec.ts` (16-S3-1),
  `e2e/duplicate.spec.ts` (16-S4-1) and `e2e/menu-reset.spec.ts` (19-S3,
  the draft row). Published rows' lists are unchanged.

### Discrimination

Recorded at the freeze against the baseline (`b64519f`, no S6 runtime),
with the proposed files above: 8 failed, 29 passed across the four new
unit and database files and the three amended fixtures
(`/tmp/s6-discrimination.log`). The baseline type-checks with them.

- Fail without the runtime: 24-S6-1's revocation and deletion cases (a
  membership is made; the foreign-key error escapes), 24-S6-2 (Jay's
  shared drafts aren't listed; `listSharedPuzzleIds` doesn't exist),
  24-S6-3's shared cases, 24-S6-4 (the window's edits are journaled and
  projected, not explained).
- The pre-existing-membership case of 24-S6-1 and the unshared cases of
  24-S6-3 pin behavior that must survive the change, and pass on the
  baseline.
- The amended unit fixtures pass on the baseline. The amended browser
  lists, and every 24-S6-E case, need the runtime (no Collaborators… item,
  no dialog, no shared rows).

### Correction (2026-11-13, after the freeze)

24-S6-4 as frozen typed D, O, G into a five-cell row and looked for a note
with the input "DOG". The note's input is the whole entry as typed,
"DOG??" (the row's last two cells are empty), so the frozen case could
never pass, whatever the runtime. It now types DOGMA across the row and
looks for "DOGMA"; nothing else changes. With the runtime the corrected
case passes; with the old `lose` (dropping only when the queue isn't
halted) it fails. The correction is a separate specification-only commit
on `epic/24-collaboration` ("24-S6: correct 24-S6-4 …"), made under the
human's delegation; the PR's independent reviewer reviews it.

## Visual checks for the human (at the end of the epic)

The browser tests pin behavior, not looks. With no mockup, these need the
human's eye:

1. The Collaborators… dialog: the intro line, the field and Add on one
   line, the outcome line, the list with Pending, Remove and Revoke, the
   empty and loading text, the Done footer, at a wide and a narrow width.
2. The editor's "Collaborators…" at the end of the step row, after the
   save status, in Build and Create Hints, wide and narrow (where the row
   wraps).
3. A shared row in Jay's library: the owner's username under the title,
   and the Duplicate-only menu.

## Repo paths

Acceptance: the files above. Runtime: `src/lib/collab/membership.ts`,
`src/app/puzzles/actions.ts`, `src/app/puzzles/page.tsx`,
`src/lib/puzzle-filters.ts`,
`src/components/puzzle/{CollaboratorsDialog,PuzzleLibrary,PuzzleRow,PuzzleRowMenu}.tsx`,
`src/components/grid/{editor-saver.ts,PuzzleGridEditor.tsx}`.
Docs: this story, `../EPIC.md` (the story link), `../HANDOFF.md`.

## Definition of done

- Frozen acceptance unchanged after the freeze.
- `npm run verify` exits 0; the full `npm run test:e2e` under the epic's
  evidence policy (one `--workers=2` run, every failing file rerun alone
  after `npm run pretest:e2e`).
- Which tests catch each rule (one disabled at a time), recorded.
- The visual checks above recorded for the human at the end of the epic.
- A PR into `epic/24-collaboration`, independently reviewed and merged by
  the reviewer.
