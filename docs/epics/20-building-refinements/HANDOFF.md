# Building refinements — Handoff

## Read first

1. This handoff; AGENTS only if not already supplied.
2. The [EPIC](EPIC.md).

## Current state (2026-11-04)

The human approved the EPIC 2026-11-04, including the proposed details
in its Decisions (5fde635).

- [S1](stories/20-S1-start-over.md): done. Frozen at 54583c1,
  implemented and pushed on `main` (direct delivery).
- [S2](stories/20-S2-preview-cell-tooltips.md): the human approved the
  specification and acceptance (`e2e/preview-tooltips.spec.ts`) as
  drafted 2026-11-04, keeping `text-label`; frozen on `main`.
  Implementation in progress (direct delivery).

Nothing is authorized beyond S2.

Noticed while drafting S2: 18-S5-5 (`done-icon.spec.ts`) fails
intermittently on clean `main` (1 of 5 repeated), a library row's colour.
Not in this epic's scope.

## Verification

S1: `npm run verify` exit 0; full `npm run test:e2e` exit 0 (1028
passed) on the implementation; frozen acceptance unchanged from 54583c1.
Two unrelated one-off failures in earlier full runs are recorded in the
story.

## Next action

Implement frozen S2 on `main` (direct delivery); its acceptance must
stay unchanged from the freeze commit.

## Resume prompt

Read docs/epics/20-building-refinements/HANDOFF.md and docs/epics/20-building-refinements/stories/20-S2-preview-cell-tooltips.md. Implement frozen S2 on main; direct delivery, nothing beyond S2.
