# Story S3 — The bar's look

The progress bar from S2 becomes 16px tall with 20px corners and a
gray-500 fill, and its fill animates in from 0, turning interactive-dark
when it reaches the zone.

**Status: Done 2026-11-08:** implemented fd45a02, direct to `main`;
independent review: no blockers; the human's visual check passed
2026-11-08. Approved and frozen 2026-11-08 (18afb53) by the orchestrating session
under the human's delegation ([history](../HISTORY.md#orchestration)),
after an independent review of the draft (no blockers; its four
should-fix findings and nits all addressed). Builds on S2 (d0b855b).

**Blast radius: small, off the risk paths.** `BuildProgress.tsx`, one
color style's value and its style-guide swatch. Direct delivery to
`main`.

## The human's request

The human's visual check of S2 (2026-11-08), items 1–4 as given (item 5,
a tooltip over the bar, is S4):

> It looks good! A few changes:
> 1. Make the progress bar have a height of 16px rather than whatever it is today
> 2. Give the bar rounded corners like the preview toggle -- 20px should do it.
> 3. Make the light gray bar that fills as progress continues a bit darker. Use gray-500
> 4. Have the progress part of the bar animate in. That is, the gray part should start from 0 width and animate up to its correct width so we draw the user's eye. Once it reaches the target zone, it should transition to the blue-color (interactive-dark)

## What the code does today

- `BuildProgress` (`src/components/grid/BuildProgress.tsx`) renders
  `build-progress-bar`: `h-3` (12px, border included), `w-45`, a 1px
  `border-line-muted` (gray-200), `bg-progress-track` (white), square.
  Inside it, absolutely placed, `build-progress-fill` (width the exact
  share, `bg-progress-fill` below 80%, `bg-progress-fill-ready` from it)
  and `build-progress-zone` (80–85%, `bg-progress-zone`). No transition.
- It mounts each time Preview turns on in a daily or Sunday build phase
  and unmounts when it turns off.
- The bar sits in a `flex h-4` (16px) box: on one line, centered on the
  40px or 48px row; on two lines (below a 490px window), the row's 16px
  second line, 48px down in a 64px row.
- `progress-fill` → `gray-200` in `src/app/globals.css`, listed in
  `src/app/globals-css.test.ts`, `e2e/color-tokens.spec.ts` and the style
  guide (`ColorSwatches.tsx`). `gray-500` (#8b909a) is in the palette.
- The browser suite runs with `reducedMotion: 'reduce'`
  (`playwright.config.ts`); a test can emulate `no-preference`.

## Decisions

From the human (the request above), superseding S2's and the EPIC's
"12px", "square corners", "gray-200 fill" and "no animation":

- **16px tall**, the 1px border included (14px inside).
- **20px corners** on all four: `rounded-[20px]`, not `rounded-pill`.
  At 16px tall they draw as a pill (the radius is clamped to 8px), like
  the Preview toggle; the value set is 20px, as stated.
- **The fill below 80% is `gray-500`.** From 80% it stays
  `interactive-dark`.
- **The fill animates in from 0** and turns `interactive-dark` once it
  reaches the zone.

Delegated (orchestrating session, refined here):

- **Kept:** the 1px `line-muted` border, the white track, the 80–85%
  orange zone over the fill, the bar's width rules (180px, shrinking to
  at least 80px; S2's breakpoints), the message and percentage boxes and
  every S2 hook.
- **Clipped to the rounded inside.** The fill and the zone are clipped to
  the bar's inside, rounded with the border (the inside's corners about
  7px): the fill's left end, and at 100% its right end, follow the
  curve. Nothing is drawn outside the curve.
- **Layout still holds at 16px.** The bar fills its existing 16px box
  exactly: on one line it stays centered on the 40/48px row; on two
  lines the second line stays 16px, 48px down, and the row 64px. No
  row, line or gap changes (S2-6, 7 and 8, amended to 16px, check it).
- **When it animates.** Each time the progress appears (Preview turned on
  in a daily or Sunday build phase, i.e. each mount), the fill's drawn
  width starts at 0 and grows to the exact share. Every later change of
  the value (typing, deleting, a rebus, Reset Grid) moves the drawn width
  from where it is to the new share the same way; a change during an
  animation continues from the current drawn width.
- **Timing:** 700ms, ease-out (an ease-out cubic, `1 − (1 − t)³`; no
  overshoot, the width moves in one direction). The animation ends
  exactly on the target share (its last frame sets the target itself,
  not an eased approximation), so 180 of 225 ends blue.
- **The color follows the drawn width:** `progress-fill` while the drawn
  width is below 80% of the inside, `progress-fill-ready` once it is at
  or above it, in either direction. A puzzle at 80% or more shows gray
  first and turns blue mid-animation; below 80% it stays gray; Reset
  Grid from 100% turns gray as the fill passes 80% on its way down. A
  share of exactly 80% (180 of 225) turns blue as the animation ends.
  A short color transition at the switch (about 150ms) is allowed.
- **Texts are not animated.** The message, "N% complete" and
  `aria-valuenow` change in the same frame as the value; only the fill's
  width and color move. (So "Ready to create hints!" can show while the
  fill is still gray and growing; the ready state is in the text, as S2
  decided.)
- **Reduced motion** (`prefers-reduced-motion: reduce`): no animation, no
  color transition. The fill shows its final width and color in the
  first frame it's drawn and in the frame the value changes.
- **Recommended approach** (not required; the acceptance checks only the
  drawn frames): a `requestAnimationFrame` loop drives a drawn share
  from its current value to the target, the fill's `width` and color
  derived from that drawn share; the color's `transition-colors`
  turned off with `motion-reduce:`; under reduced motion render the
  target directly, in the same render as the texts (not one effect
  later). **Strict Mode safe:** the effect keyed on the target starts
  from a ref holding the current drawn share and its cleanup cancels
  the pending frame, so a remount or a new target restarts cleanly from
  where the fill is; no one-shot "has animated" flag
  ([LEARNINGS 8](../../../LEARNINGS.md)). The suite runs a production
  build, so the implementer checks the animation once in `npm run dev`
  (Strict Mode) before handoff: it grows in from 0, and Preview off/on
  replays it. A CSS width transition with a computed color delay is harder
  to keep exact at the 80% switch, and needs the 0 width to be painted
  before the target is set. `build-progress-fill` must remain the
  element whose box and background are the drawn fill (a `scaleX`
  transform is fine; its box reflects it).
- **Color style:** `progress-fill` → `gray-500` (was `gray-200`); its
  style-guide swatch follows. No new style or palette color.

## Non-goals

- The tooltip over the bar and tooltip timing (S4). (S4's tooltip is
  portaled to `body`, so the bar's clip doesn't affect it.)
- Anything else S2 left unchanged: the bar's width and breakpoints, the
  message, the percentage, where the progress shows, the 80% rule.
- An animation of the texts, the zone or the track; a celebration at
  80%.

## Acceptance (frozen 2026-11-08)

Viewport 1440px. Grids are daily, seeded with their first N cells
(reading order) lettered. Motion is recorded in the page once per
animation frame (`requestAnimationFrame`, reads only there): the fill's
drawn width and background color, the bar's inside width, the message,
"N% complete" and `aria-valuenow`. Thresholds keep margins around the
80% switch so a color mid-transition never decides a case. The suite
runs reduced; 3–5, 7 and 8 emulate `no-preference`.

### `e2e/build-progress-look.spec.ts` (new)

1. **22-S3-1 below 80%** (0, 90, 179 of 225): the bar 16px tall, a 1px
   solid gray-200 border, white, every corner's radius `20px`; the fill
   from the inside's left edge to lettered ÷ 225 of it (none at 0), 14px
   tall, gray-500; the zone at 80–85%, 14px, orange. Clipped, measured
   on a screenshot of the bar: the pixel one in from each left corner is
   the row or the border, not the fill; four pixels in on the middle
   line it is the fill.
2. **22-S3-2 from 80%** (180, 200, 225): the same look, the fill
   interactive-dark; at 225 all four corners clipped and both ends'
   middle pixels the fill.
3. **22-S3-3 grows in, below 80%** (90 of 225, Preview turned on): the
   first frame's fill at most 10% of its final width; each frame wider or
   equal; a frame between 30% and 70% of it; the final width (within
   1px) reached 300–1200ms after the first frame; gray-500 in every
   frame; "40% complete", `aria-valuenow` 40 and "Keep building." in
   every frame.
4. **22-S3-4 grows in, turning blue** (225 of 225): as 3 to the full
   inside; gray-500 in every frame below 78% of the inside; some frame at
   or past 80% and at least 2px short of the end no longer gray-500 (the
   switch is mid-animation); interactive-dark at the end; the texts
   "100% complete" throughout. Preview off and on again: the same from 0.
5. **22-S3-5 later changes** (225 of 225, settled): Reset Grid: until
   the frame showing "0% complete" the fill is full and blue; from it the
   texts read 0% / "Keep building." in every frame while the fill shrinks
   from full (first frame within 10%) to none, each frame narrower or
   equal, a frame between, done in 300–1200ms; interactive-dark in every
   frame above 82% of the inside; no frame below 60% of it
   interactive-dark; no fill at the end. Then 179 of 225, settled gray:
   typing the 180th letter shows "80% complete" and "Ready to create
   hints!" from its first frame; the fill ends interactive-dark at
   180 ÷ 225.
6. **22-S3-6 reduced motion** (the suite's default): 200 of 225, Preview
   on: every frame the final width (within 0.5px) and interactive-dark.
   Reset Grid: from the frame showing "0% complete", no fill. 179 → the
   180th letter: from the frame showing "80% complete", the fill
   interactive-dark at 180 ÷ 225.
7. **22-S3-7 the switch at 80% of the inside** (200 of 225, 88.9%, grows
   in; 80% of the animation's progress would be 71% of the inside):
   gray-500 in every frame below 78% of the inside, not gray-500 in any
   frame from 84%; interactive-dark at the end; texts 88% throughout.
8. **22-S3-8 a change mid-animation** (225 of 225, Preview on, then once
   the fill passes 10%, a click on 7,7 and Backspace → 224): the change
   arrives with the fill at least 10px short of the new target; the
   first frame showing "99% complete" is no narrower than the frame
   before it (−1px) and at least 2px short of the target (not restarted
   from 0, not jumped to the end); then each frame wider or equal, ending
   on 224 ÷ 225 (0.5px); texts 99% throughout.

Recordings run until 1500ms after the first frame that differs from the
first (the progress appearing, or its percentage or the fill's width
changing), at most 5s.

### Amended acceptance

The human's request authorizes amending S2's frozen acceptance where it
fixed the old look; each file gets a note citing S3:

- `e2e/build-progress.spec.ts` (frozen b4d4741): header comment updated
  (16px bar, 20px corners, gray-500 fill; reduced motion shows the final
  state; an "Amended by Story 22-S3" note); `GRAY_500` added;
  `BAR_HEIGHT` 12 → 16 (so 22-S2-4's bar, fill and zone heights and
  22-S2-6/7/8/9's bar heights expect 16px and 14px); 22-S2-4: no longer
  emulates `no-preference`, its "no transition" assertion removed, the
  `0px` top-left radius → `20px` on all four corners, the fill below 180
  gray-500 (was gray-200). The border stays gray-200.
- `src/app/globals-css.test.ts` and `e2e/color-tokens.spec.ts`:
  `progress-fill` → `gray-500` (was `gray-200`), with a comment citing
  22-S3.

### Discrimination (2026-11-08, observed on `main` at 1a1bc2e)

After the spec review's revisions (7, 8, the recording window, 5's
60% check): `npm run test:e2e -- e2e/build-progress-look.spec.ts`: 8
failed, 1 passed (setup). 22-S3-1 to 6 as below; 22-S3-7 (first frame
158.22 of 178px, not from 0); 22-S3-8 (the fill already full, 178px,
when the change came: no animation to interrupt).

First run, before the revisions: `npm run test:e2e --
e2e/build-progress-look.spec.ts e2e/build-progress.spec.ts
e2e/color-tokens.spec.ts`: 14 failed, 10 passed.

- Fail, new: 22-S3-1 and 2 ("bar height: 12 ≈ 16"); 22-S3-3 (first frame
  71.19 of 178px, not from 0); 22-S3-4 (first frame 178 of 178px);
  22-S3-5 (Reset Grid's first frame 0px, not full: no movement); 22-S3-6
  (its motion steps pass on `main`, which has no animation, then fails on
  the fill's gray-200 at 179).
- Fail, amended: 22-S2-4, 6, 7, 8, 9 (bar height 12 ≈ 16); F1-2 both
  (`--color-progress-fill`), F1-4 styles (the swatch's variable).
- Pass: setup; 22-S2-1, 2, 3, 5 (unaffected by the look); F1-1, F1-4
  variables, F1-5.
- `npx vitest run src/app/globals-css.test.ts`: 1 failed
  (`--color-progress-fill` expected `var(--palette-gray-500)`), 5
  passed.
- **Throwaway check, not kept:** a prototype of the recommended approach
  (rAF, 700ms ease-out cubic, `transition-colors duration-150
  motion-reduce:transition-none`, `h-4 rounded-[20px] overflow-hidden`,
  `progress-fill` → gray-500) made both specs pass (16 of 16), and
  `build-progress-look.spec.ts --repeat-each 4` passed 24 of 24 in
  parallel workers. Its first version set the reduced-motion width one
  effect after the texts; 22-S3-6 caught it (141.59px in the "80%
  complete" frame). After the revisions, the same prototype (ending
  exactly on the target, restarting from a ref of the drawn share):
  `e2e/build-progress-look.spec.ts e2e/build-progress.spec.ts
  --repeat-each 3`: 52 passed, 0 failed. The prototype was reverted
  each time, within the E2E lock.
- `npx eslint` on the four test files and `npx tsc --noEmit` are clean.

## Repo paths

Acceptance: `e2e/build-progress-look.spec.ts` (new); amended
`e2e/build-progress.spec.ts`, `src/app/globals-css.test.ts`,
`e2e/color-tokens.spec.ts`. Runtime: `src/components/grid/BuildProgress.tsx`,
`src/app/globals.css`, `src/components/style-guide/ColorSwatches.tsx`.
Docs: this story, `../EPIC.md` (decisions superseded),
`22-S2-progress-bar.md` (a superseded-by-S3 note), `../HANDOFF.md`.

**CODE-REVIEW:** none of these is a risk path, so direct delivery to
`main`. If the actual diff touches `src/engine/**` or another risk path,
it moves to a branch and PR.

## Definition of done

- Frozen acceptance unchanged after freeze.
- `npm run verify` exits 0 and the full `npm run test:e2e` exits 0.
- Delivered on `main`; the handoff records observed results.
- The human's second visual check (HANDOFF): the 16px pill, the
  gray-500 fill, the animation in and the switch to blue at the zone.
