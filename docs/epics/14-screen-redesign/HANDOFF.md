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

## Next action

1. Independent review of S4 PR #27 per [REVIEW](../../process/REVIEW.md);
   the reviewer checks the read-then-write condition in `publishPuzzle`.
2. After merge, the human's visual check of the builder.

## Resume prompt

Read docs/epics/14-screen-redesign/HANDOFF.md and docs/epics/14-screen-redesign/stories/14-S4-builder-controls.md. Independently review S4 PR #27 (branch story/14-S4-builder-controls) per docs/process/REVIEW.md, and merge it if there are no blockers.
