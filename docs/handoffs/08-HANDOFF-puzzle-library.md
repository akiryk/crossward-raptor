# Puzzle Library — Handoff

Current state of the crossword-builder project's eighth epic, for an
agent or collaborator picking it up fresh. Read alongside
`docs/epics/08-puzzle-library-epic.md` and `AGENTS.md`, which remain
authoritative for scope and behavior.

Repo: `crossward-raptor`. Branch `main`, tracking `origin/main`.

---

## Where things stand

**Story M1 (a Modal that can take a second dialog) is complete and
committed.** `Modal` was built in Story H1 for exactly one caller and
hardcoded a confirm/cancel button pair in its own markup; the
new-puzzle dialog this epic's L1 will move into it needs a confirm
button that stays disabled until a title is typed, which would have
meant a new prop, then another, then another.

`Modal`'s `confirmLabel`/`cancelLabel`/`onConfirm`/`onCancel` props are
gone, replaced by a single `footer?: ReactNode` slot and a renamed
`onClose: () => void` that all three dismissal paths (Escape, backdrop,
and a new close control) call — `onClose` names what every dismissal
path does now that the footer is injected, not a specific button. New
`ModalActions` (`src/components/ui/ModalActions.tsx`) is the standard
right-aligned cancel-then-confirm row, moved out of `Modal` intact
rather than becoming compound components (`Modal.Header`/`Body`/`Footer`
is the right answer for a dozen varied dialogs; there are two here, and
AGENTS.md rule 2 is explicit about abstractions for single-use code).
`confirmDisabled` and `confirmVariant` are deliberately not part of
`ModalActions` yet — neither has a consumer until L1's new-puzzle
dialog, and configuration added ahead of its caller can't be tested
through the UI at all.

`Modal` also gained a `data-testid="modal-close"` control in the
shell's top corner, since Escape and backdrop are both invisible
affordances discoverable only by people who already expect them.
`EnterHintsDialog` (the one existing consumer) now passes
`onClose={onCancel}` and a `footer={<ModalActions .../>}`; its own
external props (`open`, `onConfirm`, `onCancel`) and copy are unchanged,
per the story's scope discipline.

**No accessibility work in this story** — focus trap, focus restore,
`aria-modal`, `aria-labelledby`, scroll lock, and a portal are Story M2,
independent and deliberately separate.

**A process note, not a spec conflict:** the very first full run of
`e2e/modal.spec.ts` plus the two regression specs
(`enter-hints.spec.ts`, `enter-hints-snapshot.spec.ts`) failed all 20
tests identically, timing out on `waitForEditorReady` — including
`enter-hints-snapshot.spec.ts`'s first test, which never opens a dialog
at all. That ruled out the refactor as the cause before it was ever
suspected: the run had been invoked as a direct `npx playwright test`
call, bypassing `pretest:e2e` (test-database migration/reset, and
clearing the dev-server lock and Playwright's own port) that
`npm run test:e2e` normally runs first. Re-running through
`npm run test:e2e` passed all 20 immediately, and the two regression
specs are confirmed unmodified (`git diff` on both is empty).

**Story L1 (the new-puzzle dialog) is complete and committed.**
`NewPuzzleDialog` predated `Modal` entirely — a bare block with no
backdrop or shell, unlabelled `<button>`s standing in for a size
choice, and a name field with no visible label. It now renders through
`Modal` (the same `fixed inset-0` wrapper-div mechanism
`EnterHintsDialog` established, reused rather than invented twice),
passing `<ModalActions>` as its footer. Its own Escape handler is
gone — `Modal` already owns that, and two handlers for one key was a
bug waiting to happen. `hasSubmittedRef`'s double-submit guard is
untouched, still proven by `new-puzzle-resubmit.spec.ts`.

`PuzzleSize` gained `'midi'` (9×9 — the size the NYT publishes between
Mini and the weekday puzzle, odd-dimensioned so rotational symmetry
still has a true centre cell), ordered smallest to largest everywhere
it's listed. The size controls are now real `<input type="radio">`s
sharing one `name`, with `data-size` kept on the input itself (not a
wrapping label) and `data-selected` kept alongside the native checked
state — a committed hook, cheap to preserve even though `toBeChecked()`
is the more meaningful assertion now. The name field gained a visible
label and a placeholder; its `aria-label` stays the accessible name, so
nothing depends on label association.

**A genuine contract error surfaced before any implementation, and was
corrected before it caused rework.** The story's original markup
contract asked for `NewPuzzleDialog`'s Create/Cancel buttons to carry
both `new-puzzle-create`/`new-puzzle-cancel` *and* `modal-confirm`/
`modal-cancel` as `data-testid` — impossible, since `data-testid` is a
single exact-match attribute and Playwright's `getByTestId` doesn't do
token matching, and it has to be the literal `<button>` for
`new-puzzle-resubmit.spec.ts`'s direct `.click()` calls and
`new-puzzle.spec.ts`'s `toBeDisabled()`/`toBeEnabled()` assertions to
mean anything. Caught before any code was written; the builder
corrected the contract to give `ModalActions` two more optional props,
`confirmTestId`/`cancelTestId` (defaulting to `'modal-confirm'`/
`'modal-cancel'`), so each button carries exactly one testid.
`EnterHintsDialog` passes neither and is unaffected; `NewPuzzleDialog`
passes its own pair.

## What exists (files touched, cumulative across this document)

```
docs/epics/
  08-puzzle-library-epic.md   the epic this document tracks
docs/stories/
  08-M1-modal-footer-slot.md   Story M1's specification
  08-L1-new-puzzle-dialog.md   Story L1's specification (amended:
                                 confirmTestId/cancelTestId correction)
docs/handoffs/
  08-HANDOFF-puzzle-library.md   this file
e2e/
  modal.spec.ts        Story M1's acceptance test, new — do not edit
  new-puzzle.spec.ts   Story L1 — extended, not new: D6-3's cases
                         unchanged except the default-selection test,
                         plus a Midi case — do not edit
src/components/ui/
  Modal.tsx          footer slot replaces confirm/cancel props; onClose
                      replaces onCancel; new modal-close control
  ModalActions.tsx   new — the standard cancel/confirm button row.
                      Story L1 — confirmDisabled, confirmTestId,
                      cancelTestId added
src/components/grid/
  EnterHintsDialog.tsx   passes onClose and a ModalActions footer;
                          own props and copy unchanged
src/components/puzzle/
  NewPuzzleDialog.tsx   Story L1 — renders through Modal/ModalActions;
                         radios instead of buttons; labelled name field;
                         own Escape handler removed
src/lib/
  puzzle-size.ts        Story L1 — midi (9x9) added
  puzzle-size.test.ts   Story L1's Vitest acceptance test, extended —
                         do not edit
```

## The gate

`npm run verify` exits 0: `tsc --noEmit` clean, lint clean, 292 Vitest
tests passing (2 net new, from `puzzle-size.test.ts`'s Midi coverage).
`npm run test:e2e`: 247 Playwright tests passing (6 from M1's
`modal.spec.ts`, 2 from L1's additions to `new-puzzle.spec.ts`). The
D8-2 flake noted after M1 did not recur on this run.
