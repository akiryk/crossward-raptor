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
Acceptance, retired and amended acceptance and *(drafting)* additions. The
human accepted the lost-acknowledgement delete gap, so `deletePuzzle` stays
as is. The freeze is a specification-only commit on `main`: the
[story](stories/14-S2-puzzle-library.md), the new
`e2e/puzzle-library.spec.ts` and `src/components/puzzle/library-source.test.ts`,
the new action cases, the amendments to 9 frozen browser specs and 2 frozen
unit tests, the EPIC amendment and this handoff. S2 touches the risk path
`actions.ts`, so it's a reviewed branch story.

## Verification

The reviewer's runs on head `42da1bc`, the merged tree:

- `npm run verify`: exit 0 (43 files, 594 Vitest tests).
- `npm run test:e2e` (full suite): the first run exited 1, 515 passed. The
  two failures were `e2e/library-play.spec.ts` "resetting a partial/complete
  attempt from the library replaces only that row, in place". That spec then
  passed 55 of 55 at `--repeat-each=3`, and a full rerun exited 0 with 517
  passed. This looks like a load-related flake outside S1. Run under the
  standing reset grant in [DEVELOPMENT](../../DEVELOPMENT.md#e2e-environment).
- CI: Vercel and Vercel Preview Comments passed. They don't run the test
  gates.
- Frozen acceptance: no test file changes in `a225e88..42da1bc`.
- After the `title-1` change on `main`: `npm run verify` exited 0, and
  `sign-in`, `text-styles`, `typography`, `masthead` and the style-guide
  specs passed, 63 of 63. The full browser suite wasn't rerun.

## Next action

Implement S2 on `story/14-S2-puzzle-library` from the freeze commit, per
[STORY](../../process/STORY.md), and open a PR for independent review.

## Resume prompt

Read docs/epics/14-screen-redesign/HANDOFF.md and docs/epics/14-screen-redesign/stories/14-S2-puzzle-library.md. Once the human approves S2's acceptance, freeze it on main, then implement it on story/14-S2-puzzle-library; open a PR for independent review, no merge.
