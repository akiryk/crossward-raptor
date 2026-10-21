# Story P8 — Epic-qualified story IDs in LEARNINGS

Resolve follow-up 9 from the
[closeout audit](../HISTORY.md#closeout-audit-2026-10-20): LEARNINGS #3
cites "Story P3" and "Story P5" without naming the epic. Those stories belong
to epic 02. Since Play reused the P-prefix (`11-P1`–`11-P7`), a reader can't
tell which P3 and P5 are meant.

**Status:** done (2026-10-21). Approved by the human on 2026-10-21, with
both pending decisions resolved as recommended, and frozen on `main` in
`71e562c`. Drafted at `c67e75c`. Results are under
[Implementation record](#implementation-record).
**Blast radius: none at runtime.**
Documentation only. No CODE-REVIEW risk path. Direct delivery to `main`
after approval.

## Problem

Checked against the files during drafting:

- `docs/LEARNINGS.md:63-65`: "Story P3's scope note said `PuzzleGrid.tsx`
  wouldn't need changes … that Story P5 had to reconcile." The note is
  [`02-P3-cursor-editing.md:139`](../../02-builder-ui/stories/02-P3-cursor-editing.md)
  ("No changes to `PuzzleGrid.tsx` itself"). The reconciliation is
  [`02-P5-hints-panel.md:21`](../../02-builder-ui/stories/02-P5-hints-panel.md)
  ("`PuzzleGrid.tsx` — edited, or possibly reconciled"). Both P3 and P5 also
  exist in epic 11 (`11-P3-finishing`, `11-P5-library-play`).
- The same defect is in `docs/LEARNINGS.md:161`, entry #8: "Modal's initial
  focus (Story M2)". That's
  [`08-M2-modal-accessibility`](../../08-puzzle-library/stories/08-M2-modal-accessibility.md)
  (its "Initial focus" section, :82). `03-M2-delete` also exists. The audit
  didn't name this one; see decision 1 below.

No other entry cites a story ID. Entry #3's first two bullets
(`toggleBlackSymmetric`, "Group A tests") name no story, so nothing there is
ambiguous.

## Decisions

- **Use the repo's existing `NN-ID` form.** Write "Story 02-P3", "Story
  02-P5" (and "Story 08-M2" if decision 1 is accepted), linked to the story
  files. This form matches the story filenames and is already used in other
  docs (for example `05-D6` and `03-M4` in epic 05's HANDOFF). Each link makes
  the citation checkable in one click.
- **Change nothing else.** Wording, rules, entry order and numbering stay as
  they are. Only the citations are edited.
- **Keep the audit record verbatim.** HANDOFF records follow-up 9 as resolved
  by P8, as it does for follow-ups 7 and 8.

**Resolved at approval (2026-10-21, both as recommended):**

1. **Also qualify entry #8's "Story M2": yes.** It's the same
  defect (an ID that collides with `03-M2`), it's a one-line change in the same
  file, and leaving it would preserve the ambiguity this story removes.
  The alternative was to fix only entry #3, as the audit worded it, and
  record #8 as a new follow-up.
2. **No general citation rule.** Don't add a rule (for example
  in STORY or LEARNINGS' preamble) that cross-epic story references must use
  `NN-ID`. A rule would change process outside follow-up 9; it can be a
  separate task if wanted.

## Non-goals

- Unqualified story IDs in any doc other than `docs/LEARNINGS.md`.
- Editing, pruning or renumbering any LEARNINGS entry beyond the citations.
- Any change to application code, tests, frozen acceptance, AGENTS or process
  docs.
- Follow-ups 10–12.

## Acceptance (documentation checks)

1. **Qualified.** `grep -nE "Story [A-Z][0-9]" docs/LEARNINGS.md` returns
  nothing. Every story citation in the file has the form `Story NN-ID` and
  links to an existing story file.
2. **Correct targets.** The links resolve to
  `docs/epics/02-builder-ui/stories/02-P3-cursor-editing.md`,
  `docs/epics/02-builder-ui/stories/02-P5-hints-panel.md` and
  `docs/epics/08-puzzle-library/stories/08-M2-modal-accessibility.md`.
3. **Preservation.** In `git diff -- docs/LEARNINGS.md`, only the citation
  lines in entries #3 and #8 change, plus any rewrapping of
  the same sentence. Headings and all other entries are byte-identical. No
  file changes outside `docs/LEARNINGS.md` and `docs/epics/11-play/`.
  `git diff --check` exits 0.
4. **Handoff.** HANDOFF marks follow-up 9 resolved by P8, its next action
  moves to follow-up 10, and its resume prompt matches the next action.

No application or browser suites are required (STORY, Verification:
documentation-only).

## Repo paths

- `docs/LEARNINGS.md`: entry #3 (:63–65); entry #8 (:161).
- `docs/epics/11-play/stories/11-P8-learnings-epic-qualified-ids.md`: this
  story, status updates.
- `docs/epics/11-play/HANDOFF.md`: state, next action, resume prompt.

## Definition of Done

Acceptance checks 1–4 pass and are recorded here. The change is committed to
`main` as one docs-only commit naming P8 and pushed. HANDOFF names follow-up
10 as the next job.

## Implementation record

Implemented on `main` (2026-10-21) against baseline `71e562c`. Checks run by
the implementing agent:

1. **Qualified: pass.** `grep -nE "Story [A-Z][0-9]" docs/LEARNINGS.md`
   returns nothing (exit 1). The three citations are now `Story 02-P3`
   (:63), `Story 02-P5` (:66) and `Story 08-M2` (:164), each a link.
2. **Correct targets: pass.** All three links, resolved from `docs/`, point
   to the existing files named in check 2.
3. **Preservation: pass.** `git diff -- docs/LEARNINGS.md` has two hunks:
   entry #3's third bullet and entry #8's first bullet, rewrapped around the
   links with the wording unchanged. All eight headings are unchanged. Only
   `docs/LEARNINGS.md` and `docs/epics/11-play/` changed; `git diff --check`
   exited 0.
4. **Handoff: pass.** Follow-up 9 marked resolved by P8; next action and
   resume prompt name follow-up 10.

Application and browser suites were not run (documentation-only).
