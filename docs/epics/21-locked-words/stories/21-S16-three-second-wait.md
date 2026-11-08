# Story S16 — Three seconds before the button

The lock button beside an unlocked word waits 3 seconds instead of 1,
whether the cursor, the mouse on a word or the mouse on a tick brought
it.

**Status: approved by the human and frozen (2026-11-07), delegated details included; delivered on `main`, awaiting the human's visual check.** From the
human's review after S12–S13 (EPIC "Changes from the human's review after
S12–S13 (2026-11-07)", item 3). Amends the "second" of S2, S7, S10 and
S13. Depends on them (delivered).

**Blast radius: small, expected off the risk paths.** One constant in
`src/components/grid/PuzzleGridEditor.tsx` and its comments. No
`src/engine/**`, `src/lib/puzzle-storage.ts`, `src/app/puzzles/actions.ts`
or `prisma/**` change (CODE-REVIEW "When review applies"). Direct
delivery to `main`.

## What the code does today

Inspected `PuzzleGridEditor.tsx` (`LOCK_BUTTON_DELAY_MS`, the cursor's
`lockDwell` timer and the hover's `hoverWait` timer) and `PuzzleGrid.tsx`
(`LOCK_TOOLTIP_DELAY_MS`).

- One constant, `LOCK_BUTTON_DELAY_MS = 1000`, times both the cursor's
  wait in an unlocked word (S2, restarted on refocus by S7) and the
  mouse's hover wait (S10), which S13's tick hover shares.
- A locked word's button shows at once for the cursor (S2). S4's tooltip
  has its own second (`LOCK_TOOLTIP_DELAY_MS`).

## Decisions

From the human (2026-11-07, EPIC):

- **3 seconds** (was 1) for the button beside an unlocked word with the
  cursor in it, for the mouse resting on a word, and for the mouse
  resting on a tick (the human chose "all button delays").
- **Unchanged:** a locked word's button shows at once for the cursor; S4's
  tooltip keeps its second.

### Delegated details

Proposed by the drafting agent, approved by the human:

- Everything else timed by the wait moves with it: the outline that
  comes with the button (S2), the refocus restart (S7), and S10's and
  S13's rules ("its second runs on", "starts over"), now three seconds.
- The toggle row's Lock Word (S5) is still enabled at once.

## Non-goals

- A setting for the wait, or a different wait per way of showing it.
- Changing the tooltip's delay, or anything shown at once.

## Acceptance (frozen)

No new spec: the frozen timing cases carry it.

### Amended frozen acceptance (10 specs)

Each amendment is marked "21-S16" in the file. The rule: every wait or
timeout measured from the start of the button's wait is 2000ms longer.
A "not yet" check moves from 500ms to 2500ms, "long enough for any
second" from 1500ms to 3500ms, and waiting for the cursor's button from
2000ms to 4000ms. Checks made after a "not yet" (a further 1500ms), "at
once" checks and the tooltip's timings are unchanged. No other assertion
or case changes.

- `e2e/lock-word.spec.ts` (S2) 21-S2-3, the Preview and hints cases.
- `e2e/lock-refocus.spec.ts` (S7) 21-S7-1, -2.
- `e2e/lock-hover.spec.ts` (S10): a new `BUTTON_NOT_YET_MS` (2500) for
  the button's "not yet"; `NOT_YET_MS` (500) stays for rests and the
  tooltip. `LONG_MS` 3500. 21-S10-2's "second runs on" rests 2800ms
  (was 800ms).
- `e2e/lock-tick-button.spec.ts` (S13): `NOT_YET_MS` 2500, `LONG_MS`
  3500.
- `e2e/lock-tick-hover.spec.ts` (S11), `e2e/word-shape.spec.ts` (S8),
  `e2e/lock-button-side.spec.ts` (S12), `e2e/lock-word-toggle-row.spec.ts`
  (S5), `e2e/grid-size-by-puzzle.spec.ts` (S9) and
  `e2e/reset-with-locks.spec.ts` (S6): their waits for the button, and
  for its absence, by the same rule.
- **Per-test time limit:** `lock-hover`, `lock-tick-hover` and
  `lock-tick-button` allow 60s per test (was the default 30s). With
  three-second waits, their slowest cases take up to 21s alone.

### Discrimination (2026-11-07, observed)

- **Against the scratch S14–S16 implementation** (S14's Discrimination):
  every amended spec passes (in the 201 of 201).
- **The scratch without S16** (S14 and S15 applied, the wait back at 1
  second): 17 of the 10 specs' 144 cases fail, each at a "not yet" after
  2.5 seconds. Among them are 21-S2-3 and 21-S5-2 (the cursor), 21-S7-1
  (the refocus), 9 of S10's cases (the mouse on a word) and 4 of S13's
  (the mouse on a tick).

## Repo paths

Acceptance: the 10 amended specs above.

Runtime: `src/components/grid/PuzzleGridEditor.tsx`,
`LOCK_BUTTON_DELAY_MS` and the comments that say "a second" for it.

Risk: all off the CODE-REVIEW risk paths. Docs: this story, `../EPIC.md`,
`../HANDOFF.md`. Declare any other path before editing it.

## Definition of done

- Approved by the human and frozen in a specification-only commit on
  `main` (with S14 and S15) before any runtime change. Frozen acceptance
  is unchanged after that.
- `npm run verify` exits 0 and the full `npm run test:e2e` exits 0.
- The human's visual check.
- Delivered on `main`; the handoff records observed results.
