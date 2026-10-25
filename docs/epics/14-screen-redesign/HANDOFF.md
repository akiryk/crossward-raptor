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

**S1 is approved and frozen** on `main` (2026-10-25) in a
specification-only commit: the [story](stories/14-S1-sign-in.md), its three
new tests (`e2e/sign-in.spec.ts`, `src/lib/username.test.ts`,
`src/components/auth/sign-in-source.test.ts`), the frozen-test amendments
under its "Retired and amended acceptance", the EPIC amendment (username at
sign-in, builder-name dialog removed) and the Design system handoff note.

Implementation is in progress on `story/14-S1-sign-in` (risk path
`src/app/puzzles/actions.ts`), for a PR and an independent review. The
mockups were shared in conversation only; ask the human to re-share them for
the visual check.

## Verification

- **Discrimination** (details in the story):
  - On current `main`, 21 of 22 browser cases fail. The one that passes is a
    guard, as expected. Both Vitest files fail.
  - A reverted throwaway implementation passed all of them.
  - Two deliberate mutations were each caught.
- ESLint passes on the three proposed files.
- `npm run verify` fails while they're uncommitted without runtime, by
  design.
- Docs were checked for links and consistency.

## Next action

Freeze S1: one specification-only commit on `main` with the story, the three
tests, the frozen-test amendments, the EPIC amendment and the Design system
handoff note. Then implement on `story/14-S1-sign-in` (removing the orphaned
`e2e/helpers/display-name.ts` there) and open a PR for independent review. Ask the human to re-share the mockups for the visual
check.

## Resume prompt

Read docs/epics/14-screen-redesign/HANDOFF.md and docs/epics/14-screen-redesign/stories/14-S1-sign-in.md. Freeze the approved story S1 on main, then implement it on story/14-S1-sign-in and open a PR; do not merge it.
