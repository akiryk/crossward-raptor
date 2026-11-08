# Story S4 — One tooltip behavior

Every tooltip in the app shows, moves and hides by one rule kept in one
place: after a 500ms hover, at once when moving straight from one
tooltip's target to another's. The progress bar gets a tooltip saying what
to aim for.

**Status: Approved and frozen 2026-11-08** by the orchestrating session
under the human's delegation, after an independent review of the draft
(no blockers; its six should-fix findings and nits all addressed). The
human's request and that delegation cover the amendments to Epic 20 and
21's frozen tests listed below. Drafted 2026-11-08 under the human's delegation
([handoff](../HANDOFF.md#orchestration)). Builds on S2 (the bar) and
follows S3 (the bar's look); its tests don't depend on the bar's height
or color.

**Blast radius: small, off the risk paths.** `src/components/ui/Tooltip.tsx`
(and possibly a hook beside it), `src/components/grid/PuzzleGrid.tsx`,
`src/components/grid/BuildProgress.tsx`. Direct delivery to `main`.

## The human's request

From the visual check of S2 (2026-11-08), as given:

> 5. Add a tooltip that appears when user hovers over the progress bar.
> The tooltip should appear after a moment. What's typical? The tool tip
> appears over the red and orange cells in the grid right away. This feels
> too quick. We should create a single tooltip component that we can
> control the behavior for in one place so that app is consistent. This
> may require additional work if there are more than one tooltip already.
> For the tooltip above the progress bar, have the text say "Aim to use
> about 80-85% of the cells to make a standard puzzle" (I'm not sure about
> the 80-85 part; correct those numbers is necesssary).

The orchestrator's answers (HANDOFF Decisions 7–8): a 500ms delay for
every tooltip, set in one place, with the usual skip delay; "80–85%" kept,
matching the zone and the NYT's ~16% black squares (~84% white).

## What the code does today

**The tooltip inventory** (searched in `src/`: `role="tooltip"`,
`Tooltip`, `title=` on elements, SVG `<title>`, hover-revealed CSS,
`aria-describedby`, pointer/mouse enter handlers and timers):

| Tooltip | Where | When it shows |
| --- | --- | --- |
| `preview-tooltip` (20-S2, 20-S3) | `PuzzleGrid`, Preview cells marked red (`required`) or gold (`recommended`) | At once on mouse hover; stays over a group's first cell while the mouse crosses the group |
| `lock-tooltip` (21-S4) | `PuzzleGrid`, the lock button beside a word | After 1000ms of mouse hover, from a `setTimeout` in `PuzzleGrid` (`LOCK_TOOLTIP_DELAY_MS`) |

- Both render the one `Tooltip` component (`src/components/ui/Tooltip.tsx`,
  20-S2): a dark bubble in a portal, `role="tooltip"`, 4px above its
  anchor, centered, 8px inside the window, below when there's no room
  above, no pointer events, no transition. It shows whenever its caller
  passes an anchor: the timing is the caller's.
- Nothing else is a tooltip: every `title=` in `src` is a component prop
  (a Modal's or a dialog's heading, a puzzle's title), not the HTML
  attribute; there's no SVG `<title>`, no other `role="tooltip"`, no
  hover-revealed text. The toggle row's Lock Word has deliberately none
  (21-S5, checked by `e2e/lock-word-toggle-row.spec.ts`). The style
  guide has no tooltip sample (14-S8 removed the old `sg-tooltip`).
- So the consolidation covers these two and the new bar tooltip.
- Mouse only: both check `pointerType === 'mouse'`; touch, pen and the
  keyboard show none (20-S2, 21-S4). Neither is referenced by
  `aria-describedby` (20-S2: the legend is the accessible explanation).
- The bar (22-S2) is a `progressbar` named "Grid completion", not
  focusable, with no hover behavior.

## Decisions

From the human and the orchestrator:

- **One behavior, one place.** The shared tooltip module
  (`src/components/ui/Tooltip.tsx`, or a hook or component beside it in
  `src/components/ui/`) owns the show delay, the skip delay, the
  placement and the look. A caller only says what to show over which
  element, and when the mouse is on it; no caller keeps a timer or a
  delay constant of its own (`LOCK_TOOLTIP_DELAY_MS` and the lock
  button's `setTimeout` go).
- **A 500ms hover delay for every tooltip** (was 0 for Preview cells,
  1000ms for the lock button).
- **Skip delay:** while a tooltip is showing, or one was hidden less than
  300ms ago, moving straight onto another target shows its tooltip at
  once.
- **Hidden at once** when the mouse leaves the target.
- **The bar's tooltip:** "Aim to use about 80–85% of the cells to make a
  standard puzzle." on mouse hover over the bar, after the shared delay,
  above it via the shared Tooltip.
- **Existing touch, keyboard and click behaviors stay** as frozen.

### Delegated decisions (drafting agent)

**How a caller asks.** The caller passes the element the mouse is on (or
nothing) and the text; the shared module decides when the bubble
appears. Suggested shape (not frozen): `Tooltip`'s `anchor` becomes the
requested target, and the module's state, shared by every `Tooltip`
instance (module-level, outside React), holds the skip window. Its
constants live there, e.g. `TOOLTIP_DELAY_MS = 500`, `TOOLTIP_SKIP_MS =
300`. A small helper for plain elements (mouse-only enter/leave
handlers) may sit beside it; the bar would use it.

**The rules, in full:**

- **The target** is the element the tooltip points at. For a Preview cell
  it is the group's anchor cell (20-S3): moving within a group keeps the
  same target, so the delay runs on and a shown tooltip neither moves nor
  flickers. The lock button's target is the button for the word it was
  hovered in (21-S4). The bar's is the progressbar element (its track,
  fill and zone), not the message or the percentage.
- **The delay** counts from the mouse entering the target. Moving onto a
  different target before it shows restarts it; leaving before it shows
  cancels it, so a short hover shows nothing, then or later.
- **A target set or changed by the caller without a pointer entry counts
  as entering it:** e.g. a mark appearing or changing under a resting
  mouse (20-S2-5), or the group's anchor cell leaving the group so the
  tooltip moves to the hovered cell (20-S3-5). If a tooltip is showing,
  or one hid less than 300ms ago, that shows at once (the skip delay);
  otherwise it waits the 500ms delay from that moment.
- **While shown,** a change of target (a touching group of the other mark,
  20-S3-3) moves the bubble without hiding it in between, and a change of
  text (a click on the lock button, a mark changing under the mouse)
  updates it in place. Neither waits.
- **Hiding** is at once: the mouse leaving the target, the target going
  (the lock button removed, a cell's mark gone, Preview off), or its text
  going. Any hide of a shown tooltip opens the 300ms skip window.
- **The skip window is app-wide** (one state for every tooltip), as in
  common libraries' "delay groups". In practice the Preview tooltips and
  the lock button never show together (the lock button is Preview-off
  only), and the bar is far from the grid.
- **Why 500ms and 300ms:** common libraries default to about 500–700ms
  before a first tooltip and a few hundred milliseconds of skip window;
  500ms keeps the cell tooltips useful while crossing the grid, and the
  skip delay means the second and later cells don't wait again (HANDOFF
  Decision 7). The values are the module's, so they change in one place.

**The bar's tooltip:**

- **The text** is `Aim to use about 80–85% of the cells to make a standard
  puzzle.`: an en dash for the range, as the EPIC and docs write "80–85%"
  (the app's UI has no other numeric range; it already uses typographic
  apostrophes in places), and a closing period like the Preview
  tooltips' sentences. "80–85%" is the zone the bar draws.
- **Hook:** `data-testid="build-progress-tooltip"`, `role="tooltip"`.
- **Placement and look** are the shared Tooltip's: 4px above the bar,
  centered on it, 8px inside the window (below the bar only without room
  above); `preview-cell-off` with `inverse` `text-label`, at most 280px
  wide (the text wraps to two lines). In the two-line layout (below a
  490px window) it covers the message line above the bar while it shows,
  which is acceptable for a transient bubble that takes no pointer events.
- **Mouse only, no keyboard trigger.** The bar stays out of the Tab order:
  it isn't interactive, and a Tab stop with no action is noise for
  keyboard users. A touch tap shows none, as for every tooltip.
- **Accessibility:** no `aria-describedby` on the bar, as for the cell and
  lock tooltips: the bubble exists only under a mouse, so a reference
  while shown would not reach keyboard or screen-reader users. They have
  the progressbar's name and value and the message ("Keep building." /
  "Ready to create hints!"). A permanent accessible description of the
  80–85% guidance is left out (see open doubts).

**Not changed:** the Tooltip's look and placement rules, the Preview
tooltips' texts and group behavior, the lock tooltip's texts and its
word tie, mouse-only for all, the Lock Word control (still no tooltip).

## Non-goals

- New tooltips other than the bar's, or on the Lock Word control, Rebus,
  Preview or any other control.
- Touch, pen or keyboard tooltips; focus triggers; an arrow, a fade or
  other animation.
- Changing the tooltip's look or placement, or any tooltip's text other
  than adding the bar's.
- A permanent accessible description for the bar.
- Changing the lock button's own 3-second hover wait (21-S16) or any
  other non-tooltip delay.

## EPIC changes for the orchestrator

Add to `EPIC.md`, under **Stories (proposed order)** (after S3, which the
S3 draft adds):

> 4. **S4 One tooltip behavior:** every tooltip's timing in one place (a
>    500ms hover delay, a 300ms skip delay), the Preview cell and lock
>    button tooltips moved onto it, and a tooltip over the bar. Off the
>    risk paths.

Add to **Decisions**, as a new group:

> From the human's visual check of S2 (2026-11-08), with the
> orchestrator's details:
>
> - **One tooltip behavior.** Every tooltip's delay, skip delay,
>   placement and look are set in one shared module
>   (`src/components/ui/`); no other code keeps tooltip timers or
>   delays. Every tooltip shows
>   after 500ms of mouse hover (was at once for Preview's red and gold
>   cells, after 1s for the lock button); while one shows, or within
>   300ms of one hiding, the next shows at once; each hides at once when
>   the mouse leaves. Mouse only, as before. This supersedes Epic 20
>   S2's "no hover delay" and Epic 21 S4's 1-second delay.
> - **The bar's tooltip:** "Aim to use about 80–85% of the cells to make
>   a standard puzzle." on mouse hover over the bar, above it. The bar
>   stays out of the Tab order; no `aria-describedby`.

Replace the Decisions bullet "**Accessibility:** the bar is a
`progressbar` …" only if the orchestrator wants it to mention the
tooltip; otherwise leave it.

Add to **Non-goals:**

> - Tooltips other than the bar's new one; touch, keyboard or focus
>   tooltips; changing the tooltip's look.

## Acceptance (frozen 2026-11-08)

Viewports 1440px wide unless stated; 375px a phone. Timing is measured in
the page with `performance.now()`: an in-page log records each
`pointerover`'s target and each change of the visible tooltip's text, so
a slow test runner can't make a correct delay look wrong. A timer fires
late under load, never early: "the delay" is 450–950ms from entering the
target (950 under the old 1000ms); "at once" is within 150ms; a hide and
the next entry within 250ms are inside the 300ms skip window (asserted as
a precondition). No test pins the skip window at exactly 300ms: the
tests only require it to cover 250ms (22-S4-4, 22-S4-8) and to be over
well before 600ms (`lock-tooltip`'s `COLD_MS`) and 1s (22-S4-5). Playwright's clock (`page.clock`) was considered and not
used: it would also fake the editor's autosave timers and the 21-S16
hover wait, and the in-page measurement needs no fake time. Do not edit
these files to match an implementation.

### `e2e/tooltips.spec.ts` (new)

20-S2's 5×5 grid (two gold groups apart, a red group touching one), 21-S4's
TANGENT daily, and dailies with their first N cells lettered.

1. **22-S4-1 the delay, a red cell:** hovering red 4,4 from off the grid:
   its text 450–950ms after entering, nothing before; over 4,4.
2. **22-S4-2 within a group:** entering red 1,4, then 300ms later 2,4 (same
   group): shown 450–950ms after entering 1,4 and under 400ms after
   entering 2,4 (not restarted), over 1,4.
3. **22-S4-3 skip, while shown:** gold showing over 0,2, the mouse straight
   to red 4,4: the red text within 150ms of entering, never hidden between.
4. **22-S4-4 skip, after a hide:** gold showing over 1,2, one glide over
   black 2,2 to gold 3,2: hidden within 150ms of entering 2,2; 3,2 entered
   within 250ms of the hide; the gold text again within 150ms of entering
   3,2, over 3,2.
5. **22-S4-5 cold again:** after a hide and 1s, hovering 4,4: 450–950ms.
6. **22-S4-6 a short hover:** 150ms on 4,4, then away: no tooltip at any
   moment over the next second.
7. **22-S4-7 the lock button:** hovering it: the unlocked text 450–950ms
   after entering, placed as every tooltip.
8. **22-S4-8 lock, skip:** shown; the button's center measured first,
   then two raw `page.mouse.move`s (no actionability waits): onto
   TANGENT's T (hidden within 150ms, read from the in-page log) and
   straight back onto the button (within 250ms of the hide): shown
   within 150ms.
9. **22-S4-9 the bar (daily, 90 letters, Preview on):** hovering the bar:
   the text 450–950ms after entering; one tooltip, `build-progress-tooltip`,
   role `tooltip`; its bottom 4px above the bar, centered or 8px inside
   the window, not over the bar, at most 280px wide; `preview-cell-off`,
   `inverse`, 14px/20px, centered text, 4px/8px padding, 4px corners, no
   pointer events; the bar still named "Grid completion". The mouse
   leaving: gone within 300ms.
10. **22-S4-10 only the bar, on a phone (375px, 0 letters):** a second
    each over the message and the percentage: no tooltip at any moment;
    over the bar: the text, placed (above, or below without room),
    inside the window, not over the bar; gone on leaving.
11. **22-S4-11 guards (pass today):** (a) the bar has no `tabindex` (its
    `tabIndex` is -1, so not a Tab stop); (b) on a touch screen, a tap on
    the bar, and a tap on red cell 4,4 in Preview, each show none after
    a second.
12. **22-S4-12 still none (pass today):** after a second each, none in
    Preview over letter cell 0,0 or black cell 2,2; none over a
    symmetric-hint cell with Preview off, a gold cell in the hints phase,
    or with the keyboard cursor on a red cell in Preview (the mouse away).

The in-page log counts a tooltip as shown when an element with
`role="tooltip"` passes `checkVisibility({ opacityProperty: true,
visibilityProperty: true })` (any number of them). Entries over the bar
or anything inside it (its fill, its zone, any part S3 adds) are logged
as the bar.

11 and 12 restore guards the delay empties: 20-S2-1's and 20-S2-4's
"other cells show none", 20-S3-4's "over an unmarked cell it goes",
20-S2-7a–d's Preview off, keyboard, touch and hints-phase guards. Those
all check at once, before a delayed tooltip could appear.

### `src/components/ui/tooltip-source.test.ts` (new)

13. **22-S4-13a** only `components/ui/Tooltip.tsx` renders
    `role="tooltip"`. **22-S4-13b** every runtime file outside
    the tooltip modules (`src/components/ui/` files whose name contains
    "tooltip") whose code (comments aside) mentions /tool ?tip/i has no
    `setTimeout`, `setInterval`, `…TOOLTIP…_MS` constant or delay-ish
    prop on `<Tooltip>` (/`<Tooltip\b[^>]*\b\w*[Dd]elay\w*=`/); of them,
    `PuzzleGrid.tsx` and at least one other (the bar's file) import a
    tooltip module. **22-S4-13c** *(pass today)* no `.tsx` gives an HTML
    element a `title` attribute or uses an SVG `<title>`.

### Amended acceptance

The human's request (a delay "after a moment", one behavior everywhere),
with the orchestrator's delegation to approve and freeze this epic's
stories (HANDOFF), covers amending these Epic 20 and Epic 21 frozen
files; the amendment still goes through this story's independent review
and freeze. Each file gets a header note citing 22-S4. Nothing else in
these files changes.

- `e2e/preview-tooltips.spec.ts` (20-S2): 20-S2-3 waits up to 1500ms for
  the tooltip (was `toBeVisible({ timeout: 250 })`, "no delay"); the
  header notes the shared delay and that "at once" now means no
  transition once shown. Its other cases auto-wait and are unchanged.
- `e2e/lock-tooltip.spec.ts` (21-S4): `NOT_YET_MS` 100 (was 500), a 400ms
  margin for a slow runner, which times these waits itself; 21-S4-3's
  short hovers 100ms (were 500 and 600ms, which now reach the delay); a
  new `COLD_MS` 600ms wait after the shown tooltip goes and before the
  short hovers, so the skip window doesn't apply; header note ("a second"
  reads 500ms).
- `e2e/lock-hover.spec.ts` (21-S10-4): the tooltip's "not yet" wait on the
  button is `TOOLTIP_NOT_YET_MS` 100 (was `NOT_YET_MS` 500, the old
  second's margin); the header note says to read 500ms where the file
  says 21-S4's tooltip takes a second, and the stale comment on
  `NOT_YET_MS` ("21-S4's tooltip (still a second)") is corrected. Its
  other `NOT_YET_MS` uses (rests on cells and lines) are unchanged.

Checked and not amended:

- `e2e/preview-tooltip-stays.spec.ts` (20-S3): every check auto-waits; the
  group and no-gap rules are the skip/target rules above.
- The pixel-sampling lock specs, where the mouse rests on the lock button
  and a tooltip can now appear (after 500ms) during a screenshot: the
  bubble sits above the button (its bottom 4px above the button's top,
  which is 1/6 of a cell down), so it covers the row above and at most a
  thin top strip of the button's row. The spots sampled are each cell's
  lower left, 92% down. Unaffected:
  - `e2e/lock-tick-hover.spec.ts` 21-S11-5 ("an across word's button over
    part of the tick wins there"), whose comment calls 300ms "well before
    21-S4's tooltip (a second on the button)";
  - `e2e/lock-tick-button.spec.ts` 21-S13-2 (the button hovered, about
    line 401, then 300ms and checks) and 21-S13-4 (the button comes up
    under the resting mouse; samples after 300ms waits).
- `e2e/lock-word-toggle-row.spec.ts`: Lock Word still has no tooltip after
  3.5s. `e2e/style-guide.spec.ts`, `e2e/old-tokens.spec.ts`: mention only
  the removed `sg-tooltip` sample.

### Discrimination (2026-11-08, observed on `main` at 1a1bc2e, runtime as at 35dfea9)

`npm run test:e2e -- e2e/tooltips.spec.ts e2e/preview-tooltips.spec.ts
e2e/preview-tooltip-stays.spec.ts e2e/lock-tooltip.spec.ts
e2e/lock-hover.spec.ts`: 8 failed, 46 passed (runtime as on `main`; only
test files differed).

- Fail, as intended: 22-S4-1 (shown after 2ms), 22-S4-2 (2ms), 22-S4-5
  (7ms), 22-S4-6 (a tooltip appeared during a 150ms hover), 22-S4-7
  (1005ms, over 950), 22-S4-8 (1005ms back on the button, not at once),
  22-S4-9 and 22-S4-10 (no `build-progress-tooltip`; 22-S4-10's message
  and percentage part passes first).
- Pass on `main`, as intended: 22-S4-3 and 22-S4-4 (the Preview tooltip
  already moves at once and comes back at once; they guard the skip delay
  and the group rule once the delay exists, and 22-S4-4's 250ms
  precondition held), 22-S4-11a/b and 22-S4-12 (guards).
- The amended cases pass on `main` (they relax timing): all of
  `preview-tooltips`, `lock-tooltip` and `lock-hover`, and the unamended
  `preview-tooltip-stays`.
- `npx vitest run src/components/ui/tooltip-source.test.ts`: 22-S4-13b
  fails (`PuzzleGrid.tsx` has a `setTimeout`); 13a and 13c pass.
- Throwaway check, not kept: the same 22-S4-7 and 22-S4-8 with the upper
  bounds relaxed to 1100ms pass on `main`, so the in-page log, the
  preconditions and the placement helper work; on the 22-S2 page the bar
  is at y = 242px (1440px) and 216px (375px), room enough above for the
  two-line bubble. The bar tooltip's look and placement checks are not
  yet exercised against an implementation.
- `npx eslint` on the four test files and the source test, and
  `npx tsc --noEmit`, are clean.

After the independent review (same day), re-run on `main` at 1a1bc2e;
the build included S3's in-progress runtime (`BuildProgress.tsx`,
`globals.css`, `ColorSwatches.tsx`, the bar's look only):
`npm run test:e2e -- e2e/tooltips.spec.ts e2e/lock-tooltip.spec.ts
e2e/lock-hover.spec.ts`: 8 failed, 31 passed.

- The same 8 fail for the same reasons (22-S4-1 2ms, 22-S4-2 2ms, 22-S4-5
  4ms, 22-S4-6, 22-S4-7 1008ms, 22-S4-8 1007ms back on the button with
  its 250ms precondition met using the raw moves, 22-S4-9 and 22-S4-10
  no bar tooltip).
- The extended guards 22-S4-11b (bar and red-cell taps) and 22-S4-12
  (letter, black, Preview off, hints, keyboard) pass; 22-S4-3 and
  22-S4-4 pass with the new recorder.
- `lock-tooltip` (100ms "not yet") and `lock-hover` (100ms
  `TOOLTIP_NOT_YET_MS`) pass in full.
- `npx vitest run src/components/ui/tooltip-source.test.ts` with the new
  13b: 13b fails (`PuzzleGrid.tsx`: `setTimeout`), 13a and 13c pass.
  ESLint on the changed files and `npx tsc --noEmit` clean.

## Repo paths

Acceptance: `e2e/tooltips.spec.ts`, `src/components/ui/tooltip-source.test.ts`
(new); amended `e2e/preview-tooltips.spec.ts`, `e2e/lock-tooltip.spec.ts`,
`e2e/lock-hover.spec.ts`. Runtime: `src/components/ui/Tooltip.tsx` (and a
hook beside it if wanted), `src/components/grid/PuzzleGrid.tsx`,
`src/components/grid/BuildProgress.tsx`. Docs: this story, `../EPIC.md`,
`../HANDOFF.md`.

**CODE-REVIEW:** none of these is a risk path, so direct delivery to
`main`. If the actual diff touches `src/engine/**` or another risk path,
it moves to a branch and PR.

## Open doubts

- **Touch users** never get the bar's guidance (no tooltip for touch,
  as for every tooltip).
- **No Escape to dismiss** (WCAG 1.4.13, content on hover): no tooltip in
  the app can be dismissed without moving the mouse. It takes no pointer
  events and hides on leave; adding Escape would be a separate change.
- **On narrow windows** the bar's bubble, centered over the bar and held
  8px inside the window, may cover the Preview toggle's label on line 1
  while it shows.
- **22-S4-13b** bans every timer in a file that mentions tooltips, so a
  later non-tooltip timer in `PuzzleGrid.tsx` or the bar's file would
  have to live elsewhere (S3's fill animation uses
  `requestAnimationFrame`, not a timer).

- **Accessibility of the guidance:** screen-reader users never get the
  "80–85%" sentence. A permanent description (visually hidden text
  referenced by `aria-describedby`) would fix that but is beyond the
  request; a candidate for a later story.
- **An app-wide skip window** is a choice; per-tooltip windows would
  behave the same in today's app, since no two tooltips are reachable in
  one move.
- **22-S4-4 and 22-S4-8** use real mouse moves; under heavy load their
  precondition (the 250ms hide-to-entry) can fail and is reported as
  such, rather than letting a slow run pass or fail the rule itself.

## Definition of done

- Frozen acceptance unchanged after freeze.
- `npm run verify` exits 0 and the full `npm run test:e2e` exits 0.
- Delivered on `main`; the handoff records observed results.
- The human's second visual check (HANDOFF), including the tooltips'
  timing and the bar's tooltip.
