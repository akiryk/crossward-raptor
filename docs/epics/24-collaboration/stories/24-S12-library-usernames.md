# Story S12 — Library usernames and conditional owner marker

## Approval and frozen amendments

The human explicitly requested these four corrections on 2026-11-14: use
usernames instead of You, remove the comma, omit the owner marker without
collaborators, and put the owner first with `(owner)` when collaborators exist.
This request approves the semantic correction to S9/S8 and the older library
acceptance below. Independent review of the proposed amendments is required
before their separate specification-only main commit/refreeze.
Independent agent `review_amendments` approved the story and all six proposed
acceptance amendments on 2026-11-14, with no blockers (static review).

## Decisions

- Every displayed account in `/puzzles` uses its username, including the
  signed-in owner and collaborator. Preserve the existing empty-name fallback.
- A row without current collaborators shows only its owner's username.
  Pending invitations alone do not count as a collaborator for this marker.
- With current collaborators, show the owner first as `SomeUsername (owner)`:
  one separating space, no comma or period, regular-weight marker. List each
  collaborator's username on a separate line below; member order is unspecified.
- Preserve existing typography, spacing, truncation, row fit, privacy, menus,
  filtering and account-update behavior.

## Scope / non-goals

Presentation only. No server actions, membership, database, authorization,
synchronization, dialog or account-storage changes. Do not expose additional
collaboration metadata on public/played outsider rows.

## Acceptance

- Amend S8/S9's two-viewer name assertions to real owner/member usernames,
  exact owner-line text and marker `(owner)`, preserving layout assertions.
- Add solo and invitation-only browser coverage: exact username-only owner
  line, no marker and no member lines.
- Restore username assertions in puzzle-library, muted-text, account-details
  and account-email. Account rename must immediately show the new username;
  preserve stored-name, bystander, focus, no-reload and reopening checks.
- Narrow-margin retains all geometry assertions; update its obsolete comment.
  These explicit amendments supersede the corresponding frozen expectations.

## Repo paths

`src/components/puzzle/{PuzzleRow,PuzzleLibrary}.tsx`;
`e2e/{collaboration-polish,puzzle-library,muted-text,account-details,account-email,narrow-margin}.spec.ts`;
this story and the epic handoff.

## Definition of Done

Independent amendment review, separate specification-only baseline on main,
then implementation. `npm run verify` and full `npm run test:e2e` exit 0
on the final code, in a clean temporary checkout if necessary, two browser
workers and serialized under the shared lock. Use the guarded local reset
standing grant in DEVELOPMENT. Confirm frozen acceptance unchanged after
baseline. These paths are outside CODE-REVIEW risk paths: direct main delivery
and push after the gates; preserve all unrelated starting changes.
