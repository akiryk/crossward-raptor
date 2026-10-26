# Screen redesign — Handoff

## Read first

1. This handoff; AGENTS only if not already supplied.
2. The [EPIC](EPIC.md): Decisions and the next story's section.

**Only if needed:** the [Design system EPIC](../13-design-system/EPIC.md)
for the tokens, text styles and component Decisions this epic builds on;
its [stories](../13-design-system/stories/) for a component's settled
details.

## Current state (2026-10-25)

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

A throwaway implementation from drafting is in `/tmp/S3-throwaway/`.

## Next action

Implement S3 on `main` (low-medium blast radius, no risk path) against the
frozen acceptance, run `npm run verify` and the full `npm run test:e2e`,
then deliver on `main`.

## Resume prompt

Read docs/epics/14-screen-redesign/HANDOFF.md and docs/epics/14-screen-redesign/stories/14-S3-new-puzzle-dialog.md. S3 is approved and frozen on main; implement it on main against the frozen acceptance, verify and deliver.
