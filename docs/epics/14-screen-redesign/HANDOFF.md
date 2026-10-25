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

**S1 is implemented** on `story/14-S1-sign-in` and pushed, with a PR open
for independent review (not merged). It touches the risk path
`src/app/puzzles/actions.ts` (removing the two display-name actions). The
username hook in `src/lib/auth.ts` is a better-auth `before` hook on
`/magic-link/verify` that reads the token's `name` before it's consumed and
passes it, through the hook's returned context, to an `after` hook that
writes `displayName` only while the stored value is blank.

**Visual check done** (2026-10-25) at 1280px against the three mockups the
human re-shared: form, error and sent states match. Two notes:

- Following the mockup, the pro-tip now sits 16px below the sent line, and
  the failure alert's two lines get the same 16px gap. The story sets no gap
  for either.
- The mockup's heading lines are about 61px apart, while the `title-1` token
  gives 52px. That's a Design system token, out of S1's scope; it's left for
  the human to decide on.

## Verification

On the final implementation tree, including the sent-gap change
(story branch, before commit; committed unchanged):

- `npm run verify`: exit 0 (43 files, 594 Vitest tests).
- `npm run test:e2e` (full suite): exit 0, 517 passed. Run under the
  standing reset grant in [DEVELOPMENT](../../DEVELOPMENT.md#e2e-environment).
- Frozen acceptance: `git diff a225e88` over the spec and test files is
  empty.
- Visual check against the mockups: done (see above).

## Next action

Independently review the S1 PR per [REVIEW](../../process/REVIEW.md) and merge
it if it passes.

## Resume prompt

Read docs/epics/14-screen-redesign/HANDOFF.md and docs/epics/14-screen-redesign/stories/14-S1-sign-in.md. Review the S1 pull request from story/14-S1-sign-in independently and merge it if it passes.
