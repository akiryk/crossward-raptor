# Locked words — Handoff

## Read first

1. This handoff; AGENTS only if not already supplied.
2. [S13](stories/21-S13-tick-hover-button.md) (frozen; S12 only if
   needed), and `src/components/grid/PuzzleGridEditor.tsx`'s hover logic.
3. [EPIC](EPIC.md) "Changes from the human's visual testing (2026-11-07)"
   only if a decision is unclear.

**Only if needed:** [HISTORY](HISTORY.md) (the handoff as of 3d6952a:
S1–S11 delivery, verification, open items, audit notes).

## Current state (2026-11-07, implementation session)

S1–S11 are done and on `main`. S12 and S13 are **implemented and
committed locally on `main`, not pushed** (`origin/main` is 20957ed):

- **S12** `86c4e7b`. **Independent review: no code blockers.** One
  undeclared path, `LockWordControl.tsx`, has a comment-only change (the
  stale "full width" wording); the reviewer accepted it. Non-blocking
  notes for the human's visual check: on narrow windows the grid may
  jump 20px up on load (`hasLockRoom` starts true and the first
  measurement sets `mb-4`). A classic, non-overlay vertical scrollbar
  appearing doesn't trigger a re-measure.
- **S13** `76a6685`. **Independent review: one blocker (B1), not yet
  fixed.** `hoverTarget` for a `tickWord` skips S10's lockability check.
  Once the word is unlocked (by its button, or by the keyboard with the
  mouse on its letters), `tickWord` is still held. If its letters then
  change, the "Lock word" button stays, and a click stores an incomplete
  word. Fix in `PuzzleGridEditor.tsx`, render-time hover: when
  `!isTickWordLocked`, show the button only if `lockTargetAt` at the
  word's first cell in its orientation returns the same word (else null,
  or drop `tickWord`). Non-blocking notes: `wordHoldsCell` could simply
  export `holds`. After a click on the button, back on the same end cell
  (no `onHoverCell`), a turn no longer picks again (untested edge).
- `npm run verify` was red on `origin/main` since S13's freeze (the
  missing `tickTarget`). So the plan is to push S12 and S13 together once
  B1 is fixed and the gate is green.
- Not started: the closeout audit (S7–S13 unaudited); the epic is not
  closed. Leftovers: branch `story/21-S2-lock-a-word` (local and remote),
  stale `../crossward-raptor-s6-draft/`, scratch patches
  `../crossward-raptor-s12*-scratch*.patch`.

## Verification (observed, this session)

- S12 tree (`86c4e7b`): `tsc` fails only on `tick-target.test.ts` (S13).
  Lint 0 errors; vitest 721/721 excluding that file. Full `npm run
  test:e2e`: 1193 passed, 15 failed. 12 of those were S13's frozen cases;
  the other 3 (library-play ×2 `ECONNRESET`, rebus 17-S10-9, row-menu
  16-S2-6) passed 3/3 each when rerun alone.
- S13 tree (`76a6685`): `npm run verify` exit 0 (vitest 729/729,
  tick-target 8/8). The tick and hover specs passed 43/43, and the two
  tick specs 70/70 with `--repeat-each=3`. Full `npm run test:e2e`: 1201
  passed, 7 failed, none in a lock spec: library-play :191 and :419,
  play-entries :600, row-menu :410, status-icons :278 and :310,
  play-completion :469. These have not been rerun alone yet, so they are
  presumed load flakes, unproven.
- Frozen acceptance is unchanged: `git diff 20957ed 76a6685` touches only
  `src/` runtime files.

## Next action

On local `main`: fix S13's B1 and add the fix as its own commit. Rerun
`npm run verify`, the tick and hover specs, and the 7 E2E failures
alone. If any keeps failing, rerun the full `npm run test:e2e`. Then get
the fix independently re-reviewed, update this handoff and push `main`
(S12 + S13). The human then checks S12 and S13 visually (including the
S12 notes above). After that comes the closeout audit covering S7–S13;
close the epic only with the human's agreement.

## Resume prompt

Read docs/epics/21-locked-words/HANDOFF.md,
docs/epics/21-locked-words/stories/21-S12-button-before-word.md and
docs/epics/21-locked-words/stories/21-S13-tick-hover-button.md. Fix S13's
review blocker B1 on local `main`, verify, get it re-reviewed, then push
S12 and S13 to `main`.
