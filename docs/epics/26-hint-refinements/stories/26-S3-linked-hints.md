# Story S3 — Linked hints after visual review

**Approved scope 2026-11-15:** the human requested all three changes during
visual review of S1/S2 and confirmed `interactive-faint-hover` as the secondary
row color. Acceptance amended and frozen on main after independent review; see HANDOFF
for the baseline commit.
Implementation and delivery remain on `epic/26-hint-refinements`; no runtime
merge to main is authorized.

## Decisions

- Recognize either opening `With <number>-Across/Down` or
  `See <number>-Across/Down`, case-insensitively. All other S1 validation
  stays: one space, positive number without leading zero, hyphen, whole-word
  direction, actual entry in that direction, no self-reference, optional comma.
  The pure `parseClueReference` keeps its signature and remains the single parser.
- In the builder and play, either keyword drives S2's referenced grid cells.
  Explicit reciprocal hints work in either direction (e.g. 11A says With 18A,
  18A says See 11A). Only the selected clue's own outgoing reference is used;
  no inferred backlinks, chaining or multi-entry links.
- During play, the current clue row stays `blue-medium` (#CFEEFF). The full
  row of the entry it names uses `linked-clue` / `interactive-faint-hover`
  (#E8F7FF), matching referenced grid cells. Both number and hint sit over the
  row background. Current-row precedence is unchanged. No navigation changes.
- Both row fills and referenced cells follow the existing selected-clue
  focus/unlocked condition; no link highlight when play is finished/locked.
  Preview Hints has no current clue and gets no new row highlight.
- Remove the individual word background everywhere: With and See are ordinary
  hint text, including native builder fields, Preview Hints, play lists,
  Prominent Hint and narrow play's hint bar. Preserve text, persistence,
  editing, wrapping, caret/focus, current-field fill and missing-hint styling.
- Remove obsolete substring-decoration components and props/callers instead of
  retaining unused recognition or wrapper code. Keep the existing linked-clue
  color style/catalog because grid cells and the new secondary row use it.

## Non-goals

No stored relationships, graph inference, click/navigation feature, builder row
highlight, build/sister-word/Preview changes, palette changes, authentication,
collaboration, server writes or engine changes.

## Acceptance amendments

The human's new request explicitly supersedes S1's See-is-ordinary assertion
and every word-mark expectation. This is a reviewed semantic amendment, not a
change to make the old implementation pass. Keep S2 and unrelated acceptance
unchanged. Freeze specification and acceptance alone on main after independent
review, then merge that baseline into the epic branch before runtime work.

- `src/lib/clue-reference.test.ts`: remove only See from S1's invalid list,
  update its syntax comment, add S3-1 valid See cases (Across/Down, mixed case,
  optional comma), invalid/nonexistent/self cases and ordered cells with input
  preservation. All existing With assertions and S2 cases remain.
- `e2e/linked-clues.spec.ts`: replace obsolete substring/geometry/paint checks
  with explicit no-word-mark/plain-text checks on the same S1-6 through S1-10
  surfaces. Preserve native typing/saving/reload; exercise live With/See and
  invalid/self edits, narrow Hint Box, play lists, Prominent Hint, narrow play
  bar and Preview Hints. Confirm See drives cells in builder and narrow play.
- `e2e/linked-hints.spec.ts` (new, 1440px):
  - S3-2 reciprocal Across hints: selecting With or See by row or grid gives
    exactly one current blue row and one secondary pale row, the referenced
    grid cells, and unchanged cursor/current-word colors. Ordinary selection
    removes the secondary fill. Scan every row/cell for either expected color.
  - S3-3 mixed-case cross-direction reciprocal hints, shared-cell precedence,
    and focus loss clearing both row colors and linked cells.
  - S3-4 malformed, nonexistent and self references give no secondary fill.
  - S3-5 finished/locked play has neither row nor grid linking, even on clicks.

## Verification and delivery

Record missing-behavior discrimination before freeze. Independent review must
approve the proposed semantic amendments. `npm run verify` and affected specs
(`linked-clues`, `linked-entry`, `linked-hints`, `hints-panel`, `hint-box`,
`preview-hints`, `play-design`, `narrow-play`, `hints-grid-editing`,
`hint-phase-design`) must pass on runtime. Then run one clean final full browser
suite and a fresh independent closeout audit; stop for a new human visual check.
Use DEVELOPMENT's standing guarded local test-reset grant and database lock.
No merge to main.

## Repo paths and risk

Acceptance: the three files above; S2 and F1 style assertions unchanged.
Runtime: `src/lib/clue-reference.ts`, `src/components/play/PlayerHints.tsx`,
`PlayPuzzle.tsx`, `ProminentHint.tsx`, `PlayHintBar.tsx`,
`src/components/grid/HintBox.tsx`, `HintsPanel.tsx`,
`src/components/ui/TextInput.tsx`; removal of `src/components/ui/HintField.tsx`
and `src/components/play/ClueText.tsx` (newly introduced code, no user data).
Docs: this story, EPIC, HANDOFF, CLOSEOUT and epic index.
No CODE-REVIEW risk paths.

## Prefreeze evidence (2026-11-15)

On unchanged runtime `74d130f` plus proposed acceptance, observed by orchestrator:

- `npm test -- src/lib/clue-reference.test.ts`: exit 1, four new See cases
  failed because the current parser returns null; 19 preserved cases passed.
- `npm run test:e2e -- e2e/linked-clues.spec.ts e2e/linked-hints.spec.ts`:
  exit 1, nine failed / three passed (26.1s). All six amended S1 browser cases
  rejected the existing word decoration; new S3-2/S3-3 rejected the missing
  secondary row fill, and S3-5 rejected existing word decoration. S3-4 invalid
  references and both setup cases passed as expected.
- Independent `s3_amendment_review` agent reviewed the semantic corrections,
  fixtures, preservation and coverage and approved refreeze with no blockers
  or vacuous assertions. Its one documentation note (three stories, not two)
  was corrected. No runtime changed before the acceptance-only main freeze.
- The human explicitly requested the new semantics and confirmed the secondary
  color. This is the approval for the scoped S1 corrections; no unrelated
  frozen acceptance was edited.
