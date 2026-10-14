# Story M1 — Rename a puzzle

First slice of the puzzle-management epic. Makes a puzzle's title editable
in place on its detail page, so puzzles can be told apart. Everything else
in the epic (delete, list metadata, duplicate) is easier to reason about
once puzzles have names.

Repo paths:
- `src/lib/puzzle-title.ts` — new, `normalizeTitle`
- `src/lib/puzzle-title.test.ts` — Vitest acceptance tests (**already
  provided — do not edit**)
- `src/components/puzzle/PuzzleTitle.tsx` — new, `'use client'`
- `src/app/puzzles/actions.ts` — edited: adds `saveTitle`
- `src/app/puzzles/[id]/page.tsx` — edited: renders `<PuzzleTitle />` in
  place of the current plain `<h1>`
- `src/components/grid/PuzzleGridEditor.tsx` — edited: its window keydown
  handler must ignore events from text inputs (see Decisions)
- `e2e/persistence.spec.ts` — edited (**committed acceptance test —
  authorized edit, see below**): two assertions change from
  `toContainText` to `toHaveValue`
- `e2e/rename.spec.ts` — Playwright acceptance tests (**already provided —
  do not edit**)

## Required contract

```ts
// src/lib/puzzle-title.ts

/** Trims the input. A blank or whitespace-only title falls back to the
 *  schema default, so no puzzle can end up nameless in the list. */
export function normalizeTitle(input: string): string;
```

```ts
// src/app/puzzles/actions.ts (addition)
export async function saveTitle(id: string, title: string): Promise<void>;
```

```tsx
// src/components/puzzle/PuzzleTitle.tsx
'use client';

export function PuzzleTitle(props: {
  puzzleId: string;
  initialTitle: string;
}): JSX.Element;
```

## Markup contract

- The title renders as `<input data-testid="puzzle-title">` carrying the
  title as its **value**, styled to read as a page heading. Give it an
  accessible name (`aria-label="Puzzle title"` or an associated label).
- It is always editable — no click-to-edit mode toggle, no edit icon.

## Decisions

**An always-editable input, not `contentEditable` and not a click-to-edit
toggle.** `contentEditable` brings paste handling, stray formatting, and
selection quirks that a plain input doesn't have, for no benefit here. A
click-to-edit toggle adds a mode with no purpose on a page whose whole
job is editing.

**`PuzzleTitle` is a standalone client component beside
`PuzzleGridEditor`, not inside it.** The `<h1>` currently renders in the
page's Server Component, above and outside the editor; the editor's state
has no title field and gains nothing from one. `NewPuzzleButton` is the
precedent — a small `'use client'` component embedded directly in a server
page.

**Silent debounced autosave, 500ms, same as `saveGrid` and `saveHints`.**
No save button, no status indicator — consistent with what Story P3
established and with how real editing tools behave.

**Blank titles fall back to `"Untitled Puzzle"` rather than saving empty.**
The fallback happens in `normalizeTitle` at save time, not on every
keystroke — a user mid-edit who has cleared the field shouldn't have text
appear under their cursor. What they see while typing is their own input;
what gets persisted is the normalized value.

**The window keydown listener must ignore events from text inputs — verify
whether this is already handled.** `PuzzleGridEditor` attaches its keydown
handler on `window`, so unless it already filters by event target, typing
"Monday" into the title input would *also* be read as grid input and write
M-O-N-D-A-Y into cells. If that guard doesn't already exist, this story
adds it: ignore the event when `event.target` is an `<input>` or
`<textarea>`.

This assumption is unverified — I have not read the current handler. **If
it already guards correctly, change nothing there and say so.** Note that
if the guard is missing, it very likely affects Story P5's hint inputs
already, in which case this fix closes a pre-existing bug as well as
preventing a new one.

**Authorized edit to a committed acceptance test.** Story P1's
`e2e/persistence.spec.ts` asserts on the title with
`toContainText('Untitled Puzzle')` in two tests. Once the title is an
`<input>`, its text content is empty and its value carries the title, so
those assertions must become `toHaveValue('Untitled Puzzle')`. This is a
mechanical consequence of the markup change, not a weakening of the test —
make exactly this change and nothing else in that file.

## Scope discipline

- **No renaming from the list page.** Settled in the epic: every list row
  is already a `<Link>`, and splitting that click target between "open"
  and "edit" is interaction design this story doesn't need.
- **No title on creation.** `createPuzzle` still creates with the schema
  default; naming happens after, on the detail page.
- **No validation beyond trim-and-fallback.** No length limits, no
  uniqueness requirement, no character restrictions.
- **No changes to `src/engine/`** — a title isn't an engine concern.
- **No changes to the list page's markup.** Surfacing titles there already
  works; list metadata is Story M3.

## Acceptance examples

**M1-1 — `normalizeTitle` (Vitest)**
- `'Monday Puzzle'` → `'Monday Puzzle'`.
- `'  Padded  '` → `'Padded'` (trimmed).
- `''` → `'Untitled Puzzle'`.
- `'   '` (whitespace only) → `'Untitled Puzzle'`.
- Purity: two calls with the same input are equal.

**M1-2 — rename flow (Playwright)**
- A seeded puzzle's detail page shows `puzzle-title` as an input whose
  value is the puzzle's current title.
- Typing a new title, waiting for the save to land, then reloading shows
  the new title still there.
- After renaming, `/puzzles` shows the new title in the list.
- Clearing the title entirely, letting it save, and reloading shows
  `"Untitled Puzzle"`.
- Typing into the title input does **not** write letters into the grid —
  no cell gains a letter while the title is being edited.
- Grid editing still works normally after the title has been edited
  (click a cell, type a letter, it lands).

## Definition of done

1. `npx vitest run src/lib/puzzle-title.test.ts` passes (covered by
   `npm run verify`).
2. `e2e/rename.spec.ts` passes, and `e2e/persistence.spec.ts` still passes
   with its two authorized assertion changes.
3. `tsc --noEmit` is clean across the repo.
4. Lint is clean.
5. `npm run verify` exits 0.

Write the implementation to make the provided tests green. Apart from the
two explicitly authorized assertion changes in `persistence.spec.ts`, do
not edit the tests to match your implementation — the tests are the
specification.
