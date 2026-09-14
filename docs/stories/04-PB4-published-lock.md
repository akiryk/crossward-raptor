# Story PB4 — A published puzzle is read-only

Fourth slice of the publishing epic. While a puzzle is published, its
letters, hints, and title can't be changed. To edit it, unpublish first.

**Why, since this is the epic's most consequential decision after PB1a.**
Once solvers exist, editing a published puzzle changes the answers out from
under someone mid-solve — their correct letters silently become wrong.
Handling that properly means versioning, invalidating solves, and probably
telling someone. Freezing on publish sidesteps all of it, costs the builder
one extra click, and hands the play epic a guarantee rather than a problem.

Note this is a lock on a state the builder *chose*, not a gate on choosing
it. Publishing itself is never blocked — PB3 established that, and nothing
here changes it.

**High blast radius** — `actions.ts`. Branch and PR.

Repo paths:
- `src/app/puzzles/actions.ts` — edited: `saveGrid`, `saveHints`,
  `saveTitle` refuse when published
- `src/components/grid/PuzzleGridEditor.tsx` — edited: editing intents
  ignored when published
- `src/components/grid/HintsPanel.tsx` — edited: inputs disabled
- `src/components/puzzle/PuzzleTitle.tsx` — edited: input disabled
- `src/components/grid/ClearLettersButton.tsx` — edited or conditionally
  rendered
- `src/components/grid/PublishedLockMessage.tsx` — new
- `e2e/published-lock.spec.ts` — Playwright acceptance tests (**already
  provided — do not edit**)

**No Vitest file.** There's no extractable pure logic here — "is
`publishedAt` set" is a field read, not a computation. The epic anticipates
Playwright-only stories; inventing a module to have something to unit-test
would be worse than not having one.

## Decisions

**Published-ness stays out of the engine.** `Puzzle` in `src/engine/` is
the authoring model — geometry, letters, hints, phase. Whether a puzzle has
been published is a lifecycle fact about the stored record, not a property
of the grid. Adding `publishedAt` to the engine's `Puzzle` would ripple
through serialization and every engine function for no gain. Enforcement
lives in the Server Actions and the UI instead.

**The Server Actions throw; the UI prevents.** The UI is what a builder
experiences: disabled inputs, hidden controls, a message saying why. The
action guard is defence in depth for a path the UI shouldn't allow — so a
throw is right, matching `withLetter`'s precedent that an impossible state
fails loudly rather than being quietly handled. It should never fire in
normal use.

**Geometry needs no new lock.** A puzzle can only be published from hints
phase (PB3), and geometry is already frozen there (Story E). The existing
rejection message stands; don't add a second path to the same outcome.

**One message, not four.** A single `published-lock-message` explains that
editing is locked and that unpublishing restores it, rather than a
different notice per disabled control. The disabled state of each control
is the local signal; the message is the explanation.

**Unpublishing restores everything immediately.** No reload required — the
same state that disables editing re-enables it.

## Markup contract

When `publishedAt` is set:

- `data-testid="published-lock-message"` is visible, with text explaining
  editing is locked and naming unpublishing as the way to resume.
- `puzzle-title` is disabled.
- Every `hint-input` is disabled.
- `clear-letters-button` is absent.
- Typing a letter or pressing Backspace changes nothing.

When not published, none of the above applies and every control behaves
exactly as before.

## Scope discipline

- **No changes to `src/engine/`.**
- **No changes to publishing or unpublishing themselves.** PB3.
- **No visibility changes.** Still waiting on auth.
- **No published status in the builder's list.** PB5.
- **No new lock on geometry edits** — hints phase already covers it.
- **No changes to the readiness panel.**

## Acceptance examples

**PB4-1 — the lock (Playwright)**
- A published puzzle shows `published-lock-message` with visible text.
- Its `puzzle-title` input is disabled.
- Its `hint-input` fields are disabled.
- `clear-letters-button` is absent.
- Clicking an active cell and typing a letter leaves the cell unchanged.
- Pressing Backspace on a lettered cell leaves it unchanged.
- A geometry toggle is still rejected, by the existing hints-phase path —
  `geometry-locked-message`, not the published one.

**PB4-2 — unpublishing restores editing (Playwright)**
- After unpublishing, `published-lock-message` is gone.
- `puzzle-title` and `hint-input` are enabled again.
- `clear-letters-button` is back.
- Typing a letter writes it.
- All of that holds without reloading the page.

**PB4-3 — an unpublished puzzle is unaffected (Playwright)**
- No `published-lock-message` renders.
- Typing, Backspace, title editing, hint editing, and clear-letters all
  work as they did before this story.

## Definition of done

1. `e2e/published-lock.spec.ts` passes.
2. Every other spec passes unmodified. **Check rather than assume** —
   several specs edit letters, hints, or titles, and any of them that also
   publish would now behave differently.
3. `tsc --noEmit` is clean across the repo.
4. Lint is clean.
5. `npm run verify` exits 0.
6. Opened as a PR, not merged.

Write the implementation to make the provided tests green. Do not edit the
tests to match your implementation — the tests are the specification.
