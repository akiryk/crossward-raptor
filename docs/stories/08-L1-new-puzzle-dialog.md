# Story L1 — The new-puzzle dialog

Second slice of the puzzle-library epic, and the first consumer of M1's
footer slot.

`NewPuzzleDialog` predates `Modal`. It renders as a bare block that
drops into the page below the button, with no backdrop, no shell, and no
visual separation from the list beneath it. Its size controls are
unlabelled `<button>`s that look like nothing in particular, and the
name field has no visible label or placeholder, so an empty box is all a
builder sees.

This story moves it into `Modal`, makes the sizes real radio buttons,
labels the name field, and adds the Midi size.

Repo paths:
- `src/lib/puzzle-size.ts` — edited: `midi`, 9×9
- `src/lib/puzzle-size.test.ts` — extended (**already provided — do not
  edit**; D6-1's and D6-2's cases unchanged, Midi threaded through)
- `src/components/ui/ModalActions.tsx` — edited: `confirmDisabled`
- `src/components/puzzle/NewPuzzleDialog.tsx` — edited: into `Modal`,
  radios, labelled field
- `e2e/new-puzzle.spec.ts` — extended (**already provided — do not
  edit**; D6-3's cases unchanged except the default-selection test, plus
  a Midi case)

## Required contract

```ts
// src/lib/puzzle-size.ts (edited)
export type PuzzleSize = 'mini' | 'midi' | 'daily' | 'sunday';
// midi: { cols: 9, rows: 9 }
```

`DEFAULT_SIZE` stays `'daily'`. Sizes are ordered smallest to largest
everywhere they are listed.

```tsx
// src/components/ui/ModalActions.tsx (edited)
// gains: confirmDisabled?: boolean   // defaults false
```

Forwarded to the confirm `Button`'s existing `disabled` prop. Nothing
else changes.

`NewPuzzleDialog` keeps its existing props (`onCancel`, `onCreate`) and
renders through `Modal`, passing `<ModalActions>` as the footer.
`NewPuzzleButton` is untouched.

## Markup contract

Every existing testid keeps its meaning: `new-puzzle-dialog`,
`new-puzzle-name`, `new-puzzle-size`, `new-puzzle-create`,
`new-puzzle-cancel`. Four committed specs depend on them.

- `new-puzzle-dialog` attaches to the `Modal` the same way
  `enter-hints-dialog` does in `EnterHintsDialog` — whatever mechanism
  that story used, reuse it rather than inventing a second one.
- The size controls become `<input type="radio">` elements sharing one
  `name`. **`data-size` stays on the input itself**, not on a wrapping
  label, so the existing `[data-size="…"]` locator still resolves to the
  element Playwright clicks and to the one whose checked state is
  meaningful.
- **`data-selected` is kept** alongside the native checked state.
  Real radios make `toBeChecked()` the better assertion, but
  `data-selected` is a committed hook and preserving it costs nothing.
- `new-puzzle-create` and `new-puzzle-cancel` move onto
  `ModalActions`' buttons, which also carry `modal-confirm` and
  `modal-cancel`. Both sets of testids must be present.

## Decisions

**The dialog's own Escape handler is deleted.** `Modal` already listens
for Escape and calls `onClose`. Two handlers for one key is a bug
waiting to happen — the moment their behavior diverges, which one wins
depends on listener registration order.

**`hasSubmittedRef` stays exactly as it is.** It guards against two
clicks dispatched in the same task, before React commits the state
update that disables the button. Moving the button into `ModalActions`
doesn't change that race, and `new-puzzle-resubmit.spec.ts` exists to
prove it.

**Radios, not styled buttons.** A radio group is what this control is —
one choice from a small fixed set — and using the native element gets
keyboard navigation, screen-reader grouping and checked semantics for
free, none of which the current buttons have.

**The name field gets both a visible label and a placeholder.** The
label says what the field is before it's focused; the placeholder shows
what a name looks like. The `aria-label` stays as the accessible name,
so nothing depends on label association.

**Midi is 9×9.** That's the size the NYT publishes between the Mini and
the weekday puzzle. It's odd-dimensioned, so rotational symmetry still
has a true centre cell — `symmetricCounterpart` already handles that,
but it's the reason an even size would have been the wrong choice.

**`confirmDisabled` lands here, not in M1.** M1 deliberately left it
out: it had no consumer, and configuration that can't be exercised
through the UI can't be tested. This is the consumer.

## A note on `wait-for-ready.ts`

`waitForNewPuzzleReady` blocks on
`[data-testid="new-puzzle"][data-ready="true"]`, and every spec in the
suite that visits `/puzzles` goes through it. That wrapper lives in
`NewPuzzleButton`, which this story does not touch — but if it moves or
loses `data-ready`, the whole suite hangs on a timeout rather than
failing with a useful message. **Leave it exactly where it is.**

## Scope discipline

- No changes to `NewPuzzleButton`, including its `data-ready` wrapper.
- No changes to `Modal` itself — L1 consumes M1's slot, it doesn't
  extend it.
- No changes to `createPuzzle`, `actions.ts`, or any Prisma schema.
  `createPuzzle` is already generic over `PuzzleSize`.
- No changes to the `/puzzles` page layout or its rows — that is L2.
- No new tokens.
- `TextInput` is unchanged; the radios are plain inputs, not a new
  variant.

## Acceptance examples

**L1-1 — `puzzle-size` (Vitest, `src/lib/puzzle-size.test.ts`)**
- Midi maps to 9×9; the other three are unchanged.
- `createBlankPuzzle('midi')` yields a 9×9 whose every cell is active
  and empty.
- The default is still `'daily'`.
- Every size-iterating case covers all four sizes, driven off
  `Object.keys(EXPECTED)` rather than a literal list, so a fifth size
  can't be added without the loops picking it up.

**L1-2 — the dialog (Playwright, `e2e/new-puzzle.spec.ts`)**
- Daily is checked by default; the other three are not — asserted both
  natively (`toBeChecked`) and through `data-selected`.
- Creating a Midi puzzle yields an 81-cell grid.
- Every existing case still holds: the button opens a dialog without
  creating anything, the name input is focused on open, create is
  disabled until a non-whitespace name is typed, cancelling and Escape
  both close without creating, and each size produces a grid of the
  right size.

## Definition of done

1. `npx vitest run src/lib/puzzle-size.test.ts` passes.
2. `e2e/new-puzzle.spec.ts` passes: `npm run test:e2e`.
3. `e2e/persistence.spec.ts`, `e2e/new-puzzle-resubmit.spec.ts` and
   `e2e/controls.spec.ts` pass **unmodified** — none of them touches the
   size controls, so they are the regression check on moving the dialog
   into `Modal`.
4. Every other spec passes unmodified. Check this rather than assuming
   it.
5. `tsc --noEmit` is clean across the repo.
6. Lint is clean.
7. `npm run verify` exits 0.

Write the implementation to make the provided tests green. Do not edit
the tests to match your implementation — the tests are the
specification.
