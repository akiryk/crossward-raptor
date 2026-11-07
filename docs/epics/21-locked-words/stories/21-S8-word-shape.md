# Story S8 — The word is the run Preview keeps white

The cursor's word takes in the empty cells Preview would show red, and
only a complete word can be locked.

**Status: done (2026-11-06).** Implemented in 4d2084c on `main` (off the
risk paths), independently reviewed with no blockers. **Frozen (2026-11-06), approved by the orchestrator under the
handoff's delegation after an independent specification review (no
blockers); its non-blocking suggestions were applied before freeze.** The
amendments to the three frozen files below were approved under the same
delegation. From the human's visual testing
(EPIC "Changes from the human's visual testing", items 5 and 7). Amends
S1's and S2's word. Depends on S1 and S2.

**Blast radius: small, expected off the risk paths.** `src/lib/build-word.ts`
and `src/lib/locked-words.ts` (which `PuzzleGridEditor.tsx` already uses
for the highlight, the button and the toggle row). `src/engine/` isn't
changed: `intendedGeometry` is only read. Direct delivery to `main`.

## What the code does today

`buildWord` (S1) is the unbroken run of **lettered** cells through the
cursor, ended by an empty cell or the edge, and null on an empty cell.
`lockableWord` (S2) is that run when it has 3 or more letters. So in the
human's row `X X X B I R D * * X X S O Y`, the cursor on B highlights
BIRD only, with the two Preview-red cells after it dull blue, and BIRD
can be locked though Preview says its word needs two more letters.

## Decisions

From the human (2026-11-06, EPIC "Changes from the human's visual
testing"):

- **The word** is the unbroken run of cells through the cursor, in its
  direction, that are not black in Preview's geometry
  (`intendedGeometry`): lettered cells and Preview-red cells alike, ended
  by a Preview-black cell or the grid's edge. A run of 2 or more cells is
  a word; a Preview-black cell or a lone cell has none.
- **The cursor on a Preview-red cell** selects its word too.
- **The highlight:** the word's cells are blue-medium (a red cell's
  `slot-required` was already blue-medium); the rest of the row or column
  dull blue, as S1.
- **Lockable:** a complete word, every cell lettered, at least 3. Until
  then: no button beside it or outline, and the toggle row's Lock Word is
  disabled (S5's rule follows `lockableWord`).
- **End cells** keep S2's rule, the cells just before and after the word;
  for a complete word these are Preview-black cells or none at the edge.

### Delegated decisions

Proposed by the drafting agent, for the human's visual check:

- **A run of only red cells** (2 or more, no letters) is a word for the
  highlight, as the definition says. It isn't lockable.
- **Locks already stored keep their extent.** If a later letter makes a
  locked word's end cell Preview-red (its counterpart gets a letter), the
  lock and its protected end cell stay; the builder unlocks to fill it.
  Locks aren't re-measured or dropped automatically.
- **Preview, the hints phase and play** are unchanged (S1).

## Non-goals

- Changing Preview's own word painting, the 1-second rule, protection
  (S3), the tooltip (S4), Reset Grid (S6).
- Re-validating or migrating stored locks.

## Acceptance (frozen)

### Unit: `src/lib/build-word-shape.test.ts` (new)

1. **21-S8-1 the word is the run Preview keeps white:** the human's row on
   a 14×14: from any letter of SOY, SOY; from any letter of BIRD or either
   red cell, BIRD and both red cells; a run of red cells alone is a word;
   a Preview-black cell, a lone cell and an empty grid give `null`; a down
   word grows when a letter makes the cell after it red.
2. **21-S8-2 only a complete word is lockable:** SOY is; BIRD-with-red
   cells isn't, from a letter or a red cell, nor a run of red cells; once
   its red cells are filled, it is at its full length (6); 2 letters
   isn't.

### `e2e/word-shape.spec.ts` (new)

The human's row on a daily's top row, `X X X B I R D * * X X S O Y X`.

3. **21-S8-3 the highlight takes in Preview-red cells:** cursor on Y: S, O
   blue-medium, the rest of the row dull blue. Cursor on B: I, R, D and
   the two red cells blue-medium. Cursor on a red cell: BIRD and the other
   red cell.
4. **21-S8-4 only a complete word locks:** on I and on a red cell, no
   button or outline after 1.5s; on O, Lock word. Typing E, R into the red
   cells, then the cursor on I: the button locks the 6-letter word, two
   ticks, its outline from (2,0) to (9,0). At 700px the toggle row's Lock
   Word is disabled on I and on a red cell, enabled on O.

### Amended acceptance

Three frozen fixtures put a Preview-red cell beside a word they lock or
measure, so under S8 that word would grow and be incomplete. Each is
moved so the cells beside its words stay Preview-black; what each case
checks is unchanged, and each amended file passes on `main` as before.

| File | Case | Was | Becomes |
| --- | --- | --- | --- |
| `src/lib/build-word.test.ts` (21-S1-1) | the 6×6 grid | 6 columns, so (0,0), (3,0) and others are Preview-red | 6 empty columns added on the right |
| | ended by one edge | `AB.`, `.AB`, and down `A B .`, `. A B` | `AB....`, `....AB`, and down `A B . . . .`, `. . . . A B` (cursor on the B at the far end) |
| | both edges across | STRAND on row 5 of the grid | `STRAND` alone (the widened grid has no right edge there) |
| `src/lib/locked-words.test.ts` (21-S2-1) | `GRID` | 5 rows, so (3,0) beside CAT is Preview-red | five empty rows added at the bottom (10 rows), so no cell of rows 0–4 is Preview-red and HN and lone H fail for length and loneness, not incompleteness |
| `e2e/lock-word.spec.ts` (21-S2) | ABRAHAM | across row 11 (0–6), making TANGENT's end cell (10,3) and its own end cell (7,11) Preview-red | across row 12; its end cell (7,12), the click on (3,12) |

### Discrimination (2026-11-06, observed)

- On `main` (38820d9 + this story's tests): the new unit file has 5 of
  12 failing (the red-cell and complete-word cases); after the review's
  suggestions (c8c439c), 7 of 14 (the added letter-red-letter case and the
  split red-run case fail too; the amended files still pass); the new browser
  spec 4 of 6 failing (21-S8-3 on B and on a red cell, 21-S8-4's
  incomplete word and its narrow case). Passing, as guards: cursor on Y,
  and the filled-in word locking whole. The amended unit files and
  `lock-word.spec.ts` pass on `main`.
- Against a throwaway implementation (reverted, not committed): every
  unit test passes (708); the full `npm run test:e2e` before the
  amendments gave 1094 passed, 14 failed: 12 in `lock-word.spec.ts`
  (the ABRAHAM fixture, amended above), and `rebus.spec.ts` 17-S10-9 and
  `status-icons.spec.ts` 18-S3-2, which passed when rerun. After the
  amendments, `word-shape`, `lock-word`, `word-highlight`, `rebus` and
  `status-icons` specs: 50 passed.

## Repo paths

Acceptance: `src/lib/build-word-shape.test.ts`, `e2e/word-shape.spec.ts`,
and the amended files above. Runtime: `src/lib/build-word.ts`,
`src/lib/locked-words.ts`. Docs: this story, `../EPIC.md`, `../HANDOFF.md`.

## Definition of done

- Frozen acceptance unchanged after freeze.
- `npm run verify` exits 0 and the full `npm run test:e2e` exits 0.
- Delivered on `main`; the handoff records observed results.
