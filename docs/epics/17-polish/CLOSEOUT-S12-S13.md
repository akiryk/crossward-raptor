# Polish S12/S13 independent closeout — 2026-11-16

## Status and attribution

The non-auditing orchestrator records this report from independent read-only
agent `/root/polish_closeout_audit`, which authored none of the audited work.
It audited delivered implementation `750289fa9fe37087d6371c4f9df96ef2579ebed8`
and six pending delivery-status documents under the repository's
[AUDIT](../../process/AUDIT.md) and [epic closeout](../README.md#close-an-epic)
rules. No runtime or acceptance blocker was found. Three nonblocking
documentation findings were returned and corrected by the orchestrator;
the same independent auditor rechecked the concrete corrections and this
record, confirmed all three findings resolved, and reported no remaining
blocker or drift in the rechecked scope. The orchestrator then closed the
epic and prepared this documentation-only closeout delivery.
S1–S11 closure records remain historical; this audit covers the reopened epic.

## Findings and disposition

1. **Wrong — S6 summary omitted an approved exception.** The audited
   `EPIC.md:335–344` and `:476–479` made an absolute selection claim that
   conflicts with the approved exception in
   [S6](stories/17-S6-only-real-words.md#settled-here-approved-2026-11-01),
   enforced by `e2e/real-words.spec.ts:138` and `:206`. The consequence would
   be incorrect future guidance for wordless cells. **Disposition:** corrected
   both epic summaries to defer to the approved exception; no implementation
   or frozen test changed.
2. **Stale/prunable — obsolete lint advice.** Audited `docs/LEARNINGS.md:249–250`
   said root lint traverses `.claude/worktrees`, requiring a clean checkout,
   while `eslint.config.mjs:18–19` excludes it. **Disposition:** removed that
   spent clause; retained guidance about HEAD changes during browser runs,
   Prisma generation and the Compose project.
3. **Stale/wrong — already-refrozen correction and obsolete gate exception.**
   Audited `docs/LEARNINGS.md:254–257` treated the DONE-icon correction as
   pending and allowed a failed full run plus passing individual reruns.
   Commit `b2d8ea1`, [S12 evidence](acceptance/S12-RUNTIME-EVIDENCE.md#done-icon-approval-and-final-verification)
   and `e2e/done-icon.spec.ts:415` contradict its correction status;
   [STORY](../../process/STORY.md#verification) and
   [CODE-REVIEW](../../CODE-REVIEW.md#verification-evidence) own the current
   clean-gate requirement. **Disposition:** recorded the completed refreeze,
   retained unresolved authentication observations and routed gate requirements
   to STORY. This drift never invalidated the current clean full pass.

## Coverage and evidence

The auditor read AGENTS, the audit skill/process, EPIC and all thirteen
stories, operational HANDOFF, relevant HISTORY/LEARNINGS, approval/case/refreeze
records and applicable story/review/handoff policies. It inspected the full
S12/S13 runtime/configuration diff and acceptance, the five-spec harness
correction and existing fresh-user helper, plus the synthetic accumulation
setup. It sampled relevant historical editor/play/grid, missing-hint, cursor,
typography, preview, rebus and mini-sizing source and corresponding acceptance.
No actual implementation path requires a risk-path PR.

Independently validated by the auditor:

- Human full browser report SHA-256
  `b8e4f0ee1c72d46726eed3a8d36d72dec657c26ebc4ecbcea0646b1eb218bc39`:
  all 1,460 unique case/project pairs match inventory, one passing attempt
  each, two workers, zero retries/skips/flaky/unexpected cases or report errors;
  Playwright final status is `passed`. Human shell exit code was not retained.
- All 443 applicable files match both the worktree and committed `750289f`,
  with manifest map SHA-256
  `dafaa319af63581ba9553bcf6f7dbb97ffaf1def00e6914e762ae0ecf108cb10`.
  Frozen acceptance matches `65c92af`; exact patches pass reverse checks.
- Both focused report hashes and passes (68/57.9s and 68/54.1s), plus retained
  accumulation controls: 1,200 private fixtures retained, 1,201 shared rows,
  two fresh rows and preserved public control.
- Reopened six retained S13 screenshots and the S12 phone hints-error image.
  Capture execution and original broader S12 visual coverage remain attributed
  to their original agents. Relative Markdown targets and diff checks pass.
- Main/origin main at `750289f`; unrelated untracked `CLOSEOUT-S11.md` retains
  its recorded hash and remains excluded from delivery.

The auditor reused the orchestrator's supplied final verify tool output and
provenance: exit 0, 114 files / 1,311 tests, two existing lint warnings. It ran
no suites. The human authored the full browser execution; the orchestrator
validated its retained reports and GitHub readback. GitHub has no check runs
or tracked Actions configuration. The orchestrator separately observed Vercel
implementation deployment success. Commands, raw report locations, original
visual attribution and preservation hashes remain in
[resumption evidence](acceptance/S12-S13-RESUMPTION.md).

## Pruning and limits

Current authorization, preservation, human-only full browser execution and
content-identity records remain load-bearing. Historical product-rule repetition
is partly covered by story acceptance, `word-cursor.test.ts` and
`rebus-entry.test.ts`; future archive compression may trim duplication while
preserving approvals, refreezes, unique failure evidence and accepted limits.
No whole historical entry is a deletion candidate.

LEARNINGS 1–7 retain general methods not enforced universally. Entry 8's fixed
Modal focus detail is partly mechanized; its general Strict Mode lesson remains.
Entry 9's repaired paths have `masthead-session-state.spec.ts` coverage, but
unresolved navigation guidance remains. Entry 10 receives only the scoped
corrections above; unique incident evidence and unresolved observations remain.
No whole LEARNINGS entry was deleted.

Historical acceptance was sampled/mapped, not exhaustively reproved; original
S1–S9 arithmetic and historical commit provenance were not fully re-audited.
No physical-device, non-Chromium, unsupported-field-sizing fallback or hosted
interaction check was performed. Public-fixture accumulation and the old
2.4-hour outlier remain limited to recorded evidence. The auditor performed
no tests, browser execution, database operations, edits, staging, commits or
external comments.

## Independent correction recheck

On 2026-11-16, `/root/polish_closeout_audit` independently inspected the exact
EPIC/LEARNINGS corrections and this root-authored record. It confirmed all
three findings resolved, accurate evidence attribution/coverage/pruning/limits,
passing documentation diff/link checks, unchanged executable content from
`750289f`, and preserved unrelated `CLOSEOUT-S11.md`. No suites, browser or
database operations ran. The root then updated only completion/deployment
status, committed the closeout documentation and proceeded with its authorized
push. No implementation or frozen acceptance changed after passing evidence.
