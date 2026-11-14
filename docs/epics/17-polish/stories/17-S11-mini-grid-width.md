# Story S11 — Smaller, centered mini grids in the editor

Mini grids look too large on desktop. Cap the construction editor's 5×5
grid at 500px and center it within its existing grid column.

**Status: done; delivered on `main` (2026-11-14).** The human
approved the investigated proposal and requested documentation in epic 17,
implementation, commit and push. They subsequently approved proceeding on
an isolated branch while the epic 26 agent is paused. This authorizes the
500px mini cap, horizontal auto margins and corresponding supersession of
the old mini sizing expectations below. Specification/acceptance frozen at
`60d8941`, with independently reviewed
amendments/refreezes at `5f25068` and `58f6ef7`. Implementation and evidence
were delivered on the isolated branch. The human subsequently authorized
integration into `main`; it fast-forwarded unchanged to `4dd1f1a`, preserving
epic 26 work. No PR was required because no risk path changed.

**Blast radius: small.** One editor component; browser acceptance and epic
documentation. No CODE-REVIEW risk path. Use `polish/17-s11-mini-grid` in a
separate worktree to preserve the other agent's uncommitted epic 26 work.
Keep the specification/acceptance baseline separate from runtime changes
on that branch (the human's isolation instruction takes precedence over
the usual baseline on main). Initial delivery was commit/push of the branch;
the later integration task authorizes delivery to `main`.

## Decisions

- A mini is exactly 5 columns by 5 rows. A 5-column rectangle is not a mini.
- In the editor's build and hints phases, including their preview modes,
  only the inner grid region gets `max-width: 500px` and horizontal auto
  margins. It stays fluid below that width.
- Keep the existing outer grid column, title, step/toggle rows, hint lists,
  Hint Box and legend/reset layout. On desktop the grid is centered within
  its 620px column, leaving 60px at each side. Do not move the whole editor
  or change its breakpoints.
- Use the mini's actual 500px full width for the existing lock-button room
  measurement, retaining its 36px left clearance requirement and existing
  toggle-row fallback. At 572px viewport width there is 36px left of the
  centered mini; at 571px there is only 35.5px.
- Midi, daily, Sunday, nonstandard dimensions and the player retain their
  sizing and behavior. The shared `gridMaxPx` helper stays unchanged.
- Reuse the current editor wrappers and Tailwind utilities. No new CSS
  file, shared sizing API or extra wrapper is needed.

## Non-goals

Player sizing; changes to controls, hints, typography rules, engine,
storage, database or collaboration; epic 26 work; reopening S1–S10.
Letters continue to scale with their cells under the existing type rules.

## Acceptance

`e2e/mini-grid-width.spec.ts`:

1. **17-S11-1:** In build and hints phases at 1440px, 1000px, 600px and
   375px viewports, a mini is square, 500px at most, fills the available
   column below 500px, and is horizontally centered within that column.
   Its focus region matches the visible grid. At 1440px the column stays
   620px and the grid has 60px on either side.
2. **17-S11-2:** Build Preview and Preview Hints keep the 500px centered
   mini at desktop width. Hint Preview leaves the grid editable as before.
3. **17-S11-3:** At 1440px, midi and daily grids remain 620px and Sunday
   700px; a non-mini 5×9 grid remains 620px. Their focus regions stay the
   same width as their grids.
4. **17-S11-4:** A mini in the player remains 620px at 1440px.

Existing cases in `e2e/lock-button-side.spec.ts` cover a full mini's button
beside the word at the exact 36px clearance and its toggle-row fallback
just below that clearance. They retain their visibility and spacing
assertions, with the authorized input changes below.

### Previously frozen acceptance superseded

This is an intentional product change, not a defective old test. The
human's request to implement the investigated 500px proposal approves
these narrow changes, reviewed independently before a specification-only
refreeze commit. All other assertions remain frozen.

| File / case | Previous | New |
| --- | --- | --- |
| `e2e/build-grid-design.spec.ts`, 14-S5-3 mini size | 620px | 500px |
| Same file, 14-S5-4 mini letter size | `(619 / 5) × (16 / 35)` | `(499 / 5) × (16 / 35)`; same font rules and tolerance |
| `e2e/larger-grid.spec.ts`, 17-S7-1 mini width and 17-S7-8 mini letter size | 620px grid / pitch | 500px grid / pitch; existing type/clearance assertions retained; 17-S7-6 title updated |
| `e2e/grid-size-by-puzzle.spec.ts`, 21-S9-1/-2 mini grid/toggle/hints relationships and 21-S9-5 mini builder | Grid and toggle both 620px; hints 32px from grid; grid fills column at 636/635px viewport | Editor grid 500px, centered in retained column; toggle stays column width, hints remain 32px from column; player expectations unchanged |
| `e2e/narrow-builder.spec.ts`, 15-S3-1/-2 mini width and title/control alignment; 15-S3-6 legend alignment | 620px grid; grid edges equal column edges | 500px centered grid, 60px inset at these viewports; retain title/controls/legend positions |
| `e2e/wide-layout.spec.ts`, 15-S2-2/-3/-4 builder cases (12 cases) and 15-S2-5 mini Preview/legend cases | 620px grid, Across/skeleton 32px from grid, legend at grid left | 500px grid, Across/skeleton remain 32px from column (92px from grid), legend remains at column left; internal widths/stacking/fill/vertical positions unchanged; explicit daily/player cases unchanged |
| `e2e/hint-box.spec.ts`, 15-S4-1 mini Hint Box alignment | Hint Box equals grid width/left | Retain 620px Hint Box, 60px left of centered 500px grid |
| `e2e/hint-phase-design.spec.ts`, 14-S6-5 mini Across gap | 32px from grid | 92px from grid (60px margin + unchanged 32px column gap) |
| `e2e/hint-preview-alignment.spec.ts`, 18-S7-5 mini Across skeleton label at 1440px/1280px | 38px from grid | 98px from grid (60px margin + unchanged 32px gap + 6px inset); internal alignment assertions unchanged |
| `e2e/lock-button-side.spec.ts`, 21-S12-3 mini beside/row cases | 692px / 691px viewport, 620px grid | 572px / 571px viewport, 500px grid; same clearance and fallback assertions |

## Repo paths

- `src/components/grid/PuzzleGridEditor.tsx`
- `e2e/mini-grid-width.spec.ts`
- `e2e/build-grid-design.spec.ts`
- `e2e/larger-grid.spec.ts`
- `e2e/grid-size-by-puzzle.spec.ts`
- `e2e/narrow-builder.spec.ts`
- `e2e/wide-layout.spec.ts`
- `e2e/hint-box.spec.ts`
- `e2e/hint-phase-design.spec.ts`
- `e2e/hint-preview-alignment.spec.ts`
- `e2e/lock-button-side.spec.ts`
- This story, `../EPIC.md`, `../HANDOFF.md`

## Verification and delivery

- Show the new mini width acceptance fails against the unchanged editor.
- Independently review the specification and frozen-acceptance amendment;
  commit the approved specification/tests separately, then freeze them.
- Implement only the listed runtime scope. Run `npm run verify` and the
  full `npm run test:e2e`, serialized by `/tmp/crossward-e2e.lock` under
  DEVELOPMENT's standing grant for the guarded local test reset.
- Inspect desktop/mobile browser output for centering and lock-button
  placement. Record observed checks and content identity in the handoff.
- Preserve epic 26 work and all acceptance outside the listed amendments;
  initially commit and push only this branch. The later human instruction
  authorizes integration and delivery to `main`. No next story is authorized.

## Discrimination / evidence

Pre-implementation demonstration on the unchanged editor at `961d969`:
`env COMPOSE_PROJECT_NAME=crossward-raptor npm run test:e2e --
e2e/mini-grid-width.spec.ts --workers=2` exited 1: eight expected failures
(desktop/tablet and preview mini grids measured 620px or 584px rather than
500px), nine passes including setup, phone sizing and other-size/player
guards. UI-only; no rule-disabling experiments required.

The independent `mini_spec_review` agent identified additional existing mini
layout acceptance in the files now included above. After reviewing all narrow
amendments and the new tests, it approved refreeze with no remaining blockers.
It verified 60px mini margins, 92px from grid to hints, the 572px/571px lock
thresholds and unchanged player/other-size expectations; it edited nothing
and ran no browser checks.

**Acceptance amendment after baseline `60d8941`:** the first full browser
run exposed the three additional mini offsets in `hint-phase-design` and
`hint-preview-alignment` listed above. Independent `mini_spec_review`
confirmed the 92px/98px measurements and swept remaining fixed geometry
assertions for other mini conflicts. Runtime was parked before this
separate specification-only amendment/refreeze; no product decision or
runtime change was needed. All existing tolerances and internal alignment
assertions remain unchanged.

That exploratory full run was interrupted after the known failures, not
counted as passing: 627 passed, four failed, two interrupted, 780 not run.
The fourth failure was a 3×3 private-publish dialog timing assertion in
`builder-controls.spec.ts`, outside the mini change; its assertions remain
unchanged. A complete passing full run is required before delivery; any
known flakes must be reported under the repository's documented
[LEARNINGS §10](../../../LEARNINGS.md#10-known-browser-suite-flakes-and-what-a-full-run-needs-on-this-machine)
procedure rather than concealed or changing assertions/timeouts.

**Further wide-layout amendment:** the completed four-worker full run at
`5f25068` plus the unchanged editor blob exposed 12 additional width/gap
expectations in 15-S2-2/-3/-4: their helper defaults to a 5×5 fixture.
They now use 500px and 92px as listed above; all internal column and
breakpoint assertions stay frozen. Runtime was parked again before the
separate specification-only refreeze. Independent `mini_spec_review`
approved the exact diff before the identical implementation was restored.

That full run completed with 1,397 passes and 16 failures: the 12 old mini
expectations, a known icon pixel-color flake, two known auth-session
`ECONNRESET`s, and a library navigation timeout. The four unrelated cases
all passed unchanged in a guarded one-worker rerun (six passes including
setup). The library timeout's exact known-flake classification was not
established, so a fresh full run remains required after refreeze.


## Final verification and delivery (2026-11-14)

The independent `mini_spec_review` agent found no runtime review blockers.
The separate `mini_verification` agent verified acceptance baseline
`58f6ef7c9f03fc4072d19178c455c652839fa9a3` plus editor blob
`40847003cb886d897ccd46d9a57e24efe4dd771e`:

- `npm run verify`: exit 0; 113 files / 1,288 tests, two pre-existing lint
  warnings.
- `env COMPOSE_PROJECT_NAME=crossward-raptor npm run test:e2e -- --workers=2 --retries=1`:
  exit 0; 1,411 passed, two flaky (1,413 total), 13.7 minutes. Both flakes
  passed unchanged on their one bounded retry: 18-S5-5 icon corner color
  (delta 3, tolerance 2) and 19-S3-1 magic-link `ECONNRESET`, both listed
  in LEARNINGS §10. No assertions, timeouts or configuration were weakened.
- All 15 new mini cases and 12 amended wide-layout cases passed first
  attempt. The earlier library navigation timeout passed first attempt.
- Frozen browser tests stayed unchanged after `58f6ef7`; runtime stayed
  identical to the independently reviewed blob throughout final checks.

The primary agent inspected desktop and phone screenshots: 500px centered
in the 620px desktop column, and fluid at 359px on the 375px phone.
Local evidence: `/tmp/17-s11-final-verification.md` and
`/tmp/17-s11-mini-{desktop,phone}.png`.

Only the editor component changes at runtime. The implementation commit
contains the tested blob and unchanged frozen acceptance. Initial commit/push
was limited to `polish/17-s11-mini-grid`; the subsequently authorized integration
fast-forwarded `main` to the same commit. Integration reused the separate
verification agent's evidence after confirming the exact editor blob, unchanged
frozen acceptance and absence of any other non-documentation changes since the
tested baseline. No application/browser suite was rerun solely for integration.
The four epic 26 working files retain their pre-integration blob hashes and
remain excluded from S11 commits. Only epic 17 delivery documentation changed
after the fast-forward; see the handoff for preservation and delivery checks.
See [HANDOFF](../HANDOFF.md) for the current delivery/resume state.
