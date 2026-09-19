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

## What exists (files touched, cumulative across this document)

```
docs/epics/
  08-puzzle-library-epic.md   the epic this document tracks
docs/stories/
  08-M1-modal-footer-slot.md   Story M1's specification
docs/handoffs/
  08-HANDOFF-puzzle-library.md   this file
e2e/
  modal.spec.ts   Story M1's acceptance test, new — do not edit
src/components/ui/
  Modal.tsx          footer slot replaces confirm/cancel props; onClose
                      replaces onCancel; new modal-close control
  ModalActions.tsx   new — the standard cancel/confirm button row
src/components/grid/
  EnterHintsDialog.tsx   passes onClose and a ModalActions footer;
                          own props and copy unchanged
```

## The gate

`npm run verify` exits 0: `tsc --noEmit` clean, lint clean, 290 Vitest
tests passing (unchanged — this story added no engine or lib logic).
`npm run test:e2e`: 245 Playwright tests passing (6 net new, from
`modal.spec.ts`), plus one pre-existing, unrelated flake
(`style-guide.spec.ts`'s D8-2 "reloading restores committed values" —
passed 3/3 in isolation immediately after; documented since
`06-HANDOFF-visual-polish.md`).
