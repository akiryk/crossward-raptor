# Puzzles page — Handoff

## Read first

1. This handoff; AGENTS only if not already supplied.
2. The [EPIC](EPIC.md), then each story's "Delegated decisions".

## Current state (2026-11-02)

**S1–S9 done and delivered on `main`. Closeout audit of S1–S4 done, no
blockers; human verification of S1–S8 passed. S9, which the human added
during that verification, awaits the human's check on the dev server.
The epic is not closed.**

- [S1 muted text](stories/18-S1-muted-text.md): approved by the human,
  frozen `1acb507`.
- [S2 two greens](stories/18-S2-two-greens.md), frozen `38090fe`.
- [S3 status icons](stories/18-S3-status-icons.md), frozen `68d031f`.
- [S4 filters](stories/18-S4-filters.md), frozen `8a49994`, implemented
  `3ca7da4`.
- [S5 DONE icon](stories/18-S5-done-icon.md), frozen `3b647f4`,
  frozen-test correction refrozen `758f7a6` (human-approved), implemented
  and delivered on `main`.
- [S6 narrow right margin](stories/18-S6-narrow-right-margin.md),
  frozen `2921834` after an approving independent review, implemented
  and delivered on `main`.
- [S7 hint preview alignment](stories/18-S7-hint-preview-alignment.md),
  frozen `14958ed` after an independent confirmation review (approve
  with should-fix, resolved), implemented by a separate agent and
  delivered on `main`. The human's decisions (Preview stacks below 650px
  of room; only Down's height may change there) and the orchestrator's
  (the skeleton's inset and scrollbar room) are recorded in the story,
  with the observed discrimination.
- [S8 audit cleanups](stories/18-S8-audit-cleanups.md), frozen
  `4420aed` after an independent review and a confirmation review of the
  patches rebuilt after the reboot, implemented and delivered on `main`.
- [S9 first hint numbers fixed](stories/18-S9-first-hint-fixed.md),
  added by the human during S5–S8 verification and approved by the human
  directly (outside the S5–S8 delegation); frozen `5a4c797`,
  implemented and delivered on `main`.

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
built.

Then S5–S8, also on the dev server: all passed except one item. With
Preview Hints toggled, each column's first hint number rose 4px. The
human added [S9](stories/18-S9-first-hint-fixed.md) for it, approved
S9, and confirmed that everything else in S5–S8 passed, with every
delegated decision kept as built.

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
- S6 implementation (orchestrator): `npm run verify` exit 0 (Vitest
  656 of 656); full `npm run test:e2e` exit 0, 960 passed (944 + S6's
  16), load about 2; frozen acceptance diff against `2921834` empty.
  The `/tmp` throwaways did not survive a reboot; S6's was already in
  the worktree.
- S7 implementation (orchestrator): `npm run verify` exit 0 (Vitest
  656 of 656); full `npm run test:e2e` exit 0, 990 passed (960 + S7's
  30), on the second run. The first run had 989 passed and 1 failed:
  `builder-controls` 14-S4-6 "Play it! at rest link-muted", a one-shot
  color read after a mouse move. That file then passed 3 of 3 alone
  (`--repeat-each=3`). Frozen acceptance diff against `14958ed` empty.
- S8 implementation (orchestrator): `npm run verify` exit 0 (Vitest
  656 of 656); full `npm run test:e2e` exit 0, 987 passed (990 less the
  3 retired F6-4 cases); the story's `nav` grep finds nothing.
- S9 implementation (orchestrator): `npm run verify` exit 0 (Vitest
  656 of 656); full `npm run test:e2e` exit 0, 999 passed (987 + S9's
  12), on the second run. The first had 995 passed and 4 failed
  (`enter-hints` H1-1 ×3 with "session closed", `row-menu` 16-S2-8
  `ECONNRESET`) at load 10; those files then passed 25 of 25 alone.
  Frozen acceptance diff against `5a4c797` empty.

## Next action

The human checks S9 on the dev server: toggling Preview Hints at 1440px
and 1280px, each column's first number stays put (in one column, Down's
stays put relative to the Down label). If it passes, record it here and
mark the epic closed in the [epic index](../README.md). The closeout
audit above predates S5–S9; run another before closing only if the
human asks.

## Resume prompt

Read docs/epics/18-puzzles-page/HANDOFF.md. Walk the human through verifying Epic 18's S5–S8 one item at a time on the dev server, record the results, and close the epic on main if they pass.
