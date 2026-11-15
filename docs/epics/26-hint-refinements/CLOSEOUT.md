# Hint refinements — S3 closeout evidence

## Authorization and baselines

The human's visual review of S1/S2 on 2026-11-15 requested See recognition,
full referenced play-row fill, and removal of individual word decoration;
then confirmed the secondary color `interactive-faint-hover` (#E8F7FF).
[S3](stories/26-S3-linked-hints.md) governs these changes. The existing
no-runtime-merge-to-main boundary remains.

Starting worktree: clean `epic/26-hint-refinements` at `74d130f`.
Independent agent `s3_amendment_review` approved the proposed semantic
acceptance corrections with no blockers/vacuity, checking preservation,
fixtures, focus and completion setup. Its sole note (EPIC still said two
stories) was corrected before refreeze.

Acceptance/specification-only main freeze: `26c15f7`, pushed and merged into
epic at `25384e0` before runtime changes. Only the now-conflicting S1 See
rejection/word-decoration acceptance was superseded. All With parser
assertions, S2 grid acceptance and F1 color assertions are retained. Original
S1/S2 baselines/evidence remain in [CLOSEOUT-S2](CLOSEOUT-S2.md) and
[HISTORY-S1](HISTORY-S1.md), scoped to their historical tested content.

## Prefreeze checks — orchestrator observed

On old runtime `74d130f` plus proposed amendments:

- `npm test -- src/lib/clue-reference.test.ts`: exit 1; four new See cases
  fail (parser returned null), 19 preserved cases pass.
- `npm run test:e2e -- e2e/linked-clues.spec.ts e2e/linked-hints.spec.ts`:
  exit 1; nine failed, three passed (26.1s). Six amended S1 surface cases
  reject existing substring decoration. New S3-2/S3-3 reject missing secondary
  row fill; S3-5 rejects existing substring decoration. Invalid-reference
  S3-4 and both setup cases pass. No missing-runtime gate is called a pass.
- Guarded local E2E preparation used DEVELOPMENT's standing test-reset grant;
  database runs serialized under `/tmp/crossward-e2e.lock`. No ad hoc data
  deletion or environment-file inspection.

## Implementation and final gates

Implementation agent `s3_runtime` changed only ten declared runtime paths:
parser, PlayerHints, PlayPuzzle, ProminentHint, PlayHintBar, HintsPanel,
HintBox, TextInput, and removal of obsolete ClueText/HintField code. Native
fields/text are direct again; no palette or engine/storage/server/schema/
collaboration paths changed. Orchestrator inspected actual diff; no risk paths.

Separate verifier `s3_verify` checks frozen amendments against `26c15f7` and
recorded the runtime binary diff SHA-256 before checks:
`b1e62d157cfe503e5720674fa7948d2c3310968f79778d02ac1a9edee7101654`,
on parent `25384e0` plus these source edits. After the passing first phase,
orchestrator observed the same staged hash and the same postcommit source diff
hash at runtime commit `656de61fbce93c049f0e2007394e0049f5bacc87`.
Only docs changed during the final full run; HEAD/source stayed fixed.

- `npm run verify`: exit 0, 114 files / 1,311 tests. Two existing lint warnings
  (`reset-with-locks.spec.ts` unused css; `request-logger/render.ts` unused
  reqJson). Approved localhost database access, no skipped tests.
- `npm run test:e2e -- e2e/linked-clues.spec.ts e2e/linked-entry.spec.ts
  e2e/linked-hints.spec.ts e2e/hints-panel.spec.ts e2e/hint-box.spec.ts
  e2e/preview-hints.spec.ts e2e/play-design.spec.ts e2e/narrow-play.spec.ts
  e2e/hints-grid-editing.spec.ts e2e/hint-phase-design.spec.ts
  e2e/missing-hints.spec.ts e2e/hint-preview-alignment.spec.ts
  e2e/small-screens.spec.ts e2e/inputs.spec.ts e2e/label-12px.spec.ts
  --workers=2`: exit 0, 238 passed (53.1s), including directly affected
  generic input/label styling. Test content/hash unchanged before/after.
- Full `npm run test:e2e -- --workers=2`: **exit 0, 1,429 passed (13.6m)**,
  one complete clean run on first S3 full attempt, fixed `656de61`; no focused
  reruns needed. Old S1/S2 full-suite results remain historical.
- Verifier's final readback: HEAD unchanged; source diff SHA-256 unchanged;
  `git diff --exit-code 26c15f7 -- e2e src/lib/clue-reference.test.ts` exit 0.
  Only docs changed; database lock released. No code/tests/config changes by
  verifier. Final docs do not change the tested runtime or acceptance.

Browser checks use `--workers=2`, the documented machine cap from epic 24's
HANDOFF operating notes (its S12 recorded a clean full pass at that cap).
Normal assertions, timeouts, projects and retries remain; no settings files
are changed. Guarded reset/lock rules above apply.

Final independent audit evidence and documentation/frozen checks passed.
Delivery is on `epic/26-hint-refinements`; the orchestrator verifies the final
push by remote readback (see live git for the final docs commit). Main remains
at acceptance-only `26c15f7`. Human visual check follows. No runtime merge to
main is authorized.

## Independent audit

Independent report-only agent `s3_amendment_review`, author of none of this
work: static audit clear, no source/scope/frozen-acceptance/dead-code blockers.
The same independent agent reviewed the proposed amendments without authoring
or editing them; all runtime was written by `s3_runtime`.

Coverage: current EPIC/all three stories and supersession; complete S3 runtime
diff; parser, current/outgoing play row precedence and plain text; focus/lock/
crossing/build/preview gates; native field restoration and all affected callers;
acceptance preservation, risk paths and relevant process/LEARNINGS.

Source evidence: parser `clue-reference.ts:10`; PlayerHints `:38` and `:64`;
PlayPuzzle `:170`; PuzzleGrid `:299`; editor `:762` and Preview `:1127`.
Static search confirmed no decoration components/props/callers under src.
The auditor independently reproduced the verifier's runtime diff hash above.
No risk paths or unexplained additions. S3 acceptance matches `26c15f7`;
S2/F1 acceptance unchanged. No pruning candidates: handoff evidence and
permission boundaries are operational, LEARNINGS remains broader guidance;
obsolete word-paint checks were intentionally removed with their feature.

Documentation findings: S1's link to renumbered EPIC items, S2's old item6
reference, and S2's word/cell style sentence were stale. Orchestrator corrected
these references/current S3 wording; auditor rechecked and cleared all three.
No acceptance changes resulted. No files or suites changed/run by auditor.

Final browser gates now pass, as reported by the independent verifier above.
Final audit evidence recheck confirmed clearance after the complete clean
browser pass: source/config unchanged from `656de61`, frozen amendments and
S2/F1 preserved, runtime hash unchanged, diff check 0. No new blockers.
Remote delivery readback belongs to the orchestrator; no human visual approval
is inferred from static review. No external CI pass is claimed. Auditor reran
no suites.

## Human visual check

The initial human review said the S1/S2 appearance looked good, then requested
S3's three changes. S3 visual approval remains pending. Local app restored
with `npm run dev`, ready at `http://localhost:3000`; Mailpit healthy. Check
reciprocal With/See in builder and play, full-row secondary fill, plain keyword
text and current cursor/word precedence. Startup is not a human visual pass.
