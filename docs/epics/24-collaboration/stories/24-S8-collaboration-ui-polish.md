# Story S8 — Collaboration UI polish

Approved scope: the human's five local-testing requests and mock, 2026-11-14.
The existing epic delivery authorization applies: specification baseline on
`epic/24-collaboration`, implementation branch and independently reviewed PR
back into that branch. No main, production migrations or Vercel settings.

## Decisions

- Place the owner's collaboration link to the right of the builder steps,
  above the grid. Its right edge matches Rebus's right edge below, including
  wide layouts; wrap on narrow screens while keeping that right alignment.
- Rebus's builder link, Preview toggle labels and the collaboration link use
  the existing 14px `body-normal` style. Collaboration uses Rebus's idle,
  hover and keyboard-focus colors (`link-muted` and `button-hover`).
- Use “Add Collaborators” when there are no members or live pending
  invitations, otherwise “Edit Collaborators”. Update after dialog changes.
  Use these labels in the owner's unpublished row menu too; no ellipsis.
  Owner-only visibility and all access/publish rules stay unchanged.
- Library rows show the owner first, followed by “, (owner)” in normal
  weight, matching the mock. List each collaborator's username on its own
  line below, in membership order, with the same spacing as title to owner.
  Keep names bold and muted as before. Rows grow to fit; long names truncate.
  Show members on both owned and shared rows, including published puzzles.
  Invitations disclose no email addresses in library rows. Missing member
  usernames use the dialog's existing “(no username)” fallback.

## Scope / non-goals

Presentation and authenticated read projections only; no membership writes,
sync protocol, migrations, permissions, engine or public route changes.
No unrelated visual redesign. The existing 66px rows remain when unshared.

## Acceptance

- Browser checks cover the link's position, 14px sizes and Rebus color match,
  Add → Edit → Add after adding/removing a member, pending invitations,
  and the names/owner marker visible to both owner and collaborator.
- Existing directly affected browser suites remain green. Amend only the
  obsolete S6 exact menu/editor labels and F6 source typography assertion;
  all authorization, dialog, focus and ownership assertions remain intact.
  This explicitly supersedes S6 decision 1's label, color and position and
  F6's Preview label size. Independent review precedes refreezing those
  assertions; these are requested product changes, not test weakening.

## Repo paths

`src/app/puzzles/{actions.ts,page.tsx,[id]/page.tsx}`;
`src/components/grid/{PuzzleGridEditor,BuilderSteps,RebusControl,PreviewToggle}.tsx`;
`src/components/puzzle/{PuzzleRow,PuzzleRowMenu,CollaboratorsDialog}.tsx`;
`src/components/ui/radio-source.test.ts`; `e2e/{collaborator-management,toggle-radio,collaboration-polish,row-menu,menu-reset,delete-published,duplicate}.spec.ts`; epic handoff.

The library page requests membership display metadata only for IDs returned
by the existing authenticated library query. A separate authenticated action
rechecks the same visibility predicate for those IDs, preserving listPuzzles
return shape and every existing access rule. The existing route-guard frozen
test requires database reads in actions rather than page modules; this scope
addition also adds focused database tests in
`src/app/puzzles/actions.collaboration-display.db.test.ts` for anonymous and
private-ID denial, owner/member names, public visibility and invitation expiry.
This is a risk-path change and requires independent PR review.

## Freeze evidence

Independent reviewer `review_polish` approved the four minimal assertion
amendments and new browser acceptance before runtime work. The corrected
Preview source assertion fails against the old runtime (1 failed, 2 passed),
confirming it detects the missing requested typography. Owner name line boxes
will have explicit 20px height for reliable spacing measurement.

## Definition of Done

`npm run verify` exit 0; story and directly affected browser specs pass under
the epic-integration exception, serialized under the guarded local test reset
standing grant. Independent review, passing configured CI, and normal PR merge
into `epic/24-collaboration`. The final epic full-suite gate is owed again
before main. UI-only rules are not tested by disabling them.

## Verification notes

The root checkout contains 7 GB of historical `.claude/worktrees`, which the
existing root lint command traverses, including their generated output. No
worktrees were deleted and no lint rules changed. Run `npm run verify` in a
clean temporary checkout with identical source content and the existing
dependencies. Database tests require local-network execution permission.

Keep git HEAD fixed throughout browser build and run: Next derives its
deployment ID from HEAD. An early run changed HEAD mid-run, causing stale-tab
reloads and invalidating interaction results; a stable-HEAD rerun passed all
60 tests in the five initially affected files. The final affected run and
verification identities are recorded in the handoff.
