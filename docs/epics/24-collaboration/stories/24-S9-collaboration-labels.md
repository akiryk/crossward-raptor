# Story S9 — Personal and current collaborator labels

Approved scope: the human's two follow-up local-testing requests and screenshot,
2026-11-14. Deliver on a story branch and independently reviewed PR into
`epic/24-collaboration`; no main, production migrations or Vercel settings.

## Decisions

- In library rows, render the signed-in account's name as “You”, both when
  that account owns the puzzle and when it appears among collaborators.
  Match account IDs, never names. Other accounts retain their usernames.
  The owner remains first and retains the regular “, (owner)” marker.
  Account settings, stored usernames and other people's names are unchanged.
- When the Collaborators dialog has at least one current member, show
  “Current Collaborators” below the email form and above the first member.
  Use a semantic heading with `body-normal` (14px) and bold (700) weight.
  Hide it when there are no current members, including invitation-only lists.

## Scope / non-goals

Presentation only: no server actions, membership, authorization, database,
sync, session log, account settings or unrelated style changes. The dialog is
owner-only and never lists its owner as a collaborator, so its other-account
member names continue to use their usernames.

## Acceptance and frozen amendments

- S8's two-viewer name checks expect You only for the signed-in account;
  still assert the other account's real username, ordering, spacing and fit.
- S6 dialog coverage checks heading absence with zero members, appearance
  after adding, 14px/700 styling, position between form and first member,
  and disappearance after removing the last member.
- Update obsolete own-owner-name expectations in `puzzle-library`,
  `muted-text`, `account-details` and `account-email` browser specs to You.
  Account tests retain all stored username, bystander, reopening, focus,
  email and no-reload assertions; the own row remains You after renaming.
  These explicitly supersede earlier own-name rendering requirements only.
  Obtain independent review before refreezing the amendments.

## Repo paths

`src/components/puzzle/{PuzzleRow,PuzzleLibrary,CollaboratorsDialog}.tsx`;
`e2e/{collaboration-polish,collaborator-management,puzzle-library,muted-text,account-details,account-email,narrow-margin}.spec.ts`;
this specification and the epic handoff.

## Definition of Done

`npm run verify` exits 0 in a clean temporary checkout with identical source
(root lint traverses historical nested worktrees). Directly affected browser
files pass under the epic integration exception, serialized and using the
guarded test-reset standing grant. Keep HEAD stable during browser build/run.
Independent PR review, configured CI passing, normal merge into epic, local
dev server restored. Fresh full epic E2E remains due before main.

## Approved frozen layout-test correction

The initial affected browser run passed 81/84 checks; all three failures
were narrow-margin 18-S6-4, which measured the name span as a proxy for the
whole 90px title column. S8 split the name and owner marker into siblings;
You makes the text span only 25.7px. The actual column still has its 90px
minimum. Independent reviewer `review_polish` approved changing only the
measurement to the enclosing full owner line and its explanatory comment.
The human explicitly approved this correction (“1. Yes”) in this session.
It is refrozen in a separate specification-only epic commit before resuming
affected verification. Keep the original 90px threshold and all date,
overflow, marker, menu and Reset assertions unchanged.
