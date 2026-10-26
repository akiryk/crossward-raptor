# Story S4 — Builder controls

Replace the builder's stepper with three numbered buttons ("1 Build the
Grid / 2 Create Hints / 3 Publish"). They switch the builder between grid
building, hint writing and the grid's letter editing. Publish opens a
dialog that either publishes or, cheekily, says why it can't yet. The title
moves to the top in the new style. Clear all letters and the builder's
Delete puzzle are removed. A published puzzle shows "Published" and a
"Play it!" link instead of the buttons. Publishing is final: there is no
Unpublish.

**Status: approved and frozen** (2026-10-26). The Decisions below come
from the human's answers and three mockups of 2026-10-25 and 2026-10-26.
The pending questions are answered (2026-10-26). **The human approved the
Decisions** (2026-10-26), including keeping `unpublishPuzzle` with no
caller until S8. **The human approved the acceptance** (2026-10-26),
including the narrower read-then-write rule (a write conditioned on what
was read; see [Publishing needs every hint](#publishing-needs-every-hint-human)),
and it is frozen on `main` with the EPIC amendment.

**Blast radius: high.** This changes the builder screen's whole control
surface, adds a publishing rule to `publishPuzzle` in
`src/app/puzzles/actions.ts` (a CODE-REVIEW risk path), and retires or
amends many frozen builder tests. The work goes on branch
`story/14-S4-builder-controls` with a PR and an independent review. No
schema change.

## Decisions

Inspected `PuzzleGridEditor`, `PhaseControls`, `Stepper`,
`src/lib/stepper.ts`, `PublishControls`, `ReadinessPanel`,
`src/lib/publish-readiness.ts`, `EnterHintsDialog`, `EditGridToggle`,
`PreviewToggle`, `ClearLettersButton`, `DeletePuzzleButton`, `PuzzleTitle`,
`PublishedLockMessage`, `Modal`, `ModalActions`, `Button`,
`publishPuzzle`/`unpublishPuzzle` in `actions.ts`, `hintsComplete` in
`src/engine/hints.ts`, and every frozen test that reads these controls
(see [Retired and amended acceptance](#retired-and-amended-acceptance)).
Also the human's three mockups: the build phase, the hints phase with the
title (2026-10-25), and the published state (2026-10-26). Both are exports at about 1.43×, so the measurements
below are divided by that and rounded.

### The numbered buttons *(human)*

- **Three F3 numbered `Button`s in a row**, in a container with test id
  `builder-steps`. Each button has `data-step-id` `build`, `hints` or
  `publish`:
  - **1:** "Build the Grid" in the build phase, "Edit the Grid" in the
    hints phase.
  - **2:** "Create Hints", in every phase.
  - **3:** "Publish".
- **One button is selected** (F3's `selected`, which renders
  `aria-current="true"` and has no hover or press response):
  - build phase: 1;
  - hints phase, writing hints: 2 (the mockup);
  - hints phase, editing the grid: 1.
  - 3 is never selected.
- **Clicking the selected button does nothing.**
- **Spacing *(mockup)*:** the buttons sit 10px apart. F3's sizes give
  "Build the Grid" 149.3px; the human's 147px is the mockup's export scale
  rounded, so F3 is unchanged (corrected while drafting the acceptance).

### What each click does *(human)*

- **Build phase:**
  - **1** is selected, so clicking it does nothing.
  - **2** opens the enter-hints dialog, as today.
  - **3** opens a [too-early dialog](#too-early-dialogs-human).
- **Hints phase, writing hints:**
  - **1** turns EDIT GRID on, so the letters become editable and the hint
    inputs are disabled, as today. It replaces the `EditGridToggle` button,
    which is removed.
  - **2** is selected, so clicking it does nothing.
  - **3** opens the "Not quite!" dialog if any required hint is blank, and
    the [Publish dialog](#the-publish-dialog-human-agent-copy) otherwise.
- **Hints phase, editing the grid:**
  - **1** is selected, so clicking it does nothing.
  - **2** turns EDIT GRID off. It's the only way back to writing hints
    *(human)*.
  - **3** behaves as when writing hints.
- **The grid's shape stays locked in the hints phase.** "Edit the Grid"
  changes letters only, as EDIT GRID does today. There is no way back to
  the build phase. The stepper's "the grid is locked" explanation is
  removed along with the stepper.

### Too-early dialogs *(human)*

Each dialog is a Modal with one "OK" footer button (test id `modal-ok`).
It closes like every other dialog (see
[Closing dialogs](#closing-dialogs-human)).

| When 3 Publish is clicked | Title | Body |
| --- | --- | --- |
| build phase, the first time since the page loaded | Lol. | I think you know you can't publish until you actually complete the puzzle. Carry on. |
| build phase, every later time | Nope. | Sorry. |
| hints phase, with any required hint blank | Not quite! | Some of the puzzle's words still need hints. |

- **The count lives in the page only.** A reload starts again at "Lol."
  It counts only build-phase clicks *(agent)*.
- **Flagging the blank hint lines in the error color** after "Not quite!"
  closes is deferred to a later story (S6, Hint phase) *(human)*.
- **Test ids:** `too-early-dialog` for all three. The title and body are
  read as text.

### The Publish dialog *(human, agent copy)*

It opens when 3 Publish is clicked in the hints phase with every required
hint written. The human will supply its final copy later. Until then it
looks like the other dialogs and uses this copy:

- **Title:** "Ready to publish?"
- **Body:** "Once it's published, your puzzle can be played, and it can't
  be changed."
- **Notes:** the remaining readiness findings, as `body-small` lines
  (`data-finding-kind`, kept). These are short answers ("2 answers are
  shorter than three letters.") and the symmetry finding ("The black-square
  pattern lacks 180° rotational symmetry."). They inform but never block
  publishing *(human)*. With none, no notes are shown.
- **Who can play it:** F6's `form` Radio, "Private" then "Public", labelled
  "Who can play it?". Private is selected by default, matching today's
  "Keep private" checkbox, which is removed *(agent)*.
- **Footer:** "Publish" (`modal-confirm`) and "Cancel" (`modal-cancel`),
  via `ModalActions`.
- **Publish:** flushes pending saves, then calls `publishPuzzle` with the
  chosen visibility, as today. EDIT GRID turns off *(agent)*. On success
  the dialog closes and the [published state](#published-state-human)
  shows.
- **If publishing fails:** the dialog stays open, with a `body-small`
  `error` line, "Couldn't publish. Try again." *(agent)*.
- **Test id:** `publish-dialog`.

### Publishing needs every hint *(human)*

- **`publishPuzzle` rejects a puzzle with a blank required hint**, and
  rejects it the same way as one that isn't eligible today (not the
  caller's, not in the hints phase, or already published). A required hint
  is blank when it's missing or contains only whitespace, as
  `hintsComplete` defines it.
- **The check is done when the puzzle is published, on the stored
  puzzle.** It must not be possible to publish a puzzle whose stored hints
  are incomplete at the moment of publishing, so the implementation must
  close the read-then-write gap with a write conditioned on what was read
  (for example `hints` or `updatedAt` in the update's `where`). A plain
  transaction around a read and an update isn't enough at Postgres's
  default isolation *(human, 2026-10-26, narrowed at the acceptance
  approval)*. The reviewer checks this.
- **The rule is new.** The readiness findings were only advice before,
  apart from the hints phase. This amends the EPIC's "No new puzzle,
  publishing or play behavior" Non-goal (see
  [EPIC amendment](#epic-amendment-applied)).
- **Already-published puzzles stay published.** No data changes, even if a
  published puzzle has blank hints.

### Published state *(human, 2026-10-26)*

- **The three buttons are replaced** by one row *(mockup)*:
  - "Published" in `title-3` `primary` (test id `publish-state`);
  - 20px later, the link "Play it!" to `/puzzles/<id>/play` (test id
    `play-link`), in `title-3` `link-muted`. It turns `button-hover` on
    hover and keyboard focus, over 150ms, like the Radio's labels
    *(agent)*.
- **The title, grid letters and hints stay read-only**, as today.
- **No published message** *(human)*. `PublishedLockMessage` ("This puzzle
  is published and read-only. Unpublish to make changes.") is removed.
- **No Unpublish** *(human)*. Publishing is final from the builder: a
  published puzzle can't be changed or returned to unpublished. This
  removes behavior, so it's named here and in the
  [EPIC amendment](#epic-amendment-applied). `unpublishPuzzle` keeps its
  owner check and stays in `actions.ts` with no caller *(agent)*, so
  `actions.ts` changes only for the hints rule. Its removal is noted for
  S8's cleanup.
- **The Preview toggle's row stays empty**, as in the hints phase.

### Title *(human mockup)*

- **At the top of the builder,** above the buttons, in `title-1`
  `primary` (44px/54px) *(human, 2026-10-26)*.
- **Still the editable inline title** (`puzzle-title`, kept), saved as
  today and read-only once published. It has no border at rest, a 1px
  `line-muted` underline on hover and a 1px `primary` underline while
  focused *(agent)*. The `font-display` and `ring` classes are removed.
- **The buttons, or the published row, sit 32px below the title**
  *(mockup)*.

### Preview toggle *(human mockup)*

- **Build phase only, as today:** left-aligned, about 27px below the
  buttons, with the grid about 12px below it *(mockup)*.
- **In the hints phase, the toggle's row stays empty**, so the grid
  doesn't jump when the phase changes *(agent)*.
- **The toggle itself is unchanged** (F6).

### Removed *(human)*

- **Clear all letters.** `ClearLettersButton` and its use are removed. The
  engine's `clearLetters` stays (`src/engine/**` is untouched), but nothing
  in the app calls it any more.
- **The builder's Delete puzzle.** `DeletePuzzleButton`, its inline
  confirmation and the `danger-zone` row are removed. Puzzles are deleted
  from the library (S2's dialog). This supersedes the EPIC's "Delete moves
  into a dialog" for the builder.
- **The stepper.** `Stepper`, `PhaseControls`, `src/lib/stepper.ts` and its
  test, and the style guide's `sg-stepper` sample (per the EPIC).
- **`EditGridToggle`**, `PublishControls` and `ReadinessPanel` are absorbed
  into the buttons and the Publish dialog.
- **Unpublish and the published message** (see
  [Published state](#published-state-human-2026-10-26)).
- **The `editor-actions` row** goes. Only the Preview toggle is left from
  it, and it moves into its own row.

### One word: "hints" *(human)*

The builder says "hints", never "clues". In this story that covers:

- the buttons;
- the enter-hints dialog:
  - **Title:** "Ready to create hints?"
  - **Footer:** "Create hints" / "Keep building"
  - **Body:** "Creating hints locks your grid…"; the rest of the body is
    unchanged;
- the readiness message "N clues are missing." becomes "N hints are
  missing." The Publish dialog never shows it, but `publishReadiness` still
  returns it.

The hint inputs' accessible names ("1 Across clue") and the style guide's
hint-row sample belong to S6, which redesigns them. The style guide's own
copy changes with its samples.

### Closing dialogs *(human)*

**Every dialog closes the same ways:** a click on the backdrop, the ×,
Escape, or its dismissing footer button (OK, Cancel, Keep building and so
on). The shared Modal already does the first three. This story records the
rule in the EPIC's Decisions, so later dialogs follow it. A dialog that's
busy, like a pending publish, may disable dismissal, as `Modal` already
allows.

### Style guide

- **`sg-stepper` is removed.**
- **New `sg-builder-steps` sample:** the three buttons in each of their
  three looks (build, writing hints, editing the grid), plus the published
  row.
- **New `sg-too-early-dialog` and `sg-publish-dialog` samples:** a button
  for each that opens the real dialog.

### Carried observations

- **Delete confirmation buttons touch:** resolved by removing the
  builder's Delete.
- **A long title clipping at 375px:** still deferred to epic 15.

## Non-goals

- The build grid's colors, the hint skeleton (S5), Hint Input and the
  hint-phase grid colors (S6), and play (S7).
- Flagging blank hint lines after "Not quite!" (S6, later).
- The Publish dialog's final copy (the human, later).
- Any engine change; deleting from the builder; a way back to the build
  phase; unpublishing.
- Spacing tuning beyond the mockup values above (epic 15).

## Pending questions

None. Answered by the human 2026-10-26: no Unpublish button; the title is
`title-1`; no published message, just "Published" and a link to play
(the published-state mockup).

## Retired and amended acceptance

Found by running the full suite against a throwaway implementation (see
[Discrimination](#discrimination-2026-10-26-observed)): every failure is
one of these entries.

- **Retired whole files:**
  - `e2e/stepper.spec.ts` and `src/lib/stepper.test.ts` (the stepper);
  - `e2e/clear-letters.spec.ts` (Clear all letters);
  - `e2e/delete.spec.ts` (the builder's Delete);
  - `e2e/publish-readiness.spec.ts`: the readiness panel, its "Nothing
    outstanding" line, and "findings never change what the stepper
    permits". The panel is gone, and a blank hint now blocks publishing.
    The notes are covered by 14-S4-5.
- **Retired cases:**
  - `publish.spec.ts`: "unpublishing returns it to the unpublished state"
    and "outstanding readiness findings do not block publishing" (the
    reverse is now the rule);
  - `publish-status.spec.ts`: "unpublishing returns the row to
    unpublished";
  - `published-lock.spec.ts`: PB4-2, "unpublishing restores editing";
  - `controls.spec.ts`: D2-4's two cases (the danger zone and the
    `editor-actions` gap).
- **Amended:**
  - **To the numbered buttons:** the stepper's `[data-testid="step"]` and
    `data-step-id` `clues` become `[data-testid="builder-steps"]` and
    `hints`. `data-step-status` `current` becomes `aria-current="true"`,
    and "build unavailable" becomes the "Edit the Grid" label. The
    `edit-grid-toggle` becomes 1 (on) and 2 (off). Files: `enter-hints`,
    `enter-hints-snapshot`, `modal`, `modal-a11y` (focus returns to the
    `hints` step), `modal-design`, `persistence`, `hints-panel`,
    `phase-controls` and `locked-grid`. In `enter-hints`, "the build step
    cannot take you back" now clicks 1 and checks that the grid goes to
    EDIT GRID and the puzzle stays in the hints phase across a reload.
  - **To the Publish dialog:** the publish helpers in `puzzle-groups`,
    `puzzle-list-layout`, `publish-status` (Public via the radio) and
    `published-lock` click 3, then the dialog's confirm, then wait for
    "Published". `publish.spec.ts` PB3-2 is rewritten in the same way:
    Private by default, Private and Public stored (read from the
    database, since the page no longer shows visibility), it survives a
    reload, and a grid-phase puzzle gets a too-early dialog.
  - **To "Published" with no Unpublish:** `published-lock` PB4-1 (no
    lock message, "Published", no numbered buttons) and PB4-3 (no Clear
    letters; 1 for EDIT GRID). The `builder-edits` published case opens
    locked, has no Unpublish, and doesn't change the stored puzzle.
    `puzzle-library` 14-S2-3 shows "Published" instead of the lock
    message.
  - **Other:**
    - `buttons` F3-9: the builder's buttons are the three numbered ones,
      and the enter-hints dialog's confirm is normal and its cancel
      alternate.
    - `controls` D2-1: pointer and fill are checked on the unselected
      numbered buttons.
    - `typography` D9-3: the help-text sample is the geometry-locked
      message.
    - `style-guide`: `sg-stepper` becomes `sg-builder-steps` in the
      section list.
  - **Vitest:**
    - `actions.builder-edits.test.ts`: the two cases that publish
      successfully seed every hint. The store's JSON `equals` filter now
      compares by value, so a write conditioned on the hints can match.
    - `src/lib/publish-readiness.test.ts`: one new case for "1 hint is
      missing." and "6 hints are missing.".

## Acceptance *(frozen)*

Two new files, plus the amendments above.

### e2e/builder-controls.spec.ts (24 cases, 1280×800)

1. **14-S4-1 the numbered buttons:**
   - labels, numbers, `data-button-type="numbered"` and the one
     `aria-current` button for the build phase, writing hints and editing
     the grid;
   - no `stepper`, `step`, `step-reason`, `edit-grid-toggle`,
     `readiness-panel`, `publish-button` or `private-checkbox`.
2. **14-S4-2 layout:**
   - the title above the buttons, with 32px between them (±1). The
     buttons share a row, 10px apart (±1). "Build the Grid" is about
     147px (±3). The toggle sits on the buttons' left edge, about 27px
     below them, and the grid about 12px below the toggle (±2);
   - in the hints phase there is no toggle, and the buttons and grid sit
     where they do in the build phase (±0.5);
   - the title is an editable input named "Puzzle title", in `title-1`
     `primary`. It has no visible border or ring at rest. On hover it has
     a 1px solid `line-muted` bottom border only, and while focused a 1px
     solid `primary` one, with no ring;
   - a renamed title is saved and survives a reload.
3. **14-S4-3 what each click does:**
   - clicking the selected button in each of the three looks opens no
     dialog and changes nothing;
   - in the hints phase, 1 turns EDIT GRID on: the hint inputs are
     disabled and typing overtypes a letter. 2 turns it off with no
     dialog, and a reload starts with it off;
   - in the build phase, 2 opens the enter-hints dialog: "Ready to create
     hints?", "Create hints" / "Keep building", a body that starts
     "Creating hints locks your grid." and contains no "clue". Confirming
     enters the hints phase, also in the database;
   - the builder's visible text has no "clue" in either phase.
4. **14-S4-4 too-early dialogs:**
   - "Lol." with its exact body, then "Nope." / "Sorry." three times. Each
     is closed a different way (OK, ×, Escape, backdrop) and has only the
     OK button. Nothing is published. After a reload it is "Lol." again;
   - with one whitespace-only hint: "Not quite!" with its exact body,
     closed each of the four ways, and also while editing the grid.
5. **14-S4-5 the Publish dialog:**
   - its title and body, and no notes when nothing is outstanding. The
     "Who can play it?" radiogroup uses the `form` variant, with Private
     (checked) then Public. The footer has Publish (`modal-confirm`) then
     Cancel (`modal-cancel`), and nothing else;
   - with a corner black square, the exact short-answers and symmetry
     notes, in `body-small` `primary`, and publishing still works;
   - closing it each of the four ways leaves the puzzle unpublished;
   - publishing as Private and as Public: the dialog closes, "Published"
     shows, the buttons are gone, and the database has `publishedAt` and
     the chosen visibility;
   - publishing while editing the grid saves the letter just typed and
     ends EDIT GRID;
   - with server actions aborted, the dialog stays open showing "Couldn't
     publish. Try again." in `body-small` `error`, with Publish enabled
     and nothing published; trying again publishes.
6. **14-S4-6 the published state:**
   - "Published" in `title-3` `primary`, and an `<a>` "Play it!" to
     `/puzzles/<id>/play`. There are no numbered buttons, no Unpublish, no
     lock message, no Preview and no "unpublish" or "read-only" text. The
     title and hints are disabled and typing changes no letter;
   - the row is 32px below the title (±1), with 20px between "Published"
     and the link (±1), on one line. The link is `link-muted` at rest,
     with a 150ms color transition, and `button-hover` on hover and on
     keyboard focus. Clicking it opens the play page;
   - publishing in the builder reaches the same state.
7. **14-S4-7 removed controls:** no `clear-letters-button`,
   `delete-puzzle-button`, `danger-zone` or `editor-actions`, and no
   "Clear all letters" or "Delete puzzle" text, in the build phase, the
   hints phase or the published state.
8. **14-S4-8 style guide:**
   - no `sg-stepper`;
   - `sg-builder-steps` has three `builder-steps` groups (build, writing
     hints, editing the grid) and the published row;
   - `sg-too-early-dialog` and `sg-publish-dialog` each open the real
     dialog.

### src/app/puzzles/actions.publish-hints.test.ts (14-S4-9, 10 cases)

- A complete puzzle publishes as Private and as Public.
- An empty, whitespace-only, missing or all-missing required hint is
  rejected, and nothing changes.
- A blank hint is rejected with the same error as an ineligible
  (grid-phase) puzzle.
- An extra hint for a key the grid doesn't need doesn't matter.
- A hint blanked between the action's read and its write isn't published
  over.
- The existing rules still hold: owner, hints phase, unpublished, valid
  visibility.

### Acceptance choices

- **New test ids:**
  - `builder-steps`, `too-early-dialog`, `publish-dialog`, `modal-ok`
    and `play-link`;
  - `publish-state` is kept, now on "Published".
- **The 147px width:** "Build the Grid" is checked at 147 ±3. F3 gives
  149.3px, and the mockup's 147 comes from its export scale.
- **Visibility is read from the database,** because the published row
  doesn't show it.
- **A failed publish** is made by aborting the page's server-action
  requests, as S2 did for delete.
- **The read-then-write gap** is tested with a store whose
  `$transaction` has no isolation, like Postgres's default. So only a
  write conditioned on what was read passes, for example `hints` or
  `updatedAt` in the update's `where`. A plain transaction around a read
  and an update wouldn't pass. The human approved this narrowing of the
  Decision (2026-10-26).
- **The pending Publish dialog** isn't tested for disabled dismissal. The
  Decision allows it but doesn't require it.

### Discrimination (2026-10-26, observed)

- **A throwaway implementation** of the Decisions: `BuilderSteps` (with
  `PublishedState`), `TooEarlyDialog`, `PublishDialog`, the editor and
  title, the "hints" wording, the style-guide samples, and
  `publishPuzzle` reading the puzzle and then writing on condition that
  the hints are unchanged. The listed files were removed and `Button`
  gained `data-step-id`. It was then reverted; a patch is kept outside the
  repo.
  - Against the unamended suite: 90 browser failures. Every one is in the
    retired and amended lists above, apart from three `buttons` F3-2/F3-3
    cases that timed out setting up the page under load and passed on the
    next run. The new layout case failed on "Build the Grid" (149.3px), so
    its tolerance went to ±3 and the Decisions were corrected.
  - With the proposed acceptance: `tsc` and ESLint passed (the one
    existing warning). Vitest passed 608 of 608. The full
    `npm run test:e2e` exited 0 with 549 passed.
- **Current `main`, proposed tests:**
  - Vitest: 7 failures, all new (the 6 new publishing-rule cases and
    the wording case). The other 601 pass, including the amended
    `builder-edits` cases.
  - Browser, the new spec and the 20 amended specs: 83 failed and 130
    passed. 23 of the 24 new cases fail. The one that passes on `main`
    is the title rename, which checks that saving is unchanged. Two
    `puzzle-library` 14-S2-2 cases failed with
    `net::ERR_NETWORK_IO_SUSPENDED` (the machine suspended its network)
    and passed on the throwaway.
- **Four mutations on top of the throwaway,** each caught:
  - no hints rule in `publishPuzzle`: 5 action cases failed;
  - a write not conditioned on what was read: the read-then-write case
    failed. A write conditioned on `updatedAt` instead passed all 61
    cases in both action files, so the test doesn't force one approach;
  - "Lol." on every click: the 14-S4-4 sequence failed;
  - publishing without first saving pending edits: the EDIT GRID publish
    case failed.
- **The worktree** matches its starting state plus the proposed tests,
  the retirements and this story. No runtime file is changed.

## EPIC amendment *(applied)*

- **Decisions:**
  - "Publish is a third numbered button" gains the dialogs and the
    published state; publishing is final, with no Unpublish
    *(human, 2026-10-26)*.
  - "Delete moves into a dialog" becomes: the builder's Delete and Clear
    all letters are removed *(human, 2026-10-25)*; the library's delete
    dialog stays (S2).
  - New: "Closing dialogs" and "One word: hints".
- **Non-goals:** the publishing exceptions are publishing needing every
  hint and the removal of Unpublish (S4).
- **S4's section:** updated to match.

## Repo paths

- Runtime:
  - `src/components/grid/PuzzleGridEditor.tsx`;
  - new `src/components/grid/BuilderSteps.tsx`, `TooEarlyDialog.tsx` and
    `PublishDialog.tsx`;
  - `EnterHintsDialog.tsx` and `PuzzleTitle.tsx`;
  - `src/components/ui/Button.tsx`: a `data-step-id` prop, so the numbered
    buttons can carry their step;
  - removed: `Stepper.tsx`, `PhaseControls.tsx`, `EditGridToggle.tsx`,
    `PublishControls.tsx`, `ReadinessPanel.tsx`, `ClearLettersButton.tsx`,
    `PublishedLockMessage.tsx`,
    `src/components/puzzle/DeletePuzzleButton.tsx`, `src/lib/stepper.ts`
    and its test;
  - `src/lib/publish-readiness.ts` (wording);
  - `src/app/puzzles/actions.ts` (`publishPuzzle`, risk path);
  - `src/app/style-guide/page.tsx`.
- Specification: this story, the EPIC and HANDOFF.
- Acceptance: new `e2e/builder-controls.spec.ts` and
  `src/app/puzzles/actions.publish-hints.test.ts`, the amendments and
  retirements under
  [Retired and amended acceptance](#retired-and-amended-acceptance).

## Definition of Done

Frozen acceptance passes unchanged; `npm run verify` exits 0; the full
`npm run test:e2e` suite passes; the PR is independently reviewed per
CODE-REVIEW; the human's visual check passes.
