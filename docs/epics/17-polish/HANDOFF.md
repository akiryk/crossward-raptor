# Polish — Handoff

## Read first

1. [S11 — Smaller, centered mini grids](stories/17-S11-mini-grid-width.md).
2. This handoff and the EPIC's S11 item.

**Only if needed:** [HISTORY](HISTORY.md) for original S1–S10 closeout;
[STORY](../../process/STORY.md) for integration/delivery;
[LEARNINGS §10](../../LEARNINGS.md#10-known-browser-suite-flakes-and-what-a-full-run-needs-on-this-machine)
for the known browser flakes.

## Current state (2026-11-14)

S11 is complete, committed and pushed on `polish/17-s11-mini-grid`, in
`/private/tmp/crossward-mini-width`, based on `961d969`. No PR or merge.
The human authorized documentation, implementation, commit and push of
this editor-only mini change; no next story or integration into main was
part of this session.

Runtime changes only `PuzzleGridEditor.tsx`: exact 5×5 grid regions get a
500px cap and horizontal auto margins within the existing column. Lock
measurement uses that cap. Other sizes and player behavior are preserved.
Independent `mini_spec_review` reviewed runtime and each acceptance amendment
without remaining blockers; the reviewer edited nothing.

Freeze baseline `60d8941`, followed by independently reviewed specification-only
amendments `5f25068` and `58f6ef7`. Runtime was parked for each refreeze and
restored identically. Frozen browser acceptance is unchanged after `58f6ef7`.

Original main worktree's paused epic 26 changes were preserved: modified
`e2e/color-tokens.spec.ts` and `src/app/globals-css.test.ts`, untracked
`e2e/linked-clues.spec.ts` and `src/lib/clue-reference.test.ts`. Check live
state before integration; do not overwrite or commit those files as S11.

## Verification

Separate `mini_verification` agent, final baseline `58f6ef7` plus editor
blob `40847003cb886d897ccd46d9a57e24efe4dd771e`:

- `npm run verify`: exit 0, 113 files / 1,288 tests; two pre-existing lint
  warnings.
- `env COMPOSE_PROJECT_NAME=crossward-raptor npm run test:e2e -- --workers=2 --retries=1`:
  exit 0, 1,411 passed and two flaky (1,413 total). Both known flakes passed
  unchanged on their one retry: icon corner color and magic-link connection
  reset. All mini/new wide-layout cases passed first attempt. No assertion,
  timeout or configuration changes for retries.

The primary agent visually inspected desktop/phone screenshots: 500px grid
centered with 60px margins in its 620px column; phone grid fits 359px with
no overflow. Evidence: `/tmp/17-s11-final-verification.md` and
`/tmp/17-s11-mini-{desktop,phone}.png`. Earlier failing demonstrations and
reviewed supersessions are recorded in the story, not passing gate evidence.
The implementation commit retains the tested blob and frozen tests.

Browser server exited and shared lock released. Future runs must acquire
`/tmp/crossward-e2e.lock`; DEVELOPMENT's standing grant permits the guarded
local test reset. Use `COMPOSE_PROJECT_NAME=crossward-raptor` from this
worktree. An initial attempt without it created unused stopped Compose
resources before a port conflict; existing resources/data were preserved.

## Next action

Integrate the pushed S11 branch into main only when that task is authorized,
preserving epic 26 work and verifying any conflict resolutions. No human
action is needed for the completed commit/push task. Original S1–S10 closeout
remains historical in EPIC/HISTORY; S11 does not claim a new epic-wide audit.

## Resume prompt

Read docs/epics/17-polish/HANDOFF.md and docs/epics/17-polish/stories/17-S11-mini-grid-width.md. Integrate S11 from polish/17-s11-mini-grid on main; preserve epic 26 work and follow the repository's verification and delivery rules.
