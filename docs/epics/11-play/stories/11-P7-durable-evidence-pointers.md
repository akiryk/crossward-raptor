# Story P7 — Durable evidence pointers

Resolve follow-up 8 from the
[closeout audit](../HISTORY.md#closeout-audit-2026-10-20): Play's tracked
docs cite evidence under `/private/tmp`, which the OS or a cleanup can delete.
Then a reader can't check the claims those paths support.

**Status:** done (2026-10-21). Approved as written and frozen on `main` in
`23352c2` by the human on 2026-10-21, with both pending decisions resolved as
recommended. Results are under [Implementation record](#implementation-record).
**Blast radius: none at runtime.** Documentation only, inside
`docs/epics/11-play/`. No CODE-REVIEW risk path. Direct delivery to `main`
after approval.

## Problem

The audit named `/private/tmp/crossward-p3-*.json`. The same defect covers
every `/private/tmp` citation in Play's docs: 15 in the archived snapshot in
`HISTORY.md` and one in `stories/11-P3-finishing.md:202`. The other two
occurrences (`HANDOFF.md:40` and audit item 8 at `HISTORY.md:628`) describe
this follow-up rather than cite evidence.

On 2026-10-20 every cited file still existed locally. They fall into two
kinds.

**Rebuildable from git.** These hash manifests duplicate content that commits
on `main` already pin. During drafting, every entry was recomputed with
`sha256(git show <commit>:<path>)`, with zero mismatches:

| Temporary manifest | Cited at | Files | Durable anchor |
| --- | --- | --- | --- |
| `crossward-p1-preexisting-acceptance-sha256.json` | HISTORY:281, :379 | 71 | `f446509` (parent of P1 freeze `b6f357a`) |
| `crossward-p2-refrozen-acceptance-sha256.json` | HISTORY:122 | 75 | `4e53740` |
| `crossward-p3-preexisting-acceptance-sha256.json` | HISTORY:82 | 75 | `4e53740` |
| `crossward-p3-resume-frozen-sha256.json` | P3 story:202 | 75 | `dbc3ee8` |
| `crossward-p3-verified-source-sha256.json` | HISTORY:480 | 206 | `3e0a4d5` (P3 reviewed head, on `main`) |
| `crossward-p3-verification-runtime.json` (six runtime hashes) | HISTORY:479 | 6 | `3e0a4d5` (also `2211e7a`) |

**Not rebuildable.** These are one-off observations: the P1/P2 checkpoint
drivers (HISTORY:162, :269), the P1/P2 screenshots (:170, :275), the P2 traces
and trace summary (:160–161), the P2 failure contexts (:209), the P3 visual
demo (:470) and the P3 provenance notes (:478). The tracked docs already state
what each one showed. That summary is the durable record; the file was only
supporting detail.

## Decisions

- **Point to commits instead of copying files.** Each rebuildable manifest is
  mapped to the commit that reproduces it. Nothing is copied into the repo.
  Copies would duplicate git, and some are large (P2 traces are 70 MB).
  The provenance notes also carry tool session IDs that have no meaning
  outside the session that produced them.
- **Leave the archived snapshot verbatim.** HISTORY's preamble promises the
  snapshot is "preserved verbatim", so its lines aren't rewritten. Instead, a
  short **Temporary evidence paths** note goes in the preamble, above the
  snapshot. It says `/private/tmp` paths below are temporary local artifacts
  that may no longer exist. It gives the commit anchor table for the
  rebuildable manifests, with a one-line rebuild recipe. It also says the
  non-rebuildable artifacts are superseded by the tracked text that
  summarizes them.
- **Edit the P3 story inline.** It isn't an archive. Its sentence at :201–202
  points to `dbc3ee8` instead of the temporary manifest.
- **Keep the audit record verbatim.** Item 8 stays as written. HANDOFF records
  follow-up 8 as resolved by P7, as it does for follow-up 7 and P6.

**Resolved at approval (2026-10-21, both as recommended):**

1. Accepted "point to commits and label the rest" over archiving the evidence
   files into the repo, for the reasons above.
2. Left out a general rule (for example in STORY's Verification section) that
   durable claims must be anchored to commits or tracked text, not `/tmp`.
   Epics 09 and 10 repeat the pattern, which
   argues for a rule, but a rule is a process change outside follow-up 8. It
   can be its own task if wanted.

## Non-goals

- `/private/tmp` citations in other epics (`09-accounts`, `10-ownership`
  HANDOFFs cite dozens). Those epics are closed; noted here only as an
  observation.
- Copying, moving or deleting any `/private/tmp` file.
- Any change to application code, tests, frozen acceptance, AGENTS or process
  docs.
- Follow-ups 9–12.

## Acceptance (documentation checks)

1. **Anchors rebuild.** For each table row, every manifest entry equals
   `sha256(git show <anchor>:<path>)` with zero mismatches, and each anchor is
   an ancestor of `main`. (Passed during drafting. Re-run at implementation
   while the files still exist. If a file is gone, record that and rely on the
   drafting result.)
2. **Coverage.** `grep -rn "/private/tmp" docs/epics/11-play` shows no
   citation outside (a) the archived snapshot, which the new preamble note
   covers, (b) audit item 8, (c) the new note itself, or (d) HANDOFF's
   follow-up list. Every rebuildable manifest named in the snapshot appears
   in the note's table.
3. **Preservation.** `git diff` changes nothing in HISTORY below the preamble.
   The P3 story changes only the :201–202 sentence. No path outside
   `docs/epics/11-play/` changes. `git diff --check` exits 0.
4. **Links.** New or changed relative links resolve.
5. **Handoff.** HANDOFF marks follow-up 8 resolved by P7, its next action moves
   to follow-up 9, and its resume prompt matches the next action.

No application or browser suites are required (STORY, Verification:
documentation-only).

## Repo paths

- `docs/epics/11-play/HISTORY.md`: preamble note only.
- `docs/epics/11-play/stories/11-P3-finishing.md`: lines 201–202.
- `docs/epics/11-play/stories/11-P7-durable-evidence-pointers.md`: this story,
  status updates.
- `docs/epics/11-play/HANDOFF.md`: state, next action, resume prompt.

## Definition of Done

Acceptance checks 1–5 pass and are recorded here. The change is committed to
`main` as one docs-only commit naming P7 and pushed. HANDOFF names follow-up
9 as the next job.

## Implementation record

Implemented on `main` (2026-10-21) against baseline `23352c2`. Checks run by
the implementing agent:

1. **Anchors rebuild: pass.** All six files still existed. Every entry
   recomputed from its anchor with zero mismatches: P1 preexisting 71
   (`f446509`), P2 refrozen 75 and P3 preexisting 75 (`4e53740`), P3 resume
   75 (`dbc3ee8`), P3 verified source 206 (`3e0a4d5`), P3 runtime 6 (both
   `3e0a4d5` and `2211e7a`). `git merge-base --is-ancestor` confirmed each
   anchor is an ancestor of `main`.
2. **Coverage: pass.** The `/private/tmp` grep shows only the new note,
   snapshot lines, audit item 8, HANDOFF's follow-up 8 and this story. The
   note's table lists all five manifests the snapshot names; the sixth
   (P3 resume) is cited only in the P3 story, now anchored to `dbc3ee8`.
3. **Preservation: pass.** HISTORY's diff is one hunk adding lines 8–26
   above the snapshot. The P3 story diff is lines 201–202 only. Only
   `docs/epics/11-play/` changed; `git diff --check` exited 0.
4. **Links: pass.** The new note's link to this story resolves; the existing
   `closeout-audit-2026-10-20` anchor matches HISTORY's heading.
5. **Handoff: pass.** Follow-up 8 marked resolved by P7; next action and
   resume prompt name follow-up 9.

Application and browser suites were not run (documentation-only).
