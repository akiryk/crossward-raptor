# Puzzles page — Handoff

## Read first

1. This handoff; AGENTS only if not already supplied.
2. The [EPIC](EPIC.md), then each story's "Delegated decisions".

## Current state (2026-11-02)

**S1–S4 done and delivered on `main`; closeout audit done, no blockers.
Human verification of S1–S4 passed; S5–S8 added by the human and in
progress under the extended delegation. The epic is not closed.**

- [S1 muted text](stories/18-S1-muted-text.md): approved by the human,
  frozen `1acb507`.
- [S2 two greens](stories/18-S2-two-greens.md), frozen `38090fe`.
- [S3 status icons](stories/18-S3-status-icons.md), frozen `68d031f`.
- [S4 filters](stories/18-S4-filters.md), frozen `8a49994`, implemented
  `3ca7da4`.
- [S5 DONE icon](stories/18-S5-done-icon.md), frozen `3b647f4`,
  frozen-test correction refrozen `758f7a6` (human-approved), implemented
  and delivered on `main`.
- [S6 narrow right margin](stories/18-S6-narrow-right-margin.md):
  **proposed, untracked** with `e2e/narrow-margin.spec.ts`; throwaway
  at `/tmp/18-S6-throwaway.patch` (not applied). The independent review
  approved it twice with should-fix items, all applied. Orchestrator
  decisions recorded in the story: S6 also fixes the date overflow it
  would cause, and titles come before the date (the date may wrap to two
  lines below 948px, 90px minimum title column). The same reviewer's
  final confirmation pass: **approve**, nothing blocking or should-fix
  remaining; ready to freeze. Discrimination observed by the drafter (in
  the story).
- [S7 hint preview alignment](stories/18-S7-hint-preview-alignment.md):
  **proposed, untracked** with `e2e/hint-preview-alignment.spec.ts`;
  throwaway at `/tmp/18-S7-throwaway.patch`. Not yet independently
  reviewed; its acceptance hasn't been run. **The human decided
  (2026-11-02):** in the builder, Preview Hints stacks wherever the
  editing list stacks (below 650px of room), and play is unchanged. In
  the stacked range (1140–1429px) Down's height may change on toggle;
  Across and every left edge never move. Orchestrator: the build-phase
  skeleton gets the same 6px inset. A drafter was writing the second
  decision into the story when this session ended; check that the story
  states it.
- S8 ([EPIC](EPIC.md#the-humans-additions-after-verification-2026-11-02)):
  not yet drafted.

S2–S4 ran under the human's 2026-11-02 delegation: "Orchestrate Epic
18's remaining stories (S2–S4) end to end. I delegate spec approval and
freeze for each story within the approved EPIC; use separate agents for
drafting, spec review, implementation and (where CODE-REVIEW requires)
PR review/merge. Log delegated decisions in each story. Stop only for
unresolved material product decisions, blockers, or unsafe operations.
Run the closeout audit at the end, then hand back to me for
verification." The human extended that delegation to S5–S8 on
2026-11-02 ("Extend the delegation"). Each story gets an independent
specification review; none of S2–S4 touched a CODE-REVIEW risk path.

### Human verification (2026-11-02)

Checked one item at a time on the dev server; all passed: muted text;
status icons, including the gray styles; green play rows; the desktop
filters layout, keeping the checked outline; how filters combine,
keeping "Other sizes" hidden for everyone; URL persistence, keeping
`replaceState`; the narrow panel; row menus and the play Reset; the
style guide's Checkbox. Every delegated decision in S2–S4 is kept as
built. Verification of S5–S8 is still to come.

## Closeout audit (2026-11-02)

An independent, report-only agent that authored none of the epic audited
it on `main` at `110f2af` per [AUDIT](../../process/AUDIT.md).

**Coverage:** the epic's docs and all four stories; the epic's runtime
and test files; LEARNINGS, CODE-REVIEW, the epic index; `git` history
and diffs from each freeze to HEAD, the risk paths since the epic began
(empty) and leftover greps (`CrosswordIcon`, `library-view`, Build/Play).
It confirmed that frozen acceptance changed only in the freeze commits,
that the stories' file counts and suite arithmetic hold, and that the
engine is untouched. **Not checked:** the E2E suite (shared database),
the mockups in `~/Downloads`, visuals, and every amendment-table row
(the counts were verified, the rows spot-checked).

**Findings and dispositions** (none a blocker):

- **W1** S4 restated the EPIC's "Others' 'Other sizes'" rule as
  "anyone's". *Fixed:* S4 now quotes the EPIC and records the reading as
  a delegated decision for the human.
- **W2** The handoff's verification named no commit. *Fixed* below.
- **Stale S1** The epic index said "S1 next". *Fixed.*
- **Stale S2** S2–S4 acceptance still said "*Proposed.*" *Fixed:* now
  "Approved and frozen" with each freeze commit.
- **Stale S3** The EPIC said the hover mock was missing. *Fixed:* notes
  S3 found it.
- **Stale S4** `Radio`'s `nav` variant now appears only in the style
  guide, and its comment names Build/Play. *Scheduled:* S8, at the
  human's request.
- **Stale S5** Frozen test headers and describe titles
  (`e2e/puzzle-library.spec.ts:18–27`, `'14-S2-3 Build'`,
  `'14-S2-4 Play'`; `library-source.test.ts:9–10`) still describe the
  removed views. *Scheduled:* S8, through STORY's correction procedure,
  at the human's request.
- **Prunable** This handoff's per-story detail. *Done:* compressed to
  status plus links. No LEARNINGS entry is spent.

## Verification

- S4 implementation `3ca7da4`: `npm run verify` exit 0 (Vitest 656 of
  656); full `npm run test:e2e` exit 0, 937 passed (S4 implementing
  agent).
- S5 implementation (orchestrator): `npm run verify` exit 0 (Vitest
  656 of 656); full `npm run test:e2e` exit 0, 944 passed, on a quiet
  machine; frozen acceptance diff against `758f7a6` empty. Earlier full
  runs failed only on timeouts and `ECONNRESET` while another
  repository's suite loaded the machine (load 20–35). Check the machine is
  quiet before a full run.

## Next action

Orchestrator: approve and freeze S6 (spec-only commit),
implement it from the throwaway (separate agent), and deliver after
`verify` and a full `test:e2e`. Then S7: check that the story records the
human's decisions above, independently review it, run its discrimination
(commands in the story), freeze, implement and deliver. Then draft,
review, freeze and implement S8. Serialize browser suites, and before a
full run check `uptime` and that no other repository's suites are
running: contention caused every earlier failure. Then hand back for the
human's one-at-a-time verification of S5–S8, and mark the epic closed.

## Resume prompt

Read docs/epics/18-puzzles-page/HANDOFF.md. As orchestrator under the extended delegation recorded there, finish delivering Epic 18's S5–S8 in order on main, then hand back to the human for verification.
