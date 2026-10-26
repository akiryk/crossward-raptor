# Story S9 — Modal entrance

Every dialog fades and grows slightly into place when it opens, instead of
appearing abruptly. The change is in epic 13's shared Modal, so every
dialog gets it: new puzzle, enter hints, play reset, the style guide's
sample, and the S4/S7 dialogs once they exist.

**Status: done** (2026-10-25). The human's visual check passed: they
tested the dialog entrance and accepted it with no change. Implemented on
`main` in `c48f176`, frozen in `6a098d5`. The human approved the
observed acceptance, including the full-motion project, and chose to keep
the confetti checks. Earlier the same day, the human chose the motion,
the instant close and a separate story at S3's visual check, and approved
the Decisions below, placing S9 after S3. One agent Decision
changed after that approval, when drafting found the confetti reads
reduced motion: see "The browser suite runs with reduced motion". The
acceptance was written and observed before approval.

**Blast radius: low-medium.** One component (`Modal.tsx`), two keyframes,
and the browser suite's motion setting. No server, schema or risk path, so
this is direct delivery on `main` under CODE-REVIEW.

## Decisions

Inspected `src/components/ui/Modal.tsx`, its callers (`NewPuzzleDialog`,
`EnterHintsDialog`, `PlayResetDialog`, the style guide), the 150ms ease-out
transitions on buttons, toggles, Radio and links (F6-7), and the frozen
tests that measure an open dialog (`modal-design`, `new-puzzle-dialog`,
`modal`, `modal-a11y`).

### The motion *(human)*

The human asked for "a subtle fade or zoom", and chose the recommended
fade and slight grow:

- **The panel** animates from opacity 0 and scale 0.97 to opacity 1 and
  scale 1, growing from its center.
- **The backdrop** fades from opacity 0 to its resting look.
- **The timing:** both run for 150ms, ease-out, starting together. These
  are the app's existing transition timing *(agent)*.
- **When it runs:** each time a dialog opens, including a reopen of a
  Modal that stays mounted (`EnterHintsDialog`).
- **When it ends,** nothing remains of it. The panel has no lasting
  transform or opacity, so its size and position are unchanged from today.

### Closing *(human)*

Closing stays instant, with no exit animation. Every caller unmounts its
dialog or hides it at once, so an exit animation would change each
caller's close. All of today's dismissal behavior is kept, including focus
returning to the opener.

### Reduced motion *(agent)*

Under `prefers-reduced-motion: reduce`, the panel only fades, with no
scale. The backdrop fade is unchanged.

### Implementation *(agent)*

Two CSS keyframes in `src/app/globals.css`, applied by Modal's backdrop and
panel, use no JavaScript timers and need no state. The open state is
unchanged, and so is focus. Initial focus still lands on open, because an
element that is fading in can take focus.

### The browser suite runs with reduced motion *(agent)*

Many frozen tests measure a dialog's boxes right after it opens, within
1px. A 3% scale would move those measurements while it runs (up to about
15px on a 500px panel), so they would fail by timing alone. The frozen tests
can't wait for the animation, because they're frozen. So:

- `playwright.config.ts` sets `contextOptions: { reducedMotion: 'reduce' }`
  for the suite. That leaves only the fade, which changes no box, color or
  hit target.
- **Except the confetti specs** *(found in drafting)*. `PlayConfetti` is
  the one other thing that reads `prefers-reduced-motion`: under reduce it
  hides and finishes at once. `play-completion.spec.ts` expects it to show,
  and `play-reset.spec.ts` and `play-reset-settling.spec.ts` expect it to
  be absent, which reduce would make pass vacuously. These three run in a
  new `authenticated-full-motion` project with `reducedMotion:
  'no-preference'`. None of them measures a box.
- The new spec opts back into full motion with
  `test.use({ contextOptions: { reducedMotion: 'no-preference' } })` to
  check the scale.

### Carried observations

- **Modal close button has no color transition:** not touched, stays open.
- **Modal clips content taller than the viewport:** not touched, stays
  open.

### EPIC amendment

The EPIC's story list adds "S9 — Modal entrance" after S3, before S4, as
the human set. It keeps its number, so the list notes that it runs out of
numeric order.

## Acceptance *(frozen)*

One new file, `e2e/modal-entrance.spec.ts`, 5 browser cases at 1280×800,
as the suite's signed-in builder. A MutationObserver pauses the panel's
(`new-puzzle-dialog`) and `modal-backdrop`'s animations the moment the
dialog is inserted. The test then seeks them to 0, 75 and 150ms and reads
the computed opacity and the panel's box, so the checks don't depend on
how the animation is written or on test speed.

1. **14-S9-1 full motion:** the panel and backdrop each run exactly one
   animation, 150ms with no delay. The panel's opacity goes 0 → about 0.684
   at 75ms (ease-out's midpoint) → 1, and the backdrop's does the same. The
   panel's box starts at 0.97 of its full width and height, follows the
   same curve, and keeps its center (within 0.5px).
2. **14-S9-2 it leaves nothing behind:** once finished, neither element
   has an animation, the panel's `transform` and `scale` are `none` and its
   opacity is 1. Its box matches its box under reduced motion within 1px.
3. **14-S9-3 reduced motion:** the panel's opacity follows the same 150ms
   ease-out fade, and its box stays its full size and position throughout.
   The backdrop still fades.
4. **14-S9-4 reopen:** after Cancel, opening the dialog again runs the
   entrance again, from opacity 0 and 0.97 width.
5. **14-S9-5 instant close:** after Cancel is clicked, no dialog remains by
   the next animation frame, and focus returns to Create A Puzzle.

### Acceptance choices *(drafting)*

- The suite's reduced motion and the `authenticated-full-motion` project in
  `playwright.config.ts` are part of the frozen acceptance.
- The new-puzzle dialog stands in for every dialog, because they all render
  the same Modal. Modal renders nothing while closed, so a reopen of a
  Modal that stays mounted (`EnterHintsDialog`) also creates a fresh
  panel; 14-S9-4 covers the remount path only.
- 14-S9-2 and 14-S9-5 are guards. They pass on `main` and catch an
  animation that lingers or an exit animation.

### Observed *(drafting, 2026-10-25)*

- **Against `main`** (no animation): 14-S9-1, -3 and -4 fail (no
  animation on the panel); 14-S9-2 and -5 pass.
- **Against a throwaway** (two keyframes in `globals.css`, a class on the
  backdrop and the panel, a reduced-motion rule naming the fade): all 5
  pass. It was reverted, and nothing at runtime is changed.
- **Each wrong variant fails:** linear easing (S9-1, -3: opacity 0.5 at
  75ms), scale 0.95 (S9-1, -4: width 285 vs 291), `forwards` fill (S9-2,
  -4, -5), no reduced-motion rule (S9-3: x 494.5 vs 490), and a close
  delayed 150ms (S9-5: one dialog left).
- **Full `npm run test:e2e` with the throwaway:** 553 passed (548 + 5).
  The first run, with every project reduced, failed the two confetti cases
  in `play-completion.spec.ts`, which led to the full-motion project.
- **The same throwaway with the suite at full motion:** 3 frozen tests
  fail (`modal-design` F4-2 panel width and F4-5 play reset's footer, and
  `puzzle-library` 14-S2-6's focus after delete). This confirms the suite
  needs reduced motion.
- `npm run verify` exits 0 on the drafting tree (610 Vitest tests).

## Repo paths

Acceptance (immutable after freeze): `e2e/modal-entrance.spec.ts`, and in
`playwright.config.ts` the suite's `reducedMotion`, `FULL_MOTION_SPECS`
and the `authenticated-full-motion` project.

Runtime:

- `src/components/ui/Modal.tsx`: the panel and backdrop animations.
- `src/app/globals.css`: the two keyframes.
- This story, `../EPIC.md` (the amendment) and `../HANDOFF.md`.

Declare any other path before editing it.

## Scope discipline

Only S9. Out of scope:

- an exit animation;
- the Modal's look, layout or focus behavior;
- other components' motion;
- the close button's transition;
- responsive work (epic 15).

## Definition of done

- The human approves this specification and its acceptance, recorded here
  and in the handoff. Freeze on `main` in a specification-only commit
  before any runtime change.
- Frozen acceptance is unchanged after freeze.
- `npm run verify` exits 0, and the full `npm run test:e2e` suite exits 0.
- The human's visual check of a dialog opening.
- Delivered on `main`, with the handoff updated with observed results.
