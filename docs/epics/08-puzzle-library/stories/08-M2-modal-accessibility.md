# Story M2 — An accessible Modal

Final story of the puzzle-library epic. M1 gave `Modal` a flexible shape;
this makes it behave like a dialog for everyone, not only for people
using a mouse.

Today, `Modal` looks like a dialog but doesn't act like one:

- **No focus trap.** Tab walks straight out of the dialog into the page
  hidden behind the backdrop.
- **No focus restore.** Closing the dialog drops focus to `<body>`, so a
  keyboard user loses their place.
- **Not announced as a dialog.** `role="dialog"` sits on the outer
  container — including the backdrop — with no `aria-modal` and no
  accessible name, so a screen reader announces nothing useful.
- **The page scrolls underneath it.**
- **No portal.** It renders in place, so an ancestor with a transform or
  overflow rule can clip a `fixed` overlay.

And one structural problem that has to be fixed first, because the
portal depends on it.

Repo paths:
- `src/components/ui/Modal.tsx` — edited
- `src/components/puzzle/NewPuzzleDialog.tsx` — edited: drops its
  wrapper, passes `testId`
- `src/components/grid/EnterHintsDialog.tsx` — edited: drops its
  wrapper, passes `testId`
- `e2e/modal-a11y.spec.ts` — new (**already provided — do not edit**)

## The structural problem

Both dialogs attach their testid by wrapping `Modal` in a div of their
own:

```tsx
<div data-testid="new-puzzle-dialog" className="fixed inset-0 z-50">
  <Modal …>
```

`Modal`'s own root is also `fixed inset-0 z-50`. So every open dialog is
two full-screen fixed overlays stacked on each other. It works today
only because they happen to coincide.

A portal breaks that: `Modal`'s content would move to `document.body`
while the wrapper stayed where it was — an empty, invisible,
full-screen layer that no longer contains the dialog its testid names.

So `Modal` takes the testid itself, on the dialog panel, and both
wrappers are deleted.

## Required contract

```tsx
// src/components/ui/Modal.tsx (edited)
export function Modal(props: {
  open: boolean;
  title: string;
  onClose: () => void;
  footer?: ReactNode;
  children: ReactNode;
  testId?: string;   // new: placed on the dialog panel
}): React.JSX.Element | null;
```

Structure, outermost first:

- **The root** keeps `data-testid="modal"`, is `fixed inset-0`, and is
  portaled into `document.body`.
- **The backdrop** keeps `data-testid="modal-backdrop"` and still calls
  `onClose` on click.
- **The panel** — the visible box — carries `role="dialog"`,
  `aria-modal="true"`, `aria-labelledby` pointing at the title's id, and
  `data-testid={testId}` when one is given.

`NewPuzzleDialog` passes `testId="new-puzzle-dialog"` and
`EnterHintsDialog` passes `testId="enter-hints-dialog"`, and neither
renders a wrapper of its own any more.

## Behavior

**Initial focus.** If something inside the panel already took focus as
it mounted — `NewPuzzleDialog`'s name field has `autoFocus` — leave it
there. Otherwise, focus the panel itself (it gets `tabIndex={-1}` for
this). Never auto-focus the close control, and never auto-focus the
confirm button: for the hints dialog that button performs an
irreversible action, and a stray Enter must not trigger it.

**Focus trap.** While open, Tab and Shift+Tab cycle only among the
panel's focusable elements, wrapping at both ends. Disabled controls are
skipped — `NewPuzzleDialog`'s Create button is disabled until a name is
typed, and must not be a stop in the cycle while it is.

**Focus restore.** When the dialog closes by any route, focus returns to
whatever was focused just before it opened — the New Puzzle button, or
the stepper's "Write clues" step. If that element is no longer in the
document (creating a puzzle navigates away, unmounting the button), do
nothing rather than throw.

**Scroll lock.** While open, `document.body` does not scroll. On close,
the body's previous `overflow` value is restored exactly — not reset to
an assumed default.

**Escape** still calls `onClose`, as today.

**No server-side crash.** `document.body` does not exist during server
rendering. Neither dialog renders `Modal` open on the server today, but
the portal must not throw if one ever does.

## Decisions

**`testId` is added now, not deferred.** M1 argued against adding props
ahead of a consumer. This one has two, and the workaround they use
instead — a second fixed overlay — is exactly what the portal breaks.
Deferring it would mean shipping the portal broken.

**`role="dialog"` moves to the panel.** The dialog is the box, not the
box plus the dimmed page behind it. Labelling the backdrop as part of
the dialog is why the current markup announces nothing useful.

**Initial focus goes to the panel, not the first focusable.** The WAI
dialog pattern allows either, and for these two dialogs the first
focusable is the close control and the obvious next one is an
irreversible confirm. Focusing the panel lets a screen reader read the
title and body first, and lets a keyboard user Tab to what they
actually want.

**Focus restore tolerates a vanished target.** Creating a puzzle
navigates to the editor, unmounting the button that opened the dialog.
Throwing there would turn a successful create into an error.

**Scroll lock restores the previous value.** Setting `overflow` back to
`''` would clobber anything the page had set itself.

**No focus-trap library.** The trap needs to know what's focusable and
wrap at the ends — a few lines. A dependency for that would outweigh the
code it replaces.

## Scope discipline

- No changes to `ModalActions`, `Button`, or any dialog's copy, props or
  behavior beyond dropping its wrapper and passing `testId`.
- No changes to how either dialog is opened, confirmed or cancelled.
- No new tokens and no visual changes — the dialog should look exactly
  as it does now.
- No animation, no nested-dialog support, no stacking.

## Acceptance examples

**M2-1 — accessibility (Playwright, `e2e/modal-a11y.spec.ts`)**
- The dialog panel has `role="dialog"`, `aria-modal="true"`, and an
  `aria-labelledby` naming the element that shows the dialog's title.
- The dialog testid lands on that same panel, for both dialogs.
- The modal's root is a direct child of `<body>`.
- An open dialog renders exactly one full-screen overlay.
- On opening the hints dialog, focus is inside the panel and is on
  neither the close control nor the confirm button.
- On opening the new-puzzle dialog, the name field has focus.
- Tabbing forward and backward repeatedly never leaves the panel.
- The disabled Create button is never a Tab stop.
- Closing with Escape returns focus to the New Puzzle button; closing
  the hints dialog returns it to the "Write clues" step.
- The body cannot scroll while a dialog is open, and its previous
  `overflow` is restored on close.

## Definition of done

1. `e2e/modal-a11y.spec.ts` passes: `npm run test:e2e`.
2. `modal.spec.ts`, `enter-hints.spec.ts`, `enter-hints-snapshot.spec.ts`,
   `new-puzzle.spec.ts`, `new-puzzle-resubmit.spec.ts` and
   `persistence.spec.ts` pass **unmodified**. Together they drive every
   dismissal and confirmation path through both dialogs, so they are the
   regression check on moving `Modal`'s DOM into a portal. If one fails,
   the implementation is wrong — stop and report it.
3. Before implementing, grep the suite for any locator that reaches a
   dialog element *through a parent outside the dialog* — for example
   `new-puzzle-name` located inside the `new-puzzle` wrapper — and for
   `getByRole('dialog')`. The portal moves the dialog out of its parent,
   and `role="dialog"` moves to a different element. If either turns up,
   stop and report it.
4. Every other spec passes unmodified. Check this rather than assuming
   it.
5. `tsc --noEmit` is clean across the repo.
6. Lint is clean.
7. `npm run verify` exits 0.

Write the implementation to make the provided tests green. Do not edit
the tests to match your implementation — the tests are the
specification.
