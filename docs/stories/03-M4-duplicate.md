# Story M4 — Duplicate a puzzle

Final slice of the puzzle-management epic. Copies an existing puzzle into a
new one and opens it, so a builder can reuse a grid they like as the
starting point for something else.

Repo paths:
- `src/lib/puzzle-title.ts` — edited (existing file from M1): adds
  `duplicateTitle`
- `src/lib/puzzle-title.test.ts` — extended Vitest tests (**already
  provided — do not edit**; M1's existing cases are unchanged, M4 cases
  added after them)
- `src/app/puzzles/actions.ts` — edited: adds `duplicatePuzzle`
- `src/components/puzzle/DuplicatePuzzleButton.tsx` — new, `'use client'`
- `src/app/puzzles/[id]/page.tsx` — edited: renders the button
- `e2e/duplicate.spec.ts` — Playwright acceptance tests (**already
  provided — do not edit**)

## Required contract

```ts
// src/lib/puzzle-title.ts (addition)

/** The title for a copy of a puzzle: "Copy of Monday Puzzle". Normalizes
 *  its input first, so a blank source title yields "Copy of Untitled
 *  Puzzle" rather than "Copy of ". */
export function duplicateTitle(sourceTitle: string): string;
```

```ts
// src/app/puzzles/actions.ts (addition)

/** Creates a new puzzle copying the source's grid, hints, and phase.
 *  Returns the new puzzle's id. */
export async function duplicatePuzzle(id: string): Promise<{ id: string }>;
```

```tsx
// src/components/puzzle/DuplicatePuzzleButton.tsx
'use client';

export function DuplicatePuzzleButton(props: { puzzleId: string }): JSX.Element;
```

## Markup contract

- `data-testid="duplicate-puzzle-button"` — a single button. **No
  confirmation step** (see Decisions).
- Clicking navigates to the new puzzle's `/puzzles/{newId}`.

## Decisions

**Copy everything — grid with its letters, hints, and phase.** Settled in
the epic. Since Prisma stores `grid` and `hints` as opaque `Json` columns,
this doesn't need the engine at all: read the source row and write its
three columns into a new record. No serialize/deserialize round-trip, no
`clearLetters` call, no transformation of any kind.

**No confirmation, unlike delete and clear-letters.** Both of those are
destructive and irreversible, which is why they got two-step confirmations
with "cannot be undone" copy. Duplicating destroys nothing — the worst case
is an unwanted extra puzzle, which M2's delete already handles. Adding a
confirmation here would be ceremony that trains people to click through
confirmations without reading them, which makes the two that matter worse.

**The copy is titled `Copy of {source title}`.** Duplicating a copy yields
`Copy of Copy of X` — deliberately not deduplicated. Detecting and
incrementing a suffix ("Copy 2 of X") is more machinery than this deserves,
and the honest repetition is a fair signal that you've duplicated twice.

**`duplicateTitle` normalizes its input first**, reusing M1's
`normalizeTitle`, so a blank or whitespace-only source title produces
`Copy of Untitled Puzzle` rather than `Copy of `. In practice stored titles
are already normalized; this just means the function is correct on its own
terms rather than depending on a caller's guarantee.

**Navigate to the copy, not back to the list.** The reason to duplicate is
to work on the copy. Landing on the new puzzle's detail page is what you
wanted; making you find it in the list afterward is a step for nothing.

**The copy keeps the source's phase.** A hints-phase puzzle duplicates into
hints phase with its hints intact — that's what "duplicate" means. A
builder who wants to restart geometry can't un-freeze phase today anyway
(no reverse transition exists), so this changes nothing about what's
possible.

**`revalidatePath('/puzzles')` after creating the copy**, matching the
pattern M2 established and M3 extended to `createPuzzle`. The list gains a
row, so it must not be served stale.

## Scope discipline

- **No duplicate-from-the-list-page.** Same reason rename and delete live
  on the detail page: rows are `<Link>`s and embedding actions in them
  means nested interactive elements.
- **No "duplicate as template" variant.** Copy-everything plus M5's clear
  action covers that workflow; a second duplicate mode would be two ways to
  do one thing.
- **No title-conflict detection.** Two puzzles may share a title; nothing
  in the app requires uniqueness (M1 established this).
- **No changes to `src/engine/`** — duplication is pure data copying.
- **No changes to `PuzzleGridEditor`, `PuzzleTitle`, `DeletePuzzleButton`,
  or `ClearLettersButton`.**

## Acceptance examples

**M4-1 — `duplicateTitle` (Vitest, extending `puzzle-title.test.ts`)**
- `'Monday Puzzle'` → `'Copy of Monday Puzzle'`.
- `'Untitled Puzzle'` → `'Copy of Untitled Puzzle'`.
- `'Copy of Monday Puzzle'` → `'Copy of Copy of Monday Puzzle'` (no
  deduplication, deliberately).
- `''` → `'Copy of Untitled Puzzle'`; `'   '` likewise.
- `'  Padded  '` → `'Copy of Padded'` (input trimmed).
- Purity: two calls with the same input are equal.
- M1's existing `normalizeTitle` cases all still pass unchanged.

**M4-2 — duplicate flow (Playwright)**
- A seeded puzzle's detail page shows `duplicate-puzzle-button`, and no
  confirmation appears when it's clicked — it acts immediately.
- Clicking navigates to a different `/puzzles/{id}` than the original.
- The copy's title is `Copy of {original title}`.
- The copy has the same letters in the same cells as the original, and the
  same black cells.
- Duplicating a hints-phase puzzle produces a copy in hints phase whose
  hint fields hold the same text as the original's.
- The original still exists afterward, unchanged, at its own URL.
- Both the original and the copy appear in the list.

## Definition of done

1. `src/lib/puzzle-title.test.ts` passes with both its M1 and M4 cases
   (covered by `npm run verify`).
2. `e2e/duplicate.spec.ts` passes: `npm run test:e2e`.
3. `tsc --noEmit` is clean across the repo.
4. Lint is clean.
5. `npm run verify` exits 0.

Write the implementation to make the provided tests green. Do not edit the
tests to match your implementation — the tests are the specification.
