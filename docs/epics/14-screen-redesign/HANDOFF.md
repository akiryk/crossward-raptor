# Screen redesign — Handoff

## Read first

1. This handoff; AGENTS only if not already supplied.
2. The [EPIC](EPIC.md): Decisions and the next story's section.

**Only if needed:** the [Design system EPIC](../13-design-system/EPIC.md)
for the tokens, text styles and component Decisions this epic builds on;
its [stories](../13-design-system/stories/) for a component's settled
details.

## Current state (2026-10-26)

**The EPIC is approved** by the human (2026-10-25) and committed on `main`
in `22e0737`. Its pending questions are answered and recorded in its
Decisions.

**S1 is approved and frozen** on `main` in `a225e88`, a specification-only
commit: the [story](stories/14-S1-sign-in.md), its three new tests
(`e2e/sign-in.spec.ts`, `src/lib/username.test.ts`,
`src/components/auth/sign-in-source.test.ts`), the frozen-test amendments
under its "Retired and amended acceptance", the EPIC amendment and the Design
system handoff note.

**S1 is merged.** PR #25 (head `42da1bc`) was independently reviewed and
merged into `main` as `d75e82e` (2026-10-25), with no blocking findings. It
touches the risk path `src/app/puzzles/actions.ts`, removing the two
display-name actions. The username hook in `src/lib/auth.ts` is a
better-auth `before` hook on `/magic-link/verify`. It reads the token's
`name` before verification consumes it, then passes it through the hook's
returned context to an `after` hook. The after hook writes `displayName` only
while the stored value is blank. The reviewer checked this against
better-auth 1.7.5: tokens are stored plain by default, and the context a
before hook returns is merged onto the endpoint context.

**Heading line height settled** by the human (2026-10-25): the mockup's
Figma value is 54, so `--text-title-1--line-height` is now 54px
(`3.375rem`, was 52px), committed on `main`. Only the sign-in heading and the
style guide sample use `title-1`. Following the mockup, the pro-tip sits
16px below the sent line and the failure alert's two lines have the same
16px gap. The story sets neither gap.

**S2 is approved and frozen** by the human (2026-10-25): its Decisions,
Acceptance, retired and amended acceptance and *(drafting)* additions,
frozen on `main` in `ba9d99e`, a specification-only commit. The human
accepted the lost-acknowledgement delete gap, so `deletePuzzle` is
unchanged.

**S2 was corrected after the human's visual check** (2026-10-25), in
`4dc7886`, a specification-only commit on `main`. "Puzzles" now sits on the
content edge, and the Build/Play Radio on the content's right edge, its
labels on the heading's baseline. The icon keeps the human's SVG's 8px
corners. An independent subagent review approved it with no blockers; the
record is in the story's Correction section.

**S2 is merged.** PR #26 (head `9441b26`) was independently reviewed and
merged into `main` as `8fbc96a` (2026-10-25), with no blocking findings. It
touches the risk path `actions.ts`: `listPuzzles` filters to
`builderId = caller OR publishedAt not null` and adds `builderName`. The
changed paths are the story's declared runtime paths, and no test file
changed since the freeze. Implementation notes:

- `CrosswordIcon` draws the human's exported SVG, with `primary`/`inverse`
  fills and a per-instance clip id.
- The header uses last-baseline alignment, because the Radio's first
  baseline is its circle.
- The row's Delete and Reset share `ROW_CONTROL` in `library-row.ts`.
- The style-guide Puzzle Row samples are drawn at 679px inside a
  horizontally scrolling box, so `/style-guide` doesn't overflow at 375px.
  Their Delete calls the real `deletePuzzle` with a sample id, so confirming
  it there shows the failure line (non-blocking review note).

## Verification

The reviewer's runs on PR head `9441b26`:

- `npm run verify`: exit 0 (44 files, 602 Vitest tests; one pre-existing
  lint warning in `request-logger/render.ts`).
- `npm run test:e2e` (full suite, standing reset grant in
  [DEVELOPMENT](../../DEVELOPMENT.md#e2e-environment)): exit 0, 539 passed.
- CI: Vercel and Vercel Preview Comments passed; there are no other checks.

**S3 is approved and frozen** by the human (2026-10-25): the
[story](stories/14-S3-new-puzzle-dialog.md), its acceptance, the amendments
under its "Retired and amended acceptance" and the EPIC amendment (the
generated default name), frozen on `main` in a specification-only commit.
Acceptance:

- new: `e2e/new-puzzle-dialog.spec.ts`, `src/lib/puzzle-name.test.ts` and
  `src/components/puzzle/new-puzzle-source.test.ts`;
- amended: `e2e/new-puzzle.spec.ts`, `e2e/modal-a11y.spec.ts`,
  `e2e/inputs.spec.ts`, `e2e/toggle-radio.spec.ts`,
  `src/components/ui/input-source.test.ts` and
  `src/components/ui/radio-source.test.ts`.

**S3 is implemented on `main`** (2026-10-25), on top of freeze commit
`f82367c`: `NewPuzzleDialog.tsx`, the new `src/lib/puzzle-name.ts`,
`Radio.tsx` (`form` at `body-small`, optional `labelledBy`) and the
`sg-new-puzzle-dialog` style-guide sample. It's based on the drafting
throwaway, tidied, with one noun swapped ("Schedule" became "Snowflake").
No risk path changed, and the frozen acceptance is unchanged since
`f82367c`.

Verification (precommit tree, the same content as the implementation
commit):

- `npm run verify`: exit 0 (46 files, 610 Vitest tests; the one
  pre-existing lint warning in `request-logger/render.ts`).
- `npm run test:e2e` (full suite, standing reset grant): 548 passed.

**S3 corrected after the human's visual check** (2026-10-25). The human
asked that the generated name not be selected at open, only on a click.
They chose: focused, with the caret after the name. The correction (story
Correction section, three 14-S3-3 cases) was reviewed independently by a
subagent with no blockers, and frozen in `bd2d1ae`, a specification-only
commit. The runtime fix is in `NewPuzzleDialog.tsx` only. On the fixed
tree, `npm run verify` exited 0 (610 tests) and the full `npm run test:e2e`
suite passed (548).

**S3's visual check passed** (human, 2026-10-25): the corrected dialog is
accepted, so S3 is done.

**S9 (Modal entrance) is drafting** (2026-10-25). At the S3 check, the
human asked for a subtle open animation. They chose a fade plus a slight
grow (0.97 to 1, 150ms ease-out), an instant close and a separate story.
**The human approved S9's Decisions** (2026-10-25) and placed it after
S3, before S4. The [story](stories/14-S9-modal-entrance.md) and the EPIC
amendment are uncommitted on `main`.

**S9's proposed acceptance is written and observed** (2026-10-25),
uncommitted: `e2e/modal-entrance.spec.ts` (5 cases) and the
`playwright.config.ts` motion settings. It discriminates against `main`
and six wrong variants. A throwaway implementation passed the full suite
(553) and was reverted, so no runtime file is changed. The story's
"Observed" section has the results. Drafting found that the confetti reads
reduced motion, so its three specs run in a full-motion project. This
changes an agent Decision the human had already approved.

**S9 is approved and frozen** (2026-10-25). The human approved the
acceptance and the full-motion project, and chose to keep the confetti
checks (asked whether they earn their place). Frozen on `main` in a
specification-only commit: the story, `e2e/modal-entrance.spec.ts`,
`playwright.config.ts` and the EPIC amendment.

**S9 is implemented on `main`** (2026-10-25), on top of freeze commit
`6a098d5`: two keyframes and two classes in `globals.css` (a
reduced-motion rule swaps the panel to the fade), applied to Modal's
backdrop and panel. No risk path changed, and the frozen acceptance is
unchanged since `6a098d5`. Verification on the implementation tree:

- `npm run verify`: exit 0 (46 files, 610 Vitest tests).
- `npm run test:e2e` (full suite, standing reset grant): exit 0, 553
  passed.

**S9's visual check passed** (human, 2026-10-25): the dialog entrance is
accepted with no change, so S9 is done.

**S4 (Builder controls)**: the human's answers and three mockups are
recorded in the [story](stories/14-S4-builder-controls.md)'s Decisions:

- numbered buttons, 1 doubling as the Edit the Grid toggle;
- cheeky too-early Publish dialogs and a Publish dialog;
- publishing needs every hint, enforced in `publishPuzzle` (a risk path,
  so S4 is a reviewed branch story);
- a "Published" + "Play it!" state, with no Unpublish (publishing is
  final) and no published message;
- Clear letters and the builder's Delete removed;
- "hints" throughout;
- one closing rule for every dialog.

Its pending questions were answered by the human (2026-10-26); the title
is `title-1`. **The human approved the Decisions** (2026-10-26),
including keeping `unpublishPuzzle` with no caller until S8.

**S4 is approved and frozen** (2026-10-26). The human approved the
proposed acceptance, including the narrower read-then-write rule: the
publish must be a write conditioned on what was read (for example `hints`
or `updatedAt` in the update's `where`); a plain transaction isn't enough.
The freeze is the specification-only commit `548e7dd` on `main`: the [story](stories/14-S4-builder-controls.md), the EPIC
amendment, the new `e2e/builder-controls.spec.ts` (24 cases) and
`src/app/puzzles/actions.publish-hints.test.ts` (10 cases), four retired
spec files plus `src/lib/stepper.test.ts`, and the amendments to 20
browser specs and two Vitest files listed in the story's "Retired and
amended acceptance".

A throwaway implementation, used while drafting to find every frozen test
the Decisions break, is kept as a patch outside the repo; its results are
in the story's "Discrimination" section. S4 touches the risk path
`publishPuzzle` in `src/app/puzzles/actions.ts`, so it is a reviewed
branch story (`story/14-S4-builder-controls`).

**S4 is implemented** (2026-10-26) on branch
`story/14-S4-builder-controls`, on top of freeze commit `548e7dd`, and is
awaiting independent review in PR #27. It is the drafting throwaway, with
`publishPuzzle`'s comments tidied. The changed paths are the story's
declared runtime paths and this handoff. Only the risk path
`src/app/puzzles/actions.ts` changes: `publishPuzzle` reads the eligible
puzzle, rejects it unless `hintsComplete`, then publishes with
`updateMany` whose `where` repeats the eligibility and adds
`hints: { equals: <hints read> }`. Every rejection throws the same error.
`unpublishPuzzle` stays with no caller (removal noted for S8). The frozen
acceptance is unchanged since `548e7dd`.

Verification on the implementation tree (the same content as the commit):

- `npm run verify`: exit 0 (46 files, 608 Vitest tests; the one
  pre-existing lint warning in `request-logger/render.ts`).
- `npm run test:e2e` (full suite, standing reset grant): exit 0, 549
  passed.

**S4 is merged.** PR #27 (head `aa5b4a2`) was independently reviewed and
merged into `main` as `7755ea6` (2026-10-26), with no blocking findings.
The reviewer confirmed the read-then-write condition in `publishPuzzle`,
and that the changed paths match the declared ones, with no test changes
since `548e7dd`. Non-blocking: the Publish dialog's Cancel still works
while a publish is pending, which the Decision allows.

**A flaky S2 test was fixed first.** 14-S2-6 "confirming deletes the
puzzle… focuses the heading" failed in all three full runs on S4's head
and in 1 of 10 isolated runs on `main`. The library focused its heading one
animation frame after a delete. Under load the Modal's close committed
after that frame and returned focus to the row's Delete button, which the
refreshed list then removed. `7d366c2` on `main` focuses the heading once
the deleted row has left the list (`PuzzleLibrary.tsx`, no test changes),
so this test passed 30 times in a row. On the merged tree (`7d366c2` plus
`aa5b4a2`, identical to `7755ea6`'s tree), `npm run verify` exited 0 (608
tests) and the full `npm run test:e2e` exited 0 (549 passed).

**S4's visual check passed** (human, 2026-10-26): the builder controls
look good.

**Human requests for a later story** (2026-10-26, seen while clicking
through S4), now fully specified by the human:

- **Enter-hints dialog copy:**
  - **Title:** "You sure?"
  - **Body:** "Creating hints will lock the black and white cells as they
    are now."
  - **Buttons:** "Yes, create hints" (confirm) / "Keep building" (cancel).
  14-S4-3 freezes today's copy, so this needs a specification change.
- **Preview:** clicking Create Hints turns Preview on immediately, as the
  dialog opens, if it's off. It stays on after Cancel ("Keep building")
  and after the dialog is closed any other way.

**S10 (Enter-hints dialog copy and Preview) was drafted** (2026-10-26).
The [story](stories/14-S10-enter-hints-dialog.md) adds the EPIC amendment
(S10 after S4, before S5), the new `e2e/enter-hints-preview.spec.ts` (10
cases) and the 14-S4-3 amendment in `e2e/builder-controls.spec.ts`.
Drafting found that confirming with Preview on leaves the hints-phase grid
in Preview; the story's agent Decision turns Preview off on confirm.
Against `main`, 8 of the 10 new cases fail; a throwaway passed all 10.

**S10 is approved and frozen** (2026-10-26). The human approved its
Decisions and acceptance ("I'm happy with S10"), including the 14-S4-3
amendment. Frozen on `main` in a specification-only commit: the story,
the EPIC amendment, `e2e/enter-hints-preview.spec.ts` and the amended
`e2e/builder-controls.spec.ts`.

**S10 is implemented on `main`** (2026-10-26), on top of freeze commit
`7e3bb41`: the new copy in `EnterHintsDialog.tsx`; in
`PuzzleGridEditor.tsx`, Preview turns on as the dialog opens and off on
confirm. It is the drafting throwaway unchanged. No risk path changed, and
the frozen acceptance is unchanged since `7e3bb41`. Verification on the
implementation tree (the same content as the commit):

- `npm run verify`: exit 0 (46 files, 608 Vitest tests; the one
  pre-existing lint warning in `request-logger/render.ts`).
- `npm run test:e2e` (full suite, standing reset grant): exit 0, 559
  passed.

**S10's visual check passed** (human, 2026-10-26), so S10 is done.

**S11 (Keyboard focus ring) is drafting** (2026-10-26). At S10's check,
the human asked for `outline: 2px solid #00f0ff` on keyboard focus only,
on buttons (including the toggle) and links, and chose to include Radio
options. This supersedes the "No focus rings" decision in epics 13 and 14.
The [story](stories/14-S11-focus-ring.md), the EPIC amendments (here and a
pointer in epic 13), the new `e2e/focus-ring.spec.ts` (13 cases) and the
proposed amendments to `buttons`, `masthead`, `modal-design` and
`color-tokens` specs and `globals-css.test.ts` are uncommitted on `main`.
No runtime file is changed. Against `main`, 10 of the 13 fail. A throwaway
(`/tmp/crossward-drafts/14-S11-throwaway.patch`) passes all 13. With it,
the full `npm run test:e2e` passed 572 and `npm run verify` exited 0.
Drafting found a latent bug in `buttons.spec.ts`'s `look()` (an in-page
call to the spec's `parseColor`), amended with the same meaning.

**S11 is approved and frozen** (2026-10-26). The human approved its
Decisions and acceptance, including the amendments ("I read and approve
s11"), and chose to leave its implementation for later and draft S5 next.
Frozen on `main` in a specification-only commit: the story, the EPIC
amendments, `e2e/focus-ring.spec.ts` and the amended specs and
`globals-css.test.ts`. No runtime file is changed; the throwaway patch is
still in `/tmp/crossward-drafts/`.

**S5 (Build grid and hint skeleton) is approved and frozen**
(2026-10-26). The human supplied a desktop mockup with exact values and
answered every question (recorded in the
[story](stories/14-S5-build-grid.md)'s Decisions). After seeing the
throwaway running on the dev server, they asked for a 40px gap between
skeleton rows, the palette's `cell-warning` at `#CEB55A` and a Preview
legend (second mockup), which they placed in S5, then approved the story
and its acceptance, including the retirements and amendments ("Yes,
approved"). Frozen on `main` in a specification-only commit: the story,
the EPIC amendments (here and epic 13's palette table),
`e2e/build-grid-design.spec.ts` (31 cases) and the retirements and
amendments (`phase-controls`, `published-lock`, `typography`,
`color-tokens`, `globals-css.test.ts`, `keyboard-intent.test.ts`).

A browser showing the old grid after the patch was applied needed a dev
server restart; the human's screen colors are Display P3, so on-screen
picks differ from the sRGB token values.

**S11 is done** (2026-10-26). Implemented on `main` in `b7984c2`, frozen in
`ec5e786`. The human's visual check passed ("I checked s11 and it looks
good, approved").

**S5 is implemented on `main`** (2026-10-26) in `70c678c`, on top of
freeze commit `7a2087a`. It contains the drafting throwaway plus the 40px gap,
`#CEB55A` and the new `PreviewLegend.tsx`. No risk path changed, and the
frozen acceptance (`e2e/`, `*.test.ts`) is unchanged since `7a2087a`.
Verification on the committed tree (tested uncommitted, then committed
unchanged):

- `npm run verify`: exit 0 (46 files, 608 Vitest tests).
- `npm run test:e2e` (full suite, standing reset grant): exit 0, 597
  passed, in 7.3m. Another project's Playwright suite and a Docker VM
  were loading the machine (load average about 20 on 8 cores).

The earlier run's 9 failures were caused by load, not by S5. Rerun alone,
`new-puzzle`, `modal` and `modal-a11y` passed. Only `library-play` P5
"clicking anywhere on a row…" still failed under parallel load. That
frozen test makes about seven navigations within the default 30s budget.
On the pre-S5 runtime it took 25.6s and 28.2s, and failed at 33.1s with
tracing on. So it is an existing timing-margin flake, made more likely by
heavy machine load. If it recurs, it may need a timeout correction through
STORY's frozen-test correction procedure. The test was not changed.

**S6 (Hint phase) is approved and frozen** by the human (2026-10-26) on
`main` in the specification-only commit "Freeze S6: hint phase, Hint Input
and hint-cell tokens": the [story](stories/14-S6-hint-phase.md), the EPIC
amendment, `e2e/hint-phase-design.spec.ts` (22 cases), the retirements in
`e2e/style-guide.spec.ts` (D8-3) and `e2e/hints-panel.spec.ts` (P5-2) and
the token-list amendments in `e2e/color-tokens.spec.ts` and
`src/app/globals-css.test.ts`. No runtime file is changed. Against
`main`, 17 of 22 fail (5 guards pass). A throwaway
(`/tmp/crossward-drafts/14-S6-throwaway.patch`, not committed; if it is
gone, implement from the story) passed the full suite, 617 of 617, with
`npm run verify` exiting 0.

**S5's visual check passed** (human, 2026-10-26), so S5 is done.

**S6 is implemented on `main`** (2026-10-26), on top of freeze commit
`53e28fe`. It is the drafting throwaway unchanged. It adds the five
`hint-cell-*` styles and their swatches; the locked grid's colors, with a
focused hint's word in blue; the EDIT GRID yellows; `primary` cell letters
and numbers; Hint Inputs in the skeleton's frame; and a locked grid with
no `tabindex`. A click on the locked grid returns before focusing it. The
changed paths are the story's declared runtime paths. No risk path
changed, and the frozen acceptance (`e2e/`, `*.test.ts`) is unchanged
since `53e28fe`. Verification on the implementation tree (the same content
as the commit):

- `npm run verify`: exit 0 (46 files, 608 Vitest tests; the one
  pre-existing lint warning in `request-logger/render.ts`).
- `npm run test:e2e` (full suite, standing reset grant): exit 0, 617
  passed.

**S6's visual check asked for a correction** (human, 2026-10-26). The locked
grid, its blue, EDIT GRID's yellows and the Hint Inputs passed. In EDIT
GRID the human asked for the build grid's colors, the hints faded to 0.4,
and the selected word's hint at full opacity with a yellow input. The
story's "Correction (2026-10-26)" section, the EPIC amendment and the
amended acceptance are drafted, **uncommitted on `main`**, with a
throwaway runtime in the same worktree (also saved as
`/tmp/crossward-drafts/14-S6-correction-throwaway.patch`). An
independent subagent review found one blocker: the story's original S6
text contradicted the Correction. It is now marked superseded, the three
non-blocking notes are taken, and the correction is frozen on `main` in a
specification-only commit ("Freeze S6 correction", `2da5a9d`).

**S6's correction is implemented on `main`** (2026-10-26), on top of
`2da5a9d`: the throwaway runtime unchanged (`globals.css`,
`ColorSwatches.tsx`, `PuzzleGrid.tsx`, `HintsPanel.tsx`,
`PuzzleGridEditor.tsx`). No risk path; the frozen acceptance is unchanged
since the freeze. Verification:

- `npm run verify`: exit 0 (46 files, 608 Vitest tests).
- `npm run test:e2e` (full suite, standing reset grant): exit 0, 621
  passed. A first run failed only `editing.spec.ts` P3-2 "an edit survives
  a reload once the debounce window has passed" (build phase, a fixed
  800ms wait for the 500ms autosave); it then passed 5 of 5 alone and in
  the full rerun.

**S6's visual check passed** (human, 2026-10-27: "I looked at the latest
work and I approve"), so S6 is done.

**S7 (Play) is drafting** (2026-10-27), uncommitted on `main`: the
[story](stories/14-S7-play.md), the new `e2e/play-design.spec.ts` (21
cases) and `src/components/play/play-source.test.ts` (2), and the
amendment to `e2e/play-entries.spec.ts` (P2 "typing after selection…":
fills replace the inset rings). No runtime file is changed. The human
chose the NYT-like Prominent Hint, compact Player Hints, a hint click
that selects its word (new behavior, an EPIC amendment at freeze) and a
builder-like title and controls, and supplied a mockup (the grid and
Across list; the selected hint `play-cell-selected-row`). Against `main`
every new case and the amended one fail. A throwaway
(`/tmp/crossward-drafts/14-S7-throwaway.patch`, reverted) passes them;
with it `npm run verify` exited 0 (610 Vitest tests) and the full
`npm run test:e2e` passed 641 of 641.

**S7 is approved and frozen** (human, 2026-10-27: "I approve S7"), on
`main` in a specification-only commit ("Freeze S7: play"): the story, the
EPIC amendment, `e2e/play-design.spec.ts`,
`src/components/play/play-source.test.ts` and the amended
`e2e/play-entries.spec.ts`.

**S7 is implemented on `main`** (2026-10-27), on top of freeze commit
`5f2afc2`: the drafting throwaway unchanged (`PuzzleGrid.tsx`,
`PlayPuzzle.tsx`, `PlayReset.tsx`, the new `PlayerHints.tsx` and
`ProminentHint.tsx`, `Button.tsx`, `GridExamples.tsx`). No risk path;
the frozen acceptance is unchanged since `5f2afc2`. Verification on the
implementation tree, S12's draft tests stashed out:

- `npm run verify`: exit 0 (47 files, 610 Vitest tests; the one
  pre-existing lint warning in `request-logger/render.ts`).
- `npm run test:e2e` (full suite, standing reset grant): exit 0, 641
  passed.

**S7's visual check passed** (human, 2026-10-27: "I approve S7"), so S7
is done.

**S12 (Letters and hints together) is drafting, revised** (2026-10-27),
uncommitted on `main`: the [story](stories/14-S12-letters-and-hints.md),
the new `e2e/hints-grid-editing.spec.ts` (21 cases), and 23 retired and 20
amended frozen cases plus styles and section lists across 12 test files
(listed in the story). No runtime file is changed. The human asked for it
while reviewing S7: no EDIT GRID, letters editable beside the hints, the
shape locked. **The human didn't approve the first draft** (2026-10-27)
and asked for two changes, now in the story: in the hints phase 1 is a
done button (gray-400 `button-done`, 70px, the "1" gray, a Material check
fading in as the label fades out), and a "Lock Grid Letters" toggle
replaces Preview (on: on cells `hint-cell-locked-on` gray-200, no grid
focus, a focused hint's word still blue). Agent choices to review: the
150ms+150ms fades with a 300ms fill/width change, instant under reduced
motion and on load; 1 stays disabled and named "Build the Grid"; the
toggle is off on every load and absent once published. Against S7's
`main`, 40 browser cases fail, 20 of the 21 new among them (the published
guard passes). The revised throwaway
(`/tmp/crossward-drafts/14-S12-throwaway-v2.patch`, reverted) passed
`npm run verify` (604 Vitest tests) and the full `npm run test:e2e`, 646
of 646.

**S12 is approved and frozen** (human, 2026-10-27: "I approve the revised
S12 draft"), on `main` in a specification-only commit ("Freeze S12:
letters and hints together"): the story, the EPIC amendment,
`e2e/hints-grid-editing.spec.ts` and the retirements and amendments in
the 12 test files the story lists. Next it is implemented from the v2
throwaway.

**S12 is implemented on `main`** (2026-10-27), on top of freeze commit
`2b61fd2`: the v2 drafting throwaway unchanged (the 11 runtime files the
story lists). No risk path; the frozen acceptance is unchanged since
`2b61fd2`. Verification on the implementation tree:

- `npm run verify`: exit 0 (47 files, 604 Vitest tests; the one
  pre-existing lint warning in `request-logger/render.ts`).
- `npm run test:e2e` (full suite, standing reset grant): exit 0, 646
  passed.

**S12's visual check passed** (human, 2026-10-27: "I approve S12. It
looks good!"), so S12 is done.

**S8 (Old-token cleanup) is approved and frozen** (2026-10-27). The
human answered both questions (remove `unpublishPuzzle` here, so S8 is a
reviewed branch story; draw a legacy build-phase black cell as
`build-cell-off`) and approved the
[story](stories/14-S8-old-token-cleanup.md) and its acceptance, including
the retirements and amendments ("I approve S8"). Frozen on `main` in a
specification-only commit: the story, the EPIC amendment, the new
`e2e/old-tokens.spec.ts` (7 cases) and
`src/app/old-tokens-source.test.ts` (6), and the amended `color-tokens`,
`style-guide`, `shell`, `typography` and `text-styles` specs,
`globals-css.test.ts` and two `actions.*.test.ts` files, with
`google-font.test.ts` deleted. Against `main` all 13 new cases fail; a
throwaway (`/tmp/crossward-drafts/14-S8-throwaway.patch`) passed
`npm run verify` (595 Vitest tests) and the full `npm run test:e2e`, 652.

## Next action

Implement S8 on `story/14-S8-old-token-cleanup` from the freeze commit
(from the throwaway; if it's gone, implement from the story) and open a
PR for independent review. The author does not merge it.

## Resume prompt

Read docs/epics/14-screen-redesign/HANDOFF.md and docs/epics/14-screen-redesign/stories/14-S8-old-token-cleanup.md. S8 is approved and frozen; implement it on story/14-S8-old-token-cleanup from the freeze commit and open a PR for independent review; do not merge your own PR.
