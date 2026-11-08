# Story S13 — Tick hover shows the button

Resting the mouse on a locked word's ticked end cell darkens the word at
once, as S11 does. A second later it also shows the word's lock button,
so the builder can unlock a word by hovering its tick.

**Status: approved by the human and frozen (2026-11-07), after an independent specification review; delegated decisions included.** From
the human's visual testing of S8–S11 (EPIC "Changes from the human's
visual testing (2026-11-07)", "Tick hover shows the button"). Amends
S11's hover area and its "no button" rule, and S10's "the end cell
leaves the hovered word" for a ticked end cell. Depends on S10, S11
(delivered) and S12 (proposed): the button's place beside the word is
S12's, and the tests assume it.

**Blast radius: small, expected off the risk paths.** Client components
in `src/components/grid/` and one pure helper in `src/lib/locked-words.ts`.
No `src/engine/**`, `src/lib/puzzle-storage.ts`,
`src/app/puzzles/actions.ts` or `prisma/**` change (CODE-REVIEW "When
review applies"): the hover changes no stored state. A click on the
button saves a lock, as S10's does. Direct delivery to `main`.

## What the code does today

Inspected `PuzzleGrid.tsx` (the tick hover, `handlePointerOver`,
`handlePointerMove`), `PuzzleGridEditor.tsx` (`LockHover`,
`handleHoverCell`, `hoverTarget`), `src/lib/locked-words.ts`, S10's and
S11's stories, and the frozen `e2e/lock-hover.spec.ts` and
`e2e/lock-tick-hover.spec.ts`.

- **The tick hover (S11)** is worked out on mouse moves over the grid:
  the cell under the pointer, if it holds a tick, and whether the pointer
  is in the tick's square (the cell's top-right quarter each way). Each
  cell of every locked word ending there (`lockedWordsEndingAt`) gets a
  15%-black layer. It shows no button.
- **S10's hover** starts when the mouse moves onto a cell. Its word is
  the run through that cell in the cursor's direction (`runKey`,
  `lockTargetAt`), and its second runs while the mouse stays in that run.
  An end cell is outside the word, and its run holds an empty cell, so it
  is never lockable: moving onto it ends a hover and starts none.
- **The button** is placed by `lockTarget` (the hover's, else the
  cursor's). After S12 it sits just before the word's first letter, so an
  across word's button covers the middle-right of its before end cell. A
  down word's covers the bottom middle of its own before end cell.

## Decisions

From the human (2026-11-07, EPIC "Changes from the human's visual
testing (2026-11-07)"):

- **The hover area is the whole ticked end cell**, not only the tick's
  square.
- **The darkening** (S11) still shows at once. **After a second** of
  hover the word's lock button shows too.
- **Which word:** the locked word in the cursor's direction, where the
  cell ends two.
- **It stays** while the mouse is on that cell, the word's cells or the
  button, and goes when the mouse moves elsewhere.

### Delegated decisions

Proposed by the drafting agent, for the human's approval:

- **Which word, exactly** (`tickTarget`): of the locked words ending at
  the cell, the ones in the cursor's direction. Of those, the one starting
  just after the cell wins over the one ending just before it. That is
  the word whose button sits in or next to this cell after S12 (an across
  word's in this very cell). With none in the cursor's direction, the
  other direction's word, by the same rule. Up to four words can end at
  one cell, but this picks one, and the list's order doesn't matter. The
  darkening is unchanged: every locked word ending there (S11).
- **The button stays where S12 puts it**, before the word's first letter,
  even when that is far from the hovered cell. Hovering an across word's
  after end shows the button at its start.
- **Once shown, it is an S10 hover of that word**, under S10's rules:
  clicking it toggles the word without moving the cursor or taking focus,
  and it stays in its new state while the mouse is on it. It replaces the
  cursor's button and gives it back when the mouse leaves. A lock button
  with keyboard focus is never replaced. It is not a Tab stop unless it
  is the cursor's own word (S10), and S4's tooltip shows on it.
- **The word's cells** include its other end cell. On the word's cells
  the button stays whatever the cursor's direction, even where the
  cursor's run through that cell is another word. On any ticked end
  cell, the word's own included, `tickTarget` decides: moving onto one
  picks that cell's word, and if that is the same word, the button stays.
- **The second** counts from the mouse moving onto the end cell and runs
  on while it moves within the cell. Leaving before the second shows no
  button. **A turn of the cursor** (Space or an arrow) while the mouse
  rests on the end cell picks the word again. If that gives a different
  word, its second starts over (S10's rule for a turn). A turn while the
  mouse is on the word's cells doesn't change the word.
- **The darkening goes** when the mouse moves anywhere but the ticked
  end cell, with one exception: the button of the word it picked. The
  darkening (every locked word ending at the cell, as S11) stays on that
  button when the mouse moves onto it from the cell, or when the button comes up under a resting mouse (an across
  word's before end cell). Moving onto a button from anywhere else
  darkens nothing, as in S11 ("the button wins": S11-5's third case).
  From the button onto the word's letters, the button stays and the
  darkening goes.
- **A click in the ticked cell** ends the hover (S10): the cursor moves
  there, the button goes, and the mouse resting there starts no hover
  until it moves onto a cell again. The darkening stays while the mouse
  rests on the cell (S11-6).
- **The tick going under a resting mouse** (the word unlocked by the
  keyboard while the mouse is on its end cell): the darkening goes (S11)
  and the tick's button with it, then the cursor's rules apply. On the
  button itself, the button stays in its new state (S10). Not separately
  tested.
- **Where no button comes:** where the button beside a word isn't used
  (S5's Lock Word below the room S12 sets), on a touch screen, with a
  rebus entry open, and wherever there are no ticks (Preview, the hints
  phase, a published puzzle). The darkening still works below the room
  (S11-8).
- **Focus:** it works whether or not the grid has focus, as S10.

## Non-goals

- Changing the darkening's amount, what it covers, or its "at once" (S11).
- Changing S10's rules for hovering a word's letters, the button's look,
  place (S12), tooltip (S4), delay, or the cursor's rules (S2, S7).
- A keyboard way to reach the tick, or touch or pen hover.
- A button for each word at a shared cell, or a picker among them.

## Acceptance (proposed)

### Unit: `src/lib/tick-target.test.ts` (new, 8 cases)

1. **21-S13-1 the word a ticked end cell shows the button for:**
   `tickTarget(grid, lockedWords, coord, orientation)` in
   `src/lib/locked-words.ts`. An 8×9 fixture where (3,4) ends four words:
   CAT (just before, across), DOG (just after, across), BEE (just before,
   down) and OWL (just after, down). The cases: the cursor's direction
   first, then the word starting just after. With none starting after,
   the one ending just before. With none in the cursor's direction, the
   other direction's, by the same rule. The list's order doesn't matter.
   A one-word end cell gives that word in either direction. No locked
   word ending there gives null. The result comes from the stored words
   on an empty grid. Inputs are unchanged.

### `e2e/lock-tick-button.spec.ts` (new, 11 cases)

S11's fixture: a Daily at 1440px with TANGENT across row 2; CAT and DOG
across row 7 around the empty (5,7); and OWL down column 5 below it. Paint
is read as in S11. "Not yet" is checked after 500ms, "shown" allows
1500ms more, and "at once" is 300ms for the button and 500ms for paint.

2. **21-S13-2 a second on a ticked end cell shows its word's button** (2).
   - TANGENT is locked and the cursor is on an empty cell. On TANGENT's
     after tick: no button at 500ms, and TANGENT is already darker. Then
     its "Unlock word" shows before the T, and the cursor and focus are
     unchanged. It stays: in the cell's middle (still darker), on a
     letter (no longer darker), on the before end cell's free left part
     (darker again) and on the button. It goes at once on an empty cell
     outside the word.
   - **Without focus:** the button shows. A click unlocks TANGENT (the
     ticks go), and the button stays as "Lock word" while the mouse is on
     it. Neither the grid nor the button takes focus. Off the grid the
     button goes, and the cursor is where it was.
3. **21-S13-3 the whole end cell counts** (1). The after end cell's lower
   left, away from the tick: darker at once, and the button after a
   second.
4. **21-S13-4 the button coming up under the resting mouse** (1). The
   mouse rests on TANGENT's before end cell, where its button will be.
   The button comes up under it and TANGENT stays darker. Moving on the
   button, then onto the cell's free left part, keeps both. Onto the T,
   the button stays and the darkening goes.
5. **21-S13-5 a shared end cell: the cursor's direction** (2).
   - CAT, DOG and OWL are locked and the cursor is Across. On (5,7)'s
     tick all three darken, and the button is DOG's. Unlocking DOG
     through it, then hovering again, gives CAT's.
   - Then the cursor turns Down under the resting mouse. DOG's button goes
     at once, and OWL's (above its O) comes after its own second.
     Unlocking OWL through it, then hovering again (still Down), gives
     DOG's.
6. **21-S13-6 S10's rules for the tick's button** (3).
   - The cursor is in locked CAT with its button showing. TANGENT's tick
     replaces it with TANGENT's after the second, not before. Off the
     grid, CAT's is back at once.
   - With CAT's button keyboard-focused, TANGENT's tick darkens TANGENT
     but replaces nothing in 1.5s.
   - A click on the ticked cell, with the button showing, moves the
     cursor there. The button goes at once and doesn't come back in 1.5s.
7. **21-S13-7 where no button comes** (2). At 600px (S5's Lock Word),
   the tick darkens TANGENT and no button comes in 1.5s. On a touch
   screen, a tap on the tick moves the cursor and no button comes.

### Amended frozen acceptance: `e2e/lock-tick-hover.spec.ts` (S11)

Each amendment is marked "21-S13" in the file, on top of S12's amendment
of 21-S11-5. No other assertion, timeout or case changes.

- The header: the hover area is the whole end cell, and a button comes
  after a second (it was the tick's square and no button).
- **21-S11-2:** after 1.5s on the tick, TANGENT's "Unlock word" shows
  (was: no lock button). The middle of the end cell keeps TANGENT darker
  (was: back at once).
- **21-S11-4** becomes "the tick's hover area is its whole end cell":
  the four spots in the cell away from the square darken TANGENT (was:
  nothing). The cells after it and below it, (11,2) and (10,3), darken
  nothing.
- **21-S11-6's first case:** moving from hovered CAT onto its before
  tick keeps CAT's "Unlock word" (was: gone within 300ms), and CAT
  darkens.

Every other frozen test is unchanged. The S10 cases that touch an end
cell (21-S10-3, -4) use unlocked words, which have no tick.

### Discrimination (2026-11-07, observed)

- **Unit, on `main` (3d6952a):** 8 of 8 fail on the missing `tickTarget`;
  `tsc --noEmit` reports only TS2305 for it; ESLint passes on the new and
  amended files.
- **E2E on `main`** (`lock-tick-button` and `lock-tick-hover`): 13 of the 23
  cases failed. Nine of the 11 new cases fail at their S13 check. The 2
  guards (21-S13-7) pass. The amended 21-S11-2, -4 and -6 (first case)
  fail as expected, and so does 21-S11-5's third case (S12's amendment).
- **Against a scratch S12+S13 implementation** (reverted, kept outside
  the repo as `../crossward-raptor-s12-s13-scratch-v2.patch`): the unit
  test 8 of 8, and both specs 23 of 23, then 69 of 69 with
  `--repeat-each=3`. Mutations: without the turn picking again, 21-S13-5's
  second case fails. Without the darkening staying on the button,
  21-S13-4 fails.
- **The full `npm run test:e2e` on that scratch,** with S12's and S13's
  new and amended specs: 1207 passed, 1 failed (`library-play.spec.ts:340`,
  `ECONNRESET` in the auth helper), which passed 3 of 3 rerun alone. No
  other frozen test moves with S12 or S13.

## Repo paths

Acceptance: `src/lib/tick-target.test.ts` (new),
`e2e/lock-tick-button.spec.ts` (new), and the amended
`e2e/lock-tick-hover.spec.ts`.

Runtime:

- `src/lib/locked-words.ts`: `tickTarget`.
- `src/components/grid/PuzzleGridEditor.tsx`: the hover's word picked
  from a ticked end cell, kept on its cells, picked again on a turn.
- `src/components/grid/PuzzleGrid.tsx`: the whole end cell as the tick's
  hover area, and the darkening kept on the picked word's button.

Risk: all off the CODE-REVIEW risk paths. Docs: this story, `../EPIC.md`,
`../HANDOFF.md`. Declare any other path before editing it.

## Definition of done

- Approved by the human and frozen in a specification-only commit on
  `main`, after S12's freeze and before any S13 runtime change. Frozen
  acceptance is unchanged after that.
- Implemented after S12 is delivered.
- `npm run verify` exits 0 and the full `npm run test:e2e` exits 0.
- The human's visual check of the tick's button and the delegated
  decisions above.
- Delivered on `main`; the handoff records observed results.
