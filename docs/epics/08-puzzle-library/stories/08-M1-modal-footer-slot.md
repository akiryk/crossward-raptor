# Story M1 — A Modal that can take a second dialog

First slice of the puzzle-library epic, and a prerequisite for L1.

`Modal` was built for exactly one caller (Story H1) and hardcodes a
confirm/cancel pair in its own markup. The new-puzzle dialog that L1
moves into it needs a confirm button that stays disabled until a title
is typed — which today would mean a new prop, and then another for the
next dialog, and another after that.

This story replaces the hardcoded footer with one injectable slot, moves
the standard button row into a small companion component so it stays
centralized, and adds the close control the dialog has been missing.

Repo paths:
- `src/components/ui/Modal.tsx` — edited: `footer` slot, `onClose`,
  close control
- `src/components/ui/ModalActions.tsx` — new
- `src/components/grid/EnterHintsDialog.tsx` — edited: passes a footer
- `e2e/modal.spec.ts` — new (**already provided — do not edit**)

## Required contract

```tsx
// src/components/ui/Modal.tsx (edited)
export function Modal(props: {
  open: boolean;
  title: string;
  onClose: () => void;          // replaces onCancel
  footer?: ReactNode;           // omit -> no footer row at all
  children: ReactNode;
}): React.JSX.Element | null;
```

`Modal` keeps owning everything uniform: rendering nothing when closed,
the backdrop, Escape, click-outside, centring, and the titled shell. All
three dismissal paths — Escape, backdrop, close control — call
`onClose`. The `confirmLabel`, `cancelLabel`, `onConfirm` and `onCancel`
props are gone.

```tsx
// src/components/ui/ModalActions.tsx (new)
export function ModalActions(props: {
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}): React.JSX.Element;
```

The standard right-aligned cancel-then-confirm row, rendered with the
existing `Button` (`variant="quiet"` for cancel, default for confirm) —
exactly the markup `Modal` renders today, moved out intact.

**`ModalActions` must render `data-testid="modal-cancel"` and
`data-testid="modal-confirm"`**, and `Modal` must keep
`data-testid="modal"`, `"modal-backdrop"` and `"modal-title"`. Two
committed specs (`enter-hints.spec.ts`, `enter-hints-snapshot.spec.ts`)
drive the dialog through those hooks, and this story must not touch
either file.

## Markup contract

- `data-testid="modal-close"` on the close control, with an accessible
  name ("Close"), positioned in the shell's top corner opposite the
  title.
- Everything else unchanged.

## Decisions

**One slot, not compound components.** `Modal.Header`/`Body`/`Footer`
sharing context is the standard answer when a dozen dialogs differ in
anatomy. There are two here. That pattern would push layout decisions
out to every caller and let the second dialog drift from the first, for
a flexibility nothing has asked for — AGENTS.md rule 2 is explicit about
abstractions for single-use code. The footer is the only part that
actually varies between the two known dialogs, so it is the only part
that becomes a slot.

**One slot, not more props.** The alternative — `confirmDisabled`, then
`confirmVariant`, then `hideCancel`, then a third button — is
defensible one prop at a time and a mess in aggregate. A dialog needing
three buttons or none passes its own footer, and `Modal` never changes
again.

**`ModalActions` is a separate component, not a default footer.** If
`Modal` rendered a default button row when `footer` is omitted, "no
footer" would become unexpressible. An explicit companion keeps the
standard treatment in one place while leaving the absence available.

**`confirmDisabled` and `confirmVariant` are not in this story.**
Neither has a consumer until L1's new-puzzle dialog, and configuration
added ahead of its caller cannot be tested through the UI at all. L1
adds `confirmDisabled` alongside the dialog that needs it.

**A close control, because the other two dismissals are invisible.**
Escape and click-outside are both discoverable only by people who
already expect them. The close control is the one visible way out that
doesn't require reading the footer's labels — which matters most for a
dialog whose cancel button is worded as a choice ("Keep building")
rather than as a dismissal.

**`onCancel` becomes `onClose`.** With the footer injected, the prop no
longer names a button; it names what every dismissal path does. The
caller is free to pass the same function to both.

## Scope discipline

- No changes to `enter-hints.spec.ts` or `enter-hints-snapshot.spec.ts`.
  If either fails, the implementation is wrong, not the spec.
- No changes to `EnterHintsDialog`'s own props or copy — it still takes
  `open`, `onConfirm`, `onCancel`, and `PuzzleGridEditor` is untouched.
- No changes to `Button`.
- No accessibility work — focus trap, focus restore, `aria-modal`,
  `aria-labelledby`, scroll lock and portal are Story M2, deliberately
  separate.
- No `NewPuzzleDialog` changes; that is L1.
- No new tokens.

## Acceptance examples

**M1-1 — the modal shell (Playwright, `e2e/modal.spec.ts`)**
- Opening the hints confirmation shows the modal, its title, and both
  footer buttons — the footer slot renders what it is given.
- A close control renders, with an accessible name.
- Clicking close dismisses the dialog and leaves the puzzle in grid
  phase — it behaves as a dismissal, not a confirmation.
- Escape and backdrop still dismiss, and still leave grid phase intact.
- Confirming from the injected footer still transitions the puzzle, so
  the footer's buttons are really wired to the caller.

Escape, backdrop, cancel and confirm are already covered in depth by
`enter-hints.spec.ts`; this file re-checks only enough of them to prove
the refactor preserved the wiring.

## Definition of done

1. `e2e/modal.spec.ts` passes: `npm run test:e2e`.
2. `e2e/enter-hints.spec.ts` and `e2e/enter-hints-snapshot.spec.ts` pass
   **unmodified** — they are the regression check on this refactor.
3. Every other spec passes unmodified. Check this rather than assuming
   it.
4. `tsc --noEmit` is clean across the repo.
5. Lint is clean.
6. `npm run verify` exits 0.

Write the implementation to make the provided tests green. Do not edit
the tests to match your implementation — the tests are the
specification.
