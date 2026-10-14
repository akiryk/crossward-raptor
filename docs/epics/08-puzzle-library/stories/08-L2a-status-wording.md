# Story L2a — Say what the puzzle is actually doing

Third slice of the puzzle-library epic, and the smaller half of what the
epic called L2.

A row in the library currently reads "Sparky Pluggy — Sep 18, 2026 —
Hints — incomplete". "Hints" is the name of an internal phase, not
something a builder would ever say, and "incomplete" attached to it
reads as a complaint rather than a state. A builder looking at the list
wants to know what's left to do, and the words should say so.

This story changes only the words. The model behind them is already
right — `puzzleStatus` distinguishes the three kinds correctly, and
`StatusKind` is what the badge in L2b will style off. Nothing about the
page's layout changes here.

Repo paths:
- `src/lib/puzzle-status.ts` — edited: the four label strings
- `src/lib/puzzle-status.test.ts` — extended (**already provided — do
  not edit**; PB5-1's cases unchanged in intent, the two hints-label
  assertions updated to the new wording)
- `e2e/puzzle-list.spec.ts` — extended (**already provided — do not
  edit**; M3-2's cases unchanged except the three that assert label
  text)

## Required contract

`puzzleStatus`'s signature, return shape and `StatusKind` values are
unchanged. Only `label` changes:

| kind | today | becomes |
|---|---|---|
| `grid` | `Grid` | `Building grid` |
| `hints`, incomplete | `Hints — incomplete` | `Writing clues` |
| `hints`, complete | `Hints — complete` | `Clues done` |
| `published` | `Published — private` | `Published · Private` |

The published label capitalises its visibility (`Private` / `Public`)
and joins with a middle dot rather than an em-dash, so it reads as one
label with a qualifier rather than as two facts joined by a rule.

## Decisions

**Present participles for work in progress, past tense for work
finished.** "Building grid" and "Writing clues" describe what the
builder is in the middle of; "Clues done" and "Published" describe a
state reached. That contrast is what lets someone scan the list and see
where their attention is needed without reading a status legend.

**"Clues done", not "Complete".** A puzzle with every clue written is
not complete — it still has to be published. Calling it complete would
claim more than is true, and would collide with the completion concept
play mode will eventually need.

**The word "Hints" disappears from anything a builder reads.** It stays
everywhere in the code — `hintsComplete`, `HintsPanel`, `phase:
'hints'`, the hint keys — because that is what the concept is called
internally and renaming it would be a large, risky change for no user
benefit. This story draws the line at the boundary: internal names stay,
user-facing words change.

**No em-dashes in the labels.** The row currently joins title, date and
status with em-dashes, which is what makes it read as a run-on sentence.
The labels shouldn't contribute more of them, and L2b removes the rest.

**Nothing else changes.** No badge, no layout, no `kind` values, no new
fields. The badge styling in L2b keys off `kind`, not off parsing these
strings, so the two stories don't collide.

## Scope discipline

- No changes to `puzzleStatus`'s signature, `StatusKind`, or
  `PuzzleStatus`'s shape.
- No changes to `src/app/puzzles/page.tsx` beyond what the compiler
  requires — the em-dash-joined row layout stays until L2b.
- No changes to the style guide, even though
  `src/app/style-guide/page.tsx` contains one of the old strings as
  static example text. Confirm whether it does, and if so leave it for
  L2b along with the rest of the row treatment.
- No changes to anything named "hints" in code.

## Acceptance examples

**L2a-1 — `puzzleStatus` (Vitest, `src/lib/puzzle-status.test.ts`)**
- Each of the four states produces exactly its label from the table
  above.
- No label contains the word "Hints" — the jargon this story removes.
- `kind` is unchanged for every input.
- Published still outranks phase and completeness, and still names its
  visibility.
- Every label is non-empty, and the function is still pure.

**L2a-2 — the list (Playwright, `e2e/puzzle-list.spec.ts`)**
- A grid-phase row reads "Building grid" and says nothing about hints.
- A hints-phase row with every clue written reads "Clues done".
- A hints-phase row with a blank clue reads "Writing clues".
- `data-phase`, `data-hints-complete`, `data-updated-at` and row
  ordering are untouched.

## Definition of done

1. `npx vitest run src/lib/puzzle-status.test.ts` passes.
2. `e2e/puzzle-list.spec.ts` passes: `npm run test:e2e`.
3. Every other spec passes unmodified. Check this rather than assuming
   it — `publish-status.spec.ts` locates rows by title and may also
   assert on status text.
4. `tsc --noEmit` is clean across the repo.
5. Lint is clean.
6. `npm run verify` exits 0.

Write the implementation to make the provided tests green. Do not edit
the tests to match your implementation — the tests are the
specification.
