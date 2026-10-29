# Responsive layout — History

Historical evidence, not startup reading or current instructions. Use
[HANDOFF.md](HANDOFF.md) for the current state.

- [Closeout audit (2026-10-29)](#closeout-audit-2026-10-29)
- [Handoff snapshot before closeout](#handoff-snapshot-before-closeout)

# Closeout audit (2026-10-29)

Independent, report-only audit per [AUDIT](../../process/AUDIT.md), by a
fresh agent that authored none of the epic's stories, on `main` at
`49c1efb`, after the human passed S6's visual check (2026-10-29). The
auditor edited nothing; a separate session recorded the result and
applied the dispositions.

**Coverage:** the EPIC, HANDOFF, all six stories, the epic index, the
relevant LEARNINGS entries, the epic's runtime and test changes, and
frozen-acceptance integrity (`git log fef423e..HEAD` on `e2e`,
`playwright.config.ts` and unit tests shows only freeze commits and the
S4 correction `6ea7f24`). `src/engine/**` unchanged; no 526px, `100vh`
or retired max-width values left in `src`. The auditor's `npm run verify`
exited 0 (600 tests). **Not checked by the auditor:** the e2e suite, the
human's visual checks, the S4 correction's review record, the style
guide in a browser, and S1's and S5's case counts line by line.

**Blockers:** none.

| # | Class | Finding | Disposition |
| --- | --- | --- | --- |
| 1 | Wrong | S6 and the handoff said 36 cases; the spec has 35 | S6 corrected; the discrimination run's 36 results noted |
| 2 | Wrong | EPIC's "about 606px"; 560 + 2×24 = 608 | EPIC corrected (Scope, Decision, S6 section) |
| 3 | Wrong | EPIC said S1 retires the 35px constants; S1 keeps the letter pitch | EPIC's S1 section corrected |
| 4 | Wrong | S6's "no new component" vs its `WrappingField` | S6 reworded; the style guide sample question went to Open at closeout |
| 5 | Stale | Epic index said "S1 to draft" | Index lists the epic as closed |
| 6 | Stale | Carried observations had no outcomes | EPIC's Open at closeout added |
| 7 | Stale | EPIC still marked approved details *proposed* | Marked approved, with the approving story |
| 8 | Stale | EPIC's "numbers stay `cell-number`" | Notes S6's 8px floor |
| 9 | Stale | S3's "Acceptance (proposed)", stale run note, 15-S3-7 without its retirement | Heading fixed; supersession and retirement noted |
| 10 | Stale | Status lines didn't open with "done" | Every story's status opens "**Status: done**" |
| 11 | Stale | A frozen test's name ("letters shrink…") no longer matches behavior | Open at closeout (needs the frozen-test correction procedure) |
| 12 | Stale | `HintArrow`'s `className` prop had no caller | Removed |
| 13 | Stale | Handoff's resume prompt | Replaced at closeout |
| 14 | Unenforced | `WrappingField`'s `tabIndex` serves test helpers that omit `textarea` | Open at closeout (frozen-test correction) |
| 15 | Unenforced | Intermittent e2e failures without follow-up | Open at closeout |
| 16 | Unenforced | Layout widths repeated as literals | Open at closeout |
| 17 | Prunable | Handoff's one-at-a-time rule and per-story verification | Moved here with the snapshot below |
| 18 | Prunable | LEARNINGS #2, #6, #7 still load-bearing | Nothing deleted |

# Handoff snapshot before closeout

The handoff as of `49c1efb`, kept for its per-story verification
evidence. Its links are relative to this directory.

## Responsive layout — Handoff

### Read first

1. This handoff; AGENTS only if not already supplied.
2. The [EPIC](EPIC.md).

**Only if needed:** epic 14's [Open at closeout](../14-screen-redesign/EPIC.md#open-at-closeout-2026-10-27)
for the carried items' original wording.

### Current state (2026-10-29)

**S1–S5 are done** on `main`:
[15-S1-560px-grid.md](stories/15-S1-560px-grid.md) (frozen `fef423e`),
[15-S2-wide-layout.md](stories/15-S2-wide-layout.md) (frozen `ff07a76`),
[15-S3-builder-narrow.md](stories/15-S3-builder-narrow.md) (frozen
`36529ab`, implemented `dc2cb48`),
[15-S4-builder-hint-box.md](stories/15-S4-builder-hint-box.md) (frozen
`cda1f8d`, corrected `6ea7f24`, implemented `a72c476`),
[15-S5-play-narrow.md](stories/15-S5-play-narrow.md) (frozen `6f91950`,
implemented `e45504d`). The human's visual checks passed, S1 and S2 on
2026-10-28, S3–S5 on 2026-10-29 *(human)*.

**S6 (small screens) is done** on `main`:
[15-S6-small-screens.md](stories/15-S6-small-screens.md) (approved
*(human, 2026-10-29)*, frozen `3132b12`, implemented `644417f`). The
human's visual check passed 2026-10-29 *(human)*.

Every story meets its Definition of Done. Epic closeout is authorized
*(human, 2026-10-29)* and needs the independent, report-only audit per
the [epic index](../README.md#close-an-epic).

Stories go one at a time *(human, 2026-10-28)*. The epic was approved
2026-10-27; its approval doesn't approve any story.

### Verification

On S6's implementation tree (2026-10-29): `npm run verify` exit 0
(600 unit tests); full `npm run test:e2e` 776 passed, exit 0, including
the 36 frozen S6 cases. An earlier full run had one hover-timing failure
in `builder-controls.spec.ts` 14-S4-6 that passed on rerun and in the
final run. `e2e/` is unchanged since the freeze. The guarded reset used the standing
grant in [DEVELOPMENT](../../DEVELOPMENT.md#e2e-environment).

### Next action

Epic closeout: a fresh agent that authored none of the work audits the
epic (report-only); a non-auditing session records the result and its
dispositions here.

### Resume prompt

Read docs/epics/15-responsive-layout/HANDOFF.md and docs/epics/15-responsive-layout/stories/15-S6-small-screens.md. Close out epic 15 per docs/epics/README.md#close-an-epic once the human's S6 visual check has passed, on main.
