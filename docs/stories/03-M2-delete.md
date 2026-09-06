# Story M2 — Delete a puzzle

Second slice of the puzzle-management epic. Removes a puzzle permanently,
from inside the app, with a confirmation that says plainly what it does.
Today the only way to remove a puzzle is to go around the app to the
database.

Repo paths:
- `src/app/puzzles/actions.ts` — edited: adds `deletePuzzle`
- `src/components/puzzle/DeletePuzzleButton.tsx` — new, `'use client'`
- `src/app/puzzles/[id]/page.tsx` — edited: renders `<DeletePuzzleButton />`
- `e2e/delete.spec.ts` — Playwright acceptance tests (**already provided —
  do not edit**)

No Vitest file: there is no extractable pure logic here, only a Server
Action and UI. The epic anticipates this — most stories in it are
Playwright-only, and that's expected rather than a coverage gap.

## Required contract

```ts
// src/app/puzzles/actions.ts (addition)

/** Permanently deletes the puzzle. No soft-delete, no tombstone. */
export async function deletePuzzle(id: string): Promise<void>;
```

```tsx
// src/components/puzzle/DeletePuzzleButton.tsx
'use client';

export function DeletePuzzleButton(props: { puzzleId: string }): JSX.Element;
```

## Markup contract

- `data-testid="delete-puzzle-button"` — the initial trigger.
- Clicking it reveals `data-testid="delete-confirmation"`, whose visible
  text includes the phrase **"cannot be undone"**, alongside
  `data-testid="delete-confirm-button"` and
  `data-testid="delete-cancel-button"`.
- Cancelling returns to the initial state with the trigger visible again.

## Decisions

**Delete lives on the detail page, not on list rows.** The epic's
build-order aside suggested list rows as a natural home; that's superseded
by the same finding that settled M1. Every row on `/puzzles` is wrapped in
a `<Link>`, so a delete button inside one means nested interactive
elements — an accessibility problem and a click-target ambiguity, for no
gain. The detail page is where you already are when you've decided a
puzzle isn't worth keeping.

**A two-step inline confirmation, not a modal and not `window.confirm`.**
Inline keeps the app's own styling and needs no dialog machinery; the
second click is the safeguard. A browser `confirm()` would work but looks
foreign against the rest of the app.

**The confirmation says "cannot be undone" in those words.** Per the
epic's honesty convention. The trigger says "Delete puzzle" — not
"Remove", not "Archive". The word matches the behavior, because the copy
is the only thing standing between a user and data they can't recover.

**Hard delete, no soft-delete column.** Settled in the epic's non-goals:
recoverable deletion is real infrastructure (schema change, restore
surface, a "recently deleted" view) and nothing so far justifies it. The
mitigation is honest copy.

**After deleting, navigate to `/puzzles`** — the current route no longer
has a puzzle behind it, so staying would render a not-found state, which
is a confusing way to confirm a successful action.

**Verify the list isn't served stale after deleting.** Next.js caches
route segments, so `/puzzles` may render a cached list still containing
the deleted puzzle. If `revalidatePath('/puzzles')` (or an equivalent) is
needed in the action for the list to reflect the deletion immediately, add
it. **This assumption is unverified** — I haven't read how `createPuzzle`
currently handles this. Check what the existing actions do and follow the
established pattern; if they already handle it, match them and say so.

## Scope discipline

- **No bulk delete, no multi-select.** One puzzle at a time.
- **No trash, undo, or restore.** Explicit epic non-goal.
- **No special handling for a debounced autosave in flight when the delete
  fires.** A save landing microseconds before a delete is harmless — the
  row is going away either way.
- **No changes to `src/engine/`** — deletion isn't an engine concern.
- **No changes to the list page's markup.** That's Story M3.
- **No changes to `PuzzleTitle` or `PuzzleGridEditor`.**

## Acceptance examples

**M2-1 — delete flow (Playwright)**
- A seeded puzzle's detail page shows `delete-puzzle-button`; no
  confirmation is visible initially.
- Clicking it reveals `delete-confirmation`, whose text contains "cannot
  be undone".
- Clicking `delete-cancel-button` hides the confirmation and restores the
  trigger; the puzzle is untouched (still loads on reload).
- Clicking `delete-confirm-button` navigates to `/puzzles`, and the
  deleted puzzle's title is no longer present in the list.
- After deletion, visiting the deleted puzzle's URL directly renders the
  not-found state established in Story P1 (`puzzle-not-found`, HTTP 404).

## Definition of done

1. `e2e/delete.spec.ts` passes: `npm run test:e2e`.
2. `tsc --noEmit` is clean across the repo.
3. Lint is clean.
4. `npm run verify` exits 0.

Write the implementation to make the provided tests green. Do not edit the
tests to match your implementation — the tests are the specification.
