# Building refinements — Handoff

## Read first

1. This handoff; AGENTS only if not already supplied.
2. The [EPIC](EPIC.md).

## Current state (2026-11-04)

The human approved the EPIC 2026-11-04, including the proposed details
in its Decisions (5fde635).

- [S1](stories/20-S1-start-over.md): done. Frozen at 54583c1,
  implemented and pushed on `main` (direct delivery).
- [S2](stories/20-S2-preview-cell-tooltips.md): done. Approved as
  drafted (keeping `text-label`), frozen at 3a96758, implemented and
  pushed on `main` (direct delivery).
- [S3](stories/20-S3-tooltip-stays.md): **frozen**, implementation in
  progress on `main`. Added 2026-11-04 at the human's request after S2
  shipped (the EPIC records it); the human approved the specification and
  acceptance as drafted 2026-11-04. Acceptance:
  `e2e/preview-tooltip-stays.spec.ts`.

The closeout audit was started 2026-11-04 and paused, unfinished, when
the human asked for S3, with no findings by then; it needs a full run
after S3.

Noticed while drafting S2: 18-S5-5 (`done-icon.spec.ts`) fails
intermittently on clean `main` (1 of 5 repeated), a library row's colour.
Not in this epic's scope.

## Verification

S1: `npm run verify` exit 0; full `npm run test:e2e` exit 0 (1028
passed) on the implementation; frozen acceptance unchanged from 54583c1.
Two unrelated one-off failures in earlier full runs are recorded in the
story.

S2: `npm run verify` exit 0; `preview-tooltips.spec.ts`
`--repeat-each=3` 31 passed; full `npm run test:e2e` exit 0 (1038
passed) on the implementation; frozen acceptance unchanged from 3a96758.

## Next action

Implement S3 against its frozen acceptance, direct to `main`.
After S3, epic 20's closeout audit.

## Resume prompt

Read docs/epics/20-building-refinements/HANDOFF.md and docs/epics/20-building-refinements/stories/20-S3-tooltip-stays.md. Implement S3 against its frozen acceptance on main; direct delivery.
