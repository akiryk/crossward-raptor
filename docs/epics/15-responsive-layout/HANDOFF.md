# Responsive layout — Handoff

## Read first

1. This handoff; AGENTS only if not already supplied.
2. The [EPIC](EPIC.md)'s [Open at closeout](EPIC.md#open-at-closeout-2026-10-29),
   for what's left for later work.

**Only if needed:** the [stories](stories/) for a layout's settled
details; [HISTORY](HISTORY.md) for the closeout audit and the per-story
verification in the pre-closeout handoff. Don't load HISTORY for routine
startup.

## Current state (2026-10-29)

**The Responsive layout epic is closed.** All six stories are done on
`main`, each with a passed visual check *(human)*, delivered directly
(no risk path). Each story's status line names its freeze and
implementation commits.

The independent, report-only closeout audit ran on `main` at `49c1efb`,
by a fresh agent that authored none of the work. It found no blockers.
This session recorded it and applied the dispositions in one commit
([record and dispositions](HISTORY.md#closeout-audit-2026-10-29)):

- Doc corrections: S6's case count (35), the EPIC's 608px threshold and
  S1 wording, approved details no longer marked proposed, the cell-number
  floor, S3's stale acceptance heading and run note, and every story's
  status line opening "done".
- `HintArrow`'s unused `className` prop is removed (the only runtime
  change).
- Open items went to the EPIC's Open at closeout: the Modal clipping, epic
  14's three leftovers, the 320px library overflow, a stale frozen test
  name, the tab helpers omitting `textarea`, a possible `WrappingField`
  style guide sample, intermittent e2e failures, and repeated layout
  literals.
- The epic index lists the epic as closed.

## Verification

This session's runs, on the closeout tree:

- `npm run verify`: exit 0 (48 files, 600 Vitest tests; the one
  pre-existing lint warning in `request-logger/render.ts`).
- `npm run test:e2e` (standing reset grant in
  [DEVELOPMENT](../../DEVELOPMENT.md#e2e-environment)): not one clean
  full run. Three runs on a machine about 9 GB into swap: 767 passed / 9
  failed, then (a rerun of four specs without the reset) 80 / 5 with
  `ECONNRESET` from the server, then 772 / 4 (timeouts and visibility
  waits). Each run failed a different set; no case failed twice, and the
  last run's four failing specs then passed 58 of 58. The first run
  overlapped a running dev server. Treated as load flakiness, not a
  regression; the only runtime change removes an unused prop.

## Next action

None in this epic. Epic 16 (puzzle lifecycle) is next: drafting its S1
for the human's approval.

## Resume prompt

Read docs/epics/16-puzzle-lifecycle/HANDOFF.md and docs/epics/16-puzzle-lifecycle/EPIC.md. Draft S1's specification (EPIC.md's "S1 — Unlisted") with proposed acceptance on main, for the human's approval; don't freeze or implement it.
