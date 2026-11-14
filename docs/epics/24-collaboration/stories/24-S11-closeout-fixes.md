# Story S11 — Closeout fixes: toolbar sizes, ready-state shift, collaborator privacy

Approved by the human, 2026-11-14, after the final full E2E run and the
independent closeout audit at `93943f8` (see the epic handoff). Deliver on a
story branch and independently reviewed PR into `epic/24-collaboration`; no
main, production migrations or Vercel settings.

## Decisions

- **All build-toolbar controls are 14px** (the human chose this over keeping
  Reset Grid and Lock Word at 12px). Reset Grid and the Lock Word button use
  the same `body-normal` style (14px, 400, 20px line height) as S8's Preview
  label, Rebus and collaboration link. Colors, positions and behavior are
  unchanged. This supersedes 23-S1-2's 12px for these four controls only;
  the progress tooltip and every other `label` use stay 12px.
- **No ready-state shift.** At narrow widths (22-S2-7: 540px and 490px), the
  first edit's save status must not move the progress bar or grid. S8's
  right-aligned collaboration link must not wrap onto a new line when the
  status appears. Wrapping on narrow screens remains allowed as S8 specifies,
  provided the row's height doesn't change between the open and ready states.
- **Collaborator names only on own and shared rows** (the human chose this
  over showing them to anyone who can see a published puzzle). The library's
  collaboration metadata (`listLibraryCollaboration`: member names and
  `hasCollaborators`) is returned only for puzzles the caller owns or is a
  current member of. Other builders' published rows, public or played, get
  no metadata and show only the owner, as before S8. This narrows S8's "Show
  members on both owned and shared rows, including published puzzles" to the
  caller's own and shared published puzzles; `listPuzzles` and every other
  access rule are unchanged.

## Scope / non-goals

No changes to membership writes, invitations, sync, presence, publish,
database schema or migrations. No other typography or layout changes.

## Acceptance and frozen amendments

- `e2e/label-12px.spec.ts` 23-S1-2: the build-phase test expects Preview,
  Rebus and Reset Grid at 14px/400/20px and the tooltip still at 12px; the
  toggle-row Lock Word test expects 14px/400/20px. All other 23-S1 checks
  are unchanged.
- `src/app/puzzles/actions.collaboration-display.db.test.ts`: an outsider
  gets no metadata for another builder's public published puzzle, nor for
  an unlisted published puzzle they have played (with a member and a live
  invitation); that puzzle's member still sees the names. The
  live-versus-expired invitation counting is asserted for the owner.
  Anonymous denial, private-ID denial and owner/member names are unchanged.
- Unchanged and required to pass: 20-S1-1 (Reset Grid matches the Preview
  label's size), 21-S5-1 (Lock Word matches Rebus's style), 22-S2-7 (the
  ready state moves nothing) and all S8–S10 browser acceptance.
- Independent review of these amendments precedes a separate
  specification-only freeze commit on `epic/24-collaboration`, made before
  the story branch starts (the epic branch stands in for main here).

## Repo paths

`src/components/grid/{PuzzleGridEditor,BuilderSteps,StartOverDialog,LockWordControl}.tsx`;
`src/app/puzzles/actions.ts`;
`e2e/label-12px.spec.ts`; `src/app/puzzles/actions.collaboration-display.db.test.ts`;
this specification; the epic handoff. `actions.ts` is a risk path, so this
story needs independent PR review.

## Definition of Done

Clean-checkout `npm run verify` exits 0. The amended and directly affected
browser files (`label-12px`, `start-over`, `lock-word-toggle-row`,
`build-progress`, `collaboration-polish`, `collaborator-management`,
`puzzle-library`) pass, serialized under the guarded local test reset
standing grant, with HEAD fixed during build and run. Independent PR review,
configured CI passing, normal merge into the epic, local dev restored.
Then one clean full `npm run test:e2e` on the final epic branch before main.

## Freeze evidence

An independent `pr-reviewer` first requested the played-puzzle case, then
approved the amendments and this specification (2026-11-14). Against the
unchanged runtime the db file fails 2, passes 1 (both outsider assertions);
the label amendments fail on Reset Grid and Lock Word, still 12px.

## Implementation notes

- `listLibraryCollaboration` filters with `editableBy` (owner or member)
  instead of the library's full visibility rule; `listPuzzles` keeps it.
- Reset Grid and Lock Word use `text-body-normal`.
- Cause of the shift: at 490px the row has 450px; step, Next and S8's 120px
  link use 421px, so the first "Saved" wrapped the link (+30px). The save
  status now reserves its usual labels' width ("Saving…", an invisible
  zero-height `::before`, absent from text content and the accessibility
  tree), and for the owner sits with the link in one right-aligned group
  that wraps as a unit. Measured in the E2E build: open and ready rows are
  identical at 700/600/540/490/375px; at 490px and below the group starts
  on the second line. "Not saved — retrying" is wider and may still wrap;
  it is a rare error state outside 22-S2-7.

## Verification (implementation `a196993`, clean detached worktree)

- `npm run verify` exit 0: 113 files/1288 tests (2 lint warnings, no errors).
- Full `npm run test:e2e`, two workers: 1395 passed, 3 failed. All four
  original failures (23-S1-2, 20-S1-1, 21-S5-1, 22-S2-7) passed. The three
  failures were unrelated to S11 and environmental (load average about 6):
  `ECONNRESET` on `/api/auth/get-session` in library-play P5 and ownership
  O1, and a response body read after 24-S4-E4 ended.
- Rerun of those three files: 28 passed, 2 failed (other live-sync E1
  cases stuck on retrying under load); `live-sync.spec.ts` alone then
  passed 10/10. Every failing case has since passed at `a196993`.
- The final clean full E2E on the integrated epic branch is still due.
