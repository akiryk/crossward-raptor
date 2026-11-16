# Story S12 — Quiet saved state

Remove the persistent “Saved” message from puzzle construction and play.
In play, reclaim the empty status row so the title is closer to the puzzle.

**Status: approved and refrozen (2026-11-15); runtime local; verification stopped at the human’s request (2026-11-16).**
The human explicitly authorized S12 runtime implementation on 2026-11-15.
The human approved the independently reviewed expanded acceptance correction on
2026-11-15 by requesting its separate specification-only commit and refreeze.
Current checks and independent reviews are recorded in
[runtime evidence](../acceptance/S12-RUNTIME-EVIDENCE.md).
No implementation commit or delivery has occurred.
The human's response, “I approve S12 and S13”, approves this specification,
the 23-case executable acceptance and the exact 26-case supersession patch
in the [approval packet](../acceptance/README.md). The patch is applied in
this story's specification-only freeze commit on `main`. The prior independent
specification review is recorded in [evidence](../acceptance/EVIDENCE.md).
Product details labelled “proposed” below are now approved as written.

## Current behavior

`SaveStatus.tsx` renders “Saved” at the end of the builder step row after
an edit is acknowledged. Its minimum height and invisible pseudo-element
reserve space even when its text is empty. The owner's collaboration link
shares a group with the status in `BuilderSteps.tsx`.

`PlayPuzzle.tsx` renders “Saved” on a 32px desktop controls row for an
unfinished puzzle, between the title and the Prominent Hint. The title has
32px bottom margin and the play layout has a further 27px top margin.
Simply removing the text would leave excessive space. Narrow play already
hides routine save messages. Save state also drives real failure/retry UI
and is used by several browser tests to wait for persistence.

## Decisions

- **Human request:** show no “Saved” success message in the builder's grid
  or hints phase, or during play, at any viewport width.
- **Proposed detail:** retain existing transient “Saving…” and “Waiting
  to save…” feedback where it currently appears. Preserve builder retry
  messages and player save-error messages, Retry controls, recovery warnings,
  session errors and completion messages. Only the successful idle state
  becomes silent; no autosave or retry logic changes.
- **Proposed spacing:** in healthy, idle, unfinished wide play, place the
  Prominent Hint 32px below the title's box. Remove the empty controls-row
  height and its extra spacing rather than hiding its text. The existing
  16px between the Prominent Hint and grid stays. A short 52px hint therefore
  puts the grid 100px below the title's bottom. Actual messages may take
  space while displayed; do not reserve that space after they clear.
- In the builder, keep actual step controls, toggles and the owner's
  collaboration link. Remove layout space attributable solely to the idle
  status, including its reserved width/height. Preserve the collaboration
  link's right alignment with Rebus and prevent overflow at narrow widths.
- Keep internal save state available without visible success text. **Proposed compatibility detail:** retain the existing
  `save-status[data-state]` and `play-save-status[data-save-state]` hooks
  with empty text and no layout footprint in the idle state (including
  the builder before its first edit). Do not replace real persistence checks with arbitrary
  delays or treat hidden text as proof that a save succeeded.

## Non-goals / scope

No autosave timing, storage, collaboration-operation, engine or database
changes; no new success icon or toast. No redesign of builder controls,
completion/reset UI, or narrow play's title/hint arrangement. Error and
retry feedback remain accessible and visible as before.

## Frozen acceptance

Frozen executable acceptance: [`e2e/quiet-saved-state.spec.ts`](../../../../e2e/quiet-saved-state.spec.ts),
covering the approved acceptance:

1. **17-S12-1:** At 1440px and 390px, save grid letters, hints and a title
   in the builder; after acknowledgment, no visible or announced “Saved”
   message and no reserved idle-status box. Reload to confirm persistence.
   Cover an owner and a collaborator; keep their existing control permissions.
2. **17-S12-2:** At 1440px, idle unfinished play has no visible or announced
   “Saved”, no empty controls row, 32px from title bottom to Prominent Hint
   top, and 16px from hint bottom to grid top (1px geometry tolerance).
   Cover fresh and resumed sessions, and returning from a completed-puzzle
   reset. At 390px, no routine save message or new gap is introduced.
3. **17-S12-3:** Type a player entry, wait for actual successful persistence,
   reload and confirm the entry. The idle success state is silent again and
   returns to the compact spacing. Preserve ongoing-save state tracking.
4. **17-S12-4:** Fail an editor send and a player save: existing retry/error
   text remains readable, with functional retry/recovery. When saving succeeds,
   the error disappears, entries persist, and idle space is reclaimed. Test
   transient saving feedback without changing debounce, retry or journal rules.
5. **17-S12-5:** At 1440px, 1000px, 390px and 320px, builder controls remain
   usable and the owner's collaboration link aligns with Rebus at the right;
   there is no horizontal overflow or standalone blank status row. Test both
   grid and hints phases and a saving-to-idle transition. Completed play keeps
   its completion message and Reset behavior.

### Approved acceptance correction (2026-11-15)

The independently reviewed exact [correction patch](../acceptance/17-S12-correction.patch)
(SHA-256 `47cd8ab8cd782d4f86935b1fd64f876a33888594752af9f4e2b10889ab5618de`)
is approved and applied in a separate specification-only main commit before
resuming verification. Two hints-test branches explicitly select Across with
ArrowRight after clicking the first cell; persistence assertions are unchanged.
The wide narrow-play case requires the idle save hook to be acknowledged, empty
and hidden while retaining all other visibility assertions. This adds one
existing-case supersession to the original 26-case inventory below. No S13
acceptance changes.

### Approved DONE-icon settling correction (2026-11-15)

The human explicitly approved applying the independently reviewed
[exact patch](../acceptance/17-S12-done-icon-correction.patch), SHA-256
`b0f4aec9ae762ace339e18f0fa4f15a2aaf67bd6cbfcd0233f05fdab5e40581e`,
as a separate specification-only commit and refreeze before completing S12
verification and delivery on main. Independent read-only agent
`/root/s12_done_icon_review` found no blocking defect in that exact proposal;
its review limits are recorded in [runtime evidence](../acceptance/S12-RUNTIME-EVIDENCE.md).
The reset case in `e2e/done-icon.spec.ts` now polls for the existing `PLAY_ROW`
background after mouse-out before capturing the icon. All pixel assertions,
tolerances, timeouts and case counts remain unchanged. S13 frozen acceptance
and runtime are outside this correction.

### Approved frozen-acceptance supersessions

The approved exact
[`17-S12-supersession.patch`](../acceptance/17-S12-supersession.patch)
is based on `61bb72a`; the [case inventory](../acceptance/CASES.md#s12)
names every affected test. Applied in S12's specification-only freeze commit.

- `e2e/play-design.spec.ts`, **14-S7-4**, title and successful-status cases:
  retain title content/type; replace title-to-status geometry and visible/styled
  “Saved” with empty acknowledged hook, no footprint, 32px title-to-hint and
  16px hint-to-grid geometry. The failed-save and completed-play cases stay.
- `e2e/completed-play.spec.ts`, **19-S1-3** confirming reset (corrected from
  the outline's S1-2), and **19-S1-4** wide unfinished guard: replace visible
  success status with empty acknowledged hook and compact geometry. Preserve
  all reset/session/completion/focus/cursor/Rebus checks. S13 separately owns
  the reset hint's prefix replacement.
- `e2e/editor-operations.spec.ts`: seven cases in **24-S3-E1**, **E2** and
  **E5**; `e2e/live-sync.spec.ts`: seven cases in **24-S4-E1**, **E2**, **E3**;
  `e2e/collaborators.spec.ts`: both **24-S5-E1** cases;
  `e2e/conflicts.spec.ts`: **24-S7-E6** through **E10**;
  `e2e/collaborator-management.spec.ts`: **24-S6-E4** removal case.
  Replace each successful “Saved” text wait with `data-state="saved"`,
  preserving every timeout and operation/version/refusal/retry/conflict/
  persistence assertion. Only the E1 test title and header contract change
  beyond those waits.
- Consumer sweep complete: attribute-only waits in play entries, completion,
  opening, deletion, library and rebus stay unchanged because their hooks are
  retained. Builder steps, collaboration alignment, Preview
  Hints, grid-size and wide-layout geometry tests need no S12 amendment.
  The original patch affected **26 existing cases**; the separately approved
  correction above adds the wide narrow-play case.

## Repo paths

Runtime candidates (inspect exact diff before implementation):

- `src/components/grid/SaveStatus.tsx`
- `src/components/grid/BuilderSteps.tsx`
- `src/components/grid/PuzzleGridEditor.tsx` (only if status composition needs it)
- `src/components/play/PlayPuzzle.tsx`

Acceptance: the new E2E file, the seven existing E2E files named above
(only via the approved exact amendment), and `../acceptance/`
for exact patches, inventory and evidence.
Documentation: this story, `../EPIC.md`, `../HANDOFF.md`, epic index.
The approval packet records the pre-implementation failure demonstration;
this freeze does not complete the implementation Definition of Done.
No declared runtime path is a CODE-REVIEW risk path; reclassify the actual diff.

## Definition of Done

- Prepare executable acceptance and exact frozen-test supersessions; obtain
  human approval and freeze a separate specification/acceptance baseline under
  [STORY](../../../process/STORY.md). The specification-only freeze establishes that baseline.
- Demonstrate new acceptance fails against the current visible-success/spacing
  behavior before implementing the approved scope.
- Preserve frozen acceptance outside approved supersessions. Run
  `npm run verify` and the full `npm run test:e2e` under DEVELOPMENT's guarded
  test-environment rules, serializing shared-database browser runs.
- Inspect desktop and phone layouts for title spacing, builder controls,
  successful-save silence and readable failure/retry feedback; record results.
- Deliver through the applicable repository gates and update the handoff with
  actual verification, approval and delivery state. S13 implementation needs
  its own approved baseline and authorization.
