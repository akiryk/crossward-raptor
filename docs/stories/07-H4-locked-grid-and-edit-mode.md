# Story H4 — The locked grid, and the way back into it

Fourth slice of the hints-authoring epic. Once a puzzle is in hints phase
its geometry is frozen forever, but the grid still renders and behaves
exactly as it did while building: same colors, clickable cells, typing
and deleting both live. Nothing tells the builder the grid is finished,
and everything invites them to keep editing it.

This story locks the grid visually and behaviorally, and adds the one
scoped way back in: an EDIT GRID mode that re-opens letters — never
geometry — while the clue inputs stand down.

Repo paths:
- `src/lib/cell-appearance.ts` — edited: two new appearance values, two
  new flags
- `src/lib/cell-appearance.test.ts` — extended (**already provided — do
  not edit**; D3's and D4's cases unchanged, H4's appended)
- `src/components/grid/PuzzleGrid.tsx` — edited: forwards the flags,
  widens `data-grid-mode`
- `src/components/grid/EditGridToggle.tsx` — new
- `src/components/grid/PuzzleGridEditor.tsx` — edited: edit-mode state,
  input guards, renders the toggle
- `globals.css` — edited: two new tokens
- `e2e/locked-grid.spec.ts` — new (**already provided — do not edit**)
- `e2e/hints-panel.spec.ts` — extended (**already provided — do not
  edit**; P5-2's and H3-2's cases unchanged except P5-2's typing test,
  which now enters EDIT GRID mode first — see "Existing specs" below)
- `e2e/published-lock.spec.ts` — extended (**already provided — do not
  edit**; PB4-2's and PB4-3's typing tests now enter EDIT GRID mode
  first, and PB4-1 gains a disabled-toggle assertion)

## Required contract

```ts
// src/lib/cell-appearance.ts (edited)

export type CellAppearance =
  | 'black'
  | 'empty'
  | 'letter'
  | 'symmetric-hint'
  | 'required'
  | 'recommended'
  | 'locked-letter'     // new: hints phase, grid not being edited
  | 'editable-letter'   // new: hints phase, EDIT GRID mode
  | 'slot'
  | 'slot-letter'
  | 'slot-required'
  | 'selected';

export function cellAppearance(args: {
  cell: Cell;
  isSelected: boolean;
  isInSlot: boolean;
  isSymmetricHint: boolean;
  isRecommended?: boolean;
  isHintsPhase?: boolean;    // new, defaults false
  isEditingGrid?: boolean;   // new, defaults false
  mode?: GridMode;
}): CellAppearance;
```

Precedence, highest first:

1. `cell.kind === 'black'` → `'black'`, as today.
2. `mode === 'preview'` → the existing preview branch, unchanged.
3. `isHintsPhase && !isEditingGrid` → a lettered cell is
   `'locked-letter'`; an empty cell is `'empty'`. Selection and slot
   membership are ignored, exactly as preview ignores them — the grid is
   not interactive here, so a cursor highlight would be a lie.
4. `isHintsPhase && isEditingGrid` → the build branch runs as today,
   except that a lettered cell that would be `'letter'` is
   `'editable-letter'` instead. Selection, slot membership and
   `'slot-letter'` all behave exactly as in build mode.
5. Otherwise → the build branch, unchanged.

`isEditingGrid` is consulted **only** when `isHintsPhase` is true. On its
own it does nothing — there is no such thing as editing the grid outside
hints phase, and the build branch already allows everything edit mode
would.

```tsx
// src/components/grid/EditGridToggle.tsx (new)
export function EditGridToggle(props: {
  isEditingGrid: boolean;
  disabled?: boolean;
  onToggle: () => void;
}): React.JSX.Element;
```

Renders "Edit grid" when not editing, "Edit hints" when editing. Same
`Button` and `variant="quiet"` as `PreviewToggle`, which it replaces in
`editor-actions` whenever `phase === 'hints'`.

```css
/* globals.css */
--color-locked-letter:   /* hints phase, grid locked */
--color-editable-letter: /* hints phase, EDIT GRID mode */
```

Both must render distinctly from each other and from
`--color-cell-fill` (build phase's lettered cell), since telling those
three states apart at a glance is the entire point.

## Markup contract

- `data-grid-mode` on the grid container widens to
  `"build" | "preview" | "hints" | "hints-editing"`. `"build"` and
  `"preview"` are unchanged for every existing case.
- `data-testid="edit-grid-toggle"` on the new button.
- `data-cell-state` carries the new values, as it already does for every
  other appearance.

## Behavior in hints phase

With the grid locked (not editing):

- Typing a letter does nothing.
- Backspace does nothing.
- Clicking a cell does not move the cursor.
- `.` still reaches `applyGeometryEdit`, which still rejects it and still
  surfaces `geometry-locked-message`. Unchanged.
- `HintsPanel` inputs are enabled.

In EDIT GRID mode:

- Typing a letter overwrites the cell under the cursor, as in build
  phase.
- Backspace still does nothing — see Decisions.
- Clicking a cell moves the cursor again.
- `HintsPanel` inputs are disabled.

While published: the toggle renders `disabled`, so edit mode cannot be
entered at all. Unpublishing re-enables it, with the grid locked.

## Decisions

**Deletion stays blocked even in EDIT GRID mode.** Clearing a letter
cannot corrupt anything — the cell stays active, so geometry, slots,
numbering and hint keys are all untouched — but it can only ever leave a
hole in a puzzle the transition made complete. Because geometry is
frozen, no word can change length, so every legal repair is an overtype:
the builder types the replacement directly over the old letter and never
needs to clear anything first.

**No message when a blocked key is pressed.** The keystroke does nothing.
A builder who tries it once will see the letter stay put and move on; a
modal or toast for a key that was never going to work is more disruptive
than the silence.

**`isEditingGrid` is component state, not persisted.** Same reasoning as
preview (D4): it is a way of looking at the puzzle, not a property of it.
A reload returns to the locked grid with the clue inputs live.

**The toggle is disabled while published.** A published puzzle may
already have been solved; its content is frozen, and `PublishedLockMessage`
plus the disabled title and clue inputs already say so. Leaving the
toggle clickable-but-inert would invite the builder to discover the lock
by bouncing off it. Disabling it also means unpublishing always returns
to the same place — the locked grid — rather than to whichever mode the
builder happened to be in beforehand.

**Clue inputs and letter editing are mutually exclusive.** Both consume
typing, and a builder cannot meaningfully do both at once.
`HintsPanel`'s `disabled` prop already exists for the published case;
edit mode reuses it.

**Preview keeps its precedence over the hints flags, even though it is
currently unreachable there.** `PreviewToggle` renders only in grid
phase, and this story replaces it in hints phase, so no user path
previews a hints-phase puzzle today. The ordering is defensive: if
preview is ever offered in hints phase, it must keep answering "what will
this look like published" rather than showing a locked-builder
appearance. The style guide also renders `mode="preview"` directly, and
that must stay unaffected by any flag.

**An empty cell in hints phase renders `'empty'`, not black.** The
transition blackens every unfilled cell, so this should not occur. But
`cellAppearance` must be total, and rendering a stray empty cell as black
would hide a real problem rather than show it.

**The style guide's new sample is a separate story.** Two new tokens are
added to `globals.css` here, but `style-guide.spec.ts` iterates its own
`COLOR_TOKENS` list rather than reading the stylesheet, so nothing breaks
by leaving them unregistered for now. Registering them and adding an
`sg-grid-hints` sample is independent work that nothing in this story
depends on, and keeping it out keeps this PR reviewable.

## Existing specs this story changes

Three previously-committed assertions stop holding, all for the same
reason — typing in hints phase now requires EDIT GRID mode. None is a
test defect; each is a deliberate consequence of the lock, and the
corrected files are provided.

- `hints-panel.spec.ts`, P5-2 "typing highlights the exact cursor cell
  and the rest of its slot" — now enters EDIT GRID mode and clicks a
  cell to refocus the grid before typing. What the test guards (typing
  highlights the cursor cell and its slot) is unchanged.
- `published-lock.spec.ts`, PB4-2 "controls come back and letters can be
  typed again" — unpublishing still restores editability; it now costs
  one click. The test enters EDIT GRID mode before typing.
- `published-lock.spec.ts`, PB4-3 "no lock message, and editing works as
  before" — same change, same reasoning.

`grid-focus.spec.ts`, `build-grid.spec.ts`, `controls.spec.ts` and
`preview.spec.ts` are unaffected: all seed grid phase, except
`preview.spec.ts`'s "the toggle is not rendered in hints phase", which
still passes because this story replaces `preview-toggle` rather than
adding it.

## Scope discipline

- No changes to `src/engine/` — not `applyLetterEdit`, not `deleteAt`,
  not `applyGeometryEdit`, not `enterHintsPhase`. The input guards live
  in `PuzzleGridEditor`'s `handleGridKeyDown` and `handleCellClick`,
  beside the existing `publishedAt` guards.
- No changes to `keyToIntent`. It keeps mapping Backspace to
  `{ type: 'delete' }`; the editor decides whether to act on it.
- No changes to `HintsPanel`'s contents or layout.
- No changes to preview behavior or its tokens.
- No style-guide changes — `TokenPane`'s `COLOR_TOKENS` and
  `GridExamples` are untouched.
- No persistence, no schema changes, no Server Action changes.

## Acceptance examples

**H4-1 — `cellAppearance` (Vitest, `src/lib/cell-appearance.test.ts`)**
- Hints phase, locked: a lettered cell is `'locked-letter'`; a black
  cell is `'black'`; an empty cell is `'empty'`.
- Hints phase, locked: selection and slot membership are ignored.
- Hints phase, editing: a lettered cell is `'editable-letter'`;
  selection still wins; a lettered cell in the cursor's slot is still
  `'slot-letter'`.
- Preview outranks both flags.
- `isEditingGrid` alone, without `isHintsPhase`, changes nothing.
- Omitting both flags behaves exactly as today — every D3 and D4 case
  still holds.

**H4-2 — the locked grid (Playwright, `e2e/locked-grid.spec.ts`)**
- In hints phase the grid reports `data-grid-mode="hints"`, lettered
  cells report `data-cell-state="locked-letter"`, `preview-toggle` is
  absent and `edit-grid-toggle` reads "Edit grid".
- Typing a letter leaves the cell unchanged; Backspace leaves it
  unchanged; clicking a cell selects nothing.
- Clicking the toggle gives `data-grid-mode="hints-editing"`,
  `data-cell-state="editable-letter"`, a button reading "Edit hints",
  and disabled clue inputs.
- In edit mode, typing over a cell replaces its letter; Backspace still
  does nothing.
- Toggling back restores the locked grid and re-enables the clue inputs.
- Edit mode does not survive a reload.
- Build phase is unaffected.

**H4-3 — publishing (Playwright, `e2e/published-lock.spec.ts`)**
- While published, `edit-grid-toggle` is disabled.
- After unpublishing it is enabled again, and entering edit mode allows
  typing.

## Definition of done

1. `npx vitest run src/lib/cell-appearance.test.ts` passes with D3's,
   D4's and H4's cases.
2. `e2e/locked-grid.spec.ts`, `e2e/hints-panel.spec.ts` and
   `e2e/published-lock.spec.ts` pass: `npm run test:e2e`.
3. Every other spec passes unmodified. **Check this rather than assuming
   it.**
4. `tsc --noEmit` is clean across the repo.
5. Lint is clean.
6. `npm run verify` exits 0.

Write the implementation to make the provided tests green. Do not edit
the tests to match your implementation — the tests are the
specification.
