# Story P2 — Typing and resuming

Let a signed-in player type and erase guesses in the fixed published grid,
autosave their own entries, and resume them later.

**Status:** complete; implemented, verified and independently reviewed/merged
in [PR #21](https://github.com/akiryk/crossward-raptor/pull/21) at `a67ff61` on
2026-10-19. Reviewed runtime head: `c2c964d`. Specification and 40 unit/27 browser
cases were independently reviewed and frozen on main in `29a63aa`. The
user-approved locator-only correction was independently reviewed and refrozen
in `4e53740`. Acceptance remains immutable from that corrected baseline.

Acceptance correction authorized on 2026-10-19: scope the save-failure alert
role/visibility lookup to `play-puzzle` so Next's unrelated hidden route
announcer does not cause a strict-locator collision. The same role and visible
alert assertion remain; no product behavior changes. This correction was
committed alone on main before continuing runtime verification.
**Blast radius: high:** `src/app/puzzles/actions.ts` adds the play write path.

## Decisions

Inspected on 2026-10-18: the merged P1 story and frozen unit/browser acceptance,
`PlayPuzzle`, `PuzzleGrid`, `GridCell`, play actions, serialization/schema,
editor input/autosave, cursor functions, keyboard intent and slot lookup.
P1 is complete through PR #20. Its acceptance remains immutable.

### Input and cursor

- Input is available only after the mounted start operation succeeds and the
  player selects an active cell. On opening or reopening, the grid starts
  unselected and does not take focus automatically. Keys do nothing until an
  active cell is selected. Failed/pending starts remain read-only, including
  clicks and keyboard input.
- Reuse `place`, `deleteAt`, `arrowKey`, `moveTo`, `toggleOrientation` and
  `keyToIntent`; do not change the engine or builder's behavior.
- A–Z/a–z enter one uppercase letter, replacing any current entry (including
  a persisted multi-character entry). Advance one active cell along the
  current direction, stopping at black cells and edges; do not skip filled
  cells, wrap, or jump to another word.
- Backspace clears a filled current cell without moving. At an empty cell,
  retreat one active cell along the current direction and clear it. At an
  edge or black cell, stay put. Deletion is legal in play even though it is
  prohibited in the builder's locked hints grid.
- Arrow keys first change orientation when perpendicular; otherwise move one
  active cell, stopping at black cells/edges. Space toggles orientation.
  The first active-cell click establishes that cell with Across orientation.
  Clicking a different active cell then selects it without changing direction;
  clicking the current cell toggles direction. Black cells do nothing.
- Match the existing editor's Backspace-only deletion; Delete is ignored.
  Period, digits, punctuation, Enter, paste/rebus input and other unsupported
  keys do nothing. Ctrl/Meta/Alt shortcuts and composition events must not
  enter letters or alter the grid. Tab retains normal browser focus behavior.
- Handle keys inside a focusable play grid region, not on window/document.
  Moving focus to the header or a button stops grid typing and removes its
  selection indication; clicking the grid restores focus.
- Show the current cell with an inset outline and its active word with an
  outline/other non-background indication while focused. Keep active cell
  backgrounds white and black cells black, preserving frozen P1 assertions;
  fixed geometry, numbering and static numbered clues remain unchanged.
  Do not expose answers, correctness colors or construction warnings.
- User decision on 2026-10-18: do not persist or restore the cursor. Opening
  and reopening show no selected cell or active word; the player chooses where
  to begin. Focusing the region alone does not create a cursor. No cursor or
  direction schema fields are added. A stored published grid with no active
  cells remains renderable/ready, with no cursor and no input mutation.

### Saving and resuming

- Debounce changed entries for 500 ms, matching the editor. Opening, cursor
  movement, clicks, blur and ignored keys must not write unchanged entries.
  A burst saves its latest complete entries snapshot, including deletions.
- Serialize a tab's saves so an earlier in-flight write cannot overwrite a
  later edit. An acknowledgement must not replace newer local entries with
  an older snapshot. Distinct tabs use ordinary last-write-wins; no cross-tab
  synchronization, revisions, merging or conflict UI in P2.
- User decision on 2026-10-18: closing immediately after typing must retain
  the last pending edits on the same browser, without a close warning. Write
  the latest entries synchronously to localStorage on every accepted content
  change, before relying on the debounce or a network request. Do not persist
  cursor, answers, clues, credentials or authentication tokens.
- Use `crossward:play-draft:v1:{session.id}` as the local key, storing only the
  serialized entries grid. Read it only after authenticated start succeeds
  and supplies that exact session ID. Other users/sessions/puzzles must never
  receive that draft. Returning on another device restores server-confirmed
  entries; local recovery requires the original browser storage to remain.
- Validate a cached grid's shape and geometry against the start result before
  restoring it. Ignore malformed/incompatible drafts. A draft equal to server
  entries needs no save and may be removed. A different valid draft becomes
  the visible entries, remains unselected, and is queued through the same
  debounced/serialized save path. It takes precedence over that session's
  server snapshot; simultaneous tabs/devices retain ordinary last-write-wins,
  with no new conflict-resolution interface.
- Keep a pending draft until its server write succeeds. Remove it only if it
  still exactly matches the acknowledged snapshot; an older acknowledgement
  cannot erase newer pending edits. Failed saves and unmounts retain it.
  No beforeunload confirmation, navigation block or close-time network
  delivery guarantee is needed. In-app navigation, reload and closing/reopening
  a tab all recover pending letters and deletions from the same browser.
- If localStorage is unavailable or full, keep the screen editable and
  continue server autosaving. Show a visible nonblocking warning that pending
  edits cannot be kept on this device and may be lost before the server saves;
  do not crash or claim local close protection succeeded. This warning is
  distinct from a server failure and is not a close confirmation.
  If writing a newer local snapshot fails, invalidate this tab's known older
  draft when possible, without removing a newer value written by another tab.
  A leftover older draft must not replace the newer server-confirmed entries
  on return when storage remains readable/removable.
- Show unobtrusive saving/saved status; show a visible save failure and Retry
  when a write fails. Preserve current local edits, never claim saved on
  failure, and retry the newest snapshot. Typing may continue after failure.
- Reload/reopen obtains the exact saved entries, including blanks, incorrect
  guesses and existing multi-character entries. Do not normalize or clear
  existing persisted multi-character strings when saving another cell.
- P2 never compares entries to answers or stamps/clears `completedAt`.
  Full correct and incorrect grids remain editable, with no completion
  feedback, celebration or lock. P3 owns all completion semantics.

### Authenticated server write

Add to `src/app/puzzles/actions.ts`:

```ts
savePlayEntries(id: string, entries: SerializedGrid): Promise<void>;
```

- Call `requireSession()` before any puzzle/session access. The authenticated
  user ID is the only player identity. There is no client-supplied user or
  session ID and no builder exception.
- Independently require an existing published puzzle and that user's existing
  play session. Missing/draft puzzles or missing own sessions reject; a save
  never creates a session. Private/unlisted and public puzzles follow P1.
- Validate runtime input before mutation: integer dimensions matching the
  published grid, exact rectangular row/cell counts, identical active/black
  geometry, valid cell kinds, active letters null or nonempty strings. Reject
  malformed input and geometry changes without writing anything. Stored rebus
  strings remain valid; this does not add rebus keyboard input.
- Update only the authenticated pair's `entries`. Preserve row ID, user/puzzle
  identity, `startedAt`, `completedAt`, other users' sessions and other puzzles.
  Never update the answer puzzle, clues or any puzzle timestamp.
- A write must remain scoped to the authenticated pair and published relation
  at mutation time. No promise about editing/republishing geometry races is
  added; the epic explicitly defers that lifecycle.
- Return no answers or correctness data. Database failures propagate to the
  client; never fabricate a successful save or swallow the error.

## Markup contract

Preserve P1's root/title/grid/clue hooks and `data-session-state` lifecycle.
Add `play-grid-region`, focusable and keyboard-scoped, with
`data-ready="true|false"`. Reuse `grid-cell`'s `data-selected` and
`data-highlight="selected|slot"` for actual focused selection/word membership.
Add `play-save-status` with `data-save-state="saved|pending|saving|error"`;
failure uses an accessible alert and a Retry button. Use
`play-local-save-warning` for visible local-storage failure feedback. Detailed wording is not
prescribed. Do not reuse `data-session-state="error"` for a save failure.

## Acceptance examples

Use P1's literal 3×3 fixture (`CAT / A#A / TEN`) and fixed numbers 1 at
(0,0), 2 at (2,0), 3 at (0,2). Expected edits and cursor coordinates must be
literal, not derived by invoking the same cursor implementation under test.

New frozen acceptance covers authenticated pair isolation, publication and
session guards, geometry/payload validation, timestamp/puzzle preservation,
error propagation, typing/overtype/Backspace and all cursor operations,
focus and unsupported input, debouncing/latest-save ordering, failure/retry,
resuming exact saved content and P1 numbering/answer redaction invariants.
Cursor acceptance reflects the user's unselected-on-open decision. The
same-browser pending recovery covers navigation, reload, and tab close;
local drafts remain isolated and acknowledgements cannot delete newer edits.
Full-grid completion neutrality is a P2-only manual checkpoint, not a frozen
assertion prohibiting P3 completion behavior in future stories.

## Repo paths

New acceptance authored and independently reviewed before implementation;
immutable after the specification-only freeze on main:

- `src/app/puzzles/actions.play-entries.test.ts` — server write acceptance.
- `e2e/play-entries.spec.ts` — browser acceptance.

Expected implementation paths:

- `src/app/puzzles/actions.ts` — scoped authenticated entries save.
- `src/lib/play-entries.ts` — shared serialized entries/geometry validation
  for the authenticated server input and browser recovery; no format change.
- `src/components/play/PlayPuzzle.tsx` and focused helpers under
  `src/components/play/**` — cursor, focus, debounced save, session-scoped local
  pending recovery and status.
- `src/components/grid/PuzzleGrid.tsx` — play selection outlines, preserving
  geometry, white backgrounds and existing modes.
- `e2e/helpers/play-route.ts` or `e2e/helpers/play-entries.ts` — editable
  isolated fixture plumbing only if needed; acceptance files stay frozen.
- `e2e/helpers/auth.ts` — editable magic-link fixture request plumbing: send
  the trusted isolated auth Origin on POST, including when signing a different
  user into an already-authenticated browser. An observed full-suite failure
  exposed the missing header. Preserve application auth/CSRF enforcement.
- This story, `../EPIC.md` and `../HANDOFF.md` — decisions/delivery evidence.

Reference `src/engine/cursor.ts`, `src/lib/{keyboard-intent,hint-lookup,
cell-number-lookup,puzzle-storage}.ts` and `src/lib/require-session.ts`.
No engine, serialization, Prisma schema/migration, builder, middleware or
library behavior changes are required. Declare additional paths before edits.

## Scope discipline

Only P2 typing/persistence/resuming. No P3 completion/checking/locks, P4 reset,
P5 library work, timer, rebus input, mobile layout, auth redesign, publication
lifecycle protection or data migration. Do not inspect/edit environment files,
operate on inbox data, migrate development/production, or delete their data.
The user authorizes resets only of the harness-validated isolated local test
DB. Do not begin P3.

## Definition of done

- Resolve substantive product decisions with the user; independently review
  the story and acceptance together, then freeze on main before runtime edits.
- Confirm new tests discriminate missing behavior before implementation;
  preserve all 73 pre-existing acceptance files and the new frozen baseline.
- Separate implementation and verification, with serialized browser suites.
  `npm run verify` and ordinary full `npm run test:e2e` both exit 0.
- Demonstrate ordered pending saves, failure/retry and agreed navigation
  behavior. Visually inspect focused/unfocused play selection and status.
  At this P2 checkpoint, manually demonstrate full correct/incorrect grids
  remain editable without completion feedback or completedAt changes. This
  checkpoint does not freeze a prohibition against P3 completion behavior.
- Update Play handoff with observed evidence; commit, open a PR, and use an
  independent final review/merge under repository rules. No P3 work.
