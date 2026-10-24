# Design system — Handoff

## Read first

1. This handoff; AGENTS only if not already supplied.
2. [EPIC](EPIC.md), especially its Decisions.

**Only if needed:** [epic 05](../05-visual-design/EPIC.md) for the token
conventions this epic keeps; `src/app/globals.css` for the old tokens.

## Current state (2026-10-24)

The epic is **approved** by the human (2026-10-24), including its proposals,
with the changes recorded in the EPIC: Preview stays a one-label toggle,
Build/Play becomes a radio choice (new Radio component, story F6), the style
guide becomes a plain catalog, `label` replaces the old 12px label now,
default line heights, 10px radii and 1px strokes, and the accepted contrast.
Inputs came from a redesign backlog, a Figma export
(`~/Downloads/components-colors-text-styles.pdf`) and desktop mockups.
Epics 14, 15 and the username epic are outlined in the EPIC but not created.

The [F1 story](stories/13-F1-color-tokens.md) and its acceptance
(`e2e/color-tokens.spec.ts`, `src/app/globals-css.test.ts`) are
**approved by the human (2026-10-24, reconfirmed at freeze)**, including the
28-test retirement, and **frozen on `main`** in a specification-only commit.
That commit also applies the deletion-only retirement in
`e2e/style-guide.spec.ts`. F1 runtime is in progress.

## Verification

F1 drafting only: the proposed Vitest file fails 3/5 on current `main` and
passes on a scratch correct stylesheet; the browser spec type-checks, lints
and lists 10 cases but hasn't run against the app. No application or full
browser suite run.

## Next action

Implement F1 against the frozen acceptance, run `npm run verify` and the
full `npm run test:e2e`, visually check the catalog, then commit and push
`main`.

## Resume prompt

Read docs/epics/13-design-system/HANDOFF.md and docs/epics/13-design-system/stories/13-F1-color-tokens.md. Freeze the approved F1 specification and its acceptance retirement, then implement F1 on main; push main only after verification passes.
